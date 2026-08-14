"""답변 영상 저장 시 암호화 — 「개인정보의 안전성 확보조치 기준」 제7조.

왜 암호화하는가:
고시 제7조 제2항은 이용자의 **생체인식정보**를 암호화하여 저장하도록 요구한다.
답변 영상에는 얼굴과 음성이 담기므로 이를 생체인식정보로 볼 여지가 있고, 반대로
본 서비스의 처리 목적이 '식별'이 아니라 '코칭'이므로 해당하지 않는다고 볼 여지도
있다. **다투어질 수 있는 영역이므로 유리한 해석에 기대지 않고 암호화한다.**

방식 — 청크 단위 AES-256-GCM:
GCM은 인증 태그가 전체 메시지에 대해 계산되므로, 파일 전체를 메모리에 올리지 않으면
스트리밍 복호화가 불가능하다. 영상이 최대 200MB이므로 전체를 메모리에 올릴 수 없다.
그래서 **고정 크기 청크마다 독립적으로 암호화**하고, 각 청크를
`nonce(12B) || ciphertext || tag(16B)` 형태로 이어 붙인다. 복호화는 청크 단위로
읽어 순차 검증하므로 메모리 사용량이 일정하다.

청크마다 nonce를 새로 생성하므로 nonce 재사용(GCM의 치명적 실패 모드)이 없다.

⚠️ 한계를 분명히 해 둔다:
1. 키가 같은 서버의 환경변수에 있으므로, **서버 자체가 침해되면 함께 노출된다.**
   이 암호화가 방어하는 것은 주로 디스크·백업 매체의 유출, 그리고 저장 매체
   반출이다. 서버 침해에 대한 방어는 접근통제·접속기록이 담당한다.
2. 분석(MediaPipe·ffmpeg)은 파일 경로를 요구하므로 **분석 중에는 평문 임시 파일이
   존재**한다. 이 창을 줄이기 위해 분석 종료 즉시 덮어쓰기 삭제한다
   (secure_delete 사용).
3. 고시 제7조 제6항의 '암호 키 관리 절차 수립' 의무는 10만명 이상 대기업·공공 또는
   100만명 이상 중소기업에만 적용되어 현재는 대상이 아니다. 규모가 커지면
   키 교체·보관 절차를 별도로 수립해야 한다.
"""
import base64
import os
import secrets
from pathlib import Path
from typing import Iterator

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# AES-GCM 권장 nonce 길이(96비트)와 태그 길이(128비트)
_NONCE_LEN = 12
_TAG_LEN = 16
# 평문 청크 크기. 크면 오버헤드가 줄고 작으면 메모리를 덜 쓴다.
_CHUNK = 1024 * 1024  # 1MB
# 파일 선두에 두어 형식·버전을 식별한다.
_MAGIC = b"SCV1"


class VideoCryptoError(RuntimeError):
    pass


def _load_key() -> bytes:
    """VIDEO_ENCRYPTION_KEY(base64 인코딩된 32바이트)를 읽는다."""
    raw = os.getenv("VIDEO_ENCRYPTION_KEY", "").strip()
    if not raw:
        raise VideoCryptoError(
            "VIDEO_ENCRYPTION_KEY 환경변수가 없습니다. 답변 영상은 암호화하여 "
            "저장해야 합니다(안전성 확보조치 기준 제7조).\n"
            "생성: python -c \"import base64,os; "
            'print(base64.b64encode(os.urandom(32)).decode())"'
        )
    try:
        key = base64.b64decode(raw, validate=True)
    except Exception as e:
        raise VideoCryptoError(
            "VIDEO_ENCRYPTION_KEY가 올바른 base64가 아닙니다."
        ) from e
    if len(key) != 32:
        raise VideoCryptoError(
            f"VIDEO_ENCRYPTION_KEY는 32바이트(AES-256)여야 합니다. 현재 {len(key)}바이트."
        )
    return key


def generate_key() -> str:
    """새 키를 base64로 생성한다 (운영자용 헬퍼)."""
    return base64.b64encode(secrets.token_bytes(32)).decode()


def is_enabled() -> bool:
    """키가 설정되어 있는지. 설정 검증용."""
    return bool(os.getenv("VIDEO_ENCRYPTION_KEY", "").strip())


def encrypt_stream(chunks: Iterator[bytes], dest: Path) -> int:
    """평문 청크 이터레이터를 암호화해 dest에 쓴다. 평문 총 바이트를 반환."""
    aes = AESGCM(_load_key())
    written = 0
    buffer = bytearray()

    with open(dest, "wb") as out:
        out.write(_MAGIC)
        for chunk in chunks:
            buffer.extend(chunk)
            # 청크 경계를 고정해야 복호화 시 같은 크기로 읽을 수 있다.
            while len(buffer) >= _CHUNK:
                block = bytes(buffer[:_CHUNK])
                del buffer[:_CHUNK]
                nonce = secrets.token_bytes(_NONCE_LEN)
                out.write(nonce)
                out.write(aes.encrypt(nonce, block, None))
                written += len(block)
        if buffer:
            block = bytes(buffer)
            nonce = secrets.token_bytes(_NONCE_LEN)
            out.write(nonce)
            out.write(aes.encrypt(nonce, block, None))
            written += len(block)
    return written


def decrypt_iter(src: Path) -> Iterator[bytes]:
    """암호문 파일을 청크 단위로 복호화해 평문을 흘려보낸다."""
    aes = AESGCM(_load_key())
    with open(src, "rb") as f:
        if f.read(len(_MAGIC)) != _MAGIC:
            raise VideoCryptoError(f"암호화 형식이 아닙니다: {src.name}")
        # 각 레코드 = nonce + ciphertext(최대 _CHUNK) + tag
        record_len = _NONCE_LEN + _CHUNK + _TAG_LEN
        while True:
            record = f.read(record_len)
            if not record:
                break
            if len(record) <= _NONCE_LEN + _TAG_LEN:
                raise VideoCryptoError("암호문이 손상되었습니다(레코드가 too short).")
            nonce, body = record[:_NONCE_LEN], record[_NONCE_LEN:]
            try:
                yield aes.decrypt(nonce, body, None)
            except InvalidTag as e:
                # 인증 실패 = 위변조 또는 잘못된 키
                raise VideoCryptoError(
                    "영상 복호화에 실패했습니다(무결성 검증 실패)."
                ) from e


def decrypt_to_file(src: Path, dest: Path) -> None:
    """분석용으로 평문 임시 파일을 만든다.

    ⚠️ 호출자는 사용 후 반드시 secure_delete_file(dest)로 지워야 한다.
    """
    with open(dest, "wb") as out:
        for block in decrypt_iter(src):
            out.write(block)

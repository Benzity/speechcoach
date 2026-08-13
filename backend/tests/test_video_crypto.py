"""답변 영상 저장 암호화 — 안전성 확보조치 기준 제7조."""
import os
from pathlib import Path

import pytest

from app.services.video_crypto import (
    VideoCryptoError,
    decrypt_iter,
    decrypt_to_file,
    encrypt_stream,
    generate_key,
    is_enabled,
)


def _chunks(data: bytes, size: int = 64 * 1024):
    for i in range(0, len(data), size):
        yield data[i : i + size]


def test_key_is_configured():
    assert is_enabled(), "영상 암호화 키가 설정되어 있어야 한다"


def test_generated_key_is_32_bytes_base64():
    import base64

    key = generate_key()
    assert len(base64.b64decode(key)) == 32  # AES-256


def test_roundtrip_small_file(tmp_path: Path):
    plain = b"FACE-AND-VOICE-VIDEO-DATA" * 100
    enc = tmp_path / "0.webm"

    written = encrypt_stream(_chunks(plain), enc)
    assert written == len(plain)

    restored = b"".join(decrypt_iter(enc))
    assert restored == plain


def test_roundtrip_spans_multiple_chunks(tmp_path: Path):
    """1MB 청크 경계를 넘는 파일도 정확히 복원되어야 한다."""
    plain = os.urandom(3 * 1024 * 1024 + 12345)  # 3MB + 나머지
    enc = tmp_path / "big.webm"

    encrypt_stream(_chunks(plain, 256 * 1024), enc)
    restored = b"".join(decrypt_iter(enc))
    assert restored == plain


def test_ciphertext_does_not_contain_plaintext(tmp_path: Path):
    """저장된 파일에서 원본 바이트가 그대로 보이면 안 된다."""
    marker = b"IDENTIFIABLE-FACE-FRAME-MARKER"
    plain = marker * 500
    enc = tmp_path / "0.webm"

    encrypt_stream(_chunks(plain), enc)
    stored = enc.read_bytes()

    assert marker not in stored
    assert stored.startswith(b"SCV1")  # 형식 식별자
    # 암호문은 nonce·tag 오버헤드만큼 커진다
    assert len(stored) > len(plain)


def test_tampered_ciphertext_is_rejected(tmp_path: Path):
    """무결성 검증 — 한 바이트만 바꿔도 복호화가 실패해야 한다."""
    plain = b"video" * 1000
    enc = tmp_path / "0.webm"
    encrypt_stream(_chunks(plain), enc)

    data = bytearray(enc.read_bytes())
    data[-1] ^= 0xFF  # 마지막 바이트 훼손
    enc.write_bytes(bytes(data))

    with pytest.raises(VideoCryptoError):
        list(decrypt_iter(enc))


def test_wrong_format_is_rejected(tmp_path: Path):
    f = tmp_path / "plain.webm"
    f.write_bytes(b"not encrypted at all")
    with pytest.raises(VideoCryptoError):
        list(decrypt_iter(f))


def test_decrypt_to_file_matches_original(tmp_path: Path):
    """분석 파이프라인이 쓰는 경로."""
    plain = os.urandom(1024 * 1024 + 999)
    enc = tmp_path / "0.webm"
    out = tmp_path / "plain.webm"

    encrypt_stream(_chunks(plain), enc)
    decrypt_to_file(enc, out)
    assert out.read_bytes() == plain


def test_missing_key_raises_clear_error(tmp_path: Path, monkeypatch):
    monkeypatch.delenv("VIDEO_ENCRYPTION_KEY", raising=False)
    with pytest.raises(VideoCryptoError) as exc:
        encrypt_stream(_chunks(b"x"), tmp_path / "x.webm")
    assert "VIDEO_ENCRYPTION_KEY" in str(exc.value)


def test_short_key_is_rejected(tmp_path: Path, monkeypatch):
    import base64

    monkeypatch.setenv("VIDEO_ENCRYPTION_KEY", base64.b64encode(b"tooshort").decode())
    with pytest.raises(VideoCryptoError) as exc:
        encrypt_stream(_chunks(b"x"), tmp_path / "x.webm")
    assert "32바이트" in str(exc.value)

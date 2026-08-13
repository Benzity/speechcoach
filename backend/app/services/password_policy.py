"""비밀번호 정책 — OWASP ASVS 5.0 V6.2 / NIST SP 800-63B-4 기준.

핵심 원칙 (이전 정책에서 바뀐 점):
- 복잡도 규칙(대소문자·숫자·특수문자 혼합 강제)을 **두지 않는다**.
  ASVS 6.2.5: "passwords of any composition can be used, without rules limiting
  the type of characters permitted." 복잡도 강제는 예측 가능한 치환 패턴만
  만들고 엔트로피를 유의미하게 높이지 못한다.
- 길이가 1차 방어선이다. ASVS 6.2.1(L1) 최소 8자, 15자 이상 강력 권장.
- 긴 패스프레이즈를 막지 않는다. ASVS 6.2.9(L2) 최소 64자까지 허용.
- 흔한/유출된 비밀번호를 차단한다. ASVS 6.2.4(L1).

법적 근거: 「개인정보의 안전성 확보조치 기준」 제5조는 "비밀번호 작성규칙을
수립하여 적용"할 의무를 부과하되 구체적 수치는 정하지 않는다. 아래 수치는
위 표준에서 가져온 것이다.
"""
from pathlib import Path

# ASVS 6.2.1(L1). 15자 이상이 강력 권장이나, 일반 소비자 서비스의 이탈률을
# 고려해 8자를 하한으로 두고 UI에서 더 긴 비밀번호를 권장한다.
MIN_LENGTH = 8
# ASVS 6.2.9(L2) — 최소 64자는 허용해야 패스프레이즈를 막지 않는다.
# bcrypt가 72바이트에서 잘리므로 그 이상은 보안상 의미가 없어 상한을 72로 둔다.
MAX_LENGTH = 72

_BLOCKLIST_PATH = Path(__file__).resolve().parent / "data" / "common_passwords.txt"

_blocklist: set[str] | None = None


class PasswordPolicyError(ValueError):
    """사용자에게 그대로 노출 가능한 한국어 메시지를 담는다."""


def _load_blocklist() -> set[str]:
    """흔한 비밀번호 목록을 지연 로드한다 (소문자 정규화)."""
    global _blocklist
    if _blocklist is None:
        try:
            raw = _BLOCKLIST_PATH.read_text(encoding="utf-8")
        except OSError:
            # 목록 파일이 없어도 길이 검증은 계속 동작해야 한다.
            _blocklist = set()
        else:
            _blocklist = {
                line.strip().lower()
                for line in raw.splitlines()
                if line.strip() and not line.startswith("#")
            }
    return _blocklist


def validate_password(password: str) -> None:
    """정책 위반 시 PasswordPolicyError를 던진다. 통과하면 None."""
    if len(password) < MIN_LENGTH:
        raise PasswordPolicyError(
            f"비밀번호는 {MIN_LENGTH}자 이상이어야 합니다."
        )
    if len(password) > MAX_LENGTH:
        raise PasswordPolicyError(
            f"비밀번호는 {MAX_LENGTH}자 이하여야 합니다."
        )
    if password.lower() in _load_blocklist():
        raise PasswordPolicyError(
            "너무 흔하게 쓰이는 비밀번호입니다. 다른 비밀번호를 사용해주세요."
        )

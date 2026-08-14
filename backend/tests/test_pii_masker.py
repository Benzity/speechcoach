"""이력서 PII 마스킹 — LLM 전송 전 최소수집 처리 (제16조)."""
from app.services.pii_masker import mask_pii, mask_report


def test_masks_resident_registration_number():
    text = "주민등록번호: 901231-1234567 입니다"
    out = mask_pii(text)
    assert "901231" not in out
    assert "1234567" not in out
    assert "[주민등록번호]" in out


def test_masks_mobile_phone_variants():
    for raw in ["010-1234-5678", "01012345678", "010.1234.5678", "+82-10-1234-5678"]:
        out = mask_pii(f"연락처 {raw} 입니다")
        assert "1234" not in out or "[전화번호]" in out, f"미마스킹: {raw}"
        assert "[전화번호]" in out


def test_masks_email():
    out = mask_pii("이메일 hong.gildong@example.co.kr 로 연락주세요")
    assert "hong.gildong" not in out
    assert "[이메일]" in out


def test_masks_address():
    out = mask_pii("주소: 서울특별시 강남구 테헤란로 123 4층")
    assert "테헤란로 123" not in out
    assert "[주소]" in out


def test_masks_birth_date():
    for raw in ["1995.03.15", "1995-03-15", "1995년 3월 15일"]:
        out = mask_pii(f"생년월일 {raw}")
        assert "[생년월일]" in out, f"미마스킹: {raw}"


def test_preserves_career_content():
    """경력·기술 내용은 남아야 질문 생성 품질이 유지된다."""
    text = (
        "백엔드 개발자로 3년간 근무하며 Python, FastAPI, PostgreSQL을 사용했습니다. "
        "대용량 트래픽 처리를 위해 Redis 캐싱을 도입해 응답 속도를 40% 개선했습니다."
    )
    out = mask_pii(text)
    assert out == text, "경력 내용이 훼손되면 안 됨"


def test_report_counts_findings():
    text = "010-1234-5678 / test@example.com / 901231-1234567"
    report = mask_report(text)
    assert report.get("[전화번호]") == 1
    assert report.get("[이메일]") == 1
    assert report.get("[주민등록번호]") == 1


def test_empty_input_is_safe():
    assert mask_pii("") == ""
    assert mask_report("") == {}

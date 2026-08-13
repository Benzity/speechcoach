"""개인정보 유출 대응 지원 — 개인정보 보호법 제34조 (개정법 2026.9.11 시행).

⚠️ 개정 사항 (2026.2.12 국회 통과, 2026.9.11 시행):
    유출이 **확인되기 전이라도 '유출 가능성'을 인지한 단계**에서 72시간 이내에
    정보주체에게 통지해야 한다. 종전에는 유출 사실을 안 때부터였다.
    미신고 시 3천만원 이하 과태료(법 제75조).

통지 시 반드시 포함해야 하는 사항 (제34조 제1항):
    1. 유출된 개인정보의 항목
    2. 유출된 시점과 그 경위
    3. 피해를 최소화하기 위해 정보주체가 할 수 있는 방법 등에 관한 정보
    4. 개인정보처리자의 대응조치 및 피해 구제절차
    5. 신고 접수 담당부서 및 연락처

신고(보호위원회 또는 KISA, 72시간 이내) 대상:
    - 1천명 이상의 정보주체에 관한 개인정보가 유출된 경우
    - 민감정보 또는 고유식별정보가 유출된 경우
    - 외부로부터의 불법적인 접근에 의한 유출인 경우

이 스크립트는 **통지 대상 산출과 문안 생성**을 돕는다. 실제 통지 발송과 신고는
사람이 판단하고 수행해야 한다.

사용법:
    python scripts/breach_response.py --scope all --items "이메일,이력서,답변영상"
    python scripts/breach_response.py --scope session --session-id <id> --items "답변영상"
"""
import argparse
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE))

KST = timezone(timedelta(hours=9))

# 신고 의무 기준 (시행령 제40조)
REPORT_THRESHOLD_SUBJECTS = 1000
NOTIFY_DEADLINE_HOURS = 72


def _affected_users(scope: str, session_id: str | None) -> list[tuple[str, str]]:
    """영향받은 정보주체의 (id, email) 목록."""
    from app.db.database import SessionLocal
    from app.db.models import Session as SessionModel
    from app.db.models import User

    db = SessionLocal()
    try:
        if scope == "all":
            rows = db.query(User.id, User.email).all()
        elif scope == "session":
            if not session_id:
                raise SystemExit("--session-id 가 필요합니다.")
            rows = (
                db.query(User.id, User.email)
                .join(SessionModel, SessionModel.user_id == User.id)
                .filter(SessionModel.id == session_id)
                .distinct()
                .all()
            )
        else:
            raise SystemExit(f"알 수 없는 scope: {scope}")
        return [(r[0], r[1]) for r in rows]
    finally:
        db.close()


def _notice_text(items: str, detected_at: datetime, cause: str) -> str:
    """제34조 제1항의 5개 필수 항목을 담은 통지문 초안."""
    return f"""[SpeechCoach] 개인정보 유출 관련 안내

안녕하세요. SpeechCoach를 이용해 주시는 회원님께 개인정보 유출(가능성)에 관하여
아래와 같이 알려드립니다.

1. 유출된 개인정보의 항목
   {items}

2. 유출된 시점과 그 경위
   - 인지 시점: {detected_at:%Y년 %m월 %d일 %H:%M} (KST)
   - 경위: {cause}

3. 피해를 최소화하기 위해 회원님께서 하실 수 있는 조치
   - 다른 사이트에서 동일한 비밀번호를 사용 중이라면 즉시 변경해 주십시오.
   - 출처가 불분명한 메일·문자의 링크를 열지 마십시오.
   - 계정에서 낯선 활동이 확인되면 아래 연락처로 알려주십시오.

4. 당사의 대응조치 및 피해 구제절차
   - [TODO: 실제 취한 조치를 구체적으로 기재 — 예: 해당 접근 경로 차단,
     전 계정 토큰 무효화, 관련 데이터 파기, 로그 보존 및 원인 조사]
   - 피해가 확인되는 경우 관련 법령에 따라 구제 절차를 안내해 드립니다.

5. 신고 접수 담당부서 및 연락처
   - 개인정보 보호책임자: [TODO: 성명]
   - 연락처: [TODO: 이메일 / 전화]

또한 아래 기관에도 신고·상담하실 수 있습니다.
   - 개인정보침해신고센터 privacy.kisa.or.kr / 국번없이 118
   - 개인정보보호위원회 privacy.go.kr

불편을 드려 진심으로 사과드립니다.
SpeechCoach 드림
"""


def main() -> int:
    parser = argparse.ArgumentParser(description="개인정보 유출 대응 지원 (제34조)")
    parser.add_argument(
        "--scope", choices=["all", "session"], required=True, help="영향 범위"
    )
    parser.add_argument("--session-id", help="scope=session일 때 대상 세션 ID")
    parser.add_argument(
        "--items", required=True, help="유출된 항목 (예: '이메일,이력서,답변영상')"
    )
    parser.add_argument("--cause", default="[TODO: 유출 경위 기재]", help="유출 경위")
    parser.add_argument("--save", action="store_true", help="통지문·대상목록 저장")
    args = parser.parse_args()

    now = datetime.now(KST)
    deadline = now + timedelta(hours=NOTIFY_DEADLINE_HOURS)
    users = _affected_users(args.scope, args.session_id)

    print("=" * 68)
    print("개인정보 유출 대응 — 통지 준비")
    print("근거: 개인정보 보호법 제34조 (개정법 2026.9.11 시행)")
    print("=" * 68)
    print(f"인지 시각     : {now:%Y-%m-%d %H:%M:%S} (KST)")
    print(f"통지 기한     : {deadline:%Y-%m-%d %H:%M:%S} (72시간 이내)")
    print(f"영향 정보주체 : {len(users):,}명")
    print(f"유출 항목     : {args.items}")
    print()

    print("─ 신고 의무 판단 " + "─" * 50)
    must_report = len(users) >= REPORT_THRESHOLD_SUBJECTS
    if must_report:
        print(f"  [신고 필요] 정보주체 {len(users):,}명 ≥ {REPORT_THRESHOLD_SUBJECTS:,}명")
    else:
        print(f"  규모 기준 미달 ({len(users):,}명 < {REPORT_THRESHOLD_SUBJECTS:,}명)")
    print("  ※ 규모와 무관하게 아래에 해당하면 신고 대상입니다:")
    print("     - 민감정보 또는 고유식별정보가 유출된 경우")
    print("     - 외부로부터의 불법적인 접근에 의한 유출인 경우")
    print("  ※ 정보주체 통지는 규모와 무관하게 항상 의무입니다.")
    print("  신고처: 개인정보보호위원회 / KISA (privacy.go.kr)")
    print()

    print("─ 통지문 초안 " + "─" * 53)
    notice = _notice_text(args.items, now, args.cause)
    print(notice)

    if args.save:
        out_dir = BASE / "logs" / "incidents"
        out_dir.mkdir(parents=True, exist_ok=True)
        stamp = f"{now:%Y%m%d-%H%M%S}"
        (out_dir / f"notice-{stamp}.txt").write_text(notice, encoding="utf-8")
        (out_dir / f"recipients-{stamp}.csv").write_text(
            "user_id,email\n" + "\n".join(f"{u},{e}" for u, e in users),
            encoding="utf-8",
        )
        print(f"저장 완료: {out_dir}")
        print("※ [TODO] 항목을 채운 뒤 발송하고, 발송 기록을 함께 보관하십시오.")

    print()
    print("!" * 68)
    print("이 스크립트는 통지를 '발송하지 않습니다'. 문안 확정과 발송, 신고는")
    print("사람이 판단해 수행해야 합니다. 72시간 기한을 반드시 확인하십시오.")
    print("!" * 68)
    return 0


if __name__ == "__main__":
    sys.exit(main())

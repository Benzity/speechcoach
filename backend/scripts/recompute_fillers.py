"""기존 Analysis 레코드의 verbal_metrics_json["fillers"]만 재계산.

filler_detector.py 로직 변경(어절 단위 정확 매칭) 이후 과거 세션의 카운트가
오탐 상태로 남아 있어 이를 일회성으로 정정한다.

사용:
    .venv/bin/python scripts/recompute_fillers.py [--dry-run]
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.database import SessionLocal  # noqa: E402
from app.db.models import Analysis  # noqa: E402
from app.services.filler_detector import count_fillers  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="DB 쓰기 없이 변경 예정만 출력")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        analyses = (
            db.query(Analysis)
            .filter(Analysis.asr_transcript.isnot(None))
            .all()
        )
        changed = 0
        for a in analyses:
            transcript = a.asr_transcript or ""
            if not transcript.strip():
                continue
            new_fillers = count_fillers(transcript)
            verbal = json.loads(a.verbal_metrics_json) if a.verbal_metrics_json else {}
            old_fillers = verbal.get("fillers", {})
            if old_fillers == new_fillers:
                continue
            verbal["fillers"] = new_fillers
            if not args.dry_run:
                a.verbal_metrics_json = json.dumps(verbal, ensure_ascii=False)
            changed += 1
            print(f"  Q{a.question_id[:8]}: {old_fillers} → {new_fillers}")
        if not args.dry_run:
            db.commit()
        action = "예정" if args.dry_run else "완료"
        print(f"\n{changed}개 Analysis 업데이트 {action} (전체 {len(analyses)}개 중)")
    finally:
        db.close()


if __name__ == "__main__":
    main()

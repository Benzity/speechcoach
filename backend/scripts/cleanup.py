"""시연 직전/직후 데이터 정리 — data/videos/* + SQLite DB 삭제."""
import argparse
import shutil
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent  # backend/
VIDEOS = BASE / "data" / "videos"
DB = BASE / "data" / "app.db"


def main() -> int:
    parser = argparse.ArgumentParser(description="시연 데이터 정리")
    parser.add_argument("--yes", action="store_true", help="확인 프롬프트 건너뛰기")
    args = parser.parse_args()

    targets = []
    if VIDEOS.exists():
        for d in VIDEOS.iterdir():
            if d.is_dir():
                targets.append(d)
    for suffix in ("", "-shm", "-wal"):
        f = DB.with_name(DB.name + suffix)
        if f.exists():
            targets.append(f)

    if not targets:
        print("삭제할 데이터가 없습니다.")
        return 0

    print("다음 항목을 삭제합니다:")
    for t in targets:
        print(f"  - {t}")

    if not args.yes:
        ans = input("계속하시겠습니까? (y/N): ")
        if ans.strip().lower() != "y":
            print("취소됨.")
            return 1

    for t in targets:
        if t.is_dir():
            shutil.rmtree(t)
        else:
            t.unlink()
        print(f"삭제: {t}")

    print("정리 완료.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

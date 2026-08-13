"""접속기록 월 1회 점검 — 「개인정보의 안전성 확보조치 기준」 제8조.

고시는 "개인정보의 오·남용, 분실·도난·유출·위조·변조 또는 훼손 등에 대응하기 위하여
개인정보처리시스템의 접속기록 등을 **월 1회 이상 점검**"하도록 요구한다.

점검은 기록을 눈으로 훑는 것만으로는 부족하고, **이상 징후를 찾는 행위**여야 한다.
이 스크립트는 오·남용 탐지에 통상 쓰이는 지표를 집계한다:

- 대량 조회: 특정 계정이 비정상적으로 많은 개인정보에 접근
- 비정상 시간대 접근: 심야 시간대 활동
- 인증 실패 반복: 계정 탈취 시도
- 다중 IP 접속: 계정 공유 또는 탈취 정황
- 대량 삭제: 데이터 파괴 시도
- **다운로드**: 고시 제8조 제2항은 "개인정보의 다운로드가 확인된 경우에는
  내부 관리계획 등으로 정하는 바에 따라 그 **사유를 반드시 확인**"하도록
  요구한다. 본 서비스에서 영상 스트리밍(GET .../video)이 다운로드에 해당한다.

점검 결과는 파일로 남겨 '점검을 수행했다'는 사실 자체를 증빙한다.

사용법:
    python scripts/review_access_log.py              # 최근 30일
    python scripts/review_access_log.py --days 90
    python scripts/review_access_log.py --save       # 점검 결과 저장
"""
import argparse
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
LOG_DIR = BASE / "logs"
REVIEW_DIR = LOG_DIR / "reviews"

# access_log.py의 포맷과 맞춰야 한다:
#   2026-08-13 04:05:06,789<TAB>user_id<TAB>ip<TAB>METHOD /path<TAB>status
_LINE = re.compile(
    r"^(?P<ts>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}),\d+\t"
    r"(?P<user>[^\t]*)\t(?P<ip>[^\t]*)\t(?P<action>[^\t]*)\t(?P<status>\d+)$"
)

# 이 시간대(현지 기준) 접근은 검토 대상으로 표시한다.
NIGHT_START, NIGHT_END = 0, 6
# 한 계정이 기간 내 이 횟수를 넘게 개인정보에 접근하면 대량 조회로 본다.
BULK_ACCESS_THRESHOLD = 500
# 한 계정이 이 수 이상의 서로 다른 IP에서 접속하면 공유·탈취 정황으로 본다.
MULTI_IP_THRESHOLD = 5
# 개인정보 다운로드로 보는 요청. 답변 영상 스트리밍이 여기 해당한다.
_DOWNLOAD_ACTION = re.compile(r"^GET .*/answers/\d+/video$")
# 한 계정이 기간 내 이 횟수를 넘게 다운로드하면 사유 확인 대상으로 본다.
DOWNLOAD_REVIEW_THRESHOLD = 30


def _iter_log_lines(days: int):
    """보관 중인 접속기록 파일을 모두 읽어 기간 내 항목만 돌려준다."""
    cutoff = datetime.now() - timedelta(days=days)
    # access.log + 로테이션된 access.log.2026-08-12 형태 전부
    for path in sorted(LOG_DIR.glob("access.log*")):
        try:
            with open(path, encoding="utf-8", errors="replace") as f:
                for line in f:
                    m = _LINE.match(line.rstrip("\n"))
                    if not m:
                        continue
                    ts = datetime.strptime(m.group("ts"), "%Y-%m-%d %H:%M:%S")
                    if ts < cutoff:
                        continue
                    yield ts, m.group("user"), m.group("ip"), m.group("action"), int(
                        m.group("status")
                    )
        except OSError as e:
            print(f"  ! 읽기 실패 {path.name}: {e}", file=sys.stderr)


def review(days: int) -> tuple[str, bool]:
    """점검 보고서 텍스트와 '이상 징후 발견 여부'를 돌려준다."""
    total = 0
    per_user = Counter()
    per_user_ips = defaultdict(set)
    night = []
    failures = Counter()
    deletions = []
    downloads = []
    per_user_downloads = Counter()
    first_ts = last_ts = None

    for ts, user, ip, action, status in _iter_log_lines(days):
        total += 1
        first_ts = first_ts or ts
        last_ts = ts

        if user != "-":
            per_user[user] += 1
            per_user_ips[user].add(ip)
        if NIGHT_START <= ts.hour < NIGHT_END:
            night.append((ts, user, action))
        if status in (401, 403):
            failures[ip] += 1
        if action.startswith("DELETE") and status < 400:
            deletions.append((ts, user, action))
        # 영상 스트리밍 = 개인정보 다운로드 (고시 제8조 제2항)
        if _DOWNLOAD_ACTION.search(action) and status < 400:
            downloads.append((ts, user, action))
            per_user_downloads[user] += 1

    lines: list[str] = []
    findings = False

    def add(s: str = "") -> None:
        lines.append(s)

    add("=" * 68)
    add("개인정보처리시스템 접속기록 점검 보고서")
    add("근거: 「개인정보의 안전성 확보조치 기준」 제8조 (월 1회 이상 점검)")
    add("=" * 68)
    add(f"점검 일시   : {datetime.now():%Y-%m-%d %H:%M:%S}")
    add(f"점검 대상   : 최근 {days}일")
    add(f"기록 범위   : {first_ts or '-'} ~ {last_ts or '-'}")
    add(f"총 접속건수 : {total:,}건")
    add(f"활동 계정   : {len(per_user)}개")
    add()

    if total == 0:
        add("※ 기간 내 접속기록이 없습니다. 서비스 미가동 또는 로그 설정을 확인하세요.")
        return "\n".join(lines), False

    add("─" ' 1. 대량 조회 점검 ' + "─" * 44)
    bulk = [(u, c) for u, c in per_user.most_common() if c >= BULK_ACCESS_THRESHOLD]
    if bulk:
        findings = True
        for u, c in bulk:
            add(f"  [검토필요] {u}: {c:,}건 (기준 {BULK_ACCESS_THRESHOLD:,}건)")
    else:
        add(f"  이상 없음 (최다 계정 {per_user.most_common(1)[0][1]:,}건)")
    add()

    add("─" ' 2. 다중 IP 접속 점검 ' + "─" * 41)
    multi = [(u, ips) for u, ips in per_user_ips.items() if len(ips) >= MULTI_IP_THRESHOLD]
    if multi:
        findings = True
        for u, ips in multi:
            add(f"  [검토필요] {u}: {len(ips)}개 IP — 계정 공유·탈취 정황 확인 필요")
    else:
        add("  이상 없음")
    add()

    add("─" ' 3. 인증 실패 반복 점검 ' + "─" * 39)
    top_fail = [(ip, c) for ip, c in failures.most_common(5) if c >= 20]
    if top_fail:
        findings = True
        for ip, c in top_fail:
            add(f"  [검토필요] {ip}: 인증 실패·거부 {c}건")
    else:
        add(f"  이상 없음 (전체 실패 {sum(failures.values())}건)")
    add()

    add("─" ' 4. 심야 시간대 접근 ' + "─" * 42)
    if night:
        add(f"  {len(night)}건 ({NIGHT_START:02d}시~{NIGHT_END:02d}시)")
        for ts, user, action in night[:10]:
            add(f"    {ts:%m-%d %H:%M} {user} {action}")
        if len(night) > 10:
            add(f"    ... 외 {len(night) - 10}건")
        add("  ※ 정상 이용일 수 있으므로 계정별 활동과 대조해 판단하세요.")
    else:
        add("  없음")
    add()

    add("─" ' 5. 개인정보 다운로드 점검 ' + "─" * 36)
    if downloads:
        add(f"  총 {len(downloads)}건 (영상 스트리밍)")
        heavy = [
            (u, c)
            for u, c in per_user_downloads.most_common()
            if c >= DOWNLOAD_REVIEW_THRESHOLD
        ]
        if heavy:
            findings = True
            for u, c in heavy:
                add(f"  [사유확인필요] {u}: {c}건 (기준 {DOWNLOAD_REVIEW_THRESHOLD}건)")
        add("  ※ 고시 제8조 제2항 — 다운로드가 확인된 경우 그 사유를 반드시")
        add("     확인하고 확인 결과를 기록으로 남겨야 합니다.")
    else:
        add("  없음")
    add()

    add("─" ' 6. 삭제 작업 점검 ' + "─" * 44)
    if deletions:
        add(f"  {len(deletions)}건")
        for ts, user, action in deletions[:10]:
            add(f"    {ts:%m-%d %H:%M} {user} {action}")
        if len(deletions) > 10:
            add(f"    ... 외 {len(deletions) - 10}건")
        add("  ※ 정상적인 탈퇴·세션삭제 요청인지 확인하세요.")
    else:
        add("  없음")
    add()

    add("=" * 68)
    add("종합 판정: " + ("검토가 필요한 항목이 있습니다." if findings else "이상 징후 없음"))
    add("=" * 68)
    return "\n".join(lines), findings


def main() -> int:
    parser = argparse.ArgumentParser(description="접속기록 월간 점검 (고시 제8조)")
    parser.add_argument("--days", type=int, default=30, help="점검 대상 기간 (기본 30일)")
    parser.add_argument("--save", action="store_true", help="점검 결과를 파일로 저장")
    args = parser.parse_args()

    report, findings = review(args.days)
    print(report)

    if args.save:
        REVIEW_DIR.mkdir(parents=True, exist_ok=True)
        out = REVIEW_DIR / f"access-review-{datetime.now():%Y%m%d}.txt"
        out.write_text(report, encoding="utf-8")
        print(f"\n점검 결과 저장: {out}")
        print("※ 점검 수행 사실의 증빙이 되므로 보관하십시오.")

    # 이상 징후가 있으면 종료코드 1 — 크론에서 알림 트리거로 쓸 수 있다.
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())

"""복원 불가능한 파기 — 개인정보 보호법 시행령 제16조.

시행령 제16조 제1항 제1호는 전자적 파일 형태의 개인정보를 파기할 때
**"복원이 불가능한 방법으로 영구 삭제"**하도록 요구하며, 안내서는 그 방법으로
전용 소자장비, **덮어쓰기(overwrite)**, 매체 파괴를 제시한다.

또한 "복원이 불가능한 방법"이란 **사회통념상 현재의 기술수준에서 적절한 비용이
소요되는 방법**을 뜻한다(안내서). 따라서 논리적 덮어쓰기로 충분하며, 물리적
매체 파괴까지는 요구되지 않는다.

⚠️ 한계를 명시해 둔다: SSD의 웨어 레벨링·TRIM 때문에 애플리케이션 레벨의
덮어쓰기가 물리 셀까지 도달한다는 보장은 없다. 다만 위 '적절한 비용' 기준에
비추어 논리적 덮어쓰기 + 파일시스템 삭제가 통상 인정되는 수준이다. 더 높은
수준이 필요하면 저장 볼륨 자체를 암호화하고 키를 파기하는 방식(crypto-shredding)을
검토해야 한다.
"""
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

# 한 번에 읽고 쓰는 블록 크기
_CHUNK = 1024 * 1024


def secure_delete_file(path: Path, passes: int = 1) -> bool:
    """파일 내용을 덮어쓴 뒤 삭제한다.

    passes: 덮어쓰기 횟수. 현대 저장매체에서는 1회로 충분하다는 것이
    NIST SP 800-88(Media Sanitization)의 입장이며, 다회 덮어쓰기는
    자기 디스크 시대의 관행이다.
    """
    try:
        if not path.is_file():
            return False
        size = path.stat().st_size
        with open(path, "r+b", buffering=0) as f:
            for _ in range(max(1, passes)):
                f.seek(0)
                remaining = size
                while remaining > 0:
                    block = min(_CHUNK, remaining)
                    f.write(b"\x00" * block)
                    remaining -= block
                f.flush()
                os.fsync(f.fileno())
        path.unlink()
        return True
    except OSError:
        logger.exception("복원 불가 삭제 실패, 일반 삭제로 대체: %s", path)
        # 덮어쓰기에 실패해도 파일 자체는 반드시 지운다.
        try:
            path.unlink(missing_ok=True)
        except OSError:
            logger.exception("파일 삭제도 실패: %s", path)
            return False
        return False


def secure_delete_tree(directory: Path) -> int:
    """디렉터리 내 모든 파일을 덮어쓰기 삭제한 뒤 디렉터리를 제거한다."""
    if not directory.exists():
        return 0

    removed = 0
    for child in sorted(directory.rglob("*"), key=lambda p: len(p.parts), reverse=True):
        if child.is_file():
            if secure_delete_file(child):
                removed += 1
        elif child.is_dir():
            try:
                child.rmdir()
            except OSError:
                pass
    try:
        directory.rmdir()
    except OSError:
        # 남은 파일이 있으면 마지막 수단으로 통째로 제거한다.
        import shutil

        shutil.rmtree(directory, ignore_errors=True)
    return removed


def vacuum_database() -> None:
    """SQLite 파일을 재구성해 삭제된 레코드가 남긴 빈 페이지를 회수한다.

    `PRAGMA secure_delete=ON`(database.py에서 설정)이 삭제된 내용을 0으로
    덮어쓰지만, VACUUM까지 해야 파일이 실제로 축소되고 잔여 페이지가 사라진다.
    """
    from sqlalchemy import text

    from app.db.database import engine

    try:
        # VACUUM은 트랜잭션 안에서 실행할 수 없어 AUTOCOMMIT이 필요하다.
        with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
            conn.execute(text("VACUUM"))
        logger.info("DB VACUUM 완료 — 삭제 레코드의 잔여 페이지 회수")
    except Exception:
        logger.exception("VACUUM 실패")

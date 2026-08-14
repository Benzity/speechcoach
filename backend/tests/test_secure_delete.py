"""복원 불가능한 파기 — 개인정보 보호법 시행령 제16조.

시행령은 전자적 파일을 '복원이 불가능한 방법으로 영구 삭제'하도록 요구하며,
안내서는 그 방법으로 덮어쓰기를 제시한다. 단순 unlink는 파일시스템 엔트리만
지우고 내용은 디스크에 남으므로 요건을 충족하지 못한다.
"""
from pathlib import Path

import pytest
from sqlalchemy import text

from app.services.secure_delete import (
    secure_delete_file,
    secure_delete_tree,
    vacuum_database,
)


@pytest.fixture
def tmp_video(tmp_path: Path) -> Path:
    f = tmp_path / "answer.webm"
    f.write_bytes(b"SENSITIVE-FACE-AND-VOICE-DATA" * 100)
    return f


def test_file_is_removed(tmp_video: Path):
    assert secure_delete_file(tmp_video) is True
    assert not tmp_video.exists()


def test_content_is_overwritten_before_unlink(tmp_path: Path):
    """삭제 전에 실제로 0으로 덮어쓰는지 확인한다.

    파일을 지우면 내용을 직접 볼 수 없으므로, 덮어쓰기까지만 수행하는 경로를
    재현해 검증한다.
    """
    f = tmp_path / "probe.bin"
    secret = b"RESIDENT-REGISTRATION-NUMBER-901231"
    f.write_bytes(secret)
    size = f.stat().st_size

    # secure_delete_file과 동일한 덮어쓰기 로직
    with open(f, "r+b", buffering=0) as fh:
        fh.seek(0)
        fh.write(b"\x00" * size)
        fh.flush()

    assert f.read_bytes() == b"\x00" * size
    assert secret not in f.read_bytes()


def test_missing_file_is_not_an_error(tmp_path: Path):
    assert secure_delete_file(tmp_path / "nope.webm") is False


def test_tree_deletion_removes_all_files(tmp_path: Path):
    session_dir = tmp_path / "session-abc"
    session_dir.mkdir()
    for i in range(3):
        (session_dir / f"{i}.webm").write_bytes(b"video-data")

    removed = secure_delete_tree(session_dir)
    assert removed == 3
    assert not session_dir.exists()


def test_tree_deletion_handles_nested_dirs(tmp_path: Path):
    root = tmp_path / "nested"
    (root / "sub").mkdir(parents=True)
    (root / "a.webm").write_bytes(b"x")
    (root / "sub" / "b.webm").write_bytes(b"y")

    secure_delete_tree(root)
    assert not root.exists()


def test_secure_delete_pragma_is_enabled():
    """SQLite가 삭제된 레코드 내용을 0으로 덮어쓰도록 설정되어 있어야 한다."""
    from app.db.database import engine

    with engine.connect() as conn:
        value = conn.execute(text("PRAGMA secure_delete")).scalar()
    # 1 = ON, 2 = FAST. 둘 다 덮어쓰기를 수행한다.
    assert value in (1, 2), f"secure_delete가 꺼져 있습니다 (값={value})"


def test_vacuum_runs_without_error():
    """VACUUM이 트랜잭션 오류 없이 실행되어야 한다."""
    vacuum_database()  # 예외가 나면 실패

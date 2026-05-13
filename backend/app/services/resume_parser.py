"""PDF 이력서 텍스트 추출 (FR-1.4 / FR-1.5)."""
import logging
from io import BytesIO

import pdfplumber

logger = logging.getLogger(__name__)


class ResumeParseError(Exception):
    """사용자에게 그대로 노출 가능한 한국어 메시지를 담는다."""


def extract_text_from_pdf(content: bytes) -> str:
    """업로드된 PDF 바이트에서 텍스트를 추출. 실패 시 ResumeParseError."""
    try:
        with pdfplumber.open(BytesIO(content)) as pdf:
            pages = [p.extract_text() or "" for p in pdf.pages]
    except Exception as e:
        logger.exception("PDF 파싱 실패")
        raise ResumeParseError(
            "PDF 파일을 읽을 수 없습니다. 텍스트 직접 입력으로 시도해주세요."
        ) from e

    text = "\n".join(pages).strip()
    if not text:
        raise ResumeParseError(
            "PDF에서 텍스트를 추출하지 못했습니다(스캔본일 가능성). "
            "텍스트 직접 입력으로 시도해주세요."
        )
    return text

"""Resume upload and parsing service."""

import io
from typing import Literal

from app.infra.session_store import session_store
from app.schemas import ResumeUploadResponse


class ResumeService:
    """Handles resume file processing: save, parse, store text."""

    def process_resume(
        self,
        session_id: str,
        file_name: str,
        file_type: Literal["pdf", "docx", "txt"],
        content: bytes,
    ) -> ResumeUploadResponse:
        """Process uploaded resume file."""
        # Save original file
        session_store.save_original_file(session_id, file_name, content)

        # Parse text based on type
        if file_type == "pdf":
            text = self._parse_pdf(content)
        elif file_type == "docx":
            text = self._parse_docx(content)
        else:
            text = self._parse_txt(content)

        if not text.strip():
            raise ValueError("Could not extract text from file. Please try another format.")

        # Save parsed text
        session_store.save_resume_text(session_id, text)

        # Update session
        session_store.update_session(
            session_id=session_id,
            has_resume=True,
            file_name=file_name,
            file_type=file_type,
        )

        return ResumeUploadResponse(
            session_id=session_id,
            file_name=file_name,
            file_type=file_type,
            text_chars=len(text),
        )

    def _parse_pdf(self, content: bytes) -> str:
        """Extract text from PDF."""
        try:
            from pypdf import PdfReader

            reader = PdfReader(io.BytesIO(content))
            texts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    texts.append(page_text)
            return "\n\n".join(texts)
        except Exception as e:
            raise ValueError(f"Failed to parse PDF: {str(e)}")

    def _parse_docx(self, content: bytes) -> str:
        """Extract text from DOCX."""
        try:
            from docx import Document

            doc = Document(io.BytesIO(content))
            texts = []
            for para in doc.paragraphs:
                if para.text.strip():
                    texts.append(para.text)
            return "\n\n".join(texts)
        except Exception as e:
            raise ValueError(f"Failed to parse DOCX: {str(e)}")

    def _parse_txt(self, content: bytes) -> str:
        """Parse plain text file."""
        # Try common encodings
        for encoding in ["utf-8", "gbk", "gb2312", "latin-1"]:
            try:
                return content.decode(encoding)
            except UnicodeDecodeError:
                continue
        raise ValueError("Failed to decode text file. Please ensure it's UTF-8 encoded.")


# Singleton instance
resume_service = ResumeService()


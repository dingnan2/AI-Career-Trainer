"""API route definitions."""

import logging
from fastapi import APIRouter, File, Header, HTTPException, UploadFile
from typing import Optional

from app.schemas import (
    HealthResponse,
    JdGapRequest,
    JdGapResult,
    ResumeUploadResponse,
    SessionResponse,
)
from app.services.jd_gap_service import jd_gap_service
from app.services.resume_service import resume_service
from app.infra.session_store import session_store

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================
# Health
# ============================================

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse()


# ============================================
# Sessions
# ============================================

@router.post("/sessions", response_model=SessionResponse)
async def create_session():
    """Create a new anonymous session."""
    session = session_store.create_session()
    logger.info(f"Created session: {session.session_id}")
    return SessionResponse(
        session_id=session.session_id,
        expires_at=session.expires_at,
        has_resume=session.has_resume,
    )


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    """Get session status."""
    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    return SessionResponse(
        session_id=session.session_id,
        expires_at=session.expires_at,
        has_resume=session.has_resume,
    )


# ============================================
# Resume Upload
# ============================================

@router.post("/sessions/{session_id}/resume", response_model=ResumeUploadResponse)
async def upload_resume(session_id: str, file: UploadFile = File(...)):
    """Upload and parse a resume file."""
    logger.info(f"Upload request for session: {session_id}, file: {file.filename}")
    session = session_store.get_session(session_id)
    if not session:
        logger.warning(f"Session not found: {session_id}")
        raise HTTPException(status_code=404, detail="Session not found or expired")

    # Validate file type
    allowed_types = {
        "application/pdf": "pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        "text/plain": "txt",
    }

    content_type = file.content_type or ""
    if content_type not in allowed_types:
        # Try to infer from filename
        filename = file.filename or ""
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext not in ("pdf", "docx", "txt"):
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported file type. Allowed: PDF, DOCX, TXT",
            )
        file_type = ext
    else:
        file_type = allowed_types[content_type]

    # Read file content
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=413, detail="File too large. Max 10MB.")

    # Parse and save
    try:
        result = resume_service.process_resume(
            session_id=session_id,
            file_name=file.filename or "resume",
            file_type=file_type,
            content=content,
        )
        logger.info(f"Resume processed: {result.file_name}, {result.text_chars} chars")
    except ValueError as e:
        logger.error(f"Resume processing failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    return result


# ============================================
# JD Gap Analysis
# ============================================

@router.post("/analyze/jd-gap", response_model=JdGapResult)
async def analyze_jd_gap(
    request: JdGapRequest,
    x_openai_key: Optional[str] = Header(None, alias="X-OpenAI-Key"),
):
    """Analyze gap between resume and JD."""
    session = session_store.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    if not session.has_resume:
        raise HTTPException(status_code=400, detail="Please upload a resume first")

    # Load resume text
    resume_text = session_store.load_resume_text(request.session_id)
    if not resume_text:
        raise HTTPException(status_code=400, detail="Resume text not found")

    # Run analysis with user-provided or env API key
    try:
        result = await jd_gap_service.analyze(
            resume_text=resume_text,
            jd_text=request.jd_text,
            target_role=request.target_role,
            api_key=x_openai_key,
        )
    except ValueError as e:
        # API key missing or invalid
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    return result


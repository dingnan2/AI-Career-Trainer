"""Pydantic schemas for API request/response models."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


# ============================================
# Session
# ============================================

class SessionResponse(BaseModel):
    """Response for session creation/retrieval."""

    session_id: str
    expires_at: datetime
    has_resume: bool = False


# ============================================
# Resume Upload
# ============================================

class ResumeUploadResponse(BaseModel):
    """Response after uploading a resume."""

    session_id: str
    file_name: str
    file_type: str
    text_chars: int


# ============================================
# JD Gap Analysis
# ============================================

class JdGapRequest(BaseModel):
    """Request for JD gap analysis."""

    session_id: str
    jd_text: str = Field(..., min_length=50, max_length=50000)
    target_role: Optional[str] = None


class Strength(BaseModel):
    """A matching strength between resume and JD."""

    point: str
    evidence: str


class Gap(BaseModel):
    """A gap between resume and JD requirements."""

    point: str
    priority: Literal["high", "medium", "low"]
    suggestion: str


class Keyword(BaseModel):
    """A keyword from JD with matching analysis."""

    jd_keyword: str
    evidence: Optional[str] = None
    recommended_phrase: str


class JdGapResult(BaseModel):
    """Result of JD gap analysis."""

    match_score: int = Field(..., ge=0, le=100)
    summary: str
    strengths: list[Strength]
    gaps: list[Gap]
    keywords: list[Keyword]
    craft_questions: list[str]


# ============================================
# Health
# ============================================

class HealthResponse(BaseModel):
    """Health check response."""

    status: str = "ok"
    version: str = "1.0.0"


"""Session storage with filesystem-based temporary storage and TTL cleanup."""

import json
import shutil
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

from app.core.config import settings


@dataclass
class Session:
    """Session data model."""

    session_id: str
    created_at: datetime
    expires_at: datetime
    has_resume: bool = False
    file_name: Optional[str] = None
    file_type: Optional[str] = None


class SessionStore:
    """Manages anonymous sessions with filesystem storage."""

    def __init__(self, sessions_dir: Optional[Path] = None, ttl_hours: Optional[int] = None):
        self.sessions_dir = sessions_dir or settings.sessions_dir
        self.ttl_hours = ttl_hours or settings.session_ttl_hours
        self.sessions_dir.mkdir(parents=True, exist_ok=True)

    def _session_path(self, session_id: str) -> Path:
        return self.sessions_dir / session_id

    def _meta_path(self, session_id: str) -> Path:
        return self._session_path(session_id) / "meta.json"

    def _resume_text_path(self, session_id: str) -> Path:
        return self._session_path(session_id) / "resume.txt"

    def _load_meta(self, session_id: str) -> Optional[dict]:
        meta_path = self._meta_path(session_id)
        if not meta_path.exists():
            return None
        try:
            with open(meta_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return None

    def _save_meta(self, session_id: str, meta: dict) -> None:
        session_path = self._session_path(session_id)
        session_path.mkdir(parents=True, exist_ok=True)
        with open(self._meta_path(session_id), "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2, default=str)

    def create_session(self) -> Session:
        """Create a new anonymous session."""
        # Cleanup expired sessions first (lightweight)
        self.cleanup_expired()

        session_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(hours=self.ttl_hours)

        meta = {
            "session_id": session_id,
            "created_at": now.isoformat(),
            "expires_at": expires_at.isoformat(),
            "has_resume": False,
        }
        self._save_meta(session_id, meta)

        return Session(
            session_id=session_id,
            created_at=now,
            expires_at=expires_at,
            has_resume=False,
        )

    def get_session(self, session_id: str) -> Optional[Session]:
        """Get session by ID, returns None if not found or expired."""
        meta = self._load_meta(session_id)
        if not meta:
            return None

        expires_at = datetime.fromisoformat(meta["expires_at"])
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if datetime.now(timezone.utc) > expires_at:
            self._delete_session(session_id)
            return None

        return Session(
            session_id=meta["session_id"],
            created_at=datetime.fromisoformat(meta["created_at"]),
            expires_at=expires_at,
            has_resume=meta.get("has_resume", False),
            file_name=meta.get("file_name"),
            file_type=meta.get("file_type"),
        )

    def update_session(
        self,
        session_id: str,
        has_resume: bool = True,
        file_name: Optional[str] = None,
        file_type: Optional[str] = None,
    ) -> None:
        """Update session metadata."""
        meta = self._load_meta(session_id)
        if not meta:
            return
        meta["has_resume"] = has_resume
        if file_name:
            meta["file_name"] = file_name
        if file_type:
            meta["file_type"] = file_type
        self._save_meta(session_id, meta)

    def save_resume_text(self, session_id: str, text: str) -> None:
        """Save parsed resume text."""
        with open(self._resume_text_path(session_id), "w", encoding="utf-8") as f:
            f.write(text)

    def load_resume_text(self, session_id: str) -> Optional[str]:
        """Load parsed resume text."""
        path = self._resume_text_path(session_id)
        if not path.exists():
            return None
        with open(path, "r", encoding="utf-8") as f:
            return f.read()

    def save_original_file(self, session_id: str, file_name: str, content: bytes) -> Path:
        """Save original resume file."""
        session_path = self._session_path(session_id)
        session_path.mkdir(parents=True, exist_ok=True)
        # Keep original extension
        ext = file_name.rsplit(".", 1)[-1] if "." in file_name else "bin"
        file_path = session_path / f"resume.{ext}"
        with open(file_path, "wb") as f:
            f.write(content)
        return file_path

    def _delete_session(self, session_id: str) -> None:
        """Delete a session directory."""
        session_path = self._session_path(session_id)
        if session_path.exists():
            shutil.rmtree(session_path, ignore_errors=True)

    def cleanup_expired(self) -> int:
        """Remove expired sessions. Returns count of removed sessions."""
        if not self.sessions_dir.exists():
            return 0

        count = 0
        now = datetime.now(timezone.utc)

        for session_dir in self.sessions_dir.iterdir():
            if not session_dir.is_dir():
                continue

            meta = self._load_meta(session_dir.name)
            if not meta:
                # No meta file, delete
                self._delete_session(session_dir.name)
                count += 1
                continue

            try:
                expires_at = datetime.fromisoformat(meta["expires_at"])
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                if now > expires_at:
                    self._delete_session(session_dir.name)
                    count += 1
            except (KeyError, ValueError):
                self._delete_session(session_dir.name)
                count += 1

        return count


# Singleton instance
session_store = SessionStore()


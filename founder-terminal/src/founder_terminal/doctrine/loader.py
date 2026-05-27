from __future__ import annotations

import hashlib
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

DEFAULT_DOCTRINE_PATH = Path("docs/architecture/DOCTRINE.md")


@dataclass(frozen=True)
class DoctrineDocument:
    path: Path
    exists: bool
    text: str
    sha256: Optional[str]
    byte_count: int
    error: Optional[str] = None


def resolve_doctrine_path(path: Optional[Path] = None) -> Path:
    override = os.getenv("FOUNDER_TERMINAL_DOCTRINE_PATH")
    if override:
        return Path(override).expanduser().resolve()

    candidate = path or DEFAULT_DOCTRINE_PATH
    return Path(candidate).expanduser()


def load_doctrine(path: Optional[Path] = None) -> DoctrineDocument:
    resolved_path = resolve_doctrine_path(path)

    if not resolved_path.exists():
        return DoctrineDocument(
            path=resolved_path,
            exists=False,
            text="",
            sha256=None,
            byte_count=0,
            error="DOCTRINE.md not found",
        )

    try:
        text = resolved_path.read_text(encoding="utf-8")
        raw = text.encode("utf-8")

        return DoctrineDocument(
            path=resolved_path,
            exists=True,
            text=text,
            sha256=hashlib.sha256(raw).hexdigest(),
            byte_count=len(raw),
        )
    except OSError as exc:
        return DoctrineDocument(
            path=resolved_path,
            exists=False,
            text="",
            sha256=None,
            byte_count=0,
            error=f"I/O error while reading doctrine: {exc}",
        )
    except UnicodeDecodeError as exc:
        return DoctrineDocument(
            path=resolved_path,
            exists=False,
            text="",
            sha256=None,
            byte_count=0,
            error=f"UTF-8 decode error while reading doctrine: {exc}",
        )


if __name__ == "__main__":
    print("Testing loader...")
    doc = load_doctrine()
    print(f"Exists: {doc.exists}, Hash: {doc.sha256}, Bytes: {doc.byte_count}, Error: {doc.error}")

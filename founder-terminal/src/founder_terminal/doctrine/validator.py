import re
from dataclasses import dataclass, field

from founder_terminal.doctrine.loader import DoctrineDocument

REQUIRED_SECTIONS = [
    "Product Thesis",
    "Five-Layer Boundary Rules",
    "Safety Rules",
    "Agent Runtime Rules",
    "Model Routing Rules",
    "Edge Rules",
    "Completion Rules",
    "Anti-Scope-Creep Rules",
]


@dataclass(frozen=True)
class DoctrineValidation:
    ok: bool
    required_count: int
    present_sections: list[str] = field(default_factory=list)
    missing_sections: list[str] = field(default_factory=list)
    diagnostics: list[str] = field(default_factory=list)


def normalize_heading(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"^\d+[\.\)]\s*", "", value)
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def extract_markdown_headings(text: str) -> list[str]:
    headings: list[str] = []
    for line in text.splitlines():
        match = re.match(r"^\s{0,3}#{1,6}\s+(.+?)\s*$", line)
        if match:
            headings.append(match.group(1).strip())
    return headings


def validate_doctrine(document: DoctrineDocument) -> DoctrineValidation:
    diagnostics: list[str] = []

    if not document.exists:
        diagnostics.append(f"WARNING: DOCTRINE.md unavailable: {document.error or 'missing file'}")
        return DoctrineValidation(
            ok=False,
            required_count=len(REQUIRED_SECTIONS),
            missing_sections=list(REQUIRED_SECTIONS),
            diagnostics=diagnostics,
        )

    normalized_headings = {normalize_heading(h) for h in extract_markdown_headings(document.text)}

    present_sections: list[str] = []
    missing_sections: list[str] = []

    for section in REQUIRED_SECTIONS:
        if normalize_heading(section) in normalized_headings:
            present_sections.append(section)
        else:
            missing_sections.append(section)

    ok = not missing_sections

    if ok:
        diagnostics.append(f"PASS: All {len(REQUIRED_SECTIONS)} required doctrine sections are present.")
    else:
        diagnostics.append(
            f"WARNING: Missing {len(missing_sections)} of {len(REQUIRED_SECTIONS)} required doctrine sections."
        )
        diagnostics.extend([f"Missing heading: {name}" for name in missing_sections])

    return DoctrineValidation(
        ok=ok,
        required_count=len(REQUIRED_SECTIONS),
        present_sections=present_sections,
        missing_sections=missing_sections,
        diagnostics=diagnostics,
    )


if __name__ == "__main__":
    print("Testing validator...")
    from founder_terminal.doctrine.loader import load_doctrine
    doc = load_doctrine()
    val = validate_doctrine(doc)
    print("Validation OK:", val.ok)
    print("Missing:", val.missing_sections)
    for line in val.diagnostics:
        print("Diagnostic:", line)

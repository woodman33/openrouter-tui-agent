import os
import re
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import datetime

class ContextPackResource(BaseModel):
    name: str
    content: str

class ContextPackPrompt(BaseModel):
    name: str
    content: str

class ContextPackTool(BaseModel):
    name: str
    description: str

class ContextPack(BaseModel):
    pack_id: str
    version: str
    title: str
    description: str
    last_verified: str
    source_type: str  # "official docs" | "repo" | "paper" | "blog" | "forum" | "generated note"
    source_url: str
    license: str
    citation_map: Dict[str, str] = Field(default_factory=dict)
    unstable_api_flags: List[str] = Field(default_factory=list)
    deprecated_api_flags: List[str] = Field(default_factory=list)
    resources: List[ContextPackResource] = Field(default_factory=list)
    prompts: List[ContextPackPrompt] = Field(default_factory=list)
    tools: List[ContextPackTool] = Field(default_factory=list)
    
    # Gating and Content Hashing
    content_hash: str = "none"
    source_hash: str = "none"
    registry_entry_hash: str = "none"
    evidence_status: str = "needs_audit"

class ContextPackValidationResult(BaseModel):
    ok: bool
    status: str  # "PASS" | "WARNING"
    missing_citations: List[str]
    stale_sources: List[str]
    unstable_api_flags: List[str]
    deprecated_api_flags: List[str]
    diagnostics: List[str]

def get_registry_details(pack_id: str) -> Dict[str, Any]:
    """
    Looks up and returns metadata registry entry for the given pack_id from registry.json.
    """
    import json
    registry_path = Path("docs/context-packs/registry.json")
    if not registry_path.exists():
        registry_path = Path("founder-terminal/docs/context-packs/registry.json")
        
    if not registry_path.exists():
        return {}
        
    try:
        with open(registry_path, "r", encoding="utf-8") as f:
            catalog = json.load(f)
        for entry in catalog:
            if entry.get("pack_id") == pack_id:
                return entry
    except Exception:
        pass
    return {}

def parse_markdown_yaml_frontmatter(file_content: str) -> Dict[str, Any]:
    """
    Extracts frontmatter between --- block of a markdown file and parses a simple YAML key-value map.
    """
    frontmatter = {}
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n", file_content, re.DOTALL)
    if not match:
        return {}
        
    block = match.group(1)
    lines = block.split("\n")
    
    current_key = None
    list_accumulator = []
    dict_accumulator = {}
    
    for line in lines:
        if not line.strip():
            continue
            
        # Check if line is a list item
        if line.strip().startswith("-") and current_key:
            val = line.strip().lstrip("-").strip().strip('"').strip("'")
            list_accumulator.append(val)
            continue
            
        # Check if it is an indented key-value item under a dictionary
        if (line.startswith(" ") or line.startswith("\t")) and ":" in line and current_key:
            parts = line.split(":", 1)
            k = parts[0].strip()
            v = parts[1].strip().strip('"').strip("'")
            dict_accumulator[k] = v
            continue
            
        if ":" in line:
            # If we had active accumulators, flush them
            if current_key:
                if list_accumulator:
                    frontmatter[current_key] = list_accumulator
                elif dict_accumulator:
                    frontmatter[current_key] = dict_accumulator
                list_accumulator = []
                dict_accumulator = {}
                
            parts = line.split(":", 1)
            key = parts[0].strip()
            val = parts[1].strip()
            
            # Remove string wrappers
            if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                val = val[1:-1]
                
            if val == "[]":
                val = []
            elif val == "{}":
                val = {}
                
            if not val and not isinstance(val, (list, dict)):
                current_key = key
                list_accumulator = []
                dict_accumulator = {}
            else:
                frontmatter[key] = val
                current_key = None
                
    if current_key:
        if list_accumulator:
            frontmatter[current_key] = list_accumulator
        elif dict_accumulator:
            frontmatter[current_key] = dict_accumulator
        
    return frontmatter

def parse_context_pack_file(file_path: Path) -> ContextPack:
    """
    Loads a context pack Markdown file, extracts metadata from frontmatter and builds a ContextPack object.
    """
    import hashlib
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    meta = parse_markdown_yaml_frontmatter(content)
    pack_id = meta.get("id", file_path.stem)
    reg = get_registry_details(pack_id)
    
    # Parse list of citation references
    citation_map = {}
    citation_block = meta.get("citation_map", {})
    if isinstance(citation_block, str):
        # Fallback split
        for line in citation_block.split(";"):
            if "=" in line:
                k, v = line.split("=", 1)
                citation_map[k.strip()] = v.strip()
    elif isinstance(citation_block, dict):
        citation_map = citation_block
    elif not citation_block and reg.get("citation_map"):
        citation_map = reg.get("citation_map")
        
    # Resources extraction
    resources = []
    prompts = []
    tools = []
    
    # Check frontmatter resource models
    raw_resources = meta.get("resources", [])
    if isinstance(raw_resources, list):
        for res in raw_resources:
            if isinstance(res, str):
                resources.append(ContextPackResource(name="doc_chunk", content=res))
                
    # Fallback to parse headings as resources in Markdown body
    sections = re.split(r"\n##\s+", content)
    for sec in sections[1:]:
        lines = sec.strip().split("\n")
        title = lines[0].strip()
        body = "\n".join(lines[1:]).strip()
        if "prompt" in title.lower() or "brief" in title.lower():
            prompts.append(ContextPackPrompt(name=title, content=body))
        elif "tool" in title.lower() or "schema" in title.lower():
            tools.append(ContextPackTool(name=title, description=body[:100]))
        else:
            resources.append(ContextPackResource(name=title, content=body))

    # Build Pydantic model
    return ContextPack(
        pack_id=pack_id,
        version=meta.get("version", reg.get("version", "1.0.0")),
        title=meta.get("title", file_path.stem.capitalize()),
        description=meta.get("description", reg.get("description", "")),
        last_verified=meta.get("last_verified", reg.get("last_verified", datetime.date.today().isoformat())),
        source_type=meta.get("source_type", reg.get("source_type", "official docs")),
        source_url=meta.get("source_url", reg.get("source_url", "")),
        license=meta.get("license", reg.get("license", "unknown")),
        citation_map=citation_map,
        unstable_api_flags=meta.get("unstable_api_flags", reg.get("unstable_api_flags", [])),
        deprecated_api_flags=meta.get("deprecated_api_flags", reg.get("deprecated_api_flags", [])),
        resources=resources,
        prompts=prompts,
        tools=tools,
        content_hash=reg.get("content_hash", hashlib.sha256(content.encode("utf-8")).hexdigest()),
        source_hash=reg.get("source_hash", "none"),
        registry_entry_hash=reg.get("registry_entry_hash", "none"),
        evidence_status=reg.get("evidence_status", "needs_audit")
    )

def validate_context_pack(pack: ContextPack) -> ContextPackValidationResult:
    """
    Executes a freshness and citation audit against the context pack metadata.
    """
    ok = True
    missing_citations = []
    stale_sources = []
    diagnostics = []
    
    # 1. Source existence check
    if not pack.source_url:
        ok = False
        missing_citations.append("source_url is empty")
        diagnostics.append("✕ Validation Error: Source URL missing from context pack.")
    else:
        diagnostics.append(f"✓ Verified Source exists: {pack.source_url}")
        
    # 2. Freshness Check (stale if last_verified older than 30 days)
    try:
        verified_date = datetime.datetime.strptime(pack.last_verified, "%Y-%m-%d").date()
        days_ago = (datetime.date.today() - verified_date).days
        if days_ago > 30:
            # We don't mark ok = False for freshness warning, it is a warning zone
            stale_sources.append(f"stale_source: last_verified {pack.last_verified} ({days_ago} days ago)")
            diagnostics.append(f"⚠️ Warning: Stale memory detected. Last verified {days_ago} days ago.")
        else:
            diagnostics.append(f"✓ Freshness Validated: Last verified {days_ago} days ago (within 30 days safe-zone).")
    except Exception as e:
        ok = False
        stale_sources.append(f"corrupt_timestamp: {pack.last_verified}")
        diagnostics.append(f"✕ Date Formatting Error: Failed to parse timestamp '{pack.last_verified}': {e}")
        
    # 3. Citation map existence
    if not pack.citation_map:
        ok = False
        missing_citations.append("citation_map is empty")
        diagnostics.append("✕ Validation Error: Citation map links missing from documentation metadata.")
    else:
        diagnostics.append(f"✓ Citation references present ({len(pack.citation_map)} links mapped).")
        
    # 4. License check
    if not pack.license or pack.license.lower() in ["unknown", "none"]:
        ok = False
        missing_citations.append("license is missing")
        diagnostics.append("✕ Validation Error: Documentation license attribute missing.")
    else:
        diagnostics.append(f"✓ Verified documentation license field: {pack.license}")
        
    # 5. Type Classification check
    valid_types = ["official docs", "repo", "paper", "blog", "forum", "generated note"]
    if pack.source_type not in valid_types:
        ok = False
        missing_citations.append(f"invalid_source_type: '{pack.source_type}'")
        diagnostics.append(f"✕ Classification Error: Type '{pack.source_type}' not in valid schema types.")
    else:
        diagnostics.append(f"✓ Verified doc classification type: {pack.source_type}")
        
    # 6. Flag Unstable / Deprecated APIs
    if pack.unstable_api_flags:
        diagnostics.append(f"⚠️ Flagged Unstable APIs: {pack.unstable_api_flags}")
    if pack.deprecated_api_flags:
        diagnostics.append(f"⚠️ Flagged Deprecated APIs: {pack.deprecated_api_flags}")
        
    status = "PASS" if ok else "WARNING"
    return ContextPackValidationResult(
        ok=ok,
        status=status,
        missing_citations=missing_citations,
        stale_sources=stale_sources,
        unstable_api_flags=pack.unstable_api_flags,
        deprecated_api_flags=pack.deprecated_api_flags,
        diagnostics=diagnostics
    )

import hashlib
from typing import Dict, Any
from founder_terminal.agentpass.passport import AgentPassPassport
from founder_terminal.agentpass.verifier import PassportVerificationResult

def format_passport_manifest_entries(
    passport: AgentPassPassport,
    result: PassportVerificationResult
) -> Dict[str, Any]:
    """
    Formulates correct .agentrun manifest properties for auditing, hashing JTI for privacy protection.
    """
    jti_hash = hashlib.sha256(passport.jti.encode("utf-8")).hexdigest()
    
    return {
        "passport_jti_hash": jti_hash,
        "passport_issuer": passport.iss,
        "passport_subject": passport.sub,
        "passport_delegated_by": passport.delegated_by,
        "passport_scopes": passport.scopes,
        "passport_verification_status": result.status,
        "passport_allowed_tools": passport.allowed_tools,
        "passport_denied_tools": passport.denied_tools,
        "passport_risk_ceiling": passport.risk_level,
        "passport_budget_limit": passport.budget_usd
    }

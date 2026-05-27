from enum import Enum

class ExecutionRisk(str, Enum):
    READ_ONLY = "read_only"
    LOW_RISK = "low_risk"
    MEDIUM_RISK = "medium_risk"
    HIGH_RISK = "high_risk"

class ExecutionModeState(str, Enum):
    IMPLEMENTED = "implemented"
    PARTIAL = "partial"
    PARKED = "parked"
    MISSING = "missing"

EXECUTION_MODE_MATRIX = {
    "local_sdk": {
        "name": "Local SDK (V1 Default)",
        "description": "Executes conversations directly against the local workspace using Python processes.",
        "sandbox": "Host Process",
        "risk": ExecutionRisk.MEDIUM_RISK,
        "state": ExecutionModeState.IMPLEMENTED,
        "warning": "Unsafe write commands could mutate local project files directly. Write-sandbox isolation recommended."
    },
    "local_agent_server": {
        "name": "Local Agent Server",
        "description": "Connects to a local client-server background workspace daemon over HTTP/REST.",
        "sandbox": "Daemon isolated",
        "risk": ExecutionRisk.LOW_RISK,
        "state": ExecutionModeState.PARKED,
        "warning": "Requires running 'python -m openhands.agent_server' in the background."
    },
    "docker_workspace": {
        "name": "Docker Sandbox Container",
        "description": "Runs conversations inside safe, isolated Docker/Orbstack micro-containers.",
        "sandbox": "Docker Workspace",
        "risk": ExecutionRisk.LOW_RISK,
        "state": ExecutionModeState.PARKED,
        "warning": "Guarantees complete filesystem safety. High-risk write changes run in isolated branches."
    },
    "openhands_cloud": {
        "name": "OpenHands Cloud Platform",
        "description": "Offloads execution to managed serverless cloud environments via app.all-hands.dev.",
        "sandbox": "Cloud Workspace",
        "risk": ExecutionRisk.READ_ONLY,
        "state": ExecutionModeState.PARKED,
        "warning": "Requires active OpenHands Cloud API key and active subscription."
    },
    "headless_jsonl": {
        "name": "Headless CLI Adapter",
        "description": "Invokes the headless runner command directly and streams JSONL stdout logs.",
        "sandbox": "Unsafe Host",
        "risk": ExecutionRisk.HIGH_RISK,
        "state": ExecutionModeState.PARTIAL,
        "warning": "[CRITICAL] OpenHands headless mode always runs in 'always-approve' mode! Sandboxed copy required for write tasks."
    }
}

def get_execution_modes() -> dict:
    return EXECUTION_MODE_MATRIX

if __name__ == "__main__":
    print("Execution Mode Matrix:")
    import pprint
    pprint.pprint(get_execution_modes())

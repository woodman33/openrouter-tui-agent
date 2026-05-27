from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseRunner(ABC):
    """
    TIMMY External Governed Agent Runner Contract specification
    """
    
    @property
    @abstractmethod
    def runner_id(self) -> str:
        pass

    @property
    @abstractmethod
    def display_name(self) -> str:
        pass

    @property
    @abstractmethod
    def required_scopes(self) -> List[str]:
        pass

    @property
    @abstractmethod
    def risk_class(self) -> str:
        pass

    @property
    @abstractmethod
    def supports_dry_run(self) -> bool:
        pass

    @property
    @abstractmethod
    def supports_live(self) -> bool:
        pass

    @abstractmethod
    def build_command(self, task: str, mode: str) -> str:
        pass

    @abstractmethod
    def run(self, task: str, mode: str, require_approval: bool = True) -> Dict[str, Any]:
        pass

    @abstractmethod
    def collect_artifacts(self) -> List[str]:
        pass

    @abstractmethod
    def summarize_result(self, result: Dict[str, Any]) -> str:
        pass

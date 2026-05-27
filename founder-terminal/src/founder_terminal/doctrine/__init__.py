# TIMMY Doctrine Governance Package
from founder_terminal.doctrine.loader import (
    DoctrineDocument,
    load_doctrine,
    DEFAULT_DOCTRINE_PATH
)
from founder_terminal.doctrine.validator import (
    DoctrineValidation,
    validate_doctrine,
    REQUIRED_SECTIONS
)
from founder_terminal.doctrine.injector import (
    build_openrouter_system_context,
    build_openhands_task_prefix,
    doctrine_hash
)

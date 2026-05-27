from __future__ import annotations
import os
import shutil
import datetime
from pathlib import Path
from typing import Optional
from pydantic import BaseModel
from founder_terminal.runs.store import RunStore

class EnvWriteResult(BaseModel):
    success: bool
    changed_keys: list[str]
    backup_path: Optional[str] = None
    error: Optional[str] = None

def backup_env(env_path: Path) -> Optional[Path]:
    """
    Creates a timestamped backup of the project's .env file.
    """
    if not env_path.exists():
        return None
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = env_path.parent / f".env.backup-{timestamp}"
    try:
        shutil.copy2(env_path, backup_path)
        # Attempt to restrict permissions to read/write for owner only
        try:
            os.chmod(backup_path, 0o600)
        except Exception:
            pass
        return backup_path
    except Exception:
        return None

def write_openrouter_env(env_path: Path, values: dict[str, str]) -> EnvWriteResult:
    """
    Safely writes OpenRouter credentials to the .env file while preserving
    all other environment variables. Creates a backup first.
    """
    env_path = Path(env_path).resolve()
    changed_keys = []
    backup_file_path = None
    
    # 1. Create a failsafe backup
    if env_path.exists():
        backup_file_path = backup_env(env_path)
        if not backup_file_path:
            return EnvWriteResult(
                success=False,
                changed_keys=[],
                error="Failsafe backup of .env failed. Aborting mutation."
            )
            
    # 2. Parse current lines
    existing_lines = []
    if env_path.exists():
        try:
            with open(env_path, "r") as f:
                existing_lines = f.readlines()
        except Exception as e:
            return EnvWriteResult(
                success=False,
                changed_keys=[],
                error=f"Failed to read existing .env file: {e}"
            )
            
    # Parse existing keys
    updated_lines = []
    keys_written = set()
    
    for line in existing_lines:
        line_stripped = line.strip()
        if not line_stripped or line_stripped.startswith("#"):
            updated_lines.append(line)
            continue
        if "=" in line_stripped:
            k, v = line_stripped.split("=", 1)
            k = k.strip()
            if k in values:
                new_val = values[k]
                updated_lines.append(f"{k}='{new_val}'\n")
                keys_written.add(k)
                changed_keys.append(k)
            else:
                updated_lines.append(line)
        else:
            updated_lines.append(line)
            
    # Add any missing values
    for k, v in values.items():
        if k not in keys_written:
            updated_lines.append(f"{k}='{v}'\n")
            changed_keys.append(k)
            
    # 3. Write new content
    try:
        with open(env_path, "w") as f:
            f.writelines(updated_lines)
            
        # Ensure chmod 600
        try:
            os.chmod(env_path, 0o600)
        except Exception:
            pass
            
        # 4. Log config mutation inside central RunStore
        try:
            store = RunStore()
            store.log_config_mutation(
                file_path=str(env_path.resolve()),
                action="UPDATE_OPENROUTER_API_KEY",
                backup_path=str(backup_file_path) if backup_file_path else "None"
            )
        except Exception:
            # Prevent failures in logging from blocking the file write completion
            pass
            
        return EnvWriteResult(
            success=True,
            changed_keys=changed_keys,
            backup_path=str(backup_file_path) if backup_file_path else None
        )
    except Exception as e:
        # Attempt recovery if backup exists
        if backup_file_path and backup_file_path.exists():
            try:
                shutil.copy2(backup_file_path, env_path)
            except Exception:
                pass
        return EnvWriteResult(
            success=False,
            changed_keys=[],
            backup_path=str(backup_file_path) if backup_file_path else None,
            error=f"Failed to write .env file: {e}"
        )

def remove_openrouter_env(env_path: Path) -> EnvWriteResult:
    """
    Safely removes OpenRouter credentials from the .env file while preserving
    all other environment variables. Creates a backup first.
    """
    env_path = Path(env_path).resolve()
    changed_keys = []
    backup_file_path = None
    
    # 1. Create a failsafe backup
    if env_path.exists():
        backup_file_path = backup_env(env_path)
        if not backup_file_path:
            return EnvWriteResult(
                success=False,
                changed_keys=[],
                error="Failsafe backup of .env failed. Aborting mutation."
            )
            
    # 2. Parse current lines
    existing_lines = []
    if env_path.exists():
        try:
            with open(env_path, "r") as f:
                existing_lines = f.readlines()
        except Exception as e:
            return EnvWriteResult(
                success=False,
                changed_keys=[],
                error=f"Failed to read existing .env file: {e}"
            )
            
    # Remove key lines
    updated_lines = []
    keys_to_remove = {"OPENROUTER_API_KEY", "OPENROUTER_TYPE"}
    
    for line in existing_lines:
        line_stripped = line.strip()
        if not line_stripped or line_stripped.startswith("#"):
            updated_lines.append(line)
            continue
        if "=" in line_stripped:
            k, v = line_stripped.split("=", 1)
            k = k.strip()
            if k in keys_to_remove:
                changed_keys.append(k)
            else:
                updated_lines.append(line)
        else:
            updated_lines.append(line)
            
    # 3. Write new content
    try:
        with open(env_path, "w") as f:
            f.writelines(updated_lines)
            
        # Ensure chmod 600
        try:
            os.chmod(env_path, 0o600)
        except Exception:
            pass
            
        # 4. Log config mutation inside central RunStore
        try:
            store = RunStore()
            store.log_config_mutation(
                file_path=str(env_path.resolve()),
                action="REMOVE_OPENROUTER_API_KEY",
                backup_path=str(backup_file_path) if backup_file_path else "None"
            )
        except Exception:
            pass
            
        return EnvWriteResult(
            success=True,
            changed_keys=changed_keys,
            backup_path=str(backup_file_path) if backup_file_path else None
        )
    except Exception as e:
        if backup_file_path and backup_file_path.exists():
            try:
                shutil.copy2(backup_file_path, env_path)
            except Exception:
                pass
        return EnvWriteResult(
            success=False,
            changed_keys=[],
            backup_path=str(backup_file_path) if backup_file_path else None,
            error=f"Failed to write .env file: {e}"
        )

if __name__ == "__main__":
    print("Testing env_writer...")
    # Create test env file
    test_env = Path("test_env.tmp")
    with open(test_env, "w") as f:
        f.write("EXISTING_KEY='keep_me'\n")
    res = write_openrouter_env(test_env, {"OPENROUTER_API_KEY": "sk-or-v1-test", "OPENROUTER_TYPE": "bearer"})
    print(res.model_dump_json(indent=2))
    # cleanup
    if test_env.exists():
        os.remove(test_env)
    if res.backup_path and Path(res.backup_path).exists():
        os.remove(Path(res.backup_path))

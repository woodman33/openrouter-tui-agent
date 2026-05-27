import datetime
import uuid
from pyee import EventEmitter
from founder_terminal.runs.store import NormalizedEvent

class VisualizerEventBus(EventEmitter):
    """
    In-memory pub-sub event bus that receives events from OpenHands Visualizers,
    normalizes them, and streams them reactive-ly to Textual TUI subscribers.
    """
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(VisualizerEventBus, cls).__new__(cls, *args, **kwargs)
        return cls._instance

    def publish_event(self, run_id: str, event_type: str, summary: str, raw_payload: dict = None) -> NormalizedEvent:
        event = NormalizedEvent(
            id=f"evt_{uuid.uuid4().hex[:6]}",
            timestamp=datetime.datetime.utcnow().isoformat() + "Z",
            type=event_type,
            conversation_id=run_id,
            summary=summary,
            tool_name=raw_payload.get("tool_name") if raw_payload else None,
            raw=raw_payload or {}
        )
        self.emit("event", event)
        return event

# Global visualizer singleton for easy TUI hook bindings
visualizer_bus = VisualizerEventBus()

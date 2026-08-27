from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional, Dict


class SecurityEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime
    node_id: str
    sequence_num: Optional[int] = None
    action: str  # ACCEPTED, REJECTED_REPLAY, REJECTED_UNAUTHORIZED, REJECTED_CHECKSUM
    reason: str
    client_ip: Optional[str] = None


class SecurityStatusResponse(BaseModel):
    is_active: bool = True
    replay_protection_enabled: bool = True
    authorized_nodes: List[str]
    last_sequence_by_node: Dict[str, int]
    total_events_logged: int


class SecurityEventListResponse(BaseModel):
    count: int
    events: List[SecurityEventResponse]

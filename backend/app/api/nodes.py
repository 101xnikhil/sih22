from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models.node import Node
from app.schemas.node import NodeResponse, NodeCreate, NodeUpdate

router = APIRouter(prefix="/nodes", tags=["Nodes"])


@router.get("", response_model=List[NodeResponse])
def list_nodes(db: Session = Depends(get_db)):
    """Retrieve all registered IoT sensor stations."""
    nodes = db.query(Node).order_by(Node.node_id).all()
    return nodes


@router.get("/{node_id}", response_model=NodeResponse)
def get_node(node_id: str, db: Session = Depends(get_db)):
    """Retrieve station metadata and health diagnostics for a specific node."""
    node = db.query(Node).filter(Node.node_id == node_id).first()
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sensor node '{node_id}' not found",
        )
    return node


@router.post("", response_model=NodeResponse, status_code=status.HTTP_201_CREATED)
def create_node(node_in: NodeCreate, db: Session = Depends(get_db)):
    """Register a new sensor station in the system."""
    existing = db.query(Node).filter(Node.node_id == node_in.node_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Sensor node '{node_in.node_id}' already registered",
        )

    node = Node(
        node_id=node_in.node_id,
        name=node_in.name,
        latitude=node_in.latitude,
        longitude=node_in.longitude,
        altitude_m=node_in.altitude_m,
        description=node_in.description,
        status=node_in.status,
        firmware_version=node_in.firmware_version,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        last_seen=datetime.utcnow(),
    )
    db.add(node)
    db.commit()
    db.refresh(node)
    return node

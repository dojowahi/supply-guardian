
from fastapi import APIRouter, Depends
from typing import List
from sqlmodel import Session, select
from ..database import get_session
from ..models import Node, Disruption

router = APIRouter()

@router.get("/network/nodes", response_model=List[Node])
async def get_nodes(session: Session = Depends(get_session)):
    return session.exec(select(Node)).all()

@router.get("/network/disruptions", response_model=List[Disruption])
async def get_disruptions(session: Session = Depends(get_session)):
    return session.exec(select(Disruption)).all()

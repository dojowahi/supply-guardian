
from fastapi import APIRouter, Depends
from typing import List, Optional
from sqlmodel import Session, select
from ..database import get_session
from ..models import Shipment, Product

router = APIRouter()

@router.get("/shipments", response_model=List[Shipment])
async def get_shipments(status: Optional[str] = None, session: Session = Depends(get_session)):
    query = select(Shipment)
    if status:
        query = query.where(Shipment.status == status)
    return session.exec(query).all()

@router.get("/products", response_model=List[Product])
async def get_products(session: Session = Depends(get_session)):
    return session.exec(select(Product)).all()

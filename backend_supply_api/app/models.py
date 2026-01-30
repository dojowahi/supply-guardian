
from typing import List, Dict, Optional
from sqlmodel import SQLModel, Field, Column, JSON
from pydantic import BaseModel

# --- Database Models (SQL Tables) ---

class Node(SQLModel, table=True):
    id: str = Field(primary_key=True)
    name: str
    type: str # Port, Warehouse, Store
    location: Dict = Field(default={}, sa_column=Column(JSON))
    capacity_tier: int

class Product(SQLModel, table=True):
    sku: str = Field(primary_key=True)
    name: str
    unit_value: float
    is_seasonal: bool

class Shipment(SQLModel, table=True):
    id: str = Field(primary_key=True)
    status: str # In-Transit, Stuck, Delayed
    transport_mode: str # Sea, Air, Truck
    priority: str # Normal, Critical
    
    current_location: Dict = Field(default={}, sa_column=Column(JSON))
    
    origin_id: str
    destination_id: str
    
    contents: List[Dict] = Field(default=[], sa_column=Column(JSON))
    
    total_value_at_risk: float

class Disruption(SQLModel, table=True):
    id: str = Field(primary_key=True)
    type: str
    description: str
    
    location: Dict = Field(default={}, sa_column=Column(JSON))
    
    radius_km: float
    affected_modes: List[str] = Field(default=[], sa_column=Column(JSON))

# --- Pydantic Schemas (API Request/Response) ---

class Location(BaseModel):
    lat: float
    lon: float

class QuoteOption(BaseModel):
    id: str
    type: str
    cost_usd: float
    transit_time_hours: int
    co2_kg: float
    description: Optional[str] = None

class QuoteResponse(BaseModel):
    shipment_id: str
    options: List[QuoteOption]

class RerouteRequest(BaseModel):
    shipment_id: str
    new_route_id: str

from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class Coordinate(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    lat: float
    lng: float

class Shipment(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    id: str = Field(description="Unique shipment ID (e.g., 'SHP-123')")
    status: str = Field(description="Current status: 'In-Transit', 'Delayed', 'Stuck', 'Delivered'")
    mode: str = Field(description="Transport mode: 'Truck', 'Sea', 'Rail', 'Air'")
    origin_id: Optional[str] = Field(description="ID of the origin node")
    current_location: str = Field(description="Name of the current location (Port/City)")
    destination: str = Field(description="Name of the destination")
    coordinates: Optional[Coordinate] = Field(description="Geo-coordinates of current location")
    value: float = Field(description="Monetary value of the shipment")
    priority: str = Field(description="Priority level: 'Standard', 'High', 'Critical'")
    contents: List[str] = Field(description="List of items in the shipment")

class Disruption(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    id: str
    type: str = Field(description="Type of disruption (e.g., 'Strike', 'Weather')")
    location: str
    severity: str = Field(description="Severity: 'Low', 'Medium', 'High', 'Critical'")
    description: str
    radius_km: Optional[float] = Field(description="Radius of the disruption impact in kilometers")
    coordinates: Optional[Coordinate]

class Node(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    id: str
    name: str
    type: str = Field(description="Type of node: 'Port', 'Warehouse', 'Store', etc.")
    coordinates: Optional[Coordinate]

class SupplySnapshot(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    shipments: List[Shipment] = Field(description="List of all active shipments, emphasizing 'Stuck' ones")
    disruptions: List[Disruption] = Field(description="List of known network disruptions")
    nodes: List[Node] = Field(description="List of key supply chain nodes")
    timestamp: str = Field(description="ISO timestamp of the snapshot")
    insights: str = Field(description="Brief analysis of the current situation")

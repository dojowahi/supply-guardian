from pydantic import BaseModel
from typing import List
import json
from pathlib import Path

class Location(BaseModel):
    lat: float
    lon: float

class Node(BaseModel):
    id: str
    name: str
    type: str # Port, Warehouse, Store
    location: Location
    capacity_tier: int

class Product(BaseModel):
    sku: str
    name: str
    unit_value: float
    is_seasonal: bool

class ShipmentContent(BaseModel):
    sku: str
    quantity: int

class Shipment(BaseModel):
    id: str
    status: str # In-Transit, Stuck, Delayed
    transport_mode: str # Sea, Air, Truck
    priority: str # Normal, Critical
    current_location: Location
    origin_id: str
    destination_id: str
    contents: List[ShipmentContent]
    total_value_at_risk: float

class Disruption(BaseModel):
    id: str
    type: str
    description: str
    location: Location
    radius_km: float
    affected_modes: List[str]

DATA_DIR = Path("backend_supply_api/data")

def verify():
    print("Verifying Nodes...")
    with open(DATA_DIR / "nodes.json") as f:
        [Node(**item) for item in json.load(f)]
    print("Nodes OK.")

    print("Verifying Shipments...")
    with open(DATA_DIR / "shipments.json") as f:
        [Shipment(**item) for item in json.load(f)]
    print("Shipments OK.")

    print("Verifying Disruptions...")
    with open(DATA_DIR / "disruptions.json") as f:
        [Disruption(**item) for item in json.load(f)]
    print("Disruptions OK.")

    print("Verifying Products...")
    with open(DATA_DIR / "products.json") as f:
        [Product(**item) for item in json.load(f)]
    print("Products OK.")

if __name__ == "__main__":
    try:
        verify()
        print("ALL DATA VALID.")
    except Exception as e:
        print(f"VALIDATION ERROR: {e}")

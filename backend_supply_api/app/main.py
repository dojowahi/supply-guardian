import json
import math
import uuid
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path

app = FastAPI(title="Supply Guardian API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models ---

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

class QuoteOption(BaseModel):
    id: str
    type: str
    cost_usd: float
    transit_time_hours: int
    co2_kg: float

class QuoteResponse(BaseModel):
    shipment_id: str
    options: List[QuoteOption]

class RerouteRequest(BaseModel):
    shipment_id: str
    new_route_id: str

# --- In-Memory Database ---

db = {
    "nodes": [],
    "shipments": [],
    "disruptions": [],
    "products": []
}

DATA_DIR = Path(__file__).parent.parent / "data"

def load_data():
    try:
        with open(DATA_DIR / "nodes.json") as f:
            db["nodes"] = [Node(**item) for item in json.load(f)]
        with open(DATA_DIR / "shipments.json") as f:
            db["shipments"] = [Shipment(**item) for item in json.load(f)]
        with open(DATA_DIR / "disruptions.json") as f:
            db["disruptions"] = [Disruption(**item) for item in json.load(f)]
        with open(DATA_DIR / "products.json") as f:
            db["products"] = [Product(**item) for item in json.load(f)]
        print("Data loaded successfully.")
    except Exception as e:
        print(f"Error loading data: {e}")

@app.on_event("startup")
async def startup_event():
    load_data()

# --- Helper Functions ---

def calculate_distance_km(loc1: Location, loc2: Location) -> float:
    # Haversine formula
    R = 6371  # Earth radius in km
    dlat = math.radians(loc2.lat - loc1.lat)
    dlon = math.radians(loc2.lon - loc1.lon)
    a = math.sin(dlat/2) * math.sin(dlat/2) + \
        math.cos(math.radians(loc1.lat)) * math.cos(math.radians(loc2.lat)) * \
        math.sin(dlon/2) * math.sin(dlon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

# --- Endpoints ---

@app.get("/network/nodes", response_model=List[Node])
async def get_nodes():
    return db["nodes"]

@app.get("/shipments", response_model=List[Shipment])
async def get_shipments(status: Optional[str] = None):
    if status:
        return [s for s in db["shipments"] if s.status == status]
    return db["shipments"]

@app.get("/network/disruptions", response_model=List[Disruption])
async def get_disruptions():
    return db["disruptions"]

@app.get("/products", response_model=List[Product])
async def get_products():
    return db["products"]

@app.get("/actions/quotes/{shipment_id}", response_model=QuoteResponse)
async def get_quotes(shipment_id: str):
    shipment = next((s for s in db["shipments"] if s.id == shipment_id), None)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    # Generate mock quotes based on shipment value/urgency to simulate "logic"
    # Logic: Air is expensive but fast. Sea is cheap but slow.
    
    # Simple logic: 
    # Air Cost = Value * 0.05 + 1000 base
    # Sea Cost = Value * 0.005 + 500 base
    
    val = shipment.total_value_at_risk
    
    air_cost = int(val * 0.01 + 2000) # Simplified logic
    sea_cost = int(val * 0.001 + 500)
    
    # Option 3: Emergency Replacement (New Air Shipment)
    # Useful if the original is stuck mid-ocean and cannot be unloaded.
    replacement_cost = int(air_cost * 1.2) # Premium for emergency inventory allocation

    # --- DISRUPTION INTELLIGENCE ---
    # Check if the disruption is a "Labor Strike".
    # In a Labor Strike, the port is dead. You cannot Unload (Air) or Reroute (Sea) easily if you are stuck AT the port.
    
    # We cheat a bit by looking up the disruption near this shipment.
    active_disruption = next((d for d in db["disruptions"] if 
                              calculate_distance_km(d.location, shipment.current_location) <= d.radius_km), None)
    
    options = []
    
    if active_disruption and "Strike" in active_disruption.type:
        # SCENARIO: LABOR STRIKE (The "Coffee Crisis")
        # You cannot touch the cargo. It is held hostage by the union.
        # Your ONLY choice is to source new goods from a completely different country/port.
        
        alt_origin_cost = int(replacement_cost * 0.9) # Slightly cheaper than Air Replacement, maybe via Sea from elsewhere
        
        options = [
             {
                "id": "OPT-ALT-ORIGIN-SEA",
                "type": "New Sourcing: Alt Origin (Shanghai - Sea)",
                "cost_usd": 1200.0, # Cheap but slower
                "transit_time_hours": 140,
                "co2_kg": 250.0,
                "description": "Source from backup supplier in Shanghai (PORT-SHA)"
            },
            {
                "id": "OPT-ALT-ORIGIN-AIR",
                "type": "New Sourcing: Alt Origin (Shanghai - Air)",
                "cost_usd": 8500.0, # Expensive
                "transit_time_hours": 30,
                "co2_kg": 1600.0,
                 "description": "Fly stock from backup supplier in Shanghai"
            }
        ]
        
    else:
        # STANDARD SCENARIO (Weather, etc.)
        options = [
            {
                "id": "OPT-AIR-EXPEDITED",
                "type": "Expedite (Air) - Unload & Fly",
                "cost_usd": air_cost,
                "transit_time_hours": 24,
                "co2_kg": 1500.0
            },
            {
                "id": "OPT-SEA-REROUTE",
                "type": "Reroute (Sea) - Divert Ship",
                "cost_usd": sea_cost,
                "transit_time_hours": 120, # 5 days
                "co2_kg": 200.0
            },
            {
                "id": "OPT-REPLACEMENT-AIR",
                "type": "Emergency Replacement (New Shipment)",
                "cost_usd": replacement_cost,
                "transit_time_hours": 24,
                "co2_kg": 3000.0
            }
        ]
    
    return {
        "shipment_id": shipment_id,
        "options": options
    }

@app.post("/actions/reroute")
async def reroute_shipment(payload: RerouteRequest):
    shipment = next((s for s in db["shipments"] if s.id == payload.shipment_id), None)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    # Handle New Replacement Shipment (Same Origin or Alt Origin)
    if "REPLACEMENT" in payload.new_route_id or "ALT-ORIGIN" in payload.new_route_id:
        
        # Determine Origin
        new_origin_id = shipment.origin_id # Default to same origin
        
        if "ALT-ORIGIN" in payload.new_route_id:
             # USE EXISTING PORT: Shanghai (PORT-SHA) as the primary Asian backup
             # In a real app, we would query the Graph for "Nearest Active Port with Stock"
             new_origin_id = "PORT-SHA" 
             
             # Fallback: if we are already AT Shanghai, use Rotterdam?
             if shipment.origin_id == "PORT-SHA":
                 new_origin_id = "PORT-RTM"

        # Look up the actual node to get coordinates
        origin_node = next((n for n in db["nodes"] if n.id == new_origin_id), None)
        if not origin_node:
             # Should not happen if we use valid IDs
             origin_loc = Location(lat=0, lon=0) 
        else:
             origin_loc = origin_node.location

        # Determine Mode
        new_mode = "Air" if "AIR" in payload.new_route_id else "Sea"
             
        # 2. Create New Shipment with UNIQUE ID
        # Format: SH-1002-REP-a1b2c3
        unique_suffix = uuid.uuid4().hex[:6]
        new_id = f"{shipment.id}-REP-{unique_suffix}"
        
        new_shipment = Shipment(
            id=new_id,
            status="In-Transit",
            transport_mode=new_mode,
            priority="Critical" if new_mode == "Air" else "Normal",
            current_location=origin_loc, 
            origin_id=new_origin_id,
            destination_id=shipment.destination_id,
            contents=shipment.contents,
            total_value_at_risk=shipment.total_value_at_risk
        )
        
        # 3. Add to Database
        db["shipments"].append(new_shipment)
        
        return {
            "status": "success", 
            "message": f"Replacement shipment {new_id} created via {new_mode} from {new_origin_id}. Original shipment {shipment.id} remains {shipment.status}.",
            "new_shipment_id": new_id
        }
    
    # Update existing shipment state
    if "AIR" in payload.new_route_id:
        shipment.transport_mode = "Air"
    else:
        shipment.transport_mode = "Sea" # Default fallback or stay Sea
        
    shipment.status = "In-Transit"
    
    # In a real app we might update location or route path too
    return {"status": "success", "message": f"Shipment {shipment.id} rerouted via {shipment.transport_mode}"}

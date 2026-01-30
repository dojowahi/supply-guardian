
import math
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..database import get_session
from ..models import Shipment, Disruption, Node, QuoteResponse, QuoteOption, RerouteRequest

router = APIRouter()

def calculate_distance_km(loc1_dict: dict, loc2_dict: dict) -> float:
    lat1, lon1 = loc1_dict.get('lat', 0), loc1_dict.get('lon', 0)
    lat2, lon2 = loc2_dict.get('lat', 0), loc2_dict.get('lon', 0)

    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2) * math.sin(dlat/2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dlon/2) * math.sin(dlon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

@router.get("/actions/quotes/{shipment_id}", response_model=QuoteResponse)
async def get_quotes(shipment_id: str, session: Session = Depends(get_session)):
    shipment = session.exec(select(Shipment).where(Shipment.id == shipment_id)).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    val = shipment.total_value_at_risk
    
    # Mock Logic for Quote Generation
    air_cost = int(val * 0.01 + 2000) 
    sea_cost = int(val * 0.001 + 500)
    replacement_cost = int(air_cost * 1.2) 

    disruptions = session.exec(select(Disruption)).all()
    
    active_disruption = next((d for d in disruptions if 
                              calculate_distance_km(d.location, shipment.current_location) <= d.radius_km), None)
    
    options = []
    
    if active_disruption and "Strike" in active_disruption.type:
        options = [
             {
                "id": "OPT-ALT-ORIGIN-SEA",
                "type": "New Sourcing: Alt Origin (Shanghai - Sea)",
                "cost_usd": 1200.0, 
                "transit_time_hours": 140,
                "co2_kg": 250.0,
                "description": "Source from backup supplier in Shanghai (PORT-SHA)"
            },
            {
                "id": "OPT-ALT-ORIGIN-AIR",
                "type": "New Sourcing: Alt Origin (Shanghai - Air)",
                "cost_usd": 8500.0, 
                "transit_time_hours": 30,
                "co2_kg": 1600.0,
                 "description": "Fly stock from backup supplier in Shanghai"
            }
        ]
    else:
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
                "transit_time_hours": 120, 
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

@router.post("/actions/reroute")
async def reroute_shipment(payload: RerouteRequest, session: Session = Depends(get_session)):
    shipment = session.exec(select(Shipment).where(Shipment.id == payload.shipment_id)).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    # Analyze the Intent
    new_route_id = payload.new_route_id.upper()
    is_replacement = "REPLACEMENT" in new_route_id or "ALT-ORIGIN" in new_route_id
    
    # Determine New Mode based on ID keywords or default
    new_mode = shipment.transport_mode # Default to current
    if "AIR" in new_route_id:
        new_mode = "Air"
    elif "SEA" in new_route_id:
        new_mode = "Sea"
    elif "TRUCK" in new_route_id:
        new_mode = "Truck"
    elif "RAIL" in new_route_id:
        new_mode = "Rail"
        
    # LOGIC RULE: 
    # If Mode Changes OR it is an explicit Replacement -> CLONE (New Shipment, Mitigate Old)
    # If Mode is Same (and not replacement) -> MUTATE (Update Old)
    
    if new_mode != shipment.transport_mode or is_replacement:
        # --- PATH A: CLONE & REPLACE (New Sourcing) ---
        
        # 1. Determine Origin for New Shipment
        # Logic: Always start from the Origin Node (Port/Warehouse)
        # This implies we are shipping NEW inventory to replace the stuck goods.
        
        # Default to same origin
        new_origin_id = shipment.origin_id 
        
        # Handle Alt Origin Logic
        if "ALT-ORIGIN" in new_route_id:
             new_origin_id = "PORT-SHA" # Default Backup
             if shipment.origin_id == "PORT-SHA":
                 new_origin_id = "PORT-RTM"
        
        # Look up Node Location (Crucial: New shipment starts at the Node, not at sea)
        origin_node = session.exec(select(Node).where(Node.id == new_origin_id)).first()
        start_loc = origin_node.location if origin_node else {"lat": 0, "lon": 0}

        # 2. Generate New ID
        unique_suffix = uuid.uuid4().hex[:6]
        # E.g. SH-1001-AIR-RESCUE-a1b2
        reason_tag = "REP" if is_replacement else "RESCUE"
        new_id = f"{shipment.id}-{new_mode.upper()}-{reason_tag}-{unique_suffix}"
        
        # 3. Create start location with visual offset (approx 30km)
        # This prevents the new 'Green' dot from perfectly overlapping the old 'Red' dot
        offset_lat = start_loc.get("lat", 0) + 0.3
        offset_lon = start_loc.get("lon", 0) + 0.3
        new_start_loc = {"lat": offset_lat, "lon": offset_lon}
        
        # 4. Create New Shipment
        new_shipment = Shipment(
            id=new_id,
            status="In-Transit",
            transport_mode=new_mode,
            priority="Critical" if new_mode == "Air" else "Normal",
            current_location=new_start_loc, 
            origin_id=new_origin_id,
            destination_id=shipment.destination_id,
            contents=shipment.contents,
            total_value_at_risk=shipment.total_value_at_risk
        )
        session.add(new_shipment)
        
        # 4. Mitigate Old Shipment
        shipment.status = "Mitigated"
        session.add(shipment)
        
        session.commit()
        
        return {
            "status": "success", 
            "message": f"Action {new_route_id} executed. Original {shipment.id} is Mitigated. New Shipment {new_id} created via {new_mode}.",
            "new_shipment_id": new_id
        }

    else:
        # --- PATH B: MUTATE (Reroute same vehicle) ---
        shipment.status = "In-Transit"
        # Mode is same, but semantics might imply a detour.
        # Ideally we would update the 'path' but we don't store it yet.
        
        session.add(shipment)
        session.commit()
        session.refresh(shipment)

        return {
            "status": "success", 
            "message": f"Shipment {shipment.id} rerouted (Detour) via {shipment.transport_mode}. Status back to In-Transit."
        }

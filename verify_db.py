
from sqlmodel import Session, create_engine, select
from backend_supply_api.app.models import Shipment

sqlite_file_name = "backend_supply_api/database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
engine = create_engine(sqlite_url)

with Session(engine) as session:
    # Look for the original and any rescues
    original_id = "SH-1001"
    shipments = session.exec(select(Shipment).where(Shipment.id.like(f"{original_id}%"))).all()
    
    print(f"--- Database Check for {original_id} ---")
    for s in shipments:
        print(f"ID: {s.id} | Status: {s.status} | Mode: {s.transport_mode}")

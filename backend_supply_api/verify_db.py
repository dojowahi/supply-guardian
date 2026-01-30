
from sqlmodel import Session, create_engine, select
# Import from app.models assuming we are running inside backend_supply_api
from app.models import Shipment

sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
engine = create_engine(sqlite_url)

with Session(engine) as session:
    # Look for the original and any rescues
    original_id = "SH-1001"
    shipments = session.exec(select(Shipment).where(Shipment.id.like(f"{original_id}%"))).all()
    
    print(f"--- Database Check for {original_id} ---")
    if not shipments:
        print("No shipments found! (Did you restart the backend? DB might have reset)")
    for s in shipments:
        print(f"ID: {s.id} | Status: {s.status} | Mode: {s.transport_mode}")

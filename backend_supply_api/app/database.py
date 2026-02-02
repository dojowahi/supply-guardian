
from sqlmodel import SQLModel, Session, create_engine, select
from pathlib import Path
import json
from .models import Node, Product, Shipment, Disruption

sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

from sqlalchemy.pool import NullPool

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, echo=False, connect_args=connect_args, poolclass=NullPool)

def get_session():
    with Session(engine) as session:
        yield session

DATA_DIR = Path(__file__).parent.parent / "data"

def init_db():
    SQLModel.metadata.create_all(engine)
    
    # Check if data exists
    with Session(engine) as session:
        if not session.exec(select(Node)).first():
            print("Loading initial data into DB...")
            try:
                # Load Nodes
                with open(DATA_DIR / "nodes.json") as f:
                    for item in json.load(f):
                        session.add(Node(**item))
                
                # Load Products
                with open(DATA_DIR / "products.json") as f:
                    for item in json.load(f):
                        session.add(Product(**item))

                # Load Shipments
                with open(DATA_DIR / "shipments.json") as f:
                    for item in json.load(f):
                        session.add(Shipment(**item))

                # Load Disruptions
                with open(DATA_DIR / "disruptions.json") as f:
                    for item in json.load(f):
                        session.add(Disruption(**item))
                        
                session.commit()
                print("Data loaded successfully.")
            except Exception as e:
                print(f"Error loading data: {e}")
        else:
            print("Database already initialized.")


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .routes import network, shipments, actions

app = FastAPI(title="Supply Guardian API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect Routes
app.include_router(network.router)
app.include_router(shipments.router)
app.include_router(actions.router)

@app.on_event("startup")
def on_startup():
    init_db()

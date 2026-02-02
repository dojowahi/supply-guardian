
# Master Prompt: Regenerate Supply Guardian Backend & Data

**Role**: You are an expert Senior Backend Engineer & Data Architect.
**Objective**: Build a complete, modular FastAPI backend for the "Supply Guardian" logistics simulation, including the source code (Python) and the seed data (JSON).

---

## Part 1: The Codebase Requirements

**Tech Stack**: Python 3.10+, FastAPI, SQLModel (SQLite), Pydantic.
**Project Structure**:
```text
backend_supply_api/
├── app/
│   ├── main.py        # App entry point, Router inclusion
│   ├── database.py    # DB Setup, `init_db` loader function
│   ├── models.py      # SQLModel Tables & Pydantic Schemas
│   └── routes/
│       ├── network.py   # Nodes & Disruptions Endpoints
│       ├── shipments.py # Shipments & Products Endpoints
│       └── actions.py   # Business Logic (Quotes & Rerouting)
└── data/              # JSON Seed Data
    ├── nodes.json
    ├── products.json
    ├── shipments.json
    └── disruptions.json
```

**Business Logic Rules (CRITICAL)**:
1.  **Database**: Use SQLite (`database.db`).
    *   **CRITICAL**: Use `poolclass=NullPool` in `create_engine` to avoid connection timeouts in multi-threaded/async environments like Cloud Run (since SQLite doesn't handle pooling well).
    *   **Deployment**: Ensure a `.dockerignore` file exists and excludes `database.db` so that everyday deploys to Cloud Run start with a fresh state (reloading from JSON).
    *   On startup, check if tables are empty. If yes, load data from `data/*.json` into the DB tables.
2.  **Quotations (`GET /actions/quotes/{id}`)**:
    *   Calculate generic "Air" (Expensive, Fast) vs "Sea" (Cheap, Slow) options based on `shipment.total_value_at_risk`.
    *   **Disruption Awareness**: If a shipment is within `radius_km` of a "Strike" disruption, do NOT offer standard Air/Sea options from that location. Instead, offer "Alt-Origin" options (e.g., source from Shanghai instead).
3.  **Rerouting (`POST /actions/reroute`)**:
3.  **Rerouting (`POST /actions/reroute`)**:
    *   **Logic Rule**: Check `new_mode` vs `current_mode`.
    *   **Same Mode (Mutate)**:
        *   If mode is unchanged (e.g., Sea -> Sea), update the *existing* record: `status="In-Transit"`.
    *   **Different Mode OR Replacement (Clone)**:
        *   If mode changes (e.g., Truck -> Air, Sea -> Air) OR it is an explicit "Replacement" (Alt-Origin):
        *   **Create NEW Shipment**: New ID (`original_id + "-[MODE]-RESCUE-" + uuid`), Status=`In-Transit`.
            *   *Location Logic*: Always start from the **Origin Node** (implying new inventory sent from source). Add small visual offset.
        *   **Mitigate OLD Shipment**: Set original record `status="Mitigated"`.
        *   Return `{ "new_shipment_id": "..." }`.

---

## Part 2: The Data Generation Requirements (JSON)

Generate realistic seed data for `data/` folder.

**1. `nodes.json` (~14 items)**:
*   **Ports**: LAX (`PORT-LAX`), Shanghai (`PORT-SHA`), Singapore (`PORT-SIN`), Rotterdam (`PORT-RTM`), Qingdao (`PORT-QING`), Santos (`PORT-STS`).
*   **Warehouses**: Denver (`WH-DEN`), Chicago (`DC-CHI-01`), Dallas (`DC-DAL-01`), Miami (`DC-MIA-01`).
*   **Stores**: Atlanta (`STORE-ATL-01`), Minneapolis (`STORE-001`), Seattle (`STORE-SEA-01`).
*   Include realistic `lat/lon`.

**2. `products.json` (~5 items)**:
*   `GROC-PER-005`: "Premium Coffee" (Non-seasonal, Low Value).
*   `ELEC-GAME-001`: "PlayStation 5 Pro" (Seasonal, High Value, Critical).
*   `CLOTH-TSHIRT-001`: "Basic T-Shirt" (Non-seasonal).

**3. `disruptions.json` (3 active events)**:
*   **"Pacific Typhoon"**: Large radius, affects Sea/Air in Pacific.
*   **"Singapore Port Strike"**: Affects Sea only at Singapore.
*   **"Midwest Blizzard"**: Affects Truck/Rail near Chicago.

**4. `shipments.json` (20+ items)**:
*   **Must include Scenario Shipments**:
    *   `SH-1002`: "Stuck" at Singapore (Coffee, Normal Priority).
    *   `SH-1001`: "Stuck" near Typhoon (PS5, Critical Priority).
*   **General Traffic**:
    *   Mix of `In-Transit`, `Delivered`, `Stuck`.
    *   Mix of `Air`, `Sea`, `Truck`.
    *   Ensure `origin_id` and `destination_id` match valid Nodes.
    *   Ensure `contents` use valid Product SKUs.

---

## Response Format

Please provide the full content for:
1.  `models.py`
2.  `database.py`
3.  `routes/network.py`
4.  `routes/shipments.py`
5.  `routes/actions.py`
6.  `main.py`
7.  The 4 JSON data files.

Ensure the code is copy-paste ready and error-free.

# Prompt for Generating Supply Guardian Data

**Context**: You are an expert Data Engineer for a logistics simulation game.
**Task**: Re-generate the JSON datasets for the `backend_supply_api` based on the project documentation.

**Instructions**:
1.  **Read Source of Truth**:
    *   Read `docs/API.md` to understand the Data Models (`Node`, `Shipment`, `Product`, `Disruption`).
    *   Read `docs/GAME_PLAY.md` to understand the specific scenarios ("Coffee Crisis" and "Inland Challenge") that MUST be present.

2.  **Generate Files in `backend_supply_api/data/`**:
    *   `nodes.json`: Create ~10 nodes including:
        *   **Ports**: Shanghai (`PORT-SHA`), LA (`PORT-LAX`), Singapore (`PORT-SIN`), Rotterdam (`PORT-RTM`).
        *   **Warehouses**: Denver (`WH-DEN`), Dallas (`DC-DAL-01`), Chicago (`DC-CHI-01`).
        *   **Stores**: Minneapolis (`STORE-001`), Atlanta (`STORE-ATL-01`).
    *   `products.json`: Create ~5 products including:
        *   `GROC-PER-005` (Coffee, Non-Seasonal, Low Value).
        *   `ELEC-GAME-001` (Console, Seasonal, High Value).
        *   `CLOTH-TSHIRT-001` (T-Shirt, Non-Seasonal).
    *   `disruptions.json`: Create 3 active events:
        *   Pacific Typhoon (Affects Sea/Air).
        *   Singapore Port Strike (Affects Sea, causes "Coffee Crisis").
        *   Midwest Blizzard (Inland Challenge).
    *   `shipments.json`: Create 20+ shipments mixing:
        *   **Scenario Specific**:
            *   `SH-1002`: Stuck at Singapore (Coffee).
            *   `SH-1001`: Stuck at SHA (PlayStation).
            *   `SH-CHI-ATL`: Delayed Truck from Chicago to Atlanta.
        *   **Filler Traffic**:
            *   ~40% **Sea** (Pacific routes).
            *   ~30% **Truck** (US Inland).
            *   ~20% **Air** (Global, High Priority).
            *   ~10% **Rail** (US Inland, cheap).

3.  **Strict Logic Constraints (Import Model)**:
    *   **Global Flow**: All International shipments must originate OUTSIDE the US and target `PORT-LAX` or `PORT-NYC`. No US-to-International exports.
    *   **Rail Rules**:
        *   Rail can **only** operate between a `Port` and a `Warehouse`.
        *   Rail cannot serve `Stores`.
    *   **Truck Rules**:
        *   Trucks can operate anywhere inland.
        *   **Stores** are served **exclusively** by Trucks (from Warehouses or Ports).
    *   **Sea Rules**:
        *   Must be strictly Port-to-Port (Origin Port -> US Port).
    *   **Air Rules**:
        *   Can connect **any Port or Warehouse** (Long distance speed).
        *   **No Air to Stores** (Stores are Truck-only).
        *   Must be largely assigned to `priority: "Critical"` shipments.

4.  **Referential Integrity**:
    *   `origin_id`, `destination_id`, and `sku` MUST exist in `nodes.json` and `products.json`.
    *   Use realistic Lat/Lon coordinates (e.g., Don't put Trucks in the Pacific Ocean).

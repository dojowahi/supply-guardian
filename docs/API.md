# 🦅 Supply Guardian API & Data Reference

Welcome to the **Target Supply Guardian Hackathon**. This document serves as your "Field Guide" to the data and APIs available for building your Agents and UIs.

---

## 🌍 Generated Data Models (The "World State")

The simulation runs on a set of interconnected JSON datasets found in `backend_supply_chain/data/`.

> **Note on Persistence**: The backend uses an in-memory or ephemeral SQLite database (`database.db`). On Cloud Run, this database is **reset to the initial JSON seed data** every time a new revision is deployed or the container restarts. We have explicitly excluded `database.db` from the Docker build (via `.dockerignore`) to enforce this "clean slate" behavior.

### 1. ⚓ Nodes (`nodes.json`)
Represents the physical infrastructure of the supply chain network.
*   **Roles**:
    *   `Port`: Entry points for international freight (e.g., LAX, Shanghai).
    *   `Warehouse`: Distribution centers (DCs) that fulfill store orders.
    *   `Store`: Retail locations (Final destinations).
*   **Key Fields**:
    *   `id`: Unique identifier (e.g., `PORT-LAX`).
    *   `location`: `{ lat, lon }` coordinates for mapping.
    *   `capacity_tier`: 1 (Mega-Hub) to 3 (Small Store).

### 2. 📦 Shipments (`shipments.json`)
The live "inventory in motion." This is the primary dataset your Agents will monitor.
*   **Key Fields**:
    *   `status`: The heartbeat of the simulation.
        *   `In-Transit` 🟢: Moving normally.
        *   `Stuck` 🔴: Stopped by a disruption (Needs Agent Intervention!).
        *   `Delayed` 🟡: Moving slow.
    *   `transport_mode`: `Sea` 🚢, `Air` ✈️, `Truck` 🚛.
    *   `priority`: `Normal` vs `Critical` (Critical items like "Seasonal Clothing" must not be late).
    *   `current_location`: Real-time `{ lat, lon }`.
    *   `contents`: List of SKUs and quantity inside the container.
    *   `total_value_at_risk`: Total value of the shipment (Used to calculate Total Value at Risk).

### 3. 🌩️ Disruptions (`disruptions.json`)
The "Chaos" events that trigger the need for AI.
*   **Logic**: If a Shipment enters the `radius_km` of a Disruption, it gets "Stuck."
*   **Key Fields**:
    *   `type`: `Labor Strike`, `Weather`, `Geopolitical`.
    *   `location`: Center point of the event.
    *   `radius_km`: Zone of impact.
    *   `affected_modes`: E.g., A "Port Strike" affects `Sea` but not `Air`.

### 4. 🏷️ Products (`products.json`)
Business context for decision making.
*   **Key Fields**:
    *   `sku`: Unique identifier (e.g., `GROC-PER-005`).
    *   `name`: Human-readable name (e.g., "Premium Coffee").
    *   `unit_value`: Cost per item (Used to calculate Total Value at Risk).
    *   `is_seasonal`: `true` means high urgency (cannot miss the holiday season).

### 5. 🔗 Entity Relationships

*   **Shipment ➡ Products** (`1:N`):
    *   A Shipment's `contents` array contains SKUs that link to the `Products` table.
    *   *Usage*: lookup `product.unit_value` * `quantity` to calculate financial risk.

*   **Disruption ➡ Shipment** (`Spatial`):
    *   Disruptions do not have a foreign key to shipments.
    *   The relationship is **geometric**: `distance(shipment.loc, disruption.loc) < disruption.radius`.

*   **Shipment ➡ Node** (`Routing`):
    *   Shipments move geographically between Nodes (e.g., Shanghai Port -> LA Port).

---

## 📡 API Endpoints

The backend runs on **FastAPI** at `http://localhost:8000`. Swagger docs are at `/docs`.

### 👁️ Visibility (Read-Only)

#### `GET /network/nodes`
Returns the list of all static facilities (Ports, DCs, Stores) to plot on your map.

#### `GET /shipments`
Returns the real-time list of all moving goods.
*   **Query Param**: `?status=Stuck` (Filter to find only problem shipments).
*   **Use Case**: Your Agent should poll this to detect anomalies.

#### `GET /network/disruptions`
Returns active crisis zones (Red Circles on the map).

#### `GET /products`
Returns the catalog details.

---

### 🧠 Agent Intelligence (Reasoning & Action)

#### `GET /actions/quotes/{shipment_id}`
**The "Expedia" for Logistics.**
When a shipment is stuck, call this to get a list of valid rescue options.
*   **Response Example**:
    ```json
    {
      "shipment_id": "SH-1001",
      "options": [
        {
          "id": "OPT-AIR-SFO",
          "type": "Expedite (Air)",
          "cost_usd": 5000,
          "transit_time_hours": 24,
          "co2_kg": 1200
        },
        {
          "id": "OPT-SEA-SEA",
          "type": "Reroute (Sea)",
          "cost_usd": 800,
          "transit_time_hours": 96,
          "co2_kg": 150
        }
      ]
    }
    ```
*   **Agent Challenge**: Should the Agent spend $5,000 to save the shipment (Air) or save money and arrive late (Sea)? The answer depends on `products.value` and `is_seasonal`.

#### `POST /actions/reroute`
**The "Red Button."**
Executes the decision and updates the simulation state.
*   **Payload**:
    ```json
    {
      "shipment_id": "SH-1001",
      "new_route_id": "OPT-AIR-SFO"
    }
    ```
*   **Effect**:
*   **Effect**:
    1.  **Mode Change or Replacement (Clone)**:
        *   If `new_mode` != `current_mode` (e.g., Sea -> Air, Truck -> Air) OR if it is a Replacement:
        *   Creates a **New Shipment** (`In-Transit`) with ID `SH-1001-MODE-RESCUE-xyz`.
        *   Updates **Old Shipment** Status -> `Mitigated`.
        *   Returns `{ "new_shipment_id": "..." }`.
    2.  **Same Mode Reroute (Mutate)**:
        *   If mode is unchanged (e.g., Sea -> Sea Divert):
        *   Updates existing Shipment Status -> `In-Transit`.
    3.  Updates Simulation -> Goods start moving again!

---

## 🎯 Hackathon Challenges

### Track 1: The UI Builder (Vibe Coding)
*   **Goal**: Build a "Mission Control" Dashboard.
*   **Task**:
    1.  Fetch `nodes` and `shipments` to render a 3D Earth or 2D Map.
    2.  Visualize "Value at Risk" (Sum of all stuck shipments).
    3.  Show a "Red Alert" toast when a new Disruption appears.

### Track 2: The Agent Architect (Google ADK)
*   **Goal**: Build an Autonomous "Controller" Agent.
*   **Loop**:
    1.  **Monitor**: Poll `/shipments?status=Stuck`.
    2.  **Analyze**: For every stuck shipment, fetch `/actions/quotes/{id}`.
    3.  **Decide**: If `value > $10,000` AND `time_critical=true`, choose `Air`. Else, choose `Sea`.
    4.  **Act**: Call `/actions/reroute` to fix it.

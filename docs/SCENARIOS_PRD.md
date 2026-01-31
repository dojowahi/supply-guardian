# Supply Guardian - Scenario Logic & PRD

## 1. Overview
This document defines the core logistics scenarios, disruption types, and the specific business logic for resolving them within the Supply Guardian simulation. It serves as the reference for Agent behavior and Backend logic.

## 2. Core Scenarios

### Scenario A: The Pacific Typhoon (High Value, High Urgency)
*   **Context**: A container ship (`SH-1001`) carrying critical goods (PS5 Consoles) is stuck in the Pacific Ocean due to a typhoon.
*   **Disruption Type**: Weather / Natural Disaster.
*   **Logic Constraints**:
    *   Ship cannot move forward.
    *   "Sea Reroute" is too slow (10+ days).
    *   **"Unload & Fly" is IMPOSSIBLE** (cannot unload ship in a typhoon).
*   **Available Resolutions**:
    1.  **Emergency Replacement Air (Winner)**:
        *   *Action*: `OPT-REPLACEMENT-AIR`
        *   *System Effect*: **CLONE & RESCUE**.
        *   *Result*: Original `Mitigated`. New Air shipment created from **Origin Port**.
    2.  **Sea Reroute (Loser)**:
        *   *Action*: `OPT-SEA-REROUTE`
        *   *System Effect*: **MUTATE**.
        *   *Result*: Status `In-Transit`, but arrival time delayed significantly.

### Scenario B: The Coffee Crisis (Low Value, Low Urgency)
*   **Context**: A ship (`SH-1002`) carrying coffee beans is stuck at Singapore Port due to a Labor Strike.
*   **Disruption Type**: Labor Strike / Port Closure.
*   **Logic Constraints**:
    *   Cargo is trapped at the port. Cannot be retrieved.
    *   Cannot use the same origin port for new shipments.
*   **Available Resolutions**:
    1.  **Alt-Origin Sourcing (Winner)**:
        *   *Action*: `OPT-ALT-ORIGIN-SEA` (e.g., source from Shanghai).
        *   *System Effect*: **CLONE & REPLACE**.
        *   *Result*: Original `Mitigated`. New Sea shipment created from **Shanghai**.
    2.  **Wait it Out**:
        *   *Action*: Do nothing.
        *   *Result*: Shipment remains `Stuck`.

### Scenario C: The Stuck Truck (Inland Rescue)
*   **Context**: A truck (`SH-GEN-215`) is stuck near Nashville due to a blizzard or breakdown.
*   **Disruption Type**: Inland Logistics Failure.
*   **Logic Constraints**:
    *   Sea options are **Invalid** (cannot put a boat on a highway).
    *   Truck cannot move.
*   **Available Resolutions**:
    1.  **Warehouse Rescue (Standard)**:
        *   *Action*: `OPT-REPLACEMENT-TRUCK-{WarehouseID}`
        *   *Logic*: System finds nearest Warehouse (that is NOT the destination).
        *   *System Effect*: **CLONE & RESCUE**.
        *   *Result*: Original `Mitigated`. New Truck shipment starts from **Nearest Warehouse**.
    2.  **Air Expedite (Critical)**:
        *   *Action*: `OPT-AIR-EXPEDITED`
        *   *System Effect*: **CLONE & RESCUE**.
        *   *Result*: New Air shipment starts from **Origin Node** (or nearest airport logic).

### Scenario D: The Rail Failure
*   **Context**: A train (`SH-GEN-217`) is stalled in the Midwest.
*   **Similar to Truck**, but involves intermodal rescue (Trucks sent to offload train).

## 3. System Logic Matrix

| Condition | Action Type | Implementation | Origin Logic |
| :--- | :--- | :--- | :--- |
| **Sea → Sea** | Reroute / Divert | **Mutate** (Update existing) | N/A (Continues) |
| **Sea → Air** | Expedite | **Clone** (New ID) | **Origin Port** |
| **Any → Alt Origin** | Sourcing Change | **Clone** (New ID) | **New Origin Port** |
| **Truck → Truck** | Rescue | **Clone** (New ID) | **Nearest Warehouse** |
| **Rail → Truck** | Rescue | **Clone** (New ID) | **Nearest Warehouse** |
| **Truck → Air** | Expedite | **Clone** (New ID) | **Origin Node** |

## 4. Technical Implementation Notes
*   **Cloning**: All "Rescue" operations mark the old shipment as `Mitigated` (or `Abandoned` if totally lost) and create a fresh shipment record with `status="In-Transit"`.
*   **Visuals**: New shipments start with a small ~30km geographic offset if starting from the same location, to distinguish them on the map.
*   **Filtering**: `get_quotes` strictly filters specific modes (e.g., no Sea for Inland).
*   **History**: The `Mitigated` shipment remains in the DB for analytics ("How many shipments failed?").

## 5. Assumptions & Constraints
*   **Infinite Inventory**: We assume all Warehouses and Ports act as "Safety Stock" locations and hold infinite inventory of all SKUs. This allows us to "Reroute" (Resupply) from any node without checking stock levels.
*   **Asset Availability**: We assume trucks, planes, and ships are always available for booking (no wait times for availability).
*   **Simplification**: "Air Expedite" always ships from the **Original Source** (or nearest major hub implication), rather than dealing with the complexity of "drayage to nearest local airport".

## 6. Decision Framework (Trade-offs)
The Agent uses this rubric to decide between options:

| Option | Speed | Cost | CO2 | Best For... |
| :--- | :--- | :--- | :--- | :--- |
| **Sea Reroute** | Slow (Low) | Low | Low | Low Value / Non-Urgent items (e.g., T-Shirts) |
| **Air Expedite** | Fast (High) | High (5x Sea) | High | Critical / High Value items (e.g., PS5, Medicine) |
| **Warehouse Rescue** | Medium | Medium | Medium | Inland failures where Speed is needed but Air is too pricey |
| **Alt Origin** | Medium | Medium | Medium | When the original source is totally blocked (e.g. Strike) |

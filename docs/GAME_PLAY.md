# 🎮 Supply Guardian: Gameplay Scenario

This document outlines the core "Game Loop" for the hackathon. It describes the lifecycle of a problem (Disruption) and how the User/Agent is expected to solve it using the provided data and APIs.

---

## 🎬 The Scenario: "The Coffee Crisis"

**Situation**: A shipment of premium coffee beans is en route from Singapore to New York.
**The Event**: A sudden labor strike hits the Port of Singapore, grounding all naval traffic.
**The Hero**: Your AI Agent (or Human Operator via UI).

---

## 🔄 The Game Loop

### 1. 🚨 Detection (The Trigger)
The system is monitoring the `shipments.json` feed. Suddenly, a shipment status changes.

*   **API Poll**: `GET /shipments?status=Stuck`
*   **The Artifact**:
    ```json
    {
      "id": "SH-1002",
      "origin_id": "PORT-SIN",
      "destination_id": "PORT-NYC",
      "status": "Stuck",           // <--- RED ALERT!
      "transport_mode": "Sea",
      "priority": "Normal",
      "contents": [
        { "sku": "GROC-PER-005", "value_usd": 12.00, "qty": 2800 }
      ]
    }
    ```
*   **Agent Logic**: "I see Shipment 1002 is `Stuck`. I must investigate."

### 2. 🧠 Investigation (The Context)
The Agent gathers facts to make a decision.

*   **Fact 1 (Disruption)**: Call `GET /network/disruptions`.
    *   *Finding*: "Labor Strike at Port of Singapore. Sea freight is blocked."
*   **Fact 2 (Product)**: Inspect `contents`.
    *   *Finding*: "Commodity: Coffee Beans. Value: Low ($12/unit). Seasonality: False."
*   **Agent Logic**: "This is **not** a high-priority medical shipment. I should optimize for **Cost**, not just Speed."

### 3. 💡 Exploration (The Options)
The Agent asks the marketplace for solutions.

*   **API Call**: `GET /actions/quotes/SH-1002`
*   **The Market Response**:
    ```json
    {
      "options": [
        {
          "id": "OPT-AIR-001",
          "type": "Expedite (Air)",
          "cost_usd": 5000.00,
          "transit_time_hours": 24,
          "risk_score": 10
        },
        {
          "id": "OPT-SEA-002",
          "type": "Reroute (Sea - Alternate Port)",
          "cost_usd": 800.00,
          "transit_time_hours": 120,
          "risk_score": 30
        }
      ]
    }
    ```

### 4. ⚖️ Decision (The Reasoning)
This is the "Brain" of the hackathon track.

*   **Human Logic**: "I'm not paying $5,000 to ship $2,000 worth of coffee. That destroys our margin!"
*   **AI Logic (The Code)**:
    ```python
    if shipment.value_total > quote.cost_usd * 2:
        return select_option("Air") # Protect High Value
    else:
        return select_option("Sea") # Protect Margin
    ```
*   **Verdict**: The Agent chooses **Option 2 (Sea)**.

### 5. 🛠️ Execution (The Fix)
The Agent commits the action to the real world.

*   **API Call**: `POST /actions/reroute`
*   **Payload**:
    ```json
    {
      "shipment_id": "SH-1002",
      "new_route_id": "OPT-SEA-002"
    }
    ```

### 6. ✅ Outcome (The Reward)
The Simulation updates immediately.

1.  **Status Update**: `SH-1002` status flips from `Stuck` 🔴 to `In-Transit` 🟢.
2.  **UI Feedback**: The dot on the map turns Green and starts moving toward the new intermediate port.
3.  **Score**: The Participant earns points for "Margin Protection" (because they chose the cheap option).

---

## 🧩 Advanced Challenge: The "Inland" Scenario

**Situation**: A shipment is stuck at **Chicago DC** (`DC-CHI-01`) trying to get to **Atlanta** (`STORE-ATL-01`).
**Constraint**: You cannot use "Sea" freight in the middle of America.
**The Task**:
1.  User updates the backend `get_quotes` logic.
2.  Agent must now choose between **Rail** (Cheap, Slow) vs. **Truck** (Fast, Expensive).
3.  Agent must verify `new_route_id` contains `RAIL` or `TRUCK`.

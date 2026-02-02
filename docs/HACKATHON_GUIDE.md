# Retail AI Hackathon: Supply Chain Guardian

Welcome, Builders! 🚀

Your mission, should you choose to accept it, is to save the world's supply chain from chaos. We have provided you with a live **Supply Chain Data API**. Your goal is to build a solution—spanning from visualization to autonomous AI decision-making—to navigate a series of simulated crises (strikes, weather events, pirate attacks).

## 🛠️ Your Toolbox

### 1. The Data Core (Backend API)
You are given a fully functional Backend API. This is your source of truth.
*   **Base URL:** `https://backend-supply-api-926877739989.us-central1.run.app`
*   **Interactive Docs (Swagger):** [View API Docs](https://backend-supply-api-926877739989.us-central1.run.app/docs)

**Key Endpoints:**
*   `GET /shipments`: List all active shipments (look for `status="Stuck"`!).
*   `GET /network/ports`: Get the geo-locations of all global ports.
*   `GET /actions/reroute`: (Simulation) Calculate costs to move goods from Port A to Port B.

### 2. The Assistant (AI Pair Programmer)
You will be using **Gemini CLI** or **Antigravity** to accelerate your development. Use it to:
*   Scaffold your React/Python projects instantly.
*   Generate complex API-calling code.
*   Debug errors in real-time.

---

## 🚦 Choose Your Path

Select one of the following tracks based on your team's strengths.

### Path 1: The Visibility Engine (Frontend Focus) 🌍
**"You can't fix what you can't see."**
Active tracking of global freight is currently a spreadsheet nightmare. Your job is to bring it to life.

*   **The Goal:** Build a Supply Chain UI Dashboard.
*   **Core Requirements:**
    1.  **Interactive Map:** Use the `/network/ports` data to plot ports on a world map (suggested: Leaflet or Mapbox).
    2.  **Shipment Tracking:** Visualize shipment routes. Color-code them (e.g., 🔴 for Stuck, 🟢 for Moving).
    3.  **The "Red Phone":** Create a prominent alert section for shipments that are `Delayed` or `Stuck`.
*   **Tech Stack:** React, Vite, TailwindCSS (Recommended).

### Path 2: The Crisis Analyst (Agent Focus) 🧠
**"Data without insight is just noise."**
The dashboard shows a problem, but what's the solution? Your agent will be the brain.

*   **The Goal:** Build a "Supply Chain Crisis Agent" driven by an LLM (Gemini).
*   **Core Requirements:**
    1.  **Investigative Skill:** The agent effectively queries the `GET /shipments` API to find problems without human prompting.
    2.  **Strategic Reasoning:** When a shipment is stuck at "Port of Singapore", the agent checks available routes and uses `GET /actions/reroute` to find alternatives.
    3.  **Decision Support:** The agent presents a clear recommendation: *"Reroute Shipment #123 via Air Freight to Tokyo ($5k cost, +2 days vs Sea Freight)."*
*   **Tech Stack:** Python, Google Gen AI SDK / Vertex AI.

### Path 3: The Command Center (Full Stack Integration) 🚀
**"The Ultimate Guardian."**
Combine visibility and intelligence into a unified command center. This is the hardest and most rewarding path.

*   **The Goal:** An interactive UI where the AI Agent lives alongside the data.
*   **Core Requirements:**
    1.  **Context-Aware Chat:** When a user clicks a red dot on the map, the Agent sidebar opens *already knowing* the context of that shipment.
    2.  **Human-in-the-Loop:** The Agent proposes a reroute; the User clicks "Approve"; the UI updates to show the new route instantly.
    3.  **Seamless Experience:** No copy-pasting JSON. The Agent calls the API, and the UI reflects the changes.
*   **Tech Stack:** React Frontend + Python Agent Backend (FastAPI/Flask or Google ADK).

---

## 🏆 Winning Criteria

1.  **Utility:** Does it actually help a logistics manager solve a problem?
2.  **Aesthetics:** Does the UI look modern and professional? (No default browser buttons!)
3.  **Agent Logic:** Does the AI hallucinate routes, or does it ground its answers in the provided API data?
4.  **Integration:** (Path 3) How smooth is the hand-off between UI and AI?

Good luck, Guardians! The supply chain is counting on you.

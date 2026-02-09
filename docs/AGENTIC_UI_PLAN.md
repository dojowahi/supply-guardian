
# Master Plan — ADK-Based Supply Guardian Agentic UI

## 1) Overview
- **Goal**: Create a new `agentic_ui` that retains all features of the existing `frontend_supply_api` (Map, Dashboard, Shipments) but introduces a dedicated "Agent Command Center" with a **2-pane layout**.
- **Core Pattern**:
  - **Left Pane (Snapshot/Context)**: Visualizes the "World State" relevant to the conversation. It updates dynamically by refetching data from the backend after agent actions.
  - **Right Pane (Chat)**: A conversational interface to interact with the `SupplyAgent`.
  - **Map Control**: The agent can autonomously control the map view (pan/zoom) to focus on specific shipments, nodes, or regions using structured tokens.
- **Tech Stack**:
  - **Frontend**: Vite + React + Tailwind CSS + Framer Motion + Lucide React.
  - **Maps**: Google Maps Platform (@vis.gl/react-google-maps).
  - **Backend**: FastAPI (Port 8000) for data, ADK Agent (Port 8081) for reasoning.
  - **Agents**: Google ADK-based `supply_agent` orchestrating `investigative`, `strategize`, and `consult_execute` sub-agents.

## 2) Assumptions
- **Integration**: The new UI acts as the "Pro" or "Agent" view.
- **Permissions**: A "simulation mode" might be required to allow the agent to propose destructive actions.
- **Transport**: REST API (POST) for Agent interaction. The UI polls/refetches the snapshot to reflect state changes.
- **Data Source**: The agent reads/writes to the same SQLModel/SQLite backend as the main app.
- **Google Maps**: Requires a valid API Key in the `.env` file.

## 3) Frontend Plan (Vite + React)

### 3.1 Shared UI/State
- **Layout**:
  - **Navigation**: Sidebar to switch between "Standard View" and "Agent Command Center".
  - **Agent Command Center**:
    - **Split View**: Resizable split pane (Left: Context, Right: Chat).
- **Components**:
  - `SnapshotRenderer`: Dynamic component renderer for:
    - `GoogleShipmentMap`: Focused map view.
    - `StatusCard`: Large status indicators.
    - `ActionPlan`: A timeline or list of proposed actions.
    - `EvidenceTable`: Data rows backing findings.
  - `ChatPane`: Chat interface with "Thinking..." states.

### 3.2 Pages / Views
- **Home/Dashboard**: (Existing) Application overview.
- **Agent Command Center** (`/agent`):
  - **Purpose**: The primary place for complex problem solving.
  - **Left (Snapshot)**:
    - Default: High-level System Health.
    - Dynamic: Context switches based on agent focus (e.g. specific shipment).
  - **Right (Chat)**: Conversation history.

## 4) Backend API Endpoints
- **Data Backend** (Port 8000):
  - `GET /shipments`, `GET /network/disruptions`, `GET /network/nodes`.
- **Agent Backend** (Port 8081):
  - `POST /run`: accepts `user_id`, `session_id`, `app_name`, and `new_message`.
  - `POST /apps/{app_name}/users/{user_id}/sessions`: Create session.

## 5) ADK Plan (Agents & Responsibilities)

The `supply_agent` acts as the Coordinator.

### 5.1 UX-Agent Protocol (Polling)
1. **User**: "Why is shipment XYZ stuck?"
2. **Frontend**: Sends message to Agent (`POST /run`).
3. **Agent**:
   - Analyzes tool outputs.
   - Performs investigations (reads DB).
   - Responds with text: "Shipment XYZ is delayed at Rotterdam due to..."
   - **Optionally** includes `[VIEW: ...]` token to focus the map.
4. **Frontend**:
   - Parses `[VIEW]` token and updates map camera (center/zoom).
   - Displays agent response (stripped of token).
   - **Immediately refetches** `getSnapshot()` from Data Backend.
   - Updates `SnapshotRenderer` with fresh data (e.g. status changes, new delay info).

### 5.2 Agent Roles
- **Coordinator (SupplyAgent)**: Routes to sub-agents.
- **InvestigativeAgent**: Checks data.
- **StrategizeAgent**: Proposes solutions.
- **ConsultExecuteAgent**: Finalizes actions (e.g. Reroute).

## 6) Implementation Status
1. **Setup**: `agentic_ui` initialized with Vite/React.
2. **Backend Services**:
   - Data Backend running on 8000.
   - Agent running on 8081.
3. **Frontend Core**:
   - `useSupplyAgent` hook implemented for Agent interactions + Snapshot fetching.
   - Basic `ChatPane` and layout structure in place.
4. **Integration**:
   - Chat connected to `ADKClient`.
   - Snapshot connected to `BackendClient`.
5. **Next Steps**:
   - Enhance the `SnapshotRenderer` to be smarter about *what* to show (filtering based on context).
   - Improve UI aesthetics (Tailwind polish).

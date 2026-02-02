# Master Plan — ADK-Based Supply Guardian Agentic UI

## 1) Overview
- **Goal**: Create a new `agentic_ui` that retains all features of the existing `frontend_supply_api` (Map, Dashboard, Shipments) but introduces a dedicated "Agent Command Center" with a **2-pane layout**.
- **Core Pattern**:
  - **Left Pane (Snapshot/Context)**: Visualizes the "World State" relevant to the conversation. It updates dynamically based on what the agent is investigating or proposing.
  - **Right Pane (Chat)**: A conversational interface to interact with the `SupplyAgent`, asking questions or requesting interventions.
- **Tech Stack**:
  - **Frontend**: Vite + React + Tailwind CSS + Framer Motion + Lucide React.
  - **Maps**: Google Maps Platform (@vis.gl/react-google-maps) instead of Leaflet.
  - **Backend**: FastAPI (existing) with new SSE endpoints for ADK Agent streaming.
  - **Agents**: Google ADK-based `supply_agent` orchestrating `investigative`, `strategize`, and `consult_execute` sub-agents.

## 2) Assumptions
- **Integration**: The new UI will basically be the "Pro" or "Agent" view of the Supply Guardian app.
- **Permissions**: A "simulation mode" might be required to allow the agent to propose destructive actions (rerouting, cancelling).
- **Transport**: Server-Sent Events (SSE) for real-time streaming of agent thoughts and UI updates.
- **Data Source**: The agent reads from the same SQLModel/SQLite backend as the main app.
- **Google Maps**: Requires a valid API Key in the `.env` file.

## 3) Frontend Plan (Vite + React)

### 3.1 Shared UI/State
- **Layout**:
  - **Navigation**: Sidebar or Topbar to switch between "Standard View" (existing tables/maps) and "Agent Command Center".
  - **Agent Command Center**:
    - **Split View**: Resizable split pane (Left: Context, Right: Chat).
- **Components**:
  - `SnapshotRenderer`: Dynamic component renderer for:
    - `GoogleShipmentMap`: Focused map view of specific routes using Google Maps.
    - `StatusCard`: Large status indicators (e.g., "Critical", "Stable").
    - `ActionPlan`: A timeline or list of proposed actions by the agent.
    - `EvidenceTable`: Data rows backing the agent's findings.
  - `ChatPane`: A familiar chat interface (User vs Agent bubbles) with support for "Thinking..." states and markdown rendering.

### 3.2 Pages / Views
- **Home/Dashboard**: (Existing) Application overview.
- **Agent Command Center** (`/agent`):
  - **Purpose**: The primary place for complex problem solving.
  - **Left (Snapshot)**:
    - Default: High-level System Health (Gauge charts, Alerts list).
    - Dynamic: When discussing a specific shipment (e.g., "Shipment #123"), context switches to show that shipment's map route and timeline details.
  - **Right (Chat)**: Conversation history.

## 4) Backend API Endpoints
- **Existing**: CRUD endpoints for shipments/warehouses.
- **New Agent Endpoints**:
  - `POST /api/agent/chat`: Main entry point. Accepts user message + client context. Streams formatted events.
  - `GET /api/agent/history`: (Optional) Retrieve past conversation.

## 5) ADK Plan (Agents & Responsibilities)

The `supply_agent` will be the Coordinator, orchestrating sub-agents to satisfy user requests and update the UI.

### 5.1 Shared Schemas (Formatter Output)
The agents will emit special "UI Blocks" alongside text.
- `Block = MapView | DataGrid | StatusAlert | PlanProposal`
- `UIUpdate(blocks: Block[])`

### 5.2 Agent Roles
- **Coordinator (SupplyAgent)**:
  - Classification of user intent (Investigation vs Strategy vs Execution).
  - Routes to sub-agents.

- **InvestigativeAgent** (Exists):
  - **Role**: Digs into data.
  - **UI Output**: Emits `DataGrid` (tables of affected items) and `MapView` (focus on specific geo-coordinates).
  - **Example**: "Show me all delayed shipments in Europe." -> Updates Left Pane with a filtered Map and Table.

- **StrategizeAgent** (Exists):
  - **Role**: Proposes solutions.
  - **UI Output**: Emits `PlanProposal` (interactive cards showing "Option A vs Option B").
  - **Example**: "How can we fix the delay?" -> Updates Left Pane with a comparison of "Air Freight (Faster)" vs "Sea Freight (Cheaper)".

- **ConsultExecuteAgent** (Exists):
  - **Role**: Finalizes actions.
  - **UI Output**: Emits `StatusAlert` (Success/Failure confirmation).

### 5.3 UI-Agent Protocol
1. **User**: "Why is shipment XYZ stuck?"
2. **Coordinator**: Routes to `InvestigativeAgent`.
3. **InvestigativeAgent**:
   - Calls `db.get_shipment("XYZ")`.
   - **Streams UI Event**: `{ type: "set_focus", view: "map", target: "XYZ_coords" }`.
   - **Streams Text**: "Shipment XYZ is currently held at Rotterdam Portfolio..."
4. **Left Pane**: Automatically zooms map to Rotterdam and shows shipment details card.
5. **Right Pane**: Shows the text explaining the situation.

## 6) Implementation Order
1. **Setup**:
   - Create `agentic_ui` folder.
   - Install dependencies (copy from `frontend_supply_api` + `react-markdown` + `sse.js`?).
2. **Backend**:
   - Ensure `supply_agent` is exposed via an SSE endpoint in FastAPI.
   - Update Agent to emit structured "UI Events".
3. **Frontend Core**:
   - Build `AgentLayout` and `ChatPane`.
   - Implement `SnapshotRenderer` wireframe.
4. **Integration**:
   - Connect Chat to Backend SSE.
   - Handle basic text streaming.
5. **Features**:
   - Implement "Map Focus" UI event (Agent controls map).
   - Implement "Data Table" UI event.
6. **Polish**:
   - Tailwind styling to match "Premium" aesthetic.
   - Animations for incoming messages and pane updates.

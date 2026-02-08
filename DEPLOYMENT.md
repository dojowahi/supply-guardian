# Supply Guardian Deployment Guide

This guide outlines the steps to deploy the Supply Guardian application (Backend, Agents, and Frontend) to **Google Cloud Run**.

## 🚀 Recommended Method: Automated Deployment Script

The easiest way to deploy all services correcty is to use the included script. It handles enabling APIs, service account impersonation, environment variables, and sequencing.

```bash
./deploy.sh
```

To redeploy everything from scratch (e.g., if you renamed services):

```bash
./deploy.sh --redeploy-all
```

---

## Manual Deployment Steps via CLI

If you prefer to deploy services manually, follow these steps.

### Prerequisites

*   Google Cloud SDK (`gcloud`) installed and authenticated.
*   A Google Cloud Project with billing enabled.

### 1. Setup & Configuration

Set your project ID and region variables for convenience:

```bash
export PROJECT_ID="your-project-id"
export REGION="us-central1"

gcloud config set project $PROJECT_ID
```

Enable the necessary APIs:

```bash
gcloud services enable run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com
```

---

### 2. Deploy Backend API

The backend must be deployed first because other services depend on its URL.
*Note: The current backend uses SQLite, which is ephemeral. Data will reset if the container restarts.*

**Run from the project root:**

```bash
gcloud run deploy hackathon-supply-backend \
    --source ./backend_supply_api \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080
```

**✅ Save the Backend URL:**
After deployment, copy the Service URL (e.g., `https://hackathon-supply-backend-xyz.run.app`). We will refer to this as `[BACKEND_URL]`.

---

### 3. Deploy Agents Services

The `agents` directory contains the AI agents powered by the Google Agent Development Kit (ADK). We will deploy two services from this same source:

1.  **Agents API**: The programmatic interface used by other apps (`agentic_ui`).
2.  **Agents Dev UI**: The ADK "Mission Control" interface for debugging.

#### 3a. Deploy Agents API

This service exposes the agent endpoints.

**Run from the project root:**

```bash
gcloud run deploy hackathon-supply-agents-api \
    --source ./agents \
    --region $REGION \
    --allow-unauthenticated \
    --port 8081 \
    --set-env-vars "BACKEND_URL=[BACKEND_URL],GOOGLE_API_KEY=[YOUR_API_KEY]" \
    --command "uv" \
    --args "run,adk,api_server,supply_agent,--allow_origins=*,--port=8081,--host=0.0.0.0"
```
*(Replace `[BACKEND_URL]` and `[YOUR_API_KEY]` as before. Note we override the command to run `api_server`)*

**✅ Save the Agents API URL:**
Copy the Service URL (e.g., `https://hackathon-supply-agents-api-xyz.run.app`). We will refer to this as `[AGENT_API_URL]`.

#### 3b. Deploy Agents Dev UI

This service exposes the ADK Mission Control.

**Run from the project root:**

```bash
gcloud run deploy hackathon-supply-agents-ui \
    --source ./agents \
    --region $REGION \
    --allow-unauthenticated \
    --port 9090 \
    --set-env-vars "BACKEND_URL=[BACKEND_URL],GOOGLE_API_KEY=[YOUR_API_KEY]" \
    --command "uv" \
    --args "run,adk,web,--port=9090,--host=0.0.0.0"
```

**✅ Verify the Dev UI:**
Open the URL (e.g., `https://hackathon-supply-agents-ui-xyz.run.app`) to see the ADK Developer Console.

---

### 4. Deploy Main Frontend Application

The original Frontend is a React app for the supply chain visualization.

**Run from the project root:**

```bash
gcloud run deploy hackathon-supply-frontend \
    --source ./frontend_supply_api \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --set-env-vars "BACKEND_URL=[BACKEND_URL]"
```

---

### 5. Deploy Agentic UI

This is the new agent-focused user interface. It communicates with the **Agents API** and **Backend**.

**Run from the project root:**

```bash
gcloud run deploy hackathon-supply-agentic-ui \
    --source ./agentic_ui \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --set-env-vars "AGENT_API_URL=[AGENT_API_URL],BACKEND_URL=[BACKEND_URL]"
```
*(Replace `[AGENT_API_URL]` with the URL from Step 3a and `[BACKEND_URL]` from Step 2)*

**✅ Verify Agentic UI:**
Open the deployed URL. It should load and be able to communicate with the agent and display the map.

---

### 6. Verification & Troubleshooting

1.  **Main Frontend**: Check `[BACKEND_URL]` connection.
2.  **Agentic UI**: Check connectivity to `[AGENT_API_URL]` and map data from `[BACKEND_URL]`. Detailed logs in browser console if connection fails.
3.  **Agents API**: You can test `[AGENT_API_URL]/docs` (if enabled) or curl a health endpoint.
4.  **Agents Dev UI**: Should load the ADK dashboard.

#### Common Issues
*   **"502 Bad Gateway"**: Usually means the upstream service (backend or agent-api) is down or the URL env var is incorrect.
*   **"405 Not Allowed" on API calls**: Indicates Nginx proxy misconfiguration or incorrect URL matching.
*   **CORS errors**: The Agents API is deployed with `--allow_origins=*` to permit requests from the Agentic UI. If you see CORS errors, check that flag.
*   **Env Vars**: Ensure paths do not have trailing slashes if not expected, though most proxies handle them.
*   **Data Persistence**: Remember, SQLite (Backend) and In-memory agent state are ephemeral. Deployments reset state.

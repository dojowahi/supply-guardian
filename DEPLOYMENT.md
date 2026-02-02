# Supply Guardian Deployment Guide

This guide outlines the steps to deploy the Supply Guardian application (Backend, Agents, and Frontend) to **Google Cloud Run**.

## Prerequisites

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

## 2. Deploy Backend API

The backend must be deployed first because other services depend on its URL.
*Note: The current backend uses SQLite, which is ephemeral. Data will reset if the container restarts.*

**Run from the project root:**

```bash
gcloud run deploy backend-supply-api \
    --source ./backend_supply_api \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080
```

**✅ Save the Backend URL:**
After deployment, copy the Service URL (e.g., `https://backend-supply-api-xyz.run.app`). We will refer to this as `[BACKEND_URL]`.

---

## 3. Deploy Agents Service

## 3. Deploy Agents Service

The Agents service runs the AI agents using the Google Agent Development Kit (ADK).
**Update:** The deployment is configured to run `adk web`, which exposes **two** interfaces on the same port:
1.  **Agent API**: Accessible by the Frontend and Backend services.
2.  **ADK Developer UI**: A "Mission Control" web interface accessible at the root URL for debugging and interacting with agents manually.

**Run from the project root:**

```bash
gcloud run deploy supply-agents \
    --source ./agents \
    --region $REGION \
    --allow-unauthenticated \
    --port 9090 \
    --set-env-vars "BACKEND_URL=[BACKEND_URL],GOOGLE_API_KEY=[YOUR_API_KEY]"
```
*(Replace `[BACKEND_URL]` with the actual URL from Step 2, and `[YOUR_API_KEY]` with your Google AI Studio API Key)*

**✅ Verify the Agent UI:**
Open the deployed Service URL (e.g., `https://supply-agents-xyz.run.app`). You should see the **ADK Developer Console**.

---

## 4. Deploy Frontend Application

The Frontend is a React app served by Nginx. It needs the Backend URL to validly proxy API requests.

**Run from the project root:**

```bash
gcloud run deploy frontend-supply-app \
    --source ./frontend_supply_api \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --set-env-vars BACKEND_URL=[BACKEND_URL]
```
*(Replace `[BACKEND_URL]` with the actual URL from Step 2)*

---

## 5. Verification

1.  **Open the Frontend URL**: Go to the URL provided by the Frontend deployment step.
2.  **Check Data**: You should see the map, existing ports, and shipments loaded from the backend.
3.  **Test Connectivity**: 
    *   Open your browser developer tools (F12) -> Network tab.
    *   Refresh the page.
    *   Verify that requests to `/network`, `/shipments`, etc., return `200 OK`.

## Troubleshooting

*   **"502 Bad Gateway" on Frontend**: Ensure `BACKEND_URL` is set correctly on the Frontend service. It must validly point to the running Backend Cloud Run service (e.g., `https://...run.app` without a trailing slash usually works best, though the proxy handles it).
*   **Build Fails on "npm ci" (Private Registry)**: If the build fails with 401/403 errors on `npm ci`, check that `package-lock.json` does not contain references to private registries (like `us-npm.pkg.dev`). We have added an `.npmrc` file to `frontend_supply_api/` to force the public registry.
*   **Data Disappears**: This is expected behavior with the SQLite database. Redeploying the backend resets the database to the initial JSON files.

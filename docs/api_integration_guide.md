
# Supply Guardian Agent API Integration Guide

This guide details how external applications (web apps, mobile apps, specialized clients) can programmatically interact with the Supply Guardian Agent.

## Endpoint Configuration

### 1. Local Development
- **Base URL**: `http://localhost:8081`
- **Authentication**: None required locally.

### 2. Cloud Run Deployment (Verified)
Your agent is live and accessible at this URL:

- **Base URL**: `https://supply-agents-926877739989.us-central1.run.app`
- **Authentication**: 
  - **Public**: Check if "Allow unauthenticated invocations" is enabled in Cloud Run console.
  - **Private**: Add `Authorization: Bearer $(gcloud auth print-identity-token)` header.

## Core Endpoint

**POST** `/run`

### Payload Format

The generic `/run` endpoint is used to interact with any agent.

```json
{
  "app_name": "supply_agent",
  "user_id": "user_default",
  "session_id": "session-123",
  "new_message": {
    "role": "user",
    "parts": [
      { "text": "Identify stuck shipments." }
    ]
  },
  "streaming": false
}
```

### Parameters
| Parameter | Description |
| :--- | :--- |
| `app_name` | **`supply_agent`** (Must match the app name in `agent.py`) |
| `user_id` | Unique ID for the user (e.g., `user_default`) |
| `session_id` | Unique ID for the conversation (e.g., `session-123`) |
| `new_message` | Object containing `role` and `parts`. |
| `streaming` | Boolean to enable/disable streaming (currently `false` for REST). |

## Code Examples

### 1. cURL (Terminal)

```bash
# 1. Create Session (Optional, can just hit /run)
curl -X POST "http://localhost:8081/apps/supply_agent/users/user_default/sessions" \
  -H "Content-Type: application/json" \
  -d '{ "state": {} }'

# 2. Send a Request
curl -X POST "http://localhost:8081/run" \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "supply_agent",
    "user_id": "user_default",
    "session_id": "session-123",
    "new_message": {
      "role": "user",
      "parts": [{ "text": "Are there any stuck shipments?" }]
    },
    "streaming": false
  }'
```

### 2. Python (Requests)

```python
import requests

# Configuration
BASE_URL = "http://localhost:8081"  # or your Cloud Run URL
APP_NAME = "supply_agent"
USER = "client-app-01"
SESSION = "session-001"

# URL
url = f"{BASE_URL}/run"

# Payload
payload = {
    "app_name": APP_NAME,
    "user_id": USER,
    "session_id": SESSION,
    "new_message": {
        "role": "user",
        "parts": [{"text": "Identify stuck shipments and recommend solutions."}]
    },
    "streaming": False
}

# Execution
try:
    resp = requests.post(url, json=payload)
    resp.raise_for_status()
    print("Agent Response:", resp.json())
except Exception as e:
    print(f"Interaction failed: {e}")
```

## Troubleshooting

- **404 Not Found**: Check if the `app_name` matches exactly what is defined in your `agent.py`.
- **500 Error**: Check the server logs (terminal where `make supply-agent` is running) for traceback details.
- **Connection Refused**: Ensure the agent server is running on port 8081.

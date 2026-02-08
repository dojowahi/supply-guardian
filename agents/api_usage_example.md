
# Programmatic Agent Interaction

The Supply Guardian Agent exposes a REST API that you can interact with using standard tools like `curl` or Python's `requests` library.

## Base Configuration

- **Development Port**: `9091` (via `make supply-agent-dev`)
- **Base URL**: `http://localhost:9091`

## API Endpoints

The primary endpoint for sending messages to the agent follows this structure:

`POST /apps/default/users/{user_id}/sessions/{session_id}/run`

- `app_name`: **`default`** (This is the confirmed app name for your local setup).
- `user_id`: A unique identifier for the user (e.g., `user-123`).
- `session_id`: A unique identifier for the conversation session (e.g., `session-abc`).

> **Note**: You must create a session first before running commands if it doesn't exist, though often just calling `run` works if the platform supports auto-creation. To be safe, use the session creation endpoint first:
> `POST /apps/default/users/{user_id}/sessions/{session_id}`

## Examples

### 1. Using cURL

**Step 1: Create Session**
```bash
curl -X POST "http://localhost:9091/apps/default/users/admin/sessions/dev-session"
```

**Step 2: Send Message**
```bash
curl -X POST "http://localhost:9091/apps/default/users/admin/sessions/dev-session/run" \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "role": "user",
      "parts": [
        { "text": "Are there any stuck shipments?" }
      ]
    }
  }'
```

### 2. Using Python (requests)

You can use this script to interact with the agent:

```python
import requests
import json

BASE_URL = "http://localhost:9091"
APP_NAME = "default" 
USER_ID = "admin"
SESSION_ID = "dev-session-001"

# 1. Create Session
session_url = f"{BASE_URL}/apps/{APP_NAME}/users/{USER_ID}/sessions/{SESSION_ID}"
requests.post(session_url)

# 2. Run Agent
run_url = f"{session_url}/run"

payload = {
    "content": {
        "role": "user",
        "parts": [{"text": "Identify stuck shipments and recommend solutions."}]
    }
}

try:
    response = requests.post(run_url, json=payload)
    response.raise_for_status()
    
    data = response.json()
    print("Agent Response:", json.dumps(data, indent=2))
    
except requests.exceptions.RequestException as e:
    print(f"Error calling agent: {e}")
```

## Troubleshooting

- **404 Not Found**: Check if the `agent_name` matches exactly what is defined in your `agent.py`. You can also try using `default` as the agent name.
- **500 Error**: Check the server logs (terminal where `make supply-agent` is running) for traceback details.

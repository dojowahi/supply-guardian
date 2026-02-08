
import httpx
import os

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

def get_stuck_shipments():
    """Fetches all shipments with status 'Stuck'."""
    url = f"{BACKEND_URL}/shipments"
    print(f"[TOOL] Requesting: {url} param=Stuck")
    try:
        response = httpx.get(url, params={"status": "Stuck"})
        response.raise_for_status()
        data = response.json()
        print(f"[TOOL] Success. Found {len(data)} stuck shipments.")
        return data
    except Exception as e:
        error_msg = f"Error fetching stuck shipments: {str(e)}"
        print(f"[TOOL] {error_msg}")
        return {"error": error_msg}

def get_all_shipments():
    """Fetches all active shipments regardless of status."""
    url = f"{BACKEND_URL}/shipments"
    print(f"[TOOL] Requesting: {url} (All)")
    try:
        response = httpx.get(url)
        response.raise_for_status()
        data = response.json()
        print(f"[TOOL] Success. Found {len(data)} total shipments.")
        return data
    except Exception as e:
        return {"error": f"Failed to fetch shipments: {str(e)}"}

def get_disruption_context():
    """Fetches current disruptions to understand why shipments are stuck."""
    url = f"{BACKEND_URL}/network/disruptions"
    print(f"[TOOL] Requesting: {url}")
    try:
        response = httpx.get(url)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": f"Failed to fetch disruptions: {str(e)}"}

def get_action_quotes(shipment_id: str):
    """Gets available rerouting quotes for a specific shipment."""
    url = f"{BACKEND_URL}/actions/quotes/{shipment_id}"
    print(f"[TOOL] Requesting Quotes from: {url}")
    try:
        response = httpx.get(url)
        response.raise_for_status()
        data = response.json()
        print(f"[TOOL] Valid Quotes Received: {data}")
        return data
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            print(f"[TOOL] 404 Not Found for {shipment_id}")
            return {"error": f"No quotes found (404) for ID {shipment_id}. Is the ID correct?"}
        return {"error": f"API HTTP Error {e.response.status_code}: {e}"}
    except Exception as e:
        print(f"[TOOL] Connection Error: {e}")
        return {"error": f"Failed to connect to backend: {str(e)}"}

def apply_reroute(shipment_id: str, new_route_id: str):
    """Executes a reroute action for a shipment."""
    url = f"{BACKEND_URL}/actions/reroute"
    print(f"[TOOL] POSTing reroute to: {url} payload={{shipment_id: {shipment_id}, route: {new_route_id}}}")
    try:
        payload = {
            "shipment_id": shipment_id,
            "new_route_id": new_route_id
        }
        response = httpx.post(url, json=payload)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"[TOOL] Reroute Failed: {e}")
        return {"error": f"Reroute failed: {str(e)}"}

def get_products():
    """Fetches product catalog for context (value, seasonality)."""
    url = f"{BACKEND_URL}/products"
    try:
        response = httpx.get(url)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e)}

def get_network_nodes():
    """Fetches all network nodes (ports, warehouses, etc.) with coordinates."""
    url = f"{BACKEND_URL}/network/nodes"
    print(f"[TOOL] Requesting: {url}")
    try:
        response = httpx.get(url)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": f"Failed to fetch nodes: {str(e)}"}

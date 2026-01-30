from fastapi.testclient import TestClient
from app.main import app
import sys


def check(condition, message):
    if condition:
        print(f"✅ {message}")
    else:
        print(f"❌ {message}")
        sys.exit(1)

print("Starting Verification against docs/API.md...\n")

with TestClient(app) as client:
    # 1. Verify Nodes
    print("--- Verifying /network/nodes ---")
    response = client.get("/network/nodes")
    check(response.status_code == 200, "Status 200")
    nodes = response.json()
    check(len(nodes) > 0, f"Found {len(nodes)} nodes")
    check("capacity_tier" in nodes[0], "Node has capacity_tier")
    check("location" in nodes[0], "Node has location")

    # 2. Verify Shipments
    print("\n--- Verifying /shipments ---")
    response = client.get("/shipments")
    check(response.status_code == 200, "Status 200")
    shipments = response.json()
    check(len(shipments) > 0, f"Found {len(shipments)} shipments")
    # Check relationships
    s1 = shipments[0]
    check("origin_id" in s1, "Shipment has origin_id")
    check("contents" in s1, "Shipment has contents")
    check(len(s1['contents']) > 0, "Shipment has items")
    check("sku" in s1['contents'][0], "Content has sku")

    # 3. Verify Filter
    print("\n--- Verifying /shipments?status=Stuck ---")
    response = client.get("/shipments?status=Stuck")
    stuck = response.json()
    check(len(stuck) > 0, "Found stuck shipments")
    check(all(s['status'] == 'Stuck' for s in stuck), "All returned shipments are Stuck")

    # 4. Verify Disruptions
    print("\n--- Verifying /network/disruptions ---")
    response = client.get("/network/disruptions")
    check(response.status_code == 200, "Status 200")
    disruptions = response.json()
    check(len(disruptions) > 0, "Found disruptions")
    check("radius_km" in disruptions[0], "Disruption has radius_km")

    # 5. Verify Products
    print("\n--- Verifying /products ---")
    response = client.get("/products")
    check(response.status_code == 200, "Status 200")
    products = response.json()
    check(len(products) > 0, "Found products")
    check("unit_value" in products[0], "Product has unit_value")

    # 6. Verify Quotes (Agent Intelligence)
    print("\n--- Verifying /actions/quotes/{id} ---")
    # Use the first stuck shipment id
    stuck_id = stuck[0]['id']
    response = client.get(f"/actions/quotes/{stuck_id}")
    check(response.status_code == 200, "Status 200")
    quote = response.json()
    check(quote['shipment_id'] == stuck_id, "Quote matches shipment ID")
    check(len(quote['options']) > 0, "Quote has options")
    check("cost_usd" in quote['options'][0], "Option has cost")

    # 7. Verify Reroute (Action)
    print("\n--- Verifying /actions/reroute ---")
    payload = {
        "shipment_id": stuck_id,
        "new_route_id": quote['options'][0]['id']
    }
    response = client.post("/actions/reroute", json=payload)
    check(response.status_code == 200, "Status 200")
    result = response.json()
    check("rerouted" in result["message"], "Response confirms reroute")

    # Check side effect
    response = client.get("/shipments")
    updated_shipment = next(s for s in response.json() if s['id'] == stuck_id)
    check(updated_shipment['status'] == 'In-Transit', "Shipment status updated to In-Transit")
    check(updated_shipment['transport_mode'] in ['Air', 'Sea', 'Truck'], "Transport mode valid")

    print("\n🎉 ALL CHECKS PASSED: Implementation matches API.md!")

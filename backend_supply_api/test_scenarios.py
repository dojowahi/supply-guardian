
import httpx
import time
import sys

BASE_URL = "http://localhost:8000"

def log(msg, color="white"):
    colors = {
        "green": "\033[92m",
        "red": "\033[91m",
        "blue": "\033[94m",
        "white": "\033[0m"
    }
    print(f"{colors.get(color, '')}{msg}\033[0m")

def check_stuck_status(shipment_id):
    try:
        # We don't have a direct "get shipment" endpoint documented easily, 
        # but we can check via get_quotes which returns 404 if not found
        resp = httpx.get(f"{BASE_URL}/actions/quotes/{shipment_id}")
        if resp.status_code == 200:
            return True
        return False
    except:
        return False

def run_test():
    log("--- STARTING SUPPLY GUARDIAN SCENARIO TESTS ---", "blue")
    
    # 1. TEST SEA -> AIR (SH-1001)
    log("\n[TEST 1] Sea -> Air (SH-1001)", "blue")
    quotes = httpx.get(f"{BASE_URL}/actions/quotes/SH-1001").json()
    
    # Verify "Unload & Fly" is GONE
    unload_opt = next((o for o in quotes["options"] if "OPT-AIR-EXPEDITED" == o["id"]), None)
    if unload_opt:
         log("FAILURE: OPT-AIR-EXPEDITED should be hidden for Typhoon!", "red")
    else:
         log("VERIFIED: OPT-AIR-EXPEDITED is hidden (Correct).", "green")

    # Select Replacement Air
    air_option = next((o for o in quotes["options"] if "OPT-REPLACEMENT-AIR" == o["id"]), None)
        
    log(f"Selected Option: {air_option['id']}", "white")
    
    resp = httpx.post(f"{BASE_URL}/actions/reroute", json={
        "shipment_id": "SH-1001",
        "new_route_id": air_option["id"]
    })
    data = resp.json()
    log(f"Response: {data}", "green" if resp.status_code == 200 else "red")
    if "new_shipment_id" in data:
        log("SUCCESS: New Shipment Created", "green")
    else:
        log("FAILURE: No New Shipment ID", "red")

    # 2. TEST TRUCK RESCUE (SH-GEN-215)
    log("\n[TEST 2] Truck -> Warehouse Rescue (SH-GEN-215)", "blue")
    quotes = httpx.get(f"{BASE_URL}/actions/quotes/SH-GEN-215").json()
    truck_opt = next((o for o in quotes["options"] if "TRUCK" in o["id"]), None)
    
    if truck_opt:
        log(f"Selected Option: {truck_opt['id']} ({truck_opt['type']})", "white")
        resp = httpx.post(f"{BASE_URL}/actions/reroute", json={
            "shipment_id": "SH-GEN-215",
            "new_route_id": truck_opt["id"]
        })
        data = resp.json()
        log(f"Response: {data}", "green")
        if "new_shipment_id" in data:
            new_id = data["new_shipment_id"]
            log(f"SUCCESS: New Rescue Truck Created ID: {new_id}", "green")
            
            # Verify Origin != Destination
            new_shipment = httpx.get(f"{BASE_URL}/shipments/{new_id}").json()
            if new_shipment["origin_id"] != new_shipment["destination_id"]:
                log(f"VERIFIED: Origin {new_shipment['origin_id']} != Destination {new_shipment['destination_id']}", "green")
            else:
                log(f"FAILURE: Origin SAME as Destination {new_shipment['origin_id']}", "red")

    else:
        log("FAILURE: No Truck Rescue Option Found for Inland Truck!", "red")
        log(f"Options Found: {[o['id'] for o in quotes['options']]}", "white")

    # 3. TEST RAIL RESCUE (SH-GEN-217)
    log("\n[TEST 3] Rail -> Air/Truck Rescue (SH-GEN-217)", "blue")
    quotes = httpx.get(f"{BASE_URL}/actions/quotes/SH-GEN-217").json()
    # Rail usually gets Air Expedite or Truck Rescue options
    opt = quotes["options"][0] # Pick first available
    
    log(f"Selected Option: {opt['id']} ({opt['type']})", "white")
    resp = httpx.post(f"{BASE_URL}/actions/reroute", json={
        "shipment_id": "SH-GEN-217",
        "new_route_id": opt["id"]
    })
    data = resp.json()
    log(f"Response: {data}", "green")
    
    # 4. TEST SEA REROUTE (SH-1002) - Mutate
    log("\n[TEST 4] Sea -> Sea Reroute (SH-1002)", "blue")
    # Need to find a sea option
    quotes = httpx.get(f"{BASE_URL}/actions/quotes/SH-1002").json()
    sea_opt = next((o for o in quotes["options"] if "SEA-REROUTE" in o["id"]), None)
    if not sea_opt:
         # Maybe Alt Origin Sea?
         sea_opt = next((o for o in quotes["options"] if "SEA" in o["id"]), None)
    
    if sea_opt:
        log(f"Selected Option: {sea_opt['id']}", "white")
        resp = httpx.post(f"{BASE_URL}/actions/reroute", json={
            "shipment_id": "SH-1002",
            "new_route_id": sea_opt["id"]
        })
        data = resp.json()
        log(f"Response: {data}", "green")
        if "new_shipment_id" not in data:
            log("SUCCESS: Same Shipment Updated (No New ID)", "green")
        else:
            if "REPLACEMENT" in sea_opt["id"] or "ALT" in sea_opt["id"]:
                 log("SUCCESS: Replacement Created (Expected for Alt Origin)", "green")
            else:
                 log("FAILURE: Expected Mutation but got New ID", "red")

if __name__ == "__main__":
    try:
        run_test()
    except Exception as e:
        log(f"CRITICAL ERROR: Is the Backend Running? {e}", "red")

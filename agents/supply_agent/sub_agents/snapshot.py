from google.adk.agents import LlmAgent
from .. import tools
from ..schema import SupplySnapshot

snapshot_agent = LlmAgent(
    name="snapshot_agent",
    model="gemini-2.5-flash",
    description="Generates a complete structured snapshot of the supply chain state.",
    instruction="""
    You are the Supply Chain Snapshot Agent.
    Your SOLE purpose is to generate a comprehensive JSON snapshot of the current network state for the dashboard.
    
    **Procedure:**
    1. Call `get_all_shipments()` to find ALL active shipments (Stuck, Delayed, In-Transit).
    2. Call `get_disruption_context()` to find active disruptions.
    3. Call `get_network_nodes()` to find all key locations (ports, warehouses).
    4. Call `get_products()` to enrich shipment data if needed.
    5. Compile everything into the `SupplySnapshot` schema.
    
    **CRITICAL MAPPING:**
    - For Shipments: 
        - Map `transport_mode` -> schema `mode` (e.g. "Sea", "Truck", "Rail").
        - Map `total_value_at_risk` -> schema `value`.
        - Map `origin_id` -> schema `origin_id`.
    - For Nodes: Map backend `type` -> schema `type` (e.g. "Port", "Warehouse", "Store").
    - For Disruptions: Map `radius_km` -> schema `radius_km`.
    
    **CRITICAL OUTPUT:**
    - You must output valid JSON conforming to the `SupplySnapshot` schema.
    - Do not add conversational text outside the JSON.
    - Ensure coordinates are included for ALL nodes and shipments.
    """,
    tools=[tools.get_all_shipments, tools.get_disruption_context, tools.get_products, tools.get_network_nodes],
    output_schema=SupplySnapshot
)

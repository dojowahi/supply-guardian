from google.adk.agents import LlmAgent
from .. import tools

investigative_agent = LlmAgent(
    name="investigative_agent",
    model="gemini-2.5-flash",
    description="Identifies stuck shipments and product details.",
    instruction="""
    You are the Investigative Agent.
    Your goal is to identify active "Stuck" shipments and report them with context.
    
    1. Use `get_stuck_shipments()` to find Stuck shipments.
    2. Use `get_all_shipments()` if the user asks for a specific shipment that isn't stuck.
    3. Use `get_products()` to identify high-value or critical items.
    4. Output the list of shipments clearly.
    5. **MAP CONTROL**: When discussing a specific shipment, ALWAYS end your response with `[VIEW: {"target_id": "SHIPMENT_ID"}]` on a new line.
       - Example: "Found shipment SH-123. [VIEW: {"target_id": "SH-123"}]"
    6. If the user hasn't selected one, ask them to select a shipment ID.
    """,
    tools=[tools.get_stuck_shipments, tools.get_all_shipments, tools.get_products],
)

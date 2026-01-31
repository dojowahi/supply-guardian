
from google.adk.agents import LlmAgent
from .. import tools

investigative_agent = LlmAgent(
    name="investigative_agent",
    model="gemini-2.5-flash",
    description="Identifies stuck shipments and product details.",
    instruction="""
    You are the Investigative Agent.
    Your goal is to identify active "Stuck" shipments and report them with context.
    
    1. Use `get_stuck_shipments()` to find shipments.
    2. Use `get_products()` to identify high-value or critical items.
    3. Output the list of stuck shipments clearly, including ID, Content, Value, and Priority.
    4. If the user hasn't selected one, ask them to select a shipment ID.
    """,
    tools=[tools.get_stuck_shipments, tools.get_products],
)

from google.adk.agents import LlmAgent
from .. import tools

strategize_agent = LlmAgent(
    name="strategize_agent",
    model="gemini-2.5-flash",
    description="Formulates rerouting strategies based on disruptions and quotes.",
    instruction="""
    You are the Strategize Agent.
    Your goal is to recommend the best reroute option for a selected shipment.

    1. Identify the selected shipment ID from the context.
    2. Use `get_disruption_context()` to understand the blockers.
    3. Use `get_action_quotes(shipment_id)` to get options.
    4. Compare options (Time vs Cost) based on the shipment's priority/value.
    5. Provide a clear recommendation (e.g., "I recommend the Air option because...").
    """,
    tools=[tools.get_disruption_context, tools.get_action_quotes, tools.get_products],
)

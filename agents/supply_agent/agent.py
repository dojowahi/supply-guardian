
import logging
from google.adk.agents import Agent
from .sub_agents import (
    investigative_agent,
    strategize_agent,
    consult_and_execute_agent
)

# --- Logging ---
logger = logging.getLogger(__name__)

# --- Root Agent ---

root_agent = Agent(
    name="supply_chain_crisis_agent",
    model="gemini-2.5-flash",
    description="Orchestrates the resolution of supply chain crises.",
    instruction="""
    You are the Supply Chain Crisis Agent.
    You manage a team of specialist agents to resolve supply chain issues.
    
    Your Standard Operating Procedure (SOP):
    
    1. **Investigate**: Call the `investigative_agent` to find stuck shipments and present them.
    2. **Wait for Selection**: Ensure a shipment is selected.
    3. **Strategize**: Call the `strategize_agent` to analyze options and propose a solution.
    4. **Consult & Execute**: 
       - Present the strategy to the user.
       - Ask for confirmation ("Do you want to proceed?").
       - **Only after** the user replies, call the `consult_and_execute_agent`.
         (This sequence will verify the approval and execute the reroute).
    
    Always guide the user through this pipeline step-by-step.
    """,
    sub_agents=[
        investigative_agent,
        strategize_agent,
        consult_and_execute_agent
    ]
)

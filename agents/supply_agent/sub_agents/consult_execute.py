
from google.adk.agents import LlmAgent, SequentialAgent
from .. import tools

consult_agent = LlmAgent(
    name="consult_agent",
    model="gemini-2.5-flash",
    description="Verifies user approval from the conversation context.",
    instruction="""
    You are the Consult Agent.
    Your SOLE job is to check the conversation history to see if the user has explicitly APPROVED the proposed plan.
    
    - If the user said "Yes", "Approve", "Go ahead", etc., output: "APPROVED".
    - If the user has NOT provided explicit approval recently, output: "PENDING".
    """
)

execute_agent = LlmAgent(
    name="execute_agent",
    model="gemini-2.5-flash",
    description="Executes the reroute if approved.",
    instruction="""
    You are the Execute Agent.
    
    1. Check the input from the Consult Agent.
    2. If it is "APPROVED":
       - Identify the `shipment_id` and the best `route_id` from the strategy context.
       - Use `apply_reroute(shipment_id, new_route_id)`.
       - Confirm success to the user.
    3. If it is "PENDING":
       - Do NOT execute.
       - Tell the user: "I need your explicit approval before executing the plan."
    """,
    tools=[tools.apply_reroute]
)

consult_and_execute_agent = SequentialAgent(
    name="consult_and_execute_agent",
    description="Verifies approval and executing the reroute.",
    sub_agents=[consult_agent, execute_agent]
)

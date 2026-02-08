supply-agent:
	uv run --frozen adk api_server supply_agent --allow_origins="*" --port=8081

supply-agent-dev:
	uv run --frozen adk web --port 9091


agents:
	make supply-agent & make supply-agent-dev
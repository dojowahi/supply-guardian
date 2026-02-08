#!/bin/bash
set -e

# Configuration
REGION="us-central1"
SERVICE_ACCOUNT="genai-592@gen-ai-4all.iam.gserviceaccount.com"
STATE_FILE=".deploy_state"
ENV_FILE=".deploy.env"
LOG_FILE="deploy.log"
PROJECT_ID=$(gcloud config get-value project)

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create/Clear log file
echo "Deployment started at $(date)" > "$LOG_FILE"

# Redirect output to file and console
exec > >(tee -a "$LOG_FILE") 2>&1

# Error handler to pause execution
handle_error() {
    echo -e "\n${RED}[CRITICAL ERROR] Deployment failed!${NC}"
    echo "Check the detailed logs above or in '$LOG_FILE'."
    echo "Press ENTER to exit..."
    read -r
    exit 1
}

# Trap ANY error
trap 'handle_error' ERR

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check for redeploy flag
if [[ "$1" == "--redeploy-all" ]]; then
    warning "Force redeploy requested. Clearing previous state..."
    rm -f "$STATE_FILE" "$ENV_FILE"
fi

# Initialize state files if they don't exist
touch "$STATE_FILE"
touch "$ENV_FILE"

# Function to check if a step is completed
is_step_done() {
    grep -q "^$1$" "$STATE_FILE"
}

# Function to mark a step as completed
mark_step_done() {
    echo "$1" >> "$STATE_FILE"
}

# Load saved environment variables if they exist
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
fi

if [ -z "$PROJECT_ID" ]; then
    error "No Google Cloud Project ID found."
    echo "Please set your project ID using: gcloud config set project YOUR_PROJECT_ID"
    # Wait for user input even here
    read -p "Press Enter to exit..."
    exit 1
fi

echo "========================================================"
echo "Deployment Wrapper for Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Account: $SERVICE_ACCOUNT"
echo "Logs are being saved to: $LOG_FILE"
echo "Usage: ./deploy.sh [--redeploy-all]"
echo "========================================================"

# ------------------------------------------------------------------
# STEP 1: Enable APIs
# ------------------------------------------------------------------
STEP_NAME="enable_apis"
if is_step_done "$STEP_NAME"; then
    success "Step 1: APIs already enabled. Skipping."
else
    log "Step 1: Enabling necessary Google Cloud APIs..."
    gcloud services enable run.googleapis.com \
        artifactregistry.googleapis.com \
        cloudbuild.googleapis.com \
        --impersonate-service-account "$SERVICE_ACCOUNT"
    
    mark_step_done "$STEP_NAME"
    success "APIs enabled successfully."
fi

# ------------------------------------------------------------------
# STEP 2: Deploy Backend
# ------------------------------------------------------------------
STEP_NAME="deploy_backend"
SERVICE_NAME="hackathon-supply-backend"
if is_step_done "$STEP_NAME" && [ -n "$SAVED_BACKEND_URL" ]; then
    success "Step 2: Backend already deployed. URL: $SAVED_BACKEND_URL"
    BACKEND_URL="$SAVED_BACKEND_URL"
else
    log "Step 2: Deploying Backend API ($SERVICE_NAME)..."
    log "This may take a few minutes..."
    
    gcloud run deploy "$SERVICE_NAME" \
        --source ./backend_supply_api \
        --region "$REGION" \
        --allow-unauthenticated \
        --port 8080 \
        --impersonate-service-account "$SERVICE_ACCOUNT"

    # Retrieve and verify URL
    BACKEND_URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format 'value(status.url)' --impersonate-service-account "$SERVICE_ACCOUNT")
    
    if [ -z "$BACKEND_URL" ]; then
        error "Failed to retrieve Backend URL. Deployment might have failed."
        exit 1
    fi

    # Save state
    echo "SAVED_BACKEND_URL=$BACKEND_URL" > "$ENV_FILE"
    mark_step_done "$STEP_NAME"
    success "Backend deployed at: $BACKEND_URL"
fi

# ------------------------------------------------------------------
# Pre-requisites for Agents
# ------------------------------------------------------------------
# Check for API Key (Required for Agents API and Dev UI)
if [ -z "$GOOGLE_API_KEY" ]; then
    # Try to find it in environment or prompt
    if [ -f .env ]; then
        GOOGLE_API_KEY=$(grep GOOGLE_API_KEY .env | cut -d '=' -f2)
    fi
    if [ -z "$GOOGLE_API_KEY" ]; then
        # Check if saved in deploy.env (unlikely but possible if we decided to save it, relying on .env is better)
        echo "Searching for API Key..."
    fi
fi

# We don't exit here if missing, because maybe the user wants to skip agents if they fail? 
# But the steps below require it.
if [ -z "$GOOGLE_API_KEY" ]; then
    warning "GOOGLE_API_KEY not found in environment. Agents deployment might fail or require manual input."
    # We will prompt if needed inside the block? No, better to prompt once here.
    read -sp "Enter your GOOGLE_API_KEY (or press Enter to skip/fail): " GOOGLE_API_KEY
    echo ""
fi


# ------------------------------------------------------------------
# STEP 3a: Deploy Agents API
# ------------------------------------------------------------------
STEP_NAME="deploy_agents_api"
SERVICE_NAME="hackathon-supply-agents-api"
if is_step_done "$STEP_NAME" && [ -n "$SAVED_AGENT_API_URL" ]; then
    success "Step 3a: Agents API already deployed. URL: $SAVED_AGENT_API_URL"
    AGENT_API_URL="$SAVED_AGENT_API_URL"
else
    log "Step 3a: Deploying Agents API ($SERVICE_NAME)..."
    log "Linking to Backend: $BACKEND_URL"

    if [ -z "$GOOGLE_API_KEY" ]; then
        error "GOOGLE_API_KEY is required for Agents."
        exit 1
    fi

    # Deploy API Server content
    gcloud run deploy "$SERVICE_NAME" \
        --source ./agents \
        --region "$REGION" \
        --allow-unauthenticated \
        --port 8081 \
        --set-env-vars "BACKEND_URL=$BACKEND_URL,GOOGLE_API_KEY=$GOOGLE_API_KEY" \
        --command "uv" \
        --args "run,adk,api_server,supply_agent,--allow_origins=*,--port=8081,--host=0.0.0.0" \
        --impersonate-service-account "$SERVICE_ACCOUNT"
        
    AGENT_API_URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format 'value(status.url)' --impersonate-service-account "$SERVICE_ACCOUNT")
    
    echo "SAVED_AGENT_API_URL=$AGENT_API_URL" >> "$ENV_FILE"
    mark_step_done "$STEP_NAME"
    success "Agents API deployed at: $AGENT_API_URL"
fi

# ------------------------------------------------------------------
# STEP 3b: Deploy Agents Dev UI
# ------------------------------------------------------------------
STEP_NAME="deploy_agents_ui"
SERVICE_NAME="hackathon-supply-agents-ui"
if is_step_done "$STEP_NAME"; then
    success "Step 3b: Agents Dev UI already deployed. Skipping."
else
    log "Step 3b: Deploying Agents Dev UI ($SERVICE_NAME)..."
    
     if [ -z "$GOOGLE_API_KEY" ]; then
        error "GOOGLE_API_KEY is required for Agents."
        exit 1
    fi

    gcloud run deploy "$SERVICE_NAME" \
        --source ./agents \
        --region "$REGION" \
        --allow-unauthenticated \
        --port 9090 \
        --set-env-vars "BACKEND_URL=$BACKEND_URL,GOOGLE_API_KEY=$GOOGLE_API_KEY" \
        --command "uv" \
        --args "run,adk,web,--port=9090,--host=0.0.0.0" \
        --impersonate-service-account "$SERVICE_ACCOUNT"

    AGENTS_UI_URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format 'value(status.url)' --impersonate-service-account "$SERVICE_ACCOUNT")
    
    mark_step_done "$STEP_NAME"
    success "Agents Dev UI deployed at: $AGENTS_UI_URL"
fi

# ------------------------------------------------------------------
# STEP 4: Deploy Main Frontend
# ------------------------------------------------------------------
STEP_NAME="deploy_frontend"
SERVICE_NAME="hackathon-supply-frontend"
if is_step_done "$STEP_NAME" && [ -n "$SAVED_FRONTEND_URL" ]; then
     success "Step 4: Frontend already deployed. URL: $SAVED_FRONTEND_URL"
     FRONTEND_URL="$SAVED_FRONTEND_URL"
else
    log "Step 4: Deploying Main Frontend ($SERVICE_NAME)..."
    log "Linking to Backend: $BACKEND_URL"

    gcloud run deploy "$SERVICE_NAME" \
        --source ./frontend_supply_api \
        --region "$REGION" \
        --allow-unauthenticated \
        --port 8080 \
        --set-env-vars BACKEND_URL="$BACKEND_URL" \
        --impersonate-service-account "$SERVICE_ACCOUNT"

    # Retrieve URL
    FRONTEND_URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format 'value(status.url)' --impersonate-service-account "$SERVICE_ACCOUNT")
    
    # Save state
    echo "SAVED_FRONTEND_URL=$FRONTEND_URL" >> "$ENV_FILE"
    mark_step_done "$STEP_NAME"
    success "Frontend deployed at: $FRONTEND_URL"
fi

# ------------------------------------------------------------------
# STEP 5: Deploy Agentic UI
# ------------------------------------------------------------------
STEP_NAME="deploy_agentic_ui"
SERVICE_NAME="hackathon-supply-agentic-ui"
if is_step_done "$STEP_NAME" && [ -n "$SAVED_AGENTIC_UI_URL" ]; then
    success "Step 5: Agentic UI already deployed. URL: $SAVED_AGENTIC_UI_URL"
    AGENTIC_UI_URL="$SAVED_AGENTIC_UI_URL"
else
    log "Step 5: Deploying Agentic UI ($SERVICE_NAME)..."
    log "Linking to Agent API: $AGENT_API_URL"

    gcloud run deploy "$SERVICE_NAME" \
        --source ./agentic_ui \
        --region "$REGION" \
        --allow-unauthenticated \
        --port 8080 \
        --set-env-vars "AGENT_API_URL=$AGENT_API_URL,BACKEND_URL=$BACKEND_URL" \
        --impersonate-service-account "$SERVICE_ACCOUNT"

    AGENTIC_UI_URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format 'value(status.url)' --impersonate-service-account "$SERVICE_ACCOUNT")
    
    echo "SAVED_AGENTIC_UI_URL=$AGENTIC_UI_URL" >> "$ENV_FILE"
    mark_step_done "$STEP_NAME"
    success "Agentic UI deployed at: $AGENTIC_UI_URL"
fi

echo "========================================================"
echo -e "${GREEN}Deployment Complete!${NC}"
echo "--------------------------------------------------------"
echo -e "Backend:    $BACKEND_URL"
echo -e "Agents API: $AGENT_API_URL"
echo -e "Agents UI:  $AGENTS_UI_URL"
echo -e "Frontend:   $FRONTEND_URL"
echo -e "Agentic UI: $AGENTIC_UI_URL"
echo "--------------------------------------------------------"
echo "To restart from scratch, run: ./deploy.sh --redeploy-all"

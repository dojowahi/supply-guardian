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
if is_step_done "$STEP_NAME" && [ -n "$SAVED_BACKEND_URL" ]; then
    success "Step 2: Backend already deployed. URL: $SAVED_BACKEND_URL"
    BACKEND_URL="$SAVED_BACKEND_URL"
else
    log "Step 2: Deploying Backend API (backend-supply-api)..."
    log "This may take a few minutes..."
    
    gcloud run deploy backend-supply-api \
        --source ./backend_supply_api \
        --region "$REGION" \
        --allow-unauthenticated \
        --port 8080 \
        --impersonate-service-account "$SERVICE_ACCOUNT"

    # Retrieve and verify URL
    BACKEND_URL=$(gcloud run services describe backend-supply-api --region "$REGION" --format 'value(status.url)' --impersonate-service-account "$SERVICE_ACCOUNT")
    
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
# STEP 3: Deploy Agents
# ------------------------------------------------------------------
STEP_NAME="deploy_agents"
if is_step_done "$STEP_NAME"; then
    success "Step 3: Agents already deployed. Skipping."
else
    log "Step 3: Deploying Agents Service (supply-agents)..."
    log "Linking to Backend: $BACKEND_URL"
    
    gcloud run deploy supply-agents \
        --source ./agents \
        --region "$REGION" \
        --allow-unauthenticated \
        --port 9090 \
        --set-env-vars BACKEND_URL="$BACKEND_URL" \
        --impersonate-service-account "$SERVICE_ACCOUNT"
        
    mark_step_done "$STEP_NAME"
    success "Agents service deployed successfully."
fi

# ------------------------------------------------------------------
# STEP 4: Deploy Frontend
# ------------------------------------------------------------------
STEP_NAME="deploy_frontend"
if is_step_done "$STEP_NAME" && [ -n "$SAVED_FRONTEND_URL" ]; then
     success "Step 4: Frontend already deployed. URL: $SAVED_FRONTEND_URL"
     FRONTEND_URL="$SAVED_FRONTEND_URL"
else
    log "Step 4: Deploying Frontend Application (frontend-supply-app)..."
    log "Linking to Backend: $BACKEND_URL"

    gcloud run deploy frontend-supply-app \
        --source ./frontend_supply_api \
        --region "$REGION" \
        --allow-unauthenticated \
        --port 8080 \
        --set-env-vars BACKEND_URL="$BACKEND_URL" \
        --impersonate-service-account "$SERVICE_ACCOUNT"

    # Retrieve URL
    FRONTEND_URL=$(gcloud run services describe frontend-supply-app --region "$REGION" --format 'value(status.url)' --impersonate-service-account "$SERVICE_ACCOUNT")
    
    # Save state
    echo "SAVED_FRONTEND_URL=$FRONTEND_URL" >> "$ENV_FILE"
    mark_step_done "$STEP_NAME"
    success "Frontend deployed at: $FRONTEND_URL"
fi

echo "========================================================"
echo -e "${GREEN}Deployment Complete!${NC}"
echo "--------------------------------------------------------"
echo -e "Backend:  $BACKEND_URL"
echo -e "Frontend: $FRONTEND_URL"
echo "--------------------------------------------------------"
echo "To restart from scratch, run: ./deploy.sh --redeploy-all"

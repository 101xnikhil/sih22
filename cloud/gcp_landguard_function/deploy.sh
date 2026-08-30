#!/bin/bash
# ==============================================================================
# LANDGUARD AI — Google Cloud Function Deployment Script
# Deploys the XGBoost ML Webhook Processor for Blynk IoT Ingestion
# ==============================================================================

PROJECT_ID=${1:-"landguard-ai-project"}
REGION=${2:-"us-central1"}
FUNCTION_NAME="landguard-ml-pipeline"
BACKEND_URL=${3:-"http://127.0.0.1:8000"}

echo "🚀 Deploying LANDGUARD ML Pipeline to Google Cloud Functions (Gen 2)..."
echo "   Project:      ${PROJECT_ID}"
echo "   Region:       ${REGION}"
echo "   Function:     ${FUNCTION_NAME}"
echo "   FastAPI URL:  ${BACKEND_URL}"

gcloud functions deploy ${FUNCTION_NAME} \
  --gen2 \
  --runtime=python310 \
  --region=${REGION} \
  --source=. \
  --entry-point=blynk_gcp_webhook \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars LANDGUARD_BACKEND_URL="${BACKEND_URL}" \
  --memory=512MB \
  --timeout=60s

echo "✓ Deployment complete! Use the generated Trigger URL in your Blynk Webhooks."

#!/bin/bash

# === Step 1: Set project and enable required services ===
gcloud config set project $PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

# === Step 2: Create Artifact Registry (if not exists) ===
gcloud artifacts repositories describe $REPO_NAME --location=$REGION >/dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Creating Artifact Registry..."
  gcloud artifacts repositories create $REPO_NAME \
    --repository-format=docker \
    --location=$REGION \
    --description="Docker repo for Cloud Run"
fi

# === Step 3: Build and push the Docker image ===
echo "Building and pushing Docker image..."
gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME

# === Step 4: Deploy to Cloud Run ===
echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars MONGO_URI="$MONGO_URI"

# === Step 5: Show service URL ===
echo "Deployment complete. Your service URL is:"
gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --format="value(status.url)"

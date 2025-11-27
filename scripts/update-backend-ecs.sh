#!/bin/bash

# ============================================
# Quick Backend Update Script for ECS
# ============================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================
# CONFIGURATION - UPDATE THESE VALUES
# ============================================

AWS_ACCOUNT_ID="YOUR_AWS_ACCOUNT_ID"           # e.g., 123456789012
AWS_REGION="us-east-1"                          # Your AWS region
ECR_REPO_NAME="arbrit-backend"                  # ECR repository name
ECS_CLUSTER_NAME="arbrit-cluster"               # ECS cluster name
ECS_SERVICE_NAME="arbrit-backend-service"       # ECS service name

# ============================================
# DO NOT EDIT BELOW THIS LINE
# ============================================

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Arbrit Backend - ECS Update${NC}"
echo -e "${GREEN}======================================${NC}"

# Step 1: Check prerequisites
echo -e "\n${YELLOW}[1/6]${NC} Checking prerequisites..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker not found!${NC}"
    exit 1
fi
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI not found!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker and AWS CLI found${NC}"

# Step 2: Login to ECR
echo -e "\n${YELLOW}[2/6]${NC} Logging into AWS ECR..."
aws ecr get-login-password --region $AWS_REGION | \
    docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
echo -e "${GREEN}✓ Logged into ECR${NC}"

# Step 3: Build Docker image
echo -e "\n${YELLOW}[3/6]${NC} Building backend Docker image..."
docker build -f Dockerfile.backend -t $ECR_REPO_NAME:latest .
echo -e "${GREEN}✓ Image built successfully${NC}"

# Step 4: Tag image
echo -e "\n${YELLOW}[4/6]${NC} Tagging image for ECR..."
docker tag $ECR_REPO_NAME:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME:latest
echo -e "${GREEN}✓ Image tagged${NC}"

# Step 5: Push to ECR
echo -e "\n${YELLOW}[5/6]${NC} Pushing image to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME:latest
echo -e "${GREEN}✓ Image pushed to ECR${NC}"

# Step 6: Force new deployment in ECS
echo -e "\n${YELLOW}[6/6]${NC} Updating ECS service..."
aws ecs update-service \
    --cluster $ECS_CLUSTER_NAME \
    --service $ECS_SERVICE_NAME \
    --force-new-deployment \
    --region $AWS_REGION \
    --output text > /dev/null
echo -e "${GREEN}✓ ECS service update triggered${NC}"

# Done
echo -e "\n${GREEN}======================================${NC}"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo -e "\nECS is now pulling the new image and restarting containers."
echo -e "This will take 2-3 minutes."
echo -e "\nMonitor progress at:"
echo -e "https://console.aws.amazon.com/ecs/home?region=$AWS_REGION#/clusters/$ECS_CLUSTER_NAME/services/$ECS_SERVICE_NAME"
echo -e "\nCheck logs at:"
echo -e "https://console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#logsV2:log-groups/log-group/\$252Fecs\$252Farbrit-backend"
echo ""



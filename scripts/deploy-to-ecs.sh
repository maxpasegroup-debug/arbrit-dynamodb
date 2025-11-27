#!/bin/bash

# ============================================
# AWS ECS Deployment Script for Arbrit Safety
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# Configuration
# ============================================

# Load environment variables from .env.aws
if [ -f "aws-configs/.env.aws" ]; then
    export $(cat aws-configs/.env.aws | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: aws-configs/.env.aws file not found!${NC}"
    echo "Please create it from aws-configs/.env.aws.example"
    exit 1
fi

# Validate required variables
if [ -z "$AWS_ACCOUNT_ID" ] || [ -z "$AWS_REGION" ]; then
    echo -e "${RED}Error: AWS_ACCOUNT_ID and AWS_REGION must be set in .env.aws${NC}"
    exit 1
fi

# ============================================
# Functions
# ============================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Please install it first."
        exit 1
    fi
    log_info "AWS CLI found: $(aws --version)"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker not found. Please install it first."
        exit 1
    fi
    log_info "Docker found: $(docker --version)"
}

# ============================================
# Main Deployment Steps
# ============================================

main() {
    log_info "Starting AWS ECS Deployment..."
    
    # Step 1: Check prerequisites
    log_info "Step 1: Checking prerequisites..."
    check_aws_cli
    check_docker
    
    # Step 2: Login to ECR
    log_info "Step 2: Logging into AWS ECR..."
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    
    # Step 3: Create ECR repositories if they don't exist
    log_info "Step 3: Creating ECR repositories..."
    aws ecr describe-repositories --repository-names $ECR_BACKEND_REPO --region $AWS_REGION 2>/dev/null || \
        aws ecr create-repository --repository-name $ECR_BACKEND_REPO --region $AWS_REGION
    
    aws ecr describe-repositories --repository-names $ECR_FRONTEND_REPO --region $AWS_REGION 2>/dev/null || \
        aws ecr create-repository --repository-name $ECR_FRONTEND_REPO --region $AWS_REGION
    
    # Step 4: Build Docker images
    log_info "Step 4: Building Docker images..."
    
    log_info "Building backend image..."
    docker build -f Dockerfile.backend -t $ECR_BACKEND_REPO:latest .
    
    log_info "Building frontend image..."
    docker build -f Dockerfile.frontend -t $ECR_FRONTEND_REPO:latest .
    
    # Step 5: Tag images
    log_info "Step 5: Tagging images..."
    docker tag $ECR_BACKEND_REPO:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_BACKEND_REPO:latest
    docker tag $ECR_FRONTEND_REPO:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_FRONTEND_REPO:latest
    
    # Step 6: Push images to ECR
    log_info "Step 6: Pushing images to ECR..."
    log_info "Pushing backend image..."
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_BACKEND_REPO:latest
    
    log_info "Pushing frontend image..."
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_FRONTEND_REPO:latest
    
    # Step 7: Create ECS cluster if it doesn't exist
    log_info "Step 7: Creating ECS cluster..."
    aws ecs describe-clusters --clusters $ECS_CLUSTER_NAME --region $AWS_REGION 2>/dev/null || \
        aws ecs create-cluster --cluster-name $ECS_CLUSTER_NAME --region $AWS_REGION
    
    # Step 8: Create CloudWatch log groups
    log_info "Step 8: Creating CloudWatch log groups..."
    aws logs create-log-group --log-group-name /ecs/arbrit-backend --region $AWS_REGION 2>/dev/null || true
    aws logs create-log-group --log-group-name /ecs/arbrit-frontend --region $AWS_REGION 2>/dev/null || true
    
    # Step 9: Update task definition files with account ID
    log_info "Step 9: Updating task definitions..."
    sed "s/<YOUR_AWS_ACCOUNT_ID>/$AWS_ACCOUNT_ID/g" aws-configs/backend-task-definition.json > /tmp/backend-task-def.json
    sed "s/<YOUR_AWS_ACCOUNT_ID>/$AWS_ACCOUNT_ID/g" aws-configs/frontend-task-definition.json > /tmp/frontend-task-def.json
    
    # Step 10: Register task definitions
    log_info "Step 10: Registering task definitions..."
    aws ecs register-task-definition --cli-input-json file:///tmp/backend-task-def.json --region $AWS_REGION
    aws ecs register-task-definition --cli-input-json file:///tmp/frontend-task-def.json --region $AWS_REGION
    
    # Step 11: Update services or create if they don't exist
    log_info "Step 11: Updating ECS services..."
    
    # Check if services exist
    BACKEND_SERVICE_EXISTS=$(aws ecs describe-services --cluster $ECS_CLUSTER_NAME --services $ECS_BACKEND_SERVICE --region $AWS_REGION --query 'services[0].status' --output text 2>/dev/null || echo "NONE")
    FRONTEND_SERVICE_EXISTS=$(aws ecs describe-services --cluster $ECS_CLUSTER_NAME --services $ECS_FRONTEND_SERVICE --region $AWS_REGION --query 'services[0].status' --output text 2>/dev/null || echo "NONE")
    
    if [ "$BACKEND_SERVICE_EXISTS" != "NONE" ] && [ "$BACKEND_SERVICE_EXISTS" != "INACTIVE" ]; then
        log_info "Updating backend service..."
        aws ecs update-service --cluster $ECS_CLUSTER_NAME --service $ECS_BACKEND_SERVICE --force-new-deployment --region $AWS_REGION
    else
        log_warn "Backend service doesn't exist. Please create it manually via AWS Console or CLI."
    fi
    
    if [ "$FRONTEND_SERVICE_EXISTS" != "NONE" ] && [ "$FRONTEND_SERVICE_EXISTS" != "INACTIVE" ]; then
        log_info "Updating frontend service..."
        aws ecs update-service --cluster $ECS_CLUSTER_NAME --service $ECS_FRONTEND_SERVICE --force-new-deployment --region $AWS_REGION
    else
        log_warn "Frontend service doesn't exist. Please create it manually via AWS Console or CLI."
    fi
    
    # Step 12: Wait for deployment
    log_info "Step 12: Waiting for services to stabilize..."
    log_info "This may take a few minutes..."
    
    if [ "$BACKEND_SERVICE_EXISTS" != "NONE" ]; then
        aws ecs wait services-stable --cluster $ECS_CLUSTER_NAME --services $ECS_BACKEND_SERVICE --region $AWS_REGION || log_warn "Backend service stabilization timeout"
    fi
    
    if [ "$FRONTEND_SERVICE_EXISTS" != "NONE" ]; then
        aws ecs wait services-stable --cluster $ECS_CLUSTER_NAME --services $ECS_FRONTEND_SERVICE --region $AWS_REGION || log_warn "Frontend service stabilization timeout"
    fi
    
    # Cleanup
    rm -f /tmp/backend-task-def.json /tmp/frontend-task-def.json
    
    log_info "=========================================="
    log_info "Deployment completed successfully!"
    log_info "=========================================="
    log_info "Check your ECS console for service status:"
    log_info "https://console.aws.amazon.com/ecs/home?region=$AWS_REGION#/clusters/$ECS_CLUSTER_NAME/services"
}

# ============================================
# Script Entry Point
# ============================================

# Check if running from correct directory
if [ ! -f "docker-compose.yml" ]; then
    log_error "Please run this script from the project root directory"
    exit 1
fi

# Run main deployment
main

exit 0


#!/bin/bash
# ============================================================================
# DynamoDB Backend Diagnostic Script
# ============================================================================
# Run this on your EC2 instance to diagnose DynamoDB backend issues
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[✓]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $1"; }
log_step() { echo -e "\n${BLUE}=== $1 ===${NC}"; }

echo "============================================"
echo "DynamoDB Backend Diagnostic"
echo "============================================"
echo ""

# ============================================================================
# Check 1: Backend Service Status
# ============================================================================
log_step "Check 1: Backend Service"

if systemctl is-active --quiet arbrit-backend 2>/dev/null; then
    log_info "Backend service is running"
else
    log_error "Backend service is NOT running"
    echo "    Start it: sudo systemctl start arbrit-backend"
fi

# ============================================================================
# Check 2: Backend Files
# ============================================================================
log_step "Check 2: Backend Files"

BACKEND_DIR="/var/www/arbrit-safety/backend"

if [ -f "$BACKEND_DIR/server.py" ]; then
    log_info "server.py exists"
else
    log_error "server.py NOT found at $BACKEND_DIR"
fi

if [ -f "$BACKEND_DIR/dynamodb_layer.py" ]; then
    log_info "dynamodb_layer.py exists"
else
    log_error "dynamodb_layer.py is MISSING!"
    echo "    This file is required for DynamoDB support"
    echo "    You need to upload it from your local backend folder"
fi

if [ -f "$BACKEND_DIR/.env" ]; then
    log_info ".env file exists"
else
    log_warn ".env file not found (might be using environment variables)"
fi

# ============================================================================
# Check 3: Python Dependencies
# ============================================================================
log_step "Check 3: Python Dependencies"

if [ -f "$BACKEND_DIR/venv/bin/python" ]; then
    PYTHON="$BACKEND_DIR/venv/bin/python"
    log_info "Virtual environment found"
else
    PYTHON="python3"
    log_warn "No venv found, using system python"
fi

echo "Checking boto3 (AWS SDK)..."
if $PYTHON -c "import boto3" 2>/dev/null; then
    log_info "boto3 is installed"
else
    log_error "boto3 is NOT installed"
    echo "    Install: pip install boto3"
fi

echo "Checking other dependencies..."
$PYTHON -c "import fastapi, motor, pymongo" 2>/dev/null
if [ $? -eq 0 ]; then
    log_info "Core dependencies installed"
else
    log_warn "Some dependencies might be missing"
fi

# ============================================================================
# Check 4: Environment Variables
# ============================================================================
log_step "Check 4: Environment Variables"

if [ -f "$BACKEND_DIR/.env" ]; then
    echo "Environment variables in .env:"
    grep -E "^(AWS_REGION|USE_DYNAMODB|DYNAMODB_TABLE_PREFIX|JWT_SECRET_KEY)" "$BACKEND_DIR/.env" 2>/dev/null || echo "    No DynamoDB variables found"
else
    echo "No .env file, checking systemd environment..."
    sudo systemctl show arbrit-backend --property=Environment 2>/dev/null | grep -i "AWS\|DYNAMO" || log_warn "No DynamoDB environment variables found"
fi

# ============================================================================
# Check 5: IAM Permissions
# ============================================================================
log_step "Check 5: IAM Permissions (DynamoDB Access)"

echo "Testing DynamoDB access..."
aws dynamodb list-tables --region us-east-1 --output json 2>/dev/null > /tmp/dynamo-test.json

if [ $? -eq 0 ]; then
    TABLE_COUNT=$(cat /tmp/dynamo-test.json | jq '.TableNames | length' 2>/dev/null || echo "0")
    log_info "DynamoDB access OK - Found $TABLE_COUNT tables"
else
    log_error "Cannot access DynamoDB!"
    echo "    EC2 instance needs IAM role with DynamoDB permissions"
    echo "    Go to: EC2 Console → Instance → Actions → Security → Modify IAM role"
    echo "    Attach: AmazonDynamoDBFullAccess policy"
fi

# ============================================================================
# Check 6: DynamoDB Tables
# ============================================================================
log_step "Check 6: DynamoDB Tables"

echo "Checking required tables..."

REQUIRED_TABLES=(
    "arbrit-users"
    "arbrit-employees"
    "arbrit-leads"
    "arbrit-quotations"
)

MISSING=0
for table in "${REQUIRED_TABLES[@]}"; do
    if aws dynamodb describe-table --table-name "$table" --region us-east-1 &>/dev/null; then
        ITEM_COUNT=$(aws dynamodb scan --table-name "$table" --select COUNT --region us-east-1 --output json 2>/dev/null | jq -r '.Count // 0')
        log_info "$table exists ($ITEM_COUNT items)"
    else
        log_error "$table NOT found"
        MISSING=$((MISSING + 1))
    fi
done

if [ $MISSING -gt 0 ]; then
    echo ""
    log_error "$MISSING tables are missing!"
    echo "    You need to create DynamoDB tables first"
fi

# ============================================================================
# Check 7: Backend Logs
# ============================================================================
log_step "Check 7: Recent Backend Logs"

echo "Last 20 lines from backend logs:"
echo "-----------------------------------"
sudo journalctl -u arbrit-backend -n 20 --no-pager 2>/dev/null || echo "Cannot read logs (service might not exist)"

# ============================================================================
# Check 8: Test Backend Endpoint
# ============================================================================
log_step "Check 8: Backend Health Check"

echo "Testing backend health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:8001/api/health 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "Response: $HEALTH_RESPONSE"
    if [[ "$HEALTH_RESPONSE" == *"healthy"* ]]; then
        log_info "Backend is responding"
    else
        log_warn "Backend responded but might have issues"
    fi
else
    log_error "Cannot connect to backend on port 8001"
    echo "    Backend might not be running or port is wrong"
fi

# ============================================================================
# Summary & Recommendations
# ============================================================================
log_step "Summary & Recommendations"

echo ""
echo "Common Issues & Solutions:"
echo ""
echo "1. If 'dynamodb_layer.py is MISSING':"
echo "   → Upload it: scp -i key.pem backend/dynamodb_layer.py ec2-user@IP:~/backend/"
echo ""
echo "2. If 'Cannot access DynamoDB':"
echo "   → Add IAM role to EC2 with DynamoDB permissions"
echo ""
echo "3. If 'boto3 is NOT installed':"
echo "   → Install: source venv/bin/activate && pip install boto3"
echo ""
echo "4. If 'Tables NOT found':"
echo "   → Create tables first, then import JSON data"
echo ""
echo "5. If 'Tables exist but 0 items':"
echo "   → Run: ./import-json-to-dynamodb.sh"
echo ""

# ============================================================================
# Quick Fix Commands
# ============================================================================
log_step "Quick Fix Commands"

echo ""
echo "If backend service exists but not running:"
echo "  sudo systemctl restart arbrit-backend"
echo ""
echo "To view real-time logs:"
echo "  sudo journalctl -u arbrit-backend -f"
echo ""
echo "To test DynamoDB access:"
echo "  aws dynamodb list-tables --region us-east-1"
echo ""
echo "To check if data exists:"
echo "  aws dynamodb scan --table-name arbrit-users --max-items 1 --region us-east-1"
echo ""

echo "============================================"
echo "Diagnostic Complete"
echo "============================================"



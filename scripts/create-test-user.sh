#!/bin/bash
# ============================================================================
# Create Test User in DynamoDB
# ============================================================================
# This script creates a test user directly in DynamoDB
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "============================================"
echo "Create Test User in DynamoDB"
echo "============================================"
echo ""

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
TABLE_NAME="arbrit-users"

# Get user input
echo "Select user role:"
echo "1. HR Manager"
echo "2. Sales Head"
echo "3. Sales Employee"
echo "4. Tele Sales"
echo "5. Field Sales"
echo "6. Academic Head"
echo "7. Accounts"
echo "8. Trainer"
echo "9. Dispatch Head"
echo ""
read -p "Enter choice (1-9): " role_choice

case $role_choice in
    1) ROLE="hr" NAME="HR Test User" ;;
    2) ROLE="sales_head" NAME="Sales Head Test" ;;
    3) ROLE="sales" NAME="Sales Employee Test" ;;
    4) ROLE="tele_sales" NAME="Tele Sales Test" ;;
    5) ROLE="field_sales" NAME="Field Sales Test" ;;
    6) ROLE="academic_head" NAME="Academic Head Test" ;;
    7) ROLE="accounts" NAME="Accounts Test" ;;
    8) ROLE="trainer" NAME="Trainer Test" ;;
    9) ROLE="dispatch_head" NAME="Dispatch Head Test" ;;
    *) log_error "Invalid choice"; exit 1 ;;
esac

echo ""
read -p "Enter mobile number (e.g., 971501234567): " MOBILE
read -p "Enter 4-digit PIN (e.g., 1234): " PIN

if [ -z "$MOBILE" ] || [ -z "$PIN" ]; then
    log_error "Mobile and PIN are required"
    exit 1
fi

log_info "Creating user..."
log_info "  Name: $NAME"
log_info "  Mobile: $MOBILE"
log_info "  Role: $ROLE"
log_info "  PIN: $PIN"
echo ""

# Generate PIN hash (bcrypt)
# Note: This is a simplified version. Real bcrypt hash would be different
PIN_HASH=$(python3 << EOF
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
print(pwd_context.hash("$PIN"))
EOF
)

# Generate UUID for user ID
USER_ID=$(python3 -c "import uuid; print(str(uuid.uuid4()))")

# Current timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%6NZ")

# Create user in DynamoDB
cat > /tmp/user-item.json << EOF
{
  "id": {"S": "$USER_ID"},
  "mobile": {"S": "$MOBILE"},
  "pin_hash": {"S": "$PIN_HASH"},
  "name": {"S": "$NAME"},
  "role": {"S": "$ROLE"},
  "created_at": {"S": "$TIMESTAMP"}
}
EOF

log_info "Inserting user into DynamoDB..."

aws dynamodb put-item \
  --table-name "$TABLE_NAME" \
  --item file:///tmp/user-item.json \
  --region "$AWS_REGION"

if [ $? -eq 0 ]; then
    log_info "✅ User created successfully!"
    echo ""
    echo "============================================"
    echo "Login Credentials:"
    echo "============================================"
    echo "Mobile: $MOBILE"
    echo "PIN: $PIN"
    echo "Role: $ROLE"
    echo "============================================"
else
    log_error "Failed to create user"
    exit 1
fi

# Cleanup
rm -f /tmp/user-item.json

echo ""
log_info "You can now login with these credentials"


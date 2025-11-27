#!/bin/bash

# ============================================
# Health Check Script for Arbrit Safety
# Tests all endpoints and services
# ============================================

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:8001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost}"

# ============================================
# Functions
# ============================================

check_endpoint() {
    local url=$1
    local name=$2
    
    if curl -f -s -o /dev/null -w "%{http_code}" "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name: OK"
        return 0
    else
        echo -e "${RED}✗${NC} $name: FAILED"
        return 1
    fi
}

check_service() {
    local service=$1
    
    if systemctl is-active --quiet "$service"; then
        echo -e "${GREEN}✓${NC} Service $service: Running"
        return 0
    else
        echo -e "${RED}✗${NC} Service $service: Stopped"
        return 1
    fi
}

# ============================================
# Main Health Checks
# ============================================

echo "=========================================="
echo "Arbrit Safety - Health Check"
echo "=========================================="
echo ""

# Backend Checks
echo "Backend Health:"
check_endpoint "$BACKEND_URL/api/health" "Backend Health Endpoint"
check_endpoint "$BACKEND_URL/docs" "API Documentation"

echo ""

# Frontend Checks
echo "Frontend Health:"
check_endpoint "$FRONTEND_URL" "Frontend Home"
check_endpoint "$FRONTEND_URL/login" "Login Page"

echo ""

# Service Checks (if running on EC2)
if command -v systemctl &> /dev/null; then
    echo "Service Status:"
    check_service "arbrit-backend" || true
    check_service "nginx" || true
    echo ""
fi

# MongoDB Connection Test
echo "Database Connection:"
if command -v python3 &> /dev/null; then
    python3 << EOF
try:
    from pymongo import MongoClient
    import os
    
    mongo_url = os.environ.get('MONGO_URL', '')
    if mongo_url:
        client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
        client.server_info()
        print('\033[0;32m✓\033[0m MongoDB: Connected')
    else:
        print('\033[1;33m⚠\033[0m MongoDB: MONGO_URL not set')
except Exception as e:
    print(f'\033[0;31m✗\033[0m MongoDB: Connection failed - {str(e)}')
EOF
else
    echo -e "${YELLOW}⚠${NC} Python not available for MongoDB check"
fi

echo ""

# Disk Space Check
echo "Disk Space:"
df -h / | tail -1 | awk '{
    used = int($5);
    if (used >= 90) {
        printf "\033[0;31m✗\033[0m Disk usage: %s (Critical)\n", $5
    } else if (used >= 75) {
        printf "\033[1;33m⚠\033[0m Disk usage: %s (Warning)\n", $5
    } else {
        printf "\033[0;32m✓\033[0m Disk usage: %s\n", $5
    }
}'

# Memory Check
echo ""
echo "Memory Usage:"
free -h | grep Mem | awk '{
    printf "Total: %s | Used: %s | Free: %s\n", $2, $3, $4
}'

# CPU Load
echo ""
echo "CPU Load:"
uptime | awk '{print "Load average:", $(NF-2), $(NF-1), $NF}'

echo ""
echo "=========================================="
echo "Health check completed"
echo "=========================================="


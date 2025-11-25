#!/bin/bash
# MongoDB Backup Script
# Exports all collections to JSON files

set -e

# Configuration
MONGO_URL="${MONGO_URL}"
DB_NAME="${DB_NAME:-arbrit-workdesk}"
BACKUP_DIR="mongodb-backup-$(date +%Y%m%d-%H%M%S)"

echo "================================================"
echo "MongoDB Backup Script"
echo "================================================"
echo ""

# Check if MONGO_URL is set
if [ -z "$MONGO_URL" ]; then
    echo "❌ ERROR: MONGO_URL environment variable not set"
    echo ""
    echo "Please set your MongoDB connection string:"
    echo "  export MONGO_URL='mongodb+srv://user:pass@cluster.mongodb.net/arbrit-workdesk'"
    echo ""
    exit 1
fi

# Check if mongoexport is installed
if ! command -v mongoexport &> /dev/null; then
    echo "❌ ERROR: mongoexport not found"
    echo ""
    echo "Please install MongoDB Database Tools:"
    echo "  https://www.mongodb.com/try/download/database-tools"
    echo ""
    echo "Or use the Python backup script instead:"
    echo "  python3 backup-mongodb.py"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"
echo "📁 Backup directory: $BACKUP_DIR"
echo ""

# List of collections to backup
COLLECTIONS=(
    "users"
    "employees"
    "attendance"
    "employee_documents"
    "company_documents"
    "leads"
    "quotations"
    "invoices"
    "invoice_requests"
    "payments"
    "training_sessions"
    "certificate_requests"
    "certificates"
    "certificate_templates"
    "certificate_candidates"
    "trainer_requests"
    "work_orders"
    "assessment_forms"
    "assessment_submissions"
    "visit_logs"
    "expense_claims"
    "leave_requests"
    "delivery_tasks"
)

echo "🚀 Starting backup..."
echo "================================================"

total=${#COLLECTIONS[@]}
current=0

for collection in "${COLLECTIONS[@]}"; do
    current=$((current + 1))
    echo ""
    echo "[$current/$total] Backing up: $collection"
    
    mongoexport \
        --uri="$MONGO_URL" \
        --db="$DB_NAME" \
        --collection="$collection" \
        --out="$BACKUP_DIR/${collection}.json" \
        --jsonArray \
        2>&1 | grep -E "exported|error|Error" || true
    
    if [ -f "$BACKUP_DIR/${collection}.json" ]; then
        count=$(jq '. | length' "$BACKUP_DIR/${collection}.json" 2>/dev/null || echo "unknown")
        size=$(du -h "$BACKUP_DIR/${collection}.json" | cut -f1)
        echo "   ✅ Exported $count documents ($size)"
    else
        echo "   ⚠️  No data or collection doesn't exist"
    fi
done

echo ""
echo "================================================"
echo "✅ Backup Complete!"
echo "================================================"
echo ""
echo "Backup location: $BACKUP_DIR"
echo "Total size: $(du -sh $BACKUP_DIR | cut -f1)"
echo ""
echo "Files created:"
ls -lh "$BACKUP_DIR" | tail -n +2 | awk '{print "  - " $9 " (" $5 ")"}'
echo ""
echo "To import to DynamoDB:"
echo "  python3 import-backup-to-dynamodb.py $BACKUP_DIR"
echo ""
echo "================================================"



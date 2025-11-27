#!/bin/bash
# Complete DynamoDB Setup and Import Script
# This script will:
# 1. Prepare JSON files
# 2. Create DynamoDB tables
# 3. Import all data from JSON files

set -e

echo "============================================================"
echo "DynamoDB Setup and Import Script"
echo "============================================================"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
JSON_DIR="$PROJECT_ROOT/Json"
BACKUP_DIR="$PROJECT_ROOT/mongodb-backup-prepared"

echo "📁 Project root: $PROJECT_ROOT"
echo "📁 JSON directory: $JSON_DIR"
echo ""

# Check if JSON directory exists
if [ ! -d "$JSON_DIR" ]; then
    echo "❌ ERROR: JSON directory not found: $JSON_DIR"
    exit 1
fi

# Count JSON files
json_count=$(ls -1 "$JSON_DIR"/*.json 2>/dev/null | wc -l)
echo "Found $json_count JSON files"
echo ""

# Step 1: Prepare JSON files (rename them)
echo "============================================================"
echo "STEP 1: Preparing JSON Files"
echo "============================================================"
echo ""

# Create backup directory
rm -rf "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Copy and rename files
cd "$JSON_DIR"
for file in arbrit-workdesk.*.json; do
    if [ -f "$file" ]; then
        # Remove 'arbrit-workdesk.' prefix
        new_name="${file#arbrit-workdesk.}"
        echo "  Copying: $file -> $new_name"
        cp "$file" "$BACKUP_DIR/$new_name"
    fi
done

echo ""
echo "✅ JSON files prepared in: $BACKUP_DIR"
echo ""

# Step 2: Check AWS credentials
echo "============================================================"
echo "STEP 2: Checking AWS Credentials"
echo "============================================================"
echo ""

if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "⚠️  AWS credentials not found in environment variables"
    echo ""
    echo "Please provide your AWS credentials:"
    echo ""
    
    # Prompt for AWS credentials
    read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
    read -sp "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
    echo ""
    read -p "AWS Region (default: us-east-1): " AWS_REGION
    AWS_REGION=${AWS_REGION:-us-east-1}
    
    export AWS_ACCESS_KEY_ID
    export AWS_SECRET_ACCESS_KEY
    export AWS_REGION
    echo ""
else
    echo "✅ AWS credentials found"
    AWS_REGION=${AWS_REGION:-us-east-1}
    echo "   Region: $AWS_REGION"
fi

echo ""

# Step 3: Install dependencies
echo "============================================================"
echo "STEP 3: Installing Dependencies"
echo "============================================================"
echo ""

echo "Installing boto3..."
pip3 install boto3 --break-system-packages --quiet 2>&1 | tail -5 || pip3 install boto3 --user --quiet 2>&1 | tail -5

echo "✅ Dependencies installed"
echo ""

# Step 4: Create DynamoDB tables
echo "============================================================"
echo "STEP 4: Creating DynamoDB Tables"
echo "============================================================"
echo ""

cd "$SCRIPT_DIR"
python3 << 'PYTHON_SCRIPT'
import boto3
import os
import sys
import json
from botocore.exceptions import ClientError

AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

# Table definitions
TABLES = [
    {
        "TableName": "arbrit-users",
        "KeySchema": [{"AttributeName": "mobile", "KeyType": "HASH"}],
        "AttributeDefinitions": [
            {"AttributeName": "mobile", "AttributeType": "S"},
            {"AttributeName": "id", "AttributeType": "S"}
        ],
        "GlobalSecondaryIndexes": [{
            "IndexName": "id-index",
            "KeySchema": [{"AttributeName": "id", "KeyType": "HASH"}],
            "Projection": {"ProjectionType": "ALL"}
        }],
        "BillingMode": "PAY_PER_REQUEST"
    },
    {
        "TableName": "arbrit-employees",
        "KeySchema": [{"AttributeName": "id", "KeyType": "HASH"}],
        "AttributeDefinitions": [
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "mobile", "AttributeType": "S"},
            {"AttributeName": "department", "AttributeType": "S"}
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "mobile-index",
                "KeySchema": [{"AttributeName": "mobile", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"}
            },
            {
                "IndexName": "department-index",
                "KeySchema": [{"AttributeName": "department", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"}
            }
        ],
        "BillingMode": "PAY_PER_REQUEST"
    },
    {
        "TableName": "arbrit-attendance",
        "KeySchema": [{"AttributeName": "id", "KeyType": "HASH"}],
        "AttributeDefinitions": [
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "employee_id", "AttributeType": "S"},
            {"AttributeName": "date", "AttributeType": "S"}
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "employee_id-index",
                "KeySchema": [{"AttributeName": "employee_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"}
            },
            {
                "IndexName": "date-index",
                "KeySchema": [{"AttributeName": "date", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"}
            }
        ],
        "BillingMode": "PAY_PER_REQUEST"
    }
]

# Simple tables (only 'id' as primary key)
SIMPLE_TABLES = [
    "arbrit-employee-documents",
    "arbrit-company-documents",
    "arbrit-leads",
    "arbrit-quotations",
    "arbrit-invoices",
    "arbrit-invoice-requests",
    "arbrit-payments",
    "arbrit-training-sessions",
    "arbrit-certificate-requests",
    "arbrit-certificates",
    "arbrit-certificate-templates",
    "arbrit-certificate-candidates",
    "arbrit-trainer-requests",
    "arbrit-work-orders",
    "arbrit-assessment-forms",
    "arbrit-assessment-submissions",
    "arbrit-visit-logs",
    "arbrit-expense-claims",
    "arbrit-leave-requests",
    "arbrit-delivery-tasks"
]

try:
    dynamodb = boto3.client('dynamodb', region_name=AWS_REGION)
    
    # Get existing tables
    existing_tables = dynamodb.list_tables()['TableNames']
    
    created = 0
    skipped = 0
    
    # Create complex tables
    for table_def in TABLES:
        table_name = table_def['TableName']
        if table_name in existing_tables:
            print(f"   ⏭️  Table already exists: {table_name}")
            skipped += 1
        else:
            print(f"   Creating table: {table_name}...")
            dynamodb.create_table(**table_def)
            created += 1
            print(f"   ✅ Created: {table_name}")
    
    # Create simple tables
    for table_name in SIMPLE_TABLES:
        if table_name in existing_tables:
            print(f"   ⏭️  Table already exists: {table_name}")
            skipped += 1
        else:
            print(f"   Creating table: {table_name}...")
            dynamodb.create_table(
                TableName=table_name,
                KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
                AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
                BillingMode="PAY_PER_REQUEST"
            )
            created += 1
            print(f"   ✅ Created: {table_name}")
    
    print(f"\n✅ Tables created: {created}")
    print(f"⏭️  Tables skipped: {skipped}")
    
    if created > 0:
        print("\n⏳ Waiting 30 seconds for tables to become active...")
        import time
        time.sleep(30)
    
except Exception as e:
    print(f"\n❌ Error creating tables: {str(e)}")
    sys.exit(1)

PYTHON_SCRIPT

echo ""

# Step 5: Import data
echo "============================================================"
echo "STEP 5: Importing Data to DynamoDB"
echo "============================================================"
echo ""

cd "$SCRIPT_DIR"
python3 import-backup-to-dynamodb.py "$BACKUP_DIR"

echo ""
echo "============================================================"
echo "✅ IMPORT COMPLETE!"
echo "============================================================"
echo ""
echo "Your MongoDB data has been imported to DynamoDB."
echo ""
echo "Next steps:"
echo "1. Update your application to use DynamoDB instead of MongoDB"
echo "2. Test all functionality"
echo "3. Keep the JSON backup files safe"
echo ""
echo "DynamoDB tables created with PAY_PER_REQUEST billing mode."
echo "You only pay for what you use!"
echo ""



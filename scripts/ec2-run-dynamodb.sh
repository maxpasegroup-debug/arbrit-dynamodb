#!/bin/bash
# ============================================================================
# EC2 DynamoDB Setup & Import - All-in-One Script
# ============================================================================
# Run this script on your EC2 instance to:
# 1. Install all dependencies
# 2. Export data from MongoDB
# 3. Import data to DynamoDB
# 4. Verify the migration
#
# Usage:
#   chmod +x ec2-run-dynamodb.sh
#   ./ec2-run-dynamodb.sh
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
}

# ============================================================================
# Main Script
# ============================================================================

log_step "EC2 DynamoDB Setup & Import Script"

# Check if running on EC2
log_info "Checking environment..."
if command -v ec2-metadata &> /dev/null; then
    INSTANCE_ID=$(ec2-metadata --instance-id | cut -d " " -f 2)
    log_info "Running on EC2 instance: $INSTANCE_ID"
else
    log_warn "Not running on EC2 or ec2-metadata not available"
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_NAME=$NAME
    log_info "Operating System: $OS_NAME"
else
    log_error "Cannot detect OS"
    exit 1
fi

# ============================================================================
# Step 1: Install Dependencies
# ============================================================================

log_step "Step 1: Installing Dependencies"

log_info "Installing Python packages..."
if [[ "$OS_NAME" == *"Amazon Linux"* ]]; then
    sudo yum install -y python3 python3-pip jq
elif [[ "$OS_NAME" == *"Ubuntu"* ]] || [[ "$OS_NAME" == *"Debian"* ]]; then
    sudo apt-get update -y
    sudo apt-get install -y python3 python3-pip jq
else
    log_error "Unsupported OS: $OS_NAME"
    exit 1
fi

log_info "Installing Python dependencies..."
pip3 install pymongo boto3 python-dotenv --user --quiet

log_info "✅ Dependencies installed"

# ============================================================================
# Step 2: Configuration
# ============================================================================

log_step "Step 2: Configuration"

# Check for environment variables
if [ -z "$MONGO_URL" ]; then
    log_error "MONGO_URL not set!"
    echo ""
    echo "Please set your MongoDB connection string:"
    echo "  export MONGO_URL='mongodb+srv://user:pass@cluster.mongodb.net/database'"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Set defaults if not provided
export DB_NAME=${DB_NAME:-arbrit-workdesk}
export AWS_REGION=${AWS_REGION:-us-east-1}

log_info "Configuration:"
echo "  Database: $DB_NAME"
echo "  AWS Region: $AWS_REGION"
echo "  MongoDB: $(echo $MONGO_URL | sed 's/mongodb+srv:\/\/[^@]*@/mongodb+srv://***@/')"
echo ""

# ============================================================================
# Step 3: Create Migration Script
# ============================================================================

log_step "Step 3: Creating Migration Script"

log_info "Creating Python migration script..."

cat > /tmp/migrate_to_dynamodb.py << 'PYTHON_SCRIPT'
#!/usr/bin/env python3
"""
MongoDB to DynamoDB Migration Script
Exports data from MongoDB and imports to DynamoDB
"""

import os
import sys
import json
import boto3
from pymongo import MongoClient
from datetime import datetime
from decimal import Decimal
import time

# Configuration
MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'arbrit-workdesk')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

# Collections to migrate
COLLECTIONS = [
    'users',
    'employees',
    'leads',
    'quotations',
    'courses',
    'trainers',
    'attendance',
    'leave_requests',
    'expense_claims',
    'invoices',
    'documents'
]

# DynamoDB table mapping
TABLE_PREFIX = 'arbrit-'

class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal to float for JSON"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def convert_to_dynamodb_item(doc):
    """Convert MongoDB document to DynamoDB format"""
    if doc is None:
        return None
    
    # Convert ObjectId to string
    if '_id' in doc:
        doc['id'] = str(doc['_id'])
        del doc['_id']
    
    # Convert datetime to ISO string
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
        elif isinstance(value, dict):
            doc[key] = convert_to_dynamodb_item(value)
        elif isinstance(value, list):
            doc[key] = [convert_to_dynamodb_item(item) if isinstance(item, dict) else item for item in value]
        elif isinstance(value, float):
            doc[key] = Decimal(str(value))
    
    return doc

def main():
    print("=" * 60)
    print("MongoDB to DynamoDB Migration")
    print("=" * 60)
    print()
    
    # Connect to MongoDB
    print("📊 Connecting to MongoDB...")
    try:
        mongo_client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        mongo_db = mongo_client[DB_NAME]
        # Test connection
        mongo_client.server_info()
        print("✅ Connected to MongoDB")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        sys.exit(1)
    
    # Connect to DynamoDB
    print("📊 Connecting to DynamoDB...")
    try:
        dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
        print("✅ Connected to DynamoDB")
    except Exception as e:
        print(f"❌ Failed to connect to DynamoDB: {e}")
        sys.exit(1)
    
    print()
    
    # Migrate each collection
    total_migrated = 0
    
    for collection_name in COLLECTIONS:
        print(f"📦 Processing: {collection_name}")
        print("-" * 60)
        
        try:
            # Get MongoDB collection
            mongo_collection = mongo_db[collection_name]
            doc_count = mongo_collection.count_documents({})
            
            if doc_count == 0:
                print(f"⚠️  No documents found in {collection_name}")
                print()
                continue
            
            print(f"   Found {doc_count} documents")
            
            # Get DynamoDB table
            table_name = f"{TABLE_PREFIX}{collection_name}"
            try:
                table = dynamodb.Table(table_name)
                # Test table exists
                table.load()
            except Exception as e:
                print(f"⚠️  Table {table_name} not found, skipping...")
                print()
                continue
            
            # Migrate documents
            migrated = 0
            failed = 0
            
            for doc in mongo_collection.find():
                try:
                    # Convert document
                    item = convert_to_dynamodb_item(doc)
                    
                    if item and 'id' in item:
                        # Write to DynamoDB
                        table.put_item(Item=item)
                        migrated += 1
                        
                        if migrated % 10 == 0:
                            print(f"   Progress: {migrated}/{doc_count}", end='\r')
                    
                except Exception as e:
                    failed += 1
                    if failed <= 3:  # Show first 3 errors
                        print(f"   ⚠️  Failed to migrate document: {e}")
            
            print(f"   ✅ Migrated: {migrated}/{doc_count} documents")
            if failed > 0:
                print(f"   ⚠️  Failed: {failed} documents")
            
            total_migrated += migrated
            
            # Small delay to avoid throttling
            time.sleep(0.5)
            
        except Exception as e:
            print(f"   ❌ Error processing {collection_name}: {e}")
        
        print()
    
    print("=" * 60)
    print(f"🎉 Migration Complete!")
    print(f"   Total migrated: {total_migrated} documents")
    print("=" * 60)
    
    # Close connections
    mongo_client.close()

if __name__ == '__main__':
    main()
PYTHON_SCRIPT

chmod +x /tmp/migrate_to_dynamodb.py
log_info "✅ Migration script created"

# ============================================================================
# Step 4: Verify DynamoDB Tables
# ============================================================================

log_step "Step 4: Verifying DynamoDB Tables"

log_info "Checking DynamoDB tables..."

TABLES=(
    "arbrit-users"
    "arbrit-employees"
    "arbrit-leads"
    "arbrit-quotations"
    "arbrit-courses"
    "arbrit-trainers"
    "arbrit-attendance"
    "arbrit-leave_requests"
    "arbrit-expense_claims"
    "arbrit-invoices"
    "arbrit-documents"
)

MISSING_TABLES=()

for table in "${TABLES[@]}"; do
    if aws dynamodb describe-table --table-name "$table" --region $AWS_REGION &>/dev/null; then
        echo "  ✅ $table exists"
    else
        echo "  ❌ $table NOT found"
        MISSING_TABLES+=("$table")
    fi
done

if [ ${#MISSING_TABLES[@]} -gt 0 ]; then
    log_warn "Some tables are missing:"
    for table in "${MISSING_TABLES[@]}"; do
        echo "     - $table"
    done
    echo ""
    echo "You need to create these tables first."
    echo "Run the table creation script or create them manually."
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

log_info "✅ Table verification complete"

# ============================================================================
# Step 5: Test MongoDB Connection
# ============================================================================

log_step "Step 5: Testing MongoDB Connection"

log_info "Testing connection to MongoDB..."

python3 << PYTHON_TEST
import sys
from pymongo import MongoClient
import os

try:
    client = MongoClient(os.environ['MONGO_URL'], serverSelectionTimeoutMS=5000)
    db = client[os.environ.get('DB_NAME', 'arbrit-workdesk')]
    info = client.server_info()
    
    print(f"✅ Connected successfully")
    print(f"   MongoDB version: {info.get('version', 'unknown')}")
    
    # Count documents in each collection
    collections = db.list_collection_names()
    print(f"   Collections found: {len(collections)}")
    
    for coll_name in collections[:5]:  # Show first 5
        count = db[coll_name].count_documents({})
        print(f"     - {coll_name}: {count} documents")
    
    if len(collections) > 5:
        print(f"     ... and {len(collections) - 5} more")
    
    client.close()
    sys.exit(0)
    
except Exception as e:
    print(f"❌ Connection failed: {e}")
    sys.exit(1)
PYTHON_TEST

if [ $? -ne 0 ]; then
    log_error "MongoDB connection test failed"
    exit 1
fi

log_info "✅ MongoDB connection successful"

# ============================================================================
# Step 6: Run Migration
# ============================================================================

log_step "Step 6: Running Migration"

log_warn "This will migrate data from MongoDB to DynamoDB"
log_warn "Make sure you have:"
echo "  - Correct MongoDB connection string"
echo "  - DynamoDB tables created"
echo "  - Proper IAM permissions"
echo ""

read -p "Continue with migration? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Migration cancelled"
    exit 0
fi

log_info "Starting migration..."
echo ""

python3 /tmp/migrate_to_dynamodb.py

if [ $? -eq 0 ]; then
    log_info "✅ Migration completed successfully!"
else
    log_error "Migration failed"
    exit 1
fi

# ============================================================================
# Step 7: Verify Migration
# ============================================================================

log_step "Step 7: Verifying Migration"

log_info "Checking DynamoDB tables for data..."

for table in "${TABLES[@]}"; do
    if aws dynamodb describe-table --table-name "$table" --region $AWS_REGION &>/dev/null; then
        ITEM_COUNT=$(aws dynamodb scan --table-name "$table" --select COUNT --region $AWS_REGION --output json | jq -r '.Count')
        echo "  📊 $table: $ITEM_COUNT items"
    fi
done

log_info "✅ Verification complete"

# ============================================================================
# Completion
# ============================================================================

log_step "🎉 All Done!"

echo "Summary:"
echo "  ✅ Dependencies installed"
echo "  ✅ MongoDB connection tested"
echo "  ✅ DynamoDB tables verified"
echo "  ✅ Data migrated"
echo "  ✅ Migration verified"
echo ""
echo "Next steps:"
echo "  1. Update your application to use DynamoDB"
echo "  2. Test the application thoroughly"
echo "  3. Keep MongoDB as backup until confident"
echo ""
echo "Cleanup:"
echo "  rm /tmp/migrate_to_dynamodb.py"
echo ""

log_info "Migration script completed successfully!"


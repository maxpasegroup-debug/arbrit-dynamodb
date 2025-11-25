#!/bin/bash
# ============================================================================
# Import JSON Files to DynamoDB
# ============================================================================
# This script imports JSON files directly to DynamoDB tables
# No MongoDB connection needed!
#
# Usage:
#   chmod +x import-json-to-dynamodb.sh
#   ./import-json-to-dynamodb.sh
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Configuration
# ============================================================================

# JSON files directory (adjust if needed)
JSON_DIR="./JSON"

# AWS Region
AWS_REGION="${AWS_REGION:-us-east-1}"

# DynamoDB table prefix
TABLE_PREFIX="arbrit-"

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

log_step "Import JSON Files to DynamoDB"

# Check if JSON directory exists
if [ ! -d "$JSON_DIR" ]; then
    log_error "JSON directory not found: $JSON_DIR"
    echo ""
    echo "Please make sure the JSON folder is in the current directory."
    echo "Expected structure:"
    echo "  ./JSON/"
    echo "    ├── arbrit-workdesk.users.json"
    echo "    ├── arbrit-workdesk.employees.json"
    echo "    └── ..."
    echo ""
    exit 1
fi

log_info "JSON directory found: $JSON_DIR"
log_info "AWS Region: $AWS_REGION"
echo ""

# ============================================================================
# Step 1: Install Dependencies
# ============================================================================

log_step "Step 1: Installing Dependencies"

log_info "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    log_error "Python 3 not found. Installing..."
    sudo yum install -y python3 python3-pip || sudo apt-get install -y python3 python3-pip
fi

log_info "Installing required Python packages..."
pip3 install boto3 --user --quiet

log_info "✅ Dependencies installed"

# ============================================================================
# Step 2: List Available JSON Files
# ============================================================================

log_step "Step 2: Scanning JSON Files"

log_info "Found JSON files:"
JSON_FILES=()
for file in "$JSON_DIR"/*.json; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        filesize=$(ls -lh "$file" | awk '{print $5}')
        echo "  📄 $filename ($filesize)"
        JSON_FILES+=("$file")
    fi
done

if [ ${#JSON_FILES[@]} -eq 0 ]; then
    log_error "No JSON files found in $JSON_DIR"
    exit 1
fi

echo ""
log_info "Total files found: ${#JSON_FILES[@]}"

# ============================================================================
# Step 3: Create Import Script
# ============================================================================

log_step "Step 3: Creating Python Import Script"

cat > /tmp/import_json_to_dynamodb.py << 'PYTHON_SCRIPT'
#!/usr/bin/env python3
"""
Import JSON files to DynamoDB
Reads MongoDB JSON exports and imports to DynamoDB tables
"""

import os
import sys
import json
import boto3
from datetime import datetime
from decimal import Decimal
import time

# Configuration
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')
JSON_DIR = os.environ.get('JSON_DIR', './JSON')
TABLE_PREFIX = 'arbrit-'

class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal to float for JSON"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def convert_to_dynamodb_item(doc):
    """Convert MongoDB JSON document to DynamoDB format"""
    if doc is None:
        return None
    
    # Handle _id field
    if '_id' in doc:
        if isinstance(doc['_id'], dict) and '$oid' in doc['_id']:
            # MongoDB extended JSON format: {"_id": {"$oid": "..."}}
            doc['id'] = doc['_id']['$oid']
        elif isinstance(doc['_id'], str):
            # Simple string format
            doc['id'] = doc['_id']
        else:
            # Other format, convert to string
            doc['id'] = str(doc['_id'])
        del doc['_id']
    
    # Convert datetime fields
    def convert_value(value):
        if isinstance(value, dict):
            # MongoDB extended JSON datetime: {"$date": "..."}
            if '$date' in value:
                return value['$date']
            # Regular dict - recurse
            return {k: convert_value(v) for k, v in value.items()}
        elif isinstance(value, list):
            return [convert_value(item) for item in value]
        elif isinstance(value, float):
            return Decimal(str(value))
        elif isinstance(value, int):
            return value
        else:
            return value
    
    # Convert all values
    for key, value in list(doc.items()):
        doc[key] = convert_value(value)
    
    return doc

def get_table_name_from_filename(filename):
    """
    Extract table name from filename
    Examples:
      arbrit-workdesk.users.json -> arbrit-users
      arbrit-workdesk.employees.json -> arbrit-employees
    """
    # Remove path and extension
    base = os.path.basename(filename).replace('.json', '')
    
    # Extract collection name (after last dot before .json)
    parts = base.split('.')
    if len(parts) >= 2:
        collection_name = parts[-1]
    else:
        collection_name = base
    
    # Map collection names to table names
    table_name_map = {
        'users': 'users',
        'employees': 'employees',
        'leads': 'leads',
        'quotations': 'quotations',
        'courses': 'courses',
        'trainers': 'trainers',
        'attendance': 'attendance',
        'leave_requests': 'leave_requests',
        'expense_claims': 'expense_claims',
        'invoices': 'invoices',
        'documents': 'documents',
        'employee_documents': 'employee_documents',
        'company_documents': 'company_documents',
        'assessment_forms': 'assessment_forms',
        'trainer_requests': 'trainer_requests',
        'invoice_requests': 'invoice_requests',
        'visit_logs': 'visit_logs',
    }
    
    mapped_name = table_name_map.get(collection_name, collection_name)
    return f"{TABLE_PREFIX}{mapped_name}"

def import_json_file(filepath, dynamodb):
    """Import a single JSON file to DynamoDB"""
    filename = os.path.basename(filepath)
    table_name = get_table_name_from_filename(filename)
    
    print(f"\n📦 Processing: {filename}")
    print(f"   Target table: {table_name}")
    print("-" * 60)
    
    try:
        # Read JSON file
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Handle both array and single object
        if not isinstance(data, list):
            data = [data]
        
        doc_count = len(data)
        print(f"   Found {doc_count} documents")
        
        if doc_count == 0:
            print(f"   ⚠️  No documents to import")
            return 0
        
        # Get DynamoDB table
        try:
            table = dynamodb.Table(table_name)
            table.load()  # Test if table exists
        except Exception as e:
            print(f"   ⚠️  Table {table_name} not found, skipping...")
            print(f"   Error: {e}")
            return 0
        
        # Import documents
        migrated = 0
        failed = 0
        
        for doc in data:
            try:
                # Convert document
                item = convert_to_dynamodb_item(doc)
                
                if item and 'id' in item:
                    # Write to DynamoDB
                    table.put_item(Item=item)
                    migrated += 1
                    
                    if migrated % 10 == 0:
                        print(f"   Progress: {migrated}/{doc_count}", end='\r')
                else:
                    failed += 1
                    if failed <= 3:
                        print(f"   ⚠️  Skipped document without id")
                
            except Exception as e:
                failed += 1
                if failed <= 3:  # Show first 3 errors
                    print(f"   ⚠️  Failed to import document: {e}")
        
        print(f"   ✅ Migrated: {migrated}/{doc_count} documents")
        if failed > 0:
            print(f"   ⚠️  Failed: {failed} documents")
        
        return migrated
        
    except Exception as e:
        print(f"   ❌ Error processing file: {e}")
        return 0

def main():
    print("=" * 60)
    print("Import JSON Files to DynamoDB")
    print("=" * 60)
    print()
    
    # Check JSON directory
    if not os.path.exists(JSON_DIR):
        print(f"❌ JSON directory not found: {JSON_DIR}")
        sys.exit(1)
    
    # Connect to DynamoDB
    print("📊 Connecting to DynamoDB...")
    try:
        dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
        print(f"✅ Connected to DynamoDB (region: {AWS_REGION})")
    except Exception as e:
        print(f"❌ Failed to connect to DynamoDB: {e}")
        sys.exit(1)
    
    print()
    
    # Find all JSON files
    json_files = []
    for filename in os.listdir(JSON_DIR):
        if filename.endswith('.json'):
            filepath = os.path.join(JSON_DIR, filename)
            json_files.append(filepath)
    
    if not json_files:
        print(f"❌ No JSON files found in {JSON_DIR}")
        sys.exit(1)
    
    print(f"Found {len(json_files)} JSON files")
    print()
    
    # Import each file
    total_migrated = 0
    
    for filepath in sorted(json_files):
        migrated = import_json_file(filepath, dynamodb)
        total_migrated += migrated
        time.sleep(0.5)  # Small delay to avoid throttling
    
    print()
    print("=" * 60)
    print(f"🎉 Import Complete!")
    print(f"   Total imported: {total_migrated} documents")
    print(f"   Files processed: {len(json_files)}")
    print("=" * 60)

if __name__ == '__main__':
    main()
PYTHON_SCRIPT

chmod +x /tmp/import_json_to_dynamodb.py
log_info "✅ Import script created"

# ============================================================================
# Step 4: Verify DynamoDB Tables
# ============================================================================

log_step "Step 4: Verifying DynamoDB Tables"

log_info "Checking which DynamoDB tables exist..."

# Expected tables based on JSON files
EXPECTED_TABLES=(
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
    "arbrit-employee_documents"
    "arbrit-company_documents"
    "arbrit-assessment_forms"
    "arbrit-trainer_requests"
    "arbrit-invoice_requests"
    "arbrit-visit_logs"
)

MISSING_TABLES=()
EXISTING_TABLES=()

for table in "${EXPECTED_TABLES[@]}"; do
    if aws dynamodb describe-table --table-name "$table" --region "$AWS_REGION" &>/dev/null; then
        echo "  ✅ $table"
        EXISTING_TABLES+=("$table")
    else
        echo "  ⚠️  $table (not found - will skip)"
        MISSING_TABLES+=("$table")
    fi
done

echo ""
log_info "Tables found: ${#EXISTING_TABLES[@]}"
if [ ${#MISSING_TABLES[@]} -gt 0 ]; then
    log_warn "Missing tables: ${#MISSING_TABLES[@]} (these will be skipped)"
fi

# ============================================================================
# Step 5: Run Import
# ============================================================================

log_step "Step 5: Importing Data"

log_warn "This will import JSON files to DynamoDB tables"
log_warn "Existing data with same IDs will be overwritten!"
echo ""

read -p "Continue with import? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Import cancelled"
    exit 0
fi

log_info "Starting import..."
echo ""

# Set environment variables for Python script
export JSON_DIR="$JSON_DIR"
export AWS_REGION="$AWS_REGION"

# Run Python import script
python3 /tmp/import_json_to_dynamodb.py

if [ $? -eq 0 ]; then
    log_info "✅ Import completed successfully!"
else
    log_error "Import failed"
    exit 1
fi

# ============================================================================
# Step 6: Verify Import
# ============================================================================

log_step "Step 6: Verifying Import"

log_info "Checking DynamoDB tables for data..."

for table in "${EXISTING_TABLES[@]}"; do
    if aws dynamodb describe-table --table-name "$table" --region "$AWS_REGION" &>/dev/null; then
        ITEM_COUNT=$(aws dynamodb scan --table-name "$table" --select COUNT --region "$AWS_REGION" --output json 2>/dev/null | jq -r '.Count // 0')
        echo "  📊 $table: $ITEM_COUNT items"
    fi
done

log_info "✅ Verification complete"

# ============================================================================
# Completion
# ============================================================================

log_step "🎉 All Done!"

echo "Summary:"
echo "  ✅ JSON files processed"
echo "  ✅ Data imported to DynamoDB"
echo "  ✅ Import verified"
echo ""
echo "Next steps:"
echo "  1. Verify data in DynamoDB Console"
echo "  2. Update your application to use DynamoDB"
echo "  3. Test all application features"
echo ""
echo "Cleanup:"
echo "  rm /tmp/import_json_to_dynamodb.py"
echo ""

log_info "Import completed successfully!"



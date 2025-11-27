#!/bin/bash
# Quick MongoDB to DynamoDB Migration
# Run this script on your EC2 instance

set -e

echo "================================================"
echo "MongoDB to DynamoDB Quick Migration"
echo "================================================"
echo ""

# Check if MONGO_URL is set
if [ -z "$MONGO_URL" ]; then
    echo "❌ ERROR: MONGO_URL environment variable not set"
    echo ""
    echo "Please set your MongoDB connection string:"
    echo "  export MONGO_URL='mongodb+srv://user:pass@cluster.mongodb.net/arbrit-workdesk'"
    echo ""
    echo "Then run this script again:"
    echo "  ./quick-migrate.sh"
    exit 1
fi

# Set defaults
export DB_NAME="${DB_NAME:-arbrit-workdesk}"
export AWS_REGION="${AWS_REGION:-us-east-1}"

echo "Configuration:"
echo "  MongoDB: ${MONGO_URL:0:30}..."
echo "  Database: $DB_NAME"
echo "  AWS Region: $AWS_REGION"
echo ""

# Check if migration script exists
if [ ! -f "migrate-mongodb-to-dynamodb.py" ]; then
    echo "❌ Migration script not found!"
    echo ""
    echo "Please upload the script first:"
    echo "  scp -i key.pem migrate-mongodb-to-dynamodb.py ec2-user@YOUR-IP:~/"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pip3 install pymongo boto3 python-dotenv --user --quiet
echo "   ✅ Dependencies installed"
echo ""

# Run migration
echo "🚀 Starting migration..."
echo "================================================"
python3 migrate-mongodb-to-dynamodb.py

echo ""
echo "================================================"
echo "✅ Migration script completed!"
echo ""
echo "Next steps:"
echo "1. Review the output above for any errors"
echo "2. Test your application with DynamoDB"
echo "3. Keep MongoDB as backup for now"
echo "================================================"



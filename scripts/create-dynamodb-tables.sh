#!/bin/bash

# Create DynamoDB Tables for Arbrit Safety
# Run this script to create all required DynamoDB tables

set -e

REGION="us-east-1"

echo "Creating DynamoDB tables in region: $REGION"
echo "================================================"

# Function to create a simple table with just 'id' as primary key
create_simple_table() {
    TABLE_NAME=$1
    echo "Creating table: $TABLE_NAME"
    
    aws dynamodb create-table \
        --table-name "$TABLE_NAME" \
        --attribute-definitions AttributeName=id,AttributeType=S \
        --key-schema AttributeName=id,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region $REGION \
        2>/dev/null && echo "✓ Created $TABLE_NAME" || echo "⚠ $TABLE_NAME already exists or failed"
}

# Create Users table (primary key: mobile, GSI: id)
echo "Creating arbrit-users table..."
aws dynamodb create-table \
    --table-name arbrit-users \
    --attribute-definitions \
        AttributeName=mobile,AttributeType=S \
        AttributeName=id,AttributeType=S \
    --key-schema AttributeName=mobile,KeyType=HASH \
    --global-secondary-indexes \
        "[{\"IndexName\":\"id-index\",\"KeySchema\":[{\"AttributeName\":\"id\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
    --billing-mode PAY_PER_REQUEST \
    --region $REGION \
    2>/dev/null && echo "✓ Created arbrit-users" || echo "⚠ arbrit-users already exists or failed"

# Create Employees table (primary key: id, GSI: mobile, department)
echo "Creating arbrit-employees table..."
aws dynamodb create-table \
    --table-name arbrit-employees \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=mobile,AttributeType=S \
        AttributeName=department,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        "[{\"IndexName\":\"mobile-index\",\"KeySchema\":[{\"AttributeName\":\"mobile\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}},{\"IndexName\":\"department-index\",\"KeySchema\":[{\"AttributeName\":\"department\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
    --billing-mode PAY_PER_REQUEST \
    --region $REGION \
    2>/dev/null && echo "✓ Created arbrit-employees" || echo "⚠ arbrit-employees already exists or failed"

# Create Attendance table (primary key: id, GSI: employee_id, date)
echo "Creating arbrit-attendance table..."
aws dynamodb create-table \
    --table-name arbrit-attendance \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=employee_id,AttributeType=S \
        AttributeName=date,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        "[{\"IndexName\":\"employee_id-index\",\"KeySchema\":[{\"AttributeName\":\"employee_id\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}},{\"IndexName\":\"date-index\",\"KeySchema\":[{\"AttributeName\":\"date\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
    --billing-mode PAY_PER_REQUEST \
    --region $REGION \
    2>/dev/null && echo "✓ Created arbrit-attendance" || echo "⚠ arbrit-attendance already exists or failed"

# Create all simple tables (with just 'id' as primary key)
create_simple_table "arbrit-employee-documents"
create_simple_table "arbrit-company-documents"
create_simple_table "arbrit-leads"
create_simple_table "arbrit-quotations"
create_simple_table "arbrit-invoices"
create_simple_table "arbrit-invoice-requests"
create_simple_table "arbrit-payments"
create_simple_table "arbrit-training-sessions"
create_simple_table "arbrit-certificate-requests"
create_simple_table "arbrit-certificates"
create_simple_table "arbrit-certificate-templates"
create_simple_table "arbrit-certificate-candidates"
create_simple_table "arbrit-trainer-requests"
create_simple_table "arbrit-work-orders"
create_simple_table "arbrit-assessment-forms"
create_simple_table "arbrit-assessment-submissions"
create_simple_table "arbrit-visit-logs"
create_simple_table "arbrit-expense-claims"
create_simple_table "arbrit-leave-requests"
create_simple_table "arbrit-delivery-tasks"

echo "================================================"
echo "✅ DynamoDB tables creation complete!"
echo ""
echo "List tables with: aws dynamodb list-tables --region $REGION"


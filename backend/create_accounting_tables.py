"""
Create all missing DynamoDB tables for accounting and other modules
This will enable full functionality of the accounting dashboard
"""
import boto3
import os
import time
from dotenv import load_dotenv

load_dotenv()

def create_table_if_not_exists(dynamodb, table_name, key_schema, attribute_definitions):
    """Create a DynamoDB table if it doesn't exist"""
    try:
        # Check if table exists
        dynamodb.describe_table(TableName=table_name)
        print(f"  ✅ Table '{table_name}' already exists")
        return True
    except dynamodb.exceptions.ResourceNotFoundException:
        # Table doesn't exist, create it
        print(f"  🔨 Creating table '{table_name}'...")
        try:
            dynamodb.create_table(
                TableName=table_name,
                KeySchema=key_schema,
                AttributeDefinitions=attribute_definitions,
                BillingMode='PAY_PER_REQUEST'
            )
            print(f"  ✅ Table '{table_name}' created successfully")
            return True
        except Exception as e:
            print(f"  ❌ Error creating table '{table_name}': {str(e)}")
            return False
    except Exception as e:
        print(f"  ❌ Error checking table '{table_name}': {str(e)}")
        return False

def create_all_accounting_tables():
    """Create all missing accounting and module tables"""
    try:
        # Connect to DynamoDB
        dynamodb = boto3.client(
            'dynamodb',
            region_name=os.getenv('AWS_REGION'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )
        
        table_prefix = os.getenv('DYNAMODB_TABLE_PREFIX', 'arbrit_workdesk')
        
        print("=" * 80)
        print("Creating Missing DynamoDB Tables for Accounting Module")
        print("=" * 80)
        
        # Define all tables to create (all use 'id' as primary key)
        tables_to_create = [
            'delivery_tasks',
            'work_orders',
            'employee_documents',
            'company_documents',
            'assessment_forms',
            'assessment_submissions',
            'audit_logs',
            'certificate_requests',
            'certificate_templates',
            'client_accounts',
            'credit_notes',
            'invoice_requests',
            'payments',
            'petty_cash',
            'recurring_invoices',
            'training_sessions',
            'vendor_payments',
            'vendors'
        ]
        
        # Standard key schema and attribute definitions for all tables
        key_schema = [
            {
                'AttributeName': 'id',
                'KeyType': 'HASH'
            }
        ]
        
        attribute_definitions = [
            {
                'AttributeName': 'id',
                'AttributeType': 'S'
            }
        ]
        
        success_count = 0
        fail_count = 0
        
        for table_name in tables_to_create:
            full_table_name = f"{table_prefix}_{table_name}"
            print(f"\n{len(tables_to_create) - success_count - fail_count}. {full_table_name}")
            
            if create_table_if_not_exists(dynamodb, full_table_name, key_schema, attribute_definitions):
                success_count += 1
            else:
                fail_count += 1
        
        print("\n" + "=" * 80)
        print(f"Table Creation Summary:")
        print(f"  ✅ Successful: {success_count}")
        print(f"  ❌ Failed: {fail_count}")
        print("=" * 80)
        
        if fail_count == 0:
            print("\n✅ All tables created successfully!")
            print("   The accounting module can now be fully activated.")
            return True
        else:
            print(f"\n⚠️  {fail_count} table(s) failed to create.")
            return False
        
    except Exception as e:
        print(f"\n❌ Critical error: {str(e)}")
        return False

if __name__ == "__main__":
    success = create_all_accounting_tables()
    exit(0 if success else 1)

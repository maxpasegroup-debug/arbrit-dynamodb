"""
Create DynamoDB tables for duplicate detection and lead history
"""
import boto3
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

dynamodb = boto3.client(
    'dynamodb',
    region_name=os.environ.get('AWS_REGION', 'us-east-1'),
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
)

TABLE_PREFIX = os.environ.get('DYNAMODB_TABLE_PREFIX', 'arbrit_workdesk')

def create_duplicate_alerts_table():
    """Create duplicate_alerts table"""
    table_name = f'{TABLE_PREFIX}_duplicate_alerts'
    
    try:
        dynamodb.create_table(
            TableName=table_name,
            KeySchema=[
                {'AttributeName': 'id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'id', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print(f"✅ Created table: {table_name}")
    except dynamodb.exceptions.ResourceInUseException:
        print(f"ℹ️  Table {table_name} already exists")
    except Exception as e:
        print(f"❌ Error creating {table_name}: {e}")

def create_lead_history_table():
    """Create lead_history table"""
    table_name = f'{TABLE_PREFIX}_lead_history'
    
    try:
        dynamodb.create_table(
            TableName=table_name,
            KeySchema=[
                {'AttributeName': 'id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'id', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print(f"✅ Created table: {table_name}")
    except dynamodb.exceptions.ResourceInUseException:
        print(f"ℹ️  Table {table_name} already exists")
    except Exception as e:
        print(f"❌ Error creating {table_name}: {e}")

if __name__ == "__main__":
    print("Creating duplicate detection tables...")
    create_duplicate_alerts_table()
    create_lead_history_table()
    print("✅ All tables created/verified!")

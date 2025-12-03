import boto3
import os
from dotenv import load_dotenv

load_dotenv()

dynamodb = boto3.resource(
    'dynamodb',
    region_name=os.environ.get('AWS_REGION'),
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
)

table_name = f"{os.environ.get('DYNAMODB_TABLE_PREFIX')}_training_requests"

try:
    table = dynamodb.create_table(
        TableName=table_name,
        KeySchema=[
            {'AttributeName': 'id', 'KeyType': 'HASH'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'id', 'AttributeType': 'S'}
        ],
        BillingMode='PAY_PER_REQUEST'
    )
    
    print(f"✅ Creating table {table_name}...")
    table.wait_until_exists()
    print(f"✅ Table {table_name} created successfully!")
    
except Exception as e:
    if 'ResourceInUseException' in str(e):
        print(f"ℹ️  Table {table_name} already exists")
    else:
        print(f"❌ Error creating table: {e}")

"""
Script to create certificate_tracking table in DynamoDB
"""
import boto3
import os

def create_certificate_tracking_table():
    dynamodb = boto3.client(
        'dynamodb',
        region_name=os.environ.get('AWS_REGION', 'us-east-1'),
        aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
    )
    
    TABLE_PREFIX = os.environ.get('DYNAMODB_TABLE_PREFIX', 'arbrit_workdesk')
    table_name = f'{TABLE_PREFIX}_certificate_tracking'
    
    try:
        # Check if table exists
        dynamodb.describe_table(TableName=table_name)
        print(f"✅ Table {table_name} already exists")
    except dynamodb.exceptions.ResourceNotFoundException:
        print(f"Creating table {table_name}...")
        
        # Create table
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
        
        # Wait for table to be created
        waiter = dynamodb.get_waiter('table_exists')
        waiter.wait(TableName=table_name)
        
        print(f"✅ Table {table_name} created successfully!")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    create_certificate_tracking_table()

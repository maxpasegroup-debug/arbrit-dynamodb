"""
Create Global Secondary Index (GSI) on 'id' field in users table
This will optimize user lookup by ID in get_current_user()
"""
import boto3
import os
import time
from dotenv import load_dotenv

load_dotenv()

def create_user_id_gsi():
    """Create GSI on id field for arbrit_workdesk_users table"""
    try:
        # Connect to DynamoDB
        dynamodb = boto3.client(
            'dynamodb',
            region_name=os.getenv('AWS_REGION'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )
        
        table_name = 'arbrit_workdesk_users'
        
        print("=" * 80)
        print(f"Creating GSI on 'id' field for table: {table_name}")
        print("=" * 80)
        
        # Check if GSI already exists
        try:
            response = dynamodb.describe_table(TableName=table_name)
            existing_gsi = response['Table'].get('GlobalSecondaryIndexes', [])
            
            for gsi in existing_gsi:
                if gsi['IndexName'] == 'id-index':
                    print("\n✅ GSI 'id-index' already exists!")
                    print(f"   Status: {gsi['IndexStatus']}")
                    return True
        except Exception as e:
            print(f"⚠️  Could not check existing GSI: {e}")
        
        # Create GSI
        print("\n🔨 Creating new GSI 'id-index'...")
        
        response = dynamodb.update_table(
            TableName=table_name,
            AttributeDefinitions=[
                {
                    'AttributeName': 'id',
                    'AttributeType': 'S'
                }
            ],
            GlobalSecondaryIndexUpdates=[
                {
                    'Create': {
                        'IndexName': 'id-index',
                        'KeySchema': [
                            {
                                'AttributeName': 'id',
                                'KeyType': 'HASH'
                            }
                        ],
                        'Projection': {
                            'ProjectionType': 'ALL'
                        }
                    }
                }
            ]
        )
        
        print("✅ GSI creation initiated!")
        print("\n⏳ Waiting for GSI to become ACTIVE (this may take 2-3 minutes)...")
        
        # Wait for GSI to be active
        max_wait = 180  # 3 minutes
        wait_interval = 10  # Check every 10 seconds
        elapsed = 0
        
        while elapsed < max_wait:
            time.sleep(wait_interval)
            elapsed += wait_interval
            
            response = dynamodb.describe_table(TableName=table_name)
            gsi_list = response['Table'].get('GlobalSecondaryIndexes', [])
            
            for gsi in gsi_list:
                if gsi['IndexName'] == 'id-index':
                    status = gsi['IndexStatus']
                    print(f"   GSI Status: {status} (waited {elapsed}s)")
                    
                    if status == 'ACTIVE':
                        print("\n" + "=" * 80)
                        print("✅ GSI 'id-index' is now ACTIVE and ready to use!")
                        print("=" * 80)
                        return True
                    elif status == 'CREATING':
                        continue
                    else:
                        print(f"\n❌ Unexpected GSI status: {status}")
                        return False
        
        print(f"\n⚠️  GSI creation timeout after {max_wait} seconds")
        print("   The GSI is still being created in the background.")
        print("   You can check its status in AWS Console or run this script again.")
        return False
        
    except dynamodb.exceptions.ResourceInUseException:
        print("\n⚠️  Table is currently being updated. Please wait and try again.")
        return False
    except dynamodb.exceptions.LimitExceededException:
        print("\n⚠️  Too many operations on this table. Please wait and try again.")
        return False
    except Exception as e:
        print(f"\n❌ Error creating GSI: {str(e)}")
        return False

if __name__ == "__main__":
    success = create_user_id_gsi()
    exit(0 if success else 1)

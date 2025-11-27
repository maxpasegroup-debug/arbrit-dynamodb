"""
DynamoDB Client for Arbrit Safety Training Application
Replaces MongoDB operations with DynamoDB equivalents
"""
import boto3
from boto3.dynamodb.conditions import Key, Attr
from typing import Dict, List, Optional, Any
import os
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Initialize DynamoDB resource
dynamodb = boto3.resource(
    'dynamodb',
    region_name=os.environ.get('AWS_REGION', 'us-east-1'),
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
)

# Table prefix for multi-environment support
TABLE_PREFIX = os.environ.get('DYNAMODB_TABLE_PREFIX', 'arbrit_workdesk')

# Table references
tables = {
    'users': dynamodb.Table(f'{TABLE_PREFIX}_users'),
    'employees': dynamodb.Table(f'{TABLE_PREFIX}_employees'),
    'attendance': dynamodb.Table(f'{TABLE_PREFIX}_attendance'),
    'quotations': dynamodb.Table(f'{TABLE_PREFIX}_quotations'),
    'invoices': dynamodb.Table(f'{TABLE_PREFIX}_invoices'),
    'certificates': dynamodb.Table(f'{TABLE_PREFIX}_certificates'),
    'certificate_candidates': dynamodb.Table(f'{TABLE_PREFIX}_certificate_candidates'),
    'expense_claims': dynamodb.Table(f'{TABLE_PREFIX}_expense_claims'),
    'leads': dynamodb.Table(f'{TABLE_PREFIX}_leads'),
    'trainer_requests': dynamodb.Table(f'{TABLE_PREFIX}_trainer_requests'),
    'visit_logs': dynamodb.Table(f'{TABLE_PREFIX}_visit_logs'),
    'leave_requests': dynamodb.Table(f'{TABLE_PREFIX}_leave_requests'),
}

logger.info(f"✅ DynamoDB client initialized with table prefix: {TABLE_PREFIX}")


class QueryResult:
    """
    Wrapper to provide MongoDB-like .to_list() method
    """
    def __init__(self, items: List[Dict], limit: int = 1000):
        self.items = items[:limit]  # Apply limit
    
    async def to_list(self, length: int = None) -> List[Dict]:
        """MongoDB compatibility: cursor.to_list(1000)"""
        if length:
            return self.items[:length]
        return self.items
    
    def __iter__(self):
        return iter(self.items)
    
    def __len__(self):
        return len(self.items)


class DynamoDBClient:
    """
    Wrapper class to provide MongoDB-like interface for DynamoDB operations
    """
    
    def __init__(self, table_name: str):
        self.table = tables[table_name]
        self.table_name = table_name
    
    async def find_one(self, query: Dict[str, Any], projection: Optional[Dict] = None) -> Optional[Dict]:
        """
        Find a single document matching the query
        MongoDB: db.collection.find_one({"key": "value"}, {"_id": 0})
        DynamoDB: table.get_item(Key={'key': 'value'}) or table.scan()
        Note: projection with {"_id": 0} is ignored as DynamoDB doesn't have _id
        """
        try:
            item = None
            logger.debug(f"find_one called on table '{self.table_name}' with query: {query}")
            
            # Check if we can use get_item (primary key query)
            if self.table_name == 'users' and 'mobile' in query and len(query) == 1:
                # Primary key query for users table
                logger.debug(f"Using get_item with mobile key")
                response = self.table.get_item(Key={'mobile': query['mobile']})
                item = response.get('Item')
            elif self.table_name != 'users' and 'id' in query and len(query) == 1:
                # Primary key query for other tables
                logger.debug(f"Using get_item with id key")
                response = self.table.get_item(Key={'id': query['id']})
                item = response.get('Item')
            else:
                # Need to scan - querying by non-primary-key field
                # For better reliability, scan all items and filter in Python
                logger.debug(f"Using full scan and filtering in Python")
                response = self.table.scan()
                all_items = response.get('Items', [])
                logger.debug(f"Scanned {len(all_items)} total items")
                
                # Filter in Python
                for potential_item in all_items:
                    match = True
                    for key, value in query.items():
                        if potential_item.get(key) != value:
                            match = False
                            break
                    if match:
                        item = potential_item
                        logger.debug(f"Found matching item: {item.get('name', 'N/A')}")
                        break
            
            # Remove sensitive fields based on projection
            if item and projection:
                # If projection excludes fields (value = 0), remove them
                for key, value in projection.items():
                    if value == 0 and key in item and key != '_id':  # _id doesn't exist in DynamoDB
                        del item[key]
            
            logger.debug(f"Returning item: {'Found' if item else 'Not found'}")
            return item
        except Exception as e:
            logger.error(f"Error in find_one: {e}", exc_info=True)
            return None
    
    async def find(self, query: Dict[str, Any] = None, projection: Optional[Dict] = None, limit: int = 1000) -> List[Dict]:
        """
        Find multiple documents matching the query
        MongoDB: db.collection.find({"key": "value"}, {"_id": 0}).to_list(1000)
        DynamoDB: table.scan(FilterExpression=...)
        Note: This returns a list-like object with to_list() method for compatibility
        """
        try:
            if not query or query == {}:
                # Scan all items
                response = self.table.scan()
            else:
                # Scan with filter
                response = self.table.scan(
                    FilterExpression=self._build_filter_expression(query)
                )
            
            items = response.get('Items', [])
            
            # Remove sensitive fields based on projection
            if projection:
                filtered_items = []
                for item in items:
                    item_copy = item.copy()
                    for key, value in projection.items():
                        if value == 0 and key in item_copy and key != '_id':
                            del item_copy[key]
                    filtered_items.append(item_copy)
                items = filtered_items
            
            # Return a QueryResult object that has to_list() method
            return QueryResult(items, limit)
        except Exception as e:
            logger.error(f"Error in find: {e}")
            return QueryResult([], limit)
    
    async def insert_one(self, document: Dict[str, Any]) -> Dict:
        """
        Insert a single document
        MongoDB: db.collection.insert_one(doc)
        DynamoDB: table.put_item(Item=doc)
        """
        try:
            # Ensure created_at timestamp
            if 'created_at' not in document:
                document['created_at'] = datetime.now(timezone.utc).isoformat()
            
            self.table.put_item(Item=document)
            return {"inserted_id": document.get('id')}
        except Exception as e:
            logger.error(f"Error in insert_one: {e}")
            raise
    
    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]) -> Dict:
        """
        Update a single document
        MongoDB: db.collection.update_one({"id": id}, {"$set": data})
        DynamoDB: table.update_item(Key={...}, UpdateExpression=...)
        """
        try:
            # Extract $set data if present
            if '$set' in update:
                update_data = update['$set']
            else:
                update_data = update
            
            # Build update expression
            update_expr = "SET " + ", ".join([f"#{k} = :{k}" for k in update_data.keys()])
            expr_attr_names = {f"#{k}": k for k in update_data.keys()}
            expr_attr_values = {f":{k}": v for k, v in update_data.items()}
            
            # Determine key
            if 'mobile' in query and self.table_name == 'users':
                key = {'mobile': query['mobile']}
            elif 'id' in query:
                key = {'id': query['id']}
            else:
                raise ValueError(f"Cannot determine key from query: {query}")
            
            response = self.table.update_item(
                Key=key,
                UpdateExpression=update_expr,
                ExpressionAttributeNames=expr_attr_names,
                ExpressionAttributeValues=expr_attr_values,
                ReturnValues="UPDATED_NEW"
            )
            
            return {"modified_count": 1}
        except Exception as e:
            logger.error(f"Error in update_one: {e}")
            raise
    
    async def delete_one(self, query: Dict[str, Any]) -> Dict:
        """
        Delete a single document
        MongoDB: db.collection.delete_one({"id": id})
        DynamoDB: table.delete_item(Key={'id': id})
        """
        try:
            # Determine key
            if 'mobile' in query and self.table_name == 'users':
                key = {'mobile': query['mobile']}
            elif 'id' in query:
                key = {'id': query['id']}
            else:
                raise ValueError(f"Cannot determine key from query: {query}")
            
            self.table.delete_item(Key=key)
            return {"deleted_count": 1}
        except Exception as e:
            logger.error(f"Error in delete_one: {e}")
            raise
    
    async def count_documents(self, query: Dict[str, Any] = None) -> int:
        """
        Count documents matching query
        MongoDB: db.collection.count_documents({})
        DynamoDB: len(table.scan()['Items'])
        """
        try:
            if not query or query == {}:
                response = self.table.scan(Select='COUNT')
            else:
                response = self.table.scan(
                    FilterExpression=self._build_filter_expression(query),
                    Select='COUNT'
                )
            return response.get('Count', 0)
        except Exception as e:
            logger.error(f"Error in count_documents: {e}")
            return 0
    
    async def create_index(self, keys: List, unique: bool = False):
        """
        Create index (GSI in DynamoDB)
        Note: GSIs must be created via AWS Console or CloudFormation
        This is a no-op for compatibility
        """
        logger.info(f"Index creation for {keys} is managed at table level in DynamoDB")
        pass
    
    def _build_filter_expression(self, query: Dict[str, Any]):
        """
        Build DynamoDB FilterExpression from MongoDB-style query
        """
        if not query:
            return None
        
        conditions = []
        for key, value in query.items():
            logger.debug(f"Building filter condition: {key} = {value} (type: {type(value)})")
            conditions.append(Attr(key).eq(value))
        
        # Combine with AND
        filter_expr = conditions[0]
        for condition in conditions[1:]:
            filter_expr = filter_expr & condition
        
        logger.debug(f"Final filter expression: {filter_expr}")
        return filter_expr


# Stub client for non-existent tables (returns empty results)
class StubDynamoDBClient(DynamoDBClient):
    """Stub client for tables that don't exist yet"""
    def __init__(self, table_name: str):
        self.table_name = table_name
        logger.info(f"⚠️  Using stub client for non-existent table: {table_name}")
    
    async def find(self, query: Dict[str, Any] = None, projection: Optional[Dict] = None, limit: int = 1000) -> List[Dict]:
        return QueryResult([], limit)
    
    async def find_one(self, query: Dict[str, Any], projection: Optional[Dict] = None) -> Optional[Dict]:
        return None
    
    async def count_documents(self, query: Dict[str, Any] = None) -> int:
        return 0
    
    async def insert_one(self, document: Dict[str, Any]) -> Dict:
        logger.warning(f"Attempt to insert into stub table: {self.table_name}")
        return {"inserted_id": "stub"}
    
    async def distinct(self, field: str) -> List:
        return []


# Database wrapper to mimic MongoDB db object
class DB:
    """
    Database wrapper providing collection-like access
    Usage: db.users.find_one({"mobile": "123"})
    """
    def __init__(self):
        self.users = DynamoDBClient('users')
        self.employees = DynamoDBClient('employees')
        self.attendance = DynamoDBClient('attendance')
        self.quotations = DynamoDBClient('quotations')
        self.invoices = DynamoDBClient('invoices')
        self.certificates = DynamoDBClient('certificates')
        self.certificate_candidates = DynamoDBClient('certificate_candidates')
        self.expense_claims = DynamoDBClient('expense_claims')
        self.leads = DynamoDBClient('leads')
        self.trainer_requests = DynamoDBClient('trainer_requests')
        self.visit_logs = DynamoDBClient('visit_logs')
        self.leave_requests = DynamoDBClient('leave_requests')
        
        # Stub clients for tables that don't exist yet
        self.delivery_tasks = StubDynamoDBClient('delivery_tasks')
        self.work_orders = StubDynamoDBClient('work_orders')


# Create global db instance
db = DB()

logger.info("✅ DynamoDB database wrapper initialized")

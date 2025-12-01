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
    # Accounting and additional module tables
    'delivery_tasks': dynamodb.Table(f'{TABLE_PREFIX}_delivery_tasks'),
    'work_orders': dynamodb.Table(f'{TABLE_PREFIX}_work_orders'),
    'employee_documents': dynamodb.Table(f'{TABLE_PREFIX}_employee_documents'),
    'company_documents': dynamodb.Table(f'{TABLE_PREFIX}_company_documents'),
    'assessment_forms': dynamodb.Table(f'{TABLE_PREFIX}_assessment_forms'),
    'assessment_submissions': dynamodb.Table(f'{TABLE_PREFIX}_assessment_submissions'),
    'audit_logs': dynamodb.Table(f'{TABLE_PREFIX}_audit_logs'),
    'certificate_requests': dynamodb.Table(f'{TABLE_PREFIX}_certificate_requests'),
    'certificate_templates': dynamodb.Table(f'{TABLE_PREFIX}_certificate_templates'),
    'client_accounts': dynamodb.Table(f'{TABLE_PREFIX}_client_accounts'),
    'credit_notes': dynamodb.Table(f'{TABLE_PREFIX}_credit_notes'),
    'invoice_requests': dynamodb.Table(f'{TABLE_PREFIX}_invoice_requests'),
    'payments': dynamodb.Table(f'{TABLE_PREFIX}_payments'),
    'petty_cash': dynamodb.Table(f'{TABLE_PREFIX}_petty_cash'),
    'recurring_invoices': dynamodb.Table(f'{TABLE_PREFIX}_recurring_invoices'),
    'training_sessions': dynamodb.Table(f'{TABLE_PREFIX}_training_sessions'),
    'vendor_payments': dynamodb.Table(f'{TABLE_PREFIX}_vendor_payments'),
    'vendors': dynamodb.Table(f'{TABLE_PREFIX}_vendors'),
    # CRM Enhancement tables
    'courses': dynamodb.Table(f'{TABLE_PREFIX}_courses'),
    'booking_requests': dynamodb.Table(f'{TABLE_PREFIX}_booking_requests'),
    # Duplicate detection and lead management
    'duplicate_alerts': dynamodb.Table(f'{TABLE_PREFIX}_duplicate_alerts'),
    'lead_history': dynamodb.Table(f'{TABLE_PREFIX}_lead_history'),
    # Training Library system
    'training_library': dynamodb.Table(f'{TABLE_PREFIX}_training_library'),
    # Certificate Dispatch & Tracking system
    'certificate_tracking': dynamodb.Table(f'{TABLE_PREFIX}_certificate_tracking'),
    # Academic Library system
    'academic_library_folders': dynamodb.Table(f'{TABLE_PREFIX}_academic_library_folders'),
    'academic_library_documents': dynamodb.Table(f'{TABLE_PREFIX}_academic_library_documents'),
    'academic_library_access': dynamodb.Table(f'{TABLE_PREFIX}_academic_library_access'),
}

logger.info(f"✅ DynamoDB client initialized with table prefix: {TABLE_PREFIX}")


class QueryResult:
    """
    Wrapper to provide MongoDB-like .to_list() and .sort() methods
    """
    def __init__(self, items: List[Dict], limit: int = 1000):
        self.items = items[:limit]  # Apply limit
        self._sort_field = None
        self._sort_direction = 1
    
    async def to_list(self, length: int = None) -> List[Dict]:
        """MongoDB compatibility: cursor.to_list(1000)"""
        items = self.items
        
        # Apply sorting if sort was called
        if self._sort_field:
            try:
                items = sorted(items, key=lambda x: x.get(self._sort_field, ''), reverse=(self._sort_direction == -1))
            except Exception as e:
                logger.error(f"Error sorting: {e}")
        
        if length:
            return items[:length]
        return items
    
    def sort(self, field: str, direction: int = 1):
        """MongoDB compatibility: cursor.sort("field", -1)"""
        self._sort_field = field
        self._sort_direction = direction
        return self
    
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
        Find a single document matching the query with enhanced error handling
        MongoDB: db.collection.find_one({"key": "value"}, {"_id": 0})
        DynamoDB: table.get_item(Key={'key': 'value'}) or table.scan()
        Note: projection with {"_id": 0} is ignored as DynamoDB doesn't have _id
        """
        try:
            if not query:
                logger.error("find_one called with empty query")
                return None
                
            item = None
            logger.debug(f"find_one called on table '{self.table_name}' with query: {query}")
            
            # Check if we can use get_item (primary key query)
            if self.table_name == 'users' and 'mobile' in query and len(query) == 1:
                # Primary key query for users table (efficient)
                logger.debug(f"Using get_item with mobile key")
                try:
                    response = self.table.get_item(Key={'mobile': query['mobile']})
                    item = response.get('Item')
                except self.table.meta.client.exceptions.ResourceNotFoundException:
                    logger.error(f"Table {self.table_name} not found")
                    return None
                except Exception as e:
                    logger.error(f"DynamoDB get_item error: {str(e)}")
                    raise
            
            elif self.table_name == 'users' and 'id' in query and len(query) == 1:
                # Use GSI for users table when querying by id (efficient)
                logger.debug(f"Using GSI 'id-index' for user lookup by id")
                try:
                    response = self.table.query(
                        IndexName='id-index',
                        KeyConditionExpression='id = :id_val',
                        ExpressionAttributeValues={
                            ':id_val': query['id']
                        }
                    )
                    items = response.get('Items', [])
                    item = items[0] if items else None
                    
                    if item:
                        logger.debug(f"Found user via GSI: {item.get('name', 'N/A')}")
                    else:
                        logger.debug(f"User not found with id: {query['id']}")
                        
                except self.table.meta.client.exceptions.ResourceNotFoundException:
                    logger.warning(f"GSI 'id-index' not found, falling back to scan")
                    # Fallback to scan if GSI doesn't exist yet
                    response = self.table.scan()
                    all_items = response.get('Items', [])
                    for potential_item in all_items:
                        if potential_item.get('id') == query['id']:
                            item = potential_item
                            break
                except Exception as e:
                    logger.error(f"DynamoDB GSI query error: {str(e)}")
                    raise
                    
            elif self.table_name != 'users' and 'id' in query and len(query) == 1:
                # Primary key query for other tables (efficient)
                logger.debug(f"Using get_item with id key")
                try:
                    response = self.table.get_item(Key={'id': query['id']})
                    item = response.get('Item')
                except self.table.meta.client.exceptions.ResourceNotFoundException:
                    logger.error(f"Table {self.table_name} not found")
                    return None
                except Exception as e:
                    logger.error(f"DynamoDB get_item error: {str(e)}")
                    raise
                    
            else:
                # Need to scan - querying by non-primary-key field
                # WARNING: This is inefficient for large tables
                logger.debug(f"Using full scan and filtering in Python (INEFFICIENT)")
                try:
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
                except Exception as e:
                    logger.error(f"DynamoDB scan error: {str(e)}")
                    raise
            
            # Remove sensitive fields based on projection
            if item and projection:
                # If projection excludes fields (value = 0), remove them
                for key, value in projection.items():
                    if value == 0 and key in item and key != '_id':  # _id doesn't exist in DynamoDB
                        del item[key]
            
            logger.debug(f"Returning item: {'Found' if item else 'Not found'}")
            return item
            
        except Exception as e:
            logger.error(f"Critical error in find_one for table '{self.table_name}': {e}", exc_info=True)
            # Re-raise to let caller handle
            raise
    
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
        Returns: {"deleted_count": 1} if deleted, {"deleted_count": 0} if not found
        """
        try:
            # Determine key
            if 'mobile' in query and self.table_name == 'users':
                key = {'mobile': query['mobile']}
            elif 'id' in query:
                key = {'id': query['id']}
            else:
                raise ValueError(f"Cannot determine key from query: {query}")
            
            # First check if item exists
            try:
                response = self.table.get_item(Key=key)
                if 'Item' not in response:
                    logger.warning(f"Item not found for deletion: {key}")
                    return {"deleted_count": 0}
            except Exception as e:
                logger.warning(f"Item check failed: {e}")
                return {"deleted_count": 0}
            
            # Delete the item
            self.table.delete_item(Key=key)
            logger.debug(f"Successfully deleted item: {key}")
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
    
    async def distinct(self, field: str) -> List:
        """
        Get distinct values for a field
        MongoDB: db.collection.distinct("field")
        DynamoDB: Scan and collect unique values
        """
        try:
            response = self.table.scan()
            items = response.get('Items', [])
            
            distinct_values = set()
            for item in items:
                if field in item:
                    distinct_values.add(item[field])
            
            return list(distinct_values)
        except Exception as e:
            logger.error(f"Error in distinct: {e}")
            return []
    
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
        
        # Accounting and additional module tables (now fully implemented)
        self.delivery_tasks = DynamoDBClient('delivery_tasks')
        self.work_orders = DynamoDBClient('work_orders')
        self.employee_documents = DynamoDBClient('employee_documents')
        self.company_documents = DynamoDBClient('company_documents')
        self.assessment_forms = DynamoDBClient('assessment_forms')
        self.assessment_submissions = DynamoDBClient('assessment_submissions')
        self.audit_logs = DynamoDBClient('audit_logs')
        self.certificate_requests = DynamoDBClient('certificate_requests')
        self.certificate_templates = DynamoDBClient('certificate_templates')
        self.client_accounts = DynamoDBClient('client_accounts')
        self.credit_notes = DynamoDBClient('credit_notes')
        self.invoice_requests = DynamoDBClient('invoice_requests')
        self.payments = DynamoDBClient('payments')
        self.petty_cash = DynamoDBClient('petty_cash')
        self.recurring_invoices = DynamoDBClient('recurring_invoices')
        self.training_sessions = DynamoDBClient('training_sessions')
        self.vendor_payments = DynamoDBClient('vendor_payments')
        self.vendors = DynamoDBClient('vendors')
        
        # CRM Enhancement clients
        self.courses = DynamoDBClient('courses')
        self.booking_requests = DynamoDBClient('booking_requests')
        self.duplicate_alerts = DynamoDBClient('duplicate_alerts')
        self.lead_history = DynamoDBClient('lead_history')
        self.training_library = DynamoDBClient('training_library')
        self.certificate_tracking = DynamoDBClient('certificate_tracking')
        
        # Academic Library clients
        self.academic_library_folders = DynamoDBClient('academic_library_folders')
        self.academic_library_documents = DynamoDBClient('academic_library_documents')
        self.academic_library_access = DynamoDBClient('academic_library_access')


# Create global db instance
db = DB()

logger.info("✅ DynamoDB database wrapper initialized")

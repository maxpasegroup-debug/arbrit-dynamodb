"""
DynamoDB Abstraction Layer
Provides MongoDB-like interface for DynamoDB operations
"""

import aioboto3
from typing import Dict, List, Any, Optional
from decimal import Decimal
import json
from boto3.dynamodb.conditions import Key, Attr


class DynamoDBCollection:
    """Simulates MongoDB collection interface for DynamoDB"""
    
    def __init__(self, session, table_name: str, region: str = 'us-east-1'):
        self.session = session
        self.table_name = table_name
        self.region = region
    
    async def _get_table(self):
        """Get DynamoDB table resource"""
        async with self.session.resource('dynamodb', region_name=self.region) as dynamodb:
            return await dynamodb.Table(self.table_name)
    
    @staticmethod
    def _convert_to_dynamodb(item: Dict) -> Dict:
        """Convert Python dict to DynamoDB format (handle floats)"""
        return json.loads(json.dumps(item), parse_float=Decimal)
    
    @staticmethod
    def _convert_from_dynamodb(item: Dict) -> Dict:
        """Convert DynamoDB format to Python dict"""
        return json.loads(json.dumps(item, default=str))
    
    async def find_one(self, filter_dict: Dict, projection: Optional[Dict] = None) -> Optional[Dict]:
        """
        Find a single document
        Args:
            filter_dict: Query filter (e.g., {"id": "123"} or {"mobile": "1234567890"})
            projection: Fields to include/exclude (e.g., {"_id": 0})
        """
        async with self.session.resource('dynamodb', region_name=self.region) as dynamodb:
            table = await dynamodb.Table(self.table_name)
            
            # Determine which key to use
            key_name = list(filter_dict.keys())[0]
            key_value = filter_dict[key_name]
            
            try:
                # Try as primary key first
                response = await table.get_item(Key={key_name: key_value})
                if 'Item' in response:
                    item = self._convert_from_dynamodb(response['Item'])
                    # Remove _id if requested
                    if projection and projection.get('_id') == 0:
                        item.pop('_id', None)
                    return item
            except:
                # If not primary key, try querying index
                index_name = f"{key_name}-index"
                try:
                    response = await table.query(
                        IndexName=index_name,
                        KeyConditionExpression=Key(key_name).eq(key_value),
                        Limit=1
                    )
                    if response['Items']:
                        item = self._convert_from_dynamodb(response['Items'][0])
                        if projection and projection.get('_id') == 0:
                            item.pop('_id', None)
                        return item
                except:
                    # Fallback to scan (slow, but works)
                    response = await table.scan(
                        FilterExpression=Attr(key_name).eq(key_value),
                        Limit=1
                    )
                    if response['Items']:
                        item = self._convert_from_dynamodb(response['Items'][0])
                        if projection and projection.get('_id') == 0:
                            item.pop('_id', None)
                        return item
            
            return None
    
    def find(self, filter_dict: Dict = None, projection: Optional[Dict] = None):
        """
        Find multiple documents
        Returns a cursor-like object with to_list() method
        """
        return DynamoDBCursor(self.session, self.table_name, filter_dict, projection, self.region)
    
    async def insert_one(self, document: Dict):
        """Insert a single document"""
        async with self.session.resource('dynamodb', region_name=self.region) as dynamodb:
            table = await dynamodb.Table(self.table_name)
            item = self._convert_to_dynamodb(document)
            await table.put_item(Item=item)
    
    async def update_one(self, filter_dict: Dict, update_dict: Dict):
        """
        Update a single document
        Args:
            filter_dict: Query filter (e.g., {"id": "123"})
            update_dict: Update operations (e.g., {"$set": {"name": "John"}})
        """
        async with self.session.resource('dynamodb', region_name=self.region) as dynamodb:
            table = await dynamodb.Table(self.table_name)
            
            # Extract key
            key_name = list(filter_dict.keys())[0]
            key_value = filter_dict[key_name]
            
            # Extract update values
            if "$set" in update_dict:
                update_values = update_dict["$set"]
            else:
                update_values = update_dict
            
            # Build update expression
            update_expr = "SET " + ", ".join([f"#{k} = :{k}" for k in update_values.keys()])
            expr_attr_names = {f"#{k}": k for k in update_values.keys()}
            expr_attr_values = {f":{k}": self._convert_to_dynamodb(v) if isinstance(v, dict) else v 
                               for k, v in update_values.items()}
            
            await table.update_item(
                Key={key_name: key_value},
                UpdateExpression=update_expr,
                ExpressionAttributeNames=expr_attr_names,
                ExpressionAttributeValues=expr_attr_values
            )
    
    async def delete_one(self, filter_dict: Dict):
        """Delete a single document"""
        async with self.session.resource('dynamodb', region_name=self.region) as dynamodb:
            table = await dynamodb.Table(self.table_name)
            
            key_name = list(filter_dict.keys())[0]
            key_value = filter_dict[key_name]
            
            response = await table.delete_item(Key={key_name: key_value})
            return response
    
    async def delete_many(self, filter_dict: Dict):
        """Delete multiple documents"""
        # First find all matching items
        cursor = self.find(filter_dict)
        items = await cursor.to_list(1000)
        
        async with self.session.resource('dynamodb', region_name=self.region) as dynamodb:
            table = await dynamodb.Table(self.table_name)
            
            # Get primary key name
            table_desc = await table.meta.client.describe_table(TableName=self.table_name)
            key_schema = table_desc['Table']['KeySchema']
            primary_key = next(k['AttributeName'] for k in key_schema if k['KeyType'] == 'HASH')
            
            # Delete each item
            for item in items:
                await table.delete_item(Key={primary_key: item[primary_key]})
    
    async def count_documents(self, filter_dict: Dict = None) -> int:
        """Count documents matching filter"""
        cursor = self.find(filter_dict or {})
        items = await cursor.to_list(10000)
        return len(items)
    
    async def distinct(self, field_name: str, filter_dict: Dict = None) -> List[Any]:
        """Get distinct values for a field"""
        cursor = self.find(filter_dict or {})
        items = await cursor.to_list(10000)
        values = set()
        for item in items:
            if field_name in item and item[field_name] is not None:
                values.add(item[field_name])
        return list(values)


class DynamoDBCursor:
    """Simulates MongoDB cursor for DynamoDB scans/queries"""
    
    def __init__(self, session, table_name: str, filter_dict: Dict = None, 
                 projection: Dict = None, region: str = 'us-east-1'):
        self.session = session
        self.table_name = table_name
        self.filter_dict = filter_dict or {}
        self.projection = projection
        self.region = region
        self._sort_key = None
        self._sort_direction = 1
    
    def sort(self, key: str, direction: int = 1):
        """Sort results"""
        self._sort_key = key
        self._sort_direction = direction
        return self
    
    async def to_list(self, limit: int = 1000) -> List[Dict]:
        """Convert cursor to list"""
        async with self.session.resource('dynamodb', region_name=self.region) as dynamodb:
            table = await dynamodb.Table(self.table_name)
            
            items = []
            
            if not self.filter_dict:
                # Scan entire table
                response = await table.scan(Limit=limit)
                items = response.get('Items', [])
                
                # Handle pagination
                while 'LastEvaluatedKey' in response and len(items) < limit:
                    response = await table.scan(
                        Limit=limit - len(items),
                        ExclusiveStartKey=response['LastEvaluatedKey']
                    )
                    items.extend(response.get('Items', []))
            else:
                # Scan with filter
                filter_expressions = []
                for key, value in self.filter_dict.items():
                    if isinstance(value, dict):
                        # Handle various MongoDB operators
                        if "$in" in value:
                            # Handle $in operator - create OR conditions
                            in_exprs = [Attr(key).eq(v) for v in value["$in"]]
                            if in_exprs:
                                in_expr = in_exprs[0]
                                for expr in in_exprs[1:]:
                                    in_expr = in_expr | expr
                                filter_expressions.append(in_expr)
                        elif "$gte" in value and "$lte" in value:
                            # Handle range queries (between)
                            filter_expressions.append(Attr(key).between(value["$gte"], value["$lte"]))
                        elif "$gte" in value:
                            # Greater than or equal
                            filter_expressions.append(Attr(key).gte(value["$gte"]))
                        elif "$lte" in value:
                            # Less than or equal
                            filter_expressions.append(Attr(key).lte(value["$lte"]))
                        elif "$gt" in value:
                            # Greater than
                            filter_expressions.append(Attr(key).gt(value["$gt"]))
                        elif "$lt" in value:
                            # Less than
                            filter_expressions.append(Attr(key).lt(value["$lt"]))
                        elif "$ne" in value:
                            # Not equal
                            filter_expressions.append(Attr(key).ne(value["$ne"]))
                        else:
                            # Default to equality if no recognized operator
                            filter_expressions.append(Attr(key).eq(value))
                    else:
                        filter_expressions.append(Attr(key).eq(value))
                
                if filter_expressions:
                    filter_expr = filter_expressions[0]
                    for expr in filter_expressions[1:]:
                        filter_expr = filter_expr & expr  # Use AND for multiple conditions
                    
                    response = await table.scan(
                        FilterExpression=filter_expr,
                        Limit=limit
                    )
                    items = response.get('Items', [])
            
            # Convert from DynamoDB format
            items = [DynamoDBCollection._convert_from_dynamodb(item) for item in items]
            
            # Apply projection
            if self.projection:
                exclude_fields = [k for k, v in self.projection.items() if v == 0]
                items = [{k: v for k, v in item.items() if k not in exclude_fields} for item in items]
            
            # Apply sorting
            if self._sort_key:
                items.sort(key=lambda x: x.get(self._sort_key, ''), reverse=(self._sort_direction == -1))
            
            return items[:limit]


class DynamoDBDatabase:
    """Simulates MongoDB database interface"""
    
    def __init__(self, region: str = 'us-east-1'):
        self.region = region
        self.session = aioboto3.Session()
        self._collections = {}
    
    def __getattr__(self, collection_name: str):
        """Get collection by attribute access (e.g., db.users)"""
        if collection_name not in self._collections:
            table_name = f"arbrit-{collection_name.replace('_', '-')}"
            self._collections[collection_name] = DynamoDBCollection(
                self.session, table_name, self.region
            )
        return self._collections[collection_name]
    
    async def command(self, command: str):
        """Execute database command (e.g., 'ping')"""
        if command == 'ping':
            # Test DynamoDB connection
            async with self.session.client('dynamodb', region_name=self.region) as client:
                await client.list_tables(Limit=1)
            return {"ok": 1}
        return {"ok": 0}


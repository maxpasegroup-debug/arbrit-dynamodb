from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from dynamodb_layer import DynamoDBDatabase
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# DynamoDB initialization
# Uses boto3/aioboto3 for AWS DynamoDB access
try:
    db = DynamoDBDatabase()
    print(f"✅ DynamoDB client initialized successfully")
except KeyError as e:
    print(f"❌ CRITICAL: Missing environment variable: {e}")
    print(f"   Available env vars: {', '.join([k for k in os.environ.keys() if not k.startswith('_')])}")
    raise
except Exception as e:
    print(f"❌ CRITICAL: Failed to initialize DynamoDB client: {e}")
    raise

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'arbrit-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mobile: str
    pin_hash: str
    name: str
    role: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LoginRequest(BaseModel):
    mobile: str
    pin: str


class LoginResponse(BaseModel):
    token: str
    user: dict


class UserResponse(BaseModel):
    id: str
    mobile: str
    name: str
    role: str


# HRM Models
class Employee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    mobile: str
    branch: str  # Dubai, Abu Dhabi, Saudi Arabia
    email: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None  # Sales, Marketing, Training, Academic, Accounts, Dispatch, HR
    badge_title: Optional[str] = None  # Sales Manager, Team Leader, etc.
    sales_type: Optional[str] = None  # tele, field, none
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class EmployeeCreate(BaseModel):
    name: str
    mobile: str
    branch: str
    email: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    badge_title: Optional[str] = None
    sales_type: Optional[str] = None


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None
    branch: Optional[str] = None
    email: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    badge_title: Optional[str] = None
    sales_type: Optional[str] = None


class Attendance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    employee_name: str
    mobile: str
    date: str  # YYYY-MM-DD
    time: str  # HH:MM:SS
    gps_lat: Optional[float] = None
    gps_long: Optional[float] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AttendanceCreate(BaseModel):
    employee_id: str
    gps_lat: Optional[float] = None
    gps_long: Optional[float] = None


class EmployeeDocument(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    employee_name: str
    doc_type: str  # Passport, Visa, Emirates ID, Work Permit
    file_name: str
    file_data: str  # Base64 encoded
    expiry_date: str  # YYYY-MM-DD
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class EmployeeDocumentCreate(BaseModel):
    employee_id: str
    doc_type: str
    file_name: str
    file_data: str
    expiry_date: str


class CompanyDocument(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    doc_name: str
    doc_type: str  # Trade License, ISO Certificate, etc.
    file_name: str
    file_data: str  # Base64 encoded
    expiry_date: str  # YYYY-MM-DD
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CompanyDocumentCreate(BaseModel):
    doc_name: str
    doc_type: str
    file_name: str
    file_data: str
    expiry_date: str


# Sales Head Models
class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source: str  # Online, Self
    client_name: str
    requirement: str
    industry: Optional[str] = None
    assigned_to: Optional[str] = None  # Employee ID
    assigned_to_name: Optional[str] = None
    assigned_by: str  # User ID who assigned
    assigned_by_name: str
    status: str = "New"  # New, In Progress, Proposal Sent, Closed, Dropped
    remarks: Optional[str] = None
    next_followup_date: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LeadCreate(BaseModel):
    source: str
    client_name: str
    requirement: str
    industry: Optional[str] = None
    assigned_to: Optional[str] = None
    status: str = "New"
    remarks: Optional[str] = None
    next_followup_date: Optional[str] = None


class LeadUpdate(BaseModel):
    client_name: Optional[str] = None
    requirement: Optional[str] = None
    industry: Optional[str] = None
    assigned_to: Optional[str] = None
    status: Optional[str] = None
    remarks: Optional[str] = None
    next_followup_date: Optional[str] = None


class SelfLeadCreate(BaseModel):
    client_name: str
    mobile: str
    email: Optional[str] = None
    company_name: Optional[str] = None
    branch: str
    requirement: str
    lead_type: Optional[str] = None  # Company, Individual (for Field Sales)
    notes: Optional[str] = None


class Quotation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lead_id: Optional[str] = None
    client_name: str
    items: str  # JSON string of quotation items
    total_amount: float
    created_by: str  # User ID
    created_by_name: str
    approved_by: Optional[str] = None  # Sales Head ID
    approved_by_name: Optional[str] = None
    status: str = "Pending"  # Pending, Approved, Rejected
    remarks: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_at: Optional[datetime] = None


class QuotationCreate(BaseModel):
    lead_id: Optional[str] = None
    client_name: str
    items: str
    total_amount: float
    remarks: Optional[str] = None


class QuotationApprove(BaseModel):
    status: str  # Approved, Rejected
    remarks: Optional[str] = None


class LeaveRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    employee_name: str
    employee_mobile: str
    leave_from: str  # YYYY-MM-DD
    leave_to: str  # YYYY-MM-DD
    reason: str
    status: str = "Pending"  # Pending, Approved by Sales Head, Approved by HR, Rejected
    approved_by_sales_head: Optional[str] = None
    sales_head_remarks: Optional[str] = None
    approved_by_hr: Optional[str] = None
    hr_remarks: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LeaveRequestCreate(BaseModel):
    leave_from: str
    leave_to: str
    reason: str


class LeaveApprovalAction(BaseModel):
    action: str  # Approve, Reject
    remarks: Optional[str] = None


# New Models for Enhanced Sales Features
class TrainerAvailabilityRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lead_id: Optional[str] = None
    client_name: str
    course: str
    preferred_dates: str
    branch: str
    mode: str  # Online, Offline
    notes: Optional[str] = None
    requested_by: str
    requested_by_name: str
    status: str = "Pending"  # Pending, Confirmed, Alternative Suggested, Rejected
    trainer_name: Optional[str] = None
    confirmed_slots: Optional[str] = None
    academic_remarks: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class InvoiceRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lead_id: Optional[str] = None
    quotation_id: Optional[str] = None
    payment_terms: str  # Full Before, Partial, After Training
    initial_amount: Optional[float] = None
    notes: Optional[str] = None
    requested_by: str
    requested_by_name: str
    status: str = "Pending"  # Pending, Generated, Paid, Partially Paid, Overdue
    payment_confirmations: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class VisitLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str  # YYYY-MM-DD
    company: str
    contact_person: str
    notes: Optional[str] = None
    logged_by: str
    logged_by_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Academic Module Models
class WorkOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reference_number: str  # WO-2025-0001
    client_name: str
    course: str
    trainer_request_id: Optional[str] = None
    invoice_id: Optional[str] = None
    payment_status: str = "Pending"  # Pending, Confirmed
    training_location: str
    training_mode: str  # Online, Onsite
    preferred_dates: str
    batch_size: Optional[int] = None
    assigned_trainer_id: Optional[str] = None
    assigned_trainer_name: Optional[str] = None
    assigned_coordinator_id: Optional[str] = None
    assigned_coordinator_name: Optional[str] = None
    status: str = "Pending"  # Pending, Approved, Trainer Assigned, Scheduled, Completed
    approved_by: Optional[str] = None
    approved_by_name: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TrainingSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    work_order_id: str
    work_order_reference: str
    client_name: str
    course: str
    trainer_id: str
    trainer_name: str
    coordinator_id: Optional[str] = None
    coordinator_name: Optional[str] = None
    training_date: str  # YYYY-MM-DD
    training_time: Optional[str] = None
    location: str
    mode: str  # Online, Onsite
    status: str = "Scheduled"  # Scheduled, In-Progress, Completed, Cancelled
    attendance_count: Optional[int] = None
    completion_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CertificateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    training_session_id: str
    work_order_reference: str
    client_name: str
    course: str
    trainer_name: str
    training_date: str
    certificate_type: str = "In-House"  # In-House, International
    participant_names: str  # Comma-separated or JSON
    status: str = "Pending"  # Pending, Approved, Generated, Dispatched
    approved_by: Optional[str] = None
    approved_by_name: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Helper functions
def hash_pin(pin: str) -> str:
    return pwd_context.hash(pin)


def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    return pwd_context.verify(plain_pin, hashed_pin)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    user = await db.get_item('users', {"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def calculate_days_until_expiry(expiry_date_str: str) -> int:
    """Calculate days until document expiry"""
    try:
        expiry_date = datetime.strptime(expiry_date_str, "%Y-%m-%d")
        today = datetime.now()
        delta = expiry_date - today
        return delta.days
    except:
        return 999  # Return high number if date parsing fails


# Routes
@api_router.get("/")
async def root():
    return {"message": "Arbrit Safety Training API"}


@api_router.get("/health")
async def health_check():
    """Health check endpoint to verify backend and database connectivity"""
    try:
        # Test database connection
        await db.command('ping')
        
        # Count users to verify data access
        user_count = len(await db.scan_items('users', {} if {} else {}))
        
        return {
            "status": "healthy",
            "database": "connected",
            "user_count": user_count,
            "message": "Backend and database are operational"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "message": "Database connection failed"
        }


@api_router.get("/admin/check-user/{mobile}")
async def check_user_exists(mobile: str):
    """Check if a user with specific mobile exists and show their info (for debugging)"""
    try:
        user = await db.get_item('users', {"mobile": mobile}, {"_id": 0, "pin_hash": 0})
        
        if user:
            return {
                "exists": True,
                "user": user,
                "message": f"User {user['name']} found with role {user['role']}"
            }
        else:
            return {
                "exists": False,
                "message": f"No user found with mobile {mobile}"
            }
    except Exception as e:
        return {
            "exists": False,
            "error": str(e)
        }


@api_router.delete("/admin/delete-user/{mobile}")
async def delete_specific_user(mobile: str):
    """Delete a specific user by mobile number (for manual cleanup)"""
    try:
        user = await db.get_item('users', {"mobile": mobile}, {"_id": 0})
        
        if not user:
            return {
                "success": False,
                "message": f"User with mobile {mobile} not found"
            }
        
        await db.delete_item('users', {"mobile": mobile})
        
        return {
            "success": True,
            "message": f"Successfully deleted user: {user.get('name')} ({mobile}) - {user.get('role')}",
            "deleted_user": {
                "mobile": mobile,
                "name": user.get('name'),
                "role": user.get('role')
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to delete user"
        }


@api_router.post("/admin/cleanup-demo-users")
async def cleanup_demo_users():
    """Delete all demo/test users with fake mobile numbers"""
    try:
        # Demo mobile patterns to remove (comprehensive list)
        demo_patterns = [
            # Common test patterns starting with 012345
            "0123456789",  # CEO demo
            "0123456790",  # COO demo
            "0123456791",  # MD demo
            "0123456792",
            "0123456793",
            "0123456794",
            "0123456795",
            "0123456796",
            "0123456797",
            "0123456798",
            "0123456799",
            # UAE format demo numbers (055)
            "0550000001",  # Sales Head demo
            "0550000002",  # Tele Sales demo
            "0550000003",
            "0550000004",
            "0550000005",
            "0550000006",
            "0550000007",
            "0550000008",
            "0550000009",
            "0550000010",
            "0550000011",
            "0550000012",
            "0550000013",
            "0550000014",
            "0550000015",
            "0550000016",
            "0550000017",
            "0550000018",
            "0550000019",
            "0550000020",
            # Other common test patterns
            "1234567890",
            "9876543210",
            "0000000000",
            "1111111111",
            "2222222222",
            "3333333333",
            "4444444444",
            "5555555555",
            "6666666666",
            "7777777777",
            "8888888888",
            "9999999999",
            # Test/demo keywords
            "test",
            "demo",
            "sample",
            "dummy",
            "fake"
        ]
        
        deleted_count = 0
        deleted_users = []
        
        for mobile in demo_patterns:
            user = await db.get_item('users', {"mobile": mobile}, {"_id": 0})
            if user:
                await db.delete_item('users', {"mobile": mobile})
                deleted_users.append(f"Deleted: {user.get('name', 'Unknown')} ({mobile}) - {user.get('role', 'Unknown')}")
                deleted_count += 1
        
        return {
            "success": True,
            "deleted_count": deleted_count,
            "deleted_users": deleted_users,
            "message": f"Successfully deleted {deleted_count} demo users"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to cleanup demo users"
        }


@api_router.post("/admin/reset-default-users")
async def reset_default_users():
    """Reset MD and COO users with correct credentials (for production setup)"""
    try:
        results = []
        
        # First, delete any existing users with these mobiles (to avoid conflicts)
        await db.users.delete_many({"mobile": {"$in": ["971564022503", "971566374020"]}})
        
        # Create MD user fresh
        md_user = User(
            mobile="971564022503",
            pin_hash=hash_pin("2503"),
            name="Brijith Shaji",
            role="MD"
        )
        user_dict = md_user.model_dump()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        await db.put_item('users', user_dict)
        results.append(f"✅ MD user 971564022503 created fresh with PIN 2503")
        
        # Create COO user fresh
        coo_user = User(
            mobile="971566374020",
            pin_hash=hash_pin("4020"),
            name="Sarada Gopalakrishnan",
            role="COO"
        )
        user_dict = coo_user.model_dump()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        await db.put_item('users', user_dict)
        results.append(f"✅ COO user 971566374020 created fresh with PIN 4020")
        
        return {
            "success": True,
            "message": "Default users reset successfully (deleted old, created fresh)",
            "results": results,
            "instructions": "You can now login with:\n- MD: 971564022503 / PIN: 2503\n- COO: 971566374020 / PIN: 4020"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to reset users"
        }


@api_router.get("/diagnostics")
async def diagnostics():
    """Diagnostic endpoint to check environment and connectivity"""
    diagnostics_data = {
        "environment": {
            "db_name": DB_NAME,  # Show active database name
            "cors_origins": os.environ.get('CORS_ORIGINS', 'NOT_SET'),
            "jwt_secret_exists": bool(os.environ.get('JWT_SECRET_KEY')),
            "dynamodb_region": os.environ.get('AWS_REGION', 'us-east-1'),
            "dynamodb_tables": "arbrit-*",  #  # All tables prefixed with arbrit-
        },
        "database_status": "unknown",
        "collections": [],
        "user_samples": [],
        "all_users": [],
        "employees_count": 0,
        "users_vs_employees": {}
    }
    
    try:
        # Test database connection
        await db.command('ping')
        diagnostics_data["database_status"] = "connected"
        
        # List collections
        collections = await db.list_collection_names()
        diagnostics_data["collections"] = collections
        
        # Get ALL user data (for production troubleshooting)
        if "users" in collections:
            all_users = await db.scan_items('users', {}, {"_id": 0, "mobile": 1, "name": 1, "role": 1} if {}, {"_id": 0, "mobile": 1, "name": 1, "role": 1} else {})
            diagnostics_data["all_users"] = all_users
            diagnostics_data["user_samples"] = all_users[:5]  # First 5 for quick view
            diagnostics_data["total_users"] = len(all_users)
        
        # Get employees count
        if "employees" in collections:
            employees = await db.scan_items('employees', {}, {"_id": 0, "name": 1, "mobile": 1, "designation": 1, "department": 1} if {}, {"_id": 0, "name": 1, "mobile": 1, "designation": 1, "department": 1} else {})
            diagnostics_data["employees_count"] = len(employees)
            diagnostics_data["all_employees"] = employees
            
            # Compare users vs employees
            user_mobiles = set(u.get('mobile') for u in diagnostics_data.get("all_users", []))
            employee_mobiles = set(e.get('mobile') for e in employees)
            
            diagnostics_data["users_vs_employees"] = {
                "users_not_in_employees": list(user_mobiles - employee_mobiles),
                "employees_not_in_users": list(employee_mobiles - user_mobiles),
                "common_mobiles": list(user_mobiles & employee_mobiles)
            }
        
    except Exception as e:
        diagnostics_data["database_status"] = "error"
        diagnostics_data["error"] = str(e)
    
    return diagnostics_data


@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    try:
        # Test database connection first
        await db.command('ping')
    except Exception as db_error:
        logger.error(f"Database connection failed during login: {db_error}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error. Please contact support. Error: {str(db_error)}"
        )
    
    try:
        # Find user by mobile
        user = await db.get_item('users', {"mobile": request.mobile}, {"_id": 0})
        
        if not user:
            logger.warning(f"Login attempt with non-existent mobile: {request.mobile}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid mobile number or PIN"
            )
        
        # Verify PIN
        if not verify_pin(request.pin, user["pin_hash"]):
            logger.warning(f"Failed PIN verification for mobile: {request.mobile}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid mobile number or PIN"
            )
        
        # Create access token
        access_token = create_access_token(data={"sub": user["id"]})
        
        logger.info(f"Successful login for user: {user['name']} ({user['role']})")
        
        # Return token and user info (without pin_hash)
        user_response = {
            "id": user["id"],
            "mobile": user["mobile"],
            "name": user["name"],
            "role": user["role"]
        }
        
        return {
            "token": access_token,
            "user": user_response
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred. Please try again later. Error: {str(e)}"
        )


@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "mobile": current_user["mobile"],
        "name": current_user["name"],
        "role": current_user["role"]
    }


@api_router.get("/dashboard/coo")
async def coo_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "COO":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. COO role required."
        )
    
    return {
        "message": "Welcome to COO Dashboard",
        "user": current_user["name"],
        "modules": [
            {"id": "marketing", "name": "Marketing & Sales"},
            {"id": "hrm", "name": "HRM"},
            {"id": "academics", "name": "Academics"},
            {"id": "accounts", "name": "Accounts"}
        ]
    }


@api_router.get("/dashboard/hr")
async def hr_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "HR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. HR role required."
        )
    
    return {
        "message": "Welcome to HR Dashboard",
        "user": current_user["name"],
        "role": "HR Manager"
    }


# HRM - Employee Management
@api_router.post("/hrm/employees", response_model=Employee)
async def create_employee(employee: EmployeeCreate, current_user: dict = Depends(get_current_user)):
    employee_obj = Employee(**employee.model_dump())
    doc = employee_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.put_item('employees', doc)
    
    # Auto-create user account based on designation
    user_role = None
    if employee.designation:
        designation = employee.designation
        
        # Map designation keys to user roles
        designation_to_role = {
            'SALES_HEAD': 'Sales Head',
            'TELE_SALES_EXECUTIVE': 'Tele Sales',
            'FIELD_SALES_EXECUTIVE': 'Field Sales',
            'ACADEMIC_HEAD': 'Academic Head',
            'ACADEMIC_COORDINATOR': 'Academic Coordinator',
            'TRAINER_FULLTIME': 'Trainer',
            'TRAINER_PARTTIME': 'Trainer',
            'HR_MANAGER': 'HR',
            'HR_EXECUTIVE': 'HR',
            'ACCOUNTS_HEAD': 'Accounts Head',
            'ACCOUNTANT': 'Accountant',
            'DISPATCH_HEAD': 'Dispatch Head',
            'DISPATCH_ASSISTANT': 'Dispatch Assistant',
            'COO': 'COO',
            'MD': 'Management',
            'CEO': 'Management'
        }
        
        # Check if designation is in the mapping
        if designation in designation_to_role:
            user_role = designation_to_role[designation]
        # Backward compatibility: check old format
        elif "HR" in designation.upper() and "SALES" not in designation.upper():
            user_role = "HR"
        elif "SALES HEAD" in designation.upper():
            user_role = "Sales Head"
        elif "ACADEMIC HEAD" in designation.upper() or "ACADEMIC_HEAD" in designation.upper():
            user_role = "Academic Head"
        elif employee.department == "Sales" and "SALES HEAD" not in designation.upper():
            # Determine role based on sales_type for backward compatibility
            if employee.sales_type == "tele":
                user_role = "Tele Sales"
            elif employee.sales_type == "field":
                user_role = "Field Sales"
            else:
                user_role = "Sales Employee"
    
    if user_role:
        # Check if user already exists with this mobile
        existing_user = await db.get_item('users', {"mobile": employee.mobile})
        if existing_user:
            # Delete old user account to prevent data carry-over
            await db.delete_item('users', {"mobile": employee.mobile})
            logger.info(f"Deleted old user account for mobile {employee.mobile} (was: {existing_user.get('name')}, role: {existing_user.get('role')})")
        
        # Create fresh new user account with PIN = last 4 digits of mobile
        pin = employee.mobile[-4:]
        new_user = User(
            mobile=employee.mobile,
            pin_hash=hash_pin(pin),
            name=employee.name,
            role=user_role
        )
        user_dict = new_user.model_dump()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        await db.put_item('users', user_dict)
        logger.info(f"{user_role} user account created for {employee.name} with mobile {employee.mobile}")
    
    return employee_obj


@api_router.get("/hrm/employees", response_model=List[Employee])
async def get_employees(current_user: dict = Depends(get_current_user)):
    employees = await db.scan_items('employees', {}, {"_id": 0} if {}, {"_id": 0} else {})
    for emp in employees:
        if isinstance(emp.get('created_at'), str):
            emp['created_at'] = datetime.fromisoformat(emp['created_at'])
    return employees


@api_router.put("/hrm/employees/{employee_id}", response_model=Employee)
async def update_employee(employee_id: str, employee_update: EmployeeUpdate, current_user: dict = Depends(get_current_user)):
    # Get existing employee
    existing = await db.get_item('employees', {"id": employee_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check if mobile number or name is being changed
    mobile_changed = False
    name_changed = False
    old_mobile = existing.get("mobile")
    old_name = existing.get("name")
    new_mobile = employee_update.mobile
    new_name = employee_update.name
    
    if new_mobile and new_mobile != old_mobile:
        mobile_changed = True
    if new_name and new_name != old_name:
        name_changed = True
    
    # Update fields
    update_data = {k: v for k, v in employee_update.model_dump().items() if v is not None}
    if update_data:
        await db.employees.update_one({"id": employee_id}, {"$set": update_data})
    
    # If mobile or name changed, sync user account for ALL roles with user accounts
    if mobile_changed or name_changed:
        # Get the designation to determine if user account should exist
        designation = existing.get("designation") or update_data.get("designation")
        
        if designation:
            designation_to_role = {
                'SALES_HEAD': 'Sales Head',
                'TELE_SALES_EXECUTIVE': 'Tele Sales',
                'FIELD_SALES_EXECUTIVE': 'Field Sales',
                'ACADEMIC_HEAD': 'Academic Head',
                'ACADEMIC_COORDINATOR': 'Academic Coordinator',
                'TRAINER_FULLTIME': 'Trainer',
                'TRAINER_PARTTIME': 'Trainer',
                'HR_MANAGER': 'HR',
                'HR_EXECUTIVE': 'HR',
                'ACCOUNTS_HEAD': 'Accounts Head',
                'ACCOUNTANT': 'Accountant',
                'DISPATCH_HEAD': 'Dispatch Head',
                'DISPATCH_ASSISTANT': 'Dispatch Assistant',
                'COO': 'COO',
                'MD': 'Management',
                'CEO': 'Management'
            }
            
            user_role = designation_to_role.get(designation)
            
            if user_role:
                # Delete old user account(s) by old mobile
                if mobile_changed:
                    await db.delete_item('users', {"mobile": old_mobile})
                    logger.info(f"Deleted old user account for mobile {old_mobile}")
                
                # If mobile changed, also delete any user with new mobile (clean slate)
                if mobile_changed:
                    await db.delete_item('users', {"mobile": new_mobile})
                
                # Create/update user account with new mobile and/or name
                final_mobile = new_mobile if new_mobile else old_mobile
                final_name = new_name if new_name else old_name
                pin = final_mobile[-4:]
                
                new_user = User(
                    mobile=final_mobile,
                    pin_hash=hash_pin(pin),
                    name=final_name,
                    role=user_role
                )
                
                user_dict = new_user.model_dump()
                user_dict['created_at'] = user_dict['created_at'].isoformat()
                await db.put_item('users', user_dict)
                logger.info(f"User account synced for {final_name}: mobile {final_mobile}, PIN {pin}, role {user_role}")
    
    # Return updated employee
    updated = await db.get_item('employees', {"id": employee_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated


@api_router.delete("/hrm/employees/{employee_id}")
async def delete_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    # Get employee details before deletion
    employee = await db.get_item('employees', {"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Delete employee
    result = await db.delete_item('employees', {"id": employee_id})
    
    # Delete related documents and attendance
    await db.employee_documents.delete_many({"employee_id": employee_id})
    await db.attendance.delete_many({"employee_id": employee_id})
    
    # CASCADING DELETION: Delete user account by mobile number (works for ALL roles)
    # This ensures clean deletion regardless of role changes or updates
    if employee.get("mobile"):
        deleted_user = await db.delete_item('users', {"mobile": employee["mobile"]})
        if deleted_user.deleted_count > 0:
            logger.info(f"User account deleted for {employee['name']} (mobile: {employee['mobile']})")
        else:
            logger.info(f"No user account found for {employee['name']} (mobile: {employee['mobile']})")
    
    return {"message": "Employee and associated user account deleted successfully"}


# HRM - Attendance Management
@api_router.post("/hrm/attendance", response_model=Attendance)
async def record_attendance(attendance: AttendanceCreate, current_user: dict = Depends(get_current_user)):
    # Get employee details
    employee = await db.get_item('employees', {"id": attendance.employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Create attendance record
    now = datetime.now(timezone.utc)
    attendance_obj = Attendance(
        employee_id=attendance.employee_id,
        employee_name=employee["name"],
        mobile=employee["mobile"],
        date=now.strftime("%Y-%m-%d"),
        time=now.strftime("%H:%M:%S"),
        gps_lat=attendance.gps_lat,
        gps_long=attendance.gps_long
    )
    
    doc = attendance_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.put_item('attendance', doc)
    return attendance_obj


@api_router.get("/hrm/attendance", response_model=List[Attendance])
async def get_attendance(current_user: dict = Depends(get_current_user)):
    attendance_records = await db.attendance.find({}, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    for record in attendance_records:
        if isinstance(record.get('timestamp'), str):
            record['timestamp'] = datetime.fromisoformat(record['timestamp'])
    return attendance_records


# HRM - Employee Documents
@api_router.post("/hrm/employee-documents", response_model=EmployeeDocument)
async def upload_employee_document(doc: EmployeeDocumentCreate, current_user: dict = Depends(get_current_user)):
    # Get employee details
    employee = await db.get_item('employees', {"id": doc.employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    doc_obj = EmployeeDocument(
        employee_id=doc.employee_id,
        employee_name=employee["name"],
        doc_type=doc.doc_type,
        file_name=doc.file_name,
        file_data=doc.file_data,
        expiry_date=doc.expiry_date
    )
    
    doc_dict = doc_obj.model_dump()
    doc_dict['uploaded_at'] = doc_dict['uploaded_at'].isoformat()
    await db.put_item('employee_documents', doc_dict)
    return doc_obj


@api_router.get("/hrm/employee-documents/{employee_id}", response_model=List[EmployeeDocument])
async def get_employee_documents(employee_id: str, current_user: dict = Depends(get_current_user)):
    docs = await db.scan_items('employee_documents', {"employee_id": employee_id}, {"_id": 0} if {"employee_id": employee_id}, {"_id": 0} else {})
    for doc in docs:
        if isinstance(doc.get('uploaded_at'), str):
            doc['uploaded_at'] = datetime.fromisoformat(doc['uploaded_at'])
    return docs


@api_router.get("/hrm/employee-documents/alerts/all")
async def get_employee_document_alerts(current_user: dict = Depends(get_current_user)):
    all_docs = await db.scan_items('employee_documents', {}, {"_id": 0} if {}, {"_id": 0} else {})
    
    alerts = []
    for doc in all_docs:
        days_until_expiry = calculate_days_until_expiry(doc["expiry_date"])
        if days_until_expiry <= 30:  # Alert for docs expiring in 30 days or less
            alerts.append({
                "id": doc["id"],
                "employee_id": doc["employee_id"],
                "employee_name": doc["employee_name"],
                "doc_type": doc["doc_type"],
                "expiry_date": doc["expiry_date"],
                "days_until_expiry": days_until_expiry,
                "severity": "critical" if days_until_expiry <= 7 else "warning" if days_until_expiry <= 15 else "info"
            })
    
    return alerts


@api_router.delete("/hrm/employee-documents/{doc_id}")
async def delete_employee_document(doc_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.delete_item('employee_documents', {"id": doc_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted successfully"}


# HRM - Company Documents
@api_router.post("/hrm/company-documents", response_model=CompanyDocument)
async def upload_company_document(doc: CompanyDocumentCreate, current_user: dict = Depends(get_current_user)):
    doc_obj = CompanyDocument(**doc.model_dump())
    doc_dict = doc_obj.model_dump()
    doc_dict['uploaded_at'] = doc_dict['uploaded_at'].isoformat()
    await db.put_item('company_documents', doc_dict)
    return doc_obj


@api_router.get("/hrm/company-documents", response_model=List[CompanyDocument])
async def get_company_documents(current_user: dict = Depends(get_current_user)):
    docs = await db.scan_items('company_documents', {}, {"_id": 0} if {}, {"_id": 0} else {})
    for doc in docs:
        if isinstance(doc.get('uploaded_at'), str):
            doc['uploaded_at'] = datetime.fromisoformat(doc['uploaded_at'])
    return docs


@api_router.get("/hrm/company-documents/alerts/all")
async def get_company_document_alerts(current_user: dict = Depends(get_current_user)):
    all_docs = await db.scan_items('company_documents', {}, {"_id": 0} if {}, {"_id": 0} else {})
    
    alerts = []
    for doc in all_docs:
        days_until_expiry = calculate_days_until_expiry(doc["expiry_date"])
        if days_until_expiry <= 30:  # Alert for docs expiring in 30 days or less
            alerts.append({
                "id": doc["id"],
                "doc_name": doc["doc_name"],
                "doc_type": doc["doc_type"],
                "expiry_date": doc["expiry_date"],
                "days_until_expiry": days_until_expiry,
                "severity": "critical" if days_until_expiry <= 7 else "warning" if days_until_expiry <= 15 else "info"
            })
    
    return alerts


@api_router.delete("/hrm/company-documents/{doc_id}")
async def delete_company_document(doc_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.delete_item('company_documents', {"id": doc_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted successfully"}


# Sales Head - Dashboard
@api_router.get("/dashboard/sales-head")
async def sales_head_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Sales Head":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Sales Head role required."
        )
    
    return {
        "message": "Welcome to Sales Head Dashboard",
        "user": current_user["name"],
        "role": "Sales Head"
    }


@api_router.get("/dashboard/sales-employee")
async def sales_employee_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Sales Employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Sales Employee role required."
        )
    
    # Get employee details including badge
    employee = await db.get_item('employees', {"mobile": current_user["mobile"]}, {"_id": 0})
    
    return {
        "message": "Welcome to Sales Employee Dashboard",
        "user": current_user["name"],
        "role": "Sales Employee",
        "badge_title": employee.get("badge_title", "Sales Staff") if employee else "Sales Staff",
        "branch": employee.get("branch") if employee else None
    }


@api_router.get("/dashboard/tele-sales")
async def tele_sales_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Tele Sales":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Tele Sales role required."
        )
    
    employee = await db.get_item('employees', {"mobile": current_user["mobile"]}, {"_id": 0})
    
    return {
        "message": "Welcome to Tele Sales Dashboard",
        "user": current_user["name"],
        "role": "Tele Sales",
        "badge_title": employee.get("badge_title", "Tele Sales") if employee else "Tele Sales",
        "branch": employee.get("branch") if employee else None,
        "employee_id": employee["id"] if employee else None
    }


@api_router.get("/dashboard/field-sales")
async def field_sales_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Field Sales":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Field Sales role required."
        )
    
    employee = await db.get_item('employees', {"mobile": current_user["mobile"]}, {"_id": 0})
    
    return {
        "message": "Welcome to Field Sales Dashboard",
        "user": current_user["name"],
        "role": "Field Sales",
        "badge_title": employee.get("badge_title", "Field Sales") if employee else "Field Sales",
        "branch": employee.get("branch") if employee else None,
        "employee_id": employee["id"] if employee else None
    }


# Sales Head - Employee Monitoring
@api_router.get("/sales-head/employees")
async def get_sales_employees(
    branch: Optional[str] = None,
    badge_title: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "Sales Head":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Filter sales department employees
    query = {"department": "Sales"}
    if branch:
        query["branch"] = branch
    if badge_title:
        query["badge_title"] = badge_title
    
    employees = await db.scan_items('employees', query, {"_id": 0} if query, {"_id": 0} else {})
    for emp in employees:
        if isinstance(emp.get('created_at'), str):
            emp['created_at'] = datetime.fromisoformat(emp['created_at'])
    
    return employees


@api_router.get("/sales-head/attendance/live")
async def get_live_attendance(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Sales Head":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get all sales employees
    employees = await db.scan_items('employees', {"department": "Sales"}, {"_id": 0} if {"department": "Sales"}, {"_id": 0} else {})
    
    # Get today's attendance
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    attendance_records = await db.scan_items('attendance', {"date": today}, {"_id": 0} if {"date": today}, {"_id": 0} else {})
    
    # Create attendance map
    attendance_map = {record["employee_id"]: record for record in attendance_records}
    
    # Combine employee + attendance status
    result = []
    for emp in employees:
        att_record = attendance_map.get(emp["id"])
        result.append({
            "id": emp["id"],
            "name": emp["name"],
            "mobile": emp["mobile"],
            "branch": emp["branch"],
            "badge_title": emp.get("badge_title", "Staff"),
            "status": "Working" if att_record else "Not Working",
            "last_attendance": att_record["time"] if att_record else None
        })
    
    return result


@api_router.put("/sales-head/employees/{employee_id}/badge")
async def assign_badge(employee_id: str, badge_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Sales Head":
        raise HTTPException(status_code=403, detail="Access denied")
    
    existing = await db.get_item('employees', {"id": employee_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    if existing.get("department") != "Sales":
        raise HTTPException(status_code=403, detail="Can only assign badges to sales team members")
    
    badge_title = badge_data.get("badge_title")
    if not badge_title:
        raise HTTPException(status_code=400, detail="Badge title is required")
    
    await db.employees.update_one({"id": employee_id}, {"$set": {"badge_title": badge_title}})
    
    return {"message": "Badge assigned successfully", "badge_title": badge_title}


# Sales Head - Lead Management
@api_router.post("/sales-head/leads", response_model=Lead)
async def create_lead(lead: LeadCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Sales Head":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get assigned employee name if provided
    assigned_to_name = None
    if lead.assigned_to:
        emp = await db.get_item('employees', {"id": lead.assigned_to}, {"_id": 0})
        if emp:
            assigned_to_name = emp["name"]
    
    lead_obj = Lead(
        **lead.model_dump(),
        assigned_to_name=assigned_to_name,
        assigned_by=current_user["id"],
        assigned_by_name=current_user["name"]
    )
    
    doc = lead_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.put_item('leads', doc)
    
    return lead_obj


@api_router.get("/sales-head/leads", response_model=List[Lead])
async def get_leads(
    source: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "Sales Head":
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = {}
    if source:
        query["source"] = source
    if status:
        query["status"] = status
    
    leads = await db.leads.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for lead in leads:
        if isinstance(lead.get('created_at'), str):
            lead['created_at'] = datetime.fromisoformat(lead['created_at'])
        if isinstance(lead.get('updated_at'), str):
            lead['updated_at'] = datetime.fromisoformat(lead['updated_at'])
    
    return leads


@api_router.put("/sales-head/leads/{lead_id}", response_model=Lead)
async def update_lead(lead_id: str, lead_update: LeadUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Sales Head":
        raise HTTPException(status_code=403, detail="Access denied")
    
    existing = await db.get_item('leads', {"id": lead_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    update_data = {k: v for k, v in lead_update.model_dump().items() if v is not None}
    
    # Update assigned_to_name if assigned_to changed
    if "assigned_to" in update_data and update_data["assigned_to"]:
        emp = await db.get_item('employees', {"id": update_data["assigned_to"]}, {"_id": 0})
        if emp:
            update_data["assigned_to_name"] = emp["name"]
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if update_data:
        await db.leads.update_one({"id": lead_id}, {"$set": update_data})
    
    updated = await db.get_item('leads', {"id": lead_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return updated


@api_router.delete("/sales-head/leads/{lead_id}")
async def delete_lead(lead_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Sales Head":
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await db.delete_item('leads', {"id": lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return {"message": "Lead deleted successfully"}


# Sales Head - Quotation Management
@api_router.post("/sales-head/quotations", response_model=Quotation)
async def create_quotation(quotation: QuotationCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Sales Head":
        raise HTTPException(status_code=403, detail="Access denied")
    
    quot_obj = Quotation(
        **quotation.model_dump(),
        created_by=current_user["id"],
        created_by_name=current_user["name"],
        status="Approved"  # Sales Head quotations are auto-approved
    )
    
    doc = quot_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('approved_at'):
        doc['approved_at'] = doc['approved_at'].isoformat()
    await db.put_item('quotations', doc)
    
    return quot_obj


@api_router.get("/sales-head/quotations", response_model=List[Quotation])
async def get_quotations(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "Sales Head":
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = {}
    if status:
        query["status"] = status
    
    quotations = await db.quotations.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for quot in quotations:
        if isinstance(quot.get('created_at'), str):
            quot['created_at'] = datetime.fromisoformat(quot['created_at'])
        if quot.get('approved_at') and isinstance(quot['approved_at'], str):
            quot['approved_at'] = datetime.fromisoformat(quot['approved_at'])
    
    return quotations


@api_router.put("/sales-head/quotations/{quot_id}/approve")
async def approve_quotation(quot_id: str, approval: QuotationApprove, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Sales Head":
        raise HTTPException(status_code=403, detail="Access denied")
    
    existing = await db.get_item('quotations', {"id": quot_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    update_data = {
        "status": approval.status,
        "approved_by": current_user["id"],
        "approved_by_name": current_user["name"],
        "approved_at": datetime.now(timezone.utc).isoformat()
    }
    
    if approval.remarks:
        update_data["remarks"] = approval.remarks
    
    await db.quotations.update_one({"id": quot_id}, {"$set": update_data})
    
    return {"message": f"Quotation {approval.status.lower()} successfully"}


# Sales Head - Leave Approvals
@api_router.get("/sales-head/leave-requests")
async def get_leave_requests(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "Sales Head":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get leave requests from sales department employees
    query = {}
    if status:
        query["status"] = status
    
    leave_requests = await db.leave_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for req in leave_requests:
        if isinstance(req.get('created_at'), str):
            req['created_at'] = datetime.fromisoformat(req['created_at'])
        if isinstance(req.get('updated_at'), str):
            req['updated_at'] = datetime.fromisoformat(req['updated_at'])
    
    return leave_requests


@api_router.put("/sales-head/leave-requests/{request_id}/approve")
async def approve_leave_request(request_id: str, action: LeaveApprovalAction, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Sales Head":
        raise HTTPException(status_code=403, detail="Access denied")
    
    existing = await db.get_item('leave_requests', {"id": request_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    new_status = "Approved by Sales Head" if action.action == "Approve" else "Rejected"
    
    update_data = {
        "status": new_status,
        "approved_by_sales_head": current_user["id"],
        "sales_head_remarks": action.remarks or "",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.leave_requests.update_one({"id": request_id}, {"$set": update_data})
    
    return {"message": f"Leave request {action.action.lower()}d successfully"}


# Employee - Submit Leave Request
@api_router.post("/employee/leave-request", response_model=LeaveRequest)
async def submit_leave_request(leave_req: LeaveRequestCreate, current_user: dict = Depends(get_current_user)):
    # Get employee details
    employee = await db.get_item('employees', {"mobile": current_user["mobile"]}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee record not found")
    
    leave_obj = LeaveRequest(
        employee_id=employee["id"],
        employee_name=employee["name"],
        employee_mobile=employee["mobile"],
        **leave_req.model_dump()
    )
    
    doc = leave_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.put_item('leave_requests', doc)
    
    return leave_obj


# Sales - Self Lead Submission (All Sales Roles)
@api_router.post("/sales/self-lead")
async def submit_self_lead(lead_data: SelfLeadCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["Sales Head", "Tele Sales", "Field Sales"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    employee = await db.get_item('employees', {"mobile": current_user["mobile"]}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee record not found")
    
    lead_obj = Lead(
        source="Self",
        client_name=lead_data.client_name,
        requirement=lead_data.requirement,
        industry=lead_data.company_name or "",
        assigned_to=employee["id"],
        assigned_to_name=employee["name"],
        assigned_by=employee["id"],
        assigned_by_name=employee["name"],
        status="New",
        remarks=lead_data.notes or ""
    )
    
    doc = lead_obj.model_dump()
    doc['mobile'] = lead_data.mobile
    doc['email'] = lead_data.email or ""
    doc['branch'] = lead_data.branch
    doc['lead_type'] = lead_data.lead_type or "Individual"
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.put_item('leads', doc)
    
    return {"message": "Self lead submitted successfully", "lead_id": lead_obj.id}


# Sales - Get My Leads (Assigned + Self)
@api_router.get("/sales/my-leads")
async def get_my_leads(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["Tele Sales", "Field Sales"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    employee = await db.get_item('employees', {"mobile": current_user["mobile"]}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee record not found")
    
    leads = await db.leads.find({"assigned_to": employee["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for lead in leads:
        if isinstance(lead.get('created_at'), str):
            lead['created_at'] = datetime.fromisoformat(lead['created_at'])
        if isinstance(lead.get('updated_at'), str):
            lead['updated_at'] = datetime.fromisoformat(lead['updated_at'])
    
    return leads


# Sales - Update Lead Status
@api_router.put("/sales/leads/{lead_id}")
async def update_my_lead(lead_id: str, update_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["Tele Sales", "Field Sales"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    existing = await db.get_item('leads', {"id": lead_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.leads.update_one({"id": lead_id}, {"$set": update_data})
    
    return {"message": "Lead updated successfully"}


# Sales - Create Quotation
@api_router.post("/sales/quotations")
async def create_sales_quotation(quot_data: QuotationCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["Sales Head", "Tele Sales", "Field Sales"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    quot_obj = Quotation(
        **quot_data.model_dump(),
        created_by=current_user["id"],
        created_by_name=current_user["name"],
        status="Approved"  # Auto-approved
    )
    
    doc = quot_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('approved_at'):
        doc['approved_at'] = doc['approved_at'].isoformat()
    await db.put_item('quotations', doc)
    
    return {"message": "Quotation created successfully", "quotation_id": quot_obj.id}


# Sales - Get My Quotations
@api_router.get("/sales/quotations")
async def get_my_quotations(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["Sales Head", "Tele Sales", "Field Sales"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    quotations = await db.quotations.find({"created_by": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for quot in quotations:
        if isinstance(quot.get('created_at'), str):
            quot['created_at'] = datetime.fromisoformat(quot['created_at'])
        if quot.get('approved_at') and isinstance(quot['approved_at'], str):
            quot['approved_at'] = datetime.fromisoformat(quot['approved_at'])
    
    return quotations


# Sales - Trainer Availability Request
@api_router.post("/sales/trainer-request")
async def request_trainer(request_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["Tele Sales", "Field Sales"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    trainer_req = TrainerAvailabilityRequest(
        lead_id=request_data.get("lead_id"),
        client_name=request_data["client_name"],
        course=request_data["course"],
        preferred_dates=request_data["preferred_dates"],
        branch=request_data["branch"],
        mode=request_data["mode"],
        notes=request_data.get("notes"),
        requested_by=current_user["id"],
        requested_by_name=current_user["name"]
    )
    
    doc = trainer_req.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.put_item('trainer_requests', doc)
    
    return {"message": "Trainer availability request submitted", "request_id": trainer_req.id}


# Sales - Get My Trainer Requests
@api_router.get("/sales/trainer-requests")
async def get_my_trainer_requests(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["Tele Sales", "Field Sales"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    requests = await db.trainer_requests.find({"requested_by": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for req in requests:
        if isinstance(req.get('created_at'), str):
            req['created_at'] = datetime.fromisoformat(req['created_at'])
    
    return requests


# Sales - Invoice Request
@api_router.post("/sales/invoice-request")
async def request_invoice(request_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["Tele Sales", "Field Sales"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    invoice_req = InvoiceRequest(
        lead_id=request_data.get("lead_id"),
        quotation_id=request_data.get("quotation_id"),
        payment_terms=request_data["payment_terms"],
        initial_amount=request_data.get("initial_amount"),
        notes=request_data.get("notes"),
        requested_by=current_user["id"],
        requested_by_name=current_user["name"]
    )
    
    doc = invoice_req.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.put_item('invoice_requests', doc)
    
    return {"message": "Invoice request submitted", "request_id": invoice_req.id}


# Sales - Get My Invoice Requests
@api_router.get("/sales/invoice-requests")
async def get_my_invoice_requests(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["Tele Sales", "Field Sales"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    requests = await db.invoice_requests.find({"requested_by": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for req in requests:
        if isinstance(req.get('created_at'), str):
            req['created_at'] = datetime.fromisoformat(req['created_at'])
    
    return requests


# Sales - Update Payment Confirmation
@api_router.put("/sales/invoice-requests/{request_id}/payment")
async def update_payment_confirmation(request_id: str, payment_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["Tele Sales", "Field Sales"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.invoice_requests.update_one(
        {"id": request_id},
        {"$set": {"payment_confirmations": payment_data.get("confirmation_details")}}
    )
    
    return {"message": "Payment confirmation updated"}


# Field Sales - Visit Log
@api_router.post("/sales/visit-log")
async def log_visit(visit_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Field Sales":
        raise HTTPException(status_code=403, detail="Access denied. Field Sales only.")
    
    visit_log = VisitLog(
        date=visit_data["date"],
        company=visit_data["company"],
        contact_person=visit_data["contact_person"],
        notes=visit_data.get("notes"),
        logged_by=current_user["id"],
        logged_by_name=current_user["name"]
    )
    
    doc = visit_log.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.put_item('visit_logs', doc)
    
    return {"message": "Visit logged successfully", "visit_id": visit_log.id}


# Field Sales - Get My Visits
@api_router.get("/sales/visit-logs")
async def get_my_visits(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Field Sales":
        raise HTTPException(status_code=403, detail="Access denied")
    
    visits = await db.visit_logs.find({"logged_by": current_user["id"]}, {"_id": 0}).sort("date", -1).to_list(1000)
    for visit in visits:
        if isinstance(visit.get('created_at'), str):
            visit['created_at'] = datetime.fromisoformat(visit['created_at'])
    
    return visits


# Simplified Trainer Request (matching frontend structure)
@api_router.post("/sales/trainer-requests")
async def create_trainer_request_simple(request_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["Tele Sales", "Field Sales"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    trainer_req = {
        "id": str(uuid.uuid4()),
        "client_name": request_data["client_name"],
        "course_type": request_data["course_type"],
        "preferred_date": request_data["preferred_date"],
        "location": request_data.get("location", ""),
        "duration": request_data.get("duration", ""),
        "remarks": request_data.get("remarks", ""),
        "requested_by": current_user["id"],
        "requested_by_name": current_user["name"],
        "status": "Pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.put_item('trainer_requests', trainer_req)
    
    return {"message": "Trainer request submitted successfully", "request_id": trainer_req["id"]}


# Simplified Invoice Request (matching frontend structure)
@api_router.post("/sales/invoice-requests")
async def create_invoice_request_simple(request_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["Tele Sales", "Field Sales"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    invoice_req = {
        "id": str(uuid.uuid4()),
        "client_name": request_data["client_name"],
        "quotation_ref": request_data.get("quotation_ref", ""),
        "amount": float(request_data["amount"]),
        "description": request_data.get("description", ""),
        "remarks": request_data.get("remarks", ""),
        "requested_by": current_user["id"],
        "requested_by_name": current_user["name"],
        "status": "Pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.put_item('invoice_requests', invoice_req)
    
    return {"message": "Invoice request submitted successfully", "request_id": invoice_req["id"]}


# Simplified Visit Log (matching frontend structure)
@api_router.post("/sales/visit-logs")
async def create_visit_log_simple(visit_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Field Sales":
        raise HTTPException(status_code=403, detail="Access denied. Field Sales only.")
    
    visit_log = {
        "id": str(uuid.uuid4()),
        "client_name": visit_data["client_name"],
        "location": visit_data["location"],
        "visit_date": visit_data["visit_date"],
        "visit_time": visit_data.get("visit_time", ""),
        "purpose": visit_data.get("purpose", ""),
        "outcome": visit_data.get("outcome", ""),
        "next_action": visit_data.get("next_action", ""),
        "logged_by": current_user["id"],
        "logged_by_name": current_user["name"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.put_item('visit_logs', visit_log)
    
    return {"message": "Visit log submitted successfully", "visit_id": visit_log["id"]}


# Sales Head - Get All Leads
@api_router.get("/sales/leads")
async def get_all_leads(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["COO", "Sales Head"]:
        raise HTTPException(status_code=403, detail="Access denied. Sales Head or COO role required.")
    
    leads = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for lead in leads:
        if isinstance(lead.get('created_at'), str):
            lead['created_at'] = datetime.fromisoformat(lead['created_at'])
        if isinstance(lead.get('updated_at'), str):
            lead['updated_at'] = datetime.fromisoformat(lead['updated_at'])
    
    return leads


# Sales Head - Assign Lead to Employee
@api_router.put("/sales/leads/{lead_id}/assign")
async def assign_lead(lead_id: str, assign_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["COO", "Sales Head"]:
        raise HTTPException(status_code=403, detail="Access denied. Sales Head or COO role required.")
    
    employee_id = assign_data.get("employee_id")
    if not employee_id:
        raise HTTPException(status_code=400, detail="employee_id required")
    
    employee = await db.get_item('employees', {"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    await db.leads.update_one(
        {"id": lead_id},
        {"$set": {
            "assigned_to": employee_id,
            "assigned_to_name": employee["name"],
            "assigned_by": current_user["id"],
            "assigned_by_name": current_user["name"],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Lead assigned successfully"}


# Sales Head - Get All Quotations
@api_router.get("/sales/quotations/all")
async def get_all_quotations(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["COO", "Sales Head"]:
        raise HTTPException(status_code=403, detail="Access denied. Sales Head or COO role required.")
    
    quotations = await db.quotations.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for quot in quotations:
        if isinstance(quot.get('created_at'), str):
            quot['created_at'] = datetime.fromisoformat(quot['created_at'])
        if quot.get('approved_at') and isinstance(quot['approved_at'], str):
            quot['approved_at'] = datetime.fromisoformat(quot['approved_at'])
    
    return quotations


# Sales Head - Approve/Reject Quotation
@api_router.put("/sales/quotations/{quotation_id}/approve")
async def approve_quotation(quotation_id: str, approval_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["COO", "Sales Head"]:
        raise HTTPException(status_code=403, detail="Access denied. Sales Head or COO role required.")
    
    approved = approval_data.get("approved", False)
    remarks = approval_data.get("remarks", "")
    
    await db.quotations.update_one(
        {"id": quotation_id},
        {"$set": {
            "status": "Approved" if approved else "Rejected",
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "approved_by": current_user["id"],
            "approved_by_name": current_user["name"],
            "approval_remarks": remarks
        }}
    )
    
    return {"message": f"Quotation {'approved' if approved else 'rejected'} successfully"}


# HRM - Approve Leave Request
@api_router.put("/hrm/leave-requests/{request_id}/approve")
async def approve_leave_request(request_id: str, approval_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["COO", "Sales Head", "HR"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    remarks = approval_data.get("remarks", "")
    
    await db.leave_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": "Approved",
            "approved_by": current_user["id"],
            "approved_by_name": current_user["name"],
            "approval_remarks": remarks,
            "approved_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Leave request approved successfully"}


# HRM - Reject Leave Request
@api_router.put("/hrm/leave-requests/{request_id}/reject")
async def reject_leave_request(request_id: str, rejection_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["COO", "Sales Head", "HR"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    remarks = rejection_data.get("remarks", "")
    
    await db.leave_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": "Rejected",
            "rejected_by": current_user["id"],
            "rejected_by_name": current_user["name"],
            "rejection_remarks": remarks,
            "rejected_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Leave request rejected successfully"}


# Admin - Fix User Account for Mobile Number Change
@api_router.post("/admin/fix-user-account")
async def fix_user_account_after_mobile_change(fix_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["COO"]:
        raise HTTPException(status_code=403, detail="Access denied. COO only.")
    
    employee_id = fix_data.get("employee_id")
    if not employee_id:
        raise HTTPException(status_code=400, detail="employee_id required")
    
    # Get employee record
    employee = await db.get_item('employees', {"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Delete any old user accounts for this employee ID
    await db.users.delete_many({"id": employee_id})
    
    # Create new user account with current mobile
    mobile = employee["mobile"]
    sales_type = employee.get("sales_type", "")
    
    if sales_type == "tele":
        user_role = "Tele Sales"
    elif sales_type == "field":
        user_role = "Field Sales"
    else:
        raise HTTPException(status_code=400, detail="Invalid sales_type")
    
    pin = mobile[-4:]
    new_user = User(
        id=employee["id"],
        mobile=mobile,
        pin_hash=hash_pin(pin),
        name=employee["name"],
        role=user_role
    )
    
    user_dict = new_user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    await db.put_item('users', user_dict)
    
    return {
        "message": f"User account fixed for {employee['name']}",
        "mobile": mobile,
        "pin": pin,
        "role": user_role
    }


# Admin - Create Missing User Accounts for Sales Employees
@api_router.post("/admin/create-sales-user-accounts")
async def create_missing_sales_user_accounts(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["COO"]:
        raise HTTPException(status_code=403, detail="Access denied. COO only.")
    
    # Get all sales employees without filtering by mobile
    all_employees = await db.scan_items('employees', {"department": "Sales"}, {"_id": 0} if {"department": "Sales"}, {"_id": 0} else {})
    
    created_count = 0
    skipped_count = 0
    results = []
    
    for employee in all_employees:
        mobile = employee.get("mobile")
        name = employee.get("name")
        sales_type = employee.get("sales_type", "")
        
        # Skip test users
        if mobile and mobile.startswith("98765"):
            continue
        
        if not mobile or not sales_type:
            skipped_count += 1
            results.append({"name": name, "status": "skipped", "reason": "Missing mobile or sales_type"})
            continue
        
        # Determine role
        if sales_type == "tele":
            user_role = "Tele Sales"
        elif sales_type == "field":
            user_role = "Field Sales"
        else:
            skipped_count += 1
            results.append({"name": name, "status": "skipped", "reason": "Invalid sales_type"})
            continue
        
        # Check if user already exists with this mobile and role
        existing_user = await db.get_item('users', {"mobile": mobile, "role": user_role})
        
        if existing_user:
            skipped_count += 1
            results.append({"name": name, "mobile": mobile, "role": user_role, "status": "exists"})
            continue
        
        # Create user account with PIN = last 4 digits of mobile
        pin = mobile[-4:]
        new_user = User(
            id=employee["id"],  # Use same ID as employee
            mobile=mobile,
            pin_hash=hash_pin(pin),
            name=name,
            role=user_role
        )
        
        user_dict = new_user.model_dump()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        await db.put_item('users', user_dict)
        
        created_count += 1
        results.append({
            "name": name,
            "mobile": mobile,
            "pin": pin,
            "role": user_role,
            "status": "created"
        })
        logger.info(f"Created {user_role} user account for {name} (mobile: {mobile}, PIN: {pin})")
    
    return {
        "message": "User account creation completed",
        "created": created_count,
        "skipped": skipped_count,
        "results": results
    }


# ============================================
# ACADEMIC HEAD MODULE - NEW ENDPOINTS
# ============================================

# Academic - Get All Trainer Requests from Sales
@api_router.get("/academic/trainer-requests")
async def get_all_trainer_requests(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Academic Head":
        raise HTTPException(status_code=403, detail="Access denied. Academic Head only.")
    
    requests = await db.trainer_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return requests


# Academic - Approve Trainer Request
@api_router.put("/academic/trainer-requests/{request_id}/approve")
async def approve_trainer_request(request_id: str, approval_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Academic Head":
        raise HTTPException(status_code=403, detail="Access denied. Academic Head only.")
    
    remarks = approval_data.get("remarks", "")
    confirmed_slots = approval_data.get("confirmed_slots", "")
    
    await db.trainer_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": "Approved",
            "confirmed_slots": confirmed_slots,
            "academic_remarks": remarks,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Trainer request approved successfully"}


# Academic - Reject Trainer Request
@api_router.put("/academic/trainer-requests/{request_id}/reject")
async def reject_trainer_request(request_id: str, rejection_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Academic Head":
        raise HTTPException(status_code=403, detail="Access denied. Academic Head only.")
    
    remarks = rejection_data.get("remarks", "")
    
    await db.trainer_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": "Rejected",
            "academic_remarks": remarks,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Trainer request rejected"}


# Academic - Suggest Alternative for Trainer Request
@api_router.put("/academic/trainer-requests/{request_id}/suggest-alternative")
async def suggest_alternative_trainer_request(request_id: str, alternative_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Academic Head":
        raise HTTPException(status_code=403, detail="Access denied. Academic Head only.")
    
    alternative_dates = alternative_data.get("alternative_dates", "")
    remarks = alternative_data.get("remarks", "")
    
    await db.trainer_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": "Alternative Suggested",
            "confirmed_slots": alternative_dates,
            "academic_remarks": remarks,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Alternative dates suggested"}


# Academic - Assign Trainer to Request
@api_router.put("/academic/trainer-requests/{request_id}/assign-trainer")
async def assign_trainer_to_request(request_id: str, assignment_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Academic Head":
        raise HTTPException(status_code=403, detail="Access denied. Academic Head only.")
    
    trainer_id = assignment_data.get("trainer_id")
    trainer_name = assignment_data.get("trainer_name")
    confirmed_slots = assignment_data.get("confirmed_slots", "")
    
    await db.trainer_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": "Trainer Assigned",
            "trainer_id": trainer_id,
            "trainer_name": trainer_name,
            "confirmed_slots": confirmed_slots,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Trainer assigned successfully"}


# Academic - Get All Trainers
@api_router.get("/academic/trainers")
async def get_all_trainers(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Academic Head":
        raise HTTPException(status_code=403, detail="Access denied. Academic Head only.")
    
    # Get employees with role/designation containing "Trainer"
    trainers = await db.scan_items('employees', 
        {"$or": [
            {"designation": {"$regex": "trainer", "$options": "i"}},
            {"role": {"$regex": "trainer", "$options": "i"}},
            {"department": "Academic"}
        ]},
        {"_id": 0}
     if 
        {"$or": [
            {"designation": {"$regex": "trainer", "$options": "i"}},
            {"role": {"$regex": "trainer", "$options": "i"}},
            {"department": "Academic"}
        ]},
        {"_id": 0}
     else {})
    
    return trainers


# Academic - Get All Work Orders
@api_router.get("/academic/work-orders")
async def get_all_work_orders(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Academic Head":
        raise HTTPException(status_code=403, detail="Access denied. Academic Head only.")
    
    work_orders = await db.work_orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return work_orders


# Academic - Approve Work Order
@api_router.put("/academic/work-orders/{work_order_id}/approve")
async def approve_work_order(work_order_id: str, approval_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Academic Head":
        raise HTTPException(status_code=403, detail="Access denied. Academic Head only.")
    
    trainer_id = approval_data.get("trainer_id")
    trainer_name = approval_data.get("trainer_name")
    coordinator_id = approval_data.get("coordinator_id")
    coordinator_name = approval_data.get("coordinator_name")
    remarks = approval_data.get("remarks", "")
    
    await db.work_orders.update_one(
        {"id": work_order_id},
        {"$set": {
            "status": "Approved",
            "assigned_trainer_id": trainer_id,
            "assigned_trainer_name": trainer_name,
            "assigned_coordinator_id": coordinator_id,
            "assigned_coordinator_name": coordinator_name,
            "approved_by": current_user["id"],
            "approved_by_name": current_user["name"],
            "remarks": remarks,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Work order approved successfully"}


# Academic - Get All Training Sessions
@api_router.get("/academic/training-sessions")
async def get_all_training_sessions(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Academic Head":
        raise HTTPException(status_code=403, detail="Access denied. Academic Head only.")
    
    sessions = await db.training_sessions.find({}, {"_id": 0}).sort("training_date", -1).to_list(1000)
    return sessions


# Academic - Update Training Session Status
@api_router.put("/academic/training-sessions/{session_id}/update-status")
async def update_training_session_status(session_id: str, status_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Academic Head":
        raise HTTPException(status_code=403, detail="Access denied. Academic Head only.")
    
    status = status_data.get("status")
    notes = status_data.get("notes", "")
    
    await db.training_sessions.update_one(
        {"id": session_id},
        {"$set": {
            "status": status,
            "completion_notes": notes,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Training session status updated"}


# Academic - Get All Certificate Requests
@api_router.get("/academic/certificate-requests")
async def get_all_certificate_requests(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Academic Head":
        raise HTTPException(status_code=403, detail="Access denied. Academic Head only.")
    
    requests = await db.certificate_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return requests


# Academic - Approve Certificate Request
@api_router.put("/academic/certificate-requests/{request_id}/approve")
async def approve_certificate_request(request_id: str, approval_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Academic Head":
        raise HTTPException(status_code=403, detail="Access denied. Academic Head only.")
    
    certificate_type = approval_data.get("certificate_type", "In-House")
    remarks = approval_data.get("remarks", "")
    
    await db.certificate_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": "Approved",
            "certificate_type": certificate_type,
            "approved_by": current_user["id"],
            "approved_by_name": current_user["name"],
            "remarks": remarks,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Certificate request approved"}


# Academic - Get Team Members
@api_router.get("/academic/team")
async def get_academic_team(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Academic Head":
        raise HTTPException(status_code=403, detail="Access denied. Academic Head only.")
    
    team_members = await db.scan_items('employees', 
        {"department": "Academic"},
        {"_id": 0}
     if 
        {"department": "Academic"},
        {"_id": 0}
     else {})
    
    # Get today's attendance for team
    today = datetime.now(timezone.utc).date().isoformat()
    attendance_records = await db.scan_items('attendance', 
        {"date": today},
        {"_id": 0}
     if 
        {"date": today},
        {"_id": 0}
     else {})
    
    # Mark attendance status
    attendance_map = {rec["employee_id"]: rec for rec in attendance_records}
    for member in team_members:
        member["attendance_today"] = "Present" if member["id"] in attendance_map else "Absent"
    
    return team_members


# ==================== CERTIFICATE GENERATION MODULE ====================

# Certificate Template Model (NEW - ADDITIVE)
class CertificateTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str = "INHOUSE"  # Default type
    logo_url: Optional[str] = None
    seal_url: Optional[str] = None
    signature_url: Optional[str] = None
    primary_color: Optional[str] = "#1a2f4d"
    secondary_color: Optional[str] = "#f59e0b"
    is_default: bool = False
    created_by: str
    created_by_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True


class CertificateTemplateCreate(BaseModel):
    name: str
    type: str = "INHOUSE"
    logo_url: Optional[str] = None
    seal_url: Optional[str] = None
    signature_url: Optional[str] = None
    primary_color: Optional[str] = "#1a2f4d"
    secondary_color: Optional[str] = "#f59e0b"
    is_default: bool = False


class CertificateTemplateUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    seal_url: Optional[str] = None
    signature_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None



# ==================== ASSESSMENT & FEEDBACK MODELS ====================

class AssessmentQuestion(BaseModel):
    """Individual question in an assessment form"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question_text: str
    question_type: str  # "rating", "multiple_choice", "free_text"
    options: Optional[List[str]] = None  # For multiple choice
    required: bool = True


class AssessmentForm(BaseModel):
    """Assessment/Feedback form configuration"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    questions: List[dict]  # List of AssessmentQuestion dicts
    
    # Session/Course details
    work_order_id: Optional[str] = None
    course_name: Optional[str] = None
    batch_name: Optional[str] = None
    trainer_id: Optional[str] = None
    trainer_name: Optional[str] = None
    session_date: Optional[str] = None
    branch: Optional[str] = None
    
    # Metadata
    created_by: str
    created_by_name: str
    created_by_role: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "active"  # active, archived
    qr_code_url: Optional[str] = None


class AssessmentFormCreate(BaseModel):
    """Create new assessment form"""
    title: str
    description: Optional[str] = None
    questions: List[dict]
    work_order_id: Optional[str] = None
    course_name: Optional[str] = None
    batch_name: Optional[str] = None
    trainer_id: Optional[str] = None
    trainer_name: Optional[str] = None
    session_date: Optional[str] = None
    branch: Optional[str] = None


class AssessmentSubmission(BaseModel):
    """Student submission for an assessment"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    form_id: str
    form_title: str
    
    # Responses
    responses: List[dict]  # [{question_id, question_text, answer, question_type}]
    
    # Session info (copied from form)
    work_order_id: Optional[str] = None
    course_name: Optional[str] = None
    batch_name: Optional[str] = None
    trainer_id: Optional[str] = None
    trainer_name: Optional[str] = None
    session_date: Optional[str] = None
    branch: Optional[str] = None
    
    # Submission metadata
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    student_name: Optional[str] = None
    student_contact: Optional[str] = None


class AssessmentSubmissionCreate(BaseModel):
    """Public submission from student"""
    form_id: str
    responses: List[dict]
    student_name: Optional[str] = None
    student_contact: Optional[str] = None




# ==================== EXPENSE REIMBURSEMENT MODELS ====================

class ExpenseClaim(BaseModel):
    """Expense claim/reimbursement model"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    employee_name: str
    mobile: str
    department: str  # Sales, Academic, HR, Accounts, Dispatch
    branch: str  # Dubai, Abu Dhabi, Saudi Arabia
    
    # Expense details
    amount: float
    currency: str = "AED"
    category: str  # Travel, Food, Accommodation, Stationery, Others
    description: str
    expense_date: str  # Date of expense
    attachment_url: Optional[str] = None  # Bill/receipt upload
    
    # Approval workflow
    status: str = "PENDING_DEPT_HEAD"  # PENDING_DEPT_HEAD, REJECTED, PENDING_HR, PENDING_ACCOUNTS, PAID
    
    # Department Head
    dept_head_id: Optional[str] = None
    dept_head_name: Optional[str] = None
    dept_head_decision: Optional[str] = None  # approve/reject
    dept_head_remarks: Optional[str] = None
    dept_head_reviewed_at: Optional[str] = None
    
    # HR
    hr_id: Optional[str] = None
    hr_name: Optional[str] = None
    hr_decision: Optional[str] = None
    hr_remarks: Optional[str] = None
    hr_reviewed_at: Optional[str] = None
    
    # Accounts
    accounts_id: Optional[str] = None
    accounts_name: Optional[str] = None
    payment_reference: Optional[str] = None
    paid_at: Optional[str] = None
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ExpenseClaimCreate(BaseModel):
    """Create new expense claim"""
    amount: float
    category: str
    description: str
    expense_date: str
    attachment_url: Optional[str] = None


class ExpenseClaimUpdateStatus(BaseModel):
    """Update expense claim status"""
    decision: str  # approve or reject
    remarks: Optional[str] = None



class CertificateCandidate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    certificate_no: str  # ARB/YY/MM/###
    candidate_name: str
    course_name: str
    trainer_name: str
    training_date: str
    completion_date: str
    issue_date: str
    expiry_date: Optional[str] = None
    work_order_id: Optional[str] = None
    client_name: Optional[str] = None
    grade: Optional[str] = None
    remarks: Optional[str] = None
    generated_by: str  # Employee ID
    generated_by_name: str
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "generated"  # generated, dispatched, delivered
    # NEW FIELDS (ADDITIVE ONLY - backward compatible)
    template_id: Optional[str] = None  # Link to certificate template
    verification_code: Optional[str] = None  # Unique code for QR verification
    verification_url: Optional[str] = None  # Full URL for QR code
    candidate_email: Optional[str] = None  # For bulk generation
    candidate_id: Optional[str] = None  # For bulk generation


class CertificateGenerationRequest(BaseModel):
    work_order_id: str
    candidates: List[dict]  # List of {name, grade (optional), email (optional), id (optional)}
    course_name: str
    trainer_name: str
    training_date: str
    completion_date: str
    expiry_date: Optional[str] = None
    template_id: Optional[str] = None  # NEW: Optional template selection


class BulkCertificateGenerationRequest(BaseModel):
    work_order_id: str
    template_id: Optional[str] = None
    candidates: List[dict]  # List with candidate_name, candidate_email, candidate_id, grade


# ==================== CERTIFICATE TEMPLATE ENDPOINTS (NEW - ADDITIVE) ====================

@api_router.get("/academic/templates")
async def get_certificate_templates(current_user: dict = Depends(get_current_user)):
    """Get all certificate templates"""
    if current_user.get("role") not in ["Academic Head", "COO"]:
        raise HTTPException(status_code=403, detail="Access denied. Academic Head or COO only.")
    
    templates = await db.scan_items('certificate_templates', 
        {"is_active": True},
        {"_id": 0}
     if 
        {"is_active": True},
        {"_id": 0}
     else {})
    
    return templates


@api_router.get("/academic/templates/default")
async def get_default_template(current_user: dict = Depends(get_current_user)):
    """Get the default certificate template"""
    template = await db.get_item('certificate_templates', 
        {"is_default": True, "is_active": True},
        {"_id": 0}
    )
    
    if not template:
        # Return a basic default if none exists
        return {
            "id": "default",
            "name": "Default Template",
            "type": "INHOUSE",
            "is_default": True
        }
    
    return template


@api_router.post("/academic/templates")
async def create_certificate_template(
    template_data: CertificateTemplateCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new certificate template"""
    if current_user.get("role") not in ["Academic Head", "COO"]:
        raise HTTPException(status_code=403, detail="Access denied. Academic Head or COO only.")
    
    # If this template is set as default, unset other defaults
    if template_data.is_default:
        await db.certificate_templates.update_many(
            {"is_default": True},
            {"$set": {"is_default": False}}
        )
    
    template = CertificateTemplate(
        **template_data.model_dump(),
        created_by=current_user.get("id", ""),
        created_by_name=current_user.get("name", "")
    )
    
    template_dict = template.model_dump()
    template_dict['created_at'] = template_dict['created_at'].isoformat()
    template_dict['updated_at'] = template_dict['updated_at'].isoformat()
    
    await db.put_item('certificate_templates', template_dict)
    
    return {"message": "Template created successfully", "template": template}


@api_router.put("/academic/templates/{template_id}")
async def update_certificate_template(
    template_id: str,
    template_update: CertificateTemplateUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a certificate template"""
    if current_user.get("role") not in ["Academic Head", "COO"]:
        raise HTTPException(status_code=403, detail="Access denied. Academic Head or COO only.")
    
    # If setting as default, unset other defaults
    if template_update.is_default:
        await db.certificate_templates.update_many(
            {"is_default": True, "id": {"$ne": template_id}},
            {"$set": {"is_default": False}}
        )
    
    update_data = {k: v for k, v in template_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.certificate_templates.update_one(
        {"id": template_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {"message": "Template updated successfully"}


@api_router.delete("/academic/templates/{template_id}")
async def delete_certificate_template(
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Soft delete a certificate template"""
    if current_user.get("role") not in ["Academic Head", "COO"]:
        raise HTTPException(status_code=403, detail="Access denied. Academic Head or COO only.")
    
    # Soft delete by marking inactive
    result = await db.certificate_templates.update_one(
        {"id": template_id},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {"message": "Template deleted successfully"}


# ==================== CERTIFICATE GENERATION ENDPOINTS (UPDATED) ====================

@api_router.post("/academic/generate-certificates")
async def generate_certificates(
    cert_request: CertificateGenerationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate in-house certificates for training candidates"""
    if current_user.get("role") not in ["Academic Head", "COO"]:
        raise HTTPException(status_code=403, detail="Access denied. Academic Head or COO only.")
    
    # Get work order details
    wo = await db.get_item('work_orders', {"id": cert_request.work_order_id}, {"_id": 0})
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    # Generate certificate numbers (ARB/YY/MM/###)
    now = datetime.now(timezone.utc)
    year = now.strftime("%y")
    month = now.strftime("%m")
    
    # Get the count of certificates issued this month
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_count = len(await db.scan_items('certificate_candidates', {
        "generated_at": {"$gte": month_start.isoformat()}
    }))
    
    generated_certificates = []
    
    for idx, candidate in enumerate(cert_request.candidates):
        cert_no = f"ARB/{year}/{month}/{str(month_count + idx + 1).zfill(3)}"
        
        # Generate unique verification code (NEW)
        verification_code = str(uuid.uuid4())[:12].upper()  # Short unique code
        verification_url = f"https://www.iceconnect.in/verify-certificate?code={verification_code}"
        
        certificate = CertificateCandidate(
            certificate_no=cert_no,
            candidate_name=candidate.get("name"),
            course_name=cert_request.course_name,
            trainer_name=cert_request.trainer_name,
            training_date=cert_request.training_date,
            completion_date=cert_request.completion_date,
            issue_date=now.strftime("%Y-%m-%d"),
            expiry_date=cert_request.expiry_date,
            work_order_id=cert_request.work_order_id,
            client_name=wo.get("client_name"),
            grade=candidate.get("grade"),
            remarks=candidate.get("remarks"),
            generated_by=current_user.get("id"),
            generated_by_name=current_user.get("name"),
            status="generated",
            # NEW FIELDS (backward compatible - optional)
            template_id=cert_request.template_id,
            verification_code=verification_code,
            verification_url=verification_url,
            candidate_email=candidate.get("email"),
            candidate_id=candidate.get("id")
        )
        
        cert_dict = certificate.model_dump()
        cert_dict['generated_at'] = cert_dict['generated_at'].isoformat()
        
        await db.put_item('certificate_candidates', cert_dict)
        generated_certificates.append(cert_dict)
        
        # Also create an entry in the certificates collection for dispatch tracking
        dispatch_cert = {
            "id": str(uuid.uuid4()),
            "work_order_id": cert_request.work_order_id,
            "certificate_no": cert_no,
            "candidate_name": candidate.get("name"),
            "course_name": cert_request.course_name,
            "client_name": wo.get("client_name"),
            "status": "approved",  # Ready for dispatch
            "approved_by": current_user.get("name"),
            "approved_at": now.isoformat(),
            "created_at": now.isoformat()
        }
        await db.put_item('certificates', dispatch_cert)
    
    return {
        "message": f"{len(generated_certificates)} certificates generated successfully",
        "certificates": generated_certificates
    }


@api_router.get("/academic/generated-certificates")
async def get_generated_certificates(
    work_order_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all generated certificates"""
    if current_user.get("role") not in ["Academic Head", "Dispatch Head", "COO"]:
        raise HTTPException(status_code=403, detail="Access denied.")
    
    query = {}
    if work_order_id:
        query["work_order_id"] = work_order_id
    
    certificates = await db.scan_items('certificate_candidates', query, {"_id": 0} if query, {"_id": 0} else {})
    return certificates


@api_router.get("/academic/certificate/{certificate_no}")
async def get_certificate_by_number(
    certificate_no: str,
    current_user: dict = Depends(get_current_user)
):
    """Get certificate details by certificate number"""
    certificate = await db.get_item('certificate_candidates', 
        {"certificate_no": certificate_no},
        {"_id": 0}
    )
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    return certificate


@api_router.get("/academic/work-orders-for-certificates")
async def get_work_orders_for_certificates(current_user: dict = Depends(get_current_user)):
    """Get completed work orders that can have certificates generated"""
    if current_user.get("role") not in ["Academic Head", "COO"]:
        raise HTTPException(status_code=403, detail="Access denied. Academic Head or COO only.")
    
    # Get work orders with status completed or approved
    work_orders = await db.scan_items('work_orders', 
        {"status": {"$in": ["completed", "approved"]}},
        {"_id": 0}
     if 
        {"status": {"$in": ["completed", "approved"]}},
        {"_id": 0}
     else {})
    
    return work_orders


@api_router.post("/academic/bulk-generate-certificates")
async def bulk_generate_certificates(
    bulk_request: BulkCertificateGenerationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Bulk generate certificates for multiple candidates (NEW - ADDITIVE)"""
    if current_user.get("role") not in ["Academic Head", "COO"]:
        raise HTTPException(status_code=403, detail="Access denied. Academic Head or COO only.")
    
    # Get work order details
    wo = await db.get_item('work_orders', {"id": bulk_request.work_order_id}, {"_id": 0})
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    # Generate certificate numbers
    now = datetime.now(timezone.utc)
    year = now.strftime("%y")
    month = now.strftime("%m")
    
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_count = len(await db.scan_items('certificate_candidates', {
        "generated_at": {"$gte": month_start.isoformat()}
    }))
    
    generated_certificates = []
    errors = []
    
    for idx, candidate in enumerate(bulk_request.candidates):
        try:
            cert_no = f"ARB/{year}/{month}/{str(month_count + idx + 1).zfill(3)}"
            
            # Generate unique verification code
            verification_code = str(uuid.uuid4())[:12].upper()
            verification_url = f"https://www.iceconnect.in/verify-certificate?code={verification_code}"
            
            certificate = CertificateCandidate(
                certificate_no=cert_no,
                candidate_name=candidate.get("candidate_name"),
                course_name=wo.get("course", ""),
                trainer_name=wo.get("trainer_name", ""),
                training_date=wo.get("training_date", ""),
                completion_date=wo.get("completion_date", now.strftime("%Y-%m-%d")),
                issue_date=now.strftime("%Y-%m-%d"),
                expiry_date=candidate.get("expiry_date"),
                work_order_id=bulk_request.work_order_id,
                client_name=wo.get("client_name"),
                grade=candidate.get("grade"),
                generated_by=current_user.get("id"),
                generated_by_name=current_user.get("name"),
                status="generated",
                template_id=bulk_request.template_id,
                verification_code=verification_code,
                verification_url=verification_url,
                candidate_email=candidate.get("candidate_email"),
                candidate_id=candidate.get("candidate_id")
            )
            
            cert_dict = certificate.model_dump()
            cert_dict['generated_at'] = cert_dict['generated_at'].isoformat()
            
            await db.put_item('certificate_candidates', cert_dict)
            generated_certificates.append(cert_dict)
            
            # Also create dispatch entry
            dispatch_cert = {
                "id": str(uuid.uuid4()),
                "work_order_id": bulk_request.work_order_id,
                "certificate_no": cert_no,
                "candidate_name": candidate.get("candidate_name"),
                "course_name": wo.get("course"),
                "client_name": wo.get("client_name"),
                "status": "approved",
                "approved_by": current_user.get("name"),
                "approved_at": now.isoformat(),
                "created_at": now.isoformat()
            }
            await db.put_item('certificates', dispatch_cert)
            
        except Exception as e:
            errors.append({
                "candidate": candidate.get("candidate_name"),
                "error": str(e)
            })
    
    return {
        "message": f"Bulk generation completed",
        "total_requested": len(bulk_request.candidates),
        "generated": len(generated_certificates),
        "errors": errors,
        "certificates": generated_certificates
    }


@api_router.get("/certificates/verify")
async def verify_certificate(code: str):
    """Public endpoint to verify certificate by code (NEW - ADDITIVE)"""
    certificate = await db.get_item('certificate_candidates', 
        {"verification_code": code},
        {"_id": 0, "certificate_no": 1, "candidate_name": 1, "course_name": 1, 
         "issue_date": 1, "status": 1, "client_name": 1, "expiry_date": 1}
    )
    
    if not certificate:
        return {
            "valid": False,
            "message": "Certificate not found or invalid verification code"
        }
    
    # Check if expired
    is_expired = False
    if certificate.get("expiry_date"):
        try:
            expiry = datetime.fromisoformat(certificate["expiry_date"])
            if expiry < datetime.now(timezone.utc):
                is_expired = True
        except:
            pass
    
    return {
        "valid": True,
        "expired": is_expired,
        "certificate": certificate
    }


# ==================== EXECUTIVE DASHBOARDS (COO & MD) - NEW ====================

@api_router.get("/executive/coo-dashboard")
async def get_coo_dashboard_data(current_user: dict = Depends(get_current_user)):
    """Get aggregated data for COO dashboard (READ-ONLY)"""
    if current_user.get("role") not in ["COO", "Management", "MD", "CEO"]:
        raise HTTPException(status_code=403, detail="Access denied. Executive access only.")
    
    try:
        # HRM Overview
        total_employees = len(await db.scan_items('employees', {} if {} else {}))
        today = datetime.now(timezone.utc).date().isoformat()
        present_today = len(await db.scan_items('attendance', {"date": today, "status": "present"} if {"date": today, "status": "present"} else {}))
        
        # Document expiry alerts (within 30 days)
        thirty_days_ahead = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        expiring_docs = len(await db.scan_items('employee_documents', {
            "expiry_date": {"$lte": thirty_days_ahead, "$gte": datetime.now(timezone.utc).isoformat()}
        }))
        
        # Sales Performance
        total_leads = len(await db.scan_items('leads', {} if {} else {}))
        converted_leads = len(await db.scan_items('leads', {"status": "converted"} if {"status": "converted"} else {}))
        active_quotations = len(await db.scan_items('quotations', {"status": {"$in": ["pending", "sent"]}} if {"status": {"$in": ["pending", "sent"]}} else {}))
        
        # Academic Operations
        active_trainers = len(await db.scan_items('employees', {
            "department": "Academic",
            "designation": {"$in": ["TRAINER_FULLTIME", "TRAINER_PARTTIME"]}
        } if {
            "department": "Academic",
            "designation": {"$in": ["TRAINER_FULLTIME", "TRAINER_PARTTIME"]}
        } else {}))
        total_work_orders = len(await db.scan_items('work_orders', {} if {} else {}))
        completed_sessions = len(await db.scan_items('work_orders', {"status": "completed"} if {"status": "completed"} else {}))
        certificates_generated = len(await db.scan_items('certificate_candidates', {} if {} else {}))
        
        # Dispatch Status
        pending_dispatch = len(await db.scan_items('delivery_tasks', {"status": "PENDING"} if {"status": "PENDING"} else {}))
        out_for_delivery = len(await db.scan_items('delivery_tasks', {"status": "OUT_FOR_DELIVERY"} if {"status": "OUT_FOR_DELIVERY"} else {}))
        delivered_today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        delivered_today = len(await db.scan_items('delivery_tasks', {
            "status": "DELIVERED",
            "delivered_at": {"$gte": delivered_today_start.isoformat()}
        }))
        
        # Accounts snapshot (mock data - extend based on actual schema)
        # This can be extended when invoice/payment modules are built
        
        return {
            "hrm": {
                "total_employees": total_employees,
                "present_today": present_today,
                "attendance_rate": round((present_today / total_employees * 100) if total_employees > 0 else 0, 1),
                "expiring_documents": expiring_docs
            },
            "sales": {
                "total_leads": total_leads,
                "converted_leads": converted_leads,
                "conversion_rate": round((converted_leads / total_leads * 100) if total_leads > 0 else 0, 1),
                "active_quotations": active_quotations
            },
            "academic": {
                "active_trainers": active_trainers,
                "total_work_orders": total_work_orders,
                "completed_sessions": completed_sessions,
                "certificates_generated": certificates_generated
            },
            "dispatch": {
                "pending_dispatch": pending_dispatch,
                "out_for_delivery": out_for_delivery,
                "delivered_today": delivered_today
            },
            "accounts": {
                "total_invoices": 0,  # Placeholder
                "pending_payments": 0,  # Placeholder
                "revenue_this_month": 0  # Placeholder
            }
        }
    except Exception as e:
        logger.error(f"Error fetching COO dashboard data: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard data")


@api_router.get("/executive/md-dashboard")
async def get_md_dashboard_data(current_user: dict = Depends(get_current_user)):
    """Get aggregated executive intelligence data for MD dashboard (READ-ONLY)"""
    if current_user.get("role") not in ["MD", "CEO", "Management"]:
        raise HTTPException(status_code=403, detail="Access denied. MD/CEO access only.")
    
    try:
        # Corporate Health Score (calculated based on multiple factors)
        total_employees = len(await db.scan_items('employees', {} if {} else {}))
        today = datetime.now(timezone.utc).date().isoformat()
        present_today = len(await db.scan_items('attendance', {"date": today, "status": "present"} if {"date": today, "status": "present"} else {}))
        attendance_score = (present_today / total_employees * 100) if total_employees > 0 else 0
        
        total_leads = len(await db.scan_items('leads', {} if {} else {}))
        converted_leads = len(await db.scan_items('leads', {"status": "converted"} if {"status": "converted"} else {}))
        sales_score = (converted_leads / total_leads * 100) if total_leads > 0 else 0
        
        delivered = len(await db.scan_items('delivery_tasks', {"status": "DELIVERED"} if {"status": "DELIVERED"} else {}))
        total_tasks = len(await db.scan_items('delivery_tasks', {} if {} else {}))
        dispatch_score = (delivered / total_tasks * 100) if total_tasks > 0 else 0
        
        corporate_health = round((attendance_score + sales_score + dispatch_score) / 3, 1)
        
        # Executive Analytics
        total_work_orders = len(await db.scan_items('work_orders', {} if {} else {}))
        completed_work_orders = len(await db.scan_items('work_orders', {"status": "completed"} if {"status": "completed"} else {}))
        
        # Workforce Intelligence
        departments = await db.employees.distinct("department")
        dept_counts = {}
        for dept in departments:
            count = len(await db.scan_items('employees', {"department": dept} if {"department": dept} else {}))
            dept_counts[dept] = count
        
        # Sales Intelligence
        high_value_leads = len(await db.scan_items('leads', {} if {} else {}))  # Can filter by value threshold
        lost_deals = len(await db.scan_items('leads', {"status": "lost"} if {"status": "lost"} else {}))
        
        # Academic Excellence
        certificates_generated = len(await db.scan_items('certificate_candidates', {} if {} else {}))
        active_trainers = len(await db.scan_items('employees', {
            "department": "Academic",
            "designation": {"$in": ["TRAINER_FULLTIME", "TRAINER_PARTTIME"]}
        } if {
            "department": "Academic",
            "designation": {"$in": ["TRAINER_FULLTIME", "TRAINER_PARTTIME"]}
        } else {}))
        
        # Executive Alerts (critical items)
        pending_dispatch = len(await db.scan_items('delivery_tasks', {"status": "PENDING"}))
        thirty_days_ahead = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        expiring_docs = len(await db.scan_items('employee_documents', {
            "expiry_date": {"$lte": thirty_days_ahead, "$gte": datetime.now(timezone.utc).isoformat()}
        }))
        
        # AI-powered insights (rule-based for now, can be enhanced with ML)
        insights = []
        if sales_score < 30:
            insights.append("⚠️ Low sales conversion rate detected. Consider reviewing sales strategy.")
        if pending_dispatch > 10:
            insights.append("🚨 High pending dispatches. Allocate more dispatch resources.")
        if expiring_docs > 5:
            insights.append("⏰ Multiple documents expiring soon. Initiate renewal process.")
        if attendance_score < 80:
            insights.append("👥 Low attendance rate. Review team engagement.")
        if not insights:
            insights.append("✅ All systems operating normally.")
        
        return {
            "corporate_health": {
                "score": corporate_health,
                "rating": "Excellent" if corporate_health >= 80 else "Good" if corporate_health >= 60 else "Needs Attention",
                "attendance_score": round(attendance_score, 1),
                "sales_score": round(sales_score, 1),
                "operations_score": round(dispatch_score, 1)
            },
            "executive_analytics": {
                "total_employees": total_employees,
                "total_work_orders": total_work_orders,
                "completion_rate": round((completed_work_orders / total_work_orders * 100) if total_work_orders > 0 else 0, 1),
                "revenue_growth": 0  # Placeholder
            },
            "workforce": {
                "total": total_employees,
                "by_department": dept_counts,
                "active_trainers": active_trainers
            },
            "sales": {
                "total_leads": total_leads,
                "converted": converted_leads,
                "lost": lost_deals,
                "conversion_rate": round(sales_score, 1)
            },
            "academic": {
                "certificates_issued": certificates_generated,
                "active_trainers": active_trainers,
                "completed_sessions": completed_work_orders
            },
            "alerts": {
                "pending_dispatch": pending_dispatch,
                "expiring_documents": expiring_docs,
                "total_critical": pending_dispatch + expiring_docs
            },
            "ai_insights": insights
        }
    except Exception as e:
        logger.error(f"Error fetching MD dashboard data: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard data")


# ==================== DISPATCH & DELIVERY MODULE ====================

# Pydantic Models for Dispatch
class DeliveryTask(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    certificate_id: str
    work_order_id: Optional[str] = None
    client_name: str
    client_branch: str  # Dubai, Abu Dhabi, Saudi Arabia
    delivery_address: Optional[str] = None
    contact_person: Optional[str] = None
    contact_mobile: Optional[str] = None
    assigned_to_employee_id: Optional[str] = None
    assigned_to_employee_name: Optional[str] = None
    status: str = "PENDING"  # PENDING, PICKUP_READY, OUT_FOR_DELIVERY, DELIVERED, FAILED, RETURNED
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    due_date: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    proof_url: Optional[str] = None
    remarks: Optional[str] = None


class DeliveryTaskCreate(BaseModel):
    certificate_ids: List[str]
    assigned_to_employee_id: str
    assigned_to_employee_name: str
    due_date: Optional[str] = None
    remarks: Optional[str] = None


class DeliveryTaskUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to_employee_id: Optional[str] = None
    assigned_to_employee_name: Optional[str] = None
    delivered_at: Optional[str] = None
    proof_url: Optional[str] = None
    remarks: Optional[str] = None


# Dispatch Endpoints

@api_router.get("/dispatch/certificates-ready")
async def get_certificates_ready_for_dispatch(
    branch: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get certificates that are ready for dispatch (approved by Academic Head)"""
    if current_user.get("role") != "Dispatch Head":
        raise HTTPException(status_code=403, detail="Access denied. Dispatch Head only.")
    
    # Find certificates with status "approved" that haven't been assigned to delivery yet
    query = {"status": "approved"}
    
    certificates = await db.scan_items('certificates', query, {"_id": 0} if query, {"_id": 0} else {})
    
    # Filter out certificates that already have delivery tasks
    result = []
    for cert in certificates:
        # Check if delivery task exists
        existing_task = await db.get_item('delivery_tasks', {"certificate_id": cert.get("id")})
        if not existing_task:
            # Get work order details if available
            if cert.get("work_order_id"):
                wo = await db.get_item('work_orders', {"id": cert.get("work_order_id")}, {"_id": 0})
                if wo:
                    cert["client_name"] = wo.get("client_name", "N/A")
                    cert["client_branch"] = wo.get("branch", "N/A")
                    cert["wo_ref_no"] = wo.get("wo_ref_no", "N/A")
                    cert["course_name"] = wo.get("course", "N/A")
            
            # Apply filters
            if branch and branch != "All":
                if cert.get("client_branch") != branch:
                    continue
            
            if search:
                search_lower = search.lower()
                if not (
                    search_lower in cert.get("client_name", "").lower() or
                    search_lower in cert.get("wo_ref_no", "").lower()
                ):
                    continue
            
            result.append(cert)
    
    return result


@api_router.post("/dispatch/tasks")
async def create_delivery_tasks(
    task_data: DeliveryTaskCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create delivery tasks by assigning certificates to dispatch assistant"""
    if current_user.get("role") != "Dispatch Head":
        raise HTTPException(status_code=403, detail="Access denied. Dispatch Head only.")
    
    created_tasks = []
    
    for cert_id in task_data.certificate_ids:
        # Get certificate details
        certificate = await db.get_item('certificates', {"id": cert_id}, {"_id": 0})
        if not certificate:
            continue
        
        # Get work order details
        client_name = "N/A"
        client_branch = "N/A"
        work_order_id = None
        
        if certificate.get("work_order_id"):
            wo = await db.get_item('work_orders', {"id": certificate.get("work_order_id")}, {"_id": 0})
            if wo:
                client_name = wo.get("client_name", "N/A")
                client_branch = wo.get("branch", "N/A")
                work_order_id = wo.get("id")
        
        # Create delivery task
        task = DeliveryTask(
            certificate_id=cert_id,
            work_order_id=work_order_id,
            client_name=client_name,
            client_branch=client_branch,
            assigned_to_employee_id=task_data.assigned_to_employee_id,
            assigned_to_employee_name=task_data.assigned_to_employee_name,
            status="PENDING",
            due_date=datetime.fromisoformat(task_data.due_date) if task_data.due_date else None,
            remarks=task_data.remarks
        )
        
        task_dict = task.model_dump()
        task_dict['created_at'] = task_dict['created_at'].isoformat()
        task_dict['updated_at'] = task_dict['updated_at'].isoformat()
        if task_dict.get('due_date'):
            task_dict['due_date'] = task_dict['due_date'].isoformat()
        
        await db.put_item('delivery_tasks', task_dict)
        created_tasks.append(task)
        
        # Update certificate status to indicate it's been assigned for delivery
        await db.certificates.update_one(
            {"id": cert_id},
            {"$set": {"dispatch_status": "ASSIGNED"}}
        )
    
    return {"message": f"{len(created_tasks)} delivery tasks created", "tasks": created_tasks}


@api_router.get("/dispatch/tasks")
async def get_all_delivery_tasks(
    status: Optional[str] = None,
    branch: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all delivery tasks (Dispatch Head view)"""
    if current_user.get("role") != "Dispatch Head":
        raise HTTPException(status_code=403, detail="Access denied. Dispatch Head only.")
    
    query = {}
    if status:
        query["status"] = status
    if branch and branch != "All":
        query["client_branch"] = branch
    
    tasks = await db.scan_items('delivery_tasks', query, {"_id": 0} if query, {"_id": 0} else {})
    
    # Convert datetime strings back for frontend
    for task in tasks:
        if isinstance(task.get('created_at'), str):
            task['created_at'] = task['created_at']
        if isinstance(task.get('due_date'), str):
            task['due_date'] = task['due_date']
    
    return tasks


@api_router.put("/dispatch/tasks/{task_id}")
async def update_delivery_task(
    task_id: str,
    task_update: DeliveryTaskUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update delivery task (Dispatch Head can reassign, update status, etc.)"""
    if current_user.get("role") != "Dispatch Head":
        raise HTTPException(status_code=403, detail="Access denied. Dispatch Head only.")
    
    update_data = {k: v for k, v in task_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.delivery_tasks.update_one(
        {"id": task_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Delivery task not found")
    
    return {"message": "Delivery task updated successfully"}


@api_router.get("/dispatch/summary")
async def get_dispatch_summary(current_user: dict = Depends(get_current_user)):
    """Get summary statistics for Dispatch Head dashboard"""
    if current_user.get("role") != "Dispatch Head":
        raise HTTPException(status_code=403, detail="Access denied. Dispatch Head only.")
    
    # Count by status
    pending = len(await db.scan_items('delivery_tasks', {"status": "PENDING"} if {"status": "PENDING"} else {}))
    out_for_delivery = len(await db.scan_items('delivery_tasks', {"status": "OUT_FOR_DELIVERY"} if {"status": "OUT_FOR_DELIVERY"} else {}))
    
    # Delivered today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    delivered_today = len(await db.scan_items('delivery_tasks', {
        "status": "DELIVERED",
        "delivered_at": {"$gte": today_start.isoformat()}
    }))
    
    # Overdue (tasks with due_date in the past and not delivered)
    now = datetime.now(timezone.utc).isoformat()
    overdue = len(await db.scan_items('delivery_tasks', {
        "status": {"$nin": ["DELIVERED", "FAILED", "RETURNED"]},
        "due_date": {"$lt": now, "$ne": None}
    } if {
        "status": {"$nin": ["DELIVERED", "FAILED", "RETURNED"]},
        "due_date": {"$lt": now, "$ne": None}
    } else {}))
    
    # Certificates ready for dispatch
    certificates_ready = len(await db.scan_items('certificates', {"status": "approved"} if {"status": "approved"} else {}))
    existing_tasks_count = len(await db.scan_items('delivery_tasks', {} if {} else {}))
    ready_for_assignment = max(0, certificates_ready - existing_tasks_count)
    
    return {
        "pending_dispatch": pending,
        "out_for_delivery": out_for_delivery,
        "delivered_today": delivered_today,
        "overdue": overdue,
        "ready_for_assignment": ready_for_assignment
    }


@api_router.get("/dispatch/my-tasks")
async def get_my_delivery_tasks(current_user: dict = Depends(get_current_user)):
    """Get delivery tasks assigned to the logged-in dispatch assistant"""
    if current_user.get("role") != "Dispatch Assistant":
        raise HTTPException(status_code=403, detail="Access denied. Dispatch Assistant only.")
    
    # Find employee record to get employee_id
    user_mobile = current_user.get("mobile")
    employee = await db.get_item('employees', {"mobile": user_mobile}, {"_id": 0})
    
    if not employee:
        return []
    
    employee_id = employee.get("id")
    
    tasks = await db.scan_items('delivery_tasks', 
        {"assigned_to_employee_id": employee_id},
        {"_id": 0}
     if 
        {"assigned_to_employee_id": employee_id},
        {"_id": 0}
     else {})
    
    return tasks


@api_router.put("/dispatch/my-tasks/{task_id}")
async def update_my_delivery_task(
    task_id: str,
    task_update: DeliveryTaskUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update own delivery task (Dispatch Assistant)"""
    if current_user.get("role") != "Dispatch Assistant":
        raise HTTPException(status_code=403, detail="Access denied. Dispatch Assistant only.")
    
    # Find employee record
    user_mobile = current_user.get("mobile")
    employee = await db.get_item('employees', {"mobile": user_mobile}, {"_id": 0})
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee record not found")
    
    employee_id = employee.get("id")
    
    # Verify task belongs to this assistant
    task = await db.get_item('delivery_tasks', {"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Delivery task not found")
    
    if task.get("assigned_to_employee_id") != employee_id:
        raise HTTPException(status_code=403, detail="You can only update your own tasks")
    
    # Prepare update
    update_data = {k: v for k, v in task_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # If status is DELIVERED, update certificate status
    if task_update.status == "DELIVERED":
        if not update_data.get("delivered_at"):
            update_data["delivered_at"] = datetime.now(timezone.utc).isoformat()
        
        # Update certificate status
        await db.certificates.update_one(
            {"id": task.get("certificate_id")},
            {"$set": {"status": "delivered", "delivered_at": update_data["delivered_at"]}}
        )
        
        # Mark work order as completed if exists
        if task.get("work_order_id"):
            await db.work_orders.update_one(
                {"id": task.get("work_order_id")},
                {"$set": {"status": "completed", "completed_at": update_data["delivered_at"]}}
            )
    
    # Update delivery task
    result = await db.delivery_tasks.update_one(
        {"id": task_id},
        {"$set": update_data}
    )
    
    return {"message": "Delivery task updated successfully"}



# ==================== ACCOUNTS MODULE ENDPOINTS ====================

@api_router.get("/accounts/invoice-requests")
async def get_all_invoice_requests(current_user: dict = Depends(get_current_user)):
    """Get all invoice requests from sales team for Accounts dashboard"""
    if current_user.get("role") not in ["Accounts Head", "Accountant", "COO", "MD", "CEO"]:
        raise HTTPException(status_code=403, detail="Access denied. Accounts team access only.")
    
    try:
        requests = await db.invoice_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
        return requests
    except Exception as e:
        logger.error(f"Error fetching invoice requests: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch invoice requests")


@api_router.get("/accounts/invoices")
async def get_all_invoices(current_user: dict = Depends(get_current_user)):
    """Get all invoices for Accounts dashboard"""
    if current_user.get("role") not in ["Accounts Head", "Accountant", "COO", "MD", "CEO"]:
        raise HTTPException(status_code=403, detail="Access denied. Accounts team access only.")
    
    try:
        invoices = await db.invoices.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
        return invoices
    except Exception as e:
        logger.error(f"Error fetching invoices: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch invoices")


@api_router.post("/accounts/invoices")
async def create_invoice(invoice_data: dict, current_user: dict = Depends(get_current_user)):
    """Create a new invoice"""
    if current_user.get("role") not in ["Accounts Head", "Accountant"]:
        raise HTTPException(status_code=403, detail="Access denied. Accounts team access only.")
    
    try:
        invoice = {
            "id": str(uuid.uuid4()),
            "client_name": invoice_data["client_name"],
            "invoice_number": invoice_data["invoice_number"],
            "amount": float(invoice_data["amount"]),
            "description": invoice_data.get("description", ""),
            "due_date": invoice_data.get("due_date"),
            "status": "Pending",
            "created_by": current_user["id"],
            "created_by_name": current_user["name"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.put_item('invoices', invoice)
        return {"message": "Invoice created successfully", "invoice_id": invoice["id"]}
    except Exception as e:
        logger.error(f"Error creating invoice: {e}")
        raise HTTPException(status_code=500, detail="Failed to create invoice")


@api_router.get("/accounts/payments")
async def get_all_payments(current_user: dict = Depends(get_current_user)):
    """Get all payment records for Accounts dashboard"""
    if current_user.get("role") not in ["Accounts Head", "Accountant", "COO", "MD", "CEO"]:
        raise HTTPException(status_code=403, detail="Access denied. Accounts team access only.")
    
    try:
        payments = await db.payments.find({}, {"_id": 0}).sort("payment_date", -1).to_list(1000)
        return payments
    except Exception as e:
        logger.error(f"Error fetching payments: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch payments")


@api_router.post("/accounts/payments")
async def record_payment(payment_data: dict, current_user: dict = Depends(get_current_user)):
    """Record a payment received from client"""
    if current_user.get("role") not in ["Accounts Head", "Accountant"]:
        raise HTTPException(status_code=403, detail="Access denied. Accounts team access only.")
    
    try:
        invoice_id = payment_data["invoice_id"]
        payment_amount = float(payment_data["amount"])
        
        # Get the invoice
        invoice = await db.get_item('invoices', {"id": invoice_id}, {"_id": 0})
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Create payment record
        payment = {
            "id": str(uuid.uuid4()),
            "invoice_id": invoice_id,
            "amount": payment_amount,
            "payment_method": payment_data.get("payment_method", "Bank Transfer"),
            "reference_number": payment_data.get("reference_number", ""),
            "notes": payment_data.get("notes", ""),
            "recorded_by": current_user["id"],
            "recorded_by_name": current_user["name"],
            "payment_date": datetime.now(timezone.utc).isoformat()
        }
        
        await db.put_item('payments', payment)
        
        # Update invoice status
        invoice_total = float(invoice.get("amount", 0))
        total_paid = payment_amount
        
        # Calculate total payments for this invoice
        existing_payments = await db.scan_items('payments', {"invoice_id": invoice_id}, {"_id": 0} if {"invoice_id": invoice_id}, {"_id": 0} else {})
        total_paid = sum(float(p.get("amount", 0)) for p in existing_payments)
        
        if total_paid >= invoice_total:
            new_status = "Paid"
        elif total_paid > 0:
            new_status = "Partially Paid"
        else:
            new_status = "Pending"
        
        await db.invoices.update_one(
            {"id": invoice_id},
            {"$set": {"status": new_status}}
        )
        
        return {"message": "Payment recorded successfully", "payment_id": payment["id"]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recording payment: {e}")
        raise HTTPException(status_code=500, detail="Failed to record payment")



# ==================== ASSESSMENT & FEEDBACK ENDPOINTS ====================

@api_router.post("/assessment/forms")
async def create_assessment_form(form_data: AssessmentFormCreate, current_user: dict = Depends(get_current_user)):
    """Create a new assessment form (Academic Head only)"""
    if current_user.get("role") not in ["Academic Head", "COO", "MD"]:
        raise HTTPException(status_code=403, detail="Access denied. Academic Head access only.")
    
    try:
        # Create form with QR code URL
        form = AssessmentForm(
            **form_data.model_dump(),
            created_by=current_user["id"],
            created_by_name=current_user["name"],
            created_by_role=current_user["role"]
        )
        
        # Generate QR code URL (public assessment link)
        form.qr_code_url = f"/public/assessment/{form.id}"
        
        form_dict = form.model_dump()
        form_dict['created_at'] = form_dict['created_at'].isoformat()
        form_dict['updated_at'] = form_dict['updated_at'].isoformat()
        
        await db.put_item('assessment_forms', form_dict)
        
        return {
            "message": "Assessment form created successfully",
            "form_id": form.id,
            "qr_code_url": form.qr_code_url
        }
    except Exception as e:
        logger.error(f"Error creating assessment form: {e}")
        raise HTTPException(status_code=500, detail="Failed to create assessment form")


@api_router.get("/assessment/forms")
async def get_assessment_forms(current_user: dict = Depends(get_current_user)):
    """Get assessment forms - Academic Head sees all, Trainers see only their own"""
    if current_user.get("role") not in ["Academic Head", "Trainer", "COO", "MD"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Academic Head and COO/MD see all forms
        if current_user.get("role") in ["Academic Head", "COO", "MD"]:
            forms = await db.assessment_forms.find(
                {"status": "active"},
                {"_id": 0}
            ).sort("created_at", -1).to_list(1000)
        else:
            # Trainers see only their assigned forms
            forms = await db.assessment_forms.find(
                {"trainer_id": current_user["employee_id"], "status": "active"},
                {"_id": 0}
            ).sort("created_at", -1).to_list(1000)
        
        return forms
    except Exception as e:
        logger.error(f"Error fetching assessment forms: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch assessment forms")


@api_router.get("/assessment/forms/{form_id}")
async def get_assessment_form(form_id: str):
    """Get single assessment form by ID (public endpoint for form display)"""
    try:
        form = await db.get_item('assessment_forms', {"id": form_id}, {"_id": 0})
        if not form:
            raise HTTPException(status_code=404, detail="Assessment form not found")
        
        return form
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching assessment form: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch assessment form")


@api_router.post("/assessment/submit")
async def submit_assessment(submission_data: AssessmentSubmissionCreate):
    """Public endpoint for submitting assessment (no authentication required)"""
    try:
        # Get form details
        form = await db.get_item('assessment_forms', {"id": submission_data.form_id}, {"_id": 0})
        if not form:
            raise HTTPException(status_code=404, detail="Assessment form not found")
        
        if form.get("status") != "active":
            raise HTTPException(status_code=400, detail="This assessment form is no longer active")
        
        # Create submission
        submission = AssessmentSubmission(
            form_id=submission_data.form_id,
            form_title=form.get("title", ""),
            responses=submission_data.responses,
            work_order_id=form.get("work_order_id"),
            course_name=form.get("course_name"),
            batch_name=form.get("batch_name"),
            trainer_id=form.get("trainer_id"),
            trainer_name=form.get("trainer_name"),
            session_date=form.get("session_date"),
            branch=form.get("branch"),
            student_name=submission_data.student_name,
            student_contact=submission_data.student_contact
        )
        
        submission_dict = submission.model_dump()
        submission_dict['submitted_at'] = submission_dict['submitted_at'].isoformat()
        
        await db.put_item('assessment_submissions', submission_dict)
        
        return {
            "message": "Assessment submitted successfully",
            "submission_id": submission.id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting assessment: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit assessment")


@api_router.get("/assessment/reports")
async def get_assessment_reports(
    current_user: dict = Depends(get_current_user),
    form_id: Optional[str] = None,
    trainer_id: Optional[str] = None,
    branch: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get assessment reports with filters (Academic Head only)"""
    if current_user.get("role") not in ["Academic Head", "COO", "MD"]:
        raise HTTPException(status_code=403, detail="Access denied. Academic Head access only.")
    
    try:
        # Build query filters
        query = {}
        
        if form_id:
            query["form_id"] = form_id
        if trainer_id:
            query["trainer_id"] = trainer_id
        if branch:
            query["branch"] = branch
        if start_date and end_date:
            query["submitted_at"] = {
                "$gte": start_date,
                "$lte": end_date
            }
        
        # Get submissions
        submissions = await db.assessment_submissions.find(query, {"_id": 0}).sort("submitted_at", -1).to_list(10000)
        
        # Calculate analytics
        total_responses = len(submissions)
        
        # Group by form
        forms_summary = {}
        for sub in submissions:
            form_id = sub.get("form_id")
            if form_id not in forms_summary:
                forms_summary[form_id] = {
                    "form_id": form_id,
                    "form_title": sub.get("form_title"),
                    "response_count": 0,
                    "trainer_name": sub.get("trainer_name"),
                    "course_name": sub.get("course_name"),
                    "batch_name": sub.get("batch_name"),
                    "responses": []
                }
            forms_summary[form_id]["response_count"] += 1
            forms_summary[form_id]["responses"].append(sub)
        
        # Calculate average ratings for rating questions
        for form_id, form_data in forms_summary.items():
            rating_totals = {}
            rating_counts = {}
            
            for submission in form_data["responses"]:
                for response in submission.get("responses", []):
                    if response.get("question_type") == "rating":
                        q_id = response.get("question_id")
                        answer = response.get("answer")
                        
                        if q_id not in rating_totals:
                            rating_totals[q_id] = 0
                            rating_counts[q_id] = 0
                        
                        try:
                            rating_totals[q_id] += float(answer)
                            rating_counts[q_id] += 1
                        except:
                            pass
            
            # Calculate averages
            form_data["average_ratings"] = {}
            for q_id in rating_totals:
                if rating_counts[q_id] > 0:
                    form_data["average_ratings"][q_id] = round(rating_totals[q_id] / rating_counts[q_id], 2)
        
        return {
            "total_responses": total_responses,
            "forms_summary": list(forms_summary.values()),
            "all_submissions": submissions
        }
    except Exception as e:
        logger.error(f"Error fetching assessment reports: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch assessment reports")


@api_router.get("/assessment/reports/export")
async def export_assessment_reports(
    current_user: dict = Depends(get_current_user),
    form_id: Optional[str] = None,
    trainer_id: Optional[str] = None
):
    """Export assessment reports to CSV (Academic Head only)"""
    if current_user.get("role") not in ["Academic Head", "COO", "MD"]:
        raise HTTPException(status_code=403, detail="Access denied. Academic Head access only.")
    
    try:
        # Build query
        query = {}
        if form_id:
            query["form_id"] = form_id
        if trainer_id:
            query["trainer_id"] = trainer_id
        
        submissions = await db.assessment_submissions.find(query, {"_id": 0}).sort("submitted_at", -1).to_list(10000)
        
        # Prepare CSV data
        csv_data = []
        for sub in submissions:
            row = {
                "Submission ID": sub.get("id"),
                "Form Title": sub.get("form_title"),
                "Submitted At": sub.get("submitted_at"),
                "Student Name": sub.get("student_name", "Anonymous"),
                "Student Contact": sub.get("student_contact", "N/A"),
                "Course": sub.get("course_name", "N/A"),
                "Batch": sub.get("batch_name", "N/A"),
                "Trainer": sub.get("trainer_name", "N/A"),
                "Branch": sub.get("branch", "N/A")
            }
            
            # Add responses
            for i, response in enumerate(sub.get("responses", []), 1):
                row[f"Q{i}: {response.get('question_text', '')}"] = response.get("answer", "")
            
            csv_data.append(row)
        
        return {
            "data": csv_data,
            "total_records": len(csv_data)
        }
    except Exception as e:
        logger.error(f"Error exporting assessment reports: {e}")
        raise HTTPException(status_code=500, detail="Failed to export reports")


@api_router.put("/assessment/forms/{form_id}")
async def update_assessment_form(form_id: str, update_data: dict, current_user: dict = Depends(get_current_user)):
    """Update assessment form (Academic Head only)"""
    if current_user.get("role") not in ["Academic Head", "COO", "MD"]:
        raise HTTPException(status_code=403, detail="Access denied. Academic Head access only.")
    
    try:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        result = await db.assessment_forms.update_one(
            {"id": form_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Assessment form not found")
        
        return {"message": "Assessment form updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating assessment form: {e}")
        raise HTTPException(status_code=500, detail="Failed to update assessment form")


@api_router.delete("/assessment/forms/{form_id}")
async def archive_assessment_form(form_id: str, current_user: dict = Depends(get_current_user)):
    """Archive assessment form (soft delete - Academic Head only)"""
    if current_user.get("role") not in ["Academic Head", "COO", "MD"]:
        raise HTTPException(status_code=403, detail="Access denied. Academic Head access only.")
    
    try:
        result = await db.assessment_forms.update_one(
            {"id": form_id},
            {"$set": {"status": "archived", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Assessment form not found")
        
        return {"message": "Assessment form archived successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error archiving assessment form: {e}")
        raise HTTPException(status_code=500, detail="Failed to archive assessment form")




# ==================== EXPENSE REIMBURSEMENT ENDPOINTS ====================

def get_department_head_id(department: str, db_instance):
    """Helper function to get department head ID based on department"""
    dept_head_mapping = {
        "Sales": "SALES_HEAD",
        "Academic": "ACADEMIC_HEAD",
        "HR": "HR_MANAGER",
        "Accounts": "ACCOUNTS_HEAD",
        "Dispatch": "DISPATCH_HEAD"
    }
    
    designation = dept_head_mapping.get(department)
    if not designation:
        return None, None
    
    # Find employee with this designation
    import asyncio
    loop = asyncio.get_event_loop()
    dept_head = loop.run_until_complete(
        db_instance.employees.find_one({"designation": designation}, {"_id": 0})
    )
    
    if dept_head:
        return dept_head.get("id"), dept_head.get("name")
    return None, None


@api_router.post("/expenses/my-claims")
async def create_expense_claim(claim_data: ExpenseClaimCreate, current_user: dict = Depends(get_current_user)):
    """Employee submits new expense claim"""
    try:
        # Get employee details - try by employee_id first, then by mobile
        employee = None
        if current_user.get("employee_id"):
            employee = await db.get_item('employees', {"id": current_user.get("employee_id")}, {"_id": 0})
        
        if not employee:
            # Try finding by mobile number
            user = await db.get_item('users', {"id": current_user["id"]}, {"_id": 0})
            if user and user.get("mobile"):
                employee = await db.get_item('employees', {"mobile": user["mobile"]}, {"_id": 0})
        
        if not employee:
            raise HTTPException(status_code=404, detail="Employee record not found. Please contact HR.")
        
        department = employee.get("department", "General")
        branch = employee.get("branch", "Dubai")
        
        # Determine department head
        is_dept_head = employee.get("designation") in [
            "SALES_HEAD", "ACADEMIC_HEAD", "HR_MANAGER", "ACCOUNTS_HEAD", "DISPATCH_HEAD"
        ]
        
        # Create claim
        claim = ExpenseClaim(
            employee_id=current_user["id"],
            employee_name=current_user["name"],
            mobile=employee.get("mobile", ""),
            department=department,
            branch=branch,
            amount=claim_data.amount,
            category=claim_data.category,
            description=claim_data.description,
            expense_date=claim_data.expense_date,
            attachment_url=claim_data.attachment_url,
            status="PENDING_HR" if is_dept_head else "PENDING_DEPT_HEAD"
        )
        
        # If not a dept head, find and assign dept head
        if not is_dept_head:
            dept_head = await db.get_item('employees', 
                {"department": department, "designation": {"$in": ["SALES_HEAD", "ACADEMIC_HEAD", "HR_MANAGER", "ACCOUNTS_HEAD", "DISPATCH_HEAD"]}},
                {"_id": 0}
            )
            if dept_head:
                claim.dept_head_id = dept_head.get("id")
                claim.dept_head_name = dept_head.get("name")
        
        claim_dict = claim.model_dump()
        claim_dict['created_at'] = claim_dict['created_at'].isoformat()
        claim_dict['updated_at'] = claim_dict['updated_at'].isoformat()
        
        await db.put_item('expense_claims', claim_dict)
        
        return {"message": "Expense claim submitted successfully", "claim_id": claim.id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating expense claim: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit expense claim")


@api_router.get("/expenses/my-claims")
async def get_my_expense_claims(current_user: dict = Depends(get_current_user)):
    """Get employee's own expense claims"""
    try:
        claims = await db.expense_claims.find(
            {"employee_id": current_user["id"]},
            {"_id": 0}
        ).sort("created_at", -1).to_list(1000)
        
        return claims
    except Exception as e:
        logger.error(f"Error fetching expense claims: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch expense claims")


@api_router.get("/expenses/for-approval")
async def get_expenses_for_approval(current_user: dict = Depends(get_current_user)):
    """Get expense claims pending department head approval"""
    allowed_roles = ["Sales Head", "Academic Head", "HR", "Accounts Head", "Dispatch Head", "COO", "MD"]
    
    if current_user.get("role") not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied. Department head access only.")
    
    try:
        # For COO/MD, show all pending dept head claims
        if current_user.get("role") in ["COO", "MD"]:
            query = {"status": "PENDING_DEPT_HEAD"}
        else:
            # For dept heads, show only their department's claims
            query = {
                "status": "PENDING_DEPT_HEAD",
                "dept_head_id": current_user.get("employee_id")
            }
        
        claims = await db.expense_claims.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
        
        return claims
    except Exception as e:
        logger.error(f"Error fetching expenses for approval: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch expenses")


@api_router.put("/expenses/for-approval/{claim_id}")
async def approve_reject_expense(claim_id: str, status_update: ExpenseClaimUpdateStatus, current_user: dict = Depends(get_current_user)):
    """Department head approves or rejects expense claim"""
    allowed_roles = ["Sales Head", "Academic Head", "HR", "Accounts Head", "Dispatch Head", "COO", "MD"]
    
    if current_user.get("role") not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied. Department head access only.")
    
    try:
        claim = await db.get_item('expense_claims', {"id": claim_id}, {"_id": 0})
        
        if not claim:
            raise HTTPException(status_code=404, detail="Expense claim not found")
        
        if claim.get("status") != "PENDING_DEPT_HEAD":
            raise HTTPException(status_code=400, detail="Claim is not pending department head approval")
        
        # Update status
        update_data = {
            "dept_head_id": current_user.get("employee_id"),
            "dept_head_name": current_user["name"],
            "dept_head_decision": status_update.decision,
            "dept_head_remarks": status_update.remarks,
            "dept_head_reviewed_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if status_update.decision == "reject":
            update_data["status"] = "REJECTED"
        elif status_update.decision == "approve":
            update_data["status"] = "PENDING_HR"
        
        await db.expense_claims.update_one(
            {"id": claim_id},
            {"$set": update_data}
        )
        
        return {"message": f"Expense claim {status_update.decision}d successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating expense claim: {e}")
        raise HTTPException(status_code=500, detail="Failed to update expense claim")


@api_router.get("/expenses/hr-review")
async def get_expenses_for_hr_review(current_user: dict = Depends(get_current_user)):
    """Get expense claims pending HR review"""
    if current_user.get("role") not in ["HR", "COO", "MD"]:
        raise HTTPException(status_code=403, detail="Access denied. HR access only.")
    
    try:
        claims = await db.expense_claims.find(
            {"status": "PENDING_HR"},
            {"_id": 0}
        ).sort("created_at", -1).to_list(1000)
        
        return claims
    except Exception as e:
        logger.error(f"Error fetching expenses for HR review: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch expenses")


@api_router.put("/expenses/hr-review/{claim_id}")
async def hr_review_expense(claim_id: str, status_update: ExpenseClaimUpdateStatus, current_user: dict = Depends(get_current_user)):
    """HR approves or rejects expense claim"""
    if current_user.get("role") not in ["HR", "COO", "MD"]:
        raise HTTPException(status_code=403, detail="Access denied. HR access only.")
    
    try:
        claim = await db.get_item('expense_claims', {"id": claim_id}, {"_id": 0})
        
        if not claim:
            raise HTTPException(status_code=404, detail="Expense claim not found")
        
        if claim.get("status") != "PENDING_HR":
            raise HTTPException(status_code=400, detail="Claim is not pending HR review")
        
        # Update status
        update_data = {
            "hr_id": current_user.get("employee_id"),
            "hr_name": current_user["name"],
            "hr_decision": status_update.decision,
            "hr_remarks": status_update.remarks,
            "hr_reviewed_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if status_update.decision == "reject":
            update_data["status"] = "REJECTED"
        elif status_update.decision == "approve":
            update_data["status"] = "PENDING_ACCOUNTS"
        
        await db.expense_claims.update_one(
            {"id": claim_id},
            {"$set": update_data}
        )
        
        return {"message": f"Expense claim {status_update.decision}d by HR successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating expense claim: {e}")
        raise HTTPException(status_code=500, detail="Failed to update expense claim")


@api_router.get("/expenses/accounts-review")
async def get_expenses_for_accounts_review(current_user: dict = Depends(get_current_user)):
    """Get expense claims pending accounts payment"""
    if current_user.get("role") not in ["Accounts Head", "Accountant", "COO", "MD"]:
        raise HTTPException(status_code=403, detail="Access denied. Accounts access only.")
    
    try:
        claims = await db.expense_claims.find(
            {"status": {"$in": ["PENDING_ACCOUNTS", "PAID"]}},
            {"_id": 0}
        ).sort("created_at", -1).to_list(1000)
        
        return claims
    except Exception as e:
        logger.error(f"Error fetching expenses for accounts review: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch expenses")


@api_router.put("/expenses/accounts-review/{claim_id}/pay")
async def mark_expense_paid(claim_id: str, payment_data: dict, current_user: dict = Depends(get_current_user)):
    """Accounts marks expense as paid"""
    if current_user.get("role") not in ["Accounts Head", "Accountant"]:
        raise HTTPException(status_code=403, detail="Access denied. Accounts team access only.")
    
    try:
        claim = await db.get_item('expense_claims', {"id": claim_id}, {"_id": 0})
        
        if not claim:
            raise HTTPException(status_code=404, detail="Expense claim not found")
        
        if claim.get("status") != "PENDING_ACCOUNTS":
            raise HTTPException(status_code=400, detail="Claim is not pending payment")
        
        # Mark as paid
        update_data = {
            "status": "PAID",
            "accounts_id": current_user.get("employee_id"),
            "accounts_name": current_user["name"],
            "payment_reference": payment_data.get("payment_reference", ""),
            "paid_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.expense_claims.update_one(
            {"id": claim_id},
            {"$set": update_data}
        )
        
        return {"message": "Expense marked as paid successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking expense as paid: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark expense as paid")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_db():
    """Initialize database connection and seed default users (gracefully handles permission errors)"""
    try:
        # Test database connection
        await db.command('ping')
        logger.info("✅ Database connection successful")
        print("✅ Database connection verified")
        
        # Try to create index (skip if unauthorized)
        try:
            await db.users.create_index("mobile", unique=True)
            logger.info("Unique index created on users.mobile field")
        except Exception as e:
            if "Unauthorized" in str(e) or "not authorized" in str(e):
                logger.warning("⚠️  Skipping index creation - no permissions (database is read-only)")
                print("⚠️  Database is read-only - skipping initialization")
            else:
                logger.info(f"Unique index on users.mobile already exists or creation failed: {e}")
        
        # Try to seed users (skip if unauthorized)
        try:
            # Check if COO exists
            coo_exists = await db.get_item('users', {"mobile": "971566374020"})
            if not coo_exists:
                coo_user = User(
                    mobile="971566374020",
                    pin_hash=hash_pin("4020"),
                    name="Sarada Gopalakrishnan",
                    role="COO"
                )
                user_dict = coo_user.model_dump()
                user_dict['created_at'] = user_dict['created_at'].isoformat()
                await db.put_item('users', user_dict)
                logger.info("COO user seeded successfully")
                print("✅ COO user seeded")
            else:
                print("✅ COO user exists")
            
            # Check if MD exists
            md_exists = await db.get_item('users', {"mobile": "971564022503"})
            if not md_exists:
                md_user = User(
                    mobile="971564022503",
                    pin_hash=hash_pin("2503"),
                    name="Brijith Shaji",
                    role="MD"
                )
                user_dict = md_user.model_dump()
                user_dict['created_at'] = user_dict['created_at'].isoformat()
                await db.put_item('users', user_dict)
                logger.info("MD user seeded successfully")
                print("✅ MD user seeded")
            else:
                print("✅ MD user exists")
            
            # Count total users
            user_count = len(await db.scan_items('users', {} if {} else {}))
            logger.info(f"Database initialized. Total users: {user_count}")
            print(f"✅ Database ready. Total users: {user_count}")
            
        except Exception as e:
            if "Unauthorized" in str(e) or "not authorized" in str(e):
                logger.warning("⚠️  Database is read-only - cannot seed users")
                logger.warning("⚠️  Continuing startup with existing database data...")
                print("⚠️  Database is read-only - using existing data")
                print("✅ Backend starting without seeding (production mode)")
            else:
                # Re-raise non-permission errors
                raise
        
    except Exception as e:
        # Only crash if it's not a permission error
        if "Unauthorized" in str(e) or "not authorized" in str(e):
            logger.warning("⚠️  Database connection is read-only")
            logger.warning("⚠️  Backend will start but cannot modify database")
            print("⚠️  Read-only database access - backend starting anyway")
        else:
            logger.error(f"❌ Database initialization failed: {e}")
            print(f"❌ CRITICAL: Database initialization failed: {e}")
            raise


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
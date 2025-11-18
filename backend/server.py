from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
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

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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
    branch: str  # Dubai, Saudi, Abu Dhabi
    email: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None  # Sales, Marketing, Training, etc.
    badge_title: Optional[str] = None  # UI designation hierarchy
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class EmployeeCreate(BaseModel):
    name: str
    mobile: str
    branch: str
    email: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    badge_title: Optional[str] = None


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None
    branch: Optional[str] = None
    email: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    badge_title: Optional[str] = None


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
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
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


@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    # Find user by mobile
    user = await db.users.find_one({"mobile": request.mobile}, {"_id": 0})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid mobile number or PIN"
        )
    
    # Verify PIN
    if not verify_pin(request.pin, user["pin_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid mobile number or PIN"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user["id"]})
    
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
    await db.employees.insert_one(doc)
    
    # Auto-create user account if designation contains "HR" or "Sales Head"
    user_role = None
    if employee.designation:
        if "HR" in employee.designation.upper() and "SALES" not in employee.designation.upper():
            user_role = "HR"
        elif "SALES HEAD" in employee.designation.upper():
            user_role = "Sales Head"
    
    if user_role:
        # Check if user already exists
        existing_user = await db.users.find_one({"mobile": employee.mobile})
        if not existing_user:
            # Create user account with PIN = last 4 digits of mobile
            pin = employee.mobile[-4:]
            new_user = User(
                mobile=employee.mobile,
                pin_hash=hash_pin(pin),
                name=employee.name,
                role=user_role
            )
            user_dict = new_user.model_dump()
            user_dict['created_at'] = user_dict['created_at'].isoformat()
            await db.users.insert_one(user_dict)
            logger.info(f"{user_role} user account created for {employee.name} with mobile {employee.mobile}")
    
    return employee_obj


@api_router.get("/hrm/employees", response_model=List[Employee])
async def get_employees(current_user: dict = Depends(get_current_user)):
    employees = await db.employees.find({}, {"_id": 0}).to_list(1000)
    for emp in employees:
        if isinstance(emp.get('created_at'), str):
            emp['created_at'] = datetime.fromisoformat(emp['created_at'])
    return employees


@api_router.put("/hrm/employees/{employee_id}", response_model=Employee)
async def update_employee(employee_id: str, employee_update: EmployeeUpdate, current_user: dict = Depends(get_current_user)):
    # Get existing employee
    existing = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Update fields
    update_data = {k: v for k, v in employee_update.model_dump().items() if v is not None}
    if update_data:
        await db.employees.update_one({"id": employee_id}, {"$set": update_data})
    
    # Return updated employee
    updated = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated


@api_router.delete("/hrm/employees/{employee_id}")
async def delete_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    # Get employee details before deletion
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Delete employee
    result = await db.employees.delete_one({"id": employee_id})
    
    # Delete related documents and attendance
    await db.employee_documents.delete_many({"employee_id": employee_id})
    await db.attendance.delete_many({"employee_id": employee_id})
    
    # If employee had HR or Sales Head designation, delete user account
    if employee.get("designation"):
        designation_upper = employee["designation"].upper()
        if "HR" in designation_upper and "SALES" not in designation_upper:
            deleted_user = await db.users.delete_one({"mobile": employee["mobile"], "role": "HR"})
            if deleted_user.deleted_count > 0:
                logger.info(f"HR user account deleted for {employee['name']}")
        elif "SALES HEAD" in designation_upper:
            deleted_user = await db.users.delete_one({"mobile": employee["mobile"], "role": "Sales Head"})
            if deleted_user.deleted_count > 0:
                logger.info(f"Sales Head user account deleted for {employee['name']}")
    
    return {"message": "Employee deleted successfully"}


# HRM - Attendance Management
@api_router.post("/hrm/attendance", response_model=Attendance)
async def record_attendance(attendance: AttendanceCreate, current_user: dict = Depends(get_current_user)):
    # Get employee details
    employee = await db.employees.find_one({"id": attendance.employee_id}, {"_id": 0})
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
    await db.attendance.insert_one(doc)
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
    employee = await db.employees.find_one({"id": doc.employee_id}, {"_id": 0})
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
    await db.employee_documents.insert_one(doc_dict)
    return doc_obj


@api_router.get("/hrm/employee-documents/{employee_id}", response_model=List[EmployeeDocument])
async def get_employee_documents(employee_id: str, current_user: dict = Depends(get_current_user)):
    docs = await db.employee_documents.find({"employee_id": employee_id}, {"_id": 0}).to_list(100)
    for doc in docs:
        if isinstance(doc.get('uploaded_at'), str):
            doc['uploaded_at'] = datetime.fromisoformat(doc['uploaded_at'])
    return docs


@api_router.get("/hrm/employee-documents/alerts/all")
async def get_employee_document_alerts(current_user: dict = Depends(get_current_user)):
    all_docs = await db.employee_documents.find({}, {"_id": 0}).to_list(1000)
    
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
    result = await db.employee_documents.delete_one({"id": doc_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted successfully"}


# HRM - Company Documents
@api_router.post("/hrm/company-documents", response_model=CompanyDocument)
async def upload_company_document(doc: CompanyDocumentCreate, current_user: dict = Depends(get_current_user)):
    doc_obj = CompanyDocument(**doc.model_dump())
    doc_dict = doc_obj.model_dump()
    doc_dict['uploaded_at'] = doc_dict['uploaded_at'].isoformat()
    await db.company_documents.insert_one(doc_dict)
    return doc_obj


@api_router.get("/hrm/company-documents", response_model=List[CompanyDocument])
async def get_company_documents(current_user: dict = Depends(get_current_user)):
    docs = await db.company_documents.find({}, {"_id": 0}).to_list(100)
    for doc in docs:
        if isinstance(doc.get('uploaded_at'), str):
            doc['uploaded_at'] = datetime.fromisoformat(doc['uploaded_at'])
    return docs


@api_router.get("/hrm/company-documents/alerts/all")
async def get_company_document_alerts(current_user: dict = Depends(get_current_user)):
    all_docs = await db.company_documents.find({}, {"_id": 0}).to_list(1000)
    
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
    result = await db.company_documents.delete_one({"id": doc_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted successfully"}


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
    # Seed COO user if not exists
    coo_exists = await db.users.find_one({"mobile": "971566374020"})
    if not coo_exists:
        coo_user = User(
            mobile="971566374020",
            pin_hash=hash_pin("4020"),
            name="Sarada Gopalakrishnan",
            role="COO"
        )
        user_dict = coo_user.model_dump()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        await db.users.insert_one(user_dict)
        logger.info("COO user seeded successfully")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
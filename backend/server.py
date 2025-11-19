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
    
    # Auto-create user account based on designation and sales_type
    user_role = None
    if employee.designation:
        designation_upper = employee.designation.upper()
        if "HR" in designation_upper and "SALES" not in designation_upper:
            user_role = "HR"
        elif "SALES HEAD" in designation_upper:
            user_role = "Sales Head"
        elif employee.department == "Sales" and "SALES HEAD" not in designation_upper:
            # Determine role based on sales_type
            if employee.sales_type == "tele":
                user_role = "Tele Sales"
            elif employee.sales_type == "field":
                user_role = "Field Sales"
            else:
                user_role = "Sales Employee"  # Fallback for backward compatibility
    
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
    
    # Delete user account if it exists (HR, Sales Head, Tele Sales, Field Sales, Sales Employee)
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
        elif employee.get("department") == "Sales":
            # Try all sales roles
            for role in ["Tele Sales", "Field Sales", "Sales Employee"]:
                deleted_user = await db.users.delete_one({"mobile": employee["mobile"], "role": role})
                if deleted_user.deleted_count > 0:
                    logger.info(f"{role} user account deleted for {employee['name']}")
                    break
    
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
    employee = await db.employees.find_one({"mobile": current_user["mobile"]}, {"_id": 0})
    
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
    
    employee = await db.employees.find_one({"mobile": current_user["mobile"]}, {"_id": 0})
    
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
    
    employee = await db.employees.find_one({"mobile": current_user["mobile"]}, {"_id": 0})
    
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
    
    employees = await db.employees.find(query, {"_id": 0}).to_list(1000)
    for emp in employees:
        if isinstance(emp.get('created_at'), str):
            emp['created_at'] = datetime.fromisoformat(emp['created_at'])
    
    return employees


@api_router.get("/sales-head/attendance/live")
async def get_live_attendance(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Sales Head":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get all sales employees
    employees = await db.employees.find({"department": "Sales"}, {"_id": 0}).to_list(1000)
    
    # Get today's attendance
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    attendance_records = await db.attendance.find({"date": today}, {"_id": 0}).to_list(1000)
    
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
    
    existing = await db.employees.find_one({"id": employee_id}, {"_id": 0})
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
        emp = await db.employees.find_one({"id": lead.assigned_to}, {"_id": 0})
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
    await db.leads.insert_one(doc)
    
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
    
    existing = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    update_data = {k: v for k, v in lead_update.model_dump().items() if v is not None}
    
    # Update assigned_to_name if assigned_to changed
    if "assigned_to" in update_data and update_data["assigned_to"]:
        emp = await db.employees.find_one({"id": update_data["assigned_to"]}, {"_id": 0})
        if emp:
            update_data["assigned_to_name"] = emp["name"]
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if update_data:
        await db.leads.update_one({"id": lead_id}, {"$set": update_data})
    
    updated = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return updated


@api_router.delete("/sales-head/leads/{lead_id}")
async def delete_lead(lead_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Sales Head":
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await db.leads.delete_one({"id": lead_id})
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
    await db.quotations.insert_one(doc)
    
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
    
    existing = await db.quotations.find_one({"id": quot_id}, {"_id": 0})
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
    
    existing = await db.leave_requests.find_one({"id": request_id}, {"_id": 0})
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
    employee = await db.employees.find_one({"mobile": current_user["mobile"]}, {"_id": 0})
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
    await db.leave_requests.insert_one(doc)
    
    return leave_obj


# Sales - Self Lead Submission (All Sales Roles)
@api_router.post("/sales/self-lead")
async def submit_self_lead(lead_data: SelfLeadCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["Sales Head", "Tele Sales", "Field Sales"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    employee = await db.employees.find_one({"mobile": current_user["mobile"]}, {"_id": 0})
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
    await db.leads.insert_one(doc)
    
    return {"message": "Self lead submitted successfully", "lead_id": lead_obj.id}


# Sales - Get My Leads (Assigned + Self)
@api_router.get("/sales/my-leads")
async def get_my_leads(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["Tele Sales", "Field Sales"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    employee = await db.employees.find_one({"mobile": current_user["mobile"]}, {"_id": 0})
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
    
    existing = await db.leads.find_one({"id": lead_id}, {"_id": 0})
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
    await db.quotations.insert_one(doc)
    
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
    await db.trainer_requests.insert_one(doc)
    
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
    await db.invoice_requests.insert_one(doc)
    
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
    await db.visit_logs.insert_one(doc)
    
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
    
    await db.trainer_requests.insert_one(trainer_req)
    
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
    
    await db.invoice_requests.insert_one(invoice_req)
    
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
    
    await db.visit_logs.insert_one(visit_log)
    
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
    
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
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


# Admin - Create Missing User Accounts for Sales Employees
@api_router.post("/admin/create-sales-user-accounts")
async def create_missing_sales_user_accounts(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["COO"]:
        raise HTTPException(status_code=403, detail="Access denied. COO only.")
    
    # Get all sales employees without filtering by mobile
    all_employees = await db.employees.find({"department": "Sales"}, {"_id": 0}).to_list(1000)
    
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
        existing_user = await db.users.find_one({"mobile": mobile, "role": user_role})
        
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
        await db.users.insert_one(user_dict)
        
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
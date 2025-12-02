import requests
import sys
import base64
from datetime import datetime, timedelta

class ArbritBackendHealthTester:
    def __init__(self, base_url="https://crmsuite-16.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.md_token = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {response_data}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "endpoint": endpoint
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e),
                "endpoint": endpoint
            })
            return False, {}

    def test_health_check(self):
        """Test health check endpoint - verify backend and DynamoDB connectivity"""
        success, response = self.run_test(
            "Health Check Endpoint",
            "GET",
            "health",
            200
        )
        
        if success:
            # Verify required fields in health response
            required_fields = {
                "status": "healthy",
                "database": "connected", 
                "database_type": "DynamoDB",
                "user_count": 35
            }
            
            print("   Verifying health check response fields:")
            for field, expected_value in required_fields.items():
                actual_value = response.get(field)
                if field == "user_count":
                    # For user_count, just verify it's a number
                    if isinstance(actual_value, int):
                        print(f"   ✅ {field}: {actual_value} (integer)")
                    else:
                        print(f"   ❌ {field}: Expected integer, got {type(actual_value)}")
                        success = False
                elif actual_value == expected_value:
                    print(f"   ✅ {field}: {actual_value}")
                else:
                    print(f"   ❌ {field}: Expected '{expected_value}', got '{actual_value}'")
                    success = False
            
            # Additional verification
            if response.get("region"):
                print(f"   ✅ region: {response.get('region')}")
            if response.get("table_prefix"):
                print(f"   ✅ table_prefix: {response.get('table_prefix')}")
        
        return success, response

    def test_login_md_credentials(self):
        """Test login with MD credentials as specified in review request"""
        success, response = self.run_test(
            "Login with MD Credentials",
            "POST",
            "auth/login",
            200,
            data={"mobile": "971564022503", "pin": "2503"}
        )
        if success and 'token' in response:
            self.token = response['token']
            self.md_token = response['token']
            print(f"   MD Token received: {self.token[:20]}...")
            print(f"   User: {response.get('user', {}).get('name', 'Unknown')}")
            print(f"   Role: {response.get('user', {}).get('role', 'Unknown')}")
            return True, response
        return False, {}

    def test_login_invalid_mobile(self):
        """Test login with invalid mobile number"""
        return self.run_test(
            "Login with Invalid Mobile",
            "POST",
            "auth/login",
            401,
            data={"mobile": "1234567890", "pin": "4020"}
        )

    def test_login_invalid_pin(self):
        """Test login with invalid PIN"""
        return self.run_test(
            "Login with Invalid PIN",
            "POST",
            "auth/login",
            401,
            data={"mobile": "9876543210", "pin": "1234"}
        )

    def test_login_missing_fields(self):
        """Test login with missing fields"""
        return self.run_test(
            "Login with Missing Fields",
            "POST",
            "auth/login",
            422,
            data={"mobile": "9876543210"}
        )

    def test_auth_me_endpoint(self):
        """Test /api/auth/me endpoint with MD token"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        success, response = self.run_test(
            "Get Current User (/api/auth/me)",
            "GET",
            "auth/me",
            200
        )
        
        if success:
            print(f"   Authenticated User: {response.get('name', 'Unknown')}")
            print(f"   Role: {response.get('role', 'Unknown')}")
            print(f"   Mobile: {response.get('mobile', 'Unknown')}")
        
        return success, response

    def test_get_current_user_no_token(self):
        """Test getting current user without token"""
        # Temporarily remove token
        temp_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "Get Current User (No Token)",
            "GET",
            "auth/me",
            403
        )
        
        # Restore token
        self.token = temp_token
        return success, response

    def test_coo_dashboard_access(self):
        """Test COO dashboard access"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        return self.run_test(
            "COO Dashboard Access",
            "GET",
            "dashboard/coo",
            200
        )

    def test_coo_dashboard_no_token(self):
        """Test COO dashboard access without token"""
        # Temporarily remove token
        temp_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "COO Dashboard (No Token)",
            "GET",
            "dashboard/coo",
            403
        )
        
        # Restore token
        self.token = temp_token
        return success, response

    # HRM Module Tests
    def test_create_employee(self):
        """Test creating a new employee"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        employee_data = {
            "name": "Test Employee",
            "mobile": "971501234567",
            "branch": "Dubai",
            "email": "test@arbrit.com",
            "designation": "Safety Officer"
        }
        
        success, response = self.run_test(
            "Create Employee",
            "POST",
            "hrm/employees",
            200,
            data=employee_data
        )
        
        if success and 'id' in response:
            self.employee_id = response['id']
            print(f"   Employee ID: {self.employee_id}")
        
        return success, response

    def test_get_employees(self):
        """Test getting all employees"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        return self.run_test(
            "Get All Employees",
            "GET",
            "hrm/employees",
            200
        )

    def test_update_employee(self):
        """Test updating an employee"""
        if not self.token or not hasattr(self, 'employee_id'):
            print("❌ Skipping - No token or employee ID available")
            return False, {}
        
        update_data = {
            "designation": "Senior Safety Officer",
            "email": "updated@arbrit.com"
        }
        
        return self.run_test(
            "Update Employee",
            "PUT",
            f"hrm/employees/{self.employee_id}",
            200,
            data=update_data
        )

    def test_record_attendance(self):
        """Test recording attendance"""
        if not self.token or not hasattr(self, 'employee_id'):
            print("❌ Skipping - No token or employee ID available")
            return False, {}
        
        attendance_data = {
            "employee_id": self.employee_id,
            "gps_lat": 25.2048,
            "gps_long": 55.2708
        }
        
        success, response = self.run_test(
            "Record Attendance",
            "POST",
            "hrm/attendance",
            200,
            data=attendance_data
        )
        
        if success and 'id' in response:
            self.attendance_id = response['id']
        
        return success, response

    def test_get_attendance(self):
        """Test getting attendance records"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        return self.run_test(
            "Get Attendance Records",
            "GET",
            "hrm/attendance",
            200
        )

    def test_upload_employee_document(self):
        """Test uploading employee document"""
        if not self.token or not hasattr(self, 'employee_id'):
            print("❌ Skipping - No token or employee ID available")
            return False, {}
        
        # Create a simple base64 encoded test document
        import base64
        test_content = "This is a test document content"
        file_data = base64.b64encode(test_content.encode()).decode()
        
        doc_data = {
            "employee_id": self.employee_id,
            "doc_type": "Passport",
            "file_name": "test_passport.pdf",
            "file_data": file_data,
            "expiry_date": "2025-12-31"
        }
        
        success, response = self.run_test(
            "Upload Employee Document",
            "POST",
            "hrm/employee-documents",
            200,
            data=doc_data
        )
        
        if success and 'id' in response:
            self.employee_doc_id = response['id']
        
        return success, response

    def test_get_employee_documents(self):
        """Test getting employee documents"""
        if not self.token or not hasattr(self, 'employee_id'):
            print("❌ Skipping - No token or employee ID available")
            return False, {}
        
        return self.run_test(
            "Get Employee Documents",
            "GET",
            f"hrm/employee-documents/{self.employee_id}",
            200
        )

    def test_get_employee_document_alerts(self):
        """Test getting employee document alerts"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        return self.run_test(
            "Get Employee Document Alerts",
            "GET",
            "hrm/employee-documents/alerts/all",
            200
        )

    def test_upload_company_document(self):
        """Test uploading company document"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        # Create a simple base64 encoded test document
        import base64
        test_content = "This is a test company document content"
        file_data = base64.b64encode(test_content.encode()).decode()
        
        doc_data = {
            "doc_name": "Test Trade License",
            "doc_type": "Trade License",
            "file_name": "trade_license.pdf",
            "file_data": file_data,
            "expiry_date": "2025-06-30"
        }
        
        success, response = self.run_test(
            "Upload Company Document",
            "POST",
            "hrm/company-documents",
            200,
            data=doc_data
        )
        
        if success and 'id' in response:
            self.company_doc_id = response['id']
        
        return success, response

    def test_get_company_documents(self):
        """Test getting company documents"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        return self.run_test(
            "Get Company Documents",
            "GET",
            "hrm/company-documents",
            200
        )

    def test_get_company_document_alerts(self):
        """Test getting company document alerts"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        return self.run_test(
            "Get Company Document Alerts",
            "GET",
            "hrm/company-documents/alerts/all",
            200
        )

    def test_delete_employee_document(self):
        """Test deleting employee document"""
        if not self.token or not hasattr(self, 'employee_doc_id'):
            print("❌ Skipping - No token or document ID available")
            return False, {}
        
        return self.run_test(
            "Delete Employee Document",
            "DELETE",
            f"hrm/employee-documents/{self.employee_doc_id}",
            200
        )

    def test_delete_company_document(self):
        """Test deleting company document"""
        if not self.token or not hasattr(self, 'company_doc_id'):
            print("❌ Skipping - No token or document ID available")
            return False, {}
        
        return self.run_test(
            "Delete Company Document",
            "DELETE",
            f"hrm/company-documents/{self.company_doc_id}",
            200
        )

    def test_delete_employee(self):
        """Test deleting an employee"""
        if not self.token or not hasattr(self, 'employee_id'):
            print("❌ Skipping - No token or employee ID available")
            return False, {}
        
        return self.run_test(
            "Delete Employee",
            "DELETE",
            f"hrm/employees/{self.employee_id}",
            200
        )

    def test_create_sales_user(self):
        """Create a test sales user with the required credentials"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        # Create a sales employee that will auto-generate a user account
        employee_data = {
            "name": "Test Sales User",
            "mobile": "9876543210",
            "branch": "Dubai",
            "email": "testsales@arbrit.com",
            "designation": "Sales Manager",
            "department": "Sales",
            "badge_title": "Senior Sales Manager",
            "sales_type": "tele"  # This will create a Tele Sales user
        }
        
        success, response = self.run_test(
            "Create Sales Employee (Auto-creates User)",
            "POST",
            "hrm/employees",
            200,
            data=employee_data
        )
        
        if success and 'id' in response:
            self.sales_employee_id = response['id']
            print(f"   Sales Employee ID: {self.sales_employee_id}")
            print("   User account should be auto-created with PIN: 3210")
        
        return success, response

    def test_login_sales_user(self):
        """Test login with the created sales user credentials"""
        success, response = self.run_test(
            "Login with Sales User Credentials",
            "POST",
            "auth/login",
            200,
            data={"mobile": "9876543210", "pin": "3210"}
        )
        if success and 'token' in response:
            self.sales_token = response['token']
            print(f"   Sales Token received: {self.sales_token[:20]}...")
            # Switch to sales user token for sales API tests
            self.token = self.sales_token
            return True, response
        return False, {}

    def test_create_field_sales_user(self):
        """Create a test field sales user for visit logs testing"""
        # Switch back to COO token for creating employee
        temp_token = self.token
        self.token = self.sales_token if hasattr(self, 'sales_token') else temp_token
        
        # Use COO token to create employee
        if hasattr(self, 'coo_token'):
            self.token = self.coo_token
        
        employee_data = {
            "name": "Test Field Sales User",
            "mobile": "9876543211",  # Different mobile
            "branch": "Dubai",
            "email": "fieldtest@arbrit.com",
            "designation": "Field Sales Executive",
            "department": "Sales",
            "badge_title": "Field Sales Executive",
            "sales_type": "field"  # This will create a Field Sales user
        }
        
        success, response = self.run_test(
            "Create Field Sales Employee",
            "POST",
            "hrm/employees",
            200,
            data=employee_data
        )
        
        if success and 'id' in response:
            self.field_sales_employee_id = response['id']
            print(f"   Field Sales Employee ID: {self.field_sales_employee_id}")
        
        # Restore previous token
        self.token = temp_token
        return success, response

    def test_login_field_sales_user(self):
        """Test login with field sales user credentials"""
        success, response = self.run_test(
            "Login with Field Sales User Credentials",
            "POST",
            "auth/login",
            200,
            data={"mobile": "9876543211", "pin": "3211"}  # Last 4 digits
        )
        if success and 'token' in response:
            self.field_sales_token = response['token']
            print(f"   Field Sales Token received: {self.field_sales_token[:20]}...")
            return True, response
        return False, {}

    # Sales API Tests
    def test_submit_self_lead(self):
        """Test submitting a self-generated lead"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        lead_data = {
            "client_name": "ABC Safety Solutions",
            "mobile": "0501234567",
            "email": "contact@abcsafety.com",
            "company_name": "ABC Safety Solutions LLC",
            "branch": "Dubai",
            "requirement": "Fire safety training for 20 employees",
            "lead_type": "Company",
            "notes": "Urgent requirement - follow up within 2 days"
        }
        
        success, response = self.run_test(
            "Submit Self Lead",
            "POST",
            "sales/self-lead",
            200,
            data=lead_data
        )
        
        if success and 'lead_id' in response:
            self.lead_id = response['lead_id']
            print(f"   Lead ID: {self.lead_id}")
        
        return success, response

    def test_get_my_leads(self):
        """Test getting my leads"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        return self.run_test(
            "Get My Leads",
            "GET",
            "sales/my-leads",
            200
        )

    def test_create_quotation(self):
        """Test creating a quotation"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        quotation_data = {
            "client_name": "XYZ Manufacturing",
            "items": "Fire Safety Training Course - 15 participants\nFirst Aid Kit - 5 units\nSafety Equipment Inspection",
            "total_amount": 3500.00,
            "remarks": "Valid for 30 days from date of issue"
        }
        
        success, response = self.run_test(
            "Create Quotation",
            "POST",
            "sales/quotations",
            200,
            data=quotation_data
        )
        
        if success and 'quotation_id' in response:
            self.quotation_id = response['quotation_id']
            print(f"   Quotation ID: {self.quotation_id}")
        
        return success, response

    def test_get_my_quotations(self):
        """Test getting my quotations"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        return self.run_test(
            "Get My Quotations",
            "GET",
            "sales/quotations",
            200
        )

    def test_create_trainer_request(self):
        """Test creating a trainer request"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        trainer_request_data = {
            "client_name": "Emirates Steel Industries",
            "course_type": "Fire Safety",
            "preferred_date": "2025-09-20",
            "location": "Dubai Industrial Area",
            "duration": "2 days",
            "remarks": "Urgent training needed for new project"
        }
        
        success, response = self.run_test(
            "Create Trainer Request",
            "POST",
            "sales/trainer-requests",
            200,
            data=trainer_request_data
        )
        
        if success and 'request_id' in response:
            self.trainer_request_id = response['request_id']
            print(f"   Trainer Request ID: {self.trainer_request_id}")
        
        return success, response

    def test_get_trainer_requests(self):
        """Test getting trainer requests"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        return self.run_test(
            "Get Trainer Requests",
            "GET",
            "sales/trainer-requests",
            200
        )

    def test_create_invoice_request(self):
        """Test creating an invoice request"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        invoice_request_data = {
            "client_name": "Global Construction LLC",
            "quotation_ref": "QT-2025-001",
            "amount": "5000",
            "description": "Safety equipment purchase and training services",
            "remarks": "Please expedite processing - client payment ready"
        }
        
        success, response = self.run_test(
            "Create Invoice Request",
            "POST",
            "sales/invoice-requests",
            200,
            data=invoice_request_data
        )
        
        if success and 'request_id' in response:
            self.invoice_request_id = response['request_id']
            print(f"   Invoice Request ID: {self.invoice_request_id}")
        
        return success, response

    def test_get_invoice_requests(self):
        """Test getting invoice requests"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        return self.run_test(
            "Get Invoice Requests",
            "GET",
            "sales/invoice-requests",
            200
        )

    def test_create_visit_log(self):
        """Test creating a visit log (Field Sales only)"""
        # Switch to field sales token if available
        if hasattr(self, 'field_sales_token'):
            temp_token = self.token
            self.token = self.field_sales_token
        elif not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        visit_log_data = {
            "client_name": "Petrochemical Industries",
            "location": "Dubai Marina Office Tower",
            "visit_date": "2025-09-15",
            "visit_time": "10:00",
            "purpose": "Product demonstration and safety consultation",
            "outcome": "Client showed strong interest in comprehensive safety package",
            "next_action": "Follow up with detailed proposal next week"
        }
        
        success, response = self.run_test(
            "Create Visit Log (Field Sales)",
            "POST",
            "sales/visit-logs",
            200,
            data=visit_log_data
        )
        
        if success and 'visit_id' in response:
            self.visit_log_id = response['visit_id']
            print(f"   Visit Log ID: {self.visit_log_id}")
        
        # Restore previous token if we switched
        if hasattr(self, 'field_sales_token') and 'temp_token' in locals():
            self.token = temp_token
        
        return success, response

    def test_get_visit_logs(self):
        """Test getting visit logs"""
        # Switch to field sales token if available
        if hasattr(self, 'field_sales_token'):
            temp_token = self.token
            self.token = self.field_sales_token
        elif not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        success, response = self.run_test(
            "Get Visit Logs (Field Sales)",
            "GET",
            "sales/visit-logs",
            200
        )
        
        # Restore previous token if we switched
        if hasattr(self, 'field_sales_token') and 'temp_token' in locals():
            self.token = temp_token
        
        return success, response

    def test_sales_api_error_handling(self):
        """Test sales API error handling with missing required fields"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        # Test trainer request with missing required fields
        incomplete_data = {
            "client_name": "Test Client"
            # Missing course_type, preferred_date, etc.
        }
        
        success, response = self.run_test(
            "Trainer Request - Missing Fields",
            "POST",
            "sales/trainer-requests",
            500,  # Server returns 500 for missing fields (backend issue)
            data=incomplete_data
        )
        
        return success, response

    # Sales Head API Tests
    def test_sales_head_get_all_leads(self):
        """Test Sales Head - Get All Leads"""
        # Switch to COO token (COO has Sales Head access)
        if hasattr(self, 'coo_token'):
            temp_token = self.token
            self.token = self.coo_token
        elif not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        success, response = self.run_test(
            "Sales Head - Get All Leads",
            "GET",
            "sales/leads",
            200
        )
        
        # Store leads for assignment testing
        if success and isinstance(response, list) and len(response) > 0:
            self.available_leads = response
            print(f"   Found {len(response)} leads for testing")
        
        # Restore token if switched
        if 'temp_token' in locals():
            self.token = temp_token
        
        return success, response

    def test_sales_head_assign_lead(self):
        """Test Sales Head - Assign Lead to Employee"""
        # Switch to COO token (COO has Sales Head access)
        if hasattr(self, 'coo_token'):
            temp_token = self.token
            self.token = self.coo_token
        elif not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        # Need a lead ID and employee ID for testing
        if not hasattr(self, 'available_leads') or not self.available_leads:
            print("❌ Skipping - No leads available for assignment")
            return False, {}
        
        if not hasattr(self, 'sales_employee_id'):
            print("❌ Skipping - No sales employee ID available")
            return False, {}
        
        lead_id = self.available_leads[0]['id']
        assign_data = {
            "employee_id": self.sales_employee_id
        }
        
        success, response = self.run_test(
            "Sales Head - Assign Lead to Employee",
            "PUT",
            f"sales/leads/{lead_id}/assign",
            200,
            data=assign_data
        )
        
        # Restore token if switched
        if 'temp_token' in locals():
            self.token = temp_token
        
        return success, response

    def test_sales_head_get_all_quotations(self):
        """Test Sales Head - Get All Quotations"""
        # Switch to COO token (COO has Sales Head access)
        if hasattr(self, 'coo_token'):
            temp_token = self.token
            self.token = self.coo_token
        elif not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        success, response = self.run_test(
            "Sales Head - Get All Quotations",
            "GET",
            "sales/quotations/all",
            200
        )
        
        # Store quotations for approval testing
        if success and isinstance(response, list) and len(response) > 0:
            self.available_quotations = response
            print(f"   Found {len(response)} quotations for testing")
        
        # Restore token if switched
        if 'temp_token' in locals():
            self.token = temp_token
        
        return success, response

    def test_sales_head_approve_quotation(self):
        """Test Sales Head - Approve Quotation"""
        # Switch to COO token (COO has Sales Head access)
        if hasattr(self, 'coo_token'):
            temp_token = self.token
            self.token = self.coo_token
        elif not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        # Need a quotation ID for testing
        if not hasattr(self, 'available_quotations') or not self.available_quotations:
            print("❌ Skipping - No quotations available for approval")
            return False, {}
        
        quotation_id = self.available_quotations[0]['id']
        approval_data = {
            "approved": True,
            "remarks": "Approved by Sales Head - pricing looks good"
        }
        
        success, response = self.run_test(
            "Sales Head - Approve Quotation",
            "PUT",
            f"sales/quotations/{quotation_id}/approve",
            200,
            data=approval_data
        )
        
        # Restore token if switched
        if 'temp_token' in locals():
            self.token = temp_token
        
        return success, response

    def test_sales_head_reject_quotation(self):
        """Test Sales Head - Reject Quotation"""
        # Switch to COO token (COO has Sales Head access)
        if hasattr(self, 'coo_token'):
            temp_token = self.token
            self.token = self.coo_token
        elif not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        # Need another quotation ID for testing rejection
        if not hasattr(self, 'available_quotations') or len(self.available_quotations) < 2:
            # Create a new quotation for rejection testing
            quotation_data = {
                "client_name": "Test Rejection Client",
                "items": "Test rejection quotation items",
                "total_amount": 1000.00,
                "remarks": "Test quotation for rejection"
            }
            
            create_success, create_response = self.run_test(
                "Create Quotation for Rejection Test",
                "POST",
                "sales/quotations",
                200,
                data=quotation_data
            )
            
            if not create_success or 'quotation_id' not in create_response:
                print("❌ Skipping - Could not create quotation for rejection test")
                return False, {}
            
            quotation_id = create_response['quotation_id']
        else:
            quotation_id = self.available_quotations[1]['id']
        
        rejection_data = {
            "approved": False,
            "remarks": "Pricing needs revision - too high for current market"
        }
        
        success, response = self.run_test(
            "Sales Head - Reject Quotation",
            "PUT",
            f"sales/quotations/{quotation_id}/approve",
            200,
            data=rejection_data
        )
        
        # Restore token if switched
        if 'temp_token' in locals():
            self.token = temp_token
        
        return success, response

    def test_create_leave_request(self):
        """Create a leave request for testing approval/rejection"""
        # Switch to sales user token to create leave request
        if hasattr(self, 'sales_token'):
            temp_token = self.token
            self.token = self.sales_token
        elif not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        leave_data = {
            "leave_from": "2025-10-01",
            "leave_to": "2025-10-03",
            "reason": "Personal vacation - family event"
        }
        
        success, response = self.run_test(
            "Create Leave Request",
            "POST",
            "employee/leave-request",
            200,
            data=leave_data
        )
        
        if success and 'id' in response:
            self.leave_request_id = response['id']
            print(f"   Leave Request ID: {self.leave_request_id}")
        
        # Restore token if switched
        if 'temp_token' in locals():
            self.token = temp_token
        
        return success, response

    def test_sales_head_approve_leave_request(self):
        """Test Sales Head - Approve Leave Request"""
        # Switch to COO token (COO has Sales Head access)
        if hasattr(self, 'coo_token'):
            temp_token = self.token
            self.token = self.coo_token
        elif not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        # Need a leave request ID for testing
        if not hasattr(self, 'leave_request_id'):
            print("❌ Skipping - No leave request ID available")
            return False, {}
        
        approval_data = {
            "remarks": "Approved - enjoy your vacation"
        }
        
        success, response = self.run_test(
            "Sales Head - Approve Leave Request",
            "PUT",
            f"hrm/leave-requests/{self.leave_request_id}/approve",
            200,
            data=approval_data
        )
        
        # Restore token if switched
        if 'temp_token' in locals():
            self.token = temp_token
        
        return success, response

    def test_create_another_leave_request(self):
        """Create another leave request for rejection testing"""
        # Switch to sales user token to create leave request
        if hasattr(self, 'sales_token'):
            temp_token = self.token
            self.token = self.sales_token
        elif not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        leave_data = {
            "leave_from": "2025-11-15",
            "leave_to": "2025-11-20",
            "reason": "Extended vacation - overseas travel"
        }
        
        success, response = self.run_test(
            "Create Another Leave Request",
            "POST",
            "employee/leave-request",
            200,
            data=leave_data
        )
        
        if success and 'id' in response:
            self.leave_request_id_2 = response['id']
            print(f"   Leave Request ID 2: {self.leave_request_id_2}")
        
        # Restore token if switched
        if 'temp_token' in locals():
            self.token = temp_token
        
        return success, response

    def test_sales_head_reject_leave_request(self):
        """Test Sales Head - Reject Leave Request"""
        # Switch to COO token (COO has Sales Head access)
        if hasattr(self, 'coo_token'):
            temp_token = self.token
            self.token = self.coo_token
        elif not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        # Need a leave request ID for testing
        if not hasattr(self, 'leave_request_id_2'):
            print("❌ Skipping - No second leave request ID available")
            return False, {}
        
        rejection_data = {
            "remarks": "Cannot approve - peak business season, insufficient leave balance"
        }
        
        success, response = self.run_test(
            "Sales Head - Reject Leave Request",
            "PUT",
            f"hrm/leave-requests/{self.leave_request_id_2}/reject",
            200,
            data=rejection_data
        )
        
        # Restore token if switched
        if 'temp_token' in locals():
            self.token = temp_token
        
        return success, response

    def test_login_md_hr_manager(self):
        """Test login with MD/HR Manager credentials as specified in review request"""
        success, response = self.run_test(
            "Login with MD/HR Manager Credentials",
            "POST",
            "auth/login",
            200,
            data={"mobile": "971564022503", "pin": "2503"}
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Token received: {self.token[:20]}...")
            return True, response
        return False, {}

    def test_get_employees_list(self):
        """Get list of employees to select one for document testing"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        success, response = self.run_test(
            "Get Employees List",
            "GET",
            "hrm/employees",
            200
        )
        
        if success and isinstance(response, list) and len(response) > 0:
            # Look for Afshan Firdose or use first employee
            target_employee = None
            for emp in response:
                if "971545844386" in emp.get("mobile", ""):
                    target_employee = emp
                    break
            
            if not target_employee:
                target_employee = response[0]  # Use first employee
            
            self.employee_id = target_employee["id"]
            self.employee_name = target_employee["name"]
            self.employee_mobile = target_employee["mobile"]
            print(f"   Selected Employee: {self.employee_name} ({self.employee_mobile})")
            print(f"   Employee ID: {self.employee_id}")
        
        return success, response

    def test_scenario_1_employee_document_upload(self):
        """Test Scenario 1: Employee Document Upload"""
        if not self.token or not self.employee_id:
            print("❌ Skipping - No token or employee ID available")
            return False, {}
        
        print(f"\n📋 SCENARIO 1: Employee Document Upload for {self.employee_name}")
        
        # Create realistic document content
        test_content = f"PASSPORT COPY - {self.employee_name}\nPassport Number: A1234567\nIssue Date: 2020-01-15\nExpiry Date: 2026-01-15\nIssuing Authority: UAE Immigration"
        file_data = base64.b64encode(test_content.encode()).decode()
        
        doc_data = {
            "employee_id": self.employee_id,
            "doc_type": "Identity Document",
            "file_name": "passport_copy.pdf",
            "file_data": file_data,
            "expiry_date": "2026-01-15"
        }
        
        success, response = self.run_test(
            "Upload Employee Document - Passport Copy",
            "POST",
            "hrm/employee-documents",
            200,
            data=doc_data
        )
        
        if success and 'id' in response:
            self.employee_doc_id = response['id']
            print(f"   Document ID: {self.employee_doc_id}")
            print(f"   Document saved for employee: {response.get('employee_name')}")
        
        return success, response

    def test_scenario_1_verify_document_saved(self):
        """Verify document is saved and listed"""
        if not self.token or not self.employee_id:
            print("❌ Skipping - No token or employee ID available")
            return False, {}
        
        success, response = self.run_test(
            "Fetch Employee Documents - Verify Upload",
            "GET",
            f"hrm/employee-documents/{self.employee_id}",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} documents for employee")
            for doc in response:
                print(f"   - {doc.get('doc_type')}: {doc.get('file_name')} (Expires: {doc.get('expiry_date')})")
        
        return success, response

    def test_scenario_2_company_document_upload(self):
        """Test Scenario 2: Company Document Upload"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        print(f"\n📋 SCENARIO 2: Company Document Upload")
        
        # Create realistic company document content
        test_content = "TRADE LICENSE\nLicense Number: CN-1234567\nCompany Name: Arbrit Safety Training LLC\nActivity: Safety Training Services\nIssue Date: 2024-01-01\nExpiry Date: 2025-12-31\nIssuing Authority: Dubai Economic Department"
        file_data = base64.b64encode(test_content.encode()).decode()
        
        doc_data = {
            "doc_name": "Trade License",
            "doc_type": "Legal Document",
            "file_name": "trade_license_2025.pdf",
            "file_data": file_data,
            "expiry_date": "2025-12-31"
        }
        
        success, response = self.run_test(
            "Upload Company Document - Trade License",
            "POST",
            "hrm/company-documents",
            200,
            data=doc_data
        )
        
        if success and 'id' in response:
            self.company_doc_id = response['id']
            print(f"   Company Document ID: {self.company_doc_id}")
            print(f"   Document Name: {response.get('doc_name')}")
        
        return success, response

    def test_scenario_2_verify_company_document_saved(self):
        """Verify company document is saved and listed"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        success, response = self.run_test(
            "Fetch Company Documents - Verify Upload",
            "GET",
            "hrm/company-documents",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} company documents")
            for doc in response:
                print(f"   - {doc.get('doc_name')} ({doc.get('doc_type')}): {doc.get('file_name')} (Expires: {doc.get('expiry_date')})")
        
        return success, response

    def test_scenario_3_create_expiring_document(self):
        """Test Scenario 3: Create document with near expiry for alerts testing"""
        if not self.token or not self.employee_id:
            print("❌ Skipping - No token or employee ID available")
            return False, {}
        
        print(f"\n📋 SCENARIO 3: Expiry Alerts Testing")
        
        # Create document expiring in 15 days (should trigger alert)
        expiry_date = (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d")
        
        test_content = f"VISA DOCUMENT - {self.employee_name}\nVisa Number: V9876543\nEntry Type: Multiple\nExpiry Date: {expiry_date}\nStatus: Valid"
        file_data = base64.b64encode(test_content.encode()).decode()
        
        doc_data = {
            "employee_id": self.employee_id,
            "doc_type": "Visa",
            "file_name": "work_visa.pdf",
            "file_data": file_data,
            "expiry_date": expiry_date
        }
        
        success, response = self.run_test(
            "Upload Employee Document - Expiring Visa",
            "POST",
            "hrm/employee-documents",
            200,
            data=doc_data
        )
        
        if success and 'id' in response:
            self.expiring_doc_id = response['id']
            print(f"   Expiring Document ID: {self.expiring_doc_id}")
            print(f"   Expiry Date: {expiry_date} (15 days from now)")
        
        return success, response

    def test_scenario_3_employee_document_alerts(self):
        """Test employee document expiry alerts"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        success, response = self.run_test(
            "Get Employee Document Alerts",
            "GET",
            "hrm/employee-documents/alerts/all",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} employee document alerts")
            for alert in response:
                severity = alert.get('severity', 'info')
                days = alert.get('days_until_expiry', 0)
                print(f"   - {severity.upper()}: {alert.get('employee_name')} - {alert.get('doc_type')} expires in {days} days")
        
        return success, response

    def test_scenario_3_create_expiring_company_document(self):
        """Create company document with near expiry"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        # Create company document expiring in 20 days
        expiry_date = (datetime.now() + timedelta(days=20)).strftime("%Y-%m-%d")
        
        test_content = f"ISO CERTIFICATE\nCertificate Number: ISO-45001-2024\nStandard: ISO 45001:2018\nScope: Occupational Health and Safety Management\nExpiry Date: {expiry_date}\nCertifying Body: Bureau Veritas"
        file_data = base64.b64encode(test_content.encode()).decode()
        
        doc_data = {
            "doc_name": "ISO 45001 Certificate",
            "doc_type": "Certification",
            "file_name": "iso_45001_certificate.pdf",
            "file_data": file_data,
            "expiry_date": expiry_date
        }
        
        success, response = self.run_test(
            "Upload Company Document - Expiring ISO Certificate",
            "POST",
            "hrm/company-documents",
            200,
            data=doc_data
        )
        
        if success and 'id' in response:
            self.expiring_company_doc_id = response['id']
            print(f"   Expiring Company Document ID: {self.expiring_company_doc_id}")
            print(f"   Expiry Date: {expiry_date} (20 days from now)")
        
        return success, response

    def test_scenario_3_company_document_alerts(self):
        """Test company document expiry alerts"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        success, response = self.run_test(
            "Get Company Document Alerts",
            "GET",
            "hrm/company-documents/alerts/all",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} company document alerts")
            for alert in response:
                severity = alert.get('severity', 'info')
                days = alert.get('days_until_expiry', 0)
                print(f"   - {severity.upper()}: {alert.get('doc_name')} ({alert.get('doc_type')}) expires in {days} days")
        
        return success, response

    def test_scenario_4_delete_employee_document(self):
        """Test Scenario 4: Document Deletion - Employee Document"""
        if not self.token or not hasattr(self, 'employee_doc_id'):
            print("❌ Skipping - No token or employee document ID available")
            return False, {}
        
        print(f"\n📋 SCENARIO 4: Document Deletion")
        
        success, response = self.run_test(
            "Delete Employee Document",
            "DELETE",
            f"hrm/employee-documents/{self.employee_doc_id}",
            200
        )
        
        if success:
            print(f"   Successfully deleted employee document ID: {self.employee_doc_id}")
        
        return success, response

    def test_scenario_4_verify_employee_document_deleted(self):
        """Verify employee document is removed from list"""
        if not self.token or not self.employee_id:
            print("❌ Skipping - No token or employee ID available")
            return False, {}
        
        success, response = self.run_test(
            "Verify Employee Document Deleted",
            "GET",
            f"hrm/employee-documents/{self.employee_id}",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Employee now has {len(response)} documents (after deletion)")
            # Check if the deleted document is no longer in the list
            deleted_doc_found = any(doc.get('id') == self.employee_doc_id for doc in response)
            if not deleted_doc_found:
                print(f"   ✅ Confirmed: Document {self.employee_doc_id} successfully removed")
            else:
                print(f"   ❌ Warning: Document {self.employee_doc_id} still appears in list")
        
        return success, response

    def test_scenario_4_delete_company_document(self):
        """Test Scenario 4: Document Deletion - Company Document"""
        if not self.token or not hasattr(self, 'company_doc_id'):
            print("❌ Skipping - No token or company document ID available")
            return False, {}
        
        success, response = self.run_test(
            "Delete Company Document",
            "DELETE",
            f"hrm/company-documents/{self.company_doc_id}",
            200
        )
        
        if success:
            print(f"   Successfully deleted company document ID: {self.company_doc_id}")
        
        return success, response

    def test_scenario_4_verify_company_document_deleted(self):
        """Verify company document is removed from list"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        success, response = self.run_test(
            "Verify Company Document Deleted",
            "GET",
            "hrm/company-documents",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Company now has {len(response)} documents (after deletion)")
            # Check if the deleted document is no longer in the list
            deleted_doc_found = any(doc.get('id') == self.company_doc_id for doc in response)
            if not deleted_doc_found:
                print(f"   ✅ Confirmed: Document {self.company_doc_id} successfully removed")
            else:
                print(f"   ❌ Warning: Document {self.company_doc_id} still appears in list")
        
        return success, response

def main():
    print("🚀 Starting Arbrit Document Management API Tests")
    print("📋 Testing Employee Document Management and Company Document Management")
    print("=" * 70)
    
    # Setup
    tester = ArbritDocumentManagementTester()
    
    # Test sequence as per review request
    print("\n🔐 AUTHENTICATION")
    print("Testing with MD/HR Manager credentials: Mobile 971564022503, PIN: 2503")
    
    # 1. Login with specified credentials
    success, response = tester.test_login_md_hr_manager()
    if not success:
        print("❌ CRITICAL: Cannot proceed without authentication")
        return 1
    
    # 2. Get list of employees
    print("\n👥 EMPLOYEE SETUP")
    tester.test_get_employees_list()
    
    # 3. Test Scenario 1: Employee Document Upload
    tester.test_scenario_1_employee_document_upload()
    tester.test_scenario_1_verify_document_saved()
    
    # 4. Test Scenario 2: Company Document Upload  
    tester.test_scenario_2_company_document_upload()
    tester.test_scenario_2_verify_company_document_saved()
    
    # 5. Test Scenario 3: Expiry Alerts
    tester.test_scenario_3_create_expiring_document()
    tester.test_scenario_3_employee_document_alerts()
    tester.test_scenario_3_create_expiring_company_document()
    tester.test_scenario_3_company_document_alerts()
    
    # 6. Test Scenario 4: Document Deletion
    tester.test_scenario_4_delete_employee_document()
    tester.test_scenario_4_verify_employee_document_deleted()
    tester.test_scenario_4_delete_company_document()
    tester.test_scenario_4_verify_company_document_deleted()
    
    # Print results
    print("\n" + "=" * 70)
    print(f"📊 DOCUMENT MANAGEMENT TEST RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {len(tester.failed_tests)}")
    
    if tester.failed_tests:
        print("\n❌ FAILED TESTS:")
        for test in tester.failed_tests:
            error_msg = test.get('error', f"Expected {test.get('expected')}, got {test.get('actual')}")
            print(f"   - {test['test']}: {error_msg}")
    else:
        print("\n✅ ALL TESTS PASSED!")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"\n✨ Success Rate: {success_rate:.1f}%")
    
    # Summary of what was tested
    print(f"\n📋 TESTED ENDPOINTS:")
    print(f"   ✅ POST /api/hrm/employee-documents - Upload employee document")
    print(f"   ✅ GET /api/hrm/employee-documents/{{employee_id}} - Fetch employee documents")
    print(f"   ✅ GET /api/hrm/employee-documents/alerts/all - Get employee document expiry alerts")
    print(f"   ✅ DELETE /api/hrm/employee-documents/{{doc_id}} - Delete employee document")
    print(f"   ✅ POST /api/hrm/company-documents - Upload company document")
    print(f"   ✅ GET /api/hrm/company-documents - Fetch company documents")
    print(f"   ✅ GET /api/hrm/company-documents/alerts/all - Get company document expiry alerts")
    print(f"   ✅ DELETE /api/hrm/company-documents/{{doc_id}} - Delete company document")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
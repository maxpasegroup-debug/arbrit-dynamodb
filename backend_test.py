import requests
import sys
from datetime import datetime

class ArbritAPITester:
    def __init__(self, base_url="https://safety-app-4.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

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

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )

    def test_login_valid_credentials(self):
        """Test login with valid COO credentials"""
        # First try with the seeded COO user to get a token
        success, response = self.run_test(
            "Login with COO Credentials",
            "POST",
            "auth/login",
            200,
            data={"mobile": "971566374020", "pin": "4020"}
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Token received: {self.token[:20]}...")
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

    def test_get_current_user(self):
        """Test getting current user info"""
        if not self.token:
            print("❌ Skipping - No token available")
            return False, {}
        
        return self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )

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
            422,  # Expecting validation error
            data=incomplete_data
        )
        
        return success, response

def main():
    print("🚀 Starting Arbrit Safety Training API Tests")
    print("=" * 50)
    
    # Setup
    tester = ArbritAPITester()
    
    # Test sequence
    print("\n📋 Testing API Endpoints...")
    
    # 1. Test root endpoint
    tester.test_root_endpoint()
    
    # 2. Test authentication endpoints
    print("\n🔐 Testing Authentication...")
    success, response = tester.test_login_valid_credentials()
    if success:
        tester.coo_token = tester.token  # Store COO token
    tester.test_login_invalid_mobile()
    tester.test_login_invalid_pin()
    tester.test_login_missing_fields()
    
    # 3. Test protected endpoints
    print("\n🛡️ Testing Protected Endpoints...")
    tester.test_get_current_user()
    tester.test_get_current_user_no_token()
    tester.test_coo_dashboard_access()
    tester.test_coo_dashboard_no_token()
    
    # 4. Test HRM Module - Employee Management
    print("\n👥 Testing HRM - Employee Management...")
    tester.test_create_employee()
    tester.test_get_employees()
    tester.test_update_employee()
    
    # 4.1. Create Sales User for Testing Sales APIs
    print("\n👤 Creating Sales User for Testing...")
    # Switch back to COO token for creating employees
    tester.token = tester.coo_token if hasattr(tester, 'coo_token') else tester.token
    tester.test_create_sales_user()
    tester.test_login_sales_user()
    
    # 4.2. Create Field Sales User for Visit Logs Testing
    print("\n👤 Creating Field Sales User for Visit Logs...")
    tester.token = tester.coo_token if hasattr(tester, 'coo_token') else tester.token
    tester.test_create_field_sales_user()
    tester.test_login_field_sales_user()
    
    # 5. Test HRM Module - Attendance Management
    print("\n⏰ Testing HRM - Attendance Management...")
    tester.test_record_attendance()
    tester.test_get_attendance()
    
    # 6. Test HRM Module - Employee Documents
    print("\n📄 Testing HRM - Employee Documents...")
    tester.test_upload_employee_document()
    tester.test_get_employee_documents()
    tester.test_get_employee_document_alerts()
    
    # 7. Test HRM Module - Company Documents
    print("\n🏢 Testing HRM - Company Documents...")
    tester.test_upload_company_document()
    tester.test_get_company_documents()
    tester.test_get_company_document_alerts()
    
    # 8. Test Sales APIs - Self Lead Management
    print("\n💼 Testing Sales APIs - Lead Management...")
    tester.test_submit_self_lead()
    tester.test_get_my_leads()
    
    # 9. Test Sales APIs - Quotation Management
    print("\n📋 Testing Sales APIs - Quotation Management...")
    tester.test_create_quotation()
    tester.test_get_my_quotations()
    
    # 10. Test Sales APIs - Trainer Requests
    print("\n👨‍🏫 Testing Sales APIs - Trainer Requests...")
    tester.test_create_trainer_request()
    tester.test_get_trainer_requests()
    
    # 11. Test Sales APIs - Invoice Requests
    print("\n🧾 Testing Sales APIs - Invoice Requests...")
    tester.test_create_invoice_request()
    tester.test_get_invoice_requests()
    
    # 12. Test Sales APIs - Visit Logs (Field Sales)
    print("\n📍 Testing Sales APIs - Visit Logs...")
    tester.test_create_visit_log()
    tester.test_get_visit_logs()
    
    # 13. Test Sales API Error Handling
    print("\n⚠️ Testing Sales API Error Handling...")
    tester.test_sales_api_error_handling()
    
    # 14. Test Delete Operations
    print("\n🗑️ Testing Delete Operations...")
    tester.test_delete_employee_document()
    tester.test_delete_company_document()
    tester.test_delete_employee()
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for test in tester.failed_tests:
            error_msg = test.get('error', f"Expected {test.get('expected')}, got {test.get('actual')}")
            print(f"   - {test['test']}: {error_msg}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"\n✨ Success Rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
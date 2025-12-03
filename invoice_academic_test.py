import requests
import sys
from datetime import datetime

class InvoiceAcademicTester:
    def __init__(self, base_url="https://safety-docs-hub.preview.emergentagent.com"):
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

    def test_login(self, mobile, pin, role_name):
        """Test login with specific credentials"""
        success, response = self.run_test(
            f"Login as {role_name} ({mobile})",
            "POST",
            "auth/login",
            200,
            data={"mobile": mobile, "pin": pin}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            user_info = response.get('user', {})
            print(f"   ✅ Login successful: {user_info.get('name', 'Unknown')} ({user_info.get('role', 'Unknown')})")
            return True, response
        else:
            print(f"   ❌ Login failed for {role_name}")
            return False, {}

    def test_invoice_request_submission(self, mobile, pin, role_name):
        """Test invoice request submission for a specific sales role"""
        print(f"\n📋 TESTING INVOICE REQUEST SUBMISSION - {role_name}")
        
        # Login first
        login_success, login_response = self.test_login(mobile, pin, role_name)
        if not login_success:
            return False, {}
        
        # Submit invoice request
        invoice_data = {
            "client_name": f"Test Client for {role_name}",
            "quotation_ref": f"QT-2025-{role_name[:3].upper()}",
            "amount": "2500.00",
            "description": f"Safety training services - {role_name} submission",
            "remarks": f"Invoice request submitted by {role_name} for testing"
        }
        
        success, response = self.run_test(
            f"Submit Invoice Request - {role_name}",
            "POST",
            "sales/invoice-requests",
            200,
            data=invoice_data
        )
        
        if success:
            print(f"   ✅ {role_name} successfully submitted invoice request")
            if 'request_id' in response:
                print(f"   ✅ Invoice Request ID: {response['request_id']}")
        else:
            print(f"   ❌ {role_name} failed to submit invoice request")
        
        return success, response

    def test_academic_head_access(self):
        """Test Academic Head access to quotation and invoice requests"""
        print(f"\n🎓 TESTING ACADEMIC HEAD ACCESS")
        
        # Login as Academic Head
        login_success, login_response = self.test_login("971557213537", "3537", "Academic Head")
        if not login_success:
            return False, {}
        
        # Test quotation requests access
        quotation_success, quotation_response = self.run_test(
            "Academic Head - Access Quotation Requests",
            "GET",
            "academic/quotation-requests",
            200
        )
        
        if quotation_success:
            print(f"   ✅ Academic Head can access quotation requests")
            if isinstance(quotation_response, list):
                print(f"   ✅ Found {len(quotation_response)} quotation requests")
        else:
            print(f"   ❌ Academic Head cannot access quotation requests")
        
        # Test invoice requests access
        invoice_success, invoice_response = self.run_test(
            "Academic Head - Access Invoice Requests",
            "GET",
            "academic/invoice-requests",
            200
        )
        
        if invoice_success:
            print(f"   ✅ Academic Head can access invoice requests")
            if isinstance(invoice_response, list):
                print(f"   ✅ Found {len(invoice_response)} invoice requests")
        else:
            print(f"   ❌ Academic Head cannot access invoice requests")
        
        return quotation_success and invoice_success, {
            "quotations": quotation_response,
            "invoices": invoice_response
        }

    def test_create_sample_data(self):
        """Create sample quotation and invoice requests for full flow test"""
        print(f"\n📊 CREATING SAMPLE DATA FOR FULL FLOW TEST")
        
        sample_data_created = []
        
        # Create 2 quotation requests (Sales Head and Field Sales)
        print("\n   Creating Quotation Requests...")
        
        # Sales Head quotation
        login_success, _ = self.test_login("971545844387", "4387", "Sales Head")
        if login_success:
            quotation_data = {
                "client_name": "Sample Company A",
                "items": "Fire Safety Training - 25 participants",
                "total_amount": 7500.00,
                "remarks": "Sample quotation from Sales Head"
            }
            
            success, response = self.run_test(
                "Create Sample Quotation - Sales Head",
                "POST",
                "sales/quotations",
                200,
                data=quotation_data
            )
            
            if success:
                sample_data_created.append(f"Sales Head Quotation: {response.get('quotation_id', 'Unknown ID')}")
        
        # Field Sales quotation
        login_success, _ = self.test_login("971545844386", "4386", "Field Sales")
        if login_success:
            quotation_data = {
                "client_name": "Sample Company B",
                "items": "First Aid Training - 15 participants",
                "total_amount": 4500.00,
                "remarks": "Sample quotation from Field Sales"
            }
            
            success, response = self.run_test(
                "Create Sample Quotation - Field Sales",
                "POST",
                "sales/quotations",
                200,
                data=quotation_data
            )
            
            if success:
                sample_data_created.append(f"Field Sales Quotation: {response.get('quotation_id', 'Unknown ID')}")
        
        # Create 2 invoice requests (Field Sales and Tele Sales)
        print("\n   Creating Invoice Requests...")
        
        # Field Sales invoice
        login_success, _ = self.test_login("971545844386", "4386", "Field Sales")
        if login_success:
            invoice_data = {
                "client_name": "Sample Company C",
                "quotation_ref": "QT-2025-SAMPLE-001",
                "amount": "3200.00",
                "description": "Safety equipment and training package",
                "remarks": "Sample invoice from Field Sales"
            }
            
            success, response = self.run_test(
                "Create Sample Invoice Request - Field Sales",
                "POST",
                "sales/invoice-requests",
                200,
                data=invoice_data
            )
            
            if success:
                sample_data_created.append(f"Field Sales Invoice: {response.get('request_id', 'Unknown ID')}")
        
        # Tele Sales invoice
        login_success, _ = self.test_login("971557638082", "8082", "Tele Sales")
        if login_success:
            invoice_data = {
                "client_name": "Sample Company D",
                "quotation_ref": "QT-2025-SAMPLE-002",
                "amount": "2800.00",
                "description": "Online safety training program",
                "remarks": "Sample invoice from Tele Sales"
            }
            
            success, response = self.run_test(
                "Create Sample Invoice Request - Tele Sales",
                "POST",
                "sales/invoice-requests",
                200,
                data=invoice_data
            )
            
            if success:
                sample_data_created.append(f"Tele Sales Invoice: {response.get('request_id', 'Unknown ID')}")
        
        print(f"\n   📋 Sample Data Created:")
        for item in sample_data_created:
            print(f"   - {item}")
        
        return len(sample_data_created) == 4, sample_data_created

    def run_focused_tests(self):
        """Run the focused tests as specified in the review request"""
        print("🚀 STARTING FOCUSED RE-TEST: INVOICE REQUEST AND ACADEMIC HEAD ACCESS")
        print("=" * 80)
        
        # TEST 1: Invoice Request Submissions for all 3 sales roles
        print("\n📋 TEST 1: INVOICE REQUEST SUBMISSIONS")
        
        sales_roles = [
            ("971545844387", "4387", "Sales Head (Mohammad Akbar)"),
            ("971545844386", "4386", "Field Sales (Afshan Firdose)"),
            ("971557638082", "8082", "Tele Sales (Afshaan Syeda)")
        ]
        
        invoice_results = []
        for mobile, pin, role_name in sales_roles:
            success, response = self.test_invoice_request_submission(mobile, pin, role_name)
            invoice_results.append((role_name, success))
        
        # TEST 2: Academic Head Access to Requests
        print("\n🎓 TEST 2: ACADEMIC HEAD ACCESS TO REQUESTS")
        academic_success, academic_response = self.test_academic_head_access()
        
        # TEST 3: Create Sample Data for Full Flow Test
        print("\n📊 TEST 3: CREATE SAMPLE DATA FOR FULL FLOW TEST")
        sample_data_success, sample_data = self.test_create_sample_data()
        
        # Verify Academic Head can see all requests after sample data creation
        if sample_data_success:
            print("\n🔍 VERIFYING ACADEMIC HEAD CAN SEE ALL REQUESTS")
            final_academic_success, final_academic_response = self.test_academic_head_access()
        
        # Print Summary
        print("\n" + "=" * 80)
        print("📊 FOCUSED TEST RESULTS SUMMARY")
        print("=" * 80)
        
        print("\n✅ EXPECTED OUTCOMES:")
        
        # Invoice Request Results
        print("\n📋 Invoice Request Submissions:")
        all_invoice_success = True
        for role_name, success in invoice_results:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"   {status} - {role_name}")
            if not success:
                all_invoice_success = False
        
        # Academic Head Access Results
        print("\n🎓 Academic Head Access:")
        academic_status = "✅ PASS" if academic_success else "❌ FAIL"
        print(f"   {academic_status} - Can access quotation and invoice endpoints")
        
        # Sample Data Results
        print("\n📊 Sample Data Creation:")
        sample_status = "✅ PASS" if sample_data_success else "❌ FAIL"
        print(f"   {sample_status} - Created 2 quotations + 2 invoices")
        
        # Overall Results
        print(f"\n📈 OVERALL TEST STATISTICS:")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for failed in self.failed_tests:
                print(f"   - {failed['test']}: {failed.get('error', f'Expected {failed.get(\"expected\")}, got {failed.get(\"actual\")}')}")
        
        # Final Assessment
        overall_success = all_invoice_success and academic_success and sample_data_success
        final_status = "✅ ALL TESTS PASSED" if overall_success else "❌ SOME TESTS FAILED"
        print(f"\n🎯 FINAL RESULT: {final_status}")
        
        return overall_success

if __name__ == "__main__":
    tester = InvoiceAcademicTester()
    success = tester.run_focused_tests()
    sys.exit(0 if success else 1)
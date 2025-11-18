import requests
import sys
from datetime import datetime

class ArbritAPITester:
    def __init__(self, base_url="https://school-dash-11.preview.emergentagent.com"):
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
        success, response = self.run_test(
            "Login with Valid Credentials",
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
            data={"mobile": "971566374020", "pin": "1234"}
        )

    def test_login_missing_fields(self):
        """Test login with missing fields"""
        return self.run_test(
            "Login with Missing Fields",
            "POST",
            "auth/login",
            422,
            data={"mobile": "971566374020"}
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
    tester.test_login_valid_credentials()
    tester.test_login_invalid_mobile()
    tester.test_login_invalid_pin()
    tester.test_login_missing_fields()
    
    # 3. Test protected endpoints
    print("\n🛡️ Testing Protected Endpoints...")
    tester.test_get_current_user()
    tester.test_get_current_user_no_token()
    tester.test_coo_dashboard_access()
    tester.test_coo_dashboard_no_token()
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for test in tester.failed_tests:
            print(f"   - {test['test']}: {test.get('error', f'Expected {test.get(\"expected\")}, got {test.get(\"actual\")}')}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"\n✨ Success Rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
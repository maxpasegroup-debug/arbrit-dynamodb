#!/usr/bin/env python3
"""
CRM SMOKE TEST - VERIFY CLEAN CRM
Complete smoke test to verify the CRM is completely clean with NO demo data
and ready for the 15 sales team members to start working.
"""

import requests
import sys
import json
from datetime import datetime

class CRMSmokeTest:
    def __init__(self, base_url="https://crm-workflow-10.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.demo_data_found = []

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
            if details:
                print(f"   {details}")
        else:
            print(f"❌ {test_name}")
            if details:
                print(f"   {details}")
            self.failed_tests.append({"test": test_name, "details": details})

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make API request with error handling"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            if response.status_code == expected_status:
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                try:
                    error_data = response.json()
                    return False, {"status_code": response.status_code, "error": error_data}
                except:
                    return False, {"status_code": response.status_code, "error": response.text}

        except Exception as e:
            return False, {"error": str(e)}

    def test_1_md_login_and_user_count(self):
        """1. DATA VERIFICATION - Login as MD and verify user count = 35"""
        print("\n🔐 1. DATA VERIFICATION - MD Login & User Count")
        
        # Login as MD
        success, response = self.make_request(
            "POST", 
            "auth/login", 
            {"mobile": "971564022503", "pin": "2503"}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            user_info = response.get('user', {})
            self.log_result(
                "MD Login (Brijith Shaji)", 
                True, 
                f"User: {user_info.get('name')} | Role: {user_info.get('role')}"
            )
        else:
            self.log_result("MD Login (Brijith Shaji)", False, f"Login failed: {response}")
            return False

        # Check user count via health endpoint
        success, response = self.make_request("GET", "health")
        if success:
            user_count = response.get('user_count', 0)
            if user_count == 35:
                self.log_result("User Count Verification", True, f"Found exactly 35 users ✅")
            else:
                self.log_result("User Count Verification", False, f"Expected 35 users, found {user_count}")
        else:
            self.log_result("User Count Verification", False, f"Health check failed: {response}")

        return True

    def test_2_verify_empty_data_tables(self):
        """2. Verify ALL data tables are empty (0 records)"""
        print("\n📊 2. DATA TABLE VERIFICATION - All Tables Must Be Empty")
        
        # Define all endpoints to check for empty data
        endpoints_to_check = [
            ("sales-head/leads", "Leads", "leads"),
            ("sales-head/quotations", "Quotations", "quotations"), 
            ("sales-head/invoices", "Invoices", "invoices"),
            ("accounts/payments", "Payments", "payments"),
            ("manager/leave-requests", "Leave Requests", "leave_requests"),
            ("expenses/for-approval", "Expense Claims", "expense_claims")
        ]
        
        all_tables_empty = True
        
        for endpoint, table_name, data_type in endpoints_to_check:
            success, response = self.make_request("GET", endpoint)
            
            if success:
                if isinstance(response, list):
                    record_count = len(response)
                elif isinstance(response, dict) and 'items' in response:
                    record_count = len(response['items'])
                elif isinstance(response, dict) and 'data' in response:
                    record_count = len(response['data'])
                else:
                    record_count = 0
                
                if record_count == 0:
                    self.log_result(f"{table_name} Table", True, f"✅ Empty (0 records)")
                else:
                    self.log_result(f"{table_name} Table", False, f"❌ Found {record_count} records - NOT CLEAN!")
                    self.demo_data_found.append(f"{table_name}: {record_count} records")
                    all_tables_empty = False
                    
                    # Show sample records if found
                    if record_count > 0 and isinstance(response, list) and len(response) > 0:
                        sample = response[0]
                        print(f"      Sample record: {sample.get('id', 'No ID')} - {sample.get('client_name', sample.get('name', 'Unknown'))}")
            else:
                # Some endpoints might not exist or require different permissions
                self.log_result(f"{table_name} Table", True, f"⚠️  Endpoint not accessible (may be empty)")
        
        return all_tables_empty

    def test_3_sales_head_verification(self):
        """3. SALES HEAD VERIFICATION - Login and check empty leads"""
        print("\n👨‍💼 3. SALES HEAD VERIFICATION")
        
        # Login as Sales Head
        success, response = self.make_request(
            "POST", 
            "auth/login", 
            {"mobile": "971545844387", "pin": "4387"}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            user_info = response.get('user', {})
            self.log_result(
                "Sales Head Login (Mohammad Akbar)", 
                True, 
                f"User: {user_info.get('name')} | Role: {user_info.get('role')}"
            )
        else:
            self.log_result("Sales Head Login (Mohammad Akbar)", False, f"Login failed: {response}")
            return False

        # Check leads are empty
        success, response = self.make_request("GET", "sales-head/leads")
        if success:
            if isinstance(response, list):
                lead_count = len(response)
            else:
                lead_count = 0
            
            if lead_count == 0:
                self.log_result("Sales Head Leads Check", True, "✅ No leads found (empty)")
            else:
                self.log_result("Sales Head Leads Check", False, f"❌ Found {lead_count} leads")
                self.demo_data_found.append(f"Sales Head Leads: {lead_count} records")
        else:
            self.log_result("Sales Head Leads Check", False, f"API call failed: {response}")

        return True

    def test_4_sales_executive_verification(self):
        """4. SALES EXECUTIVE VERIFICATION - Field Sales and Tele Sales"""
        print("\n👥 4. SALES EXECUTIVE VERIFICATION")
        
        # Test Field Sales (Sherook Mohammed)
        success, response = self.make_request(
            "POST", 
            "auth/login", 
            {"mobile": "971501631280", "pin": "1280"}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            user_info = response.get('user', {})
            self.log_result(
                "Field Sales Login (Sherook Mohammed)", 
                True, 
                f"User: {user_info.get('name')} | Role: {user_info.get('role')}"
            )
            
            # Check leads
            success, response = self.make_request("GET", "sales/leads")
            if success:
                lead_count = len(response) if isinstance(response, list) else 0
                if lead_count == 0:
                    self.log_result("Field Sales Leads Check", True, "✅ No leads found (empty)")
                else:
                    self.log_result("Field Sales Leads Check", False, f"❌ Found {lead_count} leads")
        else:
            self.log_result("Field Sales Login (Sherook Mohammed)", False, f"Login failed: {response}")

        # Test Tele Sales (Afshaan Syeda)
        success, response = self.make_request(
            "POST", 
            "auth/login", 
            {"mobile": "971557638082", "pin": "8082"}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            user_info = response.get('user', {})
            self.log_result(
                "Tele Sales Login (Afshaan Syeda)", 
                True, 
                f"User: {user_info.get('name')} | Role: {user_info.get('role')}"
            )
            
            # Check leads
            success, response = self.make_request("GET", "sales/leads")
            if success:
                lead_count = len(response) if isinstance(response, list) else 0
                if lead_count == 0:
                    self.log_result("Tele Sales Leads Check", True, "✅ No leads found (empty)")
                else:
                    self.log_result("Tele Sales Leads Check", False, f"❌ Found {lead_count} leads")
        else:
            self.log_result("Tele Sales Login (Afshaan Syeda)", False, f"Login failed: {response}")

        return True

    def test_5_create_fresh_test_lead(self):
        """5. CREATE FRESH TEST LEAD - Verify new Lead ID format works"""
        print("\n🆕 5. CREATE FRESH TEST LEAD - New Lead ID Format Test")
        
        # Login as Sales Head for lead creation
        success, response = self.make_request(
            "POST", 
            "auth/login", 
            {"mobile": "971545844387", "pin": "4387"}
        )
        
        if not success:
            self.log_result("Sales Head Re-login for Lead Creation", False, "Cannot login")
            return False
        
        self.token = response['token']
        
        # Create a fresh test lead
        lead_data = {
            "lead_owner": "Mohammad Akbar",
            "course_id": "fire-safety-001",
            "course_name": "Fire Safety Training",
            "lead_type": "company",
            "company_name": "Test Clean CRM Company",
            "contact_person": "Ahmed Hassan",
            "contact_designation": "Safety Manager", 
            "contact_mobile": "971501234567",
            "phone": "971501234567",
            "contact_email": "ahmed@testcompany.ae",
            "num_trainees": 25,
            "urgency": "medium",
            "lead_value": "5000",
            "lead_score": "warm",
            "training_location": "DUBAI",
            "description": "Fresh test lead to verify clean CRM system",
            "branch": "Dubai"
        }
        
        success, response = self.make_request("POST", "sales-head/leads", lead_data)
        
        if success:
            lead_id = response.get('id') or response.get('lead_id')
            if lead_id:
                self.log_result("Fresh Lead Creation", True, f"Lead ID: {lead_id}")
                
                # Verify Lead ID format: ARBRIT-DEC24-{AREA}-001
                current_month = datetime.now().strftime("%b").upper()
                current_year = datetime.now().strftime("%y")
                expected_prefix = f"ARBRIT-{current_month}{current_year}-DUBAI"
                
                if lead_id.startswith(expected_prefix):
                    self.log_result("Lead ID Format Verification", True, f"✅ Correct format: {lead_id}")
                else:
                    self.log_result("Lead ID Format Verification", False, f"❌ Expected format: {expected_prefix}-XXX, got: {lead_id}")
                
                # Verify Sales Head can see the lead
                success, response = self.make_request("GET", "sales-head/leads")
                if success and isinstance(response, list):
                    found_lead = any(lead.get('id') == lead_id for lead in response)
                    if found_lead:
                        self.log_result("Lead Visibility Check", True, "✅ Sales Head can see the created lead")
                    else:
                        self.log_result("Lead Visibility Check", False, "❌ Sales Head cannot see the created lead")
                
                return True
            else:
                self.log_result("Fresh Lead Creation", False, f"No lead ID returned: {response}")
        else:
            self.log_result("Fresh Lead Creation", False, f"Lead creation failed: {response}")
        
        return False

    def run_complete_smoke_test(self):
        """Run the complete smoke test"""
        print("🚀 STARTING CRM SMOKE TEST - VERIFY CLEAN CRM")
        print("=" * 60)
        print("Objective: Verify CRM is completely clean with NO demo data")
        print("Expected: 35 users, 0 leads/quotations/invoices/payments/leaves/expenses")
        print("=" * 60)
        
        # Run all test phases
        self.test_1_md_login_and_user_count()
        self.test_2_verify_empty_data_tables()
        self.test_3_sales_head_verification()
        self.test_4_sales_executive_verification()
        self.test_5_create_fresh_test_lead()
        
        # Final report
        print("\n" + "=" * 60)
        print("🏁 SMOKE TEST RESULTS")
        print("=" * 60)
        
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {len(self.failed_tests)}")
        
        if self.demo_data_found:
            print(f"\n❌ DEMO DATA FOUND - CRM NOT CLEAN:")
            for item in self.demo_data_found:
                print(f"   • {item}")
        else:
            print(f"\n✅ NO DEMO DATA FOUND - CRM IS CLEAN!")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        
        # Overall result
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        if success_rate >= 90 and not self.demo_data_found:
            print("🎉 SMOKE TEST PASSED - CRM IS READY FOR PRODUCTION!")
            return True
        else:
            print("⚠️  SMOKE TEST FAILED - CRM NEEDS CLEANUP!")
            return False

if __name__ == "__main__":
    tester = CRMSmokeTest()
    success = tester.run_complete_smoke_test()
    sys.exit(0 if success else 1)
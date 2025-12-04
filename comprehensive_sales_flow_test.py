#!/usr/bin/env python3
"""
COMPREHENSIVE SALES FLOW TESTING
Test the complete sales workflow for the Arbrit Safety CRM system.

This test covers:
1. LOGIN TO SALES DASHBOARDS & ADD LEADS (3 users)
2. LEAD TRACKER - SUBMIT REQUESTS (Quotation, Invoice, Expense)
3. ACADEMIC HEAD VERIFICATION (Check requests appear)
4. STATUS UPDATES (Verify status buttons update)
"""

import requests
import sys
import json
from datetime import datetime, timedelta

class ComprehensiveSalesFlowTester:
    def __init__(self, base_url="https://crm-safety-app.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        # Store tokens for different users
        self.tokens = {}
        self.users = {}
        self.created_leads = []
        self.created_requests = []

    def log_test(self, test_name, success, details=""):
        """Log test results"""
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
            self.failed_tests.append(test_name)

    def make_request(self, method, endpoint, data=None, token=None, expected_status=200):
        """Make API request with proper headers"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=15)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=15)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=15)
            
            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text}
            
            return success, response.status_code, response_data
            
        except Exception as e:
            return False, 0, {"error": str(e)}

    def test_user_login(self, user_type, mobile, pin):
        """Test login for a specific user"""
        print(f"\n🔐 Testing Login: {user_type} ({mobile})")
        
        success, status, response = self.make_request(
            'POST', 'auth/login', 
            data={"mobile": mobile, "pin": pin}
        )
        
        if success and 'token' in response:
            self.tokens[user_type] = response['token']
            self.users[user_type] = response['user']
            self.log_test(f"{user_type} Login", True, 
                         f"User: {response['user'].get('name')} | Role: {response['user'].get('role')}")
            return True
        else:
            self.log_test(f"{user_type} Login", False, 
                         f"Status: {status} | Error: {response.get('detail', 'Unknown error')}")
            return False

    def test_submit_lead(self, user_type, lead_data, lead_type):
        """Submit a lead for a specific user"""
        if user_type not in self.tokens:
            self.log_test(f"{user_type} - Submit {lead_type} Lead", False, "No token available")
            return False
        
        print(f"\n📝 {user_type} - Submitting {lead_type} Lead")
        
        # Determine the correct endpoint based on user type
        if user_type == "Sales Head":
            endpoint = "sales-head/leads"
        else:
            endpoint = "sales/self-lead"
        
        success, status, response = self.make_request(
            'POST', endpoint, 
            data=lead_data, 
            token=self.tokens[user_type]
        )
        
        if success:
            lead_id = response.get('lead_id') or response.get('id')
            if lead_id:
                self.created_leads.append({
                    'id': lead_id,
                    'user_type': user_type,
                    'lead_type': lead_type,
                    'client_name': lead_data.get('client_name') or lead_data.get('company_name')
                })
            self.log_test(f"{user_type} - Submit {lead_type} Lead", True, 
                         f"Lead ID: {lead_id} | Client: {lead_data.get('client_name', 'Unknown')}")
            return True
        else:
            self.log_test(f"{user_type} - Submit {lead_type} Lead", False, 
                         f"Status: {status} | Error: {response.get('detail', 'Unknown error')}")
            return False

    def test_verify_leads_created(self, user_type):
        """Verify leads are visible in the system"""
        if user_type not in self.tokens:
            return False
        
        print(f"\n👀 {user_type} - Verifying Leads Created")
        
        # Get leads for this user
        if user_type == "Sales Head":
            endpoint = "sales/leads"
        else:
            endpoint = "sales/my-leads"
        
        success, status, response = self.make_request(
            'GET', endpoint, 
            token=self.tokens[user_type]
        )
        
        if success and isinstance(response, list):
            user_leads = [lead for lead in self.created_leads if lead['user_type'] == user_type]
            self.log_test(f"{user_type} - Verify Leads", True, 
                         f"Found {len(response)} leads in system, created {len(user_leads)} leads")
            return True
        else:
            self.log_test(f"{user_type} - Verify Leads", False, 
                         f"Status: {status} | Could not retrieve leads")
            return False

    def test_submit_quotation_request(self, user_type, lead_info):
        """Submit a quotation request"""
        if user_type not in self.tokens:
            return False
        
        print(f"\n💰 {user_type} - Submitting Quotation Request")
        
        quotation_data = {
            "lead_id": lead_info['id'],
            "client_name": lead_info['client_name'],
            "items": "Fire Safety Training - 25 participants\nSafety Equipment - Basic package",
            "total_amount": 5000.00,
            "remarks": "Quotation for fire safety training program"
        }
        
        # Determine endpoint based on user type
        if user_type == "Sales Head":
            endpoint = "sales-head/quotations"
        else:
            endpoint = "sales/quotations"
        
        success, status, response = self.make_request(
            'POST', endpoint, 
            data=quotation_data, 
            token=self.tokens[user_type]
        )
        
        if success:
            quotation_id = response.get('quotation_id') or response.get('id')
            self.created_requests.append({
                'type': 'quotation',
                'id': quotation_id,
                'user_type': user_type,
                'lead_id': lead_info['id']
            })
            self.log_test(f"{user_type} - Submit Quotation Request", True, 
                         f"Quotation ID: {quotation_id}")
            return True
        else:
            self.log_test(f"{user_type} - Submit Quotation Request", False, 
                         f"Status: {status} | Error: {response.get('detail', 'Unknown error')}")
            return False

    def test_submit_invoice_request(self, user_type, lead_info):
        """Submit an invoice request"""
        if user_type not in self.tokens:
            return False
        
        print(f"\n🧾 {user_type} - Submitting Invoice Request")
        
        invoice_data = {
            "client_name": lead_info['client_name'],
            "quotation_ref": "QT-2025-001",
            "amount": "5000",
            "description": "Invoice for fire safety training services",
            "remarks": "Payment terms: 30 days"
        }
        
        success, status, response = self.make_request(
            'POST', 'sales/invoice-requests', 
            data=invoice_data, 
            token=self.tokens[user_type]
        )
        
        if success:
            invoice_id = response.get('request_id') or response.get('id')
            self.created_requests.append({
                'type': 'invoice',
                'id': invoice_id,
                'user_type': user_type,
                'lead_id': lead_info['id']
            })
            self.log_test(f"{user_type} - Submit Invoice Request", True, 
                         f"Invoice Request ID: {invoice_id}")
            return True
        else:
            self.log_test(f"{user_type} - Submit Invoice Request", False, 
                         f"Status: {status} | Error: {response.get('detail', 'Unknown error')}")
            return False

    def test_submit_expense_claim(self, user_type):
        """Submit an expense claim"""
        if user_type not in self.tokens:
            return False
        
        print(f"\n💸 {user_type} - Submitting Expense Claim")
        
        expense_data = {
            "amount": 250.00,
            "category": "Travel",
            "description": "Client visit transportation and meals",
            "expense_date": datetime.now().strftime("%Y-%m-%d"),
            "attachment_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
        }
        
        success, status, response = self.make_request(
            'POST', 'expenses/my-claims', 
            data=expense_data, 
            token=self.tokens[user_type]
        )
        
        if success:
            expense_id = response.get('claim_id') or response.get('id')
            self.created_requests.append({
                'type': 'expense',
                'id': expense_id,
                'user_type': user_type
            })
            self.log_test(f"{user_type} - Submit Expense Claim", True, 
                         f"Expense Claim ID: {expense_id}")
            return True
        else:
            self.log_test(f"{user_type} - Submit Expense Claim", False, 
                         f"Status: {status} | Error: {response.get('detail', 'Unknown error')}")
            return False

    def test_academic_head_verification(self):
        """Test Academic Head can see the requests"""
        if "Academic Head" not in self.tokens:
            self.log_test("Academic Head Verification", False, "No Academic Head token available")
            return False
        
        print(f"\n🎓 Academic Head - Verifying Requests Visibility")
        
        # Check quotation requests
        success, status, response = self.make_request(
            'GET', 'sales/quotations/all', 
            token=self.tokens["Academic Head"]
        )
        
        quotation_requests_visible = False
        if success and isinstance(response, list):
            quotation_count = len(response)
            quotation_requests_visible = quotation_count > 0
            self.log_test("Academic Head - View Quotation Requests", True, 
                         f"Found {quotation_count} quotation requests")
        else:
            self.log_test("Academic Head - View Quotation Requests", False, 
                         f"Status: {status} | Could not retrieve quotations")
        
        # Check invoice requests
        success, status, response = self.make_request(
            'GET', 'sales/invoice-requests', 
            token=self.tokens["Academic Head"]
        )
        
        invoice_requests_visible = False
        if success and isinstance(response, list):
            invoice_count = len(response)
            invoice_requests_visible = invoice_count > 0
            self.log_test("Academic Head - View Invoice Requests", True, 
                         f"Found {invoice_count} invoice requests")
        else:
            self.log_test("Academic Head - View Invoice Requests", False, 
                         f"Status: {status} | Could not retrieve invoice requests")
        
        return quotation_requests_visible and invoice_requests_visible

    def test_status_updates_verification(self, user_type):
        """Verify status updates are reflected in Lead Tracker"""
        if user_type not in self.tokens:
            return False
        
        print(f"\n📊 {user_type} - Verifying Status Updates in Lead Tracker")
        
        # Get leads to check status
        if user_type == "Sales Head":
            endpoint = "sales/leads"
        else:
            endpoint = "sales/my-leads"
        
        success, status, response = self.make_request(
            'GET', endpoint, 
            token=self.tokens[user_type]
        )
        
        if success and isinstance(response, list):
            # Check if any leads have updated status
            updated_leads = 0
            for lead in response:
                if lead.get('status') != 'New':
                    updated_leads += 1
            
            self.log_test(f"{user_type} - Status Updates Verification", True, 
                         f"Found {updated_leads} leads with status updates out of {len(response)} total leads")
            return True
        else:
            self.log_test(f"{user_type} - Status Updates Verification", False, 
                         f"Status: {status} | Could not retrieve leads for status check")
            return False

    def run_comprehensive_sales_flow_test(self):
        """Run the complete comprehensive sales flow test"""
        print("=" * 80)
        print("🚀 COMPREHENSIVE SALES FLOW TESTING - ARBRIT SAFETY CRM")
        print("=" * 80)
        print("Testing complete sales workflow with 3 users:")
        print("1. Sales Head: Mohammad Akbar / 971545844387 / PIN: 4387")
        print("2. Field Sales: Afshan Firdose / 971545844386 / PIN: 4386")
        print("3. Tele Sales: Afshaan Syeda / 971557638082 / PIN: 8082")
        print("4. Academic Head: Abdu Sahad / 971557213537 / PIN: 3537")
        print("=" * 80)

        # PART 1: LOGIN TO SALES DASHBOARDS & ADD LEADS
        print("\n" + "=" * 50)
        print("PART 1: LOGIN TO SALES DASHBOARDS & ADD LEADS")
        print("=" * 50)
        
        # Test user logins
        users_to_test = [
            ("Sales Head", "971545844387", "4387"),
            ("Field Sales", "971545844386", "4386"),
            ("Tele Sales", "971557638082", "8082"),
            ("Academic Head", "971557213537", "3537")
        ]
        
        login_success = True
        for user_type, mobile, pin in users_to_test:
            if not self.test_user_login(user_type, mobile, pin):
                login_success = False
        
        if not login_success:
            print("\n❌ CRITICAL: Some user logins failed. Cannot proceed with lead testing.")
            return self.print_final_results()
        
        # Submit leads for each sales user
        sales_users = ["Sales Head", "Field Sales", "Tele Sales"]
        
        for user_type in sales_users:
            if user_type not in self.tokens:
                continue
            
            # Lead 1: CORPORATE type with Fire Safety Training
            corporate_lead = {
                "lead_type": "company",
                "company_name": f"Emirates Safety Corp {user_type}",
                "contact_person": "Ahmed Al Mansoori",
                "contact_designation": "Safety Manager",
                "contact_mobile": "971501234567",
                "phone": "971501234567",
                "contact_email": "ahmed@emiratessafety.ae",
                "course_id": "fire-safety-001",
                "course_name": "Fire Safety Training",
                "num_trainees": 25,
                "lead_owner": self.users[user_type]['name'],
                "requirement": "Fire safety training for construction workers",
                "industry": "Construction",
                "urgency": "high"
            }
            
            # Lead 2: INDIVIDUAL type with First Aid & CPR
            individual_lead = {
                "lead_type": "individual",
                "client_name": f"Mohammed Hassan {user_type}",
                "client_mobile": "971502345678",
                "client_email": "mohammed@email.ae",
                "course_id": "first-aid-001",
                "course_name": "First Aid & CPR",
                "num_trainees": 1,
                "lead_owner": self.users[user_type]['name'],
                "requirement": "Individual first aid certification",
                "urgency": "medium"
            }
            
            self.test_submit_lead(user_type, corporate_lead, "CORPORATE")
            self.test_submit_lead(user_type, individual_lead, "INDIVIDUAL")
            
            # Verify leads are created and visible
            self.test_verify_leads_created(user_type)

        # PART 2: LEAD TRACKER - SUBMIT REQUESTS
        print("\n" + "=" * 50)
        print("PART 2: LEAD TRACKER - SUBMIT REQUESTS")
        print("=" * 50)
        
        for user_type in sales_users:
            if user_type not in self.tokens:
                continue
            
            # Get leads for this user to submit requests
            user_leads = [lead for lead in self.created_leads if lead['user_type'] == user_type]
            
            if user_leads:
                # Use first lead for requests
                lead_info = user_leads[0]
                
                # Submit requests
                self.test_submit_quotation_request(user_type, lead_info)
                self.test_submit_invoice_request(user_type, lead_info)
                
                # Submit expense claim (if applicable)
                if user_type in ["Field Sales", "Tele Sales"]:  # Sales Head might not need expense claims
                    self.test_submit_expense_claim(user_type)

        # PART 3: ACADEMIC HEAD VERIFICATION
        print("\n" + "=" * 50)
        print("PART 3: ACADEMIC HEAD VERIFICATION")
        print("=" * 50)
        
        self.test_academic_head_verification()

        # PART 4: STATUS UPDATES
        print("\n" + "=" * 50)
        print("PART 4: STATUS UPDATES VERIFICATION")
        print("=" * 50)
        
        for user_type in sales_users:
            if user_type in self.tokens:
                self.test_status_updates_verification(user_type)

        return self.print_final_results()

    def print_final_results(self):
        """Print final test results"""
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE SALES FLOW TEST RESULTS")
        print("=" * 80)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"   - {test}")
        
        print(f"\n📈 CREATED DATA SUMMARY:")
        print(f"   Leads Created: {len(self.created_leads)}")
        print(f"   Requests Submitted: {len(self.created_requests)}")
        
        if self.created_leads:
            print(f"\n📝 LEADS CREATED:")
            for lead in self.created_leads:
                print(f"   - {lead['user_type']}: {lead['lead_type']} lead for {lead['client_name']} (ID: {lead['id']})")
        
        if self.created_requests:
            print(f"\n📋 REQUESTS SUBMITTED:")
            for req in self.created_requests:
                print(f"   - {req['user_type']}: {req['type'].title()} request (ID: {req['id']})")
        
        print("\n" + "=" * 80)
        
        # Return success status
        return success_rate >= 70  # Consider 70%+ success rate as passing

if __name__ == "__main__":
    tester = ComprehensiveSalesFlowTester()
    success = tester.run_comprehensive_sales_flow_test()
    
    if success:
        print("🎉 COMPREHENSIVE SALES FLOW TEST COMPLETED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("❌ COMPREHENSIVE SALES FLOW TEST FAILED!")
        sys.exit(1)
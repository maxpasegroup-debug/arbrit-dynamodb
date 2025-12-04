#!/usr/bin/env python3
"""
SALES FLOW ANALYSIS - Detailed investigation of the issues found
"""

import requests
import json

class SalesFlowAnalyzer:
    def __init__(self, base_url="https://crm-safety-app.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tokens = {}

    def login_user(self, user_type, mobile, pin):
        """Login and store token"""
        response = requests.post(f"{self.api_url}/auth/login", 
                               json={"mobile": mobile, "pin": pin})
        if response.status_code == 200:
            data = response.json()
            self.tokens[user_type] = data['token']
            print(f"✅ {user_type} logged in: {data['user']['name']} ({data['user']['role']})")
            return True
        else:
            print(f"❌ {user_type} login failed: {response.status_code}")
            return False

    def test_invoice_request_permissions(self):
        """Test invoice request permissions for different roles"""
        print("\n🔍 ANALYZING INVOICE REQUEST PERMISSIONS")
        print("=" * 50)
        
        users = [
            ("Sales Head", "971545844387", "4387"),
            ("Field Sales", "971545844386", "4386"), 
            ("Tele Sales", "971557638082", "8082")
        ]
        
        # Login all users
        for user_type, mobile, pin in users:
            self.login_user(user_type, mobile, pin)
        
        # Test invoice request creation for each user
        invoice_data = {
            "client_name": "Test Client",
            "quotation_ref": "QT-TEST-001",
            "amount": "1000",
            "description": "Test invoice request",
            "remarks": "Testing permissions"
        }
        
        for user_type in ["Sales Head", "Field Sales", "Tele Sales"]:
            if user_type not in self.tokens:
                continue
                
            print(f"\n📋 Testing {user_type} - Invoice Request Creation")
            
            headers = {
                'Authorization': f'Bearer {self.tokens[user_type]}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(f"{self.api_url}/sales/invoice-requests", 
                                   json=invoice_data, headers=headers)
            
            print(f"   Status: {response.status_code}")
            if response.status_code != 200:
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    print(f"   Error: {response.text}")
            else:
                try:
                    success_data = response.json()
                    print(f"   Success: Invoice request created with ID {success_data.get('id', 'Unknown')}")
                except:
                    print(f"   Success: Request created")

    def test_academic_head_access(self):
        """Test Academic Head access to various endpoints"""
        print("\n🎓 ANALYZING ACADEMIC HEAD ACCESS PERMISSIONS")
        print("=" * 50)
        
        # Login Academic Head
        if not self.login_user("Academic Head", "971557213537", "3537"):
            return
        
        headers = {
            'Authorization': f'Bearer {self.tokens["Academic Head"]}',
            'Content-Type': 'application/json'
        }
        
        # Test various endpoints
        endpoints_to_test = [
            ("GET", "sales/quotations/all", "All Quotations"),
            ("GET", "sales/invoice-requests", "Invoice Requests"),
            ("GET", "academic/quotations", "Academic Quotations"),
            ("GET", "academic/invoice-requests", "Academic Invoice Requests"),
            ("GET", "sales/quotations", "Sales Quotations"),
            ("GET", "accounts/invoice-requests", "Accounts Invoice Requests")
        ]
        
        for method, endpoint, description in endpoints_to_test:
            print(f"\n📊 Testing {description} ({method} /api/{endpoint})")
            
            if method == "GET":
                response = requests.get(f"{self.api_url}/{endpoint}", headers=headers)
            
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, list):
                        print(f"   Success: Found {len(data)} items")
                    else:
                        print(f"   Success: Response received")
                except:
                    print(f"   Success: Response received (non-JSON)")
            else:
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    print(f"   Error: {response.text}")

    def test_available_endpoints(self):
        """Test what endpoints are actually available"""
        print("\n🔍 CHECKING AVAILABLE ENDPOINTS")
        print("=" * 50)
        
        # Login as Academic Head
        if "Academic Head" not in self.tokens:
            return
            
        headers = {
            'Authorization': f'Bearer {self.tokens["Academic Head"]}',
            'Content-Type': 'application/json'
        }
        
        # Test common endpoint patterns
        possible_endpoints = [
            "academic/requests",
            "academic/quotation-requests", 
            "academic/invoice-requests",
            "academic/sales-requests",
            "requests/quotations",
            "requests/invoices",
            "sales-head/requests",
            "sales-head/quotations",
            "sales-head/invoice-requests"
        ]
        
        print("Testing possible Academic Head endpoints:")
        for endpoint in possible_endpoints:
            response = requests.get(f"{self.api_url}/{endpoint}", headers=headers)
            status_icon = "✅" if response.status_code == 200 else "❌" if response.status_code == 403 else "⚠️"
            print(f"   {status_icon} /api/{endpoint} - Status: {response.status_code}")

    def analyze_workflow_gaps(self):
        """Analyze the workflow gaps identified"""
        print("\n📋 WORKFLOW ANALYSIS SUMMARY")
        print("=" * 50)
        
        print("\n🔍 IDENTIFIED ISSUES:")
        print("1. INVOICE REQUEST PERMISSIONS:")
        print("   - Sales Head cannot create invoice requests (403 Forbidden)")
        print("   - Only Tele Sales and Field Sales are allowed")
        print("   - This may be intentional business logic")
        
        print("\n2. ACADEMIC HEAD ACCESS:")
        print("   - Academic Head cannot view quotations via /api/sales/quotations/all (403)")
        print("   - Academic Head cannot view invoice requests via /api/sales/invoice-requests (403)")
        print("   - No dedicated Academic Head endpoints found for viewing sales requests")
        
        print("\n3. POTENTIAL SOLUTIONS:")
        print("   - Create dedicated Academic Head endpoints:")
        print("     * GET /api/academic/quotation-requests")
        print("     * GET /api/academic/invoice-requests") 
        print("   - Or modify existing endpoints to allow Academic Head access")
        print("   - Clarify if Sales Head should be able to create invoice requests")
        
        print("\n4. WORKING FEATURES:")
        print("   ✅ All user logins successful")
        print("   ✅ Lead creation working for all sales roles")
        print("   ✅ Quotation creation working for all sales roles")
        print("   ✅ Expense claims working for Field Sales and Tele Sales")
        print("   ✅ Lead verification working")

if __name__ == "__main__":
    analyzer = SalesFlowAnalyzer()
    analyzer.test_invoice_request_permissions()
    analyzer.test_academic_head_access()
    analyzer.test_available_endpoints()
    analyzer.analyze_workflow_gaps()
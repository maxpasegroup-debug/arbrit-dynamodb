#!/usr/bin/env python3
"""
Debug invoice request issue
"""

import requests
import json

# Login as Field Sales
login_response = requests.post("https://arbrit-safety-crm.preview.emergentagent.com/api/auth/login", 
                              json={"mobile": "971545844386", "pin": "4386"})

if login_response.status_code == 200:
    token = login_response.json()['token']
    print(f"✅ Logged in successfully")
    
    # Test invoice request
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    invoice_data = {
        "client_name": "Debug Test Client",
        "quotation_ref": "QT-DEBUG-001",
        "amount": "500.00",
        "description": "Debug test invoice",
        "remarks": "Testing for errors"
    }
    
    print(f"📋 Testing invoice request creation...")
    response = requests.post("https://arbrit-safety-crm.preview.emergentagent.com/api/sales/invoice-requests", 
                           json=invoice_data, headers=headers)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code != 200:
        print(f"❌ Error occurred")
    else:
        print(f"✅ Success")
else:
    print(f"❌ Login failed: {login_response.status_code}")
    print(f"Response: {login_response.text}")
# 🚨 CRITICAL WARNING - READ BEFORE ANY OPERATION 🚨

## 🔒 PROTECTED DATA - DO NOT TOUCH

### 35 USERS ARE LOCKED AND PROTECTED

**Database:** DynamoDB  
**Table Prefix:** arbrit_workdesk  
**User Count:** 35 (MUST ALWAYS BE 35)

---

## ⛔ ABSOLUTELY FORBIDDEN OPERATIONS:

1. ❌ **NEVER delete or modify ANY of the 35 users**
2. ❌ **NEVER run cleanup scripts on `users` or `employees` tables**
3. ❌ **NEVER alter mobile numbers or PINs without explicit user permission**
4. ❌ **NEVER use `delete_one`, `delete_many`, or `drop` on users/employees**
5. ❌ **NEVER run ANY script that could affect user data without validation first**

---

## ✅ REQUIRED BEFORE ANY DATABASE OPERATION:

1. ✅ **CHECK:** Verify user count is still 35
   ```bash
   curl -s "http://localhost:8001/api/health" | grep "user_count"
   ```

2. ✅ **VERIFY:** Review `/app/PROTECTED_USERS.json` 

3. ✅ **ASK USER:** Before ANY operation that touches users/employees tables

4. ✅ **VALIDATE:** Run validation script if available
   ```bash
   cd /app/backend && python3 validate_protected_users.py
   ```

---

## 📊 PROTECTED USERS BREAKDOWN:

### SALES TEAM (15 TOTAL):
- **Field Sales:** 6 executives
- **Tele Sales:** 8 executives  
- **Sales Head:** 1 (Mohammad Akbar)

### OTHER ROLES (20 TOTAL):
- Academic Team: 5
- Accounts: 2
- Trainers: 7
- HR: 1
- Management: 3 (MD, COO)
- Dispatch: 3

---

## 🔐 CREDENTIALS PROTECTION:

All 35 users have:
- ✅ User account (for login)
- ✅ Employee record (for assignments)
- ✅ Mobile number (login username)
- ✅ PIN (4-digit, last 4 digits of mobile)

**THESE ARE SACRED - PROTECT AT ALL COSTS**

---

## 📝 IF YOU NEED TO:

### Add New Features:
- ✅ Safe: Add new leads, quotations, invoices, training data
- ✅ Safe: Modify application logic, endpoints, UI
- ⚠️ Risky: Anything touching users/employees tables → ASK FIRST

### Debug Issues:
- ✅ Safe: Read user data for debugging
- ❌ Forbidden: Delete or modify user data
- ✅ Alternative: Create test users with different mobile numbers

### Clean Demo Data:
- ✅ Safe: Clean leads, quotations, invoices, payments
- ❌ Forbidden: Clean users or employees
- ✅ Required: Always exclude users/employees from cleanup

---

## 🆘 EMERGENCY RECOVERY:

If users are accidentally deleted:
1. **STOP IMMEDIATELY**
2. **NOTIFY USER**
3. **DO NOT** attempt to recreate users
4. Users have complete backup in `/app/PROTECTED_USERS.json`

---

## ⚖️ THIS IS A ZERO-TOLERANCE POLICY

**Any violation will result in:**
- Loss of user trust
- Need to restore from backup
- Potential data loss
- System downtime

**When in doubt → ASK THE USER**

---

Last Updated: 2025-12-04
Protected Users: 35
Database: DynamoDB (arbrit_workdesk)

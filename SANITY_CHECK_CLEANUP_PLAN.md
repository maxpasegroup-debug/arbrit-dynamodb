# 🧹 SANITY CHECK & DEMO DATA CLEANUP PLAN

## ⚠️ CRITICAL: READ BEFORE EXECUTION

**Purpose:** Clean ALL demo/test data while preserving the 35 users/employees and application structure

**Status:** ⏸️ PLAN ONLY - NOT EXECUTED YET - AWAITING USER APPROVAL

---

## 🔒 PROTECTED DATA (NEVER TOUCH):

### ABSOLUTELY FORBIDDEN TO DELETE:
1. ✅ **users** table - 35 users (LOCKED)
2. ✅ **employees** table - 35 employee records (LOCKED)
3. ✅ Application code, endpoints, frontend components
4. ✅ Configuration files (.env, package.json, requirements.txt)
5. ✅ Database connection settings

---

## 🧹 DATA TO BE CLEANED:

### SAFE TO DELETE (Demo/Test Data):
1. ✅ **leads** - All 9 leads (including TEST COMPANY)
2. ✅ **quotations** - 1 quotation (TEST COMPANY - 5000 AED)
3. ✅ **invoice_requests** - 1 invoice (TEST COMPANY - 5000 AED)
4. ✅ **payments** - 0 records (already empty)
5. ✅ **leave_requests** - All leave requests
6. ✅ **expense_claims** - All expense claims
7. ✅ **training_requests** - All training/trainer requests
8. ✅ **visit_logs** - All visit logs
9. ✅ **attendance** - All attendance records
10. ✅ **certificates** - All certificates
11. ✅ **certificate_candidates** - All certificate candidates
12. ✅ **duplicate_alerts** - All duplicate lead alerts (if any)
13. ✅ **lead_history** - All lead history records (if any)
14. ✅ **training_schedules** - All training schedules (if any)

---

## 📝 STEP-BY-STEP CLEANUP PROCEDURE:

### PHASE 1: PRE-CLEANUP VALIDATION (5 minutes)
**Purpose:** Ensure system is safe to clean

**Steps:**
1. ✅ Verify 35 users exist: `curl http://localhost:8001/api/health`
2. ✅ Check backend is running: `sudo supervisorctl status backend`
3. ✅ Check frontend is running: `sudo supervisorctl status frontend`
4. ✅ Read protection file: `/app/CRITICAL_WARNING_READ_FIRST.md`
5. ✅ Backup current data counts to file
6. ✅ Create backup timestamp

**Expected Output:**
- Backend: RUNNING
- Frontend: RUNNING
- User Count: 35
- All systems operational

---

### PHASE 2: DATA COUNTING & BACKUP (3 minutes)
**Purpose:** Document what exists before cleanup

**Steps:**
1. ✅ Count records in each table
2. ✅ Export counts to `/tmp/pre_cleanup_counts.json`
3. ✅ Log sample IDs from each table (first 3 records)

**Script:** `/app/backend/pre_cleanup_audit.py`

**Expected Output:**
```json
{
  "timestamp": "2025-12-04T...",
  "users": 35,
  "employees": 35,
  "leads": 9,
  "quotations": 1,
  "invoices": 1,
  "payments": 0,
  "leave_requests": 0,
  "expense_claims": 0,
  ...
}
```

---

### PHASE 3: CLEANUP EXECUTION (5 minutes)
**Purpose:** Delete all demo/test data

**Order of Operations:**
1. Delete **payments** (depends on invoices)
2. Delete **invoice_requests** (depends on quotations/leads)
3. Delete **quotations** (depends on leads)
4. Delete **training_schedules** (if any)
5. Delete **training_requests** (depends on leads)
6. Delete **visit_logs** (independent)
7. Delete **leave_requests** (independent)
8. Delete **expense_claims** (independent)
9. Delete **attendance** (independent)
10. Delete **certificates** (independent)
11. Delete **certificate_candidates** (independent)
12. Delete **duplicate_alerts** (depends on leads)
13. Delete **lead_history** (depends on leads)
14. Delete **leads** (LAST - everything depends on this)

**Method:** Loop through each table and delete records one by one (NOT delete_many)

**Script:** `/app/backend/execute_cleanup.py`

**Safety Checks During Cleanup:**
- ✅ After each deletion, verify user count = 35
- ✅ If user count ≠ 35, ABORT IMMEDIATELY
- ✅ Log each deletion operation
- ✅ Track deletion counts

---

### PHASE 4: POST-CLEANUP VALIDATION (5 minutes)
**Purpose:** Verify system integrity after cleanup

**Steps:**
1. ✅ Verify 35 users still exist
2. ✅ Verify 35 employees still exist
3. ✅ Verify all demo tables are empty
4. ✅ Test login with 3 sample users
5. ✅ Test backend endpoints still respond
6. ✅ Test frontend loads correctly
7. ✅ Export final counts to `/tmp/post_cleanup_counts.json`

**Test Users:**
- Brijith Shaji (MD): 971564022503 / PIN: 2503
- Mohammad Akbar (Sales Head): 971545844387 / PIN: 4387
- Sherook Mohammed (Field Sales): 971501631280 / PIN: 1280

**Script:** `/app/backend/post_cleanup_validation.py`

**Expected Output:**
- User Count: 35 ✅
- Employee Count: 35 ✅
- All demo tables: 0 records ✅
- All 3 test logins: SUCCESS ✅
- Backend health: OK ✅

---

### PHASE 5: FINAL REPORT (2 minutes)
**Purpose:** Generate cleanup report

**Report Contents:**
1. Pre-cleanup counts
2. Post-cleanup counts
3. Records deleted per table
4. User/employee integrity: VERIFIED
5. System status: OPERATIONAL
6. Any warnings or errors
7. Timestamp and duration

**Output File:** `/tmp/cleanup_report_[timestamp].txt`

---

## 🛡️ SAFETY MECHANISMS:

### Built-in Protections:
1. ✅ **User count check** before and after each operation
2. ✅ **No bulk delete** - delete one record at a time with validation
3. ✅ **Abort on error** - stop immediately if user count ≠ 35
4. ✅ **Detailed logging** - every operation logged
5. ✅ **Table exclusion** - users/employees tables explicitly excluded from cleanup
6. ✅ **Dry-run mode** - option to simulate without actually deleting

### Emergency Abort Conditions:
- ❌ User count ≠ 35
- ❌ Backend stops responding
- ❌ Critical error in DynamoDB connection
- ❌ Any table deletion affects users/employees

---

## 📊 EXPECTED RESULTS:

### BEFORE CLEANUP:
```
Users:              35 (PROTECTED)
Employees:          35 (PROTECTED)
Leads:              9
Quotations:         1
Invoices:           1
Payments:           0
Leave Requests:     0
Expense Claims:     0
Other Tables:       Various
```

### AFTER CLEANUP:
```
Users:              35 (PROTECTED) ✅
Employees:          35 (PROTECTED) ✅
Leads:              0 ✅
Quotations:         0 ✅
Invoices:           0 ✅
Payments:           0 ✅
Leave Requests:     0 ✅
Expense Claims:     0 ✅
Other Tables:       0 ✅
```

---

## 🔧 SCRIPTS TO BE CREATED:

### 1. `/app/backend/pre_cleanup_audit.py`
- Count all records
- Export to JSON
- Verify user count = 35

### 2. `/app/backend/execute_cleanup.py`
- Delete demo data in correct order
- Validate user count after each step
- Log all operations
- Abort on any error

### 3. `/app/backend/post_cleanup_validation.py`
- Verify user count = 35
- Test sample logins
- Check all demo tables = 0
- Generate final report

### 4. `/app/backend/master_cleanup_orchestrator.py`
- Execute all phases in sequence
- Handle errors gracefully
- Generate comprehensive report

---

## ⏱️ ESTIMATED TIMELINE:

| Phase | Duration | Description |
|-------|----------|-------------|
| Phase 1 | 5 min | Pre-cleanup validation |
| Phase 2 | 3 min | Data counting & backup |
| Phase 3 | 5 min | Cleanup execution |
| Phase 4 | 5 min | Post-cleanup validation |
| Phase 5 | 2 min | Final report generation |
| **TOTAL** | **20 min** | Complete sanity check |

---

## 🚦 EXECUTION COMMAND (WHEN APPROVED):

```bash
# Step 1: Create all cleanup scripts
cd /app/backend

# Step 2: Run master orchestrator (will execute all phases)
python3 master_cleanup_orchestrator.py --confirm

# Step 3: Review report
cat /tmp/cleanup_report_*.txt
```

---

## ✅ SUCCESS CRITERIA:

1. ✅ User count remains 35 throughout
2. ✅ Employee count remains 35 throughout
3. ✅ All demo data tables = 0 records
4. ✅ Backend remains operational
5. ✅ Frontend remains operational
6. ✅ Sample logins work correctly
7. ✅ No errors in cleanup log
8. ✅ All 35 users can still login

---

## 🆘 ROLLBACK PLAN (IF NEEDED):

**If anything goes wrong:**
1. **STOP IMMEDIATELY** - Don't continue cleanup
2. **Check user count** - Verify 35 users still exist
3. **Contact user** - Report what went wrong
4. **Review logs** - Check `/tmp/cleanup_log.txt`
5. **No manual fixes** - Let user decide next steps

**Important:** There is NO automatic rollback for deleted data. Once deleted, demo data is gone. But users/employees are PROTECTED and will never be touched.

---

## 📌 IMPORTANT NOTES:

1. **This is a ONE-WAY operation** - Deleted demo data cannot be recovered
2. **Users/employees are SAFE** - Multiple protections in place
3. **System will remain functional** - Only data is deleted, not structure
4. **New data can be added immediately** - System ready for fresh data
5. **All 35 users can login** - Credentials unchanged

---

**Status:** ⏸️ AWAITING USER APPROVAL TO PROCEED

**Last Updated:** 2025-12-04  
**Prepared By:** Neo (E1 Agent)  
**Protected Users:** 35  
**Database:** DynamoDB (arbrit_workdesk)

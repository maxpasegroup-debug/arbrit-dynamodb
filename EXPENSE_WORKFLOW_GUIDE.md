# 💰 Expense Claims Workflow - Where Do They Appear?

## 📋 Quick Answer

**When you submit an expense claim, it appears in:**

1. **Your Dashboard** → "My Expenses" tab (to track your own submissions)
2. **Department Head's Dashboard** → "Approve Expenses" tab (for approval)
3. **HR Dashboard** → "HR Review" section (after dept head approval)
4. **Accounts Dashboard** → "Accounts Payment" section (after HR approval)

---

## 🔄 Complete Expense Claim Workflow

### Step 1: Employee Submits Claim
**Who:** Any employee (Field Sales, Tele Sales, Trainers, MD, COO, etc.)  
**Where:** Click "Submit Expense" button on their dashboard  
**Status:** `PENDING_DEPT_HEAD` or `PENDING_HR` (if submitter is dept head)

**Appears In:**
- ✅ **Submitter's Dashboard** → "My Expenses" tab
- ✅ **Department Head's Dashboard** → "Approve Expenses" tab

---

### Step 2: Department Head Reviews
**Who:** Sales Head, Academic Head, HR Manager, Accounts Head, Dispatch Head, COO, MD  
**Where:** Their dashboard → "Approve Expenses" tab  
**Action:** Approve or Reject

**If Approved:**
- Status changes to: `PENDING_HR`
- Moves to HR review queue

**If Rejected:**
- Status changes to: `REJECTED`
- Employee can see rejection in "My Expenses"

**Appears In:**
- ✅ **HR Dashboard** → "HR Review" tab (if approved)
- ✅ **Submitter's Dashboard** → "My Expenses" (updated status)

---

### Step 3: HR Reviews
**Who:** HR, COO, MD  
**Where:** Their dashboard → "HR Review" section  
**Action:** Approve or Reject

**If Approved:**
- Status changes to: `PENDING_ACCOUNTS`
- Moves to accounts payment queue

**If Rejected:**
- Status changes to: `REJECTED`

**Appears In:**
- ✅ **Accounts Dashboard** → "Accounts Payment" section (if approved)
- ✅ **Submitter's Dashboard** → "My Expenses" (updated status)

---

### Step 4: Accounts Processes Payment
**Who:** Accounts Head, Accountant, COO, MD  
**Where:** Accounts Dashboard → "Accounts Payment" section  
**Action:** Mark as Paid with payment details

**After Payment:**
- Status changes to: `PAID`
- Payment date and reference recorded

**Appears In:**
- ✅ **Submitter's Dashboard** → "My Expenses" (shows as PAID)

---

## 📊 Where Each Role Sees Expenses

### MD (Managing Director)
**Can See:**
- ✅ **Submit Expense** button (on dashboard)
- ✅ **My Expenses** tab - Own submitted claims
- ✅ **Approve Expenses** tab - All pending dept head approvals
- ✅ **HR Review** section - All pending HR approvals
- ✅ **Accounts Payment** section - All pending payments

**Note:** MD has access to ALL stages of expense workflow

---

### COO (Chief Operating Officer)
**Can See:**
- ✅ **Submit Expense** button
- ✅ **My Expenses** tab
- ✅ **Approve Expenses** tab - All dept head level
- ✅ **HR Review** section
- ✅ **Accounts Payment** section

**Note:** COO has full oversight like MD

---

### Sales Head / Academic Head / Department Heads
**Can See:**
- ✅ **Submit Expense** button
- ✅ **My Expenses** tab
- ✅ **Approve Expenses** tab - Only their department's claims
- ❌ Cannot see HR or Accounts stages

**Example:** Sales Head sees:
- Own expense claims in "My Expenses"
- Sales team's claims in "Approve Expenses"

---

### HR Manager
**Can See:**
- ✅ **Submit Expense** button
- ✅ **My Expenses** tab
- ✅ **HR Review** section - All claims pending HR approval

**Note:** HR doesn't see dept head approval stage

---

### Accounts Head / Accountant
**Can See:**
- ✅ **Submit Expense** button
- ✅ **My Expenses** tab
- ✅ **Accounts Payment** section - All claims pending payment

**Note:** Accounts only sees claims after HR approval

---

### Regular Employees (Field Sales, Tele Sales, Trainers, etc.)
**Can See:**
- ✅ **Submit Expense** button
- ✅ **My Expenses** tab - Only their own claims

**Cannot See:**
- ❌ Other employees' claims
- ❌ Approval queues
- ❌ Payment processing

---

## 🔍 How to Find Your Submitted Expenses

### For Submitter (You):
1. Go to your dashboard
2. Look for **"My Expenses"** tab/section
3. You'll see all your submitted claims with their current status:
   - `PENDING_DEPT_HEAD` - Waiting for department head approval
   - `PENDING_HR` - Waiting for HR approval
   - `PENDING_ACCOUNTS` - Waiting for payment processing
   - `PAID` - Payment completed
   - `REJECTED` - Claim rejected (with remarks)

### For Approvers:
**Department Heads:**
- Dashboard → **"Approve Expenses"** tab
- Shows claims with status `PENDING_DEPT_HEAD`

**HR:**
- Dashboard → **"HR Review"** section
- Shows claims with status `PENDING_HR`

**Accounts:**
- Dashboard → **"Accounts Payment"** section
- Shows claims with status `PENDING_ACCOUNTS`

---

## 📱 Dashboard Tabs & Sections

### MD Dashboard
```
Tabs Available:
- Dashboard (Overview)
- Deletion Approvals
- My Expenses          ← YOUR SUBMITTED CLAIMS
- Approve Expenses     ← CLAIMS TO APPROVE
- HR Review           ← CLAIMS FOR HR
- Accounts Payment    ← CLAIMS TO PAY
```

### Sales Head Dashboard
```
Tabs Available:
- Overview
- Team
- Leads
- Quotations
- Requests
- Leaves
- My Expenses          ← YOUR CLAIMS
- Approve Expenses     ← YOUR TEAM'S CLAIMS
```

### Field Sales / Tele Sales Dashboard
```
Tabs Available:
- Overview
- Leads
- Quotations
- Requests
- My Expenses          ← YOUR CLAIMS
- My Leaves
```

---

## 🔔 Important Notes

### Expense Status Flow
```
SUBMITTED
    ↓
PENDING_DEPT_HEAD (If regular employee)
    ↓ (Dept Head Approves)
PENDING_HR
    ↓ (HR Approves)
PENDING_ACCOUNTS
    ↓ (Accounts Pays)
PAID ✅

OR

REJECTED ❌ (Can be rejected at any stage)
```

### Special Cases

**If Submitter is Department Head:**
- Claim goes directly to `PENDING_HR` (skips dept head approval)
- Example: Sales Head submits → goes straight to HR

**If Claim is Rejected:**
- Status becomes `REJECTED`
- Rejection remarks visible in "My Expenses"
- Employee can see who rejected and why

### Access Levels
- **MD & COO:** See EVERYTHING at all stages
- **Department Heads:** See own + department's claims
- **HR:** See only HR stage
- **Accounts:** See only payment stage
- **Employees:** See only own claims

---

## 🧪 Testing the Workflow

### Test as MD:
1. Submit expense → Check "My Expenses" tab
2. It should appear in "Approve Expenses" immediately (because you're MD)
3. Approve it → Moves to "HR Review"
4. Approve in HR → Moves to "Accounts Payment"
5. Mark as paid → Shows as PAID in "My Expenses"

### Test as Regular Employee (e.g., Field Sales):
1. Submit expense → Check "My Expenses" tab
2. Status will be "PENDING_DEPT_HEAD"
3. Only Sales Head can see and approve it
4. After approval, status changes (employee can track in "My Expenses")

---

## 📞 Quick Reference

**Question:** "I submitted an expense, where is it?"
**Answer:** Check your dashboard's **"My Expenses"** tab

**Question:** "I'm Sales Head, where do I approve expenses?"
**Answer:** Your dashboard → **"Approve Expenses"** tab

**Question:** "Can I see other people's expenses?"
**Answer:** 
- Regular employees: No
- Department Heads: Yes, your department only
- MD/COO: Yes, everyone's

**Question:** "My claim is stuck, how do I check status?"
**Answer:** Dashboard → "My Expenses" → Check the status column

---

## 🎯 Summary Table

| Role | Submit | View Own | Approve Dept | HR Review | Accounts Pay |
|------|--------|----------|--------------|-----------|--------------|
| MD | ✅ | ✅ | ✅ All | ✅ All | ✅ All |
| COO | ✅ | ✅ | ✅ All | ✅ All | ✅ All |
| Sales Head | ✅ | ✅ | ✅ Sales only | ❌ | ❌ |
| HR | ✅ | ✅ | ❌ | ✅ All | ❌ |
| Accounts Head | ✅ | ✅ | ❌ | ❌ | ✅ All |
| Field Sales | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tele Sales | ✅ | ✅ | ❌ | ❌ | ❌ |

---

*For any issues with expense workflow, check the backend logs or contact system administrator.*

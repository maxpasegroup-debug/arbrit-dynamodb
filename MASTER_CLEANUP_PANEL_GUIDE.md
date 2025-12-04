# 🧹 Master Cleanup Panel - User Guide

## Overview

The **Master Cleanup Panel** is a powerful admin tool available only to MD/CEO users that allows comprehensive data management across the entire CRM system.

---

## Access

**Who can use it:** MD / CEO only

**How to access:**
1. Login as MD (Brijith Shaji: 971564022503 / PIN: 2503)
2. Navigate to MD Dashboard
3. Click on the **"Admin Cleanup"** tab

---

## Features

### 1. 🔍 Employee-Specific Data Management

**View data for any employee:**
- Select an employee from the left panel
- See all data associated with that employee, categorized by type
- View sample records for each category

**Data Categories:**
- 📋 **Leads Assigned** - Leads assigned to the employee
- ✏️ **Leads Created** - Leads created by the employee
- 📄 **Quotations** - Quotations submitted by the employee
- 💰 **Invoices** - Invoice requests from the employee
- 🏖️ **Leave Requests** - Leave applications
- 💸 **Expense Claims** - Expense reimbursement requests
- 📍 **Visit Logs** - Field visit records
- 📊 **Attendance Records** - Daily attendance logs

**Delete specific data:**
- Click the "Delete" button next to any category
- Confirmation dialog ensures accidental deletions are prevented
- Only categories with data will show the delete button

---

### 2. 🗑️ System-Wide Cleanup

**Cleanup All System Data:**
- Red button at the top right: "Cleanup All System Data"
- Deletes ALL demo/business data from the entire system
- **Protected:** 35 users and employees are NEVER deleted

**What gets deleted:**
- All leads
- All quotations
- All invoices
- All payments
- All leave requests
- All expense claims
- All training requests
- All visit logs
- All attendance records
- All certificates
- All other business data

**What stays protected:**
- ✅ All 35 users
- ✅ All 35 employee records
- ✅ Application structure
- ✅ Database schema
- ✅ User credentials

---

## Use Cases

### Use Case 1: Remove Demo Data for Specific Employee
**Scenario:** You want to clean up test data created by a specific sales person.

**Steps:**
1. Select the employee from the list
2. Review their associated data
3. Click "Delete" on specific categories (e.g., Leads Assigned, Quotations)
4. Confirm the deletion
5. Data is removed instantly

---

### Use Case 2: Clean Entire System Before Production
**Scenario:** System has demo data and you want a fresh start.

**Steps:**
1. Click "Cleanup All System Data" button
2. Review the warning message
3. Confirm the cleanup
4. All demo data is removed while protecting users

---

### Use Case 3: Remove Employee's Old Records
**Scenario:** An employee has old/obsolete records you want to remove.

**Steps:**
1. Select the employee
2. Review data counts for each category
3. Delete only the categories with old data
4. Employee can continue working with fresh data

---

## Safety Features

### ⚠️ Built-in Protections

1. **Double Confirmation**
   - All deletions require confirmation
   - Clear warnings about what will be deleted

2. **User Protection**
   - 35 users/employees are NEVER deleted
   - Only business data is affected

3. **Role-Based Access**
   - Only MD/CEO can access this panel
   - Other users cannot see or use these features

4. **Detailed Feedback**
   - Success/error messages for all operations
   - View sample records before deletion

5. **Selective Deletion**
   - Delete only specific data types
   - No need to delete everything

---

## API Endpoints (For Reference)

### Get Employee Data
```
GET /api/admin/employee-data/{employee_id}
```
Returns all data associated with an employee.

### Delete Employee-Specific Data
```
DELETE /api/admin/employee-data/{employee_id}/{data_type}
```
Deletes specific data type for an employee.

**Valid data_types:**
- leads_assigned
- leads_created
- quotations
- invoices
- leave_requests
- expense_claims
- visit_logs
- attendance

### Cleanup All System Data
```
DELETE /api/admin/cleanup-demo-data
```
Deletes all business data while protecting users.

---

## Important Notes

1. **Irreversible Operations**
   - Deleted data CANNOT be recovered
   - Make backups if needed before cleanup

2. **Production Use**
   - Use with caution in production environments
   - Always confirm deletions carefully

3. **User Data Safety**
   - The 35 users/employees are ALWAYS protected
   - No risk of losing user accounts or credentials

4. **Real-Time Updates**
   - After deletion, refresh the employee view to see updated counts
   - System updates immediately

---

## Troubleshooting

**Q: I don't see the "Admin Cleanup" tab**
- A: This tab is only visible to MD/CEO users. Login as Brijith Shaji.

**Q: Delete button is disabled**
- A: The button is only shown for categories with data (count > 0).

**Q: Error during deletion**
- A: Check your network connection and try again. Contact support if error persists.

**Q: Can I recover deleted data?**
- A: No, deletions are permanent. Always confirm before deleting.

---

## Best Practices

1. **Regular Cleanup**
   - Clean test/demo data periodically
   - Keep system organized and fast

2. **Selective Deletion**
   - Use employee-specific deletion for targeted cleanup
   - Use system-wide cleanup only when needed

3. **Review Before Delete**
   - Always review the sample records shown
   - Ensure you're deleting the right data

4. **Fresh Start**
   - Use system-wide cleanup before major deployments
   - Gives you a clean slate for production

---

## Support

For issues or questions about the Master Cleanup Panel, contact your system administrator.

**Last Updated:** 2025-12-04  
**Version:** 1.0  
**Access Level:** MD/CEO Only

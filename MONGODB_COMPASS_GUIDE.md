# MongoDB Compass Export Guide

## Visual Browser-Based Data Export

### Step 1: Download MongoDB Compass
- Visit: https://www.mongodb.com/try/download/compass
- Download for macOS
- Install the application

### Step 2: Connect to Your Database

1. Open MongoDB Compass
2. You'll see a connection screen
3. Paste your connection string:
   ```
   mongodb+srv://arbrit-workdesk:d4dmc1clqs2c73be45bg@customer-apps.6t1bzr.mongodb.net/
   ```
4. Click "Connect"

### Step 3: Browse Your Database

1. In the left sidebar, expand "customer-apps"
2. Click on "arbrit-workdesk" database
3. You'll see all 23 collections listed

### Step 4: Export Collections

For each collection you want to export:

1. Click on the collection name (e.g., "users")
2. Browse the documents visually
3. Click "Export Data" button (top right)
4. Choose format:
   - **JSON** - Best for backup/migration
   - **CSV** - Good for Excel/analysis
5. Choose location to save
6. Click "Export"

### Step 5: Repeat for All Collections

Collections to export:
- ☐ users
- ☐ employees
- ☐ attendance
- ☐ employee_documents
- ☐ company_documents
- ☐ leads
- ☐ quotations
- ☐ invoices
- ☐ invoice_requests
- ☐ payments
- ☐ training_sessions
- ☐ certificate_requests
- ☐ certificates
- ☐ certificate_templates
- ☐ certificate_candidates
- ☐ trainer_requests
- ☐ work_orders
- ☐ assessment_forms
- ☐ assessment_submissions
- ☐ visit_logs
- ☐ expense_claims
- ☐ leave_requests
- ☐ delivery_tasks

---

## Alternative: MongoDB Atlas Web UI

### Quick Browser Export (No Installation)

1. Go to: https://cloud.mongodb.com/
2. Login with your MongoDB Atlas account
3. Select your project
4. Click on "Database" in left menu
5. Click "Browse Collections" on your cluster
6. Navigate to "arbrit-workdesk" database
7. Select a collection
8. Click "Export Collection" button
9. Download as JSON or CSV

---

## Comparison

| Method | Pros | Cons |
|--------|------|------|
| **MongoDB Compass** | Beautiful GUI, Visual data browser, Easy export | Manual per collection |
| **Atlas Web UI** | No installation, Browser only | Manual per collection, Limited features |
| **Python Script** | Exports all 23 collections automatically | Command line, Requires pymongo |
| **Bash Script** | Fast, Native MongoDB tools | Requires MongoDB tools installation |

---

## Recommendation

- **For browsing/exploring**: Use MongoDB Compass or Atlas Web UI
- **For full backup**: Use Python script (automated, exports all collections)
- **For selective export**: Use MongoDB Compass (best visual experience)

---

## Security Note

When using MongoDB Compass:
- Your credentials are stored securely in Compass
- No need to expose credentials in scripts
- Can save favorite connections
- Supports SSH tunnels and advanced auth



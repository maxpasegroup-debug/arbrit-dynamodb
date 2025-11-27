# AWS Deployment Checklist ✅

## Pre-Deployment Verification

### ✅ Local Testing Status
- [x] Backend starts successfully with DynamoDB
- [x] Login API works (tested with COO user)
- [x] Frontend connects to backend
- [x] Dark theme working on expenses components
- [x] No MongoDB references in code
- [x] All 12 DynamoDB tables created in us-east-1

### ✅ Code Changes Ready
- [x] MongoDB completely removed
- [x] DynamoDB client implemented
- [x] AWS credentials configured
- [x] Requirements.txt updated
- [x] .to_list() and projection compatibility added

---

## Deployment Steps

### Step 1: Push Code to GitHub
1. Click **"Save to GitHub"** button in Emergent interface
2. Select repository: `arbrit-dynamodb`
3. Select branch: `main` (or your deployment branch)
4. Click "PUSH TO GITHUB"

### Step 2: Configure AWS Environment Variables
Your AWS deployment MUST have these environment variables:

```bash
# Required - DynamoDB Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXUYGPVORP4JKXL37
AWS_SECRET_ACCESS_KEY=RxbQGlvjqx90TnQ9mDg1taqw2nA94WXjYIWs0O+g
DYNAMODB_TABLE_PREFIX=arbrit_workdesk

# Required - Application Configuration
CORS_ORIGINS=*
JWT_SECRET_KEY=arbrit-jwt-secret-key-change-in-production-2025

# Frontend (if separate deployment)
REACT_APP_BACKEND_URL=https://your-backend-url.com
```

### Step 3: Update AWS Deployment
1. Pull latest code from GitHub in your AWS environment
2. **Backend:**
   ```bash
   cd /path/to/backend
   pip install -r requirements.txt
   # Restart your backend service
   ```
3. **Frontend:**
   ```bash
   cd /path/to/frontend
   npm install  # or yarn install
   npm run build  # or yarn build
   # Deploy build folder
   ```

### Step 4: Verify DynamoDB Tables
Log into AWS Console → DynamoDB → Tables

Verify these 12 tables exist in **us-east-1**:
- ✅ arbrit_workdesk_users
- ✅ arbrit_workdesk_employees
- ✅ arbrit_workdesk_attendance
- ✅ arbrit_workdesk_quotations
- ✅ arbrit_workdesk_invoices
- ✅ arbrit_workdesk_certificates
- ✅ arbrit_workdesk_certificate_candidates
- ✅ arbrit_workdesk_expense_claims
- ✅ arbrit_workdesk_leads
- ✅ arbrit_workdesk_trainer_requests
- ✅ arbrit_workdesk_visit_logs
- ✅ arbrit_workdesk_leave_requests

**Note:** These tables were already created by the migration script. They contain:
- 2 users (COO: 971566374020, MD: 971564022503)

---

## Post-Deployment Testing

### Test 1: Health Check
```bash
curl https://your-aws-backend-url.com/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "database_type": "DynamoDB",
  "region": "us-east-1",
  "table_prefix": "arbrit_workdesk",
  "user_count": 2,
  "message": "Backend and DynamoDB are operational"
}
```

### Test 2: Login
```bash
curl -X POST https://your-aws-backend-url.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobile":"971566374020","pin":"4020"}'
```

**Expected Response:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "mobile": "971566374020",
    "name": "Sarada Gopalakrishnan",
    "role": "COO"
  }
}
```

### Test 3: Frontend Access
1. Go to your frontend URL
2. Login with: 971566374020 / PIN: 4020
3. Verify COO Dashboard loads
4. Check Expenses tab has dark theme

---

## Common Issues & Solutions

### Issue 1: "ResourceNotFoundException"
**Problem:** DynamoDB tables not found
**Solution:** 
- Verify AWS_REGION is set to "us-east-1"
- Verify DYNAMODB_TABLE_PREFIX is "arbrit_workdesk"
- Check tables exist in AWS Console

### Issue 2: "UnrecognizedClientException"
**Problem:** Invalid AWS credentials
**Solution:**
- Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set correctly
- Check credentials haven't been revoked in AWS IAM

### Issue 3: Backend won't start
**Problem:** Missing dependencies or wrong Python version
**Solution:**
```bash
pip install --upgrade pip
pip install -r requirements.txt
# Verify no pymongo or motor packages exist
pip list | grep -E "pymongo|motor"  # Should return nothing
```

### Issue 4: Frontend can't connect to backend
**Problem:** CORS or wrong backend URL
**Solution:**
- Verify REACT_APP_BACKEND_URL points to correct backend
- Verify CORS_ORIGINS includes your frontend domain
- Check backend is running and accessible

---

## Rollback Plan

If deployment fails, you can rollback by:

1. **In Emergent:** Use the rollback feature to previous checkpoint
2. **In AWS:** Revert to previous git commit and redeploy
3. **MongoDB Restoration:** If you need MongoDB temporarily:
   - Git checkout to commit before migration
   - Redeploy
   - (Not recommended - DynamoDB is the correct path)

---

## Important Notes

### ⚠️ DO NOT:
- Add MongoDB packages back to requirements.txt
- Use MongoDB connection strings
- Deploy without setting AWS credentials
- Use different AWS regions (tables are in us-east-1)

### ✅ DO:
- Keep AWS credentials secure (use environment variables, not hardcoded)
- Monitor DynamoDB costs in AWS Billing dashboard
- Use Emergent's "Save to GitHub" for version control
- Test health endpoint after each deployment

---

## AWS IAM Permissions Required

Your AWS user (AKIAXUYGPVORP4JKXL37) needs these DynamoDB permissions:
- `dynamodb:GetItem`
- `dynamodb:PutItem`
- `dynamodb:UpdateItem`
- `dynamodb:DeleteItem`
- `dynamodb:Scan`
- `dynamodb:Query`

These permissions should already be configured based on successful local testing.

---

## Success Criteria

Your deployment is successful when:
- ✅ Health endpoint returns "healthy" status
- ✅ Login works with test credentials
- ✅ Frontend loads and displays dashboard
- ✅ No MongoDB error messages in logs
- ✅ DynamoDB operations show in AWS CloudWatch logs

---

## Support

If you encounter issues:
1. Check AWS CloudWatch logs for DynamoDB errors
2. Check backend application logs
3. Verify all environment variables are set
4. Test with curl commands above
5. Contact AWS support if IAM/DynamoDB access issues

---

**Deployment Readiness: ✅ READY TO DEPLOY**

All code changes are complete, tested locally, and ready for AWS deployment.

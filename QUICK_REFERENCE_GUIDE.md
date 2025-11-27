# 🎯 Quick Reference Guide - Arbrit Safety Dashboard

## 🔑 Test Credentials

### Critical User Accounts
```
MD (Managing Director)
Mobile: 971564022503
PIN: 2503

COO (Chief Operating Officer)
Mobile: 971566374020
PIN: 4020

Sales Head
Mobile: 971545844387
PIN: 4387

Accounts Head
Mobile: 919061295668
PIN: 5668
```

---

## 📊 Current Data Summary

- **Total Users:** 35
- **Total Employees:** 35
- **Total Leads:** 5
- **Sales Team Members:** ~15 (Field Sales + Tele Sales)

---

## 🔍 Quick Health Checks

### 1. Backend Health Check
```bash
curl http://your-domain.com/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "database_type": "DynamoDB",
  "user_count": 35
}
```

### 2. Test Login (MD)
```bash
curl -X POST http://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobile":"971564022503","pin":"2503"}'
```

**Expected:** Returns JWT token and user details

### 3. Verify User Count
```bash
python3 backend/verify_users.py
```

**Expected:** Shows all 35 users listed

---

## 🏗️ Architecture Overview

### Backend
- **Framework:** FastAPI
- **Port:** 8001
- **Database:** AWS DynamoDB
- **Authentication:** JWT (24-hour expiry)
- **Logs:** `/var/log/supervisor/backend.*.log`

### Frontend
- **Framework:** React 18
- **Port:** 3000
- **State Management:** React Context
- **Routing:** React Router

### Database Tables (DynamoDB)
```
arbrit_workdesk_users           (35 records)
arbrit_workdesk_employees       (35 records)
arbrit_workdesk_leads          (5 records)
arbrit_workdesk_expenses
arbrit_workdesk_settings
... and 7 more tables
```

---

## 🔧 Common Commands

### Restart Services
```bash
# Restart backend
sudo supervisorctl restart backend

# Restart frontend
sudo supervisorctl restart frontend

# Check status
sudo supervisorctl status
```

### View Logs
```bash
# Backend logs
tail -f /var/log/supervisor/backend.out.log

# Backend errors
tail -f /var/log/supervisor/backend.err.log

# Last 100 lines
tail -n 100 /var/log/supervisor/backend.out.log
```

### Verify Users
```bash
cd /app/backend
python3 verify_users.py
```

---

## 📱 Dashboard Features by Role

### MD (Managing Director)
- ✅ Executive Intelligence Panel
- ✅ Corporate Health Score
- ✅ Executive Analytics (workforce, sales)
- ✅ Access to all dashboards
- ✅ Submit leads and expenses
- ✅ View all employees
- ✅ Access control panel

### COO (Chief Operating Officer)
- ✅ Operations dashboard
- ✅ Expense approvals
- ✅ Workforce overview
- ✅ Access to employee data
- ✅ Lead tracking

### Sales Head
- ✅ Sales dashboard
- ✅ Lead management (all leads)
- ✅ Create self leads
- ✅ My Leads Tracker widget
- ✅ Sales Performance Leaderboard
- ✅ Sales team overview
- ✅ Assign leads to team members

### Field Sales / Tele Sales
- ✅ Personal dashboard
- ✅ My leads view
- ✅ Lead creation (self)
- ✅ Personal performance tracking
- ✅ Lead status updates

---

## 🐛 Troubleshooting

### Problem: Can't Login
**Solutions:**
1. Verify mobile number matches exactly (no spaces/dashes)
2. Check PIN is correct (usually last 4 digits of mobile)
3. Ensure backend service is running: `sudo supervisorctl status backend`
4. Check backend logs for errors

### Problem: Dashboard Not Loading Data
**Solutions:**
1. Check browser console for API errors (F12)
2. Verify backend health: `curl http://localhost:8001/api/health`
3. Check DynamoDB connection in backend logs
4. Ensure JWT token is valid (try logging out and back in)

### Problem: "User Not Found" Error
**Solutions:**
1. Run user verification: `python3 backend/verify_users.py`
2. Check if user exists in DynamoDB with correct mobile number
3. Review backend logs for database errors
4. Verify AWS credentials are set correctly

### Problem: Backend Service Not Starting
**Solutions:**
1. Check error logs: `tail -n 50 /var/log/supervisor/backend.err.log`
2. Verify environment variables in `/app/backend/.env`
3. Check DynamoDB credentials are valid
4. Ensure Python dependencies are installed

---

## 🔒 Security Notes

### Environment Variables (.env)
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXX...
AWS_SECRET_ACCESS_KEY=RxbQG...
DYNAMODB_TABLE_PREFIX=arbrit_workdesk
JWT_SECRET_KEY=arbrit-jwt-secret-key-change-in-production-2025
CORS_ORIGINS=*
```

**⚠️ Important:**
- Never commit `.env` files to git
- Change JWT_SECRET_KEY in production
- Use IAM roles instead of access keys when possible
- Restrict CORS_ORIGINS in production

### User Data Protection
- All passwords hashed with bcrypt
- JWT tokens expire after 24 hours
- No sensitive data in logs
- PIN validation happens server-side
- Failed login attempts are logged

---

## 📈 Performance Notes

### Current Status
- ✅ Fast login (< 1 second)
- ⚠️ User lookup by ID does full table scan (acceptable for 35 users)
- ✅ All dashboard queries optimized
- ✅ No blocking operations

### Future Optimization (Optional)
1. Create GSI on `id` field in users table
2. Implement caching for frequently accessed data
3. Add connection pooling
4. Consider DynamoDB auto-scaling

---

## 📞 Emergency Contacts

### If Users Are Missing
```bash
# Check backup reference
cat /app/USER_BACKUP_REFERENCE.json

# Verify current count
python3 backend/verify_users.py
```

### If Database Connection Fails
1. Check AWS credentials in `.env`
2. Verify DynamoDB tables exist in AWS console
3. Check IAM permissions
4. Review backend error logs

---

## 🚀 Deployment Workflow

1. **Pre-Deployment Check**
   ```bash
   python3 backend/verify_users.py
   curl http://localhost:8001/api/health
   ```

2. **Deploy to AWS**
   - Push code to repository
   - AWS will auto-deploy
   - Wait for build completion

3. **Post-Deployment Verification**
   ```bash
   curl https://your-domain.com/api/health
   ```
   - Test MD login on production
   - Verify dashboard loads

4. **Rollback (if needed)**
   - Use Emergent platform's rollback feature
   - No git commands needed

---

## 📝 API Endpoints Quick Reference

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Leads
- `GET /api/sales/leads` - All leads (Sales Head, COO, MD)
- `GET /api/sales/my-leads` - My leads

### Employees
- `GET /api/employees` - All employees
- `GET /api/employees/sales-team` - Sales team only

### Health
- `GET /api/health` - System health status

---

## 💡 Best Practices

### For Development
- Always run `verify_users.py` after database changes
- Check backend logs after any authentication changes
- Test with multiple roles (MD, Sales Head, etc.)
- Never hardcode credentials

### For Deployment
- Verify user count before deploying
- Test critical flows in staging first
- Monitor logs after deployment
- Have rollback plan ready

### For Maintenance
- Regular backup of user list
- Monitor DynamoDB table sizes
- Review logs for errors
- Update dependencies regularly

---

*Last Updated: November 27, 2025*

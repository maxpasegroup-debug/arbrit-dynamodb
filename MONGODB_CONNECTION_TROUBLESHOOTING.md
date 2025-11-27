# MongoDB Connection Troubleshooting Guide

## Error: "Failed to connect to customer-apps.6t1bzr.mongodb.net"

### Most Common Causes & Solutions

---

## ✅ Solution 1: IP Whitelist (90% of cases)

MongoDB Atlas blocks connections from IP addresses that aren't whitelisted.

### Steps to Fix:

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com/
2. **Login** with your credentials
3. Click **"Network Access"** in the left sidebar (under Security)
4. Check if your current IP is listed
5. If not, click **"Add IP Address"**
6. Choose one:
   - **"Add Current IP Address"** - Recommended for security
   - **"Allow Access from Anywhere" (0.0.0.0/0)** - Use for testing only

### Check Your Current IP:
```bash
curl ifconfig.me
```

---

## ✅ Solution 2: Correct Connection String Format

### For MongoDB Compass - Try These Variations:

#### Option A: With Database Name
```
mongodb+srv://arbrit-workdesk:d4dmc1clqs2c73be45bg@customer-apps.6t1bzr.mongodb.net/arbrit-workdesk?retryWrites=true&w=majority
```

#### Option B: Without Extra Parameters
```
mongodb+srv://arbrit-workdesk:d4dmc1clqs2c73be45bg@customer-apps.6t1bzr.mongodb.net/arbrit-workdesk
```

#### Option C: Minimal (Let Compass handle the rest)
```
mongodb+srv://arbrit-workdesk:d4dmc1clqs2c73be45bg@customer-apps.6t1bzr.mongodb.net
```

---

## ✅ Solution 3: Manual Connection in Compass

Instead of pasting the full connection string:

1. Open MongoDB Compass
2. Click **"Fill in connection fields individually"** (link at bottom)
3. Enter these values:

   **General Tab:**
   - Hostname: `customer-apps.6t1bzr.mongodb.net`
   - SRV Record: ✅ Check this box
   - Authentication: `Username / Password`
   - Username: `arbrit-workdesk`
   - Password: `d4dmc1clqs2c73be45bg`
   
   **Advanced Tab:**
   - Authentication Database: `admin`
   - Default Database: `arbrit-workdesk`

4. Click **"Connect"**

---

## ✅ Solution 4: Verify Credentials

Test if credentials are correct using command line:

```bash
# Install mongosh (MongoDB Shell)
brew install mongosh

# Test connection
mongosh "mongodb+srv://arbrit-workdesk:d4dmc1clqs2c73be45bg@customer-apps.6t1bzr.mongodb.net/arbrit-workdesk"
```

If this fails, credentials might be incorrect or expired.

---

## ✅ Solution 5: Check Database User Permissions

In MongoDB Atlas:

1. Go to **"Database Access"** (under Security)
2. Find user: `arbrit-workdesk`
3. Verify it has:
   - **Read** permissions on `arbrit-workdesk` database
   - Or **Atlas Admin** / **Read and Write to any database**
4. If not, edit user and update permissions

---

## ✅ Solution 6: Firewall/Network Issues

### Check if you can reach MongoDB Atlas:

```bash
# Test DNS resolution
nslookup customer-apps.6t1bzr.mongodb.net

# Test connectivity
ping customer-apps.6t1bzr.mongodb.net

# Test port (if ping works)
nc -zv customer-apps.6t1bzr.mongodb.net 27017
```

### Common Network Blocks:
- Corporate firewall blocking MongoDB ports (27017, 27015-27017)
- VPN interference
- Antivirus/security software
- ISP blocking

**Try:**
- Disable VPN temporarily
- Try from different network (mobile hotspot)
- Check firewall settings

---

## ✅ Solution 7: MongoDB Compass Version

Update to latest version:
- Go to: https://www.mongodb.com/try/download/compass
- Download and install latest version
- Older versions may have connection bugs

---

## Diagnostic Checklist

- [ ] IP address whitelisted in Atlas Network Access?
- [ ] Database user exists and has permissions?
- [ ] Password is correct (no typos)?
- [ ] Database name is correct (`arbrit-workdesk`)?
- [ ] Internet connection working?
- [ ] No VPN or proxy interfering?
- [ ] MongoDB Compass is up to date?
- [ ] Firewall not blocking MongoDB ports?

---

## Alternative: Use MongoDB Shell to Test

If Compass keeps failing, verify the connection works with command line:

```bash
# Install MongoDB Shell
brew install mongosh

# Test connection
mongosh "mongodb+srv://arbrit-workdesk:d4dmc1clqs2c73be45bg@customer-apps.6t1bzr.mongodb.net/arbrit-workdesk"

# If connected, list databases
show dbs

# List collections
use arbrit-workdesk
show collections
```

If shell works but Compass doesn't, it's a Compass-specific issue.

---

## Still Not Working?

### Get Detailed Error Information:

In MongoDB Compass:
1. Open **Developer Tools**: View → Toggle DevTools
2. Go to **Console** tab
3. Try connecting again
4. Copy the error message

### Check MongoDB Atlas Status:
- Visit: https://status.cloud.mongodb.com/
- Verify there are no ongoing incidents

---

## Quick Test: Can You Login to Atlas Web UI?

1. Go to: https://cloud.mongodb.com/
2. Try to login and browse collections
3. If this works, the issue is with Compass/local connection
4. If this fails, credentials might be wrong

---

## Export Data Without Compass

If you can't get Compass working, use the Python script instead:

```bash
# Install pymongo
pip3 install pymongo

# Export environment variables
export MONGO_URL='mongodb+srv://arbrit-workdesk:d4dmc1clqs2c73be45bg@customer-apps.6t1bzr.mongodb.net/arbrit-workdesk?retryWrites=true&w=majority'
export DB_NAME='arbrit-workdesk'

# Run backup script
cd /Users/sms01/Downloads/arbrit-safety-export/scripts
python3 backup-mongodb.py
```

This will export all collections automatically without needing Compass!



# 🔧 Quick Fix: Update All User PINs to "1234"

## Problem
Only MD (971564022503) and COO (971566374020) can login because:
- They are auto-created by backend on startup with correct PIN hashes
- All imported users have wrong/unknown PIN hashes from original database

## Solution: Run Fix Script on EC2

### Step 1: Upload Script to EC2

```bash
# From your Mac, upload the fix script
scp -i your-key.pem scripts/fix-all-user-pins.py ec2-user@44.200.111.147:~/arbrit-safety-export/
```

### Step 2: Connect to EC2

```bash
ssh -i your-key.pem ec2-user@44.200.111.147
cd arbrit-safety-export
```

### Step 3: Run the Fix Script

```bash
python3 fix-all-user-pins.py
```

### Step 4: Confirm

When prompted, type `yes` to update all users.

**Result:**
- ✅ All 37 regular users → PIN: **1234**
- ✅ MD preserved → PIN: **2503**
- ✅ COO preserved → PIN: **4020**

---

## Alternative: Manual AWS CLI Method (Update 1 User for Testing)

### Step 1: Generate Hash

Run this on EC2:

```bash
python3 << 'EOF'
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
pin_hash = pwd_context.hash("1234")
print(pin_hash)
EOF
```

**Copy the output** (should look like: `$2b$12$...`)

### Step 2: Update Test User

```bash
# Replace HASH_HERE with the hash from step 1
aws dynamodb update-item \
  --table-name arbrit-users \
  --key '{"id": {"S": "691d76d09b40d9f043d34417"}}' \
  --update-expression "SET pin_hash = :hash" \
  --expression-attribute-values '{":hash": {"S": "HASH_HERE"}}' \
  --region us-east-1
```

### Step 3: Test Login

- Mobile: **971521528047**
- PIN: **1234**

---

## Alternative: Create New Test Users via HRM

### Use the Working Admin Account

1. **Login as MD:**
   - Mobile: `971564022503`
   - PIN: `2503`

2. **Go to HRM Dashboard → User Management**

3. **Create new test users:**
   - Name: Test User 1
   - Mobile: 971555111222
   - PIN: 1234
   - Role: Sales

4. **Logout and test login with new user**

---

## Which Method Should You Use?

| Method | Speed | Users Fixed | Difficulty |
|--------|-------|-------------|-----------|
| **Run script on EC2** | ⚡ Fastest | All 37 users | ⭐ Easiest |
| **Manual AWS CLI** | 🐌 Slow | 1 user at a time | ⭐⭐ Medium |
| **Create via HRM** | 🐌 Slow | New users only | ⭐ Easiest |

**Recommendation:** Run the script on EC2 to fix all users at once!

---

## Expected Output (After Fix)

```
📊 SUMMARY
======================================================================
Total users in database: 39
✅ Successfully updated: 37
⏭️  Skipped (admin): 2
❌ Failed: 0
======================================================================

✨ ALL DONE!

🔐 You can now login with:
   PIN: 1234

Example logins:
   - Arshad Mohammed (971521528047) / PIN: 1234
   - Dharson Dhasan (971523834896) / PIN: 1234
   - Afshan Firdose (971545844386) / PIN: 1234
   ... and 34 more users

Admin accounts unchanged:
   - MD: 971564022503 / PIN: 2503
   - COO: 971566374020 / PIN: 4020
```

---

## Still Having Issues?

Check backend logs to see exact error:

```bash
# For ECS Fargate
aws logs tail /ecs/arbrit-backend --follow --region us-east-1
```

Then try logging in again and see the error message.



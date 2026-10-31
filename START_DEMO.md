# 🚀 START THE DEMO - Quick Commands

## Open 2 Terminal Windows

### Terminal 1: Backend
```bash
cd ~/Desktop/odoo/server
npm start
```

**Wait for:** `SunPower API running on port 5000` ✅

---

### Terminal 2: Frontend
```bash
cd ~/Desktop/odoo/client
npm run dev
```

**Wait for:** `Local: http://localhost:5173` ✅

---

## Open Browser

Go to: **http://localhost:5173**

---

## Login
- **Email:** admin@sunpower.com
- **Password:** Admin@123

---

## If Backend Fails

**Likely issue:** PostgreSQL not running or database doesn't exist.

### Quick fix:
```bash
# Check if postgres is running
sudo systemctl status postgresql

# If not running, start it
sudo systemctl start postgresql

# Create database (if it doesn't exist)
psql -U postgres -c "CREATE DATABASE sunpower_db;"

# Run schema
cd ~/Desktop/odoo/server
psql -U postgres -d sunpower_db -f database/schema.sql

# Run seed data (sample customers, products, etc.)
psql -U postgres -d sunpower_db -f database/seed.sql

# Now start backend again
npm start
```

---

## Quick Health Check

Open: http://localhost:5000/health

Should see:
```json
{
  "success": true,
  "message": "SunPower Solutions API is running."
}
```

---

## Test API Directly (Optional)

### 1. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sunpower.com","password":"Admin@123"}'
```

Copy the token from response.

### 2. Get Customers (with token)
```bash
curl http://localhost:5000/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Stop Everything

Press `Ctrl + C` in both terminal windows.

---

## Demo is Ready! ✅

You have:
- ✅ Full backend API (18 modules)
- ✅ React login page
- ✅ JWT authentication
- ✅ Sample data in database
- ✅ All code explained in JURY_DEMO_GUIDE.md

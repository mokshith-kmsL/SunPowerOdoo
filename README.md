# ☀️ SunPower Solutions - Solar Installation Management System

A complete ERP system for managing solar panel installations from lead to warranty.


### 1. Start the Backend API
```bash
cd server
npm install
npm start
```

The API runs at: **http://localhost:5000**

### 2. Start the Frontend
```bash
cd client
npm install
npm run dev
```

The web app runs at: **http://localhost:5173**

### 3. Login
Use these credentials:
- **Email:** admin@sunpower.com
- **Password:** Admin@123

---

## 📋 What We Built

### Backend (Node.js + Express + PostgreSQL)
- ✅ **Authentication** - JWT-based login with role-based access
- ✅ **Customer Management** - Track all customer information
- ✅ **Lead Management** - Sales pipeline tracking
- ✅ **Site Surveys** - Technician site assessments
- ✅ **Products & Packages** - Solar equipment catalog
- ✅ **Quotations** - Auto-generate BOM from packages, calculate GST
- ✅ **Orders** - Convert approved quotes to orders
- ✅ **Payments** - Track advance, partial, and final payments
- ✅ **Inventory** - Real-time stock management
- ✅ **Serial Numbers** - Track every panel and inverter
- ✅ **Dispatch** - Ship products with auto-warranty activation
- ✅ **Installations** - Schedule and track installation work
- ✅ **Warranties** - Auto-calculated based on product type (20yr panels, 2yr inverters)
- ✅ **Service Tickets** - Auto-check warranty status, calculate charges
- ✅ **Finance & Analytics** - Revenue, profit, dashboard stats

### Frontend (React + Vite)
- ✅ Simple login page with authentication
- ✅ JWT token storage
- ✅ Role-based UI (ADMIN, SALES, TECHNICIAN, WAREHOUSE, SUPPORT)

---

## 🗄️ Database Setup (PostgreSQL)

### Create Database
```bash
psql -U postgres
CREATE DATABASE sunpower_db;
\q
```

### Run Schema & Seed Data
```bash
cd server
psql -U postgres -d sunpower_db -f database/schema.sql
psql -U postgres -d sunpower_db -f database/seed.sql
```

This creates:
- 23 database tables
- 5 sample users (admin, sales, technician, warehouse, support)
- Sample customers, products, packages, and orders

---

## 🎯 Key Business Workflows

1. **Lead → Survey → Quotation → Order**
   - Sales creates a lead
   - Technician conducts site survey
   - System auto-generates quotation with BOM from package
   - Convert approved quotation to order

2. **Order → Payment → Dispatch → Installation**
   - Record customer payments (advance, partial, final)
   - Warehouse dispatches serial numbers
   - System auto-activates warranties on dispatch
   - Technician completes installation

3. **Service & Warranty**
   - Create service ticket
   - System auto-checks warranty validity
   - If covered: free repair
   - If expired: calculate parts + labour charges

---

## 📁 Project Structure

```
odoo/
├── server/              # Backend API
│   ├── src/
│   │   ├── controllers/  # Business logic (18 controllers)
│   │   ├── routes/       # API endpoints (18 route files)
│   │   ├── middleware/   # Auth, validation, error handling
│   │   ├── utils/        # Helpers (warranty, responses)
│   │   ├── config/       # Database connection
│   │   ├── app.js        # Express app setup
│   │   └── server.js     # Server startup
│   ├── database/
│   │   ├── schema.sql    # Full database schema
│   │   └── seed.sql      # Sample data
│   └── package.json
│
└── client/              # Frontend
    ├── src/
    │   ├── App.jsx      # Login page + dashboard
    │   └── App.css      # Styles
    └── package.json
```

---

## 🔑 API Endpoints (All working!)

### Auth
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Get current user profile

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/:id` - Get customer details + leads

### Leads
- `GET /api/leads` - List all leads
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead status

### Surveys
- `GET /api/surveys` - List all surveys
- `POST /api/surveys` - Schedule new survey
- `PATCH /api/surveys/:id/approve` - Approve survey (required before quotation)

### Products & Packages
- `GET /api/products` - List all products
- `GET /api/packages` - List packages with BOM
- `POST /api/packages` - Create new package

### Quotations
- `GET /api/quotations` - List all quotations
- `POST /api/quotations` - Create quotation (auto-generates BOM, calculates totals)
- `POST /api/quotations/:id/convert-to-order` - Convert to order

### Orders & Payments
- `GET /api/orders` - List all orders
- `POST /api/payments` - Record payment (validates duplicate refs, prevents overpayment)

### Inventory
- `GET /api/inventory` - Current stock levels
- `GET /api/inventory/low-stock` - Reorder alerts

### Dispatch
- `POST /api/dispatches` - Ship order (auto-activates warranties)
- `PATCH /api/dispatches/:id/deliver` - Mark as delivered

### Installations
- `GET /api/installations` - List all installations
- `POST /api/installations` - Schedule installation
- `PATCH /api/installations/:id/complete` - Mark complete

### Service Tickets
- `POST /api/tickets` - Create ticket (auto-checks warranty)

### Analytics
- `GET /api/analytics/dashboard` - Dashboard stats
- `GET /api/finance/overview` - Revenue, expenses, profit

---

## 🛡️ Security Features

- ✅ JWT authentication
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (ADMIN, SALES, TECHNICIAN, WAREHOUSE, SUPPORT)
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS protection
- ✅ Helmet security headers

---

## 📊 Database Features

- ✅ 23 normalized tables
- ✅ Foreign key constraints
- ✅ Check constraints (prevent negative prices, stock)
- ✅ Database triggers (auto-update timestamps, sync payment totals)
- ✅ Generated columns (order balance, ticket total cost)
- ✅ Transaction support (dispatch + warranty activation happens atomically)

---

## 🎓 Code Explanation (For Jury)

### How Authentication Works
```javascript
// 1. User submits email + password
// 2. Backend checks if email exists in database
// 3. Compare password with bcrypt hash
// 4. If correct, create JWT token containing user id, email, role
// 5. Return token to frontend
// 6. Frontend stores token in localStorage
// 7. Every API request includes: Authorization: Bearer <token>
// 8. Backend verifies token and attaches user info to request
```

### How BOM Generation Works
```javascript
// 1. User selects a package (e.g. "5kW On-Grid Solar System")
// 2. Package has a list of products with quantities (package_items)
// 3. System reads all products in the package
// 4. For each product, multiply quantity × current selling price
// 5. Sum all line items = subtotal
// 6. Calculate 18% GST on (subtotal - discount)
// 7. Save quotation + all items in one database transaction
```

### How Warranty Auto-Activation Works
```javascript
// 1. Warehouse creates a dispatch with serial numbers
// 2. System checks each serial number's product category
// 3. Solar panels → 20 year warranty
// 4. Inverters/batteries → 2 year warranty
// 5. Cables → no warranty
// 6. Calculate expiry date = dispatch_date + warranty_years
// 7. Insert warranty record for each serial number
// 8. All happens in one transaction (dispatch + warranties together)
```

---

## 🏆 Why us?

1. **Complete Business Logic** - Not just CRUD, but real workflows
2. **Auto-Calculations** - Prices, taxes, warranties calculated server-side
3. **Database Transactions** - Multi-step operations are atomic
4. **Role-Based Security** - Different permissions for different users
5. **Readable Code** - Every function has comments explaining what it does
6. **Production-Ready** - Error handling, validation, proper HTTP status codes

--

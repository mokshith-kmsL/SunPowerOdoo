# Backend API Specification - SunPower Solutions

## Base Configuration
- **Host:** http://localhost:5000
- **API Prefix:** /api
- **Authentication:** JWT Bearer tokens
- **Content-Type:** application/json

## Authentication

### POST /api/auth/login
**Purpose:** Authenticate user and return JWT token

**Request:**
```json
{
  "email": "admin@sunpower.com",
  "password": "Admin@123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Super Admin",
      "email": "admin@sunpower.com",
      "role": "ADMIN"
    }
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

### GET /api/auth/me
**Purpose:** Get current user profile
**Auth Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile fetched.",
  "data": {
    "id": 1,
    "name": "Super Admin",
    "email": "admin@sunpower.com",
    "role": "ADMIN",
    "created_at": "2024-10-31T10:00:00Z"
  }
}
```

## Complete API Endpoints (18 Modules)

### 1. Customers
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get customer details
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer (ADMIN only)

### 2. Leads
- `GET /api/leads` - List all leads
- `GET /api/leads/:id` - Get lead details
- `POST /api/leads` - Create lead
- `PUT /api/leads/:id` - Update lead

### 3. Surveys
- `GET /api/surveys` - List all surveys
- `GET /api/surveys/:id` - Get survey details
- `POST /api/surveys` - Schedule survey
- `PUT /api/surveys/:id` - Update survey
- `PATCH /api/surveys/:id/approve` - Approve survey (ADMIN/SALES)
- `PATCH /api/surveys/:id/reject` - Reject survey (ADMIN/SALES)

### 4. Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (ADMIN/WAREHOUSE)
- `PUT /api/products/:id` - Update product (ADMIN/WAREHOUSE)

### 5. Packages
- `GET /api/packages` - List packages with BOM
- `GET /api/packages/:id` - Get package details
- `POST /api/packages` - Create package (ADMIN)
- `PUT /api/packages/:id` - Update package (ADMIN)

### 6. Quotations
- `GET /api/quotations` - List all quotations
- `GET /api/quotations/:id` - Get quotation with items
- `POST /api/quotations` - Create quotation (auto-generates BOM)
- `PATCH /api/quotations/:id/approve` - Approve quotation (ADMIN/SALES)
- `PATCH /api/quotations/:id/reject` - Reject quotation (ADMIN/SALES)
- `POST /api/quotations/:id/convert-to-order` - Convert to order

### 7. Orders
- `GET /api/orders` - List all orders
- `GET /api/orders/:id` - Get order with items and payments
- `PATCH /api/orders/:id/status` - Update order status

### 8. Payments
- `GET /api/payments` - List all payments (ADMIN/SALES)
- `GET /api/orders/:id/payments` - Get payments for order
- `POST /api/payments` - Record payment

### 9. Inventory
- `GET /api/inventory` - List all inventory
- `GET /api/inventory/low-stock` - Get low stock items
- `GET /api/inventory/:product_id` - Get inventory for product
- `PUT /api/inventory/:product_id` - Update stock (ADMIN/WAREHOUSE)
- `POST /api/inventory/:product_id/add-stock` - Add stock (ADMIN/WAREHOUSE)

### 10. Serial Numbers
- `GET /api/serial-numbers` - List all serial numbers
- `POST /api/serial-numbers` - Add serial numbers (ADMIN/WAREHOUSE)

### 11. Dispatches
- `GET /api/dispatches` - List all dispatches
- `GET /api/dispatches/:id` - Get dispatch details
- `POST /api/dispatches` - Create dispatch (auto-activates warranties)
- `PATCH /api/dispatches/:id/deliver` - Mark as delivered

### 12. Technicians
- `GET /api/technicians` - List all technicians

### 13. Installations
- `GET /api/installations` - List all installations
- `GET /api/installations/:id` - Get installation details
- `POST /api/installations` - Schedule installation
- `PATCH /api/installations/:id/complete` - Complete installation

### 14. Warranties
- `GET /api/warranties` - List all warranties
- `GET /api/warranties/serial/:serialNumber` - Get warranty by serial

### 15. Service Tickets
- `GET /api/tickets` - List all service tickets
- `POST /api/tickets` - Create ticket (auto-checks warranty)
- `PATCH /api/tickets/:id/close` - Close ticket

### 16. Finance
- `GET /api/finance/overview` - Get finance overview (ADMIN/SALES)

### 17. Analytics
- `GET /api/analytics/dashboard` - Get dashboard stats

### 18. User Management
- `POST /api/auth/users` - Create user (ADMIN only)
- `GET /api/auth/users` - List users (ADMIN only)
- `PATCH /api/auth/users/:id/toggle` - Activate/deactivate user
- `PUT /api/auth/users/:id/password` - Reset password

## Response Format

All endpoints follow this format:

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description"
}
```

## HTTP Status Codes
- `200` - Success (GET, PUT, PATCH)
- `201` - Created (POST)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `422` - Unprocessable Entity (validation failed)
- `500` - Internal Server Error

## Authentication & Authorization

### Public Endpoints
- `POST /api/auth/login`

### Protected Endpoints
All other endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

### Role-Based Access
- **ADMIN** - Full access to all endpoints
- **SALES** - Customers, leads, surveys, quotations, orders, payments
- **TECHNICIAN** - Surveys, installations, tickets
- **WAREHOUSE** - Products, inventory, serial numbers, dispatches
- **SUPPORT** - Service tickets

## Business Logic Highlights

### 1. BOM Auto-Generation
When creating a quotation:
- System reads package's bill of materials
- Fetches current selling price for each product
- Calculates: subtotal, discount, 18% GST, total
- Saves quotation + all items in one transaction

### 2. Warranty Auto-Activation
When creating a dispatch:
- For each serial number, check product category
- Solar panels → 20-year warranty
- Inverters/batteries → 2-year warranty
- Calculate expiry_date = dispatch_date + years
- Insert warranty records automatically

### 3. Service Ticket Smart Pricing
When creating a service ticket:
- Look up serial number's warranty
- Check if today < expiry_date
- If covered: parts_cost = 0, labour_cost = 0
- If expired: charge default rates

## Database Transactions
Multi-step operations use transactions:
- Create quotation + insert items
- Create dispatch + update inventory + activate warranties
- Convert quotation + create order + mark converted

## Security Features
- Password hashing (bcrypt, cost 10)
- JWT tokens (7-day expiry)
- SQL injection prevention (parameterized queries)
- CORS restrictions
- Helmet security headers
- Role-based authorization

## Error Handling
- Duplicate entries → 409 Conflict
- Foreign key violations → 400 Bad Request
- Validation errors → 422 Unprocessable Entity
- All errors return consistent JSON format

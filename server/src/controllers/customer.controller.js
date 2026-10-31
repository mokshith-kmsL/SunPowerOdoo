import db          from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/responseHelper.js';
import AppError     from '../utils/AppError.js';

// ─────────────────────────────────────────────
// GET /api/customers
// Returns all customers, newest first.
// Supports optional search by name or phone: ?search=john
// ─────────────────────────────────────────────
export const getAllCustomers = asyncHandler(async (req, res) => {
  const search = req.query.search || '';

  let queryText;
  let queryParams;

  if (search) {
    // Filter by name OR phone containing the search string
    queryText  = `SELECT * FROM customers
                  WHERE name ILIKE $1 OR phone ILIKE $1
                  ORDER BY created_at DESC`;
    queryParams = [`%${search}%`];
  } else {
    queryText  = 'SELECT * FROM customers ORDER BY created_at DESC';
    queryParams = [];
  }

  const result = await db.query(queryText, queryParams);
  sendSuccess(res, 'Customers fetched.', result.rows);
});

// ─────────────────────────────────────────────
// GET /api/customers/:id
// Returns a single customer plus their leads.
// ─────────────────────────────────────────────
export const getCustomerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const customerResult = await db.query(
    'SELECT * FROM customers WHERE id = $1',
    [id]
  );

  if (customerResult.rows.length === 0) {
    throw new AppError('Customer not found.', 404);
  }

  // Also fetch all leads for this customer
  const leadsResult = await db.query(
    'SELECT * FROM leads WHERE customer_id = $1 ORDER BY created_at DESC',
    [id]
  );

  const customer = customerResult.rows[0];
  customer.leads = leadsResult.rows;

  sendSuccess(res, 'Customer fetched.', customer);
});

// ─────────────────────────────────────────────
// POST /api/customers
// Creates a new customer.
// Body: { name, phone, email, address }
// ─────────────────────────────────────────────
export const createCustomer = asyncHandler(async (req, res) => {
  const { name, phone, email, address } = req.body;

  if (!name || !phone) {
    throw new AppError('Name and phone are required.', 400);
  }

  const result = await db.query(
    `INSERT INTO customers (name, phone, email, address)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name.trim(), phone.trim(), email || null, address || null]
  );

  sendCreated(res, 'Customer created.', result.rows[0]);
});

// ─────────────────────────────────────────────
// PUT /api/customers/:id
// Updates an existing customer.
// Body: { name, phone, email, address }
// ─────────────────────────────────────────────
export const updateCustomer = asyncHandler(async (req, res) => {
  const { id }                  = req.params;
  const { name, phone, email, address } = req.body;

  // First check customer exists
  const existing = await db.query('SELECT id FROM customers WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new AppError('Customer not found.', 404);
  }

  const result = await db.query(
    `UPDATE customers
     SET name    = COALESCE($1, name),
         phone   = COALESCE($2, phone),
         email   = COALESCE($3, email),
         address = COALESCE($4, address)
     WHERE id = $5
     RETURNING *`,
    [name || null, phone || null, email || null, address || null, id]
  );

  sendSuccess(res, 'Customer updated.', result.rows[0]);
});

// ─────────────────────────────────────────────
// DELETE /api/customers/:id
// Deletes a customer. ADMIN only.
// ─────────────────────────────────────────────
export const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await db.query(
    'DELETE FROM customers WHERE id = $1 RETURNING id, name',
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Customer not found.', 404);
  }

  sendSuccess(res, `Customer "${result.rows[0].name}" deleted.`);
});

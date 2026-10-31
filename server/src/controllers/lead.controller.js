import db          from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/responseHelper.js';
import AppError     from '../utils/AppError.js';

// Valid lead status values (mirrors the database enum)
const LEAD_STATUSES = [
  'NEW', 'CONTACTED', 'SURVEY_SCHEDULED', 'SURVEY_DONE',
  'QUOTED', 'NEGOTIATING', 'WON', 'LOST',
];

// ─────────────────────────────────────────────
// GET /api/leads
// Returns all leads joined with customer name.
// Optional filter: ?status=NEW or ?customer_id=3
// ─────────────────────────────────────────────
export const getAllLeads = asyncHandler(async (req, res) => {
  const { status, customer_id } = req.query;

  // Build a simple WHERE clause based on which filters were provided
  const conditions = [];
  const params     = [];

  if (status) {
    params.push(status.toUpperCase());
    conditions.push(`l.status = $${params.length}`);
  }

  if (customer_id) {
    params.push(customer_id);
    conditions.push(`l.customer_id = $${params.length}`);
  }

  const whereClause = conditions.length > 0
    ? 'WHERE ' + conditions.join(' AND ')
    : '';

  const result = await db.query(
    `SELECT
       l.*,
       c.name  AS customer_name,
       c.phone AS customer_phone,
       u.name  AS assigned_to_name
     FROM leads l
     JOIN customers c ON c.id = l.customer_id
     LEFT JOIN users u ON u.id = l.assigned_to
     ${whereClause}
     ORDER BY l.created_at DESC`,
    params
  );

  sendSuccess(res, 'Leads fetched.', result.rows);
});

// ─────────────────────────────────────────────
// GET /api/leads/:id
// Returns a single lead with full customer info.
// ─────────────────────────────────────────────
export const getLeadById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await db.query(
    `SELECT
       l.*,
       c.name    AS customer_name,
       c.phone   AS customer_phone,
       c.email   AS customer_email,
       c.address AS customer_address,
       u.name    AS assigned_to_name
     FROM leads l
     JOIN customers c ON c.id = l.customer_id
     LEFT JOIN users u ON u.id = l.assigned_to
     WHERE l.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Lead not found.', 404);
  }

  sendSuccess(res, 'Lead fetched.', result.rows[0]);
});

// ─────────────────────────────────────────────
// POST /api/leads
// Creates a new lead for an existing customer.
// Body: { customer_id, capacity_kw, system_type,
//         monthly_electricity_bill, roof_area,
//         subsidy_required, source, notes, assigned_to }
// ─────────────────────────────────────────────
export const createLead = asyncHandler(async (req, res) => {
  const {
    customer_id,
    capacity_kw,
    system_type,
    monthly_electricity_bill,
    roof_area,
    subsidy_required = false,
    source,
    notes,
    assigned_to,
  } = req.body;

  if (!customer_id) {
    throw new AppError('customer_id is required.', 400);
  }

  // Verify the customer exists before creating the lead
  const customerCheck = await db.query(
    'SELECT id FROM customers WHERE id = $1',
    [customer_id]
  );
  if (customerCheck.rows.length === 0) {
    throw new AppError('Customer not found.', 404);
  }

  const result = await db.query(
    `INSERT INTO leads
       (customer_id, capacity_kw, system_type, monthly_electricity_bill,
        roof_area, subsidy_required, source, notes, assigned_to)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      customer_id,
      capacity_kw       || null,
      system_type       || null,
      monthly_electricity_bill || null,
      roof_area         || null,
      subsidy_required,
      source            || null,
      notes             || null,
      assigned_to       || null,
    ]
  );

  sendCreated(res, 'Lead created.', result.rows[0]);
});

// ─────────────────────────────────────────────
// PUT /api/leads/:id
// Updates a lead — usually to change status or add notes.
// Body: any subset of lead fields
// ─────────────────────────────────────────────
export const updateLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    capacity_kw,
    system_type,
    monthly_electricity_bill,
    roof_area,
    subsidy_required,
    source,
    status,
    notes,
    assigned_to,
  } = req.body;

  // Validate status if provided
  if (status && !LEAD_STATUSES.includes(status.toUpperCase())) {
    throw new AppError(`Invalid status. Must be one of: ${LEAD_STATUSES.join(', ')}`, 400);
  }

  // Check the lead exists
  const existing = await db.query('SELECT id FROM leads WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new AppError('Lead not found.', 404);
  }

  // COALESCE means: use the new value if provided, otherwise keep the old value
  const result = await db.query(
    `UPDATE leads SET
       capacity_kw              = COALESCE($1,  capacity_kw),
       system_type              = COALESCE($2,  system_type),
       monthly_electricity_bill = COALESCE($3,  monthly_electricity_bill),
       roof_area                = COALESCE($4,  roof_area),
       subsidy_required         = COALESCE($5,  subsidy_required),
       source                   = COALESCE($6,  source),
       status                   = COALESCE($7,  status),
       notes                    = COALESCE($8,  notes),
       assigned_to              = COALESCE($9,  assigned_to)
     WHERE id = $10
     RETURNING *`,
    [
      capacity_kw              || null,
      system_type              || null,
      monthly_electricity_bill || null,
      roof_area                || null,
      subsidy_required         ?? null,
      source                   || null,
      status                   ? status.toUpperCase() : null,
      notes                    || null,
      assigned_to              || null,
      id,
    ]
  );

  sendSuccess(res, 'Lead updated.', result.rows[0]);
});

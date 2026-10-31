import db          from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/responseHelper.js';
import AppError     from '../utils/AppError.js';

// ─────────────────────────────────────────────
// GET /api/surveys
// Returns all surveys with customer and technician names.
// Optional filter: ?status=PENDING or ?technician_id=1
// ─────────────────────────────────────────────
export const getAllSurveys = asyncHandler(async (req, res) => {
  const { status, technician_id } = req.query;

  const conditions = [];
  const params     = [];

  if (status) {
    params.push(status.toUpperCase());
    conditions.push(`s.status = $${params.length}`);
  }

  if (technician_id) {
    params.push(technician_id);
    conditions.push(`s.technician_id = $${params.length}`);
  }

  const whereClause = conditions.length > 0
    ? 'WHERE ' + conditions.join(' AND ')
    : '';

  const result = await db.query(
    `SELECT
       s.*,
       c.name  AS customer_name,
       c.phone AS customer_phone,
       u.name  AS technician_name
     FROM surveys s
     JOIN customers c  ON c.id = s.customer_id
     LEFT JOIN technicians t ON t.id = s.technician_id
     LEFT JOIN users u       ON u.id = t.user_id
     ${whereClause}
     ORDER BY s.created_at DESC`,
    params
  );

  sendSuccess(res, 'Surveys fetched.', result.rows);
});

// ─────────────────────────────────────────────
// GET /api/surveys/:id
// Returns a single survey with all details.
// ─────────────────────────────────────────────
export const getSurveyById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await db.query(
    `SELECT
       s.*,
       c.name    AS customer_name,
       c.phone   AS customer_phone,
       c.address AS customer_address,
       u.name    AS technician_name,
       a.name    AS approved_by_name
     FROM surveys s
     JOIN customers c       ON c.id = s.customer_id
     LEFT JOIN technicians t ON t.id = s.technician_id
     LEFT JOIN users u       ON u.id = t.user_id
     LEFT JOIN users a       ON a.id = s.approved_by
     WHERE s.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Survey not found.', 404);
  }

  sendSuccess(res, 'Survey fetched.', result.rows[0]);
});

// ─────────────────────────────────────────────
// POST /api/surveys
// Schedules a new site survey.
// Body: { customer_id, technician_id, lead_id, scheduled_date, notes }
// ─────────────────────────────────────────────
export const createSurvey = asyncHandler(async (req, res) => {
  const {
    customer_id,
    technician_id,
    lead_id,
    scheduled_date,
    notes,
  } = req.body;

  if (!customer_id) {
    throw new AppError('customer_id is required.', 400);
  }

  // Verify customer exists
  const customerCheck = await db.query(
    'SELECT id FROM customers WHERE id = $1',
    [customer_id]
  );
  if (customerCheck.rows.length === 0) {
    throw new AppError('Customer not found.', 404);
  }

  const result = await db.query(
    `INSERT INTO surveys
       (customer_id, technician_id, lead_id, scheduled_date, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      customer_id,
      technician_id  || null,
      lead_id        || null,
      scheduled_date || null,
      notes          || null,
    ]
  );

  // If a lead_id was given, update that lead's status to show survey is scheduled
  if (lead_id) {
    await db.query(
      "UPDATE leads SET status = 'SURVEY_SCHEDULED' WHERE id = $1",
      [lead_id]
    );
  }

  sendCreated(res, 'Survey scheduled.', result.rows[0]);
});

// ─────────────────────────────────────────────
// PUT /api/surveys/:id
// Technician fills in survey results after visiting the site.
// Body: { roof_area, shadow_free_area, roof_direction, roof_tilt,
//         cable_distance, grid_suitable, notes, status }
// ─────────────────────────────────────────────
export const updateSurvey = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    technician_id,
    scheduled_date,
    roof_area,
    shadow_free_area,
    roof_direction,
    roof_tilt,
    cable_distance,
    grid_suitable,
    notes,
    status,
  } = req.body;

  // Check survey exists
  const existing = await db.query('SELECT id FROM surveys WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new AppError('Survey not found.', 404);
  }

  const result = await db.query(
    `UPDATE surveys SET
       technician_id  = COALESCE($1,  technician_id),
       scheduled_date = COALESCE($2,  scheduled_date),
       roof_area      = COALESCE($3,  roof_area),
       shadow_free_area = COALESCE($4, shadow_free_area),
       roof_direction = COALESCE($5,  roof_direction),
       roof_tilt      = COALESCE($6,  roof_tilt),
       cable_distance = COALESCE($7,  cable_distance),
       grid_suitable  = COALESCE($8,  grid_suitable),
       notes          = COALESCE($9,  notes),
       status         = COALESCE($10, status)
     WHERE id = $11
     RETURNING *`,
    [
      technician_id  || null,
      scheduled_date || null,
      roof_area      || null,
      shadow_free_area || null,
      roof_direction || null,
      roof_tilt      || null,
      cable_distance || null,
      grid_suitable  ?? null,
      notes          || null,
      status         ? status.toUpperCase() : null,
      id,
    ]
  );

  sendSuccess(res, 'Survey updated.', result.rows[0]);
});

// ─────────────────────────────────────────────
// PATCH /api/surveys/:id/approve
// Admin/Sales approves a completed survey.
// An APPROVED survey allows a quotation to be created.
// ─────────────────────────────────────────────
export const approveSurvey = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Only COMPLETED surveys can be approved
  const existing = await db.query('SELECT id, status FROM surveys WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new AppError('Survey not found.', 404);
  }

  if (existing.rows[0].status !== 'COMPLETED') {
    throw new AppError('Only a COMPLETED survey can be approved.', 400);
  }

  const result = await db.query(
    `UPDATE surveys
     SET status = 'APPROVED', approved_by = $1, approved_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [req.user.id, id]
  );

  sendSuccess(res, 'Survey approved.', result.rows[0]);
});

// ─────────────────────────────────────────────
// PATCH /api/surveys/:id/reject
// Rejects a survey (e.g. site not suitable).
// ─────────────────────────────────────────────
export const rejectSurvey = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await db.query('SELECT id, status FROM surveys WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new AppError('Survey not found.', 404);
  }

  const result = await db.query(
    `UPDATE surveys
     SET status = 'REJECTED', approved_by = $1, approved_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [req.user.id, id]
  );

  sendSuccess(res, 'Survey rejected.', result.rows[0]);
});

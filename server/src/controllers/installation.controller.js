import db          from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/responseHelper.js';
import AppError     from '../utils/AppError.js';

// GET /api/installations
export const getAllInstallations = asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT
       i.*,
       c.name AS customer_name,
       u.name AS technician_name
     FROM installations i
     JOIN orders o       ON o.id = i.order_id
     JOIN customers c    ON c.id = o.customer_id
     LEFT JOIN technicians t ON t.id = i.technician_id
     LEFT JOIN users u       ON u.id = t.user_id
     ORDER BY i.created_at DESC`
  );

  sendSuccess(res, 'Installations fetched.', result.rows);
});

// GET /api/installations/:id
export const getInstallationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await db.query(
    `SELECT
       i.*,
       c.name    AS customer_name,
       c.address AS customer_address,
       u.name    AS technician_name
     FROM installations i
     JOIN orders o       ON o.id = i.order_id
     JOIN customers c    ON c.id = o.customer_id
     LEFT JOIN technicians t ON t.id = i.technician_id
     LEFT JOIN users u       ON u.id = t.user_id
     WHERE i.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Installation not found.', 404);
  }

  // Fetch photos
  const photosResult = await db.query(
    'SELECT * FROM installation_photos WHERE installation_id = $1',
    [id]
  );

  const installation = result.rows[0];
  installation.photos = photosResult.rows;

  sendSuccess(res, 'Installation fetched.', installation);
});

// POST /api/installations
export const createInstallation = asyncHandler(async (req, res) => {
  const { order_id, technician_id, scheduled_date, notes } = req.body;

  if (!order_id) {
    throw new AppError('order_id is required.', 400);
  }

  const result = await db.query(
    `INSERT INTO installations (order_id, technician_id, scheduled_date, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [order_id, technician_id || null, scheduled_date || null, notes || null]
  );

  sendCreated(res, 'Installation scheduled.', result.rows[0]);
});

// PATCH /api/installations/:id/complete
export const completeInstallation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { test_result, customer_signature, notes } = req.body;

  const result = await db.query(
    `UPDATE installations
     SET installation_status = 'COMPLETED',
         completion_time = NOW(),
         test_result = $1,
         customer_signature = $2,
         notes = COALESCE($3, notes)
     WHERE id = $4
     RETURNING *`,
    [test_result || null, customer_signature || null, notes || null, id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Installation not found.', 404);
  }

  // Update order status to INSTALLED
  await db.query(
    "UPDATE orders SET status = 'INSTALLED' WHERE id = $1",
    [result.rows[0].order_id]
  );

  sendSuccess(res, 'Installation completed.', result.rows[0]);
});

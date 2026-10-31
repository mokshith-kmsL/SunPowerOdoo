import db          from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/responseHelper.js';
import AppError     from '../utils/AppError.js';
import { isWarrantyActive } from '../utils/warrantyHelper.js';

// GET /api/tickets
export const getAllTickets = asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT
       t.*,
       c.name AS customer_name,
       c.phone AS customer_phone,
       sn.serial_number,
       p.name AS product_name
     FROM service_tickets t
     JOIN customers c        ON c.id  = t.customer_id
     LEFT JOIN serial_numbers sn ON sn.id = t.serial_number_id
     LEFT JOIN products p        ON p.id  = sn.product_id
     ORDER BY t.created_at DESC`
  );

  sendSuccess(res, 'Service tickets fetched.', result.rows);
});

// POST /api/tickets
// Auto-checks warranty when creating a ticket
export const createTicket = asyncHandler(async (req, res) => {
  const { customer_id, serial_number_id, description, fault_code } = req.body;

  if (!customer_id || !description) {
    throw new AppError('customer_id and description are required.', 400);
  }

  let warranty_covered = false;
  let parts_cost = 0;
  let labour_cost = 0;

  // If a serial number was given, check its warranty status
  if (serial_number_id) {
    const warrantyResult = await db.query(
      'SELECT expiry_date FROM warranties WHERE serial_number_id = $1',
      [serial_number_id]
    );

    if (warrantyResult.rows.length > 0) {
      const warranty = warrantyResult.rows[0];
      warranty_covered = isWarrantyActive(warranty.expiry_date);
    }
  }

  // If NOT covered by warranty, set default charges
  if (!warranty_covered) {
    parts_cost = 500;   // Default parts cost
    labour_cost = 1000; // Default labour cost
  }

  const result = await db.query(
    `INSERT INTO service_tickets
       (customer_id, serial_number_id, description, fault_code, warranty_covered, parts_cost, labour_cost)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [customer_id, serial_number_id || null, description, fault_code || null, warranty_covered, parts_cost, labour_cost]
  );

  sendCreated(res, 'Service ticket created.', result.rows[0]);
});

// PATCH /api/tickets/:id/close
export const closeTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { resolution_notes } = req.body;

  const result = await db.query(
    `UPDATE service_tickets
     SET status = 'CLOSED', resolution_notes = $1, closed_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [resolution_notes || null, id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Ticket not found.', 404);
  }

  sendSuccess(res, 'Ticket closed.', result.rows[0]);
});

import db          from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/responseHelper.js';
import AppError     from '../utils/AppError.js';

// ─────────────────────────────────────────────
// GET /api/orders/:id/payments
// Returns all payments for a specific order.
// ─────────────────────────────────────────────
export const getPaymentsForOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify the order exists
  const orderCheck = await db.query('SELECT id FROM orders WHERE id = $1', [id]);
  if (orderCheck.rows.length === 0) {
    throw new AppError('Order not found.', 404);
  }

  const result = await db.query(
    `SELECT
       p.*,
       u.name AS recorded_by_name
     FROM payments p
     LEFT JOIN users u ON u.id = p.recorded_by
     WHERE p.order_id = $1
     ORDER BY p.payment_date`,
    [id]
  );

  sendSuccess(res, 'Payments fetched.', result.rows);
});

// ─────────────────────────────────────────────
// POST /api/payments
// Records a new payment against an order.
//
// Business rules:
//   1. Payment reference must be unique (no duplicate transactions).
//   2. Payment amount must be greater than zero.
//   3. Total paid cannot exceed the order total.
//      (We allow exact full payment but not overpayment.)
//
// Body: { order_id, amount, payment_type, payment_reference,
//         payment_date, notes }
// ─────────────────────────────────────────────
export const recordPayment = asyncHandler(async (req, res) => {
  const {
    order_id,
    amount,
    payment_type,
    payment_reference,
    payment_date,
    notes,
  } = req.body;

  if (!order_id || !amount || !payment_type || !payment_reference) {
    throw new AppError('order_id, amount, payment_type and payment_reference are required.', 400);
  }

  if (parseFloat(amount) <= 0) {
    throw new AppError('Payment amount must be greater than zero.', 400);
  }

  const validTypes = ['ADVANCE', 'PARTIAL', 'FINAL', 'REFUND'];
  if (!validTypes.includes(payment_type.toUpperCase())) {
    throw new AppError(`payment_type must be one of: ${validTypes.join(', ')}`, 400);
  }

  // ── Check 1: Order exists ──────────────────────────────────
  const orderResult = await db.query(
    'SELECT id, total_amount, amount_paid FROM orders WHERE id = $1',
    [order_id]
  );

  if (orderResult.rows.length === 0) {
    throw new AppError('Order not found.', 404);
  }

  const order = orderResult.rows[0];

  // ── Check 2: No duplicate payment reference ────────────────
  // Payment references are like bank transaction IDs — they must be unique.
  const dupCheck = await db.query(
    'SELECT id FROM payments WHERE payment_reference = $1',
    [payment_reference.trim()]
  );

  if (dupCheck.rows.length > 0) {
    throw new AppError('This payment reference already exists. Duplicate payments are not allowed.', 409);
  }

  // ── Check 3: Don't allow overpayment ──────────────────────
  // REFUND payments are allowed to go in reverse, so we skip this check for them.
  if (payment_type.toUpperCase() !== 'REFUND') {
    const currentPaid = parseFloat(order.amount_paid);
    const newPayment  = parseFloat(amount);
    const orderTotal  = parseFloat(order.total_amount);

    if (currentPaid + newPayment > orderTotal) {
      throw new AppError(
        `Payment would exceed order total. Already paid: ₹${currentPaid}. Order total: ₹${orderTotal}.`,
        400
      );
    }
  }

  // ── Save the payment ───────────────────────────────────────
  // Note: The database trigger (trg_sync_amount_paid) will automatically
  // update orders.amount_paid after this insert.
  const result = await db.query(
    `INSERT INTO payments
       (order_id, amount, payment_type, payment_reference, payment_date, notes, recorded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      order_id,
      parseFloat(amount).toFixed(2),
      payment_type.toUpperCase(),
      payment_reference.trim(),
      payment_date || new Date().toISOString().split('T')[0],
      notes || null,
      req.user.id,
    ]
  );

  sendCreated(res, 'Payment recorded.', result.rows[0]);
});

// ─────────────────────────────────────────────
// GET /api/payments
// Returns all payments (for admin finance view).
// ─────────────────────────────────────────────
export const getAllPayments = asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT
       p.*,
       o.customer_id,
       c.name AS customer_name,
       u.name AS recorded_by_name
     FROM payments p
     JOIN orders o    ON o.id = p.order_id
     JOIN customers c ON c.id = o.customer_id
     LEFT JOIN users u ON u.id = p.recorded_by
     ORDER BY p.payment_date DESC, p.created_at DESC`
  );

  sendSuccess(res, 'All payments fetched.', result.rows);
});

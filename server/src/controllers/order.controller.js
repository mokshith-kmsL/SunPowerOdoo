import db          from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/responseHelper.js';
import AppError     from '../utils/AppError.js';

// Valid order statuses
const ORDER_STATUSES = [
  'CONFIRMED', 'IN_PRODUCTION', 'READY_FOR_DISPATCH',
  'DISPATCHED', 'DELIVERED', 'INSTALLATION_SCHEDULED',
  'INSTALLED', 'COMPLETED', 'CANCELLED',
];

// ─────────────────────────────────────────────
// GET /api/orders
// Returns all orders with customer name and payment summary.
// ─────────────────────────────────────────────
export const getAllOrders = asyncHandler(async (req, res) => {
  const { status, customer_id } = req.query;

  const conditions = [];
  const params     = [];

  if (status) {
    params.push(status.toUpperCase());
    conditions.push(`o.status = $${params.length}`);
  }

  if (customer_id) {
    params.push(customer_id);
    conditions.push(`o.customer_id = $${params.length}`);
  }

  const whereClause = conditions.length > 0
    ? 'WHERE ' + conditions.join(' AND ')
    : '';

  const result = await db.query(
    `SELECT
       o.*,
       c.name  AS customer_name,
       c.phone AS customer_phone
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     ${whereClause}
     ORDER BY o.created_at DESC`,
    params
  );

  sendSuccess(res, 'Orders fetched.', result.rows);
});

// ─────────────────────────────────────────────
// GET /api/orders/:id
// Returns a single order with quotation items and payment history.
// ─────────────────────────────────────────────
export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const orderResult = await db.query(
    `SELECT
       o.*,
       c.name    AS customer_name,
       c.phone   AS customer_phone,
       c.address AS customer_address
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     WHERE o.id = $1`,
    [id]
  );

  if (orderResult.rows.length === 0) {
    throw new AppError('Order not found.', 404);
  }

  const order = orderResult.rows[0];

  // Fetch the quotation items (what was ordered)
  const itemsResult = await db.query(
    `SELECT
       qi.*,
       p.name     AS product_name,
       p.sku,
       p.category
     FROM quotation_items qi
     JOIN products p ON p.id = qi.product_id
     WHERE qi.quotation_id = $1`,
    [order.quotation_id]
  );

  // Fetch all payments made for this order
  const paymentsResult = await db.query(
    `SELECT * FROM payments WHERE order_id = $1 ORDER BY payment_date`,
    [id]
  );

  order.items    = itemsResult.rows;
  order.payments = paymentsResult.rows;

  sendSuccess(res, 'Order fetched.', order);
});

// ─────────────────────────────────────────────
// PATCH /api/orders/:id/status
// Updates the status of an order.
// Body: { status }
// ─────────────────────────────────────────────
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id }     = req.params;
  const { status } = req.body;

  if (!status) {
    throw new AppError('status is required.', 400);
  }

  const newStatus = status.toUpperCase();

  if (!ORDER_STATUSES.includes(newStatus)) {
    throw new AppError(`Invalid status. Must be one of: ${ORDER_STATUSES.join(', ')}`, 400);
  }

  const existing = await db.query('SELECT id FROM orders WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new AppError('Order not found.', 404);
  }

  const result = await db.query(
    'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
    [newStatus, id]
  );

  sendSuccess(res, 'Order status updated.', result.rows[0]);
});

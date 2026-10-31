import db          from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/responseHelper.js';
import AppError     from '../utils/AppError.js';
import { calculateExpiryDate } from '../utils/warrantyHelper.js';

// ─────────────────────────────────────────────
// GET /api/dispatches
// Returns all dispatches with order info.
// ─────────────────────────────────────────────
export const getAllDispatches = asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT
       d.*,
       o.customer_id,
       c.name AS customer_name
     FROM dispatches d
     JOIN orders o    ON o.id = d.order_id
     JOIN customers c ON c.id = o.customer_id
     ORDER BY d.created_at DESC`
  );

  sendSuccess(res, 'Dispatches fetched.', result.rows);
});

// ─────────────────────────────────────────────
// GET /api/dispatches/:id
// Returns a dispatch with all its serial numbers.
// ─────────────────────────────────────────────
export const getDispatchById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const dispatchResult = await db.query(
    `SELECT
       d.*,
       c.name AS customer_name
     FROM dispatches d
     JOIN orders o    ON o.id = d.order_id
     JOIN customers c ON c.id = o.customer_id
     WHERE d.id = $1`,
    [id]
  );

  if (dispatchResult.rows.length === 0) {
    throw new AppError('Dispatch not found.', 404);
  }

  const dispatch = dispatchResult.rows[0];

  // Fetch all serial numbers included in this dispatch
  const itemsResult = await db.query(
    `SELECT
       di.id AS dispatch_item_id,
       sn.serial_number,
       sn.status,
       p.name     AS product_name,
       p.sku,
       p.category
     FROM dispatch_items di
     JOIN serial_numbers sn ON sn.id = di.serial_number_id
     JOIN products p        ON p.id  = sn.product_id
     WHERE di.dispatch_id = $1`,
    [id]
  );

  dispatch.items = itemsResult.rows;

  sendSuccess(res, 'Dispatch fetched.', dispatch);
});

// ─────────────────────────────────────────────
// POST /api/dispatches
// Creates a dispatch and ships serial numbers to the customer.
//
// This is the most complex operation in the system. Here's what happens:
//   1. Validate the order exists and is ready to dispatch.
//   2. Validate every serial number: must exist and be AVAILABLE.
//   3. In a transaction:
//      a. Create the dispatch record.
//      b. Link each serial number to the dispatch.
//      c. Mark serial numbers as DISPATCHED and link them to the order.
//      d. Reduce inventory: decrease available, clear reserved.
//      e. Update order status to DISPATCHED.
//      f. Auto-activate warranties for warrantiable product categories.
//
// Body: { order_id, serial_number_ids: [1, 2, 3, ...], notes }
// ─────────────────────────────────────────────
export const createDispatch = asyncHandler(async (req, res) => {
  const { order_id, serial_number_ids, notes } = req.body;

  if (!order_id || !serial_number_ids || serial_number_ids.length === 0) {
    throw new AppError('order_id and serial_number_ids are required.', 400);
  }

  // ── Step 1: Verify order exists ───────────────────────────
  const orderResult = await db.query(
    'SELECT id, status FROM orders WHERE id = $1',
    [order_id]
  );

  if (orderResult.rows.length === 0) {
    throw new AppError('Order not found.', 404);
  }

  // ── Step 2: Validate all serial numbers ───────────────────
  // Every serial number must exist and be AVAILABLE before dispatch.
  for (const snId of serial_number_ids) {
    const snResult = await db.query(
      'SELECT id, status, serial_number FROM serial_numbers WHERE id = $1',
      [snId]
    );

    if (snResult.rows.length === 0) {
      throw new AppError(`Serial number with id ${snId} not found.`, 404);
    }

    if (snResult.rows[0].status !== 'AVAILABLE') {
      throw new AppError(
        `Serial number "${snResult.rows[0].serial_number}" is not AVAILABLE (current status: ${snResult.rows[0].status}).`,
        400
      );
    }
  }

  // ── Step 3: Do everything in a transaction ─────────────────
  const dispatch = await db.transaction(async (client) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 3a. Create the dispatch record
    const dispatchResult = await client.query(
      `INSERT INTO dispatches (order_id, dispatched_at, status, notes, dispatched_by)
       VALUES ($1, NOW(), 'IN_TRANSIT', $2, $3)
       RETURNING *`,
      [order_id, notes || null, req.user.id]
    );

    const newDispatch = dispatchResult.rows[0];

    // 3b, 3c, 3d, 3e: For each serial number...
    for (const snId of serial_number_ids) {
      // Link serial number to this dispatch
      await client.query(
        'INSERT INTO dispatch_items (dispatch_id, serial_number_id) VALUES ($1, $2)',
        [newDispatch.id, snId]
      );

      // Fetch category so we can calculate warranty duration
      const snResult = await client.query(
        `SELECT sn.id, sn.product_id, p.category
         FROM serial_numbers sn
         JOIN products p ON p.id = sn.product_id
         WHERE sn.id = $1`,
        [snId]
      );
      const sn = snResult.rows[0];

      // Mark serial number as DISPATCHED and attach it to this order
      await client.query(
        `UPDATE serial_numbers
         SET status = 'DISPATCHED', order_id = $1, dispatch_date = $2
         WHERE id = $3`,
        [order_id, today, snId]
      );

      // Reduce available inventory by 1 for this product
      await client.query(
        `UPDATE inventory
         SET quantity_available = quantity_available - 1,
             updated_at = NOW()
         WHERE product_id = $1`,
        [sn.product_id]
      );

      // 3f. Auto-activate warranty if this product category has a warranty
      // (e.g. SOLAR_PANEL = 20yr, INVERTER = 2yr, CABLE = no warranty)
      const expiryDate = calculateExpiryDate(today, sn.category);

      if (expiryDate) {
        await client.query(
          `INSERT INTO warranties
             (serial_number_id, start_date, expiry_date, warranty_status)
           VALUES ($1, $2, $3, 'ACTIVE')
           ON CONFLICT (serial_number_id) DO NOTHING`,
          [snId, today, expiryDate.toISOString().split('T')[0]]
        );
      }
    }

    // 3e. Update order status to DISPATCHED
    await client.query(
      "UPDATE orders SET status = 'DISPATCHED' WHERE id = $1",
      [order_id]
    );

    return newDispatch;
  });

  sendCreated(res, 'Dispatch created and warranties activated.', dispatch);
});

// ─────────────────────────────────────────────
// PATCH /api/dispatches/:id/deliver
// Marks a dispatch as DELIVERED (driver confirms delivery).
// Updates order status to DELIVERED as well.
// ─────────────────────────────────────────────
export const markDelivered = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await db.query(
    'SELECT id, order_id, status FROM dispatches WHERE id = $1',
    [id]
  );

  if (existing.rows.length === 0) {
    throw new AppError('Dispatch not found.', 404);
  }

  if (existing.rows[0].status === 'DELIVERED') {
    throw new AppError('This dispatch is already marked as delivered.', 400);
  }

  await db.transaction(async (client) => {
    await client.query(
      "UPDATE dispatches SET status = 'DELIVERED' WHERE id = $1",
      [id]
    );

    await client.query(
      "UPDATE orders SET status = 'DELIVERED' WHERE id = $1",
      [existing.rows[0].order_id]
    );
  });

  sendSuccess(res, 'Dispatch marked as delivered.');
});

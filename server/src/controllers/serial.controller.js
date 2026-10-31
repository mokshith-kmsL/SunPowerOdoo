import db          from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/responseHelper.js';
import AppError     from '../utils/AppError.js';

// ─────────────────────────────────────────────
// GET /api/serial-numbers
// Returns all serial numbers.
// Optional filter: ?product_id=3 or ?status=AVAILABLE
// ─────────────────────────────────────────────
export const getAllSerialNumbers = asyncHandler(async (req, res) => {
  const { product_id, status } = req.query;

  const conditions = [];
  const params     = [];

  if (product_id) {
    params.push(product_id);
    conditions.push(`sn.product_id = $${params.length}`);
  }

  if (status) {
    params.push(status.toUpperCase());
    conditions.push(`sn.status = $${params.length}`);
  }

  const whereClause = conditions.length > 0
    ? 'WHERE ' + conditions.join(' AND ')
    : '';

  const result = await db.query(
    `SELECT
       sn.*,
       p.name     AS product_name,
       p.sku,
       p.category
     FROM serial_numbers sn
     JOIN products p ON p.id = sn.product_id
     ${whereClause}
     ORDER BY sn.created_at DESC`,
    params
  );

  sendSuccess(res, 'Serial numbers fetched.', result.rows);
});

// ─────────────────────────────────────────────
// POST /api/serial-numbers
// Registers new serial numbers for a product.
// Used when products arrive from the supplier.
//
// Body: { product_id, serial_numbers: ['SN001', 'SN002', ...] }
//
// We use a transaction because we're inserting multiple rows and also
// updating inventory stock. Both should succeed or both should fail.
// ─────────────────────────────────────────────
export const addSerialNumbers = asyncHandler(async (req, res) => {
  const { product_id, serial_numbers } = req.body;

  if (!product_id || !serial_numbers || serial_numbers.length === 0) {
    throw new AppError('product_id and serial_numbers array are required.', 400);
  }

  // Verify the product exists
  const productCheck = await db.query(
    'SELECT id FROM products WHERE id = $1',
    [product_id]
  );
  if (productCheck.rows.length === 0) {
    throw new AppError('Product not found.', 404);
  }

  // Sanitize: trim whitespace from all serial numbers
  const cleanedSerials = serial_numbers.map((s) => s.trim());

  // Check for duplicates in the request itself
  const uniqueSerials = new Set(cleanedSerials);
  if (uniqueSerials.size !== cleanedSerials.length) {
    throw new AppError('Duplicate serial numbers in request.', 400);
  }

  // Use a transaction: insert serial numbers + update inventory count together
  const inserted = await db.transaction(async (client) => {
    const insertedItems = [];

    for (const serial of cleanedSerials) {
      // The UNIQUE constraint on serial_number will catch any DB-level duplicates
      const result = await client.query(
        `INSERT INTO serial_numbers (product_id, serial_number)
         VALUES ($1, $2)
         RETURNING *`,
        [product_id, serial]
      );
      insertedItems.push(result.rows[0]);
    }

    // Increase inventory count for this product
    await client.query(
      `UPDATE inventory
       SET quantity_available = quantity_available + $1,
           updated_at = NOW()
       WHERE product_id = $2`,
      [cleanedSerials.length, product_id]
    );

    return insertedItems;
  });

  sendCreated(res, `${inserted.length} serial number(s) added.`, inserted);
});

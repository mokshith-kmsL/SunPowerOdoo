import db          from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/responseHelper.js';
import AppError     from '../utils/AppError.js';

// ─────────────────────────────────────────────
// GET /api/inventory
// Returns all products with their current stock levels.
// ─────────────────────────────────────────────
export const getAllInventory = asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT
       i.id,
       i.product_id,
       i.quantity_available,
       i.quantity_reserved,
       i.updated_at,
       p.name          AS product_name,
       p.sku,
       p.category,
       p.minimum_stock
     FROM inventory i
     JOIN products p ON p.id = i.product_id
     ORDER BY p.category, p.name`
  );

  sendSuccess(res, 'Inventory fetched.', result.rows);
});

// ─────────────────────────────────────────────
// GET /api/inventory/low-stock
// Returns products where available quantity is at or below
// the minimum_stock threshold. Useful for reorder alerts.
// ─────────────────────────────────────────────
export const getLowStock = asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT
       i.product_id,
       i.quantity_available,
       i.quantity_reserved,
       p.name          AS product_name,
       p.sku,
       p.category,
       p.minimum_stock
     FROM inventory i
     JOIN products p ON p.id = i.product_id
     WHERE i.quantity_available <= p.minimum_stock
     ORDER BY i.quantity_available ASC`
  );

  sendSuccess(res, 'Low stock items fetched.', result.rows);
});

// ─────────────────────────────────────────────
// GET /api/inventory/:product_id
// Returns stock details for one specific product.
// ─────────────────────────────────────────────
export const getInventoryByProduct = asyncHandler(async (req, res) => {
  const { product_id } = req.params;

  const result = await db.query(
    `SELECT
       i.*,
       p.name AS product_name,
       p.sku,
       p.category,
       p.minimum_stock
     FROM inventory i
     JOIN products p ON p.id = i.product_id
     WHERE i.product_id = $1`,
    [product_id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Inventory record not found for this product.', 404);
  }

  sendSuccess(res, 'Inventory fetched.', result.rows[0]);
});

// ─────────────────────────────────────────────
// PUT /api/inventory/:product_id
// Manually adjusts the stock count for a product.
// Used when receiving new stock from a supplier.
//
// Body: { quantity_available, notes }
//
// Note: We never let quantity go below 0.
// Reserved quantity is managed automatically by the dispatch process.
// ─────────────────────────────────────────────
export const updateInventory = asyncHandler(async (req, res) => {
  const { product_id }        = req.params;
  const { quantity_available } = req.body;

  if (quantity_available === undefined || quantity_available === null) {
    throw new AppError('quantity_available is required.', 400);
  }

  if (parseInt(quantity_available) < 0) {
    throw new AppError('Stock quantity cannot be negative.', 400);
  }

  // Check the inventory record exists
  const existing = await db.query(
    'SELECT id FROM inventory WHERE product_id = $1',
    [product_id]
  );

  if (existing.rows.length === 0) {
    throw new AppError('Inventory record not found for this product.', 404);
  }

  const result = await db.query(
    `UPDATE inventory
     SET quantity_available = $1,
         updated_by         = $2,
         updated_at         = NOW()
     WHERE product_id = $3
     RETURNING *`,
    [parseInt(quantity_available), req.user.id, product_id]
  );

  sendSuccess(res, 'Inventory updated.', result.rows[0]);
});

// ─────────────────────────────────────────────
// POST /api/inventory/:product_id/add-stock
// Adds stock to a product (e.g. after receiving a delivery).
// Body: { quantity }
// ─────────────────────────────────────────────
export const addStock = asyncHandler(async (req, res) => {
  const { product_id } = req.params;
  const { quantity }   = req.body;

  if (!quantity || parseInt(quantity) <= 0) {
    throw new AppError('quantity must be a positive number.', 400);
  }

  const existing = await db.query(
    'SELECT id FROM inventory WHERE product_id = $1',
    [product_id]
  );

  if (existing.rows.length === 0) {
    throw new AppError('Inventory record not found for this product.', 404);
  }

  const result = await db.query(
    `UPDATE inventory
     SET quantity_available = quantity_available + $1,
         updated_by         = $2,
         updated_at         = NOW()
     WHERE product_id = $3
     RETURNING *`,
    [parseInt(quantity), req.user.id, product_id]
  );

  sendSuccess(res, `Added ${quantity} units to stock.`, result.rows[0]);
});

import db          from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/responseHelper.js';
import AppError     from '../utils/AppError.js';

// ─────────────────────────────────────────────
// GET /api/products
// Returns all active products.
// Optional filter: ?category=INVERTER
// ─────────────────────────────────────────────
export const getAllProducts = asyncHandler(async (req, res) => {
  const { category } = req.query;

  let result;

  if (category) {
    result = await db.query(
      `SELECT * FROM products
       WHERE category = $1 AND is_active = true
       ORDER BY name`,
      [category.toUpperCase()]
    );
  } else {
    result = await db.query(
      'SELECT * FROM products WHERE is_active = true ORDER BY category, name'
    );
  }

  sendSuccess(res, 'Products fetched.', result.rows);
});

// ─────────────────────────────────────────────
// GET /api/products/:id
// Returns a single product with its current inventory.
// ─────────────────────────────────────────────
export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await db.query(
    `SELECT
       p.*,
       i.quantity_available,
       i.quantity_reserved
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.id
     WHERE p.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Product not found.', 404);
  }

  sendSuccess(res, 'Product fetched.', result.rows[0]);
});

// ─────────────────────────────────────────────
// POST /api/products
// Creates a new product.
// Body: { name, sku, category, description,
//         purchase_price, selling_price, minimum_stock }
// ─────────────────────────────────────────────
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    sku,
    category,
    description,
    purchase_price,
    selling_price,
    minimum_stock = 0,
  } = req.body;

  if (!name || !sku || !category || !purchase_price || !selling_price) {
    throw new AppError('name, sku, category, purchase_price and selling_price are required.', 400);
  }

  // Create the product first
  const productResult = await db.query(
    `INSERT INTO products
       (name, sku, category, description, purchase_price, selling_price, minimum_stock)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      name.trim(),
      sku.trim().toUpperCase(),
      category.toUpperCase(),
      description   || null,
      purchase_price,
      selling_price,
      minimum_stock,
    ]
  );

  const product = productResult.rows[0];

  // Automatically create an inventory record for the new product (starting at 0 stock)
  await db.query(
    'INSERT INTO inventory (product_id, quantity_available, quantity_reserved) VALUES ($1, 0, 0)',
    [product.id]
  );

  sendCreated(res, 'Product created.', product);
});

// ─────────────────────────────────────────────
// PUT /api/products/:id
// Updates product details. ADMIN or WAREHOUSE only.
// ─────────────────────────────────────────────
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    purchase_price,
    selling_price,
    minimum_stock,
    is_active,
  } = req.body;

  const existing = await db.query('SELECT id FROM products WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new AppError('Product not found.', 404);
  }

  const result = await db.query(
    `UPDATE products SET
       name           = COALESCE($1, name),
       description    = COALESCE($2, description),
       purchase_price = COALESCE($3, purchase_price),
       selling_price  = COALESCE($4, selling_price),
       minimum_stock  = COALESCE($5, minimum_stock),
       is_active      = COALESCE($6, is_active)
     WHERE id = $7
     RETURNING *`,
    [
      name           || null,
      description    || null,
      purchase_price || null,
      selling_price  || null,
      minimum_stock  ?? null,
      is_active      ?? null,
      id,
    ]
  );

  sendSuccess(res, 'Product updated.', result.rows[0]);
});

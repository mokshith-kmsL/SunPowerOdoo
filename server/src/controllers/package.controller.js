import db          from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/responseHelper.js';
import AppError     from '../utils/AppError.js';

// ─────────────────────────────────────────────
// GET /api/packages
// Returns all packages with their items (Bill of Materials).
// ─────────────────────────────────────────────
export const getAllPackages = asyncHandler(async (req, res) => {
  // Get all packages
  const packagesResult = await db.query(
    'SELECT * FROM packages WHERE is_active = true ORDER BY capacity_kw, system_type'
  );

  // For each package, fetch the items that make up its Bill of Materials
  const packages = packagesResult.rows;

  for (const pkg of packages) {
    const itemsResult = await db.query(
      `SELECT
         pi.quantity,
         p.id            AS product_id,
         p.name          AS product_name,
         p.sku,
         p.category,
         p.selling_price AS unit_price,
         (pi.quantity * p.selling_price) AS line_total
       FROM package_items pi
       JOIN products p ON p.id = pi.product_id
       WHERE pi.package_id = $1
       ORDER BY p.category`,
      [pkg.id]
    );
    pkg.items = itemsResult.rows; // Attach items directly to the package object
  }

  sendSuccess(res, 'Packages fetched.', packages);
});

// ─────────────────────────────────────────────
// GET /api/packages/:id
// Returns a single package with all its BOM items.
// ─────────────────────────────────────────────
export const getPackageById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const packageResult = await db.query(
    'SELECT * FROM packages WHERE id = $1',
    [id]
  );

  if (packageResult.rows.length === 0) {
    throw new AppError('Package not found.', 404);
  }

  const pkg = packageResult.rows[0];

  const itemsResult = await db.query(
    `SELECT
       pi.quantity,
       p.id            AS product_id,
       p.name          AS product_name,
       p.sku,
       p.category,
       p.selling_price AS unit_price,
       (pi.quantity * p.selling_price) AS line_total
     FROM package_items pi
     JOIN products p ON p.id = pi.product_id
     WHERE pi.package_id = $1
     ORDER BY p.category`,
    [id]
  );

  pkg.items = itemsResult.rows;

  sendSuccess(res, 'Package fetched.', pkg);
});

// ─────────────────────────────────────────────
// POST /api/packages
// Creates a new package with its Bill of Materials.
// Body: {
//   capacity_kw, system_type, base_price, description,
//   items: [{ product_id, quantity }, ...]
// }
// ─────────────────────────────────────────────
export const createPackage = asyncHandler(async (req, res) => {
  const { capacity_kw, system_type, base_price, description, items } = req.body;

  if (!capacity_kw || !system_type || !base_price) {
    throw new AppError('capacity_kw, system_type, and base_price are required.', 400);
  }

  if (!items || items.length === 0) {
    throw new AppError('At least one item is required in the package.', 400);
  }

  // Use a transaction because we're inserting into two tables:
  // packages and package_items. If one fails, we want to roll back both.
  const newPackage = await db.transaction(async (client) => {
    // Step 1: Create the package
    const pkgResult = await client.query(
      `INSERT INTO packages (capacity_kw, system_type, base_price, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [capacity_kw, system_type.toUpperCase(), base_price, description || null]
    );

    const pkg = pkgResult.rows[0];

    // Step 2: Insert each item in the Bill of Materials
    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity < 1) {
        throw new AppError('Each item needs a product_id and quantity >= 1.', 400);
      }
      await client.query(
        'INSERT INTO package_items (package_id, product_id, quantity) VALUES ($1, $2, $3)',
        [pkg.id, item.product_id, item.quantity]
      );
    }

    return pkg;
  });

  sendCreated(res, 'Package created.', newPackage);
});

// ─────────────────────────────────────────────
// PUT /api/packages/:id
// Updates package details. Does not change items (manage separately).
// ─────────────────────────────────────────────
export const updatePackage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { capacity_kw, system_type, base_price, description, is_active } = req.body;

  const existing = await db.query('SELECT id FROM packages WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new AppError('Package not found.', 404);
  }

  const result = await db.query(
    `UPDATE packages SET
       capacity_kw  = COALESCE($1, capacity_kw),
       system_type  = COALESCE($2, system_type),
       base_price   = COALESCE($3, base_price),
       description  = COALESCE($4, description),
       is_active    = COALESCE($5, is_active)
     WHERE id = $6
     RETURNING *`,
    [
      capacity_kw || null,
      system_type ? system_type.toUpperCase() : null,
      base_price  || null,
      description || null,
      is_active   ?? null,
      id,
    ]
  );

  sendSuccess(res, 'Package updated.', result.rows[0]);
});

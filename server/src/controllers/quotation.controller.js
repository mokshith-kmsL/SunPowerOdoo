import db          from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/responseHelper.js';
import AppError     from '../utils/AppError.js';

// ─────────────────────────────────────────────
// GET /api/quotations
// Returns all quotations with customer name and status.
// ─────────────────────────────────────────────
export const getAllQuotations = asyncHandler(async (req, res) => {
  const { status, customer_id } = req.query;

  const conditions = [];
  const params     = [];

  if (status) {
    params.push(status.toUpperCase());
    conditions.push(`q.status = $${params.length}`);
  }

  if (customer_id) {
    params.push(customer_id);
    conditions.push(`q.customer_id = $${params.length}`);
  }

  const whereClause = conditions.length > 0
    ? 'WHERE ' + conditions.join(' AND ')
    : '';

  const result = await db.query(
    `SELECT
       q.*,
       c.name AS customer_name,
       u.name AS created_by_name
     FROM quotations q
     JOIN customers c    ON c.id = q.customer_id
     LEFT JOIN users u   ON u.id = q.created_by
     ${whereClause}
     ORDER BY q.created_at DESC`,
    params
  );

  sendSuccess(res, 'Quotations fetched.', result.rows);
});

// ─────────────────────────────────────────────
// GET /api/quotations/:id
// Returns one quotation with all its line items.
// ─────────────────────────────────────────────
export const getQuotationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const quotationResult = await db.query(
    `SELECT
       q.*,
       c.name    AS customer_name,
       c.phone   AS customer_phone,
       c.address AS customer_address,
       u.name    AS created_by_name,
       a.name    AS approved_by_name
     FROM quotations q
     JOIN customers c      ON c.id = q.customer_id
     LEFT JOIN users u     ON u.id = q.created_by
     LEFT JOIN users a     ON a.id = q.approved_by
     WHERE q.id = $1`,
    [id]
  );

  if (quotationResult.rows.length === 0) {
    throw new AppError('Quotation not found.', 404);
  }

  const quotation = quotationResult.rows[0];

  // Fetch all line items for this quotation
  const itemsResult = await db.query(
    `SELECT
       qi.*,
       p.name     AS product_name,
       p.sku,
       p.category
     FROM quotation_items qi
     JOIN products p ON p.id = qi.product_id
     WHERE qi.quotation_id = $1
     ORDER BY p.category`,
    [id]
  );

  quotation.items = itemsResult.rows;

  sendSuccess(res, 'Quotation fetched.', quotation);
});

// ─────────────────────────────────────────────
// POST /api/quotations
// Creates a quotation by auto-generating the BOM from a package.
//
// Business rule: The survey must be APPROVED before a quotation can be made.
//
// How BOM generation works:
//   1. We look up the package the customer selected.
//   2. The package has "package_items" — a list of products + quantities.
//   3. We copy those items into "quotation_items" using the current selling price.
//   4. We calculate the subtotal, tax (18% GST), and total on the server.
//      The frontend never sends prices — we always calculate them here.
//
// Body: { customer_id, survey_id, package_id, discount, notes, valid_until }
// ─────────────────────────────────────────────
export const createQuotation = asyncHandler(async (req, res) => {
  const {
    customer_id,
    survey_id,
    package_id,
    discount = 0,
    notes,
    valid_until,
  } = req.body;

  if (!customer_id || !survey_id || !package_id) {
    throw new AppError('customer_id, survey_id, and package_id are required.', 400);
  }

  // ── Step 1: Verify the survey is APPROVED ─────────────────
  // This is a key business rule: you can't quote for a site that hasn't been surveyed.
  const surveyResult = await db.query(
    'SELECT id, status, customer_id FROM surveys WHERE id = $1',
    [survey_id]
  );

  if (surveyResult.rows.length === 0) {
    throw new AppError('Survey not found.', 404);
  }

  if (surveyResult.rows[0].status !== 'APPROVED') {
    throw new AppError('The survey must be APPROVED before creating a quotation.', 400);
  }

  // ── Step 2: Load the package and its Bill of Materials ─────
  const packageResult = await db.query(
    'SELECT * FROM packages WHERE id = $1 AND is_active = true',
    [package_id]
  );

  if (packageResult.rows.length === 0) {
    throw new AppError('Package not found.', 404);
  }

  const pkg = packageResult.rows[0];

  // Fetch all products in this package with their current selling prices
  const bomResult = await db.query(
    `SELECT
       pi.product_id,
       pi.quantity,
       p.selling_price AS unit_price,
       p.name
     FROM package_items pi
     JOIN products p ON p.id = pi.product_id
     WHERE pi.package_id = $1`,
    [package_id]
  );

  if (bomResult.rows.length === 0) {
    throw new AppError('This package has no items configured.', 400);
  }

  const bomItems = bomResult.rows;

  // ── Step 3: Calculate totals on the server ─────────────────
  // We calculate everything here — never trust prices from the frontend.

  // Subtotal = sum of (quantity × unit_price) for every item
  let subtotal = 0;
  for (const item of bomItems) {
    subtotal += parseFloat(item.quantity) * parseFloat(item.unit_price);
  }

  const discountAmount = parseFloat(discount) || 0;
  const taxRate        = 0.18; // 18% GST
  const taxableAmount  = subtotal - discountAmount;
  const tax            = parseFloat((taxableAmount * taxRate).toFixed(2));
  const total          = parseFloat((taxableAmount + tax).toFixed(2));

  // ── Step 4: Save everything in a transaction ───────────────
  // We insert into quotations AND quotation_items together.
  // If anything fails, nothing is saved.
  const newQuotation = await db.transaction(async (client) => {
    // Insert the quotation header
    const quotationResult = await client.query(
      `INSERT INTO quotations
         (customer_id, survey_id, package_id, capacity_kw, system_type,
          subtotal, tax, discount, total, created_by, notes, valid_until)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        customer_id,
        survey_id,
        package_id,
        pkg.capacity_kw,
        pkg.system_type,
        subtotal.toFixed(2),
        tax,
        discountAmount.toFixed(2),
        total,
        req.user.id,
        notes       || null,
        valid_until || null,
      ]
    );

    const quotation = quotationResult.rows[0];

    // Insert each BOM item as a quotation line item
    for (const item of bomItems) {
      const lineTotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
      await client.query(
        `INSERT INTO quotation_items
           (quotation_id, product_id, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          quotation.id,
          item.product_id,
          item.quantity,
          item.unit_price,
          lineTotal.toFixed(2),
        ]
      );
    }

    return quotation;
  });

  sendCreated(res, 'Quotation created with BOM.', newQuotation);
});

// ─────────────────────────────────────────────
// PATCH /api/quotations/:id/approve
// Approves a quotation. ADMIN or SALES only.
// ─────────────────────────────────────────────
export const approveQuotation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await db.query(
    'SELECT id, status FROM quotations WHERE id = $1',
    [id]
  );

  if (existing.rows.length === 0) {
    throw new AppError('Quotation not found.', 404);
  }

  if (!['DRAFT', 'SENT'].includes(existing.rows[0].status)) {
    throw new AppError('Only DRAFT or SENT quotations can be approved.', 400);
  }

  const result = await db.query(
    `UPDATE quotations
     SET status = 'APPROVED', approved_by = $1, approved_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [req.user.id, id]
  );

  sendSuccess(res, 'Quotation approved.', result.rows[0]);
});

// ─────────────────────────────────────────────
// PATCH /api/quotations/:id/reject
// Rejects a quotation.
// ─────────────────────────────────────────────
export const rejectQuotation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await db.query(
    'SELECT id, status FROM quotations WHERE id = $1',
    [id]
  );

  if (existing.rows.length === 0) {
    throw new AppError('Quotation not found.', 404);
  }

  if (existing.rows[0].status === 'CONVERTED') {
    throw new AppError('Cannot reject a quotation that has already been converted to an order.', 400);
  }

  const result = await db.query(
    `UPDATE quotations
     SET status = 'REJECTED', approved_by = $1, approved_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [req.user.id, id]
  );

  sendSuccess(res, 'Quotation rejected.', result.rows[0]);
});

// ─────────────────────────────────────────────
// POST /api/quotations/:id/convert-to-order
// Converts an APPROVED quotation into an order.
//
// Business rule: Only APPROVED quotations can become orders.
// The quotation total becomes the order's total amount.
// ─────────────────────────────────────────────
export const convertToOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Load the quotation
  const quotationResult = await db.query(
    'SELECT * FROM quotations WHERE id = $1',
    [id]
  );

  if (quotationResult.rows.length === 0) {
    throw new AppError('Quotation not found.', 404);
  }

  const quotation = quotationResult.rows[0];

  if (quotation.status !== 'APPROVED') {
    throw new AppError('Only an APPROVED quotation can be converted to an order.', 400);
  }

  // Use a transaction: mark the quotation as CONVERTED and create the order
  const newOrder = await db.transaction(async (client) => {
    // Mark quotation as CONVERTED so it can't be used again
    await client.query(
      "UPDATE quotations SET status = 'CONVERTED' WHERE id = $1",
      [id]
    );

    // Create the order using the quotation's total
    const orderResult = await client.query(
      `INSERT INTO orders (quotation_id, customer_id, total_amount, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [quotation.id, quotation.customer_id, quotation.total, req.user.id]
    );

    return orderResult.rows[0];
  });

  sendCreated(res, 'Order created from quotation.', newOrder);
});

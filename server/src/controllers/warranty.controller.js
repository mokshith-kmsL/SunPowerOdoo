import db          from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/responseHelper.js';
import AppError     from '../utils/AppError.js';

// GET /api/warranties
export const getAllWarranties = asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT
       w.*,
       sn.serial_number,
       p.name AS product_name,
       p.category
     FROM warranties w
     JOIN serial_numbers sn ON sn.id = w.serial_number_id
     JOIN products p        ON p.id  = sn.product_id
     ORDER BY w.expiry_date`
  );

  sendSuccess(res, 'Warranties fetched.', result.rows);
});

// GET /api/warranties/serial/:serialNumber
export const getWarrantyBySerial = asyncHandler(async (req, res) => {
  const { serialNumber } = req.params;

  const result = await db.query(
    `SELECT
       w.*,
       sn.serial_number,
       p.name AS product_name,
       p.category
     FROM warranties w
     JOIN serial_numbers sn ON sn.id = w.serial_number_id
     JOIN products p        ON p.id  = sn.product_id
     WHERE sn.serial_number = $1`,
    [serialNumber]
  );

  if (result.rows.length === 0) {
    throw new AppError('Warranty not found for this serial number.', 404);
  }

  sendSuccess(res, 'Warranty fetched.', result.rows[0]);
});

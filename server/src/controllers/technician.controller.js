import db          from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/responseHelper.js';

// GET /api/technicians - Returns all technicians with user info
export const getAllTechnicians = asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT
       t.id,
       t.user_id,
       t.phone,
       t.specialization,
       u.name,
       u.email
     FROM technicians t
     JOIN users u ON u.id = t.user_id
     ORDER BY u.name`
  );

  sendSuccess(res, 'Technicians fetched.', result.rows);
});

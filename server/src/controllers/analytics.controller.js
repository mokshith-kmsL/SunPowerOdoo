import db          from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/responseHelper.js';

// GET /api/analytics/dashboard
export const getDashboard = asyncHandler(async (req, res) => {
  // Count totals
  const customersCount = await db.query('SELECT COUNT(*) FROM customers');
  const leadsCount     = await db.query('SELECT COUNT(*) FROM leads');
  const ordersCount    = await db.query('SELECT COUNT(*) FROM orders');
  const ticketsCount   = await db.query("SELECT COUNT(*) FROM service_tickets WHERE status != 'CLOSED'");

  // Revenue
  const revenueResult = await db.query(
    'SELECT COALESCE(SUM(amount), 0) AS total FROM payments'
  );

  sendSuccess(res, 'Dashboard data fetched.', {
    customers: parseInt(customersCount.rows[0].count),
    leads:     parseInt(leadsCount.rows[0].count),
    orders:    parseInt(ordersCount.rows[0].count),
    open_tickets: parseInt(ticketsCount.rows[0].count),
    total_revenue: parseFloat(revenueResult.rows[0].total),
  });
});

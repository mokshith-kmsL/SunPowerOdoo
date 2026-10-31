import db          from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/responseHelper.js';

// GET /api/finance/overview
export const getFinanceOverview = asyncHandler(async (req, res) => {
  // Total revenue from all payments
  const revenueResult = await db.query(
    'SELECT COALESCE(SUM(amount), 0) AS total_revenue FROM payments'
  );

  // Total expenses
  const expensesResult = await db.query(
    'SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM expenses'
  );

  const totalRevenue  = parseFloat(revenueResult.rows[0].total_revenue);
  const totalExpenses = parseFloat(expensesResult.rows[0].total_expenses);
  const profit        = totalRevenue - totalExpenses;

  // Count of orders by status
  const ordersResult = await db.query(
    `SELECT status, COUNT(*) AS count FROM orders GROUP BY status`
  );

  sendSuccess(res, 'Finance overview fetched.', {
    total_revenue:  totalRevenue,
    total_expenses: totalExpenses,
    profit,
    orders_by_status: ordersResult.rows,
  });
});

import { useState, useEffect } from 'react';
import api from '../api.js';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ResponsiveContainer,
} from 'recharts';

export default function Finance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/finance/overview')
      .then((res) => setData(res.data.data))
      .catch(() => setError('Could not load finance data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading"><span className="spinner"></span>Loading…</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!data) return null;

  const ordersByStatus = (data.orders_by_status || []).map((row) => ({
    name: row.status?.replace(/_/g, ' '),
    count: row.count,
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Finance</h2>
          <p>Revenue, expenses and profit overview</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">₹{Number(data.total_revenue).toLocaleString('en-IN')}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">₹{Number(data.total_expenses).toLocaleString('en-IN')}</div>
          <div className="stat-label">Total Expenses</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: Number(data.profit) >= 0 ? '#166534' : '#991b1b' }}>
            ₹{Number(data.profit).toLocaleString('en-IN')}
          </div>
          <div className="stat-label">Profit</div>
        </div>
      </div>

      {/* Revenue vs Expenses bar chart */}
      <div className="chart-card" style={{ marginTop: 16 }}>
        <h3 className="chart-title">Revenue vs Expenses vs Profit</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={[
              { name: 'Revenue', amount: Number(data.total_revenue) },
              { name: 'Expenses', amount: Number(data.total_expenses) },
              { name: 'Profit', amount: Number(data.profit) },
            ]}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#71717a' }} />
            <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
            <Tooltip
              cursor={{ fill: '#f4f4f5' }}
              contentStyle={{ borderRadius: 8, border: '1px solid #e4e4e7', fontSize: '0.85rem' }}
              formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, '']}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              <Cell fill="#18181b" />
              <Cell fill="#a1a1aa" />
              <Cell fill={Number(data.profit) >= 0 ? '#3f3f46' : '#991b1b'} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Orders by status bar chart */}
      <div className="chart-card" style={{ marginTop: 16 }}>
        <h3 className="chart-title">Orders by Status</h3>
        {ordersByStatus.length === 0 ? (
          <p className="chart-empty">No orders yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ordersByStatus} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#71717a' }}
                angle={-25}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis tick={{ fontSize: 11, fill: '#71717a' }} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: '#f4f4f5' }}
                contentStyle={{ borderRadius: 8, border: '1px solid #e4e4e7', fontSize: '0.85rem' }}
              />
              <Bar dataKey="count" fill="#3f3f46" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

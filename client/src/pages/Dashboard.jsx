import { useState, useEffect } from 'react';
import api from '../api.js';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

// Monochrome palette for charts
const CHART_COLORS = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8', '#e4e4e7', '#52525b', '#636366'];

const LEAD_STATUS_ORDER = ['NEW', 'CONTACTED', 'SURVEY_SCHEDULED', 'SURVEY_DONE', 'QUOTED', 'NEGOTIATING', 'WON', 'LOST'];
const ORDER_STATUS_ORDER = ['CONFIRMED', 'IN_PRODUCTION', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'INSTALLATION_SCHEDULED', 'INSTALLED', 'COMPLETED', 'CANCELLED'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [orders, setOrders] = useState([]);
  const [finance, setFinance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/analytics/dashboard'),
      api.get('/leads'),
      api.get('/orders'),
      api.get('/finance/overview'),
    ])
      .then(([statsRes, leadsRes, ordersRes, finRes]) => {
        setStats(statsRes.data.data);
        setLeads(leadsRes.data.data);
        setOrders(ordersRes.data.data);
        setFinance(finRes.data.data);
      })
      .catch(() => setError('Could not load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading"><span className="spinner"></span>Loading…</p>;
  if (error) return <p className="error-text">{error}</p>;

  // Aggregate leads by status
  const leadsByStatus = LEAD_STATUS_ORDER
    .map((status) => ({ name: status.replace(/_/g, ' '), value: leads.filter((l) => l.status === status).length }))
    .filter((d) => d.value > 0);

  // Aggregate orders by status
  const ordersByStatus = ORDER_STATUS_ORDER
    .map((status) => ({ name: status.replace(/_/g, ' '), count: orders.filter((o) => o.status === status).length }))
    .filter((d) => d.count > 0);

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Live overview of SunPower operations</p>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        <StatCard label="Total Customers" value={stats.customers} />
        <StatCard label="Active Leads" value={stats.leads} />
        <StatCard label="Total Orders" value={stats.orders} />
        <StatCard label="Open Tickets" value={stats.open_tickets} />
      </div>

      <div className="stat-card" style={{ marginTop: 16, padding: '24px 22px' }}>
        <div className="stat-value">₹{stats.total_revenue.toLocaleString('en-IN')}</div>
        <div className="stat-label">Total Revenue</div>
      </div>

      {/* Charts row */}
      <div className="chart-grid">
        {/* Leads by status donut */}
        <div className="chart-card">
          <h3 className="chart-title">Leads by Status</h3>
          {leadsByStatus.length === 0 ? (
            <p className="chart-empty">No leads data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={leadsByStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {leadsByStatus.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e4e4e7', fontSize: '0.85rem' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          {/* Legend */}
          <div className="chart-legend">
            {leadsByStatus.map((d, i) => (
              <div key={i} className="legend-item">
                <span className="legend-dot" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="legend-label">{d.name}</span>
                <span className="legend-value">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Orders by status bar chart */}
        <div className="chart-card">
          <h3 className="chart-title">Orders by Status</h3>
          {ordersByStatus.length === 0 ? (
            <p className="chart-empty">No orders data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
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
                <Bar dataKey="count" fill="#18181b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Revenue vs Expenses */}
      {finance && (
        <div className="chart-card" style={{ marginTop: 16 }}>
          <h3 className="chart-title">Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={[
                { name: 'Revenue', amount: Number(finance.total_revenue) },
                { name: 'Expenses', amount: Number(finance.total_expenses) },
                { name: 'Profit', amount: Number(finance.profit) },
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
                <Cell fill={Number(finance.profit) >= 0 ? '#3f3f46' : '#991b1b'} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

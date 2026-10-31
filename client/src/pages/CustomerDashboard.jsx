import { useState, useEffect } from 'react';
import api from '../api.js';

const LEAD_STATUS = {
  NEW:               { label: 'Received',         color: 'badge-gray'   },
  CONTACTED:         { label: 'Sales Contacted',   color: 'badge-blue'   },
  SURVEY_SCHEDULED:  { label: 'Survey Scheduled',  color: 'badge-yellow' },
  SURVEY_DONE:       { label: 'Survey Complete',   color: 'badge-yellow' },
  QUOTED:            { label: 'Quote Ready',        color: 'badge-blue'   },
  NEGOTIATING:       { label: 'Under Discussion',  color: 'badge-blue'   },
  WON:               { label: 'Confirmed',         color: 'badge-green'  },
  LOST:              { label: 'Cancelled',         color: 'badge-red'    },
};

const QUOT_STATUS = {
  DRAFT:     'badge-gray',
  SENT:      'badge-blue',
  APPROVED:  'badge-green',
  REJECTED:  'badge-red',
  CONVERTED: 'badge-yellow',
};

export default function CustomerDashboard({ user }) {
  const [myCustomer, setMyCustomer] = useState(null);
  const [leads, setLeads]           = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders]         = useState([]);
  const [tickets, setTickets]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    if (!user) return;

    // Step 1: find THIS customer's record (match by user_id === logged-in user's id)
    api.get('/customers')
      .then((res) => {
        const me = res.data.data.find((c) => c.user_id === user.id);
        if (!me) {
          setError('No customer profile found for your account. Contact support.');
          setLoading(false);
          return null;
        }
        setMyCustomer(me);
        return me;
      })
      .then((me) => {
        if (!me) return;
        // Step 2: fetch all data for THIS customer
        return Promise.all([
          api.get('/leads'),
          api.get('/quotations'),
          api.get('/orders'),
          api.get('/tickets'),
        ]).then(([leadsRes, quotRes, ordRes, tickRes]) => {
          // Filter each list to only this customer's records
          setLeads(leadsRes.data.data.filter((l) => l.customer_id === me.id));
          setQuotations(quotRes.data.data.filter((q) => q.customer_id === me.id));
          setOrders(ordRes.data.data.filter((o) => o.customer_id === me.id));
          setTickets(tickRes.data.data.filter((t) => t.customer_id === me.id));
        });
      })
      .catch(() => setError('Could not load your data. Please try again.'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <p className="loading"><span className="spinner"></span>Loading…</p>;
  if (error)   return <p className="error-text">{error}</p>;

  const openTickets = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  const totalPaid   = orders.reduce((s, o) => s + Number(o.amount_paid || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>My Dashboard</h2>
          <p>Welcome back, {myCustomer?.name || user.name}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{leads.length}</div>
          <div className="stat-label">Quote Requests</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{quotations.length}</div>
          <div className="stat-label">Quotations</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{orders.length}</div>
          <div className="stat-label">Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{openTickets}</div>
          <div className="stat-label">Open Tickets</div>
        </div>
      </div>

      {/* My Quote Requests (leads) */}
      <div className="chart-card" style={{ marginTop: 20 }}>
        <h3 className="chart-title">My Quote Requests</h3>
        <p style={{ fontSize: '0.82rem', color: '#71717a', marginBottom: 14 }}>
          Requests you submitted. Our team will contact you to schedule a site survey.
        </p>
        <div className="table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>System</th>
                <th>Capacity</th>
                <th>Source</th>
                <th>Requested On</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr><td colSpan={5} className="empty">No requests yet. Go to "My Quotations" and click "Request Quote".</td></tr>
              ) : leads.map((l) => {
                const s = LEAD_STATUS[l.status] || { label: l.status, color: 'badge-gray' };
                return (
                  <tr key={l.id}>
                    <td>{l.system_type?.replace('_', '-') || '—'}</td>
                    <td>{l.capacity_kw ? `${l.capacity_kw}kW` : '—'}</td>
                    <td>{l.source || '—'}</td>
                    <td>{new Date(l.created_at).toLocaleDateString('en-IN')}</td>
                    <td><span className={`pill ${s.color}`}>{s.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* My Quotations */}
      <div className="chart-card" style={{ marginTop: 16 }}>
        <h3 className="chart-title">My Quotations</h3>
        <div className="table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>System</th>
                <th>Capacity</th>
                <th>Total (incl. GST)</th>
                <th>Valid Until</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {quotations.length === 0 ? (
                <tr><td colSpan={5} className="empty">No quotations yet. They appear here once our team prepares one for you.</td></tr>
              ) : quotations.map((q) => (
                <tr key={q.id}>
                  <td>{q.system_type?.replace('_', '-') || '—'}</td>
                  <td>{q.capacity_kw}kW</td>
                  <td><strong>₹{Number(q.total).toLocaleString('en-IN')}</strong></td>
                  <td>{q.valid_until ? new Date(q.valid_until).toLocaleDateString('en-IN') : '—'}</td>
                  <td><span className={`pill ${QUOT_STATUS[q.status] || 'badge-gray'}`}>{q.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* My Orders */}
      {orders.length > 0 && (
        <div className="chart-card" style={{ marginTop: 16 }}>
          <h3 className="chart-title">My Orders</h3>
          <div className="table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>#{o.id}</strong></td>
                    <td>₹{Number(o.total_amount).toLocaleString('en-IN')}</td>
                    <td>₹{Number(o.amount_paid).toLocaleString('en-IN')}</td>
                    <td style={{ color: Number(o.balance_due) > 0 ? '#991b1b' : '#166534', fontWeight: 600 }}>
                      ₹{Number(o.balance_due).toLocaleString('en-IN')}
                    </td>
                    <td><span className="pill badge-gray">{o.status?.replace(/_/g, ' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* My Service Tickets */}
      {tickets.length > 0 && (
        <div className="chart-card" style={{ marginTop: 16 }}>
          <h3 className="chart-title">My Service Tickets</h3>
          <div className="table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Description</th>
                  <th>Warranty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td>{t.product_name || '—'}</td>
                    <td style={{ maxWidth: 300 }}>{t.description}</td>
                    <td>{t.warranty_covered
                      ? <span className="pill badge-green">Covered</span>
                      : <span className="pill badge-red">Not Covered</span>}
                    </td>
                    <td><span className="pill badge-gray">{t.status?.replace(/_/g, ' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state if nothing at all */}
      {leads.length === 0 && quotations.length === 0 && orders.length === 0 && (
        <div className="info-banner" style={{ marginTop: 20, textAlign: 'center', padding: '28px 20px' }}>
          <strong>Get started</strong> — go to <strong>My Quotations</strong> in the sidebar and click <strong>"+ Request Quote"</strong> to request a solar system quote. Our team will contact you within 24 hours.
        </div>
      )}
    </div>
  );
}

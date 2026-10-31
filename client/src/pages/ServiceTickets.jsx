import { useState, useEffect } from 'react';
import api from '../api.js';

const STATUS_COLORS = {
  OPEN: 'badge-red',
  IN_PROGRESS: 'badge-blue',
  RESOLVED: 'badge-green',
  CLOSED: 'badge-gray',
  CANCELLED: 'badge-gray',
};

export default function ServiceTickets({ user }) {
  const isCustomer = user?.role === 'CUSTOMER';
  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [serials, setSerials] = useState([]);
  const [myCustomerId, setMyCustomerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ customer_id: '', serial_number_id: '', description: '', fault_code: '' });

  function loadTickets() {
    setLoading(true);
    api.get('/tickets')
      .then((res) => {
        let data = res.data.data;
        // Customers only see their own tickets
        if (isCustomer && myCustomerId) {
          data = data.filter((t) => t.customer_id === myCustomerId);
        }
        setTickets(data);
      })
      .catch(() => setError('Could not load tickets.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    // If customer, find their customer record by user_id
    if (isCustomer) {
      api.get('/customers')
        .then((res) => {
          const me = res.data.data.find((c) => c.user_id === user.id);
          if (me) {
            setMyCustomerId(me.id);
            setForm((f) => ({ ...f, customer_id: me.id }));
          }
        });
      // Load serials filtered to customer's orders (approximate: load all, they'll pick from dropdown)
      api.get('/serial-numbers').then((res) => setSerials(res.data.data));
    } else {
      api.get('/customers').then((res) => setCustomers(res.data.data));
      api.get('/serial-numbers').then((res) => setSerials(res.data.data));
    }
  }, []);

  // Reload tickets once we know the customer id
  useEffect(() => {
    if (!isCustomer || myCustomerId) {
      loadTickets();
    }
  }, [myCustomerId, isCustomer]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.serial_number_id) delete payload.serial_number_id;
      if (!payload.fault_code) delete payload.fault_code;
      await api.post('/tickets', payload);
      setShowForm(false);
      setForm({ customer_id: isCustomer ? myCustomerId : '', serial_number_id: '', description: '', fault_code: '' });
      loadTickets();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket.');
    } finally {
      setSaving(false);
    }
  }

  async function handleClose(id) {
    try {
      await api.patch(`/tickets/${id}/close`);
      loadTickets();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close ticket.');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{isCustomer ? 'My Service Tickets' : 'Service Tickets'}</h2>
          <p>{isCustomer ? 'Report issues and track repair requests' : 'Fault tracking with automatic warranty checks'}</p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Ticket'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>New Service Ticket</h3>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              {isCustomer ? (
                <div className="form-group">
                  <label>Customer</label>
                  <input value={customers.find((c) => c.id === myCustomerId)?.name || user.name} disabled />
                </div>
              ) : (
                <div className="form-group">
                  <label>Customer *</label>
                  <select name="customer_id" value={form.customer_id} onChange={handleChange} required>
                    <option value="">Select customer…</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Serial Number</label>
                <select name="serial_number_id" value={form.serial_number_id} onChange={handleChange}>
                  <option value="">None / No serial</option>
                  {serials.map((s) => <option key={s.id} value={s.id}>{s.serial_number} — {s.product_name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Fault Code</label>
                <input name="fault_code" value={form.fault_code} onChange={handleChange} placeholder="E.g. E-01" />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <input name="description" value={form.description} onChange={handleChange} required placeholder="Describe the issue…" />
              </div>
            </div>
            {error && <div className="alert-error">{error}</div>}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Create Ticket'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p className="loading"><span className="spinner"></span>Loading…</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Product</th>
                <th>Serial</th>
                <th>Fault Code</th>
                <th>Warranty</th>
                <th>Total Cost</th>
                <th>Status</th>
                {!isCustomer && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr><td colSpan={isCustomer ? 7 : 8} className="empty">No service tickets yet.</td></tr>
              ) : tickets.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.customer_name}</strong>{!isCustomer && <><br /><small>{t.customer_phone}</small></>}</td>
                  <td>{t.product_name || '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{t.serial_number || '—'}</td>
                  <td>{t.fault_code || '—'}</td>
                  <td>
                    {t.warranty_covered
                      ? <span className="pill badge-green">Covered</span>
                      : <span className="pill badge-red">Not Covered</span>}
                  </td>
                  <td>{Number(t.total_cost) > 0 ? `₹${Number(t.total_cost).toLocaleString('en-IN')}` : '₹0'}</td>
                  <td><span className={`pill ${STATUS_COLORS[t.status] || 'badge-gray'}`}>{t.status?.replace(/_/g, ' ')}</span></td>
                  {!isCustomer && (
                    <td>
                      {(t.status === 'OPEN' || t.status === 'IN_PROGRESS') ? (
                        <button className="btn-ghost btn-sm" onClick={() => handleClose(t.id)}>Close</button>
                      ) : '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

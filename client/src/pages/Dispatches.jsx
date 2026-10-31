import { useState, useEffect } from 'react';
import api from '../api.js';

const STATUS_COLORS = {
  PENDING: 'badge-gray',
  IN_TRANSIT: 'badge-blue',
  DELIVERED: 'badge-green',
  RETURNED: 'badge-red',
};

export default function Dispatches() {
  const [dispatches, setDispatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [serials, setSerials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ order_id: '', serial_number_ids: [], notes: '' });

  function loadDispatches() {
    setLoading(true);
    api.get('/dispatches')
      .then((res) => setDispatches(res.data.data))
      .catch(() => setError('Could not load dispatches.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadDispatches();
    api.get('/orders').then((res) => setOrders(res.data.data));
    api.get('/serial-numbers', { params: { status: 'AVAILABLE' } }).then((res) => setSerials(res.data.data));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function toggleSerial(id) {
    const ids = form.serial_number_ids.includes(id)
      ? form.serial_number_ids.filter((x) => x !== id)
      : [...form.serial_number_ids, id];
    setForm({ ...form, serial_number_ids: ids });
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (form.serial_number_ids.length === 0) {
        setError('Select at least one serial number.');
        setSaving(false);
        return;
      }
      await api.post('/dispatches', {
        order_id: form.order_id,
        serial_number_ids: form.serial_number_ids,
        notes: form.notes || undefined,
      });
      setShowForm(false);
      setForm({ order_id: '', serial_number_ids: [], notes: '' });
      loadDispatches();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create dispatch.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeliver(id) {
    try {
      await api.patch(`/dispatches/${id}/deliver`);
      loadDispatches();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark delivered.');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dispatches</h2>
          <p>Track shipments and activate warranties</p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Dispatch'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>New Dispatch</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Order *</label>
              <select name="order_id" value={form.order_id} onChange={handleChange} required>
                <option value="">Select order…</option>
                {orders.map((o) => <option key={o.id} value={o.id}>#{o.id} — {o.customer_name}</option>)}
              </select>
            </div>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: 6 }}>Available Serial Numbers</label>
            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #d4d4d8', borderRadius: 6, marginBottom: 12 }}>
              {serials.length === 0 ? (
                <p style={{ padding: 12, color: '#71717a', fontSize: '0.875rem' }}>No available serial numbers.</p>
              ) : serials.map((s) => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.serial_number_ids.includes(s.id)} onChange={() => toggleSerial(s.id)} />
                  <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{s.serial_number}</span>
                  <span style={{ fontSize: '0.78rem', color: '#71717a' }}>{s.product_name}</span>
                </label>
              ))}
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input name="notes" value={form.notes} onChange={handleChange} />
            </div>
            {error && <div className="alert-error">{error}</div>}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Create Dispatch'}
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
                <th>Dispatch #</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Dispatched At</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dispatches.length === 0 ? (
                <tr><td colSpan={6} className="empty">No dispatches yet.</td></tr>
              ) : dispatches.map((d) => (
                <tr key={d.id}>
                  <td><strong>#{d.id}</strong></td>
                  <td>#{d.order_id}</td>
                  <td>{d.customer_name}</td>
                  <td>{d.dispatched_at ? new Date(d.dispatched_at).toLocaleString('en-IN') : '—'}</td>
                  <td><span className={`pill ${STATUS_COLORS[d.status] || 'badge-gray'}`}>{d.status?.replace(/_/g, ' ')}</span></td>
                  <td>
                    {d.status === 'PENDING' || d.status === 'IN_TRANSIT' ? (
                      <button className="btn-ghost btn-sm" onClick={() => handleDeliver(d.id)}>Mark Delivered</button>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

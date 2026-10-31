import { useState, useEffect } from 'react';
import api from '../api.js';

const TYPE_COLORS = {
  ADVANCE: 'badge-blue',
  PARTIAL: 'badge-yellow',
  FINAL: 'badge-green',
  REFUND: 'badge-red',
};

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ order_id: '', amount: '', payment_type: 'ADVANCE', payment_reference: '', payment_date: '', notes: '' });

  function loadPayments() {
    setLoading(true);
    api.get('/payments')
      .then((res) => setPayments(res.data.data))
      .catch(() => setError('Could not load payments.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadPayments();
    api.get('/orders').then((res) => setOrders(res.data.data));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.payment_date) delete payload.payment_date;
      if (!payload.notes) delete payload.notes;
      await api.post('/payments', payload);
      setShowForm(false);
      setForm({ order_id: '', amount: '', payment_type: 'ADVANCE', payment_reference: '', payment_date: '', notes: '' });
      loadPayments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Payments</h2>
          <p>Payment records for all orders</p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Record Payment'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>Record Payment</h3>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>Order *</label>
                <select name="order_id" value={form.order_id} onChange={handleChange} required>
                  <option value="">Select order…</option>
                  {orders.map((o) => <option key={o.id} value={o.id}>#{o.id} — {o.customer_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Amount (₹) *</label>
                <input name="amount" type="number" step="0.01" value={form.amount} onChange={handleChange} required placeholder="5000" />
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select name="payment_type" value={form.payment_type} onChange={handleChange}>
                  <option value="ADVANCE">Advance</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="FINAL">Final</option>
                  <option value="REFUND">Refund</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Reference *</label>
                <input name="payment_reference" value={form.payment_reference} onChange={handleChange} required placeholder="PAY-2026-001" />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input name="payment_date" type="date" value={form.payment_date} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input name="notes" value={form.notes} onChange={handleChange} />
              </div>
            </div>
            {error && <div className="alert-error">{error}</div>}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Record Payment'}
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
                <th>Ref</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Date</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={7} className="empty">No payments recorded.</td></tr>
              ) : payments.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.payment_reference}</strong></td>
                  <td>#{p.order_id}</td>
                  <td>{p.customer_name}</td>
                  <td>₹{Number(p.amount).toLocaleString('en-IN')}</td>
                  <td><span className={`pill ${TYPE_COLORS[p.payment_type] || 'badge-gray'}`}>{p.payment_type}</span></td>
                  <td>{new Date(p.payment_date).toLocaleDateString('en-IN')}</td>
                  <td>{p.recorded_by_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

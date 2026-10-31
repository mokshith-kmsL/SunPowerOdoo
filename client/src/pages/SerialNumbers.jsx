import { useState, useEffect } from 'react';
import api from '../api.js';

const STATUS_COLORS = {
  AVAILABLE: 'badge-green',
  RESERVED: 'badge-yellow',
  DISPATCHED: 'badge-blue',
  INSTALLED: 'badge-gray',
  FAULTY: 'badge-red',
  RETURNED: 'badge-red',
};

export default function SerialNumbers() {
  const [serials, setSerials] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ product_id: '', serial_numbers: '' });

  function loadSerials() {
    setLoading(true);
    api.get('/serial-numbers')
      .then((res) => setSerials(res.data.data))
      .catch(() => setError('Could not load serial numbers.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadSerials();
    api.get('/products').then((res) => setProducts(res.data.data));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const sns = form.serial_numbers.split('\n').map((s) => s.trim()).filter(Boolean);
      if (sns.length === 0) {
        setError('Enter at least one serial number.');
        setSaving(false);
        return;
      }
      await api.post('/serial-numbers', { product_id: form.product_id, serial_numbers: sns });
      setShowForm(false);
      setForm({ product_id: '', serial_numbers: '' });
      loadSerials();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add serial numbers.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Serial Numbers</h2>
          <p>Track individual units by serial number</p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Serials'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>Add Serial Numbers</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Product *</label>
              <select name="product_id" value={form.product_id} onChange={handleChange} required>
                <option value="">Select product…</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Serial Numbers (one per line) *</label>
              <textarea name="serial_numbers" value={form.serial_numbers} onChange={handleChange} required rows={5}
                placeholder={'WAR-540-2026-0001\nWAR-540-2026-0002\nWAR-540-2026-0003'}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d4d4d8', borderRadius: 6, fontSize: '0.9rem', fontFamily: 'monospace', resize: 'vertical' }}
              />
            </div>
            {error && <div className="alert-error">{error}</div>}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Add Serial Numbers'}
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
                <th>Serial Number</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Order</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {serials.length === 0 ? (
                <tr><td colSpan={6} className="empty">No serial numbers yet.</td></tr>
              ) : serials.map((s) => (
                <tr key={s.id}>
                  <td><strong style={{ fontFamily: 'monospace' }}>{s.serial_number}</strong></td>
                  <td>{s.product_name}</td>
                  <td>{s.sku}</td>
                  <td>{s.category?.replace(/_/g, ' ')}</td>
                  <td>{s.order_id ? `#${s.order_id}` : '—'}</td>
                  <td><span className={`pill ${STATUS_COLORS[s.status] || 'badge-gray'}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

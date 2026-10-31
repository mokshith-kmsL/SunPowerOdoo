import { useState, useEffect } from 'react';
import api from '../api.js';

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ capacity_kw: '', system_type: 'ON_GRID', base_price: '', description: '', items: [{ product_id: '', quantity: '1' }] });

  function loadPackages() {
    setLoading(true);
    api.get('/packages')
      .then((res) => setPackages(res.data.data))
      .catch(() => setError('Could not load packages.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadPackages();
    api.get('/products').then((res) => setProducts(res.data.data));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleItemChange(idx, field, value) {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  }

  function addItem() {
    setForm({ ...form, items: [...form.items, { product_id: '', quantity: '1' }] });
  }

  function removeItem(idx) {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const items = form.items.filter((i) => i.product_id && i.quantity);
      if (items.length === 0) {
        setError('Add at least one product to the package.');
        setSaving(false);
        return;
      }
      await api.post('/packages', { ...form, items });
      setShowForm(false);
      setForm({ capacity_kw: '', system_type: 'ON_GRID', base_price: '', description: '', items: [{ product_id: '', quantity: '1' }] });
      loadPackages();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create package.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Packages</h2>
          <p>Solar system packages with bill of materials</p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Package'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>New Package</h3>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>Capacity (kW) *</label>
                <input name="capacity_kw" type="number" step="0.5" value={form.capacity_kw} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>System Type *</label>
                <select name="system_type" value={form.system_type} onChange={handleChange}>
                  <option value="ON_GRID">On-Grid</option>
                  <option value="OFF_GRID">Off-Grid</option>
                </select>
              </div>
              <div className="form-group">
                <label>Base Price (₹) *</label>
                <input name="base_price" type="number" value={form.base_price} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <input name="description" value={form.description} onChange={handleChange} />
            </div>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: 8 }}>Bill of Materials</label>
            {form.items.map((item, idx) => (
              <div className="form-row" key={idx} style={{ marginBottom: 8 }}>
                <div className="form-group" style={{ flex: 2 }}>
                  <select value={item.product_id} onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}>
                    <option value="">Select product…</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <input type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} placeholder="Qty" />
                </div>
                <button type="button" className="btn-ghost btn-sm" style={{ marginBottom: 18 }} onClick={() => removeItem(idx)}>Remove</button>
              </div>
            ))}
            <button type="button" className="btn-secondary btn-sm" style={{ marginBottom: 16 }} onClick={addItem}>+ Add Item</button>
            {error && <div className="alert-error">{error}</div>}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Package'}
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
                <th>Capacity</th>
                <th>Type</th>
                <th>Base Price</th>
                <th>Description</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              {packages.length === 0 ? (
                <tr><td colSpan={5} className="empty">No packages yet.</td></tr>
              ) : packages.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.capacity_kw}kW</strong></td>
                  <td>{p.system_type?.replace('_', '-') || ''}</td>
                  <td>₹{Number(p.base_price).toLocaleString('en-IN')}</td>
                  <td style={{ maxWidth: 300 }}>{p.description || '—'}</td>
                  <td>{p.items?.length || 0} products</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

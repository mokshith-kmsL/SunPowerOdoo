import { useState, useEffect } from 'react';
import api from '../api.js';

const CATEGORIES = ['SOLAR_PANEL', 'INVERTER', 'BATTERY', 'MOUNTING_STRUCTURE', 'CABLE', 'CONNECTOR', 'CHARGE_CONTROLLER', 'METER', 'OTHER'];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ name: '', sku: '', category: 'SOLAR_PANEL', description: '', purchase_price: '', selling_price: '', minimum_stock: '0' });

  function loadProducts(cat = '') {
    setLoading(true);
    api.get('/products', { params: cat ? { category: cat } : {} })
      .then((res) => setProducts(res.data.data))
      .catch(() => setError('Could not load products.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadProducts(); }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/products', form);
      setShowForm(false);
      setForm({ name: '', sku: '', category: 'SOLAR_PANEL', description: '', purchase_price: '', selling_price: '', minimum_stock: '0' });
      loadProducts(filter);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create product.');
    } finally {
      setSaving(false);
    }
  }

  const filtered = filter ? products.filter((p) => p.category === filter) : products;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Products</h2>
          <p>Solar panels, inverters, batteries and more</p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>New Product</h3>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>SKU *</label>
                <input name="sku" value={form.sku} onChange={handleChange} required placeholder="SP-WAR-540" />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select name="category" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Purchase Price (₹) *</label>
                <input name="purchase_price" type="number" step="0.01" value={form.purchase_price} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Selling Price (₹) *</label>
                <input name="selling_price" type="number" step="0.01" value={form.selling_price} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Min Stock</label>
                <input name="minimum_stock" type="number" value={form.minimum_stock} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <input name="description" value={form.description} onChange={handleChange} />
            </div>
            {error && <div className="alert-error">{error}</div>}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Product'}
            </button>
          </form>
        </div>
      )}

      <div className="search-bar">
        <select value={filter} onChange={(e) => { setFilter(e.target.value); }} className="select-input" style={{ width: 'auto' }}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="loading"><span className="spinner"></span>Loading…</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Purchase</th>
                <th>Selling</th>
                <th>Min Stock</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="empty">No products found.</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.sku}</td>
                  <td>{p.category?.replace(/_/g, ' ')}</td>
                  <td>₹{Number(p.purchase_price).toLocaleString('en-IN')}</td>
                  <td>₹{Number(p.selling_price).toLocaleString('en-IN')}</td>
                  <td>{p.minimum_stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

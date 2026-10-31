import { useState, useEffect } from 'react';
import api from '../api.js';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ name: '', phone: '', email: '', address: '' });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  function loadCustomers(q = '') {
    setLoading(true);
    api.get('/customers', { params: q ? { search: q } : {} })
      .then((res) => setCustomers(res.data.data))
      .catch(() => setError('Could not load customers.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadCustomers(); }, []);

  function handleSearch(e) {
    e.preventDefault();
    loadCustomers(search);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/customers', form);
      setShowForm(false);
      setForm({ name: '', phone: '', email: '', address: '' });
      loadCustomers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create customer.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Customers</h2>
          <p>All customer records</p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Customer'}
        </button>
      </div>

      {/* Add customer form */}
      {showForm && (
        <div className="form-card">
          <h3>New Customer</h3>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input name="phone" value={form.phone} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input name="address" value={form.address} onChange={handleChange} />
              </div>
            </div>
            {error && <div className="alert-error">{error}</div>}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Customer'}
            </button>
          </form>
        </div>
      )}

      {/* Search bar */}
      <form onSubmit={handleSearch} className="search-bar">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
        />
        <button type="submit" className="btn-secondary">Search</button>
        {search && (
          <button type="button" className="btn-ghost" onClick={() => { setSearch(''); loadCustomers(); }}>
            Clear
          </button>
        )}
        {!loading && <span className="result-count">{customers.length} result{customers.length !== 1 ? 's' : ''}</span>}
      </form>

      {/* Table */}
      {loading ? (
        <p className="loading"><span className="spinner"></span>Loading…</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={5} className="empty">No customers found.</td></tr>
              ) : customers.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.phone}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.address || '—'}</td>
                  <td>{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

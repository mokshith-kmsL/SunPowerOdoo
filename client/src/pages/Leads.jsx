import { useState, useEffect } from 'react';
import api from '../api.js';

const STATUS_COLORS = {
  NEW:               'badge-gray',
  CONTACTED:         'badge-blue',
  SURVEY_SCHEDULED:  'badge-yellow',
  SURVEY_DONE:       'badge-yellow',
  QUOTED:            'badge-blue',
  NEGOTIATING:       'badge-blue',
  WON:               'badge-green',
  LOST:              'badge-red',
};

export default function Leads() {
  const [leads, setLeads]       = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({
    customer_id: '',
    capacity_kw: '',
    system_type: 'ON_GRID',
    monthly_electricity_bill: '',
    roof_area: '',
    subsidy_required: false,
    source: '',
  });

  function loadLeads() {
    setLoading(true);
    api.get('/leads')
      .then((res) => setLeads(res.data.data))
      .catch(() => setError('Could not load leads.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadLeads();
    // Load customers for the dropdown in the form
    api.get('/customers').then((res) => setCustomers(res.data.data));
  }, []);

  function handleChange(e) {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/leads', form);
      setShowForm(false);
      setForm({ customer_id: '', capacity_kw: '', system_type: 'ON_GRID',
        monthly_electricity_bill: '', roof_area: '', subsidy_required: false, source: '' });
      loadLeads();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create lead.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Leads</h2>
          <p>Customer enquiries and sales pipeline</p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Lead'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>New Lead</h3>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>Customer *</label>
                <select name="customer_id" value={form.customer_id} onChange={handleChange} required>
                  <option value="">Select customer…</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>System Type</label>
                <select name="system_type" value={form.system_type} onChange={handleChange}>
                  <option value="ON_GRID">On-Grid</option>
                  <option value="OFF_GRID">Off-Grid</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Capacity (kW)</label>
                <input name="capacity_kw" type="number" step="0.5" value={form.capacity_kw} onChange={handleChange} placeholder="e.g. 3" />
              </div>
              <div className="form-group">
                <label>Monthly Bill (₹)</label>
                <input name="monthly_electricity_bill" type="number" value={form.monthly_electricity_bill} onChange={handleChange} placeholder="e.g. 3000" />
              </div>
              <div className="form-group">
                <label>Roof Area (sqft)</label>
                <input name="roof_area" type="number" value={form.roof_area} onChange={handleChange} placeholder="e.g. 400" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Source</label>
                <input name="source" value={form.source} onChange={handleChange} placeholder="Website / Referral / Exhibition…" />
              </div>
              <div className="form-group form-check">
                <label>
                  <input type="checkbox" name="subsidy_required" checked={form.subsidy_required} onChange={handleChange} />
                  {' '}Subsidy Required
                </label>
              </div>
            </div>
            {error && <div className="alert-error">{error}</div>}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Lead'}
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
                <th>System</th>
                <th>Capacity</th>
                <th>Monthly Bill</th>
                <th>Source</th>
                <th>Subsidy</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr><td colSpan={7} className="empty">No leads yet.</td></tr>
              ) : leads.map((l) => (
                <tr key={l.id}>
                  <td><strong>{l.customer_name}</strong><br/><small>{l.customer_phone}</small></td>
                  <td>{l.system_type?.replace('_', '-') || '—'}</td>
                  <td>{l.capacity_kw ? `${l.capacity_kw} kW` : '—'}</td>
                  <td>{l.monthly_electricity_bill ? `₹${Number(l.monthly_electricity_bill).toLocaleString('en-IN')}` : '—'}</td>
                  <td>{l.source || '—'}</td>
                  <td>{l.subsidy_required ? 'Yes' : 'No'}</td>
                  <td><span className={`pill ${STATUS_COLORS[l.status] || 'badge-gray'}`}>{l.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

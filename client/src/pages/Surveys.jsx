import { useState, useEffect } from 'react';
import api from '../api.js';

const STATUS_COLORS = {
  PENDING: 'badge-gray',
  IN_PROGRESS: 'badge-blue',
  COMPLETED: 'badge-yellow',
  APPROVED: 'badge-green',
  REJECTED: 'badge-red',
};

export default function Surveys() {
  const [surveys, setSurveys] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ customer_id: '', technician_id: '', lead_id: '', scheduled_date: '', notes: '' });

  function loadSurveys() {
    setLoading(true);
    api.get('/surveys')
      .then((res) => setSurveys(res.data.data))
      .catch(() => setError('Could not load surveys.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadSurveys();
    api.get('/customers').then((res) => setCustomers(res.data.data));
    api.get('/technicians').then((res) => setTechnicians(res.data.data));
    api.get('/leads').then((res) => setLeads(res.data.data));
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
      if (!payload.technician_id) delete payload.technician_id;
      if (!payload.lead_id) delete payload.lead_id;
      await api.post('/surveys', payload);
      setShowForm(false);
      setForm({ customer_id: '', technician_id: '', lead_id: '', scheduled_date: '', notes: '' });
      loadSurveys();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create survey.');
    } finally {
      setSaving(false);
    }
  }

  // Mark a survey as COMPLETED so it can then be approved
  async function handleComplete(id) {
    try {
      await api.put(`/surveys/${id}`, { status: 'COMPLETED' });
      loadSurveys();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update survey.');
    }
  }

  async function handleAction(id, action) {
    try {
      await api.patch(`/surveys/${id}/${action}`);
      loadSurveys();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} survey.`);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Surveys</h2>
          <p>Site survey scheduling and approval</p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Survey'}
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {showForm && (
        <div className="form-card">
          <h3>Schedule Survey</h3>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>Customer *</label>
                <select name="customer_id" value={form.customer_id} onChange={handleChange} required>
                  <option value="">Select customer…</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Technician</label>
                <select name="technician_id" value={form.technician_id} onChange={handleChange}>
                  <option value="">Auto-assign…</option>
                  {technicians.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Lead</label>
                <select name="lead_id" value={form.lead_id} onChange={handleChange}>
                  <option value="">None</option>
                  {leads.map((l) => <option key={l.id} value={l.id}>{l.customer_name} — {l.status}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Scheduled Date</label>
                <input name="scheduled_date" type="date" value={form.scheduled_date} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input name="notes" value={form.notes} onChange={handleChange} placeholder="Site notes…" />
              </div>
            </div>
            {error && <div className="alert-error">{error}</div>}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Schedule Survey'}
            </button>
          </form>
        </div>
      )}

      {/* Workflow explanation */}
      <div className="info-banner">
        Survey workflow: <strong>Pending</strong> → mark <strong>Complete</strong> → <strong>Approve</strong> (allows quotation) or <strong>Reject</strong>
      </div>

      {loading ? (
        <p className="loading"><span className="spinner"></span>Loading…</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Technician</th>
                <th>Scheduled</th>
                <th>Roof Area</th>
                <th>Grid Suitable</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {surveys.length === 0 ? (
                <tr><td colSpan={7} className="empty">No surveys yet. Create one above.</td></tr>
              ) : surveys.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.customer_name}</strong><br /><small>{s.customer_phone}</small></td>
                  <td>{s.technician_name || '—'}</td>
                  <td>{s.scheduled_date ? new Date(s.scheduled_date).toLocaleDateString('en-IN') : '—'}</td>
                  <td>{s.roof_area ? `${s.roof_area} sqft` : '—'}</td>
                  <td>{s.grid_suitable === null ? '—' : s.grid_suitable ? 'Yes' : 'No'}</td>
                  <td><span className={`pill ${STATUS_COLORS[s.status] || 'badge-gray'}`}>{s.status}</span></td>
                  <td>
                    {/* PENDING or IN_PROGRESS: show "Mark Complete" */}
                    {(s.status === 'PENDING' || s.status === 'IN_PROGRESS') && (
                      <button className="btn-ghost btn-sm" onClick={() => handleComplete(s.id)}>Mark Complete</button>
                    )}
                    {/* COMPLETED: show Approve + Reject */}
                    {s.status === 'COMPLETED' && (
                      <>
                        <button className="btn-ghost btn-sm" onClick={() => handleAction(s.id, 'approve')}>Approve</button>
                        <button className="btn-ghost btn-sm" style={{ marginLeft: 4 }} onClick={() => handleAction(s.id, 'reject')}>Reject</button>
                      </>
                    )}
                    {/* APPROVED or REJECTED: no actions */}
                    {(s.status === 'APPROVED' || s.status === 'REJECTED') && <span style={{ color: '#b4b4ba' }}>—</span>}
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

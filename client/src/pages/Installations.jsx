import { useState, useEffect } from 'react';
import api from '../api.js';

const STATUS_COLORS = {
  SCHEDULED: 'badge-yellow',
  IN_PROGRESS: 'badge-blue',
  COMPLETED: 'badge-green',
  FAILED: 'badge-red',
  CANCELLED: 'badge-gray',
};

export default function Installations() {
  const [installations, setInstallations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [completeForm, setCompleteForm] = useState({ test_result: 'PASS', customer_signature: '', notes: '' });
  const [form, setForm] = useState({ order_id: '', technician_id: '', scheduled_date: '', notes: '' });

  function loadInstallations() {
    setLoading(true);
    api.get('/installations')
      .then((res) => setInstallations(res.data.data))
      .catch(() => setError('Could not load installations.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadInstallations();
    api.get('/orders').then((res) => setOrders(res.data.data));
    api.get('/technicians').then((res) => setTechnicians(res.data.data));
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
      if (!payload.notes) delete payload.notes;
      await api.post('/installations', payload);
      setShowForm(false);
      setForm({ order_id: '', technician_id: '', scheduled_date: '', notes: '' });
      loadInstallations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule installation.');
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete(id) {
    try {
      await api.patch(`/installations/${id}/complete`, completeForm);
      setCompletingId(null);
      setCompleteForm({ test_result: 'PASS', customer_signature: '', notes: '' });
      loadInstallations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete installation.');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Installations</h2>
          <p>Schedule and track installation jobs</p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Schedule'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>Schedule Installation</h3>
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
                <label>Technician</label>
                <select name="technician_id" value={form.technician_id} onChange={handleChange}>
                  <option value="">Auto-assign…</option>
                  {technicians.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Scheduled Date *</label>
                <input name="scheduled_date" type="date" value={form.scheduled_date} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input name="notes" value={form.notes} onChange={handleChange} />
            </div>
            {error && <div className="alert-error">{error}</div>}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Schedule'}
            </button>
          </form>
        </div>
      )}

      {completingId && (
        <div className="form-card">
          <h3>Complete Installation #{completingId}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Test Result</label>
              <select value={completeForm.test_result} onChange={(e) => setCompleteForm({ ...completeForm, test_result: e.target.value })}>
                <option value="PASS">Pass</option>
                <option value="FAIL">Fail</option>
              </select>
            </div>
            <div className="form-group">
              <label>Customer Signature</label>
              <input value={completeForm.customer_signature} onChange={(e) => setCompleteForm({ ...completeForm, customer_signature: e.target.value })} placeholder="Customer name" />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <input value={completeForm.notes} onChange={(e) => setCompleteForm({ ...completeForm, notes: e.target.value })} />
          </div>
          <button className="btn-primary btn-sm" style={{ marginTop: 0 }} onClick={() => handleComplete(completingId)}>Mark Complete</button>
          <button className="btn-ghost btn-sm" style={{ marginLeft: 4 }} onClick={() => setCompletingId(null)}>Cancel</button>
        </div>
      )}

      {loading ? (
        <p className="loading"><span className="spinner"></span>Loading…</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Technician</th>
                <th>Scheduled</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Test Result</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {installations.length === 0 ? (
                <tr><td colSpan={8} className="empty">No installations yet.</td></tr>
              ) : installations.map((i) => (
                <tr key={i.id}>
                  <td>#{i.order_id}</td>
                  <td><strong>{i.customer_name}</strong></td>
                  <td>{i.technician_name || '—'}</td>
                  <td>{i.scheduled_date ? new Date(i.scheduled_date).toLocaleDateString('en-IN') : '—'}</td>
                  <td>{i.system_capacity ? `${i.system_capacity}kW` : '—'}</td>
                  <td><span className={`pill ${STATUS_COLORS[i.installation_status] || 'badge-gray'}`}>{i.installation_status?.replace(/_/g, ' ')}</span></td>
                  <td>{i.test_result || '—'}</td>
                  <td>
                    {i.installation_status === 'SCHEDULED' || i.installation_status === 'IN_PROGRESS' ? (
                      <button className="btn-ghost btn-sm" onClick={() => setCompletingId(i.id)}>Complete</button>
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

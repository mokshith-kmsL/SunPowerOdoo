import { useState, useEffect } from 'react';
import api from '../api.js';

const STATUS_COLORS = {
  DRAFT: 'badge-gray',
  SENT: 'badge-blue',
  APPROVED: 'badge-green',
  REJECTED: 'badge-red',
  CONVERTED: 'badge-yellow',
};

export default function Quotations({ user }) {
  const isCustomer = user?.role === 'CUSTOMER';
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [packages, setPackages] = useState([]);
  const [myCustomerId, setMyCustomerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ customer_id: '', survey_id: '', package_id: '', discount: '', notes: '', valid_until: '' });
  const [requestForm, setRequestForm] = useState({ package_id: '', capacity_kw: '', system_type: 'ON_GRID', notes: '' });

  function loadQuotations() {
    setLoading(true);
    api.get('/quotations')
      .then((res) => {
        let data = res.data.data;
        if (isCustomer && myCustomerId) {
          data = data.filter((q) => q.customer_id === myCustomerId);
        }
        setQuotations(data);
      })
      .catch(() => setError('Could not load quotations.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (isCustomer) {
      api.get('/customers')
        .then((res) => {
          // Use == (loose) to handle any int/string mismatch from the JWT
          const me = res.data.data.find((c) => c.user_id == user.id);
          if (me) setMyCustomerId(me.id);
        });
      api.get('/packages').then((res) => setPackages(res.data.data));
    } else {
      api.get('/customers').then((res) => setCustomers(res.data.data));
      api.get('/surveys').then((res) => setSurveys(res.data.data));
      api.get('/packages').then((res) => setPackages(res.data.data));
    }
  }, []);

  useEffect(() => {
    if (!isCustomer || myCustomerId) {
      loadQuotations();
    }
  }, [myCustomerId, isCustomer]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleRequestChange(e) {
    setRequestForm({ ...requestForm, [e.target.name]: e.target.value });
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.discount) delete payload.discount;
      if (!payload.notes) delete payload.notes;
      if (!payload.valid_until) delete payload.valid_until;
      await api.post('/quotations', payload);
      setShowForm(false);
      setForm({ customer_id: '', survey_id: '', package_id: '', discount: '', notes: '', valid_until: '' });
      loadQuotations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create quotation.');
    } finally {
      setSaving(false);
    }
  }

  // Customer requests a quote — creates a lead that sales will follow up on
  async function handleRequestQuote(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const pkg = packages.find((p) => p.id == requestForm.package_id);
      const capacity = requestForm.capacity_kw || pkg?.capacity_kw || 5;
      const sysType  = pkg?.system_type || requestForm.system_type || 'ON_GRID';
      await api.post('/leads', {
        customer_id:     myCustomerId,
        capacity_kw:     capacity,
        system_type:     sysType,
        source:          'Customer Portal',
        subsidy_required: false,
      });
      setShowRequestForm(false);
      setRequestForm({ package_id: '', capacity_kw: '', system_type: 'ON_GRID', notes: '' });
      setSuccessMsg('Request submitted! Our team will contact you within 24 hours to schedule a site survey.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request quotation.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAction(id, action) {
    try {
      await api.patch(`/quotations/${id}/${action}`);
      loadQuotations();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} quotation.`);
    }
  }

  async function handleConvert(id) {
    if (!confirm('Convert this quotation to an order?')) return;
    try {
      await api.post(`/quotations/${id}/convert-to-order`);
      loadQuotations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to convert quotation.');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{isCustomer ? 'My Quotations' : 'Quotations'}</h2>
          <p>{isCustomer ? 'Your quotation requests and approved quotes' : 'Quotes generated from approved surveys'}</p>
        </div>
        {isCustomer ? (
          <button className="btn-primary btn-sm" onClick={() => setShowRequestForm(!showRequestForm)}>
            {showRequestForm ? 'Cancel' : '+ Request Quote'}
          </button>
        ) : (
          <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Quotation'}
          </button>
        )}
      </div>

      {error && <div className="alert-error">{error}</div>}
      {successMsg && (
        <div className="alert-success" style={{ marginBottom: 20 }}>
          {successMsg}
        </div>
      )}

      {/* Customer request quote form */}
      {isCustomer && showRequestForm && (
        <div className="form-card">
          <h3>Request a Quotation</h3>
          <p style={{ fontSize: '0.85rem', color: '#71717a', marginBottom: 16 }}>
            Tell us what you need. Our sales team will contact you within 24 hours to schedule a free site survey.
          </p>
          <form onSubmit={handleRequestQuote}>
            <div className="form-row">
              <div className="form-group">
                <label>System Type *</label>
                <select name="system_type" value={requestForm.system_type} onChange={handleRequestChange}>
                  <option value="ON_GRID">On-Grid (grid-connected)</option>
                  <option value="OFF_GRID">Off-Grid (battery backup)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Preferred Capacity</label>
                <select name="package_id" value={requestForm.package_id} onChange={handleRequestChange}>
                  <option value="">Not sure — advise me</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.capacity_kw}kW {p.system_type.replace('_', '-')} — ₹{Number(p.base_price).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field-note" style={{ marginBottom: 16, marginTop: -8 }}>
              Once you submit, our team will reach out to schedule a free site survey and prepare a detailed quotation.
            </div>
            <button type="submit" className="btn-primary" disabled={saving || !myCustomerId}>
              {saving ? 'Submitting…' : !myCustomerId ? 'Loading…' : 'Submit Request'}
            </button>
          </form>
        </div>
      )}

      {/* Employee create quotation form */}
      {!isCustomer && showForm && (
        <div className="form-card">
          <h3>New Quotation</h3>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>Customer *</label>
                <select name="customer_id" value={form.customer_id} onChange={handleChange} required>
                  <option value="">Select customer…</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Approved Survey *</label>
                <select name="survey_id" value={form.survey_id} onChange={handleChange} required>
                  <option value="">Select survey…</option>
                  {surveys.filter((s) => s.status === 'APPROVED').map((s) => (
                    <option key={s.id} value={s.id}>{s.customer_name} — {s.scheduled_date}</option>
                  ))}
                </select>
                {surveys.filter((s) => s.status === 'APPROVED').length === 0 && (
                  <span className="field-note">
                    No approved surveys yet. Go to the Surveys tab, create a survey, mark it Complete, then Approve it.
                  </span>
                )}
              </div>
              <div className="form-group">
                <label>Package *</label>
                <select name="package_id" value={form.package_id} onChange={handleChange} required>
                  <option value="">Select package…</option>
                  {packages.map((p) => <option key={p.id} value={p.id}>{p.capacity_kw}kW {p.system_type.replace('_', '-')} — ₹{Number(p.base_price).toLocaleString('en-IN')}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Discount (₹)</label>
                <input name="discount" type="number" value={form.discount} onChange={handleChange} placeholder="0" />
              </div>
              <div className="form-group">
                <label>Valid Until</label>
                <input name="valid_until" type="date" value={form.valid_until} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input name="notes" value={form.notes} onChange={handleChange} />
              </div>
            </div>
            {error && <div className="alert-error">{error}</div>}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Create Quotation'}
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
                <th>Capacity</th>
                <th>Subtotal</th>
                <th>Tax (18%)</th>
                <th>Discount</th>
                <th>Total</th>
                <th>Status</th>
                {!isCustomer && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {quotations.length === 0 ? (
                <tr><td colSpan={isCustomer ? 7 : 8} className="empty">
                  {isCustomer ? 'No quotations yet. Click "Request Quote" to get started.' : 'No quotations yet.'}
                </td></tr>
              ) : quotations.map((q) => (
                <tr key={q.id}>
                  <td><strong>{q.customer_name}</strong></td>
                  <td>{q.capacity_kw}kW {q.system_type?.replace('_', '-') || ''}</td>
                  <td>₹{Number(q.subtotal).toLocaleString('en-IN')}</td>
                  <td>₹{Number(q.tax).toLocaleString('en-IN')}</td>
                  <td>₹{Number(q.discount).toLocaleString('en-IN')}</td>
                  <td>₹{Number(q.total).toLocaleString('en-IN')}</td>
                  <td><span className={`pill ${STATUS_COLORS[q.status] || 'badge-gray'}`}>{q.status}</span></td>
                  {!isCustomer && (
                    <td>
                      {(q.status === 'DRAFT' || q.status === 'SENT') && (
                        <>
                          <button className="btn-ghost btn-sm" onClick={() => handleAction(q.id, 'approve')}>Approve</button>
                          <button className="btn-ghost btn-sm" style={{ marginLeft: 4 }} onClick={() => handleAction(q.id, 'reject')}>Reject</button>
                        </>
                      )}
                      {q.status === 'APPROVED' && (
                        <button className="btn-ghost btn-sm" onClick={() => handleConvert(q.id)}>Convert to Order</button>
                      )}
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

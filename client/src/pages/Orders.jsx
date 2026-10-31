import { useState, useEffect } from 'react';
import api from '../api.js';

const STATUS_COLORS = {
  CONFIRMED: 'badge-gray',
  IN_PRODUCTION: 'badge-blue',
  READY_FOR_DISPATCH: 'badge-yellow',
  DISPATCHED: 'badge-blue',
  DELIVERED: 'badge-green',
  INSTALLATION_SCHEDULED: 'badge-yellow',
  INSTALLED: 'badge-green',
  COMPLETED: 'badge-green',
  CANCELLED: 'badge-red',
};

const ORDER_STATUSES = ['CONFIRMED', 'IN_PRODUCTION', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'INSTALLATION_SCHEDULED', 'INSTALLED', 'COMPLETED', 'CANCELLED'];

export default function Orders({ user }) {
  const isCustomer = user?.role === 'CUSTOMER';
  const [orders, setOrders] = useState([]);
  const [myCustomerId, setMyCustomerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  function loadOrders() {
    setLoading(true);
    api.get('/orders')
      .then((res) => {
        let data = res.data.data;
        if (isCustomer && myCustomerId) {
          data = data.filter((o) => o.customer_id === myCustomerId);
        }
        setOrders(data);
      })
      .catch(() => setError('Could not load orders.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (isCustomer) {
      api.get('/customers')
        .then((res) => {
          const me = res.data.data.find((c) => c.user_id === user.id);
          if (me) setMyCustomerId(me.id);
        });
    } else {
      loadOrders();
    }
  }, []);

  useEffect(() => {
    if (!isCustomer || myCustomerId) {
      loadOrders();
    }
  }, [myCustomerId, isCustomer]);

  async function handleStatusUpdate(id) {
    try {
      await api.patch(`/orders/${id}/status`, { status: newStatus });
      setEditingId(null);
      setNewStatus('');
      loadOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Orders</h2>
          <p>Orders created from approved quotations</p>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <p className="loading"><span className="spinner"></span>Loading…</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                {!isCustomer && <th>Update Status</th>}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={isCustomer ? 6 : 7} className="empty">No orders yet.</td></tr>
              ) : orders.map((o) => (
                <tr key={o.id}>
                  <td><strong>#{o.id}</strong></td>
                  <td><strong>{o.customer_name}</strong><br /><small>{o.customer_phone}</small></td>
                  <td>₹{Number(o.total_amount).toLocaleString('en-IN')}</td>
                  <td>₹{Number(o.amount_paid).toLocaleString('en-IN')}</td>
                  <td>₹{Number(o.balance_due).toLocaleString('en-IN')}</td>
                  <td><span className={`pill ${STATUS_COLORS[o.status] || 'badge-gray'}`}>{o.status?.replace(/_/g, ' ')}</span></td>
                  {!isCustomer && (
                    <td>
                    {editingId === o.id ? (
                      <>
                        <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                        <button className="btn-primary btn-sm" style={{ marginLeft: 4, marginTop: 0 }} onClick={() => handleStatusUpdate(o.id)}>Save</button>
                        <button className="btn-ghost btn-sm" style={{ marginLeft: 4 }} onClick={() => setEditingId(null)}>Cancel</button>
                      </>
                    ) : (
                      <button className="btn-ghost btn-sm" onClick={() => { setEditingId(o.id); setNewStatus(o.status); }}>Change</button>
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

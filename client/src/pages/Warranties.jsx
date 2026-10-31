import { useState, useEffect } from 'react';
import api from '../api.js';

const STATUS_COLORS = {
  ACTIVE: 'badge-green',
  EXPIRED: 'badge-red',
  VOIDED: 'badge-gray',
  CLAIMED: 'badge-yellow',
};

export default function Warranties() {
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/warranties')
      .then((res) => setWarranties(res.data.data))
      .catch(() => setError('Could not load warranties.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Warranties</h2>
          <p>Auto-activated on dispatch — solar panels 20yr, inverters/batteries 2yr</p>
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
                <th>Serial Number</th>
                <th>Product</th>
                <th>Category</th>
                <th>Start Date</th>
                <th>Expiry Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {warranties.length === 0 ? (
                <tr><td colSpan={6} className="empty">No warranties yet.</td></tr>
              ) : warranties.map((w) => (
                <tr key={w.id}>
                  <td><strong style={{ fontFamily: 'monospace' }}>{w.serial_number}</strong></td>
                  <td>{w.product_name}</td>
                  <td>{w.category?.replace(/_/g, ' ')}</td>
                  <td>{new Date(w.start_date).toLocaleDateString('en-IN')}</td>
                  <td>{new Date(w.expiry_date).toLocaleDateString('en-IN')}</td>
                  <td><span className={`pill ${STATUS_COLORS[w.warranty_status] || 'badge-gray'}`}>{w.warranty_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

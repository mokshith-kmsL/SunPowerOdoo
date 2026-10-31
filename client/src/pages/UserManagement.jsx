import { useState, useEffect } from 'react';
import api from '../api.js';

const ROLE_COLORS = {
  ADMIN: 'badge-gray',
  SALES: 'badge-blue',
  TECHNICIAN: 'badge-yellow',
  WAREHOUSE: 'badge-yellow',
  SUPPORT: 'badge-blue',
  CUSTOMER: 'badge-green',
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function loadUsers() {
    setLoading(true);
    api.get('/auth/users')
      .then((res) => setUsers(res.data.data))
      .catch(() => setError('Could not load users.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleToggle(id) {
    try {
      await api.patch(`/auth/users/${id}/toggle`);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user.');
    }
  }

  const pending = users.filter((u) => !u.is_active);
  const active = users.filter((u) => u.is_active);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>User Management</h2>
          <p>Approve pending employee accounts and manage users</p>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Pending approval section */}
      {pending.length > 0 && (
        <div className="chart-card" style={{ marginBottom: 16, borderColor: '#fef0c0' }}>
          <h3 className="chart-title" style={{ color: '#a16207' }}>Pending Approval ({pending.length})</h3>
          <div className="table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Registered</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td><span className={`pill ${ROLE_COLORS[u.role] || 'badge-gray'}`}>{u.role}</span></td>
                    <td>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                    <td>
                      <button className="btn-primary btn-sm" style={{ marginTop: 0 }} onClick={() => handleToggle(u.id)}>Approve</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active users */}
      <div className="chart-card">
        <h3 className="chart-title">Active Users ({active.length})</h3>
        {loading ? (
          <p className="loading"><span className="spinner"></span>Loading…</p>
        ) : (
          <div className="table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Registered</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {active.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td><span className={`pill ${ROLE_COLORS[u.role] || 'badge-gray'}`}>{u.role}</span></td>
                    <td>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                    <td>
                      <button className="btn-ghost btn-sm" onClick={() => handleToggle(u.id)}>Deactivate</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

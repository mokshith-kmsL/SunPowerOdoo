import { useState, useEffect } from 'react';
import api from '../api.js';

export default function Technicians() {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/technicians')
      .then((res) => setTechnicians(res.data.data))
      .catch(() => setError('Could not load technicians.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Technicians</h2>
          <p>Installation and service team</p>
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
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Specialization</th>
              </tr>
            </thead>
            <tbody>
              {technicians.length === 0 ? (
                <tr><td colSpan={4} className="empty">No technicians yet.</td></tr>
              ) : technicians.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.name}</strong></td>
                  <td>{t.email}</td>
                  <td>{t.phone}</td>
                  <td>{t.specialization || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

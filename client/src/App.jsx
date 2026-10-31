import { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      setUser(user);

    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setEmail('');
    setPassword('');
  };

  if (user) {
    return (
      <div className="app">
        <div className="navbar">
          <div className="nav-content">
            <div className="logo">SunPower Solutions</div>
            <button onClick={handleLogout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>

        <div className="container">
          <div className="card">
            <h1>Welcome back, {user.name}</h1>
            
            <div className="user-info">
              <div className="info-row">
                <span className="label">Email</span>
                <span className="value">{user.email}</span>
              </div>
              <div className="info-row">
                <span className="label">Role</span>
                <span className="badge">{user.role}</span>
              </div>
            </div>

            <div className="alert-success">
              Authentication successful
            </div>

            <div className="modules-grid">
              <div className="module-card">
                <h3>Customers</h3>
                <p>Manage customer information</p>
              </div>
              <div className="module-card">
                <h3>Leads</h3>
                <p>Track sales pipeline</p>
              </div>
              <div className="module-card">
                <h3>Quotations</h3>
                <p>Generate and send quotes</p>
              </div>
              <div className="module-card">
                <h3>Orders</h3>
                <p>Process customer orders</p>
              </div>
              <div className="module-card">
                <h3>Inventory</h3>
                <p>Track product stock</p>
              </div>
              <div className="module-card">
                <h3>Installations</h3>
                <p>Schedule site work</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-header">
            <h1>SunPower Solutions</h1>
            <p>Solar Installation Management System</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="alert-error">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="demo-info">
            <p className="demo-label">Demo Credentials</p>
            <p>admin@sunpower.com / Admin@123</p>
            <p>sales@sunpower.com / Sales@123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

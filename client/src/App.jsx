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

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call the login API
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      // If successful, save the token and user info
      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      setUser(user);
      console.log('Login successful!', user);

    } catch (err) {
      // Show error message
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setEmail('');
    setPassword('');
  };

  // If logged in, show dashboard
  if (user) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>☀️ SunPower Solutions</h1>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>

        <div className="welcome-card">
          <div className="welcome-icon">👋</div>
          <h2>Welcome, {user.name}!</h2>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> <span className="role-badge">{user.role}</span></p>
          
          <div className="success-message">
            ✅ Authentication successful!
          </div>
          
          <div className="info-box">
            <p className="info-title">🔒 JWT Authentication Active</p>
            <p className="info-text">Your session token is securely stored and will be sent with all API requests.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <div className="feature-text">Customer Management</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <div className="feature-text">Lead Tracking</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <div className="feature-text">Quotations & Orders</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📦</div>
              <div className="feature-text">Inventory & Dispatch</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔧</div>
              <div className="feature-text">Installations</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <div className="feature-text">Warranty Management</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, show login form
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo">
          <h1>☀️ SunPower Solutions</h1>
          <p>Solar Installation Management System</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sunpower.com"
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

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="demo-credentials">
          <p><strong>Demo Login:</strong></p>
          <p>Email: admin@sunpower.com</p>
          <p>Password: Admin@123</p>
        </div>
      </div>
    </div>
  );
}

export default App;

import { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SALES'
  });
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: formData.email,
        password: formData.password,
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

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      setUser(user);

    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setFormData({ name: '', email: '', password: '', role: 'SALES' });
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ name: '', email: '', password: '', role: 'SALES' });
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

          <div className="tabs">
            <button 
              className={isLogin ? 'tab active' : 'tab'}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button 
              className={!isLogin ? 'tab active' : 'tab'}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
          </div>

          {isLogin ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
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

              <div className="demo-info">
                <p className="demo-label">Demo Credentials</p>
                <p>admin@sunpower.com / admin123</p>
                <p>sales@sunpower.com / sales123</p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <select 
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="select-input"
                >
                  <option value="SALES">Sales</option>
                  <option value="TECHNICIAN">Technician</option>
                  <option value="WAREHOUSE">Warehouse</option>
                  <option value="SUPPORT">Support</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {error && (
                <div className="alert-error">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>

              <div className="demo-info">
                <p>Anyone can create an account for demo purposes</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

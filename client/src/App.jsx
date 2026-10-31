import { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [view, setView] = useState('login'); // 'login' or 'signup'
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
    setError(''); // Clear error when user types
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
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
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
    setView('login');
    setError('');
  };

  const switchView = (v) => {
    setView(v);
    setError('');
    setFormData({ name: '', email: '', password: '', role: 'SALES' });
  };

  // ── Dashboard ─────────────────────────────────────────────
  if (user) {
    return (
      <div className="app">
        <nav className="navbar">
          <span className="logo">SunPower Solutions</span>
          <div className="nav-right">
            <span className="nav-user">{user.name}</span>
            <span className="badge">{user.role}</span>
            <button onClick={handleLogout} className="btn-ghost">
              Log out
            </button>
          </div>
        </nav>

        <main className="main">
          <div className="page-header">
            <h2>Dashboard</h2>
            <p>Welcome back, {user.name}. Here's an overview of the system.</p>
          </div>

          <div className="modules-grid">
            <ModuleCard title="Customers"     desc="View and manage customer records" />
            <ModuleCard title="Leads"          desc="Track enquiries and the sales pipeline" />
            <ModuleCard title="Surveys"        desc="Schedule and approve site surveys" />
            <ModuleCard title="Quotations"     desc="Generate quotes from package templates" />
            <ModuleCard title="Orders"         desc="Confirm orders and track payments" />
            <ModuleCard title="Inventory"      desc="Stock levels and low-stock alerts" />
            <ModuleCard title="Dispatch"       desc="Assign serial numbers before shipment" />
            <ModuleCard title="Installations"  desc="Crew schedules and job completion" />
            <ModuleCard title="Warranties"     desc="Auto-activated on dispatch" />
            <ModuleCard title="Service Tickets" desc="Fault tracking and warranty checks" />
            <ModuleCard title="Finance"        desc="Revenue, expenses and profit per job" />
            <ModuleCard title="Subsidies"      desc="Government application tracking" />
          </div>
        </main>
      </div>
    );
  }

  // ── Auth pages ────────────────────────────────────────────
  return (
    <div className="app">
      <div className="auth-wrapper">
        <div className="auth-card">

          <div className="auth-header">
            <h1>SunPower Solutions</h1>
            <p>Solar Installation Management</p>
          </div>

          <div className="tabs">
            <button
              className={view === 'login' ? 'tab tab-active' : 'tab'}
              onClick={() => switchView('login')}
            >
              Sign In
            </button>
            <button
              className={view === 'signup' ? 'tab tab-active' : 'tab'}
              onClick={() => switchView('signup')}
            >
              Register
            </button>
          </div>

          {view === 'login' ? (
            <form onSubmit={handleLogin} noValidate>
              <Field label="Email" name="email" type="email"
                value={formData.email} onChange={handleChange}
                placeholder="you@sunpower.com" />

              <Field label="Password" name="password" type="password"
                value={formData.password} onChange={handleChange}
                placeholder="Enter your password" />

              {error && <div className="alert-error">{error}</div>}

              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              <p className="hint">
                New to the system? Ask your admin, or{' '}
                <button type="button" className="link" onClick={() => switchView('signup')}>
                  register here
                </button>.
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignup} noValidate>
              <Field label="Full Name" name="name" type="text"
                value={formData.name} onChange={handleChange}
                placeholder="Your full name" />

              <Field label="Email" name="email" type="email"
                value={formData.email} onChange={handleChange}
                placeholder="you@sunpower.com" />

              <Field label="Password" name="password" type="password"
                value={formData.password} onChange={handleChange}
                placeholder="At least 6 characters" />

              <div className="form-group">
                <label>Role</label>
                {/* Admin is intentionally excluded.
                    Admins are created by an existing Admin in Settings. */}
                <select name="role" value={formData.role}
                  onChange={handleChange} className="select-input">
                  <option value="SALES">Sales</option>
                  <option value="TECHNICIAN">Technician</option>
                  <option value="WAREHOUSE">Warehouse</option>
                  <option value="SUPPORT">Support</option>
                </select>
                <span className="field-note">
                  Admin accounts are created by an existing admin only.
                </span>
              </div>

              {error && <div className="alert-error">{error}</div>}

              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Creating account…' : 'Create Account'}
              </button>

              <p className="hint">
                Already have an account?{' '}
                <button type="button" className="link" onClick={() => switchView('login')}>
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// Small helper component so each field isn't repeated
function Field({ label, name, type, value, onChange, placeholder }) {
  return (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
      />
    </div>
  );
}

// Dashboard module card
function ModuleCard({ title, desc }) {
  return (
    <div className="module-card">
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

export default App;

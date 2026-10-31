import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Leads from './pages/Leads';
import Surveys from './pages/Surveys';
import Quotations from './pages/Quotations';
import Orders from './pages/Orders';
import Payments from './pages/Payments';
import Products from './pages/Products';
import Packages from './pages/Packages';
import Inventory from './pages/Inventory';
import SerialNumbers from './pages/SerialNumbers';
import Dispatches from './pages/Dispatches';
import Technicians from './pages/Technicians';
import Installations from './pages/Installations';
import Warranties from './pages/Warranties';
import ServiceTickets from './pages/ServiceTickets';
import Finance from './pages/Finance';
import CustomerDashboard from './pages/CustomerDashboard';
import UserManagement from './pages/UserManagement';
import Landing from './pages/Landing';
import { ToastContainer } from './components/Toast';

const API_URL = '/api';

// Employee sidebar navigation groups (ADMIN, SALES, TECHNICIAN, WAREHOUSE, SUPPORT)
const EMPLOYEE_NAV = [
  { label: null, items: [{ key: 'dashboard', label: 'Dashboard' }] },
  {
    label: 'Sales Pipeline',
    items: [
      { key: 'customers', label: 'Customers' },
      { key: 'leads', label: 'Leads' },
      { key: 'surveys', label: 'Surveys' },
      { key: 'quotations', label: 'Quotations' },
      { key: 'orders', label: 'Orders' },
      { key: 'payments', label: 'Payments' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { key: 'products', label: 'Products' },
      { key: 'packages', label: 'Packages' },
      { key: 'inventory', label: 'Inventory' },
      { key: 'serial-numbers', label: 'Serial Numbers' },
      { key: 'dispatches', label: 'Dispatches' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { key: 'technicians', label: 'Technicians' },
      { key: 'installations', label: 'Installations' },
      { key: 'warranties', label: 'Warranties' },
      { key: 'tickets', label: 'Service Tickets' },
    ],
  },
  {
    label: 'Administration',
    items: [{ key: 'finance', label: 'Finance Overview' }, { key: 'users', label: 'User Management' }],
  },
];

// Customer sidebar (limited — only their own data)
const CUSTOMER_NAV = [
  { label: null, items: [{ key: 'customer-dashboard', label: 'My Dashboard' }] },
  {
    label: 'My Activity',
    items: [
      { key: 'quotations', label: 'My Quotations' },
      { key: 'orders', label: 'My Orders' },
      { key: 'tickets', label: 'My Service Tickets' },
    ],
  },
];

// Map page keys to components
const PAGES = {
  dashboard: Dashboard,
  customers: Customers,
  leads: Leads,
  surveys: Surveys,
  quotations: Quotations,
  orders: Orders,
  payments: Payments,
  products: Products,
  packages: Packages,
  inventory: Inventory,
  'serial-numbers': SerialNumbers,
  dispatches: Dispatches,
  technicians: Technicians,
  installations: Installations,
  warranties: Warranties,
  tickets: ServiceTickets,
  finance: Finance,
  users: UserManagement,
  'customer-dashboard': CustomerDashboard,
};

function App() {
  const [view, setView] = useState('landing'); // 'landing', 'login', 'signup'
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CUSTOMER',
    phone: '',
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccessMsg('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: formData.email,
        password: formData.password,
      });
      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      setCurrentPage(user.role === 'CUSTOMER' ? 'customer-dashboard' : 'dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone || undefined,
      });

      // Customers get a token — log them in immediately
      if (response.data.data.token) {
        const { token, user } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        setCurrentPage('customer-dashboard');
      } else {
        // Employee registration — needs admin approval
        setSuccessMsg('Account created. An administrator must approve your account before you can log in.');
        setView('login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setFormData({ name: '', email: '', password: '', role: 'CUSTOMER', phone: '' });
    setView('login');
    setCurrentPage('dashboard');
    setError('');
    setSuccessMsg('');
  };

  const switchView = (v) => {
    setView(v);
    setError('');
    setSuccessMsg('');
    setFormData({ name: '', email: '', password: '', role: 'CUSTOMER', phone: '' });
  };

  // ── Landing page ──────────────────────────────────────
  if (!user && view === 'landing') {
    return (
      <Landing
        onGetStarted={() => switchView('signup')}
        onSignIn={() => switchView('login')}
      />
    );
  }

  // ── Logged-in layout ──────────────────────────────────
  if (user) {
    const isCustomer = user.role === 'CUSTOMER';
    const isAdmin = user.role === 'ADMIN';
    const navGroups = isCustomer
      ? CUSTOMER_NAV
      : isAdmin
        ? EMPLOYEE_NAV
        : EMPLOYEE_NAV.filter((g) =>
            !g.items.some((i) => i.key === 'users')
          );

    const ActivePage = PAGES[currentPage] || (isCustomer ? CustomerDashboard : Dashboard);
    const currentLabel = navGroups
      .flatMap((g) => g.items)
      .find((item) => item.key === currentPage)?.label || (isCustomer ? 'My Dashboard' : 'Dashboard');

    return (
      <div className="app-layout">
        <ToastContainer />
        <aside className="sidebar">
          <div className="sidebar-header">
            <span className="logo">SunPower</span>
          </div>
          <nav className="sidebar-nav">
            {navGroups.map((group, gi) => (
              <div key={gi} className="nav-group">
                {group.label && <div className="nav-group-label">{group.label}</div>}
                {group.items.map((item) => (
                  <button
                    key={item.key}
                    className={currentPage === item.key ? 'sidebar-link active' : 'sidebar-link'}
                    onClick={() => setCurrentPage(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <div className="content-area">
          <header className="topbar">
            <div className="topbar-left">
              <span className="topbar-title">{currentLabel}</span>
            </div>
            <ProfileDropdown user={user} onLogout={handleLogout} />
          </header>

          <main className="main">
            <ActivePage user={user} />
          </main>
        </div>
      </div>
    );
  }

  // ── Auth pages ──────────────────────────────────────
  return (
    <div className="auth-split">
      {/* Left: branding panel */}
      <div className="auth-left">
        <div className="auth-left-inner">
          <span className="auth-brand">SunPower Solutions</span>
          <h2 className="auth-left-h">Clean Energy,<br/>Managed End&#8209;to&#8209;End.</h2>
          <p className="auth-left-sub">
            India's trusted EPC solar company — surveys, quotations, installations and warranties, all in one platform.
          </p>
          <div className="auth-left-stats">
            <div className="auth-stat"><span className="auth-stat-val">500+</span><span className="auth-stat-lbl">Installations</span></div>
            <div className="auth-stat"><span className="auth-stat-val">20yr</span><span className="auth-stat-lbl">Panel Warranty</span></div>
            <div className="auth-stat"><span className="auth-stat-val">KSEB</span><span className="auth-stat-lbl">Certified</span></div>
          </div>
          <button type="button" className="auth-back-link" onClick={() => switchView('landing')}>← Back to website</button>
        </div>
      </div>

      {/* Right: form */}
      <div className="auth-right">
        <div className="auth-form-wrap">

          <div className="tabs">
            <button className={view === 'login'  ? 'tab tab-active' : 'tab'} onClick={() => switchView('login')}>Sign In</button>
            <button className={view === 'signup' ? 'tab tab-active' : 'tab'} onClick={() => switchView('signup')}>Register</button>
          </div>

          {view === 'login' ? (
            <>
              <div className="auth-form-title">Welcome back</div>
              <form onSubmit={handleLogin} noValidate>
                {successMsg && <div className="alert-success" style={{ marginBottom: 16 }}>{successMsg}</div>}

                <Field label="Email" name="email" type="email"
                  value={formData.email} onChange={handleChange}
                  placeholder="you@example.com" />
                <Field label="Password" name="password" type="password"
                  value={formData.password} onChange={handleChange}
                  placeholder="Enter your password" />

                {error && <div className="alert-error">{error}</div>}

                <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 8 }}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
                <p className="hint">
                  New here?{' '}
                  <button type="button" className="link" onClick={() => switchView('signup')}>Create an account</button>
                </p>
              </form>
            </>
          ) : (
            <>
              <div className="auth-form-title">Create your account</div>
              <form onSubmit={handleSignup} noValidate>
                <div className="form-group">
                  <label>I am registering as</label>
                  <select name="role" value={formData.role} onChange={handleChange} className="select-input">
                    <option value="CUSTOMER">Customer — I want a solar system</option>
                    <option value="SALES">Sales Employee</option>
                    <option value="TECHNICIAN">Technician</option>
                    <option value="WAREHOUSE">Warehouse Employee</option>
                    <option value="SUPPORT">Support Employee</option>
                  </select>
                  {formData.role !== 'CUSTOMER' && (
                    <span className="field-note">Employee accounts require admin approval before you can log in.</span>
                  )}
                </div>

                <div className="form-row">
                  <Field label="Full Name" name="name" type="text"
                    value={formData.name} onChange={handleChange} placeholder="Your full name" />
                  <Field label="Phone" name="phone" type="tel"
                    value={formData.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" />
                </div>
                <Field label="Email" name="email" type="email"
                  value={formData.email} onChange={handleChange} placeholder="you@example.com" />
                <Field label="Password" name="password" type="password"
                  value={formData.password} onChange={handleChange} placeholder="At least 6 characters" />

                {error && <div className="alert-error">{error}</div>}

                <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 8 }}>
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
                <p className="hint">
                  Already have an account?{' '}
                  <button type="button" className="link" onClick={() => switchView('login')}>Sign in</button>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="profile-dropdown" ref={ref}>
      <button className="profile-trigger" onClick={() => setOpen(!open)}>
        <div className="profile-avatar">{initials}</div>
        <div className="profile-info">
          <span className="profile-name">{user.name}</span>
          <span className="profile-role">{user.role}</span>
        </div>
        <span className="profile-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="profile-menu">
          <div className="profile-menu-header">
            <div className="profile-avatar profile-avatar-lg">{initials}</div>
            <div>
              <div className="profile-menu-name">{user.name}</div>
              <div className="profile-menu-email">{user.email || user.role}</div>
            </div>
          </div>
          <div className="profile-menu-divider" />
          <button className="profile-menu-item profile-menu-logout" onClick={() => { setOpen(false); onLogout(); }}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

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

export default App;

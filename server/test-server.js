// Simple test server for demo — NO DATABASE NEEDED
// Users are saved to users.json so they survive server restarts.

import express from 'express';
import cors    from 'cors';
import jwt     from 'jsonwebtoken';
import fs      from 'fs';
import path    from 'path';
import { fileURLToPath } from 'url';

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const USERS_FILE  = path.join(__dirname, 'users.json');
const JWT_SECRET  = 'sunpower_hackathon_secret_key_2024';

const app  = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ── Helpers: read/write users from disk ──────────────────────

function loadUsers() {
  // If the file doesn't exist yet, return the default seed accounts
  if (!fs.existsSync(USERS_FILE)) {
    return [
      { id: 1, name: 'Super Admin', email: 'admin@sunpower.com', password: 'admin123', role: 'ADMIN' },
      { id: 2, name: 'Ravi Kumar',  email: 'sales@sunpower.com', password: 'sales123', role: 'SALES'  },
    ];
  }
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

function saveUsers(users) {
  // Write the full users array back to disk
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ── POST /api/auth/register ──────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  // Block self-registration as Admin — only an existing Admin can make an Admin
  if (role && role.toUpperCase() === 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin accounts can only be created by an existing admin.' });
  }

  const users = loadUsers();

  // Check duplicate email
  const already = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (already) {
    return res.status(409).json({ success: false, message: 'This email is already registered.' });
  }

  const allowedRoles = ['SALES', 'TECHNICIAN', 'WAREHOUSE', 'SUPPORT'];
  const userRole = role && allowedRoles.includes(role.toUpperCase()) ? role.toUpperCase() : 'SALES';

  const newUser = {
    id:       users.length + 1,
    name:     name.trim(),
    email:    email.toLowerCase().trim(),
    password, // plain text for demo only
    role:     userRole,
  };

  users.push(newUser);
  saveUsers(users); // ← persist to disk so login works after restart

  console.log('Registered:', newUser.email);

  const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: { token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } },
  });
});

// ── POST /api/auth/login ─────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const users = loadUsers(); // always read fresh from disk
  const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  console.log('Login:', user.email);

  res.json({
    success: true,
    message: 'Login successful.',
    data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } },
  });
});

// ── GET /health ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  const users = loadUsers();
  res.json({ success: true, message: 'SunPower API running.', total_users: users.length });
});

// ── GET /api/users  (debug: see all registered users) ────────
app.get('/api/users', (req, res) => {
  const users = loadUsers();
  res.json({ success: true, data: users.map(({ password, ...u }) => u) }); // never return passwords
});

app.listen(PORT, () => {
  // Seed the file on first run so default accounts exist
  if (!fs.existsSync(USERS_FILE)) {
    saveUsers(loadUsers());
    console.log('Created users.json with default accounts.');
  }

  console.log('─────────────────────────────────────');
  console.log('SunPower Test API');
  console.log(`http://localhost:${PORT}`);
  console.log('─────────────────────────────────────');
  console.log('admin@sunpower.com  /  admin123');
  console.log('sales@sunpower.com  /  sales123');
  console.log('─────────────────────────────────────');
});

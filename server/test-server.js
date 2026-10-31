// Simple test server for login demo - NO DATABASE NEEDED
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Mock users database (in-memory, resets on server restart)
const users = [
  {
    id: 1,
    name: 'Super Admin',
    email: 'admin@sunpower.com',
    password: 'admin123', // Plain password for demo
    role: 'ADMIN'
  },
  {
    id: 2,
    name: 'Ravi Kumar',
    email: 'sales@sunpower.com',
    password: 'sales123',
    role: 'SALES'
  }
];

const JWT_SECRET = 'sunpower_hackathon_secret_key_2024';

// POST /api/auth/register - Create new user (open endpoint for demo)
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    console.log('Registration attempt:', email);

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.'
      });
    }

    // Check if email already exists
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered.'
      });
    }

    // Valid roles
    const validRoles = ['ADMIN', 'SALES', 'TECHNICIAN', 'WAREHOUSE', 'SUPPORT'];
    const userRole = role && validRoles.includes(role.toUpperCase()) 
      ? role.toUpperCase() 
      : 'SALES'; // Default to SALES

    // Create new user
    const newUser = {
      id: users.length + 1,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: userRole
    };

    users.push(newUser);

    console.log('✅ User registered:', newUser.email);

    // Auto-login: create token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    // Find user by email
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check password (plain text for demo)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful:', user.email);

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
});

// GET /health
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SunPower Test API is running (mock mode).',
    users: users.length
  });
});

// GET /api/users - List all registered users (for debugging)
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role
    }))
  });
});

app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('☀️  SunPower Test API Running');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Server: http://localhost:${PORT}`);
  console.log(`✅ Health: http://localhost:${PORT}/health`);
  console.log('');
  console.log('Pre-registered Test Accounts:');
  console.log('  admin@sunpower.com / admin123');
  console.log('  sales@sunpower.com / sales123');
  console.log('');
  console.log('Anyone can create a new account via the signup page!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

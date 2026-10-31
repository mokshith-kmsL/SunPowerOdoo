// Simple test server for login demo - NO DATABASE NEEDED
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Mock users (in real app, these are in database)
const users = [
  {
    id: 1,
    name: 'Super Admin',
    email: 'admin@sunpower.com',
    password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // Admin@123
    role: 'ADMIN'
  },
  {
    id: 2,
    name: 'Ravi Kumar',
    email: 'sales@sunpower.com',
    password_hash: '$2a$10$TwBNHmA1JZRd3USjRFIlpuVB4MIV0xaS5OPl3YeAjRHHIZ2h1JV3K', // Sales@123
    role: 'SALES'
  }
];

const JWT_SECRET = 'sunpower_hackathon_secret_key_2024';

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
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

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
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

    // Return success
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

// GET /health - Check if server is running
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SunPower Test API is running (mock mode - no database).'
  });
});

app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('☀️  SunPower Test API Running');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Server: http://localhost:${PORT}`);
  console.log(`✅ Health: http://localhost:${PORT}/health`);
  console.log('');
  console.log('Test Accounts:');
  console.log('  admin@sunpower.com / Admin@123');
  console.log('  sales@sunpower.com / Sales@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

import express from 'express';
import cors    from 'cors';
import helmet  from 'helmet';
import path    from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// ── Route imports ──────────────────────────────────────────────────────────
import authRoutes         from './routes/auth.routes.js';
import customerRoutes     from './routes/customer.routes.js';
import leadRoutes         from './routes/lead.routes.js';
import surveyRoutes       from './routes/survey.routes.js';
import productRoutes      from './routes/product.routes.js';
import packageRoutes      from './routes/package.routes.js';
import quotationRoutes    from './routes/quotation.routes.js';
import orderRoutes        from './routes/order.routes.js';
import paymentRoutes      from './routes/payment.routes.js';
import inventoryRoutes    from './routes/inventory.routes.js';
import serialRoutes       from './routes/serial.routes.js';
import dispatchRoutes     from './routes/dispatch.routes.js';
import technicianRoutes   from './routes/technician.routes.js';
import installationRoutes from './routes/installation.routes.js';
import warrantyRoutes     from './routes/warranty.routes.js';
import ticketRoutes       from './routes/ticket.routes.js';
import financeRoutes      from './routes/finance.routes.js';
import analyticsRoutes    from './routes/analytics.routes.js';
import errorHandler       from './middleware/errorHandler.js';

// Needed to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

// ── Security headers (helmet adds safe HTTP headers automatically) ──────────
app.use(helmet());

// ── CORS: allow the React frontend to call this API ────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Parse JSON and URL-encoded request bodies ──────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve uploaded photos as static files ─────────────────────────────────
// e.g. GET /uploads/installation-photos/photo-123.jpg
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Health check — useful for testing that the server is up ───────────────
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'SunPower API is running.' });
});

// ── All API routes are prefixed with /api ──────────────────────────────────
app.use('/api/auth',           authRoutes);
app.use('/api/customers',      customerRoutes);
app.use('/api/leads',          leadRoutes);
app.use('/api/surveys',        surveyRoutes);
app.use('/api/products',       productRoutes);
app.use('/api/packages',       packageRoutes);
app.use('/api/quotations',     quotationRoutes);
app.use('/api/orders',         orderRoutes);
app.use('/api/payments',       paymentRoutes);
app.use('/api/inventory',      inventoryRoutes);
app.use('/api/serial-numbers', serialRoutes);
app.use('/api/dispatches',     dispatchRoutes);
app.use('/api/technicians',    technicianRoutes);
app.use('/api/installations',  installationRoutes);
app.use('/api/warranties',     warrantyRoutes);
app.use('/api/tickets',        ticketRoutes);
app.use('/api/finance',        financeRoutes);
app.use('/api/analytics',      analyticsRoutes);

// ── 404 handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ── Global error handler (must be last) ────────────────────────────────────
app.use(errorHandler);

export default app;

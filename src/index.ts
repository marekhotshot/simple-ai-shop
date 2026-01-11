import express from 'express';
import path from 'path';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import paypalRoutes from './routes/paypal.js';
import aiRoutes from './routes/ai.js';
import ordersRoutes from './routes/orders.js';
import shippingRoutes from './routes/shipping.js';
import { config } from './lib/env.js';

const app = express();
app.use(express.json({ limit: '5mb' }));

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Serve static files (images)
app.use('/uploads', express.static(config.dataRoot));

app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', aiRoutes);
app.use('/api/paypal', paypalRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/shipping', shippingRoutes);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on :${config.port}`);
});

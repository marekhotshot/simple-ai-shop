import express from 'express';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import paypalRoutes from './routes/paypal.js';
import aiRoutes from './routes/ai.js';
import { config } from './lib/env.js';

const app = express();
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', aiRoutes);
app.use('/api/paypal', paypalRoutes);

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on :${config.port}`);
});

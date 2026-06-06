const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

// ─── MIDDLEWARE GLOBAL (API Gateway) ──────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger básico
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── RUTAS ────────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/inventario', require('./routes/inventario'));
app.use('/api',            require('./routes/api'));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), sistema: 'SGPE v1.0' });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado.' });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// ─── INICIO ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 SGPE Backend corriendo en http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Login:        POST http://localhost:${PORT}/api/auth/login\n`);
});

module.exports = app;
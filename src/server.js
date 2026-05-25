// SAM Router — Main Server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const { ensureDataDir, timestamp } = require('./utils');
const { createKey, getKeys, validateApiKey, dashboardAuth } = require('./middleware/auth');
const { tokenSaver } = require('./middleware/token-saver');
const { quotaCheck } = require('./middleware/quota');

// Import routes
const proxyRoutes = require('./routes/proxy');
const providerRoutes = require('./routes/providers');
const usageRoutes = require('./routes/usage');

// Initialize
const app = express();
ensureDataDir();

// Middleware
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: '10mb' }));

// Serve dashboard HTML
app.get('/', (req, res) => {
  res.sendFile(config.DASHBOARD_PATH);
});

// Serve dashboard assets (if any)
app.use('/static', express.static(path.join(__dirname, '..', 'public')));

// ============ API Routes ============

// Health check (no auth)
app.get('/health', (req, res) => {
  const keys = getKeys();
  res.json({
    status: 'ok',
    server: 'SAM Router',
    version: '1.0.0',
    port: config.PORT,
    api_keys: keys.length,
    uptime: Math.floor(process.uptime()),
    timestamp: timestamp()
  });
});

// API key management (dashboard only, no key required)
app.get('/api/keys', dashboardAuth, (req, res) => {
  const keys = getKeys();
  res.json({ keys });
});

app.post('/api/keys', dashboardAuth, (req, res) => {
  const { name } = req.body;
  const key = createKey(name || 'New Key');
  res.status(201).json(key);
});

// Provider routes (dashboard only)
app.use('/api/providers', dashboardAuth, providerRoutes);

// Usage routes (dashboard only)
app.use('/api/usage', dashboardAuth, usageRoutes);

// ============ LLM Proxy (requires API key) ============

// Apply token saver + quota check + proxy
app.use('/v1', 
  validateApiKey,
  quotaCheck,
  tokenSaver,
  proxyRoutes
);

// ============ Error Handling ============

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    message: 'Use /v1/* for LLM proxy, or /api/* for dashboard'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`[${timestamp()}] Error:`, err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// ============ Start Server ============

app.listen(config.PORT, config.HOST, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════════════╗
  ║                    SAM Router v1.0.0                         ║
  ╠══════════════════════════════════════════════════════════════╣
  ║  Dashboard:  http://${config.HOST === '0.0.0.0' ? '127.0.0.1' : config.HOST}:${config.PORT}                    ║
  ║  API:        http://${config.HOST === '0.0.0.0' ? '127.0.0.1' : config.HOST}:${config.PORT}/v1/chat/completions   ║
  ║  Health:     http://${config.HOST === '0.0.0.0' ? '127.0.0.1' : config.HOST}:${config.PORT}/health                ║
  ╠══════════════════════════════════════════════════════════════╣
  ║  API Key Prefix: ${config.KEY_PREFIX}                          ║
  ║  Started: ${timestamp()}                          ║
  ╚══════════════════════════════════════════════════════════════╝
  `);
});

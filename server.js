// SAM Router — AI API Gateway Server
// Port: 2500 (hardcoded)
// API Keys: sam_sr_[random_32_chars]

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const url = require('url');

const app = express();
const PORT = 2500;

// ============ DATA STORE (JSON file persistence) ============
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return {
      keys: [],
      providers: [],
      combos: [],
      usage: [],
      settings: { password: 'sam_admin_2026', debugMode: false },
      quotaAccounts: []
    };
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ============ MIDDLEWARE ============
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ============ AUTH MIDDLEWARE ============
function authMiddleware(req, res, next) {
  // Dashboard routes skip auth
  if (req.path.startsWith('/api/dashboard')) return next();

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.slice(7);
  if (!token.startsWith('sam_sr_')) {
    return res.status(401).json({ error: 'Invalid API key format' });
  }

  const db = loadDB();
  const keyEntry = db.keys.find(k => k.key === token && k.status === 'active');
  if (!keyEntry) {
    return res.status(401).json({ error: 'Invalid or revoked API key' });
  }

  req.apiKey = keyEntry;
  next();
}

// ============ DASHBOARD API (no auth) ============

// --- API Keys ---
app.get('/api/dashboard/keys', (req, res) => {
  const db = loadDB();
  res.json(db.keys);
});

app.post('/api/dashboard/keys', (req, res) => {
  const db = loadDB();
  const key = {
    id: uuidv4(),
    name: req.body.name || 'Default API Key',
    key: 'sam_sr_' + uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '').slice(0, 6),
    status: 'active',
    tokenLimit: req.body.tokenLimit || null,
    spendLimit: req.body.spendLimit || null,
    tokensUsed: 0,
    spendUsed: 0,
    lastUsedAt: null,
    createdAt: new Date().toISOString(),
    selectedModels: req.body.selectedModels || ['gpt-4o', 'claude-sonnet-4-6', 'deepseek-r1']
  };
  db.keys.push(key);
  saveDB(db);
  res.json(key);
});

app.delete('/api/dashboard/keys/:id', (req, res) => {
  const db = loadDB();
  db.keys = db.keys.filter(k => k.id !== req.params.id);
  saveDB(db);
  res.json({ success: true });
});

app.patch('/api/dashboard/keys/:id', (req, res) => {
  const db = loadDB();
  const idx = db.keys.findIndex(k => k.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Key not found' });
  Object.assign(db.keys[idx], req.body);
  saveDB(db);
  res.json(db.keys[idx]);
});

// --- Providers ---
app.get('/api/dashboard/providers', (req, res) => {
  const db = loadDB();
  res.json(db.providers);
});

app.post('/api/dashboard/providers', (req, res) => {
  const db = loadDB();
  const provider = {
    id: uuidv4(),
    name: req.body.name,
    category: req.body.category || 'custom',
    baseUrl: req.body.baseUrl,
    apiKey: req.body.apiKey,
    modelMapping: req.body.modelMapping || {},
    customHeaders: req.body.customHeaders || {},
    proxy: req.body.proxy || null,
    status: 'pending',
    maxTokens: req.body.maxTokens || 65536,
    inputPrice: req.body.inputPrice || 2.5,
    outputPrice: req.body.outputPrice || 10,
    createdAt: new Date().toISOString()
  };
  db.providers.push(provider);
  saveDB(db);
  res.json(provider);
});

app.put('/api/dashboard/providers/:id', (req, res) => {
  const db = loadDB();
  const idx = db.providers.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Provider not found' });
  Object.assign(db.providers[idx], req.body);
  saveDB(db);
  res.json(db.providers[idx]);
});

app.delete('/api/dashboard/providers/:id', (req, res) => {
  const db = loadDB();
  db.providers = db.providers.filter(p => p.id !== req.params.id);
  saveDB(db);
  res.json({ success: true });
});

// Test provider connection
app.post('/api/dashboard/providers/:id/test', async (req, res) => {
  const db = loadDB();
  const provider = db.providers.find(p => p.id === req.params.id);
  if (!provider) return res.status(404).json({ error: 'Provider not found' });

  try {
    const testUrl = `${provider.baseUrl}/models`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`
    };
    Object.assign(headers, provider.customHeaders);

    const result = await fetch(testUrl, { headers, signal: AbortSignal.timeout(10000) });
    const status = result.ok ? 'connected' : 'error';
    provider.status = status;
    saveDB(db);
    res.json({ status, statusCode: result.status });
  } catch (err) {
    provider.status = 'error';
    saveDB(db);
    res.json({ status: 'error', error: err.message });
  }
});

// --- Combos ---
app.get('/api/dashboard/combos', (req, res) => {
  const db = loadDB();
  res.json(db.combos);
});

app.post('/api/dashboard/combos', (req, res) => {
  const db = loadDB();
  const combo = {
    id: uuidv4(),
    name: req.body.name,
    models: req.body.models || [],
    fallbackCount: req.body.fallbackCount || 1,
    createdAt: new Date().toISOString()
  };
  db.combos.push(combo);
  saveDB(db);
  res.json(combo);
});

app.put('/api/dashboard/combos/:id', (req, res) => {
  const db = loadDB();
  const idx = db.combos.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Combo not found' });
  Object.assign(db.combos[idx], req.body);
  saveDB(db);
  res.json(db.combos[idx]);
});

app.delete('/api/dashboard/combos/:id', (req, res) => {
  const db = loadDB();
  db.combos = db.combos.filter(c => c.id !== req.params.id);
  saveDB(db);
  res.json({ success: true });
});

// --- Usage Stats ---
app.get('/api/dashboard/usage', (req, res) => {
  const db = loadDB();
  const period = req.query.period || '7d';

  // Aggregate usage
  const now = new Date();
  let startDate;
  if (period === '24h') startDate = new Date(now - 24 * 60 * 60 * 1000);
  else if (period === '7d') startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
  else if (period === '30d') startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
  else startDate = new Date(0);

  const filtered = db.usage.filter(u => new Date(u.timestamp) >= startDate);

  const totalTokens = filtered.reduce((s, u) => s + (u.promptTokens || 0) + (u.completionTokens || 0), 0);
  const totalCost = filtered.reduce((s, u) => s + (u.cost || 0), 0);
  const totalRequests = filtered.length;
  const models = [...new Set(filtered.map(u => u.model))];

  res.json({
    totalTokens,
    totalCost: totalCost.toFixed(4),
    totalRequests,
    models,
    logs: filtered.slice(-100)
  });
});

// --- Quota Accounts ---
app.get('/api/dashboard/quota', (req, res) => {
  const db = loadDB();
  res.json(db.quotaAccounts);
});

app.post('/api/dashboard/quota', (req, res) => {
  const db = loadDB();
  const account = {
    id: uuidv4(),
    provider: req.body.provider,
    email: req.body.email,
    limit: req.body.limit,
    used: 0,
    resetDate: req.body.resetDate,
    createdAt: new Date().toISOString()
  };
  db.quotaAccounts.push(account);
  saveDB(db);
  res.json(account);
});

app.delete('/api/dashboard/quota/:id', (req, res) => {
  const db = loadDB();
  db.quotaAccounts = db.quotaAccounts.filter(q => q.id !== req.params.id);
  saveDB(db);
  res.json({ success: true });
});

// --- Settings ---
app.get('/api/dashboard/settings', (req, res) => {
  const db = loadDB();
  res.json(db.settings);
});

app.put('/api/dashboard/settings', (req, res) => {
  const db = loadDB();
  Object.assign(db.settings, req.body);
  saveDB(db);
  res.json(db.settings);
});

// --- System Info ---
app.get('/api/dashboard/system', (req, res) => {
  const db = loadDB();
  res.json({
    port: PORT,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    apiKeyPrefix: 'sam_sr_',
    keysCount: db.keys.length,
    providersCount: db.providers.length,
    combosCount: db.combos.length,
    usageCount: db.usage.length
  });
});

// ============ PROXY ROUTE (OpenAI-compatible) ============
app.use('/v1', authMiddleware);

// POST /v1/chat/completions — main proxy endpoint
app.post('/v1/chat/completions', async (req, res) => {
  const db = loadDB();
  const { model, messages, stream = false, ...rest } = req.body;

  if (!model || !messages) {
    return res.status(400).json({ error: 'model and messages are required' });
  }

  // Find provider for this model
  const provider = findProviderForModel(model, db, req.apiKey);
  if (!provider) {
    return res.status(503).json({ error: `No provider configured for model: ${model}` });
  }

  // Resolve model name mapping
  const upstreamModel = provider.modelMapping[model] || model;

  try {
    const upstreamUrl = `${provider.baseUrl}/chat/completions`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`
    };
    Object.assign(headers, provider.customHeaders);

    const body = JSON.stringify({
      model: upstreamModel,
      messages,
      stream,
      ...rest
    });

    if (stream) {
      // Streaming proxy
      await proxyStream(upstreamUrl, headers, body, res, model, req.apiKey, db);
    } else {
      // Non-streaming proxy
      const result = await proxyNonStream(upstreamUrl, headers, body, model, req.apiKey, db);
      res.json(result);
    }
  } catch (err) {
    console.error(`[PROXY ERROR] ${err.message}`);
    res.status(502).json({ error: `Upstream error: ${err.message}` });
  }
});

// GET /v1/models — list available models
app.get('/v1/models', (req, res) => {
  const db = loadDB();
  const keyModels = req.apiKey.selectedModels || [];
  const allModels = db.providers.flatMap(p => {
    const models = Object.keys(p.modelMapping).length > 0
      ? Object.keys(p.modelMapping)
      : [p.name];
    return models;
  });

  const models = (keyModels.length > 0 ? keyModels : [...new Set(allModels)]).map(m => ({
    id: m,
    object: 'model',
    created: Math.floor(Date.now() / 1000),
    owned_by: 'sam-router'
  }));

  res.json({ object: 'list', data: models });
});

// ============ PROVIDER RESOLUTION ============
function findProviderForModel(model, db, apiKey) {
  // 1. Check combo (model alias)
  const combo = db.combos.find(c => c.name === model || c.models.includes(model));
  if (combo) {
    // Try each model in combo
    for (const m of combo.models) {
      const p = findDirectProvider(m, db);
      if (p) return p;
    }
  }

  // 2. Direct provider lookup
  return findDirectProvider(model, db);
}

function findDirectProvider(model, db) {
  return db.providers.find(p => {
    if (p.status === 'error') return false;
    // Check if provider has this model in mapping
    if (p.modelMapping[model]) return true;
    // Check if provider name matches
    if (p.name.toLowerCase() === model.toLowerCase()) return true;
    return false;
  }) || db.providers.find(p => p.status !== 'error'); // fallback to any active provider
}

// ============ PROXY HELPERS ============
async function proxyNonStream(url, headers, body, model, apiKey, db) {
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body,
    signal: AbortSignal.timeout(120000)
  });

  const data = await response.json();

  if (response.ok && data.usage) {
    // Track usage
    trackUsage(db, apiKey, model, data.usage, data);
  }

  return data;
}

async function proxyStream(upstreamUrl, headers, body, res, model, apiKey, db) {
  const response = await fetch(upstreamUrl, {
    method: 'POST',
    headers,
    body,
    signal: AbortSignal.timeout(300000)
  });

  res.writeHead(response.status, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);

      // Parse token usage from stream
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const json = JSON.parse(line.slice(6));
            if (json.usage) {
              totalPromptTokens = json.usage.prompt_tokens || 0;
              totalCompletionTokens = json.usage.completion_tokens || 0;
            }
          } catch {}
        }
      }
    }
  } catch (err) {
    console.error(`[STREAM ERROR] ${err.message}`);
  }

  // Track usage after stream ends
  if (totalPromptTokens > 0 || totalCompletionTokens > 0) {
    trackUsage(db, apiKey, model, {
      prompt_tokens: totalPromptTokens,
      completion_tokens: totalCompletionTokens,
      total_tokens: totalPromptTokens + totalCompletionTokens
    }, null);
  }

  res.end();
}

// ============ USAGE TRACKING ============
function trackUsage(db, apiKey, model, usage, rawResponse) {
  const entry = {
    id: uuidv4(),
    keyId: apiKey.id,
    keyName: apiKey.name,
    model,
    promptTokens: usage.prompt_tokens || 0,
    completionTokens: usage.completion_tokens || 0,
    totalTokens: usage.total_tokens || 0,
    cost: calculateCost(model, usage, db),
    timestamp: new Date().toISOString()
  };

  db.usage.push(entry);

  // Update key usage
  const keyIdx = db.keys.findIndex(k => k.id === apiKey.id);
  if (keyIdx !== -1) {
    db.keys[keyIdx].tokensUsed += entry.totalTokens;
    db.keys[keyIdx].spendUsed += entry.cost;
    db.keys[keyIdx].lastUsedAt = entry.timestamp;
  }

  // Keep only last 10000 usage entries
  if (db.usage.length > 10000) {
    db.usage = db.usage.slice(-10000);
  }

  saveDB(db);
}

function calculateCost(model, usage, db) {
  // Find provider pricing
  const provider = db.providers.find(p => p.modelMapping[model] || p.name === model);
  if (!provider) return 0;

  const inputPrice = provider.inputPrice || 2.5;  // per 1M tokens
  const outputPrice = provider.outputPrice || 10;

  const inputCost = (usage.prompt_tokens || 0) / 1_000_000 * inputPrice;
  const outputCost = (usage.completion_tokens || 0) / 1_000_000 * outputPrice;

  return inputCost + outputCost;
}

// ============ START SERVER ============
const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
┌─────────────────────────────────────────┐
│                                         │
│   🛡️  SAM Router v1.0                   │
│                                         │
│   Dashboard: http://localhost:${PORT}      │
│   API:       http://localhost:${PORT}/v1   │
│   API Keys:  sam_sr_[32chars]           │
│                                         │
└─────────────────────────────────────────┘
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down SAM Router...');
  server.close(() => process.exit(0));
});

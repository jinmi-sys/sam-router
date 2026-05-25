// API Key Authentication Middleware
const { KEY_PREFIX } = require('../config');
const { readJson, writeJson } = require('../utils');
const path = require('path');

const KEYS_FILE = path.join(__dirname, '..', '..', 'data', 'keys.json');

// Generate random API key
function generateApiKey() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let key = KEY_PREFIX;
  for (let i = 0; i < 32; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

// Get all API keys
function getKeys() {
  return readJson(KEYS_FILE, []);
}

// Save API keys
function saveKeys(keys) {
  return writeJson(KEYS_FILE, keys);
}

// Create new API key
function createKey(name = 'Default Key') {
  const keys = getKeys();
  const newKey = {
    id: Date.now().toString(),
    name,
    key: generateApiKey(),
    created: new Date().toISOString(),
    lastUsed: null,
    requests: 0,
    enabled: true
  };
  keys.push(newKey);
  saveKeys(keys);
  return newKey;
}

// Validate API key middleware
function validateApiKey(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing or invalid Authorization header',
      message: 'Use: Authorization: Bearer sam_sr_...'
    });
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  if (!token.startsWith(KEY_PREFIX)) {
    return res.status(401).json({
      error: 'Invalid API key format',
      message: `Key must start with ${KEY_PREFIX}`
    });
  }
  
  const keys = getKeys();
  const keyData = keys.find(k => k.key === token && k.enabled);
  
  if (!keyData) {
    return res.status(403).json({
      error: 'Invalid or disabled API key',
      message: 'Check your API key or enable it in dashboard'
    });
  }
  
  // Update usage
  keyData.lastUsed = new Date().toISOString();
  keyData.requests++;
  saveKeys(keys);
  
  // Attach key info to request
  req.apiKey = keyData;
  next();
}

// Dashboard auth (no key required for dashboard routes)
function dashboardAuth(req, res, next) {
  // Dashboard routes don't need API key
  next();
}

module.exports = {
  generateApiKey,
  getKeys,
  saveKeys,
  createKey,
  validateApiKey,
  dashboardAuth
};

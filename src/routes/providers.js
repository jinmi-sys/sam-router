// Provider CRUD Routes
const express = require('express');
const router = express.Router();
const { readJson, writeJson } = require('../utils');
const path = require('path');

const PROVIDERS_FILE = path.join(__dirname, '..', '..', 'data', 'providers.json');

// Get all providers
router.get('/', (req, res) => {
  const providers = readJson(PROVIDERS_FILE, []);
  res.json({
    providers,
    stats: {
      total: providers.length,
      enabled: providers.filter(p => p.enabled).length,
      by_category: {
        custom: providers.filter(p => p.category === 'custom').length,
        oauth: providers.filter(p => p.category === 'oauth').length,
        free: providers.filter(p => p.category === 'free').length,
        'free-tier': providers.filter(p => p.category === 'free-tier').length
      }
    }
  });
});

// Create provider
router.post('/', (req, res) => {
  const { name, baseUrl, apiKey, category, models, enabled = true } = req.body;
  
  if (!name || !baseUrl) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['name', 'baseUrl']
    });
  }
  
  const providers = readJson(PROVIDERS_FILE, []);
  
  const newProvider = {
    id: Date.now().toString(),
    name,
    baseUrl,
    apiKey: apiKey || '',
    category: category || 'custom',
    models: models || [],
    enabled,
    created: new Date().toISOString(),
    lastUsed: null,
    requests: 0
  };
  
  providers.push(newProvider);
  writeJson(PROVIDERS_FILE, providers);
  
  res.status(201).json(newProvider);
});

// Update provider
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const providers = readJson(PROVIDERS_FILE, []);
  const index = providers.findIndex(p => p.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Provider not found' });
  }
  
  providers[index] = { ...providers[index], ...req.body };
  writeJson(PROVIDERS_FILE, providers);
  
  res.json(providers[index]);
});

// Delete provider
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const providers = readJson(PROVIDERS_FILE, []);
  const filtered = providers.filter(p => p.id !== id);
  
  if (filtered.length === providers.length) {
    return res.status(404).json({ error: 'Provider not found' });
  }
  
  writeJson(PROVIDERS_FILE, filtered);
  res.json({ message: 'Provider deleted' });
});

// Test provider connection
router.post('/:id/test', async (req, res) => {
  const { id } = req.params;
  const providers = readJson(PROVIDERS_FILE, []);
  const provider = providers.find(p => p.id === id);
  
  if (!provider) {
    return res.status(404).json({ error: 'Provider not found' });
  }
  
  try {
    const fetch = (await import('node-fetch')).default;
    const testUrl = `${provider.baseUrl}/models`;
    
    const headers = { 'Content-Type': 'application/json' };
    if (provider.apiKey) {
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
    }
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers,
      timeout: 10000
    });
    
    res.json({
      success: response.ok,
      status: response.status,
      provider: provider.name
    });
    
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      provider: provider.name
    });
  }
});

module.exports = router;

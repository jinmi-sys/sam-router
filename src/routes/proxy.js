// LLM Proxy with 3-tier fallback routing
const express = require('express');
const router = express.Router();
const config = require('../config');
const { readJson, timestamp } = require('../utils');
const path = require('path');

const PROVIDERS_FILE = path.join(__dirname, '..', '..', 'data', 'providers.json');
const USAGE_FILE = path.join(__dirname, '..', '..', 'data', 'usage.json');

// Get active providers
function getProviders() {
  return readJson(PROVIDERS_FILE, []);
}

// Log usage
function logUsage(entry) {
  const usage = readJson(USAGE_FILE, []);
  usage.push(entry);
  // Keep last 10000 entries
  if (usage.length > 10000) {
    usage.splice(0, usage.length - 10000);
  }
  const fs = require('fs');
  fs.writeFileSync(USAGE_FILE, JSON.stringify(usage, null, 2));
}

// Try proxy to upstream provider
async function proxyToProvider(provider, reqBody, apiKey) {
  const fetch = (await import('node-fetch')).default;
  
  const url = `${provider.baseUrl}/chat/completions`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${provider.apiKey}`
  };
  
  // Add provider-specific headers
  if (provider.type === 'anthropic') {
    headers['x-api-key'] = provider.apiKey;
    headers['anthropic-version'] = '2023-06-01';
    delete headers['Authorization'];
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(reqBody),
    timeout: 30000
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Provider ${provider.name}: ${response.status} - ${error}`);
  }
  
  return response;
}

// Main proxy endpoint
router.post('/chat/completions', async (req, res) => {
  const startTime = Date.now();
  const providers = getProviders();
  
  if (providers.length === 0) {
    return res.status(503).json({
      error: 'No providers configured',
      message: 'Add a provider in the dashboard first'
    });
  }
  
  // 3-tier fallback: custom → oauth → free
  const tiers = ['custom', 'oauth', 'free'];
  let lastError = null;
  
  for (const tier of tiers) {
    const tierProviders = providers.filter(p => p.category === tier && p.enabled);
    
    for (const provider of tierProviders) {
      try {
        console.log(`[${timestamp()}] Trying ${provider.name} (${tier})...`);
        
        const response = await proxyToProvider(provider, req.body, req.apiKey);
        const duration = Date.now() - startTime;
        
        // Log successful usage
        logUsage({
          timestamp: new Date().toISOString(),
          apiKey: req.apiKey.id,
          provider: provider.name,
          model: req.body.model,
          tier,
          tokens: req.body.messages?.length || 0,
          duration,
          status: 'success'
        });
        
        // Stream response back
        if (req.body.stream) {
          response.body.pipe(res);
        } else {
          const data = await response.json();
          res.json(data);
        }
        
        return;
        
      } catch (error) {
        lastError = error;
        console.log(`[${timestamp()}] ${provider.name} failed: ${error.message}`);
        
        // Log failed attempt
        logUsage({
          timestamp: new Date().toISOString(),
          apiKey: req.apiKey.id,
          provider: provider.name,
          model: req.body.model,
          tier,
          duration: Date.now() - startTime,
          status: 'error',
          error: error.message
        });
        
        // Continue to next provider
        continue;
      }
    }
  }
  
  // All providers failed
  res.status(502).json({
    error: 'All providers failed',
    message: lastError?.message || 'No available providers',
    tiers_tried: tiers
  });
});

// Models endpoint (aggregate from all providers)
router.get('/models', (req, res) => {
  const providers = getProviders();
  const models = [];
  
  providers.forEach(provider => {
    if (provider.models && provider.enabled) {
      provider.models.forEach(model => {
        models.push({
          id: model,
          provider: provider.name,
          tier: provider.category
        });
      });
    }
  });
  
  res.json({
    object: 'list',
    data: models.map(m => ({
      id: m.id,
      object: 'model',
      provider: m.provider,
      tier: m.tier
    }))
  });
});

// Health check
router.get('/health', (req, res) => {
  const providers = getProviders();
  const enabled = providers.filter(p => p.enabled);
  
  res.json({
    status: 'ok',
    providers: {
      total: providers.length,
      enabled: enabled.length,
      by_tier: {
        custom: providers.filter(p => p.category === 'custom' && p.enabled).length,
        oauth: providers.filter(p => p.category === 'oauth' && p.enabled).length,
        free: providers.filter(p => p.category === 'free' && p.enabled).length
      }
    },
    uptime: process.uptime()
  });
});

module.exports = router;

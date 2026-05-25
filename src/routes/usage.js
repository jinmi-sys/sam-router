// Usage & Quota Tracking Routes
const express = require('express');
const router = express.Router();
const { readJson } = require('../utils');
const path = require('path');

const USAGE_FILE = path.join(__dirname, '..', '..', 'data', 'usage.json');
const KEYS_FILE = path.join(__dirname, '..', '..', 'data', 'keys.json');

// Get usage overview
router.get('/', (req, res) => {
  const usage = readJson(USAGE_FILE, []);
  const keys = readJson(KEYS_FILE, []);
  
  // Last 24h stats
  const now = new Date();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
  
  const recentUsage = usage.filter(u => new Date(u.timestamp) > dayAgo);
  const successCount = recentUsage.filter(u => u.status === 'success').length;
  const errorCount = recentUsage.filter(u => u.status === 'error').length;
  
  // By provider
  const byProvider = {};
  recentUsage.forEach(u => {
    if (!byProvider[u.provider]) {
      byProvider[u.provider] = { success: 0, error: 0, tokens: 0 };
    }
    byProvider[u.provider][u.status]++;
    byProvider[u.provider].tokens += u.tokens || 0;
  });
  
  // By tier
  const byTier = {};
  recentUsage.forEach(u => {
    if (!byTier[u.tier]) {
      byTier[u.tier] = { success: 0, error: 0 };
    }
    byTier[u.tier][u.status]++;
  });
  
  // Daily trend (last 7 days)
  const dailyTrend = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.setHours(0, 0, 0, 0));
    const dayEnd = new Date(date.setHours(23, 59, 59, 999));
    
    const dayUsage = usage.filter(u => {
      const ts = new Date(u.timestamp);
      return ts >= dayStart && ts <= dayEnd;
    });
    
    dailyTrend.push({
      date: dayStart.toISOString().split('T')[0],
      requests: dayUsage.length,
      success: dayUsage.filter(u => u.status === 'success').length,
      error: dayUsage.filter(u => u.status === 'error').length
    });
  }
  
  res.json({
    overview: {
      total: usage.length,
      last_24h: recentUsage.length,
      success_rate: recentUsage.length > 0 
        ? Math.round((successCount / recentUsage.length) * 100) 
        : 0
    },
    by_provider: byProvider,
    by_tier: byTier,
    daily_trend: dailyTrend,
    api_keys: {
      total: keys.length,
      active: keys.filter(k => k.enabled).length
    }
  });
});

// Get detailed usage logs
router.get('/logs', (req, res) => {
  const usage = readJson(USAGE_FILE, []);
  const { limit = 50, offset = 0, provider, status } = req.query;
  
  let filtered = usage;
  
  if (provider) {
    filtered = filtered.filter(u => u.provider === provider);
  }
  if (status) {
    filtered = filtered.filter(u => u.status === status);
  }
  
  // Sort by timestamp desc
  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  res.json({
    logs: filtered.slice(parseInt(offset), parseInt(offset) + parseInt(limit)),
    total: filtered.length
  });
});

// Quota status per API key
router.get('/quota', (req, res) => {
  const keys = readJson(KEYS_FILE, []);
  const usage = readJson(USAGE_FILE, []);
  
  const quotaData = keys.map(key => {
    const keyUsage = usage.filter(u => u.apiKey === key.id);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    return {
      id: key.id,
      name: key.name,
      key: key.key.substring(0, 12) + '...',
      enabled: key.enabled,
      total_requests: keyUsage.length,
      daily_requests: keyUsage.filter(u => new Date(u.timestamp) > dayAgo).length,
      monthly_requests: keyUsage.filter(u => new Date(u.timestamp) > monthAgo).length,
      last_used: key.lastUsed
    };
  });
  
  res.json({ quota: quotaData });
});

module.exports = router;

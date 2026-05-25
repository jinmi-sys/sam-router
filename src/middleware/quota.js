// Quota Tracking Middleware
const { readJson, writeJson } = require('../utils');
const path = require('path');

const USAGE_FILE = path.join(__dirname, '..', '..', 'data', 'usage.json');

// Track usage per API key
function trackUsage(apiKey, provider, model, tokens, duration, status, error = null) {
  const usage = readJson(USAGE_FILE, []);
  
  usage.push({
    timestamp: new Date().toISOString(),
    apiKey: apiKey.id,
    provider,
    model,
    tokens,
    duration,
    status,
    error
  });
  
  // Keep last 10000 entries
  if (usage.length > 10000) {
    usage.splice(0, usage.length - 10000);
  }
  
  writeJson(USAGE_FILE, usage);
}

// Check quota limits
function checkQuota(apiKey) {
  const usage = readJson(USAGE_FILE, []);
  const keyUsage = usage.filter(u => u.apiKey === apiKey.id);
  
  const now = new Date();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  
  const dailyCount = keyUsage.filter(u => new Date(u.timestamp) > dayAgo).length;
  const monthlyCount = keyUsage.filter(u => new Date(u.timestamp) > monthAgo).length;
  
  // Default limits (could be per-key configurable)
  const DAILY_LIMIT = 1000;
  const MONTHLY_LIMIT = 30000;
  
  return {
    daily: {
      used: dailyCount,
      limit: DAILY_LIMIT,
      remaining: Math.max(0, DAILY_LIMIT - dailyCount),
      exceeded: dailyCount >= DAILY_LIMIT
    },
    monthly: {
      used: monthlyCount,
      limit: MONTHLY_LIMIT,
      remaining: Math.max(0, MONTHLY_LIMIT - monthlyCount),
      exceeded: monthlyCount >= MONTHLY_LIMIT
    }
  };
}

// Quota check middleware
function quotaCheck(req, res, next) {
  if (!req.apiKey) {
    return next();
  }
  
  const quota = checkQuota(req.apiKey);
  
  // Add quota info to response headers
  res.set('X-Quota-Daily-Used', quota.daily.used);
  res.set('X-Quota-Daily-Limit', quota.daily.limit);
  res.set('X-Quota-Daily-Remaining', quota.daily.remaining);
  
  if (quota.daily.exceeded) {
    return res.status(429).json({
      error: 'Daily quota exceeded',
      quota: quota.daily
    });
  }
  
  if (quota.monthly.exceeded) {
    return res.status(429).json({
      error: 'Monthly quota exceeded',
      quota: quota.monthly
    });
  }
  
  next();
}

module.exports = {
  trackUsage,
  checkQuota,
  quotaCheck
};

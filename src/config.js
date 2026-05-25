// SAM Router Configuration
const path = require('path');

module.exports = {
  // Server
  PORT: 2500,
  HOST: '0.0.0.0',
  
  // Paths
  DATA_DIR: path.join(__dirname, '..', 'data'),
  DASHBOARD_PATH: path.join(__dirname, '..', 'index.html'),
  
  // API Key
  KEY_PREFIX: 'sam_sr_',
  KEY_LENGTH: 32,
  
  // Quota defaults
  DEFAULT_DAILY_LIMIT: 1000,
  DEFAULT_MONTHLY_LIMIT: 30000,
  
  // Token Saver
  RTK_COMPRESSION_RATIO: 0.7,   // Save 20-40% input tokens
  CAVEMAN_LITE_RATIO: 0.8,      // Light compression
  CAVEMAN_FULL_RATIO: 0.5,      // Aggressive compression
  CAVEMAN_ULTRA_RATIO: 0.35,    // Maximum compression
  
  // Fallback tiers
  FALLBACK_TIERS: {
    PRIMARY: 'custom',
    SECONDARY: 'oauth',
    TERTIARY: 'free'
  },
  
  // Upstream providers
  UPSTREAM: {
    openai: {
      base: 'https://api.openai.com/v1',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo']
    },
    anthropic: {
      base: 'https://api.anthropic.com/v1',
      models: ['claude-sonnet-4-20250514', 'claude-haiku-3.5-20241022']
    },
    openrouter: {
      base: 'https://openrouter.ai/api/v1',
      models: ['anthropic/claude-sonnet-4', 'google/gemini-2.5-pro']
    },
    groq: {
      base: 'https://api.groq.com/openai/v1',
      models: ['llama-3.1-70b-versatile', 'mixtral-8x7b-32768']
    }
  }
};

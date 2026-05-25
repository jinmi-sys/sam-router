// Token Saver Middleware (RTK + Caveman mode)
const config = require('../config');

// RTK: Compress tool output (save 20-40% input tokens)
function compressRTK(messages) {
  return messages.map(msg => {
    if (msg.role === 'tool') {
      // Compress tool output - remove redundant whitespace, shorten common patterns
      let content = msg.content;
      
      // Remove excessive newlines
      content = content.replace(/\n{3,}/g, '\n\n');
      
      // Remove trailing whitespace
      content = content.split('\n').map(line => line.trimEnd()).join('\n');
      
      // Compress repeated patterns
      content = content.replace(/(.)\1{5,}/g, '$1$1$1');
      
      return { ...msg, content };
    }
    return msg;
  });
}

// Caveman mode: Compress LLM output (save up to 65% output tokens)
function applyCavemanMode(messages, mode = 'lite') {
  const ratios = {
    lite: config.CAVEMAN_LITE_RATIO,
    full: config.CAVEMAN_FULL_RATIO,
    ultra: config.CAVEMAN_ULTRA_RATIO
  };
  
  const ratio = ratios[mode] || ratios.lite;
  
  return messages.map(msg => {
    if (msg.role === 'user') {
      let content = msg.content;
      
      // Add caveman instruction prefix
      const cavemanPrefix = mode === 'ultra' 
        ? 'Reply in 1-2 words max. '
        : mode === 'full'
        ? 'Reply in 1-2 sentences max. Be direct. '
        : 'Be concise. ';
      
      // Only add if not already present
      if (!content.startsWith(cavemanPrefix)) {
        content = cavemanPrefix + content;
      }
      
      return { ...msg, content };
    }
    return msg;
  });
}

// Middleware to process request body
function tokenSaver(req, res, next) {
  if (!req.body || !req.body.messages) {
    return next();
  }
  
  const mode = req.headers['x-caveman-mode'] || 'off';
  const rtkEnabled = req.headers['x-rtk-enabled'] === 'true';
  
  let messages = req.body.messages;
  
  // Apply RTK compression
  if (rtkEnabled) {
    messages = compressRTK(messages);
  }
  
  // Apply Caveman mode
  if (mode !== 'off') {
    messages = applyCavemanMode(messages, mode);
  }
  
  req.body.messages = messages;
  next();
}

// Get token savings estimate
function estimateSavings(originalTokens, mode = 'lite') {
  const ratios = {
    lite: config.CAVEMAN_LITE_RATIO,
    full: config.CAVEMAN_FULL_RATIO,
    ultra: config.CAVEMAN_ULTRA_RATIO
  };
  
  const ratio = ratios[mode] || ratios.lite;
  const saved = Math.round(originalTokens * (1 - ratio));
  
  return {
    original: originalTokens,
    compressed: Math.round(originalTokens * ratio),
    saved,
    percentage: Math.round((1 - ratio) * 100)
  };
}

module.exports = {
  tokenSaver,
  compressRTK,
  applyCavemanMode,
  estimateSavings
};

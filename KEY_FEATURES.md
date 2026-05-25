💡 Key Features
Feature	What It Does	Why It Matters
🚀 RTK Token Saver (RTK ⭐40K)	Compress tool outputs (git diff, grep, ls, tree...) before sending to LLM	Save 20-40% input tokens per request
🪨 Caveman Mode (Caveman ⭐52K)	Inject caveman-speak prompt → LLM replies terse, technical substance preserved	Save up to 65% output tokens
🎯 Smart 3-Tier Fallback	Auto-route: Subscription → Cheap → Free	Never stop coding, zero downtime
📊 Real-Time Quota Tracking	Live token count + reset countdown	Maximize subscription value
🔄 Format Translation	OpenAI ↔ Claude ↔ Gemini ↔ Cursor ↔ Kiro ↔ Vertex	Works with any CLI tool
👥 Multi-Account Support	Multiple accounts per provider	Load balancing + redundancy
🔄 Auto Token Refresh	OAuth tokens refresh automatically	No manual re-login needed
🎨 Custom Combos	Create unlimited model combinations	Tailor fallback to your needs
📝 Request Logging	Debug mode with full request/response logs	Troubleshoot issues easily
💾 Cloud Sync	Sync config across devices	Same setup everywhere
📊 Usage Analytics	Track tokens, cost, trends over time	Optimize spending
🌐 Deploy Anywhere	Localhost, VPS, Docker, Cloudflare Workers	Flexible deployment options


📖 Feature Details
🚀 RTK Token Saver
Tool outputs (git diff, grep, find, ls, tree, log dumps...) often eat 30-50% of your prompt budget. RTK detects them and applies smart, lossless compression before the request hits the LLM:

Filters: git-diff, git-status, grep, find, ls, tree, dedup-log, smart-truncate, read-numbered, search-list
Auto-detect: No config needed — RTK peeks the first 1KB of each tool_result and picks the right filter.
Safe by design: If a filter fails, throws, or makes output bigger, RTK silently keeps the original text. Errors never break your request.
Universal: Works across all formats (OpenAI, Claude, Gemini, Cursor, Kiro, OpenAI Responses) because it runs before any format translation.
Default ON: Toggle anytime in Dashboard → Endpoint settings.
Without RTK: 47K tokens sent to LLM
With RTK:    28K tokens sent to LLM   (40% saved · same context · same answer)
🎯 Smart 3-Tier Fallback
Create combos with automatic fallback:

Combo: "my-coding-stack"
  1. cc/claude-opus-4-6        (your subscription)
  2. glm/glm-4.7               (cheap backup, $0.6/1M)
  3. if/kimi-k2-thinking       (free fallback)

→ Auto switches when quota runs out or errors occur
📊 Real-Time Quota Tracking
Token consumption per provider
Reset countdown (5-hour, daily, weekly)
Cost estimation for paid tiers
Monthly spending reports
🔄 Format Translation
Seamless translation between formats:

OpenAI ↔ Claude ↔ Gemini ↔ Cursor ↔ Kiro ↔ Vertex ↔ Antigravity ↔ Ollama ↔ OpenAI Responses
Your CLI tool sends OpenAI format → 9Router translates → Provider receives native format
Works with any tool that supports custom OpenAI endpoints
👥 Multi-Account Support
Add multiple accounts per provider
Auto round-robin or priority-based routing
Fallback to next account when one hits quota
🔄 Auto Token Refresh
OAuth tokens automatically refresh before expiration
No manual re-authentication needed
Seamless experience across all providers
🎨 Custom Combos
Create unlimited model combinations
Mix subscription, cheap, and free tiers
Name your combos for easy access
Share combos across devices with Cloud Sync
📝 Request Logging
Enable debug mode for full request/response logs
Track API calls, headers, and payloads
Troubleshoot integration issues
Export logs for analysis
💾 Cloud Sync
Sync providers, combos, and settings across devices
Automatic background sync
Secure encrypted storage
Access your setup from anywhere
Cloud Runtime Notes
Prefer server-side cloud variables in production:
BASE_URL (internal callback URL used by sync scheduler)
CLOUD_URL (cloud sync endpoint base)
NEXT_PUBLIC_BASE_URL and NEXT_PUBLIC_CLOUD_URL are still supported for compatibility/UI, but server runtime now prioritizes BASE_URL/CLOUD_URL.
Cloud sync requests now use timeout + fail-fast behavior to avoid UI hanging when cloud DNS/network is unavailable.
📊 Usage Analytics
Track token usage per provider and model
Cost estimation and spending trends
Monthly reports and insights
Optimize your AI spending
💡 IMPORTANT - Understanding Dashboard Costs:

The "cost" displayed in Usage Analytics is for tracking and comparison purposes only. 9Router itself never charges you anything. You only pay providers directly (if using paid services).

Example: If your dashboard shows "$290 total cost" while using iFlow models, this represents what you would have paid using paid APIs directly. Your actual cost = $0 (iFlow is free unlimited).

Think of it as a "savings tracker" showing how much you're saving by using free models or routing through 9Router!

🌐 Deploy Anywhere
💻 Localhost - Default, works offline
☁️ VPS/Cloud - Share across devices
🐳 Docker - One-command deployment
🚀 Cloudflare Workers - Global edge network


💰 Pricing at a Glance
Tier	Provider	Cost	Quota Reset	Best For
🚀 TOKEN SAVER	RTK (built-in)	FREE	Always on	Save 20-40% tokens on EVERY request
💳 SUBSCRIPTION	Claude Code (Pro/Max)	$20-200/mo	5h + weekly	Already subscribed
Codex (Plus/Pro)	$20-200/mo	5h + weekly	OpenAI users
GitHub Copilot	$10-19/mo	Monthly	GitHub users
Cursor IDE	$20/mo	Monthly	Cursor users
💰 CHEAP	GLM-5.1 / GLM-4.7	$0.6/1M	Daily 10AM	Budget backup
MiniMax M2.7	$0.2/1M	5-hour rolling	Cheapest option
Kimi K2.5	$9/mo flat	10M tokens/mo	Predictable cost
🆓 FREE	Kiro AI	$0	Unlimited	Claude 4.5 + GLM-5 + MiniMax free
OpenCode Free	$0	Unlimited	No auth, auto-fetch models
Vertex AI	$300 credits	New GCP accounts	Gemini 3 Pro + DeepSeek + GLM-5
💡 Pro Tip: RTK + Kiro AI + OpenCode Free combo = $0 cost + 20-40% token savings!

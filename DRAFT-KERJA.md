# 📋 SAM Router — DRAFT KERJA

**Status:** In Progress  
**Dimulai:** 19:35 WIB, Minggu, 25 Mei 2026  
**Last Updated:** 20:22 WIB, Minggu, 25 Mei 2026  
**Source Reference:** 9Router Proxy v0.4.59  
**Workspace:** `/home/yui/.hermes/profiles/louis/workspace/sam-router/`

---

## 🎯 Spec Teknis (Dari Master)

```
Nama      : SAM Router
Port      : 2500 (hardcoded)
API Key   : sam_sr_[random_32_chars]
Theme     : Red Dark Emerald
Referensi : 9Router Proxy v0.4.59 (Master kasih 15 screenshot)
```

---

## 🏗️ Struktur UI (Dari Screenshot Analysis)

### Left Navigation
```
┌─────────────────────────┐
│  SAM Router v1.0        │
│─────────────────────────│
│  Endpoint      ✅ copy  │
│  Providers              │
│  Combos                 │
│  Usage                  │
│  Quota Tracker          │
│  MITM                   │
│  CLI Tools              │
│─────────────────────────│
│  SYSTEM                 │
│  ├─ Media Providers     │
│  │  ├─ Embedding        │
│  │  ├─ Text to Image    │
│  │  ├─ Text To Speech   │
│  │  ├─ Speech To Text   │
│  │  └─ Web Fetch/Search │
│  ├─ Proxy Pools         │
│  ├─ Skills              │
│  ├─ Console Log         │
│  └─ Settings            │
│─────────────────────────│
│  🚫 Shutdown            │
│  172.24.81.181:2500     │
└─────────────────────────┘
```

### Top Right Bar
```
┌──────────────────────────────────────┐
│ [Donate] [☀/🌙 Theme Toggle] [⬜ Apps] │
└──────────────────────────────────────┘
```

### Theme Warna
```
Background   : #0a0f0a (near-black emerald)
Primary      : #dc2626 (red-600)
Accent       : #10b981 (emerald-500)
Surface      : #0f1a12 (dark emerald tint)
Text         : #e2e8f0 (slate-200)
Warning      : #f59e0b (amber-500)
Grid Pattern : #0d1410 (subtle emerald grid)
```

---

## ✅ Checklist Pengerjaan

### Phase 1: Setup (DONE)
- [x] 19:35 WIB — Folder `sam-router/` created
- [x] 19:35 WIB — `DOCUMENTASI.md` initialized
- [x] 19:38 WIB — `KEY_FEATURES.md` saved (Master input)
- [x] 20:19 WIB — Screenshot ZIP extracted (15 images)
- [x] 20:22 WIB — All 15 screenshots analyzed
- [x] 20:22 WIB — `DRAFT-KERJA.md` created

### Phase 2: Core Structure (DONE)
- [x] Build HTML shell (red dark emerald theme)
- [x] Left navigation sidebar (all menu items)
- [x] Top right bar (donate, theme toggle, apps grid)
- [x] Shutdown button + IP display (port 2500)
- [x] Responsive layout (sidebar + main content)
- [x] All 18 pages with placeholder content:
  - Endpoint (API URL, Token Saver, API Keys)
  - Providers (empty state + add buttons)
  - Combos (example combo + controls)
  - Usage (stats cards)
  - Quota Tracker (example account)
  - MITM (server + tool interception)
  - CLI Tools
  - Embedding, Text to Image, TTS, STT, Web Fetch/Search (provider grids)
  - Proxy Pools, Skills, Console Log (live log), Settings

### Phase 3: Main Pages (PRIORITY)
- [x] **Endpoint Page** — API endpoint display, Tunnel/Tailscale toggle, Token Saver (RTK + Caveman), API Keys (sam_sr_ prefix)
- [x] **Providers Page** — 4 categories (Custom/OAuth/Free/Free-Tier), provider cards, CRUD, modals, test connections
- [ ] **Combos Page** — Create combo, round-robin toggle, copy/edit/delete
- [ ] **Usage Page** — Overview tab, token charts, cost tracking
- [ ] **Quota Tracker Page** — Account list, quota bars, refresh/edit/delete, pagination
- [ ] **MITM Page** — Status, start server, tool interception (Antigravity/Copilot/Kiro)
- [ ] **CLI Tools Page** — CLI config

### Phase 4: System Pages
- [ ] **Media Providers** — Submenu expand/collapse
  - [ ] Embedding — Provider cards (Gemini, OpenRouter, etc.)
  - [ ] Text to Image — Provider cards (DALL-E, SD, etc.)
  - [ ] Text To Speech — Provider cards
  - [ ] Speech To Text — Provider cards (Groq, Deepgram, etc.)
  - [ ] Web Fetch & Search — Search + Fetch provider cards
- [ ] **Proxy Pools** — Stats, add pool, empty state
- [ ] **Skills** — Skill management
- [ ] **Console Log** — Live log, clear button, log categories (PENDING, USAGE, STREAM, AUTH, ROUTING, FORMAT)
- [ ] **Settings** — App configuration

### Phase 5: Backend/API (FUTURE)
- [ ] API key generator (sam_sr_ prefix)
- [ ] Port config (hardcode 2500)
- [ ] Provider connection logic
- [ ] Token saver (RTK) implementation
- [ ] Caveman mode implementation
- [ ] 3-tier fallback routing
- [ ] Quota tracking logic

### Phase 6: Deploy (FUTURE)
- [ ] Push ke GitHub repo `sam-router`
- [ ] Deploy frontend demo
- [ ] 5 screenshots (3 live + 2 GitHub)
- [ ] Kirim ke chat Master

---

## 🐛 Problem & Solutions

| # | Timestamp | Problem | Solusi | Status |
|---|-----------|---------|--------|--------|
| 1 | 20:22 WIB | Vision API rate limit saat analyze screenshot | Retry beberapa kali, analisis 15 gambar dalam batch kecil | ✅ Resolved |

---

## 📝 Catatan Penting

### Dari Screenshot Analysis
```
Layout Pattern:
├── Fixed left sidebar (narrow, ~240px)
├── Main content area (flexible width)
├── Top bar (thin, right-aligned actions)
├── Cards/grid pattern untuk provider lists
├── Toggle switches untuk enable/disable
├── Status badges (Connected, No connections, Ready)
└── Action buttons (Test All, Create, Edit, Delete)
```

### API Key Format
```
Reference: sk-a68ae... (9Router)
SAM Router: sam_sr_[random_32_chars]
Example: sam_sr_k7x9m2p4q8v1n5j3h6f0d2s4a7g9l0
```

### Port
```
Reference: :1500 (9Router)
SAM Router: :2500 (hardcoded)
Display: 172.24.81.181:2500
```

---

## 🔄 Session Recovery

Kalau WSL restart / new session:
```
1. Baca file ini (DRAFT-KERJA.md) — status terakhir
2. Cek checklist — mana yang done, mana yang pending
3. Cek Problem & Solutions — jangan ulang error yang sama
4. Lanjut dari checklist terakhir yang pending
5. Update timestamp setiap kali mulai kerja
```

---

*Last updated: 20:22 WIB, Minggu, 25 Mei 2026*

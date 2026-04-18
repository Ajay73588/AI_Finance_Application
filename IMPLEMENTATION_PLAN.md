# 🚀 FinanceAI Implementation Plan

---

## 🎯 Project Goal

Build a production-grade AI-powered personal finance and investment advisory system with live portfolio tracking, intelligent insights, and an AI financial advisor — using Next.js, Prisma, PostgreSQL, and Clerk.

---

## 📊 Current Status Summary

- ✅ Clerk auth + middleware working
- ✅ User, Account, Transaction models + full CRUD
- ✅ Asset/Investment CRUD (manual prices)
- ✅ Single global budget (NOT per-category)
- ✅ Dashboard with account cards + transaction overview
- ✅ Inngest background jobs (recurring tx, monthly reports, budget alerts)
- ✅ Receipt scanning via AI (existing)
- ✅ Service layer partially refactored
- ❌ No Goals system
- ❌ No Net Worth history/snapshots
- ❌ No external price fetching (Price Engine)
- ❌ No CSV Import
- ❌ No AI Advisory chat
- ❌ No Health Score engine
- ❌ No Insights engine
- ❌ No Liabilities model (loans/debts separate from accounts)
- ❌ No AllocationTargets
- ❌ No AIConversations history

---

## 🧭 Execution Strategy

- Build phase-by-phase, never skip ahead
- One feature at a time, test immediately after
- Free APIs only (CoinGecko, free NSE endpoints)
- Minimax API for all AI features (single provider strategy)
- Aim for 60–70% of architecture (skip complex broker integrations)
- Staged Prisma migrations per phase

---

## 📅 Phase 1 — Stabilization (Week 1–2)

### 🎯 Goal

Fix existing gaps and align schema with architecture before building new features.

### ✅ Tasks

1. Add missing Prisma models: `Goal`, `Snapshot`, `Liability`, `AllocationTarget`, `AIConversation`, `Insight`
2. Add `category` field to Budget (migrate from single global → per-category budgets)
3. Add `currency` and `privacyMode` fields to User model
4. Update BudgetService to support category-level budgets
5. Create `LiabilityService` for loan/debt tracking
6. Create `GoalService` skeleton (CRUD + progress)
7. Create `lib/errors.js` with structured error classes matching architecture
8. Run Prisma migration

### 🛠 Files to Work On

- `prisma/schema.prisma`
- `lib/services/budgetService.js`
- `lib/services/liabilityService.js` *(create)*
- `lib/services/goalService.js` *(create)*
- `lib/errors.js` *(create)*

### ✅ Expected Output

Database schema matches architecture. Per-category budgets work. Goal model exists.

---

## 📅 Phase 2 — Core Engine (Week 3–4)

### 🎯 Goal

Build net worth history, health score engine, and portfolio analytics.

### ✅ Tasks

1. Create `SnapshotService.takeSnapshot()` — capture daily net worth + breakdown
2. Add Inngest job: Snapshot daily at 11:59pm IST
3. Create `HealthScoreService.compute()` — 5-dimension weighted scoring (savings rate, debt-to-income, investment allocation, goal progress, diversification)
4. Add `AllocationTarget` CRUD to a new `allocationService.js`
5. Extend `PortfolioService` with `getRiskScore()` and `getRebalancePlan()`
6. Extend `NetWorthService` with proper `getHistory()` using Snapshot table
7. Add Health Score card to dashboard

### 🛠 Files to Work On

- `lib/services/snapshotService.js` *(create)*
- `lib/services/healthScoreService.js` *(create)*
- `lib/services/allocationService.js` *(create)*
- `lib/services/portfolioService.js` *(update)*
- `lib/services/netWorthService.js` *(update)*
- `lib/inngest/function.js` *(add snapshot job)*
- `app/(main)/dashboard/_components/health-score.tsx` *(create)*

### ✅ Expected Output

Daily snapshots stored. Health score 0–10 visible on dashboard. Rebalancing plan available.

---

## 📅 Phase 3 — Data Enrichment (Week 5–7)

### 🎯 Goal

Fetch live asset prices and enable CSV import from brokers.

### ✅ Tasks

1. Create `PriceProvider` interface + types in `lib/types/price.ts`
2. Create `CoinGeckoAdapter` for crypto prices (free, no API key needed)
3. Create `NSEAdapter` for Indian stocks using free BSE/NSE endpoints
4. Create `PriceEngineService` with Redis caching and circuit breaker pattern
5. Add Inngest job: refresh prices every 15 minutes (market hours Mon–Fri 9am–4pm IST)
6. Create `ImportService` with broker detection
7. Create `GrowwAdapter` for CSV parsing (simplest format to start)
8. Add deduplication logic to ImportService
9. Create `/api/import` route
10. Wire live prices to asset list and portfolio view

### 🛠 Files to Work On

- `lib/types/price.ts` *(create)*
- `lib/adapters/coingecko.adapter.ts` *(create)*
- `lib/adapters/nse.adapter.ts` *(create)*
- `lib/adapters/groww.adapter.ts` *(create)*
- `lib/services/priceEngine.service.ts` *(create)*
- `lib/services/importService.ts` *(create)*
- `lib/cache.js` *(update — Redis helpers)*
- `lib/inngest/function.js` *(add price refresh job)*
- `app/api/import/route.ts` *(create)*
- `app/(main)/dashboard/assets/_components/assets-table.jsx` *(update — show live prices)*

### ✅ Expected Output

Crypto and stock prices update automatically. Users can import holdings via Groww CSV.

---

## 📅 Phase 4 — Intelligence Layer (Week 8–9)

### 🎯 Goal

Generate actionable rule-based insights and wire all intelligence to the dashboard.

### ✅ Tasks

1. Create `Insight` model with type, severity, message, and metadata
2. Create `InsightsService` with rule-based engine:
   - High spending category (>30% of income)
   - Low savings rate (<10%)
   - Budget breach approaching (>80% in current month)
   - Large transaction detection (>3x category average)
   - No investments for 3+ months
3. Create Inngest job: run insights daily
4. Add Insights feed to dashboard
5. Add "Insights" card component to dashboard

### 🛠 Files to Work On

- `prisma/schema.prisma` *(update — add Insight model)*
- `lib/services/insightsService.js` *(create)*
- `lib/inngest/function.js` *(add insights job)*
- `app/(main)/dashboard/page.jsx` *(update)*
- `app/(main)/dashboard/_components/insights-feed.tsx` *(create)*

### ✅ Expected Output

Rule-based insights appear on dashboard. Users see actionable financial observations.

---

## 📅 Phase 5 — AI System (Week 10–13)

### 🎯 Goal

Build the AI advisory chat with MiniMax as the sole AI provider — no Gemini fallback.

### ✅ Tasks

1. Add `AIConversation` model (already in Phase 1 schema)
2. Create `MiniMaxClient` in `lib/services/ai/minimax-client.ts`
3. Create `PromptBuilderService` in `lib/services/ai/prompt-builder.service.ts`
4. Create `AIAdvisoryService` with `buildContext()` and `runAction()`
5. Implement AI actions (in priority order):
   - `PORTFOLIO_ANALYSIS` — strengths, risks, recommendations
   - `SUGGEST_INVESTMENTS` — based on goals + risk tolerance
   - `REBALANCING_ADVICE` — step-by-step rebalancing steps
   - `CUSTOM_CHAT` — free-form grounded in financial data
6. Create `/api/ai` route with SSE streaming
7. Build AI chat page at `app/(main)/ai/page.tsx`
8. Add action buttons component for quick actions
9. Persist AI conversations to `AIConversation` model
10. Create `/api/ai/history` route for chat history

### 🛠 Files to Work On

- `lib/services/ai/minimax-client.ts` *(create)*
- `lib/services/ai/prompt-builder.service.ts` *(create)*
- `lib/services/ai/ai-advisory.service.ts` *(create)*
- `lib/services/aiConversation.service.js` *(create)*
- `app/api/ai/route.ts` *(create)*
- `app/api/ai/history/route.ts` *(create)*
- `app/(main)/ai/page.tsx` *(create)*
- `components/ai/chat-window.tsx` *(create)*
- `components/ai/action-button.tsx` *(create)*
- `config/ai-prompts.ts` *(create — prompt templates)*

### ✅ Expected Output

Users can chat with an AI financial advisor. Responses grounded in their actual financial data.

---

## 📅 Phase 6 — Advanced Features (Week 14–16)

### 🎯 Goal

Add goals tracking, scenario simulator, expanded alerts, and polish.

### ✅ Tasks

1. Build full Goals page at `app/(main)/goals/page.tsx`
2. Create goal form + goal card components
3. `GoalService.computeProgress()` and `getMonthlyRequired()`
4. Create Inngest job: goal milestone alerts (25%, 50%, 75%, 100%)
5. Build Scenario Simulator component (client-side SIP/projection calculator)
6. Add privacy mode toggle — mask all amounts in UI
7. Add account filter dropdown — filter all views by account
8. Expand alerts: price drop alerts, portfolio drift alerts
9. Wire remaining items to dashboard

### 🛠 Files to Work On

- `app/(main)/goals/page.tsx` *(create)*
- `components/goals/goal-card.tsx` *(create)*
- `components/goals/goal-form.tsx` *(create)*
- `lib/services/goalService.js` *(update — add progress methods)*
- `lib/services/alertService.js` *(create)*
- `components/scenario-simulator.tsx` *(create)*
- `components/privacy-toggle.tsx` *(create)*
- `app/(main)/dashboard/_components/account-filter.tsx` *(create)*
- `lib/inngest/function.js` *(add goal alerts, drift alerts)*

### ✅ Expected Output

Full goals system with progress. Scenario simulator. Privacy mode. All major features complete.

---

## 🏁 Final Deliverables

- [ ] User authentication (Clerk)
- [ ] Accounts + Transactions (full CRUD, recurring, receipt scan)
- [ ] Per-category budgets with alerts
- [ ] Assets with live price fetching (crypto, Indian stocks)
- [ ] CSV import (Groww broker format)
- [ ] Portfolio analytics (allocation, P&L, risk score)
- [ ] Net worth history with daily snapshots
- [ ] Financial health score (0–10 across 5 dimensions)
- [ ] Rule-based insights feed
- [ ] AI financial advisor chat (MiniMax, SSE streaming)
- [ ] AI conversation history
- [ ] Goals with progress tracking
- [ ] Scenario simulator (SIP projections)
- [ ] Budget + goal milestone alerts
- [ ] Privacy mode
- [ ] Background jobs (Inngest)

---

## ⚠️ Rules to Follow

- Never build Phase N before Phase N-1 is tested and working
- Always run `prisma migrate dev` after schema changes before touching services
- Test every feature manually before moving on
- Use free APIs first (CoinGecko) before paid market data
- Use Minimax API exclusively for all AI features — no Gemini fallback
- Keep AI prompts simple — iterate based on output quality

---

## 🎯 Success Criteria

The project is complete when ALL of these are true:

1. User can sign up, add accounts, and record transactions
2. Dashboard shows net worth, budget progress, account balances, and recent transactions
3. Assets show live prices (crypto + Indian stocks) that refresh automatically
4. User can import holdings from a Groww CSV export
5. Health score (0–10) appears on dashboard with breakdown
6. User can set financial goals and track progress
7. User can chat with AI advisor and get responses grounded in their data
8. AI conversations are saved and viewable
9. Rule-based insights appear on dashboard
10. Background jobs run on schedule (snapshot, price refresh, alerts)

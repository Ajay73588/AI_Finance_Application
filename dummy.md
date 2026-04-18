FinanceAI Implementation Plan                                                                                        
                                                                                                                         1. Current Implementation Status                                                                                     
                                                                                                                       
  ✅ Fully Implemented

  ┌──────────────────────┬────────┬───────────────────────────────────────────────────────┐
  │       Feature        │ Status │                         Notes                         │
  ├──────────────────────┼────────┼───────────────────────────────────────────────────────┤
  │ Clerk Authentication │ ✅     │ Middleware, route protection                          │
  ├──────────────────────┼────────┼───────────────────────────────────────────────────────┤
  │ User Model           │ ✅     │ Basic with clerkId                                    │
  ├──────────────────────┼────────┼───────────────────────────────────────────────────────┤
  │ Accounts             │ ✅     │ CRUD, default account, balance tracking               │
  ├──────────────────────┼────────┼───────────────────────────────────────────────────────┤
  │ Transactions         │ ✅     │ Full CRUD, recurring, receipt scanning (Gemini)       │
  ├──────────────────────┼────────┼───────────────────────────────────────────────────────┤
  │ Assets/Investments   │ ✅     │ CRUD with type classification                         │
  ├──────────────────────┼────────┼───────────────────────────────────────────────────────┤
  │ Budget               │ ⚠️     │ Single global budget (not category-based)             │
  ├──────────────────────┼────────┼───────────────────────────────────────────────────────┤
  │ Dashboard            │ ⚠️     │ Accounts + transactions + basic budget                │
  ├──────────────────────┼────────┼───────────────────────────────────────────────────────┤
  │ Background Jobs      │ ✅     │ Inngest: recurring tx, monthly reports, budget alerts │
  ├──────────────────────┼────────┼───────────────────────────────────────────────────────┤
  │ Service Layer        │ ⚠️     │ Partial refactoring done                              │
  └──────────────────────┴────────┴───────────────────────────────────────────────────────┘

  ⚠️ Partially Implemented

  ┌───────────────────┬──────────────────────────────────────────────────────────────┐
  │      Feature      │                             Gap                              │
  ├───────────────────┼──────────────────────────────────────────────────────────────┤
  │ Portfolio Service │ Basic allocation %, but no external prices, no rebalancing   │
  ├───────────────────┼──────────────────────────────────────────────────────────────┤
  │ Net Worth Service │ Simple calculation, no snapshots, no proper liability model  │
  ├───────────────────┼──────────────────────────────────────────────────────────────┤
  │ Budget Service    │ Only ONE budget per user, not per-category as arch specifies │
  ├───────────────────┼──────────────────────────────────────────────────────────────┤
  │ Asset Service     │ Manual price entry only, no price engine integration         │
  └───────────────────┴──────────────────────────────────────────────────────────────┘

  ❌ Not Implemented (Architecture Only)

  ┌─────────────────────┬───────────────────────────────────────────────────────┐
  │       Module        │                        Missing                        │
  ├─────────────────────┼───────────────────────────────────────────────────────┤
  │ Goals System        │ No Goal model, service, pages, or progress tracking   │
  ├─────────────────────┼───────────────────────────────────────────────────────┤
  │ Insights Engine     │ No rule-based or AI insights                          │
  ├─────────────────────┼───────────────────────────────────────────────────────┤
  │ AI Advisory System  │ No MiniMax integration, no prompt builder, no chat UI │
  ├─────────────────────┼───────────────────────────────────────────────────────┤
  │ Import System       │ No CSV parsing, no broker adapters (Groww/Zerodha)    │
  ├─────────────────────┼───────────────────────────────────────────────────────┤
  │ Price Engine        │ No external API fetching (NSE, CoinGecko, MF API)     │
  ├─────────────────────┼───────────────────────────────────────────────────────┤
  │ Health Score Engine │ No 0-10 scoring across 5 dimensions                   │
  ├─────────────────────┼───────────────────────────────────────────────────────┤
  │ Snapshot System     │ No daily net worth snapshots                          │
  ├─────────────────────┼───────────────────────────────────────────────────────┤
  │ Alert System        │ Only budget email alerts                              │
  ├─────────────────────┼───────────────────────────────────────────────────────┤
  │ Liabilities Model   │ Account balances only, no dedicated Liability entity  │
  ├─────────────────────┼───────────────────────────────────────────────────────┤
  │ Allocation Targets  │ No user-defined target allocation %                   │
  ├─────────────────────┼───────────────────────────────────────────────────────┤
  │ AI Conversations    │ No chat history persistence                           │
  ├─────────────────────┼───────────────────────────────────────────────────────┤
  │ Scenario Simulator  │ No what-if modeling                                   │
  ├─────────────────────┼───────────────────────────────────────────────────────┤
  │ Privacy Mode        │ Not implemented                                       │
  └─────────────────────┴───────────────────────────────────────────────────────┘

  ---
  2. Gap Analysis by Module

  Financial Tracking

  - Exists: Transaction CRUD, categorization, recurring
  - Missing: Advanced categorization rules, bulk import from bank statements

  Budgeting

  - Exists: Single global monthly budget
  - Missing: Category-level budgets (architecture requires per-category), budget rollover, historical budget analysis  

  Asset Management

  - Exists: Basic asset CRUD with manual prices
  - Missing: External price fetching, cost basis tracking, capital gains calculation, asset type-specific fields (e.g.,
   REIT dividend tracking)

  Portfolio Analysis

  - Exists: Basic allocation %, gain/loss calculation
  - Missing: Risk scoring, rebalancing engine, diversification analysis, benchmark comparison

  Net Worth Engine

  - Exists: Simple total calculation
  - Missing: Historical snapshots, proper liability tracking (loans, mortgages), breakdown by asset type with trends   

  Import System

  - Exists: Nothing
  - Missing: CSV parser, broker adapters (Groww, Zerodha, INDmoney), deduplication logic, normalization

  Price Engine

  - Exists: Manual entry only
  - Missing: NSE/BSE adapter, CoinGecko adapter, MF NAV adapter, Redis caching, circuit breaker, stale-price handling  

  AI Advisory System

  - Exists: Gemini receipt scanning only
  - Missing: MiniMax integration, PromptBuilderService, AIAdvisoryService, structured action routing, SSE streaming,   
  chat UI

  Insights Engine

  - Exists: Monthly report generation via Inngest
  - Missing: Rule-based insights engine, AI enrichment, insight categorization, actionable recommendations

  Goals System

  - Exists: Nothing
  - Missing: Entire subsystem - Goal model, GoalService, goals page, progress tracking, monthly required calculation   

  ---
  3. Phase-wise Implementation Plan

  Phase 1: Core Stabilization (2-3 weeks)

  Goal: Fix gaps in existing features before adding new ones.

  1. Database Schema Alignment
    - Add missing models to Prisma: Goal, Snapshot, Liability, AllocationTarget, AIConversation, Insight
    - Add category field to Budget (to make it per-category, not global)
    - Add currency, privacyMode to User model
  2. Budget Fix
    - Migrate from single budget → per-category budgets
    - Update BudgetService to query by category
  3. Account/Liability Separation
    - Clarify: Accounts represent bank accounts (assets). Add Liability model for loans/debts.
  4. Error Handling Polish
    - Add structured error classes to match architecture
  5. Testing Existing Features
    - Manual smoke test: create account → add transaction → verify dashboard

  ---
  Phase 2: Core Financial Engine (3-4 weeks)

  Goal: Build the aggregation and calculation engines.

  1. Net Worth Enhancements
    - Implement NetWorthService.getHistory() with proper snapshot storage
    - Create SnapshotService.takeSnapshot() as daily Inngest job
    - Proper liability tracking via new Liability model
  2. Portfolio Service Completion
    - getRiskScore() - simple portfolio risk based on allocation
    - getRebalancePlan() - compare current vs AllocationTarget
    - Add AllocationTarget CRUD
  3. Health Score Engine
    - HealthScoreService.compute() - 5-dimension weighted scoring
    - Store breakdown per dimension
  4. Snapshot System
    - Daily Inngest job at 11:59pm IST
    - Store net worth + full breakdown JSON

  ---
  Phase 3: Data Enrichment (2-3 weeks)

  Goal: Get real data flowing in.

  1. Price Engine Service
    - Create PriceEngineService with interface + adapters
  PriceProvider interface:
  - fetchStock(symbol): Promise<PriceResult>
  - fetchCrypto(symbol): Promise<PriceResult>
  - fetchMF(symbol): Promise<PriceResult>
    - CoinGecko adapter (free, no API key needed for basic)
    - NSE/BSE adapter via unofficial endpoints or free APIs
    - Redis caching with TTL per asset type
    - Circuit breaker pattern
  2. CSV Import System
    - ImportService with broker detection
    - Groww adapter (simplest to start)
    - Basic normalization and deduplication
    - Asset upsert after import
  3. Link Price Engine to Assets
    - On asset create/update, optionally fetch live price
    - Background refresh job every 15 min for active holdings

  ---
  Phase 4: Intelligence Layer (2-3 weeks)

  Goal: Make the app actually "smart."

  1. Insights Service
    - Rule-based insights engine:
        - High spending category detection
      - Savings rate warning (<10%)
      - Budget breach prediction
      - Large transaction flag
    - InsightsService.getAll() combining rule-based
  2. Insights Enrichment (Optional AI)
    - For users who opt-in, enrich insights with AI commentary
    - Use existing Gemini key (already in use for receipts)
  3. Dashboard Data Hookup
    - Wire HealthScoreService to dashboard
    - Wire InsightsService to dashboard feed

  ---
  Phase 5: AI Advisory System (3-4 weeks)

  Goal: First-class AI financial advisor.

  1. Database: AIConversation Model
    - Store full message history + context snapshot
  2. AIAdvisoryService
    - buildContext(userId) - aggregate all financial data
    - runAction(userId, action, message) - route to correct prompt
    - MiniMax client integration (or fallback to Gemini if MiniMax unavailable)
  3. PromptBuilderService
    - Action-specific prompts: PORTFOLIO_ANALYSIS, SUGGEST_INVESTMENTS, etc.
    - JSON schema enforcement for structured outputs
    - Confidence level in every response
  4. AI Chat UI (/ai page)
    - Chat interface with action buttons
    - SSE streaming for real-time response
    - Chat history sidebar
  5. Actions Catalog (in priority order):
    - PORTFOLIO_ANALYSIS - portfolio strengths, risks, recommendations
    - SUGGEST_INVESTMENTS - based on goals and risk tolerance
    - REBALANCING_ADVICE - step-by-step rebalancing
    - CUSTOM_CHAT - free-form with financial context grounding

  ---
  Phase 6: Advanced Features (2-3 weeks)

  Goal: Polish and differentiation.

  1. Goals System
    - Goal CRUD page
    - GoalService.computeProgress()
    - Monthly required calculation
    - Goal milestone alerts
  2. Scenario Simulator
    - Client-side compound interest calculator
    - SIP projection charts
    - Goal feasibility analysis
  3. Smart Alerts Expansion
    - Price alerts (asset drops X% in 24h)
    - Portfolio drift alerts
    - Goal milestone notifications
    - In-app notification UI
  4. Privacy Mode
    - UI toggle on User model
    - Mask amounts in all responses
  5. Multi-Account Filtering
    - Filter all views by account
    - Per-account breakdown in charts

  ---
  4. Task Breakdown Detail

  Phase 1 Tasks

  ┌────────────────────────────────────────────────────────────────────┬─────────┬──────────────────────────────────┐  
  │                                Task                                │  Type   │              Files               │  
  ├────────────────────────────────────────────────────────────────────┼─────────┼──────────────────────────────────┤  
  │ Add Goal, Snapshot, Liability, AllocationTarget, AIConversation,   │ Prisma  │ prisma/schema.prisma             │  
  │ Insight models                                                     │         │                                  │  
  ├────────────────────────────────────────────────────────────────────┼─────────┼──────────────────────────────────┤  
  │ Add category to Budget model                                       │ Prisma  │ prisma/schema.prisma             │  
  ├────────────────────────────────────────────────────────────────────┼─────────┼──────────────────────────────────┤  
  │ Add currency, privacyMode to User                                  │ Prisma  │ prisma/schema.prisma             │  
  ├────────────────────────────────────────────────────────────────────┼─────────┼──────────────────────────────────┤  
  │ Run prisma migrate dev                                             │ DevOps  │ Terminal                         │  
  ├────────────────────────────────────────────────────────────────────┼─────────┼──────────────────────────────────┤  
  │ Update BudgetService for category filtering                        │ Service │ lib/services/budgetService.js    │  
  ├────────────────────────────────────────────────────────────────────┼─────────┼──────────────────────────────────┤  
  │ Create LiabilityService                                            │ Service │ lib/services/liabilityService.js │  
  ├────────────────────────────────────────────────────────────────────┼─────────┼──────────────────────────────────┤  
  │ Create GoalService skeleton                                        │ Service │ lib/services/goalService.js      │  
  ├────────────────────────────────────────────────────────────────────┼─────────┼──────────────────────────────────┤  
  │ Create error classes                                               │ Lib     │ lib/errors.js                    │  
  └────────────────────────────────────────────────────────────────────┴─────────┴──────────────────────────────────┘  

  Phase 2 Tasks

  ┌──────────────────────────────────────────┬─────────┬────────────────────────────────────┐
  │                   Task                   │  Type   │               Files                │
  ├──────────────────────────────────────────┼─────────┼────────────────────────────────────┤
  │ SnapshotService.takeSnapshot()           │ Service │ lib/services/snapshotService.js    │
  ├──────────────────────────────────────────┼─────────┼────────────────────────────────────┤
  │ Snapshot Inngest job (daily 11:59pm IST) │ Job     │ lib/inngest/function.js            │
  ├──────────────────────────────────────────┼─────────┼────────────────────────────────────┤
  │ HealthScoreService.compute()             │ Service │ lib/services/healthScoreService.js │
  ├──────────────────────────────────────────┼─────────┼────────────────────────────────────┤
  │ AllocationTarget CRUD                    │ Service │ lib/services/allocationService.js  │
  ├──────────────────────────────────────────┼─────────┼────────────────────────────────────┤
  │ PortfolioService.getRiskScore()          │ Service │ lib/services/portfolioService.js   │
  ├──────────────────────────────────────────┼─────────┼────────────────────────────────────┤
  │ PortfolioService.getRebalancePlan()      │ Service │ lib/services/portfolioService.js   │
  └──────────────────────────────────────────┴─────────┴────────────────────────────────────┘

  Phase 3 Tasks

  ┌───────────────────────────────────┬─────────┬─────────────────────────────────────┐
  │               Task                │  Type   │                Files                │
  ├───────────────────────────────────┼─────────┼─────────────────────────────────────┤
  │ PriceProvider interface           │ Types   │ lib/types/price.ts                  │
  ├───────────────────────────────────┼─────────┼─────────────────────────────────────┤
  │ CoinGecko adapter                 │ Service │ lib/adapters/coingecko.adapter.ts   │
  ├───────────────────────────────────┼─────────┼─────────────────────────────────────┤
  │ NSE/BSE adapter (free API)        │ Service │ lib/adapters/nse.adapter.ts         │
  ├───────────────────────────────────┼─────────┼─────────────────────────────────────┤
  │ PriceEngineService                │ Service │ lib/services/priceEngine.service.ts │
  ├───────────────────────────────────┼─────────┼─────────────────────────────────────┤
  │ Redis caching layer               │ Lib     │ lib/cache.js                        │
  ├───────────────────────────────────┼─────────┼─────────────────────────────────────┤
  │ ImportService base                │ Service │ lib/services/importService.js       │
  ├───────────────────────────────────┼─────────┼─────────────────────────────────────┤
  │ Groww CSV adapter                 │ Adapter │ lib/adapters/groww.adapter.ts       │
  ├───────────────────────────────────┼─────────┼─────────────────────────────────────┤
  │ Price refresh Inngest job (15min) │ Job     │ lib/inngest/function.js             │
  └───────────────────────────────────┴─────────┴─────────────────────────────────────┘

  Phase 4 Tasks

  ┌─────────────────────────────┬───────────┬───────────────────────────────────┐
  │            Task             │   Type    │               Files               │
  ├─────────────────────────────┼───────────┼───────────────────────────────────┤
  │ Rule-based insights engine  │ Service   │ lib/services/insightsService.js   │
  ├─────────────────────────────┼───────────┼───────────────────────────────────┤
  │ Insight models              │ Prisma    │ prisma/schema.prisma              │
  ├─────────────────────────────┼───────────┼───────────────────────────────────┤
  │ Wire to dashboard           │ Page      │ app/(main)/dashboard/page.jsx     │
  ├─────────────────────────────┼───────────┼───────────────────────────────────┤
  │ Health score dashboard card │ Component │ components/cards/health-score.tsx │
  └─────────────────────────────┴───────────┴───────────────────────────────────┘

  Phase 5 Tasks

  ┌────────────────────────────────┬────────────────┬──────────────────────────────────────────────────────────────┐   
  │              Task              │      Type      │                            Files                             │   
  ├────────────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────┤   
  │ AIConversation model + service │ Prisma/Service │ prisma/schema.prisma, lib/services/aiConversation.service.js │   
  ├────────────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────┤   
  │ MiniMaxClient                  │ Service        │ lib/services/ai/minimax-client.ts                            │   
  ├────────────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────┤   
  │ PromptBuilderService           │ Service        │ lib/services/ai/prompt-builder.service.ts                    │   
  ├────────────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────┤   
  │ AIAdvisoryService              │ Service        │ lib/services/ai/ai-advisory.service.ts                       │   
  ├────────────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────┤   
  │ AI Chat page                   │ Page           │ app/(main)/ai/page.tsx                                       │   
  ├────────────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────┤   
  │ AI action buttons component    │ Component      │ components/ai/action-buttons.tsx                             │   
  ├────────────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────┤   
  │ /api/ai route with SSE         │ API            │ app/api/ai/route.ts                                          │   
  └────────────────────────────────┴────────────────┴──────────────────────────────────────────────────────────────┘   

  Phase 6 Tasks

  ┌─────────────────────────┬─────────────────────┬───────────────────────────────────┐
  │          Task           │        Type         │               Files               │
  ├─────────────────────────┼─────────────────────┼───────────────────────────────────┤
  │ Goals page + components │ Page                │ app/(main)/goals/page.tsx         │
  ├─────────────────────────┼─────────────────────┼───────────────────────────────────┤
  │ Scenario simulator      │ Component           │ components/scenario-simulator.tsx │
  ├─────────────────────────┼─────────────────────┼───────────────────────────────────┤
  │ Alert models + service  │ Service             │ lib/services/alertService.js      │
  ├─────────────────────────┼─────────────────────┼───────────────────────────────────┤
  │ Privacy mode toggle     │ Component + Service │ Throughout                        │
  ├─────────────────────────┼─────────────────────┼───────────────────────────────────┤
  │ Account filter dropdown │ Component           │ Throughout                        │
  └─────────────────────────┴─────────────────────┴───────────────────────────────────┘

  ---
  5. Priority Order

  Build FIRST (High Value, Low Complexity)

  1. Phase 1 stabilization - Fix budget, add schema models
  2. Price Engine (CoinGecko only) - Free API, immediate value for crypto users
  3. Goals System - High visibility feature, straightforward CRUD
  4. Health Score - Easy to calculate, impressive dashboard addition

  Build NEXT (High Value, Higher Complexity)

  5. CSV Import - Critical for user onboarding, good resume feature
  6. AI Chat - Differentiator, but requires prompt engineering iteration

  BUILD LATER (Lower Priority)

  7. Advanced rebalancing - Needs allocation targets first
  8. Scenario simulator - Client-side only, low backend cost
  9. Multi-account filtering - UX polish

  SKIP (Overkill for Single Developer)

  - Zerodha KITE adapter (complex brokerage integration)
  - INDmoney adapter (complex CSV format)
  - Full NSE/BSE real-time (rate limited, requires paid API)
  - Comprehensive monitoring/observability (use free tiers: Vercel Analytics, Sentry)

  ---
  6. Risks & Complexity

  Hard Parts

  ┌───────────────────┬────────────────────────────────────────┬───────────────────────────────────────────────────┐   
  │      Feature      │                  Risk                  │                    Mitigation                     │   
  ├───────────────────┼────────────────────────────────────────┼───────────────────────────────────────────────────┤   
  │ CSV Parsing       │ Broker CSV formats change frequently,  │ Start with one broker only (Groww), validate      │   
  │                   │ row-level errors                       │ before import                                     │   
  ├───────────────────┼────────────────────────────────────────┼───────────────────────────────────────────────────┤   
  │ AI Prompt         │ Outputs may be inconsistent,           │ Enforce JSON schema, always include confidence    │   
  │ Engineering       │ hallunications                         │ level, rule-based fallback                        │   
  ├───────────────────┼────────────────────────────────────────┼───────────────────────────────────────────────────┤   
  │ External Price    │ API rate limits, downtime              │ Circuit breaker, serve stale cache, free tier     │   
  │ APIs              │                                        │ CoinGecko first                                   │   
  ├───────────────────┼────────────────────────────────────────┼───────────────────────────────────────────────────┤   
  │ Snapshot          │ Computing net worth for users with     │ Batch process in Inngest, Redis cache             │   
  │ Performance       │ many transactions                      │                                                   │   
  └───────────────────┴────────────────────────────────────────┴───────────────────────────────────────────────────┘   

  Where Bugs Will Happen

  1. Decimal precision - Financial math with Float → use proper Decimal everywhere
  2. Timezone handling - Transactions and snapshots must be UTC in DB
  3. Budget edge cases - Month boundaries, first-of-month reset
  4. CSV dedup logic - Same asset imported twice from different sources
  5. AI context size - Token limits, trim old transactions to last 3 months

  Performance Concerns

  1. Dashboard load - Parallel fetch all services, but add Redis caching
  2. Price refresh - Don't refresh all users on every cron, only active users
  3. AI chat latency - SSE streaming is must, else UX suffers

  ---
  7. Final Execution Strategy

  For a Single Developer

  Time Allocation: ~15-20 hours/week realistic

  Recommended Sequence:

  Month 1: Phase 1 + Phase 2
  - Week 1-2: Schema migrations, fix budget, error handling
  - Week 3-4: Net worth history, health score, snapshots

  Month 2: Phase 3 (Price Engine + Import)
  - Week 1-2: CoinGecko adapter, Redis caching, price refresh job
  - Week 3-4: CSV import for one broker, asset enrichment

  Month 3: Phase 4 + Phase 5
  - Week 1-2: Insights engine, dashboard wiring
  - Week 3-4: AI chat UI, MiniMax integration, prompt builder

  Month 4: Phase 6 + Polish
  - Goals, scenario simulator, alerts, privacy mode
  - Bug fixes, testing, UX polish

  How to Avoid Burnout

  1. One phase at a time - Don't start Phase 3 until Phase 2 works end-to-end
  2. Staged Prisma migrations - Each phase adds models, don't try to add everything at once
  3. Test manually each feature - Add to dashboard, verify it renders, before moving on
  4. Use existing infra first - Gemini already works for receipts → reuse for simple AI insights before building full  
  MiniMax pipeline
  5. Free APIs only - CoinGecko (crypto), free NSE/BSE endpoints → no paid market data

  Realistic Architecture Coverage

  Aim for 60-70% of architecture:

  ┌────────────────────────────────┬──────────────────────────────┐
  │      What You Will Build       │        What You Skip         │
  ├────────────────────────────────┼──────────────────────────────┤
  │ All core services              │ Full observability stack     │
  ├────────────────────────────────┼──────────────────────────────┤
  │ Price engine (CoinGecko + NSE) │ Zerodha KITE adapter         │
  ├────────────────────────────────┼──────────────────────────────┤
  │ CSV import (Groww only)        │ INDmoney, full broker suite  │
  ├────────────────────────────────┼──────────────────────────────┤
  │ AI chat (basic)                │ Full prompt engineering      │
  ├────────────────────────────────┼──────────────────────────────┤
  │ Goals, insights, health score  │ Advanced scenario modeling   │
  ├────────────────────────────────┼──────────────────────────────┤
  │ Basic alerts                   │ Multi-channel alert dispatch │
  ├────────────────────────────────┼──────────────────────────────┤
  │ Privacy mode                   │ Admin dashboard              │
  └────────────────────────────────┴──────────────────────────────┘

  Resume-Worthy Features (Build These First)

  1. Real-time portfolio dashboard with live prices - Shows price engine
  2. AI-powered financial advisor chat - Shows AI integration
  3. CSV import with broker detection - Shows parsing/engineering
  4. Financial health score with breakdown - Shows algorithmic thinking
  5. Goals with progress tracking - Shows planning/features

  ---
  Summary

  Your codebase has solid foundations: proper service layer separation, Clerk auth, Inngest background jobs, and basic 
  CRUD. The biggest gaps are data enrichment (live prices, CSV import) and intelligence (AI advisory, insights, goals).

  Start with: Fix budget → Add health score → Add CoinGecko price engine → Add goals → Add AI chat.

  This gives you a working, impressive product in 3-4 months of part-time work.
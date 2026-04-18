# Welth - AI-Powered Personal Finance & Investment Advisory Platform

A production-grade, full-stack fintech web application designed to serve as a complete financial decision-support platform. It goes beyond transaction tracking — it is an intelligent financial companion that aggregates multi-asset portfolios, analyzes financial health in real time, and delivers AI-driven advisory.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Shadcn UI, Recharts
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Clerk
- **Background Jobs**: Inngest
- **AI Advisory**: MiniMax API
- **Email**: Resend
- **Security**: ArcJet

## Features

- [x] User authentication with Clerk
- [x] Multi-account management (Savings, Current)
- [x] Transaction tracking (Income/Expense) with categories
- [x] Receipt scanning via AI
- [x] Per-category budgets with alerts
- [x] Financial health score (0-10 across 5 dimensions)
- [x] Asset/Investment portfolio tracking
- [x] Daily net worth snapshots
- [x] Goals tracking with progress
- [x] Liability management (loans, debts)
- [x] Background jobs (recurring transactions, monthly reports, budget alerts)
- [ ] AI financial advisor chat
- [ ] Live price fetching (crypto, stocks)
- [ ] CSV import from brokers
- [ ] Rule-based insights feed
- [ ] Scenario simulator

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Clerk account (free tier)
- Node package manager (npm)

## Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-finance-platform-main
```

2. Install dependencies:
```bash
npm install
```

3. Create the environment file:
```bash
cp .env.example .env
```

4. Fill in your environment variables in `.env`:

| Variable | Description | Where to Get |
|----------|-------------|-------------|
| `DATABASE_URL` | PostgreSQL connection string | Your PostgreSQL setup |
| `DIRECT_URL` | Direct PostgreSQL connection (for Prisma) | Same as DATABASE_URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | [Clerk Dashboard](https://clerk.dev) |
| `CLERK_SECRET_KEY` | Clerk secret key | [Clerk Dashboard](https://clerk.dev) |
| `MINIMAX_API_KEY` | MiniMax API key (for AI Advisory) | [MiniMax Platform](https://platform.minimaxi.com) |
| `GEMINI_API_KEY` | Gemini API key (for monthly reports) | [Google AI Studio](https://aistudio.google.com) |
| `RESEND_API_KEY` | Resend API key (for emails) | [Resend Dashboard](https://resend.com) |
| `ARCJET_KEY` | ArcJet key (for security) | [ArcJet Dashboard](https://arcjet.com) |

5. Set up the database:
```bash
# Push Prisma schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (main)/                   # Protected routes (dashboard)
│   │   ├── dashboard/            # Main dashboard
│   │   │   ├── assets/           # Asset management
│   │   │   └── _components/      # Dashboard components
│   │   ├── account/              # Account details
│   │   └── transaction/          # Transaction management
│   ├── api/                      # API routes
│   │   ├── assets/              # Asset CRUD
│   │   ├── investments/          # Investment CRUD
│   │   └── inngest/             # Inngest webhook
│   └── layout.js                 # Root layout
├── components/                  # Shared UI components
│   └── ui/                      # Shadcn UI primitives
├── lib/                         # Core libraries
│   ├── services/                # Business logic services
│   │   ├── accountService.js
│   │   ├── assetService.ts
│   │   ├── budgetService.js
│   │   ├── dashboardService.js
│   │   ├── goalService.js
│   │   ├── healthScoreService.js
│   │   ├── liabilityService.js
│   │   ├── netWorthService.js
│   │   ├── portfolioService.js
│   │   ├── snapshotService.js
│   │   └── transactionService.js
│   ├── inngest/                # Inngest functions
│   │   ├── client.js
│   │   └── function.js
│   └── errors.js               # Error handling classes
├── prisma/                     # Database schema
│   └── schema.prisma
├── actions/                    # Server actions
├── data/                       # Static data
└── public/                     # Static assets
```

## Database Schema

The project uses PostgreSQL with Prisma ORM. Key models:
- **User** - Clerk auth + user preferences
- **Account** - Bank accounts (Savings, Current)
- **Transaction** - Income/Expense records
- **Budget** - Per-category monthly limits
- **Asset** - Investments (stocks, crypto, mutual funds, etc.)
- **Goal** - Financial goals with target amounts
- **Liability** - Loans and debts
- **Snapshot** - Daily net worth history
- **AIConversation** - AI chat history
- **Insight** - Rule-based financial insights

## Background Jobs (Inngest)

- **Daily at 11:59 PM IST**: Take net worth snapshot for all users
- **First day of each month**: Generate and send monthly financial reports
- **Every 6 hours**: Check budget alerts
- **Daily at midnight**: Process recurring transactions

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/assets` | Asset CRUD |
| GET/PUT/DELETE | `/api/assets/[id]` | Single asset operations |
| GET/POST | `/api/investments` | Investment CRUD |
| GET | `/api/inngest` | Inngest webhook |

## Development

```bash
# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm start

# Email development (React Email)
npm run email
```

## Security

- ArcJet protection against bots and attacks
- Clerk JWT authentication on all protected routes
- User data isolation (all queries scoped by userId)
- Input validation with Zod schemas

## License

MIT

💸 Wealth – AI Powered Finance Platform

This is a responsive AI-powered finance platform built with Next.js, Tailwind CSS, Prisma, and Shadcn UI.
It helps users track income & expenses, manage budgets, and get personalized insights with interactive charts and AI-driven recommendations.

🚀 Features

📊 Dashboard Analytics – Income, expenses, budget usage, and pie chart visualization

💰 Expense Tracking – Add and categorize income/expenses (with support for "Investment")

📈 Budget Management – Set monthly budgets, get alerts when usage > 90%

✉️ Email Notifications – Automatic alerts via Resend
 API

🤖 AI Integration – Google Gemini API for personalized financial insights (future: chatbot for investment tips)

🔐 Authentication – User management powered by Clerk

🎨 Modern UI – Shadcn components, Tailwind styling, smooth animations

🛠️ Tech Stack

Frontend: Next.js 15
, Tailwind CSS
, Shadcn UI

Backend: Prisma
 ORM, Supabase
 Postgres DB

Auth: Clerk

Email: Resend

AI: Google Gemini API

Security: Arcjet

📂 Project Structure
my-app/
├── app/                # Next.js App Router
│   ├── dashboard/      # Dashboard & charts
│   ├── transaction/    # Transaction CRUD
│   ├── globals.css     # Tailwind + global styles
├── components/         # Reusable UI components
├── lib/                # Utilities, API clients
├── prisma/             # Prisma schema & migrations
├── public/             # Static assets
└── README.md

⚙️ Installation

Clone the repository and install dependencies:

git clone https://github.com/YOUR_USERNAME/wealth-platform.git
cd wealth-platform
npm install


Run the development server:

npm run dev


Visit 👉 http://localhost:3000

🔑 Environment Variables

Create a .env.local file in the project root and add the following keys:

Variable	Description
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY	Clerk publishable key for authentication (public)
CLERK_SECRET_KEY	Clerk secret key for server-side auth
NEXT_PUBLIC_CLERK_SIGN_IN_URL	Custom sign-in route (default: /sign-in)
NEXT_PUBLIC_CLERK_SIGN_UP_URL	Custom sign-up route (default: /sign-up)
DATABASE_URL	Supabase Postgres connection string (pgbouncer)
DIRECT_URL	Direct Postgres connection (for Prisma migrations)
ARCJET_KEY	Arcjet API key for fraud/abuse protection
RESEND_API_KEY	Resend API key for sending emails (alerts/notify)
GEMINI_API_KEY	Google Gemini API key for AI/LLM functionality

⚠️ Important:

Do not commit .env.local to GitHub.

Make sure .gitignore includes .env.local.

🔮 Future Updates

🤖 AI chatbot for financial investment advice

💡 Smart recommendations on investment platforms (stocks, mutual funds, crypto)

📱 Mobile-friendly PWA support

📤 Export transactions to Excel/CSV

🧑‍💻 Contributing

Contributions are welcome! Please fork the repo, make changes, and submit a pull request.
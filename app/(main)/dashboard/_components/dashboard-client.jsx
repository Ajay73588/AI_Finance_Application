"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Target,
  ArrowRight,
  Plus,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { NetWorthCard } from "../_components/net-worth-card";
import { PortfolioSummaryCard } from "../_components/portfolio-summary-card";
import { HealthScoreCard } from "../_components/health-score-card";
import { AccountCard } from "../_components/account-card";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { BudgetProgress } from "./budget-progress";

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEEAD",
  "#D4A5A5",
  "#9FA8DA",
];

export function DashboardClient({ initialAccounts, initialTransactions, budgetData }) {
  const [selectedAccountId, setSelectedAccountId] = useState(
    initialAccounts?.find((a) => a.isDefault)?.id || initialAccounts?.[0]?.id
  );
  const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0, netFlow: 0 });

  // Calculate stats from transactions
  useEffect(() => {
    if (!initialTransactions) return;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyTx = initialTransactions.filter((t) => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const income = monthlyTx
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = monthlyTx
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    setStats({
      totalIncome: income,
      totalExpense: expense,
      netFlow: income - expense,
    });
  }, [initialTransactions]);

  // Get recent transactions
  const recentTransactions = (initialTransactions || [])
    .filter((t) => t.accountId === selectedAccountId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // Expense breakdown
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpenses = (initialTransactions || [])
    .filter((t) => {
      const date = new Date(t.date);
      return (
        t.type === "EXPENSE" &&
        t.accountId === selectedAccountId &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    });

  const expensesByCategory = monthlyExpenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  const pieChartData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  // Calculate per-account stats for AccountCard
  const accountsWithStats = (initialAccounts || []).map((account) => {
    const accountTx = initialTransactions?.filter((t) => t.accountId === account.id) || [];
    const monthTx = accountTx.filter((t) => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const totalIncome = monthTx
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = monthTx
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      ...account,
      totalIncome,
      totalExpense,
    };
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <NetWorthCard />
        <PortfolioSummaryCard />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Cash Flow
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.abs(stats.netFlow).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p
              className={`text-xs font-medium ${
                stats.netFlow >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {stats.netFlow >= 0 ? "+ Saved" : "- Used"} this month
            </p>
          </CardContent>
        </Card>
        <HealthScoreCard compact />
      </div>

      {/* Budget Progress */}
      <BudgetProgress
        initialBudget={budgetData?.budget}
        currentExpenses={budgetData?.currentExpenses || 0}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {initialAccounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No transactions yet
                </p>
                <Button asChild className="mt-4" size="sm">
                  <Link href="/transaction/create">Add Transaction</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          transaction.type === "EXPENSE"
                            ? "bg-red-100 text-red-600"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        {transaction.type === "EXPENSE" ? (
                          <TrendingDown className="h-4 w-4" />
                        ) : (
                          <TrendingUp className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {transaction.description || transaction.category}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(transaction.date), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        transaction.type === "EXPENSE"
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {transaction.type === "EXPENSE" ? "-" : "+"}$
                      {transaction.amount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {recentTransactions.length > 0 && (
              <Button asChild variant="ghost" className="w-full mt-4">
                <Link href={`/account/${selectedAccountId}`}>
                  View All Transactions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Expense Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieChartData.length === 0 ? (
              <div className="text-center py-8">
                <PieChart className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No expenses this month
                </p>
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) =>
                        `$${value.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-4 space-y-2">
              {pieChartData.slice(0, 5).map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">
                    ${item.value.toLocaleString("en-IN", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Accounts</h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/assets">View Investments</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CreateAccountDrawer>
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed bg-slate-50/50 hover:bg-slate-50">
              <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-32">
                <Plus className="h-8 w-8 mb-2" />
                <p className="text-sm font-medium">Add New Account</p>
              </CardContent>
            </Card>
          </CreateAccountDrawer>
          {accountsWithStats.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Button asChild variant="outline" className="h-auto py-4 justify-start">
          <Link href="/goals">
            <Target className="mr-3 h-5 w-5 text-blue-500" />
            <div className="text-left">
              <p className="font-medium">Financial Goals</p>
              <p className="text-xs text-muted-foreground">
                Track your savings targets
              </p>
            </div>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 justify-start">
          <Link href="/dashboard/assets">
            <Wallet className="mr-3 h-5 w-5 text-green-500" />
            <div className="text-left">
              <p className="font-medium">Investment Portfolio</p>
              <p className="text-xs text-muted-foreground">
                View and manage assets
              </p>
            </div>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 justify-start">
          <Link href="/transaction/create">
            <Plus className="mr-3 h-5 w-5 text-purple-500" />
            <div className="text-left">
              <p className="font-medium">Add Transaction</p>
              <p className="text-xs text-muted-foreground">
                Record income or expense
              </p>
            </div>
          </Link>
        </Button>
      </div>
    </div>
  );
}

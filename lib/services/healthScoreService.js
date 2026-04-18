/**
 * Health Score Service
 * --------------------
 * Computes a financial health score (0-10) across 5 weighted dimensions:
 * 1. Savings Rate
 * 2. Debt-to-Income Ratio
 * 3. Investment Allocation
 * 4. Goal Progress
 * 5. Diversification
 *
 * Architecture: All business logic lives here.
 * Accepts userId directly (caller handles auth).
 */

import { db } from "@/lib/prisma";

/**
 * Gets a user by internal ID.
 */
async function getUserById(userId) {
  return db.user.findUnique({
    where: { id: userId },
  });
}

/**
 * Computes the monthly income for the current month.
 */
async function getMonthlyIncome(userId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const result = await db.transaction.aggregate({
    where: {
      userId,
      type: "INCOME",
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    _sum: { amount: true },
  });

  return result._sum.amount ? result._sum.amount.toNumber() : 0;
}

/**
 * Gets monthly expenses for current month.
 */
async function getMonthlyExpenses(userId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const result = await db.transaction.aggregate({
    where: {
      userId,
      type: "EXPENSE",
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    _sum: { amount: true },
  });

  return result._sum.amount ? result._sum.amount.toNumber() : 0;
}

/**
 * Gets total assets value.
 */
async function getTotalAssets(userId) {
  const assets = await db.asset.findMany({ where: { userId } });
  return assets.reduce((sum, a) => sum + (a.currentPrice || 0) * a.quantity, 0);
}

/**
 * Gets total liabilities outstanding.
 */
async function getTotalLiabilities(userId) {
  const liabilities = await db.liability.findMany({ where: { userId } });
  return liabilities.reduce((sum, l) => sum + l.outstandingAmount, 0);
}

/**
 * Computes average goal progress percentage across active goals.
 */
async function getAverageGoalProgress(userId) {
  const goals = await db.goal.findMany({
    where: { userId, status: "ACTIVE" },
  });

  if (goals.length === 0) return null;

  const totalProgress = goals.reduce((sum, goal) => {
    const progress =
      goal.targetAmount > 0
        ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
        : 0;
    return sum + progress;
  }, 0);

  return totalProgress / goals.length;
}

/**
 * Computes portfolio diversification score based on asset type spread.
 * Returns 0-2 based on how many asset types are held.
 */
async function getDiversificationScore(userId) {
  const assets = await db.asset.findMany({ where: { userId } });

  if (assets.length === 0) return { score: 0, typeCount: 0, maxScore: 2 };

  const uniqueTypes = new Set(assets.map((a) => a.type));
  const typeCount = uniqueTypes.size;

  // Score based on number of asset types: 1 type=0, 2 types=0.5, 3=1, 4=1.5, 5+=2
  let score;
  if (typeCount <= 1) score = 0;
  else if (typeCount === 2) score = 0.5;
  else if (typeCount === 3) score = 1;
  else if (typeCount === 4) score = 1.5;
  else score = 2;

  return { score, typeCount, maxScore: 2 };
}

/**
 * Computes savings rate sub-score (0-2).
 * savingsRate = (income - expenses) / income
 * >20% = 2.0, 10-20% = 1.0, <10% = 0
 */
async function getSavingsRateScore(userId) {
  const income = await getMonthlyIncome(userId);
  const expenses = await getMonthlyExpenses(userId);

  if (income === 0) return { score: 0, savingsRate: 0, maxScore: 2 };

  const savings = income - expenses;
  const savingsRate = (savings / income) * 100;

  let score;
  if (savingsRate > 20) score = 2.0;
  else if (savingsRate >= 10) score = 1.0;
  else score = 0;

  return { score, savingsRate, maxScore: 2 };
}

/**
 * Computes debt-to-income ratio sub-score (0-2).
 * DTI = monthly EMI / monthly income
 * <30% = 2.0, 30-50% = 1.0, >50% = 0
 */
async function getDebtToIncomeScore(userId) {
  const income = await getMonthlyIncome(userId);
  const liabilities = await db.liability.findMany({ where: { userId } });

  if (income === 0) return { score: 0, dti: 0, maxScore: 2 };

  // Use average monthly EMI across all liabilities
  const totalMonthlyEMI = liabilities.reduce(
    (sum, l) => sum + (l.monthlyEMI || 0),
    0
  );

  const dti = income > 0 ? (totalMonthlyEMI / income) * 100 : 0;

  let score;
  if (dti < 30) score = 2.0;
  else if (dti <= 50) score = 1.0;
  else score = 0;

  return { score, dti, maxScore: 2 };
}

/**
 * Computes investment allocation sub-score (0-2).
 * investmentAllocation = invested assets / net worth
 * >40% = 2.0, 20-40% = 1.0, <20% = 0
 */
async function getInvestmentAllocationScore(userId) {
  const assets = await db.asset.findMany({ where: { userId } });
  const liabilities = await db.liability.findMany({ where: { userId } });

  const totalAssets = assets.reduce(
    (sum, a) => sum + (a.currentPrice || 0) * a.quantity,
    0
  );
  const totalLiabilities = liabilities.reduce(
    (sum, l) => sum + l.outstandingAmount,
    0
  );
  const netWorth = totalAssets - totalLiabilities;

  if (netWorth <= 0) return { score: 0, allocation: 0, maxScore: 2 };

  // Cash is not an investment; count everything else
  const investedAssets = assets
    .filter((a) => a.type !== "cash")
    .reduce((sum, a) => sum + (a.currentPrice || 0) * a.quantity, 0);

  const allocation = (investedAssets / netWorth) * 100;

  let score;
  if (allocation > 40) score = 2.0;
  else if (allocation >= 20) score = 1.0;
  else score = 0;

  return { score, allocation, maxScore: 2 };
}

/**
 * Computes goal progress sub-score (0-2).
 * avgProgress >70% = 2.0, 40-70% = 1.0, <40% = 0
 */
async function getGoalProgressScore(userId) {
  const avgProgress = await getAverageGoalProgress(userId);

  if (avgProgress === null) return { score: 1.0, avgProgress: 0, reason: "No goals set", maxScore: 2 };

  let score;
  if (avgProgress > 70) score = 2.0;
  else if (avgProgress >= 40) score = 1.0;
  else score = 0;

  return { score, avgProgress, maxScore: 2 };
}

/**
 * Main function: computes the full financial health score.
 * Accepts internal userId (not clerkUserId).
 * Returns score 0-10 and breakdown by dimension.
 */
export async function computeHealthScore(userId) {
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");

  // Compute all 5 dimensions in parallel
  const [savings, debt, investment, goals, diversification] = await Promise.all([
    getSavingsRateScore(userId),
    getDebtToIncomeScore(userId),
    getInvestmentAllocationScore(userId),
    getGoalProgressScore(userId),
    getDiversificationScore(userId),
  ]);

  const totalScore =
    savings.score + debt.score + investment.score + goals.score + diversification.score;

  // Final score is average of 5 dimensions (each out of 2, so total out of 10)
  const score = Math.round(totalScore * 10) / 10;

  return {
    score,
    breakdown: {
      savings: {
        value: savings.savingsRate,
        label: "Savings Rate",
        score: savings.score,
        maxScore: savings.maxScore,
      },
      debt: {
        value: debt.dti,
        label: "Debt-to-Income",
        score: debt.score,
        maxScore: debt.maxScore,
      },
      investment: {
        value: investment.allocation,
        label: "Investment Allocation",
        score: investment.score,
        maxScore: investment.maxScore,
      },
      goals: {
        value: goals.avgProgress,
        label: "Goal Progress",
        score: goals.score,
        maxScore: goals.maxScore,
        reason: goals.reason || null,
      },
      diversification: {
        value: diversification.typeCount,
        label: "Asset Types",
        score: diversification.score,
        maxScore: diversification.maxScore,
      },
    },
  };
}

/**
 * Returns a label for the health score.
 */
export function getHealthScoreLabel(score) {
  if (score >= 8) return "Excellent";
  if (score >= 5) return "Average";
  return "Poor";
}

/**
 * Net Worth Service
 * -----------------
 * Calculates and tracks user net worth over time.
 * Aggregates assets (investments, cash, real estate) and liabilities.
 *
 * Architecture: All business logic lives here.
 */

import { db } from "@/lib/prisma";

/**
 * Gets a user by Clerk auth.
 */
async function getAuthUser() {
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");
  return user;
}

/**
 * Calculates the user's current net worth.
 * Net worth = Total Assets - Total Liabilities
 */
export async function calculateNetWorth() {
  const user = await getAuthUser();

  const [assets, liabilities] = await Promise.all([
    db.asset.findMany({ where: { userId: user.id } }),
    db.liability.findMany({ where: { userId: user.id } }),
  ]);

  const [accounts] = await Promise.all([
    db.account.findMany({ where: { userId: user.id } }),
  ]);

  // Total asset value from Asset table
  const totalAssetValue = assets.reduce(
    (sum, asset) => sum + (asset.currentPrice || 0) * asset.quantity,
    0
  );

  // Account balances (some may be negative = debt)
  const totalAccountBalance = accounts.reduce(
    (sum, account) => sum + account.balance.toNumber(),
    0
  );

  // Total outstanding liabilities
  const totalLiabilities = liabilities.reduce(
    (sum, l) => sum + l.outstandingAmount,
    0
  );

  // Net worth = assets + account balances - liabilities
  const netWorth = totalAssetValue + totalAccountBalance - totalLiabilities;

  // Per-asset-type breakdown from Asset table
  const assetsBreakdown = assets.reduce((acc, asset) => {
    const value = (asset.currentPrice || 0) * asset.quantity;
    if (!acc[asset.type]) acc[asset.type] = 0;
    acc[asset.type] += value;
    return acc;
  }, {});

  return {
    netWorth,
    assets: {
      total: totalAssetValue,
      breakdown: assetsBreakdown,
    },
    liabilities: {
      total: totalLiabilities,
      accounts: liabilities.map((l) => ({
        id: l.id,
        name: l.name,
        type: l.type,
        amount: l.outstandingAmount,
      })),
    },
    lastCalculated: new Date(),
  };
}

/**
 * Gets asset breakdown by type with cost basis and gain/loss.
 */
export async function getAssetValuation() {
  const user = await getAuthUser();

  const assets = await db.asset.findMany({
    where: { userId: user.id },
  });

  const valuation = assets.reduce(
    (acc, asset) => {
      const value = (asset.currentPrice || 0) * asset.quantity;
      const costBasis = asset.buyPrice * asset.quantity;
      const gain = value - costBasis;

      acc.totalValue += value;
      acc.totalCostBasis += costBasis;
      acc.totalGain += gain;

      if (!acc.byType[asset.type]) {
        acc.byType[asset.type] = { value: 0, costBasis: 0, gain: 0, count: 0 };
      }
      acc.byType[asset.type].value += value;
      acc.byType[asset.type].costBasis += costBasis;
      acc.byType[asset.type].gain += gain;
      acc.byType[asset.type].count += 1;

      return acc;
    },
    { totalValue: 0, totalCostBasis: 0, totalGain: 0, byType: {} }
  );

  return valuation;
}

/**
 * Gets total liabilities outstanding amount.
 */
export async function getLiabilities() {
  const user = await getAuthUser();

  const liabilities = await db.liability.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      type: true,
      outstandingAmount: true,
      interestRate: true,
    },
  });

  const total = liabilities.reduce(
    (sum, l) => sum + l.outstandingAmount,
    0
  );

  return {
    total,
    liabilities: liabilities.map((l) => ({
      id: l.id,
      name: l.name,
      type: l.type,
      amount: l.outstandingAmount,
      interestRate: l.interestRate,
    })),
  };
}

/**
 * Gets net worth history from Snapshot table.
 * Falls back to computed history if no snapshots exist.
 */
export async function getNetWorthHistory(months = 6) {
  const user = await getAuthUser();

  // Try to get real snapshots first
  const snapshots = await db.snapshot.findMany({
    where: { userId: user.id },
    orderBy: { date: "asc" },
    take: months,
  });

  if (snapshots.length > 0) {
    return snapshots.map((s) => ({
      date: s.date,
      netWorth: s.netWorth,
      assets: s.assets,
      liabilities: s.liabilities,
    }));
  }

  // Fallback: approximate from transaction history
  const transactions = await db.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: "asc" },
  });

  const [assets, accounts] = await Promise.all([
    db.asset.findMany({ where: { userId: user.id } }),
    db.account.findMany({ where: { userId: user.id } }),
  ]);

  const currentAssetValue = assets.reduce(
    (sum, a) => sum + (a.currentPrice || 0) * a.quantity,
    0
  );
  const currentBalance = accounts.reduce(
    (sum, a) => sum + a.balance.toNumber(),
    0
  );

  const history = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const txUpToMonth = transactions.filter(
      (tx) => new Date(tx.date) <= monthEnd
    );

    const runningBalance = txUpToMonth.reduce((sum, tx) => {
      const amount = tx.amount.toNumber();
      return tx.type === "EXPENSE" ? sum - amount : sum + amount;
    }, currentBalance);

    history.push({
      date: monthStart.toISOString().split("T")[0],
      month: monthStart.toLocaleString("default", { month: "long" }),
      assetValue: currentAssetValue,
      accountBalance: runningBalance,
      netWorth: runningBalance + currentAssetValue,
    });
  }

  return history;
}

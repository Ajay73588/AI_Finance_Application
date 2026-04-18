/**
 * Snapshot Service
 * ----------------
 * Captures daily net worth snapshots for historical tracking.
 * Stores asset totals, liability totals, and net worth over time.
 *
 * Architecture: All business logic lives here.
 */

import { db } from "@/lib/prisma";

/**
 * Captures a snapshot of the user's current net worth.
 * Called daily via Inngest cron job.
 */
export async function takeSnapshot(userId) {
  // Fetch all assets, liabilities, and accounts for the user
  const [assets, liabilities, accounts] = await Promise.all([
    db.asset.findMany({ where: { userId } }),
    db.liability.findMany({ where: { userId } }),
    db.account.findMany({ where: { userId } }),
  ]);

  // Calculate total asset value from Asset table
  const totalAssets = assets.reduce(
    (sum, asset) => sum + (asset.currentPrice || 0) * asset.quantity,
    0
  );

  // Calculate total account balances (positive = cash, negative = debt)
  const totalAccountBalance = accounts.reduce(
    (sum, account) => sum + account.balance.toNumber(),
    0
  );

  // Calculate total liability outstanding amount
  const totalLiabilities = liabilities.reduce(
    (sum, liability) => sum + liability.outstandingAmount,
    0
  );

  // Calculate net worth = assets + account balances - liabilities
  const netWorth = totalAssets + totalAccountBalance - totalLiabilities;

  // Build per-asset-type breakdown
  const breakdown = {
    assets: {},
    accounts: totalAccountBalance,
    liabilities: totalLiabilities,
  };

  for (const asset of assets) {
    const value = (asset.currentPrice || 0) * asset.quantity;
    if (!breakdown.assets[asset.type]) {
      breakdown.assets[asset.type] = { value: 0, count: 0 };
    }
    breakdown.assets[asset.type].value += value;
    breakdown.assets[asset.type].count += 1;
  }

  // Store snapshot
  const snapshot = await db.snapshot.create({
    data: {
      userId,
      netWorth,
      assets: totalAssets,
      liabilities: totalLiabilities,
      breakdown,
    },
  });

  return snapshot;
}

/**
 * Gets snapshots for a user, ordered by date ascending.
 */
export async function getSnapshots(userId, limit = 30) {
  return db.snapshot.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: limit,
  });
}

/**
 * Gets the latest snapshot for a user.
 */
export async function getLatestSnapshot(userId) {
  return db.snapshot.findFirst({
    where: { userId },
    orderBy: { date: "desc" },
  });
}

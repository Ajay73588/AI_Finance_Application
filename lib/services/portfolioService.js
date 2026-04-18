/**
 * Portfolio Service
 * -----------------
 * Manages investment portfolio calculations and data.
 * Provides portfolio summaries, return calculations, allocation analysis,
 * risk scoring, and rebalancing recommendations.
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
 * Fetches all assets for the authenticated user.
 */
export async function getUserAssets() {
  const user = await getAuthUser();

  return db.asset.findMany({
    where: { userId: user.id },
    orderBy: [{ createdAt: "desc" }, { name: "asc" }],
  });
}

/**
 * Calculates the total portfolio value across all asset types.
 */
export async function getPortfolioSummary() {
  const user = await getAuthUser();

  const assets = await db.asset.findMany({
    where: { userId: user.id },
  });

  const summary = assets.reduce(
    (acc, asset) => {
      const value = asset.currentPrice * asset.quantity;
      const cost = asset.buyPrice * asset.quantity;
      const gain = value - cost;
      const gainPercent = cost > 0 ? (gain / cost) * 100 : 0;

      acc.totalValue += value;
      acc.totalCost += cost;
      acc.totalGain += gain;
      acc.assetCount += 1;

      if (!acc.byType[asset.type]) {
        acc.byType[asset.type] = { value: 0, cost: 0, gain: 0, count: 0 };
      }
      acc.byType[asset.type].value += value;
      acc.byType[asset.type].cost += cost;
      acc.byType[asset.type].gain += gain;
      acc.byType[asset.type].count += 1;

      return acc;
    },
    { totalValue: 0, totalCost: 0, totalGain: 0, totalGainPercent: 0, assetCount: 0, byType: {} }
  );

  summary.totalGainPercent =
    summary.totalCost > 0 ? (summary.totalGain / summary.totalCost) * 100 : 0;

  return summary;
}

/**
 * Calculates returns for each asset and the portfolio overall.
 */
export async function calculateReturns() {
  const user = await getAuthUser();

  const assets = await db.asset.findMany({
    where: { userId: user.id },
  });

  const returns = assets.map((asset) => {
    const currentValue = asset.currentPrice * asset.quantity;
    const costBasis = asset.buyPrice * asset.quantity;
    const gain = currentValue - costBasis;
    const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;

    return {
      id: asset.id,
      name: asset.name,
      symbol: asset.symbol,
      type: asset.type,
      quantity: asset.quantity,
      buyPrice: asset.buyPrice,
      currentPrice: asset.currentPrice,
      costBasis,
      currentValue,
      gain,
      gainPercent,
      status: gain >= 0 ? "profit" : "loss",
    };
  });

  const totalCurrentValue = returns.reduce((sum, r) => sum + r.currentValue, 0);
  const totalCostBasis = returns.reduce((sum, r) => sum + r.costBasis, 0);
  const totalGain = totalCurrentValue - totalCostBasis;
  const totalGainPercent =
    totalCostBasis > 0 ? (totalGain / totalCostBasis) * 100 : 0;

  return { assets: returns, totalCurrentValue, totalCostBasis, totalGain, totalGainPercent };
}

/**
 * Calculates portfolio allocation by asset type.
 */
export async function getPortfolioAllocation() {
  const user = await getAuthUser();

  const assets = await db.asset.findMany({
    where: { userId: user.id },
  });

  const totalValue = assets.reduce(
    (sum, asset) => sum + asset.currentPrice * asset.quantity,
    0
  );

  const byType = assets.reduce((acc, asset) => {
    const value = asset.currentPrice * asset.quantity;
    const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;

    if (!acc[asset.type]) {
      acc[asset.type] = { totalValue: 0, percentage: 0, assets: [] };
    }

    acc[asset.type].totalValue += value;
    acc[asset.type].percentage += percentage;
    acc[asset.type].assets.push({
      id: asset.id,
      name: asset.name,
      symbol: asset.symbol,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
    });

    return acc;
  }, {});

  return {
    totalValue,
    byType,
    assets: assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      value: asset.currentPrice * asset.quantity,
      percentage:
        totalValue > 0
          ? (asset.currentPrice * asset.quantity) / totalValue * 100
          : 0,
    })),
  };
}

/**
 * Computes portfolio risk score based on asset type distribution.
 * Risk weights: crypto=high(3), stock=medium-high(2), mutual_fund=medium(1.5), real_estate=low(1), cash=very-low(0)
 *
 * Returns: { riskScore: 0-10, level: "Low" | "Medium" | "High" }
 */
export async function getRiskScore() {
  const user = await getAuthUser();

  const assets = await db.asset.findMany({
    where: { userId: user.id },
  });

  if (assets.length === 0) {
    return { riskScore: 0, level: "Low", reason: "No assets" };
  }

  const totalValue = assets.reduce(
    (sum, a) => sum + a.currentPrice * a.quantity,
    0
  );

  if (totalValue === 0) {
    return { riskScore: 0, level: "Low", reason: "No asset value" };
  }

  // Risk weights per asset type
  const riskWeights = {
    crypto: 3,
    stock: 2,
    mutual_fund: 1.5,
    real_estate: 1,
    cash: 0,
    default: 1,
  };

  // Calculate weighted risk score
  let weightedRisk = 0;
  const breakdown = {};

  for (const asset of assets) {
    const value = asset.currentPrice * asset.quantity;
    const weight = riskWeights[asset.type] ?? riskWeights.default;
    const contribution = (value / totalValue) * weight;
    weightedRisk += contribution;

    if (!breakdown[asset.type]) breakdown[asset.type] = { weight, percentage: 0 };
    breakdown[asset.type].percentage += (value / totalValue) * 100;
  }

  // Normalize to 0-10
  // Max weighted risk would be 3.0 (100% in crypto)
  const riskScore = Math.round((weightedRisk / 3) * 10 * 10) / 10;

  let level;
  if (riskScore >= 7) level = "High";
  else if (riskScore >= 4) level = "Medium";
  else level = "Low";

  return { riskScore, level, breakdown };
}

/**
 * Generates a rebalancing plan by comparing current vs target allocation.
 * DRIFT_THRESHOLD = 5% — only suggests action if drift exceeds this.
 *
 * Returns array of { assetType, currentPct, targetPct, driftPct, action, suggestedAmount }
 */
export async function getRebalancePlan() {
  const user = await getAuthUser();

  const [assets, targets] = await Promise.all([
    db.asset.findMany({ where: { userId: user.id } }),
    db.allocationTarget.findMany({ where: { userId: user.id } }),
  ]);

  if (assets.length === 0) return [];

  const totalValue = assets.reduce(
    (sum, a) => sum + a.currentPrice * a.quantity,
    0
  );

  if (totalValue === 0) return [];

  // Build current allocation map
  const currentAllocation = {};
  for (const asset of assets) {
    const value = asset.currentPrice * asset.quantity;
    const pct = (value / totalValue) * 100;
    currentAllocation[asset.type] = (currentAllocation[asset.type] || 0) + pct;
  }

  // Build target map
  const targetMap = {};
  for (const t of targets) {
    targetMap[t.type] = t.percentage;
  }

  // Calculate drift and generate actions
  const DRIFT_THRESHOLD = 5; // percent
  const plan = [];

  // Collect all asset types
  const allTypes = new Set([
    ...Object.keys(currentAllocation),
    ...Object.keys(targetMap),
  ]);

  for (const assetType of allTypes) {
    const currentPct = currentAllocation[assetType] || 0;
    const targetPct = targetMap[assetType] || 0;
    const driftPct = currentPct - targetPct;

    // Skip if within threshold and no target set
    if (Math.abs(driftPct) < DRIFT_THRESHOLD) continue;
    if (targetPct === 0 && currentPct === 0) continue;

    const action = driftPct > 0 ? "REDUCE" : "INCREASE";
    const driftAmount = Math.abs(driftPct / 100) * totalValue;

    plan.push({
      assetType,
      currentPct: Math.round(currentPct * 10) / 10,
      targetPct: Math.round(targetPct * 10) / 10,
      driftPct: Math.round(driftPct * 10) / 10,
      action,
      suggestedAmount: Math.round(driftAmount * 100) / 100,
    });
  }

  return plan;
}

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const [assets, targets] = await Promise.all([
      db.asset.findMany({ where: { userId: user.id } }),
      db.allocationTarget.findMany({ where: { userId: user.id } }),
    ]);

    if (assets.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const totalValue = assets.reduce(
      (sum, a) => sum + (a.currentPrice || 0) * a.quantity,
      0
    );

    if (totalValue === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Build current allocation map
    const currentAllocation: Record<string, number> = {};
    for (const asset of assets) {
      const value = (asset.currentPrice || 0) * asset.quantity;
      const pct = (value / totalValue) * 100;
      currentAllocation[asset.type] = (currentAllocation[asset.type] || 0) + pct;
    }

    // Build target map
    const targetMap: Record<string, number> = {};
    for (const t of targets) {
      targetMap[t.type] = t.percentage;
    }

    // Calculate drift and generate actions
    const DRIFT_THRESHOLD = 5;
    const plan = [];

    const allTypes = new Set([
      ...Object.keys(currentAllocation),
      ...Object.keys(targetMap),
    ]);

    for (const assetType of allTypes) {
      const currentPct = currentAllocation[assetType] || 0;
      const targetPct = targetMap[assetType] || 0;
      const driftPct = currentPct - targetPct;

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

    return NextResponse.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error("[PORTFOLIO_REBALANCE_GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const assets = await db.asset.findMany({
      where: { userId: user.id },
    });

    // Calculate summary
    const summary = assets.reduce(
      (acc, asset) => {
        const currentPrice = asset.currentPrice || 0;
        const value = currentPrice * asset.quantity;
        const cost = asset.buyPrice * asset.quantity;
        const gain = value - cost;

        acc.totalValue += value;
        acc.totalCost += cost;
        acc.totalGain += gain;
        acc.assetCount += 1;

        return acc;
      },
      { totalValue: 0, totalCost: 0, totalGain: 0, assetCount: 0 }
    );

    summary.totalGainPercent =
      summary.totalCost > 0
        ? (summary.totalGain / summary.totalCost) * 100
        : 0;

    // Calculate allocation by type
    const allocation = assets.reduce((acc, asset) => {
      const currentPrice = asset.currentPrice || 0;
      const value = currentPrice * asset.quantity;
      const type = asset.type || "other";

      if (!acc[type]) {
        acc[type] = { totalValue: 0, percentage: 0, count: 0 };
      }
      acc[type].totalValue += value;
      acc[type].count += 1;

      return acc;
    }, {} as Record<string, { totalValue: number; percentage: number; count: number }>);

    // Calculate percentages
    if (summary.totalValue > 0) {
      for (const type in allocation) {
        allocation[type].percentage =
          (allocation[type].totalValue / summary.totalValue) * 100;
      }
    }

    // Calculate returns per asset
    const assetsWithReturns = assets.map((asset) => {
      const currentPrice = asset.currentPrice || 0;
      const currentValue = currentPrice * asset.quantity;
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
        currentPrice,
        costBasis,
        currentValue,
        gain,
        gainPercent,
        status: gain >= 0 ? "profit" : "loss",
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        ...summary,
        allocation,
        assets: assetsWithReturns,
      },
    });
  } catch (error) {
    console.error("[PORTFOLIO_GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

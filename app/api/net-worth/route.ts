import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "current";

    if (type === "history") {
      const months = parseInt(searchParams.get("months") || "6", 10);

      // Get snapshots
      const snapshots = await db.snapshot.findMany({
        where: { userId: user.id },
        orderBy: { date: "asc" },
        take: months,
      });

      if (snapshots.length > 0) {
        return NextResponse.json({
          success: true,
          data: snapshots.map((s) => ({
            date: s.date,
            netWorth: s.netWorth,
            assets: s.assets,
            liabilities: s.liabilities,
          })),
        });
      }

      // Fallback to computed history
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

      return NextResponse.json({
        success: true,
        data: history,
      });
    }

    // Default: current net worth
    const [assets, liabilities, accounts] = await Promise.all([
      db.asset.findMany({ where: { userId: user.id } }),
      db.liability.findMany({ where: { userId: user.id } }),
      db.account.findMany({ where: { userId: user.id } }),
    ]);

    const totalAssetValue = assets.reduce(
      (sum, asset) => sum + (asset.currentPrice || 0) * asset.quantity,
      0
    );

    const totalAccountBalance = accounts.reduce(
      (sum, account) => sum + account.balance.toNumber(),
      0
    );

    const totalLiabilities = liabilities.reduce(
      (sum, l) => sum + l.outstandingAmount,
      0
    );

    const netWorth = totalAssetValue + totalAccountBalance - totalLiabilities;

    const assetsBreakdown = assets.reduce((acc, asset) => {
      const value = (asset.currentPrice || 0) * asset.quantity;
      if (!acc[asset.type]) acc[asset.type] = 0;
      acc[asset.type] += value;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
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
      },
    });
  } catch (error) {
    console.error("[NET_WORTH_GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

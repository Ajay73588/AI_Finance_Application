import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { getCurrentPrice, getCurrentPrices, refreshUserPrices, getAssetsWithLivePrices } from "@/lib/services/priceEngineService";

/**
 * GET /api/prices
 * Query params:
 *   - symbol (optional): Get price for a single asset symbol (e.g., BTC)
 *   - refresh (optional): "true" to force refresh from API
 *   - refreshUser (optional): "true" to refresh all crypto assets for current user
 */
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
    const symbol = searchParams.get("symbol");
    const doRefreshUser = searchParams.get("refreshUser") === "true";

    // Refresh all user crypto assets
    if (doRefreshUser) {
      const result = await refreshUserPrices(user.id);
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // Get single symbol price
    if (symbol) {
      const price = await getCurrentPrice(symbol);
      if (!price) {
        return NextResponse.json(
          { success: false, error: "Price not available for symbol" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: { symbol: symbol.toUpperCase(), ...price },
      });
    }

    // Get all assets with live prices for user
    const assetsWithPrices = await getAssetsWithLivePrices(user.id);

    return NextResponse.json({
      success: true,
      data: assetsWithPrices,
    });
  } catch (error) {
    console.error("[PRICES_GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

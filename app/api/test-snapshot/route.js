/**
 * Test Snapshot Route
 * ------------------
 * Manual trigger for snapshot creation.
 * GET /api/test-snapshot?userId=xxx
 * If no userId provided, creates snapshot for authenticated user.
 *
 * Use this to test the snapshot system without waiting for cron.
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { takeSnapshot } from "@/lib/services/snapshotService";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get("userId");

    // If no userId provided, use authenticated user
    if (!userId) {
      const { userId: clerkUserId } = await auth();
      if (!clerkUserId) {
        return NextResponse.json(
          { error: "Unauthorized. Provide ?userId= or sign in." },
          { status: 401 }
        );
      }

      // Get internal user ID
      const { db } = await import("@/lib/prisma");
      const user = await db.user.findUnique({
        where: { clerkUserId },
        select: { id: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      userId = user.id;
    }

    console.log(`[TestSnapshot] Creating snapshot for userId: ${userId}`);

    const snapshot = await takeSnapshot(userId);

    console.log(`[TestSnapshot] Snapshot created:`, snapshot);

    return NextResponse.json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    console.error("[TestSnapshot] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

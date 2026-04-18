/**
 * Health Score Actions
 * -------------------
 * Thin server actions that delegate to healthScoreService.
 * Handles Clerk auth context, then calls service with internal userId.
 *
 * Architecture: Business logic lives in /lib/services/healthScoreService.js
 */
"use server";

import { auth } from "@clerk/nextjs/server";
import { computeHealthScore } from "@/lib/services/healthScoreService";

export async function computeHealthScoreAction() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await import("@/lib/prisma").then((m) =>
    m.db.user.findUnique({ where: { clerkUserId: userId }, select: { id: true } })
  );

  if (!user) throw new Error("User not found");

  return computeHealthScore(user.id);
}

/**
 * Allocation Service
 * ------------------
 * Manages user-defined target portfolio allocation percentages.
 * Used for rebalancing analysis and portfolio health.
 *
 * Architecture: All business logic lives here.
 */

import { db } from "@/lib/prisma";

/**
 * Creates or updates an allocation target for a specific asset type.
 * Uses upsert to handle both create and update.
 */
export async function createTarget(userId, data) {
  const { clerkUserId } = data;

  // Get internal user ID from clerk ID
  const user = await db.user.findUnique({
    where: { clerkUserId },
  });

  if (!user) throw new Error("User not found");

  const target = await db.allocationTarget.upsert({
    where: {
      userId_type: {
        userId: user.id,
        type: data.type,
      },
    },
    update: {
      percentage: data.percentage,
    },
    create: {
      userId: user.id,
      type: data.type,
      percentage: data.percentage,
    },
  });

  return target;
}

/**
 * Fetches all allocation targets for a user.
 */
export async function getTargets(clerkUserId) {
  const user = await db.user.findUnique({
    where: { clerkUserId },
  });

  if (!user) throw new Error("User not found");

  return db.allocationTarget.findMany({
    where: { userId: user.id },
    orderBy: { type: "asc" },
  });
}

/**
 * Updates an existing allocation target.
 */
export async function updateTarget(clerkUserId, id, data) {
  const user = await db.user.findUnique({
    where: { clerkUserId },
  });

  if (!user) throw new Error("User not found");

  const existing = await db.allocationTarget.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) throw new Error("Allocation target not found");

  return db.allocationTarget.update({
    where: { id },
    data: {
      percentage: data.percentage ?? existing.percentage,
    },
  });
}

/**
 * Deletes an allocation target.
 */
export async function deleteTarget(clerkUserId, id) {
  const user = await db.user.findUnique({
    where: { clerkUserId },
  });

  if (!user) throw new Error("User not found");

  const existing = await db.allocationTarget.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) throw new Error("Allocation target not found");

  await db.allocationTarget.delete({ where: { id } });

  return { success: true };
}

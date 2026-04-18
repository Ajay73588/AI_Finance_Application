/**
 * Liability Service
 * -----------------
 * Encapsulates all liability/debt-related business logic.
 * Handles CRUD for loans, credit cards, mortgages, etc.
 *
 * Architecture: All business logic lives here.
 * API routes/actions only call these functions.
 */
"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { AppError, NotFoundError } from "@/lib/errors";

/**
 * Gets a user from Clerk auth, or throws.
 */
async function getAuthUser() {
  const { userId } = await auth();
  if (!userId) throw new AppError("Unauthorized", 401);

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new AppError("User not found", 404);
  return user;
}

/**
 * Creates a new liability for the authenticated user.
 */
export async function createLiability(userId, data) {
  const authUser = await getAuthUser();

  const liability = await db.liability.create({
    data: {
      userId: authUser.id,
      name: data.name,
      type: data.type,
      principalAmount: data.principalAmount,
      outstandingAmount: data.outstandingAmount ?? data.principalAmount,
      interestRate: data.interestRate,
      monthlyEMI: data.monthlyEMI ?? null,
      dueDate: data.dueDate ?? null,
    },
  });

  return liability;
}

/**
 * Fetches all liabilities for the authenticated user.
 */
export async function getUserLiabilities(userId) {
  const authUser = await getAuthUser();

  const liabilities = await db.liability.findMany({
    where: {
      userId: authUser.id,
    },
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
  });

  return liabilities;
}

/**
 * Fetches a single liability by ID for the authenticated user.
 */
export async function getLiabilityById(userId, id) {
  const authUser = await getAuthUser();

  const liability = await db.liability.findFirst({
    where: {
      id,
      userId: authUser.id,
    },
  });

  if (!liability) throw new NotFoundError("Liability not found");

  return liability;
}

/**
 * Updates a liability's outstanding amount or other fields.
 */
export async function updateLiability(userId, id, data) {
  const authUser = await getAuthUser();

  const existing = await db.liability.findFirst({
    where: { id, userId: authUser.id },
  });

  if (!existing) throw new NotFoundError("Liability not found");

  const liability = await db.liability.update({
    where: { id },
    data: {
      name: data.name ?? existing.name,
      outstandingAmount:
        data.outstandingAmount ?? existing.outstandingAmount,
      interestRate: data.interestRate ?? existing.interestRate,
      monthlyEMI: data.monthlyEMI ?? existing.monthlyEMI,
      dueDate: data.dueDate ?? existing.dueDate,
    },
  });

  return liability;
}

/**
 * Deletes a liability for the authenticated user.
 */
export async function deleteLiability(userId, id) {
  const authUser = await getAuthUser();

  const existing = await db.liability.findFirst({
    where: { id, userId: authUser.id },
  });

  if (!existing) throw new NotFoundError("Liability not found");

  await db.liability.delete({
    where: { id },
  });

  return { success: true };
}

/**
 * Gets total liability amount for the user.
 */
export async function getTotalLiabilities(userId) {
  const authUser = await getAuthUser();

  const result = await db.liability.aggregate({
    where: { userId: authUser.id },
    _sum: {
      outstandingAmount: true,
    },
  });

  return {
    total: result._sum.outstandingAmount ?? 0,
  };
}

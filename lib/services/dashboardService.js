/**
 * Dashboard Service
 * -----------------
 * Encapsulates dashboard-related business logic.
 * Provides aggregated data for the user dashboard.
 *
 * Architecture: All business logic lives here.
 * API routes/actions only call these functions.
 */
"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";

/**
 * Gets a user from Clerk auth, or throws.
 */
async function getAuthUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");
  return user;
}

/**
 * Serializes Decimal fields for safe transport to client.
 */
function serializeTransaction(obj) {
  const serialized = { ...obj };
  if (obj.balance) {
    serialized.balance = obj.balance.toNumber();
  }
  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }
  return serialized;
}

/**
 * Fetches all accounts for the authenticated user.
 */
export async function getUserAccounts() {
  const user = await getAuthUser();

  const accounts = await db.account.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          transactions: true,
        },
      },
    },
  });

  return accounts.map(serializeTransaction);
}

/**
 * Creates a new account for the authenticated user.
 * First account automatically becomes default.
 * Includes rate limiting via ArcJet.
 */
export async function createAccount(data) {
  const user = await getAuthUser();

  // Rate limiting check
  const req = await request();
  const decision = await aj.protect(req, {
    userId: user.clerkUserId,
    requested: 1,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      const { remaining, reset } = decision.reason;
      throw new Error(
        `Too many requests. Please try again in ${reset} seconds.`
      );
    }
    throw new Error("Request blocked");
  }

  // Convert balance to float before saving
  const balanceFloat = parseFloat(data.balance);
  if (isNaN(balanceFloat)) {
    throw new Error("Invalid balance amount");
  }

  // Check if this is the user's first account
  const existingAccounts = await db.account.findMany({
    where: { userId: user.id },
  });

  // If it's the first account, make it default regardless of user input
  const shouldBeDefault =
    existingAccounts.length === 0 ? true : data.isDefault;

  // If this account should be default, unset other default accounts
  if (shouldBeDefault) {
    await db.account.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  // Create new account
  const account = await db.account.create({
    data: {
      ...data,
      balance: balanceFloat,
      userId: user.id,
      isDefault: shouldBeDefault,
    },
  });

  revalidatePath("/dashboard");
  return { success: true, data: serializeTransaction(account) };
}

/**
 * Fetches all transactions for the authenticated user for dashboard display.
 */
export async function getDashboardData() {
  const user = await getAuthUser();

  const transactions = await db.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  return transactions.map(serializeTransaction);
}

/**
 * Account Service
 * ---------------
 * Encapsulates all account-related business logic.
 * Handles account CRUD, default account management,
 * and transaction bulk operations.
 *
 * Architecture: All business logic lives here.
 * API routes/actions only call these functions.
 */
"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Serializes Decimal fields for safe transport to client.
 */
function serializeAccount(obj) {
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
 * Fetches an account with its transactions, for the authenticated user.
 */
export async function getAccountWithTransactions(accountId) {
  const user = await getAuthUser();

  const account = await db.account.findUnique({
    where: {
      id: accountId,
      userId: user.id,
    },
    include: {
      transactions: {
        orderBy: { date: "desc" },
      },
      _count: {
        select: { transactions: true },
      },
    },
  });

  if (!account) return null;

  return {
    ...serializeAccount(account),
    transactions: account.transactions.map(serializeAccount),
  };
}

/**
 * Deletes multiple transactions and recalculates affected account balances.
 */
export async function bulkDeleteTransactions(transactionIds) {
  const user = await getAuthUser();

  // Get transactions to calculate balance changes
  const transactions = await db.transaction.findMany({
    where: {
      id: { in: transactionIds },
      userId: user.id,
    },
  });

  // Group transactions by account to update balances
  const accountBalanceChanges = transactions.reduce((acc, transaction) => {
    const change =
      transaction.type === "EXPENSE"
        ? transaction.amount
        : -transaction.amount;
    acc[transaction.accountId] = (acc[transaction.accountId] || 0) + change;
    return acc;
  }, {});

  // Delete transactions and update account balances atomically
  await db.$transaction(async (tx) => {
    // Delete transactions
    await tx.transaction.deleteMany({
      where: {
        id: { in: transactionIds },
        userId: user.id,
      },
    });

    // Update account balances
    for (const [accountId, balanceChange] of Object.entries(
      accountBalanceChanges
    )) {
      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: balanceChange,
          },
        },
      });
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/account/[id]");

  return { success: true };
}

/**
 * Sets an account as the default account for the user.
 * Unsets any existing default account first.
 */
export async function updateDefaultAccount(accountId) {
  const user = await getAuthUser();

  // First, unset any existing default account
  await db.account.updateMany({
    where: {
      userId: user.id,
      isDefault: true,
    },
    data: { isDefault: false },
  });

  // Then set the new default account
  const account = await db.account.update({
    where: {
      id: accountId,
      userId: user.id,
    },
    data: { isDefault: true },
  });

  revalidatePath("/dashboard");
  return { success: true, data: serializeAccount(account) };
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

  return accounts.map(serializeAccount);
}

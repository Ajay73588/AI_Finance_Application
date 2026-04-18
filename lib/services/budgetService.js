/**
 * Budget Service
 * --------------
 * Encapsulates all budget-related business logic.
 * Supports per-category budgets with monthly expense tracking.
 *
 * Architecture: All business logic lives here.
 * API routes/actions only call these functions.
 */
"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { AppError, NotFoundError } from "@/lib/errors";
import { revalidatePath } from "next/cache";

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
 * Serializes Decimal fields for safe transport to client.
 */
function serializeBudget(budget) {
  return {
    ...budget,
    amount: budget.amount.toNumber(),
  };
}

/**
 * Gets the current budget for a specific category for the authenticated user
 * along with current month's expenses.
 */
export async function getCategoryBudget(accountId, category) {
  const user = await getAuthUser();

  const budget = await db.budget.findFirst({
    where: {
      userId: user.id,
      category,
    },
  });

  // Get current month's expenses for the specific category
  const currentDate = new Date();
  const startOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const endOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );

  const expenses = await db.transaction.aggregate({
    where: {
      userId: user.id,
      type: "EXPENSE",
      category,
      accountId,
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _sum: {
      amount: true,
    },
  });

  return {
    budget: budget ? serializeBudget(budget) : null,
    currentExpenses: expenses._sum.amount
      ? expenses._sum.amount.toNumber()
      : 0,
    category,
  };
}

/**
 * Gets all budgets for the authenticated user with usage.
 */
export async function getAllBudgets(accountId) {
  const user = await getAuthUser();

  const budgets = await db.budget.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      category: "asc",
    },
  });

  const currentDate = new Date();
  const startOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const endOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );

  // Get expenses per category for the current month
  const expenses = await db.transaction.groupBy({
    by: ["category"],
    where: {
      userId: user.id,
      type: "EXPENSE",
      accountId,
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _sum: {
      amount: true,
    },
  });

  const expenseByCategory = expenses.reduce((acc, curr) => {
    acc[curr.category] = curr._sum.amount?.toNumber() ?? 0;
    return acc;
  }, {});

  return budgets.map((budget) => ({
    ...serializeBudget(budget),
    currentExpenses: expenseByCategory[budget.category] ?? 0,
    percentUsed:
      budget.amount.toNumber() > 0
        ? ((expenseByCategory[budget.category] ?? 0) /
            budget.amount.toNumber()) *
          100
        : 0,
  }));
}

/**
 * Creates or updates a budget for a specific category.
 */
export async function upsertBudget(category, amount) {
  const user = await getAuthUser();

  const budget = await db.budget.upsert({
    where: {
      userId_category: {
        userId: user.id,
        category,
      },
    },
    update: {
      amount,
    },
    create: {
      userId: user.id,
      category,
      amount,
    },
  });

  revalidatePath("/dashboard");
  return {
    success: true,
    data: serializeBudget(budget),
  };
}

/**
 * Deletes a budget for the authenticated user.
 */
export async function deleteBudget(category) {
  const user = await getAuthUser();

  const existing = await db.budget.findFirst({
    where: {
      userId: user.id,
      category,
    },
  });

  if (!existing) throw new NotFoundError("Budget not found");

  await db.budget.delete({
    where: {
      userId_category: {
        userId: user.id,
        category,
      },
    },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Updates or creates a budget for the authenticated user.
 * (Backward-compatible alias for upsertBudget with first category)
 */
export async function updateBudget(amount) {
  const user = await getAuthUser();

  // For backward compatibility: use "General" as default category
  const category = "General";

  const budget = await db.budget.upsert({
    where: {
      userId_category: {
        userId: user.id,
        category,
      },
    },
    update: {
      amount,
    },
    create: {
      userId: user.id,
      category,
      amount,
    },
  });

  revalidatePath("/dashboard");
  return {
    success: true,
    data: { ...budget, amount: budget.amount.toNumber() },
  };
}

/**
 * Gets the current budget for the authenticated user along with
 * current month's expenses.
 * (Backward-compatible version using default "General" category)
 */
export async function getCurrentBudget(accountId) {
  return getCategoryBudget(accountId, "General");
}

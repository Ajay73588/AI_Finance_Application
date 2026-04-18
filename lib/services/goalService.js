/**
 * Goal Service
 * -------------
 * Encapsulates all financial goal-related business logic.
 * Handles CRUD for goals, progress tracking, and milestone calculations.
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
 * Creates a new financial goal for the authenticated user.
 */
export async function createGoal(userId, data) {
  const authUser = await getAuthUser();

  const goal = await db.goal.create({
    data: {
      userId: authUser.id,
      name: data.name,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount ?? 0,
      deadline: new Date(data.deadline),
      status: "ACTIVE",
    },
  });

  return goal;
}

/**
 * Fetches all goals for the authenticated user.
 */
export async function getUserGoals(userId) {
  const authUser = await getAuthUser();

  const goals = await db.goal.findMany({
    where: {
      userId: authUser.id,
    },
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
  });

  return goals;
}

/**
 * Fetches a single goal by ID for the authenticated user.
 */
export async function getGoalById(userId, id) {
  const authUser = await getAuthUser();

  const goal = await db.goal.findFirst({
    where: {
      id,
      userId: authUser.id,
    },
  });

  if (!goal) throw new NotFoundError("Goal not found");

  return goal;
}

/**
 * Updates a goal's progress by adding to currentAmount.
 */
export async function updateGoalProgress(userId, id, amountToAdd) {
  const authUser = await getAuthUser();

  const existing = await db.goal.findFirst({
    where: { id, userId: authUser.id },
  });

  if (!existing) throw new NotFoundError("Goal not found");

  const newCurrentAmount = existing.currentAmount + amountToAdd;
  const isCompleted = newCurrentAmount >= existing.targetAmount;

  const goal = await db.goal.update({
    where: { id },
    data: {
      currentAmount: newCurrentAmount,
      status: isCompleted ? "COMPLETED" : existing.status,
    },
  });

  return goal;
}

/**
 * Fully updates a goal (name, targetAmount, deadline, status).
 */
export async function updateGoal(userId, id, data) {
  const authUser = await getAuthUser();

  const existing = await db.goal.findFirst({
    where: { id, userId: authUser.id },
  });

  if (!existing) throw new NotFoundError("Goal not found");

  const goal = await db.goal.update({
    where: { id },
    data: {
      name: data.name ?? existing.name,
      targetAmount: data.targetAmount ?? existing.targetAmount,
      deadline: data.deadline ? new Date(data.deadline) : existing.deadline,
      status: data.status ?? existing.status,
      currentAmount: data.currentAmount ?? existing.currentAmount,
    },
  });

  return goal;
}

/**
 * Deletes a goal for the authenticated user.
 */
export async function deleteGoal(userId, id) {
  const authUser = await getAuthUser();

  const existing = await db.goal.findFirst({
    where: { id, userId: authUser.id },
  });

  if (!existing) throw new NotFoundError("Goal not found");

  await db.goal.delete({
    where: { id },
  });

  return { success: true };
}

/**
 * Gets progress percentage for a goal.
 */
export async function getGoalProgress(userId, id) {
  const goal = await getGoalById(userId, id);

  const progress = {
    id: goal.id,
    name: goal.name,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    progressPercent:
      goal.targetAmount > 0
        ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
        : 0,
    remaining: Math.max(goal.targetAmount - goal.currentAmount, 0),
    status: goal.status,
    deadline: goal.deadline,
    isCompleted: goal.currentAmount >= goal.targetAmount,
  };

  return progress;
}

/**
 * Gets all goals with progress for the authenticated user.
 */
export async function getUserGoalsWithProgress(userId) {
  const goals = await getUserGoals(userId);

  return goals.map((goal) => ({
    ...goal,
    progressPercent:
      goal.targetAmount > 0
        ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
        : 0,
    remaining: Math.max(goal.targetAmount - goal.currentAmount, 0),
    isCompleted: goal.currentAmount >= goal.targetAmount,
  }));
}

/**
 * Calculates monthly required contribution to meet a goal.
 */
export async function getMonthlyRequired(userId, id) {
  const goal = await getGoalById(userId, id);

  const now = new Date();
  const deadline = new Date(goal.deadline);
  const monthsRemaining = Math.max(
    (deadline.getFullYear() - now.getFullYear()) * 12 +
      (deadline.getMonth() - now.getMonth()),
    1
  );

  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const monthlyRequired = remaining / monthsRemaining;

  return {
    goalId: goal.id,
    monthlyRequired: Math.ceil(monthlyRequired * 100) / 100,
    monthsRemaining,
    remaining,
  };
}

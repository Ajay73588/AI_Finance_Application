/**
 * Goal Actions
 * --------------
 * Thin server actions that delegate to goalService.
 * Only handles: auth context, calling service, returning response.
 *
 * Architecture: Business logic lives in /lib/services/goalService.js
 */
"use server";

import {
  createGoal,
  getUserGoals,
  getGoalById,
  updateGoal,
  updateGoalProgress,
  deleteGoal,
  getUserGoalsWithProgress,
  getMonthlyRequired,
} from "@/lib/services/goalService";

export async function createGoalAction(data) {
  return createGoal(null, data);
}

export async function getUserGoalsAction() {
  return getUserGoals(null);
}

export async function getGoalByIdAction(id) {
  return getGoalById(null, id);
}

export async function updateGoalAction(id, data) {
  return updateGoal(null, id, data);
}

export async function updateGoalProgressAction(id, amountToAdd) {
  return updateGoalProgress(null, id, amountToAdd);
}

export async function deleteGoalAction(id) {
  return deleteGoal(null, id);
}

export async function getUserGoalsWithProgressAction() {
  return getUserGoalsWithProgress(null);
}

export async function getMonthlyRequiredAction(id) {
  return getMonthlyRequired(null, id);
}

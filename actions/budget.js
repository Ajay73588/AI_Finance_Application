/**
 * Budget Actions
 * --------------
 * Thin server actions that delegate to budgetService.
 * Only handles: auth context, calling service, returning response.
 *
 * Architecture: Business logic lives in /lib/services/budgetService.js
 */
"use server";

import { getCurrentBudget, updateBudget } from "@/lib/services/budgetService";

export async function getCurrentBudgetAction(accountId) {
  return getCurrentBudget(accountId);
}

export async function updateBudgetAction(amount) {
  return updateBudget(amount);
}

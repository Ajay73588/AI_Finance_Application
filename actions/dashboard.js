/**
 * Dashboard Actions
 * -----------------
 * Thin server actions that delegate to dashboardService.
 * Only handles: auth context, calling service, returning response.
 *
 * Architecture: Business logic lives in /lib/services/dashboardService.js
 */
"use server";

import { getUserAccounts, createAccount, getDashboardData } from "@/lib/services/dashboardService";

export async function getUserAccountsAction() {
  return getUserAccounts();
}

export async function createAccountAction(data) {
  return createAccount(data);
}

export async function getDashboardDataAction() {
  return getDashboardData();
}

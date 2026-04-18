/**
 * Account Actions
 * ---------------
 * Thin server actions that delegate to accountService.
 * Only handles: auth context, calling service, returning response.
 *
 * Architecture: Business logic lives in /lib/services/accountService.js
 */
"use server";

import { getAccountWithTransactions, bulkDeleteTransactions, updateDefaultAccount, getUserAccounts } from "@/lib/services/accountService";

export async function getAccountWithTransactionsAction(accountId) {
  return getAccountWithTransactions(accountId);
}

export async function bulkDeleteTransactionsAction(transactionIds) {
  return bulkDeleteTransactions(transactionIds);
}

export async function updateDefaultAccountAction(accountId) {
  return updateDefaultAccount(accountId);
}

export async function getUserAccountsAction() {
  return getUserAccounts();
}

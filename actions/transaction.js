/**
 * Transaction Actions
 * --------------------
 * Thin server actions that delegate to transactionService.
 * Only handles: auth context, calling service, returning response.
 *
 * Architecture: Business logic lives in /lib/services/transactionService.js
 */
"use server";

import { serializeTransaction, createTransaction, getTransaction, updateTransaction, getUserTransactions, scanReceipt, bulkDeleteTransactions } from "@/lib/services/transactionService";

// Re-export for backwards compatibility
export { serializeTransaction };

export async function createTransactionAction(data) {
  return createTransaction(data);
}

export async function getTransactionAction(id) {
  return getTransaction(id);
}

export async function updateTransactionAction(id, data) {
  return updateTransaction(id, data);
}

export async function getUserTransactionsAction(query) {
  return getUserTransactions(query);
}

export async function scanReceiptAction(file) {
  return scanReceipt(file);
}

export async function bulkDeleteTransactionsAction(transactionIds) {
  return bulkDeleteTransactions(transactionIds);
}

/**
 * Transaction Service
 * -------------------
 * Encapsulates all transaction-related business logic.
 * This service handles CRUD operations for transactions,
 * balance calculations, and receipt scanning via AI.
 *
 * Architecture: All business logic lives here.
 */

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Serializes Decimal fields for safe transport to client.
 */
export function serializeTransaction(obj) {
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
 * Calculates the next recurring date based on interval.
 */
export function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}

/**
 * Creates a new transaction and updates the account balance atomically.
 * Includes rate limiting via ArcJet.
 */
export async function createTransaction(data) {
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

  // Validate account ownership
  const account = await db.account.findUnique({
    where: {
      id: data.accountId,
      userId: user.id,
    },
  });

  if (!account) {
    throw new Error("Account not found");
  }

  // Calculate new balance
  const balanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
  const newBalance = account.balance.toNumber() + balanceChange;

  // Create transaction and update account balance atomically
  const transaction = await db.$transaction(async (tx) => {
    const newTransaction = await tx.transaction.create({
      data: {
        ...data,
        userId: user.id,
        nextRecurringDate:
          data.isRecurring && data.recurringInterval
            ? calculateNextRecurringDate(data.date, data.recurringInterval)
            : null,
      },
    });

    await tx.account.update({
      where: { id: data.accountId },
      data: { balance: newBalance },
    });

    return newTransaction;
  });

  revalidatePath("/dashboard");
  revalidatePath(`/account/${transaction.accountId}`);

  return { success: true, data: serializeTransaction(transaction) };
}

/**
 * Fetches a single transaction by ID for the authenticated user.
 */
export async function getTransaction(id) {
  const user = await getAuthUser();

  const transaction = await db.transaction.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!transaction) throw new Error("Transaction not found");

  return serializeTransaction(transaction);
}

/**
 * Updates a transaction and adjusts account balance accordingly.
 * Handles the balance delta between old and new transaction values.
 */
export async function updateTransaction(id, data) {
  const user = await getAuthUser();

  // Get original transaction to calculate balance change
  const originalTransaction = await db.transaction.findUnique({
    where: {
      id,
      userId: user.id,
    },
    include: {
      account: true,
    },
  });

  if (!originalTransaction) throw new Error("Transaction not found");

  // Calculate balance changes
  const oldBalanceChange =
    originalTransaction.type === "EXPENSE"
      ? -originalTransaction.amount.toNumber()
      : originalTransaction.amount.toNumber();

  const newBalanceChange =
    data.type === "EXPENSE" ? -data.amount : data.amount;

  const netBalanceChange = newBalanceChange - oldBalanceChange;

  // Update transaction and account balance atomically
  const transaction = await db.$transaction(async (tx) => {
    const updated = await tx.transaction.update({
      where: {
        id,
        userId: user.id,
      },
      data: {
        ...data,
        nextRecurringDate:
          data.isRecurring && data.recurringInterval
            ? calculateNextRecurringDate(data.date, data.recurringInterval)
            : null,
      },
    });

    // Update account balance
    await tx.account.update({
      where: { id: data.accountId },
      data: {
        balance: {
          increment: netBalanceChange,
        },
      },
    });

    return updated;
  });

  revalidatePath("/dashboard");
  revalidatePath(`/account/${data.accountId}`);

  return { success: true, data: serializeTransaction(transaction) };
}

/**
 * Fetches all transactions for the authenticated user.
 * Supports optional query filters.
 */
export async function getUserTransactions(query = {}) {
  const user = await getAuthUser();

  const transactions = await db.transaction.findMany({
    where: {
      userId: user.id,
      ...query,
    },
    include: {
      account: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  return { success: true, data: transactions };
}

/**
 * Scans a receipt image using Gemini AI to extract transaction data.
 * Returns structured data: amount, date, description, merchant, category.
 */
export async function scanReceipt(file) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Convert File to ArrayBuffer, then to Base64
  const arrayBuffer = await file.arrayBuffer();
  const base64String = Buffer.from(arrayBuffer).toString("base64");

  const prompt = `
    Analyze this receipt image and extract the following information in JSON format:
    - Total amount (just the number)
    - Date (in ISO format)
    - Description or items purchased (brief summary)
    - Merchant/store name
    - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )

    Only respond with valid JSON in this exact format:
    {
      "amount": number,
      "date": "ISO date string",
      "description": "string",
      "merchantName": "string",
      "category": "string"
    }

    If its not a receipt, return an empty object
  `;

  const result = await model.generateContent([
    {
      inlineData: {
        data: base64String,
        mimeType: file.type,
      },
    },
    prompt,
  ]);

  const response = await result.response;
  const text = response.text();
  const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

  try {
    const data = JSON.parse(cleanedText);
    return {
      amount: parseFloat(data.amount),
      date: new Date(data.date),
      description: data.description,
      category: data.category,
      merchantName: data.merchantName,
    };
  } catch (parseError) {
    console.error("Error parsing JSON response:", parseError);
    throw new Error("Invalid response format from Gemini");
  }
}

/**
 * Deletes multiple transactions and updates account balances atomically.
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

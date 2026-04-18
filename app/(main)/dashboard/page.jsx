import { getUserAccountsAction } from "@/actions/dashboard";
import { getDashboardDataAction } from "@/actions/dashboard";
import { getCurrentBudgetAction } from "@/actions/budget";
import { DashboardClient } from "./_components/dashboard-client";

export default async function DashboardPage() {
  const accounts = await getUserAccountsAction();
  const transactions = await getDashboardDataAction();

  const defaultAccount = accounts?.find((account) => account.isDefault);

  let budgetData = null;
  if (defaultAccount) {
    budgetData = await getCurrentBudgetAction(defaultAccount.id);
  }

  return (
    <DashboardClient
      initialAccounts={accounts}
      initialTransactions={transactions}
      budgetData={budgetData}
    />
  );
}

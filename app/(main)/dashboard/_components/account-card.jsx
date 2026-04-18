"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import useFetch from "@/hooks/use-fetch";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateDefaultAccountAction } from "@/actions/account";
import { toast } from "sonner";

export function AccountCard({ account }) {
  const { name, type, balance, id, isDefault } = account;
  const [stats, setStats] = useState({ income: 0, expense: 0 });

  const {
    loading: updateDefaultLoading,
    fn: updateDefaultFn,
    data: updatedAccount,
    error,
  } = useFetch(updateDefaultAccountAction);

  useEffect(() => {
    // Calculate stats from account transactions (passed via account prop or computed)
    if (account.totalIncome !== undefined && account.totalExpense !== undefined) {
      setStats({
        income: account.totalIncome,
        expense: account.totalExpense,
      });
    }
  }, [account]);

  const handleDefaultChange = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (isDefault) {
      toast.warning("You need at least 1 default account");
      return;
    }

    await updateDefaultFn(id);
  };

  useEffect(() => {
    if (updatedAccount?.success) {
      toast.success("Default account updated successfully");
    }
  }, [updatedAccount]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update default account");
    }
  }, [error]);

  return (
    <Card className="hover:shadow-lg transition-all duration-200 group relative overflow-hidden">
      <div
        className={`absolute top-0 left-0 h-1 w-full ${
          isDefault ? "bg-blue-500" : "bg-slate-200"
        }`}
      />

      <Link href={`/account/${id}`} className="block">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium capitalize truncate">
              {name}
            </CardTitle>
            {isDefault && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                DEFAULT
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={isDefault}
              onClick={handleDefaultChange}
              disabled={updateDefaultLoading}
              onChange={() => {}}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/account/${id}`}>View Details</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          <div className="text-2xl font-bold">
            ${parseFloat(balance).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {type.charAt(0) + type.slice(1).toLowerCase()} Account
          </p>
        </CardContent>

        <CardFooter className="pt-0 flex justify-between text-xs border-t pt-3">
          <div className="flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3 text-green-500" />
            <span className="text-green-600 font-medium">
              ${Number(stats.income || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-muted-foreground">income</span>
          </div>
          <div className="flex items-center gap-1">
            <ArrowDownRight className="h-3 w-3 text-red-500" />
            <span className="text-red-600 font-medium">
              ${Number(stats.expense || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-muted-foreground">expense</span>
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}

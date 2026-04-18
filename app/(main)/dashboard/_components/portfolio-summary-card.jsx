"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PortfolioSummaryCard({ className }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPortfolio() {
      try {
        const response = await fetch("/api/portfolio");
        if (!response.ok) throw new Error("Failed to fetch");
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPortfolio();
  }, []);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Investments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-4 w-24 mt-2" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Investments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$0.00</div>
          <p className="text-xs text-muted-foreground">No investments</p>
        </CardContent>
      </Card>
    );
  }

  const totalValue = data.totalValue || 0;
  const totalGain = data.totalGain || 0;
  const gainPercent = data.totalGainPercent || 0;
  const isProfit = totalGain >= 0;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Investment Portfolio
        </CardTitle>
        <Briefcase className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          ${totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={`flex items-center gap-1 mt-1 ${isProfit ? "text-green-600" : "text-red-600"}`}>
          {isProfit ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span className="text-xs font-medium">
            {isProfit ? "+" : ""}${totalGain.toFixed(2)} ({gainPercent.toFixed(2)}%)
          </span>
          <span className="text-xs text-muted-foreground">all time</span>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEEAD",
  "#D4A5A5",
  "#9FA8DA",
];

const TYPE_LABELS = {
  stock: "Stocks",
  crypto: "Cryptocurrency",
  mutual_fund: "Mutual Funds",
  real_estate: "Real Estate",
  cash: "Cash",
  other: "Other",
};

export function AllocationChart({ data, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.allocation || Object.keys(data.allocation).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <p className="text-sm text-muted-foreground">No assets to display</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = Object.entries(data.allocation).map(([type, info]) => ({
    name: TYPE_LABELS[type] || type,
    value: info.totalValue,
    percentage: info.percentage,
    count: info.count,
  }));

  const totalValue = data.totalValue || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Asset Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) =>
                  `$${value.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                }
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {chartData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {item.percentage.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  ${item.value.toLocaleString("en-IN", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function HoldingsTable({ assets, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!assets || assets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Holdings</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-sm text-muted-foreground">No holdings yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Holdings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                  Asset
                </th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                  Quantity
                </th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                  Avg. Price
                </th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                  Current
                </th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                  Value
                </th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                  P/L
                </th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => {
                const isProfit = asset.gain >= 0;
                return (
                  <tr key={asset.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {asset.symbol || asset.type}
                        </p>
                      </div>
                    </td>
                    <td className="text-right py-3 px-2">
                      {asset.quantity.toLocaleString("en-IN")}
                    </td>
                    <td className="text-right py-3 px-2">
                      ${asset.buyPrice.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="text-right py-3 px-2">
                      ${(asset.currentPrice || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="text-right py-3 px-2 font-medium">
                      ${asset.currentValue.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="text-right py-3 px-2">
                      <div
                        className={`flex items-center justify-end gap-1 ${
                          isProfit ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isProfit ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span className="font-medium">
                          {isProfit ? "+" : ""}$
                          {asset.gain.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="text-xs">
                          ({asset.gainPercent.toFixed(2)}%)
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function PortfolioSummary({ data, loading }) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const isProfit = data.totalGain >= 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            ${(data.totalValue || 0).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.assetCount || 0} assets
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Invested
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            ${(data.totalCost || 0).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Cost basis</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Gain/Loss
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex items-center gap-2 ${isProfit ? "text-green-600" : "text-red-600"}`}>
            {isProfit ? (
              <TrendingUp className="h-5 w-5" />
            ) : (
              <TrendingDown className="h-5 w-5" />
            )}
            <p className="text-2xl font-bold">
              {isProfit ? "+" : ""}$
              {(data.totalGain || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isProfit ? "+" : ""}
            {(data.totalGainPercent || 0).toFixed(2)}% overall return
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function RebalanceCard({ plan, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rebalancing Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!plan || plan.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rebalancing Suggestions</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[100px]">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground">
              Your portfolio is well balanced
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rebalancing Suggestions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {plan.map((item) => (
          <div key={item.assetType} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {TYPE_LABELS[item.assetType] || item.assetType}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  item.action === "REDUCE"
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {item.action}
              </span>
            </div>
            <Progress
              value={item.currentPct}
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Current: {item.currentPct}%</span>
              <span>Target: {item.targetPct}%</span>
              <span>
                {item.action === "REDUCE" ? "-" : "+"}$
                {item.suggestedAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

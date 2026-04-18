"use client";

import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatQuantity(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
}

function formatType(type) {
  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AssetsTable({
  assets,
  isLoading,
  deletingId,
  onDelete,
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Your Assets</CardTitle>
        <p className="text-sm text-muted-foreground">
          Review your holdings, prices, and temporary profit or loss at a glance.
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Buy Price</TableHead>
                <TableHead className="text-right">Current Price</TableHead>
                <TableHead className="text-right">Profit/Loss</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center">
                    <div className="inline-flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading assets...
                    </div>
                  </TableCell>
                </TableRow>
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                    No assets yet. Add your first holding to start tracking.
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => {
                  const currentPrice = Number(
                    asset.currentPrice ?? asset.buyPrice
                  );
                  const profitLoss =
                    (currentPrice - Number(asset.buyPrice)) *
                    Number(asset.quantity);

                  return (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {asset.name}
                        </div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          {asset.symbol || "No symbol"}
                        </div>
                      </TableCell>
                      <TableCell>{formatType(asset.type)}</TableCell>
                      <TableCell className="text-right">
                        {formatQuantity(asset.quantity)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(asset.buyPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(currentPrice)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          profitLoss > 0
                            ? "text-emerald-600"
                            : profitLoss < 0
                              ? "text-rose-600"
                              : "text-slate-600"
                        }`}
                      >
                        {formatCurrency(profitLoss)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:text-rose-700"
                          onClick={() => onDelete(asset.id)}
                          disabled={deletingId === asset.id}
                        >
                          {deletingId === asset.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

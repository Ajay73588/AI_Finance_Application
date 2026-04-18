"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const assetTypes = [
  { label: "Crypto", value: "crypto" },
  { label: "Stock", value: "stock" },
  { label: "Mutual Fund", value: "mutual_fund" },
  { label: "Real Estate", value: "real_estate" },
  { label: "Cash", value: "cash" },
];

export function AssetForm({
  formData,
  isSubmitting,
  onChange,
  onTypeChange,
  onSubmit,
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Add Asset</CardTitle>
        <p className="text-sm text-muted-foreground">
          Track a new asset and keep your portfolio organized in one place.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={formData.type} onValueChange={onTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select asset type" />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="asset-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="asset-name"
                name="name"
                placeholder="Bitcoin, Apple Inc, Rental Property, Cash Reserve"
                value={formData.name}
                onChange={onChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="asset-symbol" className="text-sm font-medium">
                Symbol
              </label>
              <Input
                id="asset-symbol"
                name="symbol"
                placeholder="BTC, AAPL, CASH, Optional"
                value={formData.symbol}
                onChange={onChange}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="asset-quantity" className="text-sm font-medium">
                Quantity / Units
              </label>
              <Input
                id="asset-quantity"
                name="quantity"
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={formData.quantity}
                onChange={onChange}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="asset-buy-price" className="text-sm font-medium">
                Buy Price
              </label>
              <Input
                id="asset-buy-price"
                name="buyPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.buyPrice}
                onChange={onChange}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Add Asset"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

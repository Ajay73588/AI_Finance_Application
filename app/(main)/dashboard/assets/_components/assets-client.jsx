"use client";

import { useEffect, useState, useMemo } from "react";
import { Landmark, TrendingUp, TrendingDown, Edit, Trash2, ArrowUpDown, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { AssetForm } from "./asset-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialFormState = {
  type: "crypto",
  name: "",
  symbol: "",
  quantity: "",
  buyPrice: "",
};

async function parseResponse(response) {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || "Request failed");
  }
  return payload;
}

export function AssetsClient() {
  const [formData, setFormData] = useState(initialFormState);
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingAsset, setEditingAsset] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [filter, setFilter] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAssets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/assets", {
        method: "GET",
        cache: "no-store",
      });
      const payload = await parseResponse(response);
      setAssets(payload.data || []);
    } catch (error) {
      toast.error(error.message || "Failed to load assets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // Computed stats
  const stats = useMemo(() => {
    const totalValue = assets.reduce(
      (sum, a) => sum + (a.currentPrice || 0) * a.quantity,
      0
    );
    const totalCost = assets.reduce(
      (sum, a) => sum + a.buyPrice * a.quantity,
      0
    );
    const totalGain = totalValue - totalCost;
    const gainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    return { totalValue, totalCost, totalGain, gainPercent };
  }, [assets]);

  // Filtered and sorted assets
  const filteredAssets = useMemo(() => {
    let result = [...assets];

    // Filter
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(lowerFilter) ||
          (a.symbol || "").toLowerCase().includes(lowerFilter) ||
          a.type.toLowerCase().includes(lowerFilter)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "type":
          aVal = a.type;
          bVal = b.type;
          break;
        case "value":
          aVal = (a.currentPrice || 0) * a.quantity;
          bVal = (b.currentPrice || 0) * b.quantity;
          break;
        case "gain":
          aVal =
            ((a.currentPrice || 0) - a.buyPrice) * a.quantity;
          bVal =
            ((b.currentPrice || 0) - b.buyPrice) * b.quantity;
          break;
        default:
          aVal = a[sortField];
          bVal = b[sortField];
      }

      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [assets, filter, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleTypeChange = (value) => {
    setFormData((current) => ({
      ...current,
      type: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/assets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: formData.type,
          name: formData.name,
          symbol: formData.symbol,
          quantity: Number(formData.quantity),
          buyPrice: Number(formData.buyPrice),
        }),
      });

      await parseResponse(response);
      toast.success("Asset added successfully");
      setFormData(initialFormState);
      await fetchAssets();
    } catch (error) {
      toast.error(error.message || "Failed to add asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editingAsset) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/assets/${editingAsset.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: formData.type,
          name: formData.name,
          symbol: formData.symbol || null,
          quantity: Number(formData.quantity),
          buyPrice: Number(formData.buyPrice),
          currentPrice: Number(formData.currentPrice) || Number(formData.buyPrice),
        }),
      });

      await parseResponse(response);
      toast.success("Asset updated successfully");
      handleCloseEdit();
      await fetchAssets();
    } catch (error) {
      toast.error(error.message || "Failed to update asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setFormData({
      type: asset.type,
      name: asset.name,
      symbol: asset.symbol || "",
      quantity: asset.quantity.toString(),
      buyPrice: asset.buyPrice.toString(),
      currentPrice: (asset.currentPrice || 0).toString(),
    });
    setEditDialogOpen(true);
  };

  const handleCloseEdit = () => {
    setEditDialogOpen(false);
    setEditingAsset(null);
    setFormData(initialFormState);
  };

  const handleUpdatePrice = async (assetId, newPrice) => {
    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPrice: newPrice }),
      });
      await parseResponse(response);
      toast.success("Price updated successfully");
      await fetchAssets();
    } catch (error) {
      toast.error(error.message || "Failed to update price");
    }
  };

  const handleDelete = async (assetId) => {
    setDeletingId(assetId);

    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: "DELETE",
      });

      await parseResponse(response);
      setAssets((current) =>
        current.filter((asset) => asset.id !== assetId)
      );
      toast.success("Asset deleted successfully");
    } catch (error) {
      toast.error(error.message || "Failed to delete asset");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefreshPrices = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch("/api/prices?refreshUser=true", {
        method: "GET",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Refresh failed");
      }
      toast.success(`Updated ${payload.data?.updated || 0} asset prices`);
      await fetchAssets();
    } catch (error) {
      toast.error(error.message || "Failed to refresh prices");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Value</div>
            <div className="text-2xl font-bold mt-1">
              ${stats.totalValue.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Invested</div>
            <div className="text-2xl font-bold mt-1">
              ${stats.totalCost.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Gain/Loss</div>
            <div
              className={`text-2xl font-bold mt-1 flex items-center gap-1 ${
                stats.totalGain >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {stats.totalGain >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              ${Math.abs(stats.totalGain).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Return</div>
            <div
              className={`text-2xl font-bold mt-1 ${
                stats.gainPercent >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {stats.gainPercent >= 0 ? "+" : ""}
              {stats.gainPercent.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50 px-6 py-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
              <Landmark className="h-3.5 w-3.5" />
              Portfolio Hub
            </div>
            <div className="flex items-center gap-3">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                  Assets
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                  Add positions, review pricing, and manage your holdings from a
                  clean dashboard view built for quick updates.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshPrices}
                disabled={isRefreshing}
                className="mt-2 ml-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Refreshing..." : "Refresh Prices"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[380px_minmax(0,1fr)]">
        <AssetForm
          formData={formData}
          isSubmitting={isSubmitting}
          onChange={handleInputChange}
          onTypeChange={handleTypeChange}
          onSubmit={handleSubmit}
        />

        {/* Filter and Sort */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <AssetsTableWithEdit
            assets={filteredAssets}
            isLoading={isLoading}
            deletingId={deletingId}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
          />
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>
              Update your asset details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={formData.type} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
                    <SelectItem value="real_estate">Real Estate</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  name="name"
                  placeholder="Bitcoin, Apple Inc, Rental Property"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Symbol</label>
                <Input
                  name="symbol"
                  placeholder="BTC, AAPL, Optional"
                  value={formData.symbol}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity / Units</label>
                <Input
                  name="quantity"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Buy Price</label>
                <Input
                  name="buyPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.buyPrice}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Price</label>
                <Input
                  name="currentPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.currentPrice}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseEdit}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AssetsTableWithEdit({
  assets,
  isLoading,
  deletingId,
  onDelete,
  onEdit,
  onSort,
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-0">
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th
                  className="text-left py-3 px-4 font-medium text-muted-foreground cursor-pointer hover:bg-slate-100"
                  onClick={() => onSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Name
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  className="text-left py-3 px-4 font-medium text-muted-foreground cursor-pointer hover:bg-slate-100"
                  onClick={() => onSort("type")}
                >
                  <div className="flex items-center gap-1">
                    Type
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  className="text-right py-3 px-4 font-medium text-muted-foreground cursor-pointer hover:bg-slate-100"
                  onClick={() => onSort("quantity")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Quantity
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                  Buy Price
                </th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                  Current Price
                </th>
                <th
                  className="text-right py-3 px-4 font-medium text-muted-foreground cursor-pointer hover:bg-slate-100"
                  onClick={() => onSort("value")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Value
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  className="text-right py-3 px-4 font-medium text-muted-foreground cursor-pointer hover:bg-slate-100"
                  onClick={() => onSort("gain")}
                >
                  <div className="flex items-center justify-end gap-1">
                    P/L
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="h-28 text-center">
                    Loading assets...
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="h-28 text-center text-muted-foreground"
                  >
                    No assets yet. Add your first holding to start tracking.
                  </td>
                </tr>
              ) : (
                assets.map((asset) => {
                  const currentPrice = Number(
                    asset.currentPrice ?? asset.buyPrice
                  );
                  const value = currentPrice * Number(asset.quantity);
                  const cost = Number(asset.buyPrice) * Number(asset.quantity);
                  const gain = value - cost;
                  const gainPercent = cost > 0 ? (gain / cost) * 100 : 0;
                  const isProfit = gain >= 0;

                  return (
                    <tr
                      key={asset.id}
                      className="border-b hover:bg-slate-50"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium">{asset.name}</div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          {asset.symbol || "—"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                          {asset.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4">
                        {Number(asset.quantity).toLocaleString("en-IN", {
                          maximumFractionDigits: 6,
                        })}
                      </td>
                      <td className="text-right py-3 px-4">
                        ${Number(asset.buyPrice).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="text-right py-3 px-4">
                        ${currentPrice.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="text-right py-3 px-4 font-medium">
                        ${value.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="text-right py-3 px-4">
                        <div
                          className={`flex flex-col items-end ${
                            isProfit ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          <span className="font-medium">
                            {isProfit ? "+" : ""}${gain.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          <span className="text-xs">
                            {isProfit ? "+" : ""}
                            {gainPercent.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(asset)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => onDelete(asset.id)}
                            disabled={deletingId === asset.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

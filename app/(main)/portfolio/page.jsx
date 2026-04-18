"use client";

import { useState, useEffect } from "react";
import { BarLoader } from "react-spinners";
import { AllocationChart, HoldingsTable, PortfolioSummary, RebalanceCard } from "./_components/allocation-chart";

export default function PortfolioPage() {
  const [data, setData] = useState(null);
  const [rebalancePlan, setRebalancePlan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPortfolio() {
      try {
        const [portfolioRes, rebalanceRes] = await Promise.all([
          fetch("/api/portfolio"),
          fetch("/api/portfolio/rebalance"),
        ]);

        if (!portfolioRes.ok) throw new Error("Failed to fetch portfolio");

        const portfolioData = await portfolioRes.json();
        setData(portfolioData.data);

        if (rebalanceRes.ok) {
          const rebalanceData = await rebalanceRes.json();
          setRebalancePlan(rebalanceData.data || []);
        }
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
      <div className="flex justify-center items-center py-20">
        <BarLoader width={"100%"} color="#9333ea" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Investment Portfolio</h1>
        <p className="text-muted-foreground">
          Track your investments, returns, and rebalancing suggestions
        </p>
      </div>

      {/* Summary Cards */}
      <PortfolioSummary data={data} loading={loading} />

      {/* Charts and Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AllocationChart data={data} loading={loading} />
        <RebalanceCard plan={rebalancePlan} loading={loading} />
      </div>

      {/* Holdings Table */}
      <HoldingsTable assets={data?.assets || []} loading={loading} />
    </div>
  );
}

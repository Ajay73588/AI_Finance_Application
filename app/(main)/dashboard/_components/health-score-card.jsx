"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

function ScoreRing({ score, max = 10, size = 80 }) {
  const percent = (score / max) * 100;
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  const color =
    score >= 8 ? "#22c55e" : score >= 5 ? "#eab308" : "#ef4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="6"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold" style={{ color }}>
          {score.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

function DimensionBar({ label, score, max, value, color }) {
  const percent = max > 0 ? (score / max) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {value !== undefined ? `${value.toFixed(1)}%` : `${score}/${max}`}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

export function HealthScoreCard({ compact = false, className }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const response = await fetch("/api/health-score");
        if (!response.ok) throw new Error("Failed to fetch");
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchHealth();
  }, []);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Financial Health</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Skeleton className="h-20 w-20 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Financial Health</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Unable to calculate
          </p>
        </CardContent>
      </Card>
    );
  }

  const { score, breakdown } = data;

  const getScoreColor = (s) =>
    s >= 8 ? "#22c55e" : s >= 5 ? "#eab308" : "#ef4444";

  const getLabel = (s) => {
    if (s >= 8) return { text: "Excellent", color: "text-green-600", bg: "bg-green-100" };
    if (s >= 5) return { text: "Average", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { text: "Needs Attention", color: "text-red-600", bg: "bg-red-100" };
  };

  const labelInfo = getLabel(score);
  const scoreColor = getScoreColor(score);

  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Health Score
          </CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <ScoreRing score={score} size={60} />
          <div>
            <p className={`text-sm font-semibold ${labelInfo.color}`}>
              {labelInfo.text}
            </p>
            <p className="text-xs text-muted-foreground">
              {Object.keys(breakdown).length} factors
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Financial Health Score</CardTitle>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded ${labelInfo.bg} ${labelInfo.color}`}
        >
          {labelInfo.text}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <ScoreRing score={score} size={80} />
          <div className="flex-1 space-y-1">
            <p className="text-xs text-muted-foreground">
              Based on 5 financial dimensions
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {breakdown.savings && (
                <DimensionBar
                  label="Savings"
                  score={breakdown.savings.score}
                  max={breakdown.savings.maxScore}
                  value={breakdown.savings.value}
                  color={getScoreColor(breakdown.savings.score * 5)}
                />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {breakdown.savings && (
            <DimensionBar
              label="Savings Rate"
              score={breakdown.savings.score}
              max={breakdown.savings.maxScore}
              value={breakdown.savings.value}
              color={getScoreColor(breakdown.savings.score * 5)}
            />
          )}
          {breakdown.debt && (
            <DimensionBar
              label="Debt-to-Income"
              score={breakdown.debt.score}
              max={breakdown.debt.maxScore}
              value={breakdown.debt.value}
              color={getScoreColor(breakdown.debt.score * 5)}
            />
          )}
          {breakdown.investment && (
            <DimensionBar
              label="Investment %"
              score={breakdown.investment.score}
              max={breakdown.investment.maxScore}
              value={breakdown.investment.value}
              color={getScoreColor(breakdown.investment.score * 5)}
            />
          )}
          {breakdown.goals && (
            <DimensionBar
              label="Goal Progress"
              score={breakdown.goals.score}
              max={breakdown.goals.maxScore}
              value={breakdown.goals.value}
              color={getScoreColor(breakdown.goals.score * 5)}
            />
          )}
          {breakdown.diversification && (
            <DimensionBar
              label="Diversification"
              score={breakdown.diversification.score}
              max={breakdown.diversification.maxScore}
              value={breakdown.diversification.value}
              color={getScoreColor(breakdown.diversification.score * 5)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

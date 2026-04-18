"use client";

import { useEffect, useState } from "react";
import { computeHealthScoreAction } from "@/actions/health";
import { getHealthScoreLabel } from "@/lib/services/healthScoreService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Dimension {
  label: string;
  score: number;
  maxScore: number;
  value?: number;
}

interface HealthScoreData {
  score: number;
  breakdown: Record<string, Dimension>;
}

function ScoreRing({ score, max = 10 }) {
  const percent = (score / max) * 100;
  const color =
    score >= 8 ? "#22c55e" : score >= 5 ? "#eab308" : "#ef4444";

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="3"
        />
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${percent}, 100`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{score}</span>
        <span className="text-xs text-muted-foreground">/ {max}</span>
      </div>
    </div>
  );
}

function DimensionRow({ label, score, max, value, unit = "%" }) {
  const percent = max > 0 ? (score / max) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {value !== undefined ? `${value.toFixed(1)}${unit}` : "—"}
        </span>
      </div>
      <Progress value={percent} className="h-1.5" />
    </div>
  );
}

export function HealthScoreCard() {
  const [data, setData] = useState<HealthScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    computeHealthScoreAction()
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Health score error:", err);
        setError("Could not load health score");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Financial Health</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="w-24 h-24 rounded-full border-4 border-muted animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Financial Health</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            {error || "No data available"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const label = getHealthScoreLabel(data.score);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Financial Health</CardTitle>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded ${
              label === "Excellent"
                ? "bg-green-100 text-green-700"
                : label === "Average"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScoreRing score={data.score} />

        <div className="space-y-3">
          {Object.entries(data.breakdown).map(([key, dim]) => (
            <DimensionRow
              key={key}
              label={dim.label}
              score={dim.score}
              max={dim.maxScore}
              value={dim.value}
              unit={key === "diversification" ? " types" : "%"}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

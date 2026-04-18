"use client";

import { useState, useEffect, useCallback } from "react";
import { Target, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GoalForm } from "./_components/goal-form";
import { GoalCard } from "./_components/goal-card";
import { BarLoader } from "react-spinners";

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchGoals = useCallback(async () => {
    try {
      const { getUserGoalsWithProgressAction } = await import("@/actions/goal");
      const data = await getUserGoalsWithProgressAction();
      setGoals(data || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch goals:", err);
      setError(err.message || "Failed to load goals");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const activeGoals = goals.filter((g) => g.status === "ACTIVE" && !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);
  const pausedGoals = goals.filter((g) => g.status === "PAUSED");

  const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCurrentAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const overallProgress =
    totalTargetAmount > 0
      ? (totalCurrentAmount / totalTargetAmount) * 100
      : 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <BarLoader width={"100%"} color="#9333ea" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Goals</h1>
          <p className="text-muted-foreground">
            Set and track your financial milestones
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Create New Goal
              </DialogTitle>
            </DialogHeader>
            <div className="pt-4">
              <GoalForm
                onSuccess={() => {
                  setIsCreateOpen(false);
                  fetchGoals();
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Overall Goals Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                ${totalCurrentAmount.toLocaleString()} of $
                {totalTargetAmount.toLocaleString()}
              </span>
              <span className="font-medium">{overallProgress.toFixed(1)}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted">
              <div
                className="h-3 rounded-full bg-blue-500 transition-all"
                style={{ width: `${Math.min(overallProgress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{activeGoals.length} Active</span>
              <span>{completedGoals.length} Completed</span>
              <span>{pausedGoals.length} Paused</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {goals.length === 0 && !error && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Start by creating your first financial goal to track your progress
            </p>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Create New Goal
                  </DialogTitle>
                </DialogHeader>
                <div className="pt-4">
                  <GoalForm
                    onSuccess={() => {
                      setIsCreateOpen(false);
                      fetchGoals();
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Active Goals</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onUpdate={fetchGoals}
                onDelete={fetchGoals}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-green-600">
            Completed Goals
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onUpdate={fetchGoals}
                onDelete={fetchGoals}
              />
            ))}
          </div>
        </div>
      )}

      {/* Paused Goals */}
      {pausedGoals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Paused Goals
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pausedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onUpdate={fetchGoals}
                onDelete={fetchGoals}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

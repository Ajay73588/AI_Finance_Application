"use client";

import { useState } from "react";
import { Target, Calendar, Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GoalForm } from "./goal-form";

export function GoalCard({ goal, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingFunds, setIsAddingFunds] = useState(false);
  const [fundAmount, setFundAmount] = useState("");

  const progressPercent = Math.min(
    (goal.currentAmount / goal.targetAmount) * 100,
    100
  );
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const isCompleted = goal.currentAmount >= goal.targetAmount;

  const deadlineDate = new Date(goal.deadline);
  const isOverdue = deadlineDate < new Date() && !isCompleted;
  const daysRemaining = Math.ceil(
    (deadlineDate - new Date()) / (1000 * 60 * 60 * 24)
  );

  const handleAddFunds = async () => {
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const { updateGoalProgressAction } = await import("@/actions/goal");
      await updateGoalProgressAction(goal.id, amount);
      toast.success(`Added $${amount.toFixed(2)} to ${goal.name}`);
      setFundAmount("");
      setIsAddingFunds(false);
      onUpdate?.();
    } catch (error) {
      toast.error(error.message || "Failed to add funds");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${goal.name}"?`)) return;

    try {
      const { deleteGoalAction } = await import("@/actions/goal");
      await deleteGoalAction(goal.id);
      toast.success("Goal deleted successfully");
      onDelete?.();
    } catch (error) {
      toast.error(error.message || "Failed to delete goal");
    }
  };

  return (
    <>
      <Card className="relative overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-1 w-full ${
            isCompleted
              ? "bg-green-500"
              : isOverdue
              ? "bg-red-500"
              : "bg-blue-500"
          }`}
        />

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Target
                className={`h-5 w-5 ${
                  isCompleted
                    ? "text-green-500"
                    : isOverdue
                    ? "text-red-500"
                    : "text-blue-500"
                }`}
              />
              <CardTitle className="text-lg">{goal.name}</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Badge
                variant={isCompleted ? "default" : "secondary"}
                className={
                  isCompleted
                    ? "bg-green-100 text-green-700"
                    : isOverdue
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-100 text-blue-700"
                }
              >
                {isCompleted
                  ? "Completed"
                  : isOverdue
                  ? "Overdue"
                  : goal.status}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                ${goal.currentAmount.toLocaleString()} / $
                {goal.targetAmount.toLocaleString()}
              </span>
            </div>
            <Progress
              value={progressPercent}
              extraStyles={
                isCompleted
                  ? "bg-green-500"
                  : isOverdue
                  ? "bg-red-500"
                  : "bg-blue-500"
              }
            />
            <p className="text-xs text-muted-foreground text-right">
              {progressPercent.toFixed(1)}% complete
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Remaining</p>
              <p className="font-medium">${remaining.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Deadline</span>
              </div>
              <p
                className={`font-medium ${
                  isOverdue ? "text-red-500" : ""
                }`}
              >
                {isOverdue
                  ? `${Math.abs(daysRemaining)} days overdue`
                  : daysRemaining === 0
                  ? "Due today"
                  : `${daysRemaining} days left`}
              </p>
            </div>
          </div>

          {!isCompleted && (
            <div className="flex gap-2">
              <Dialog open={isAddingFunds} onOpenChange={setIsAddingFunds}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Plus className="mr-1 h-4 w-4" />
                    Add Funds
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Funds to {goal.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Amount</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter amount"
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAddFunds} className="w-full">
                      Add Funds
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Goal</DialogTitle>
                  </DialogHeader>
                  <div className="pt-4">
                    <GoalForm
                      initialData={goal}
                      onSuccess={() => {
                        setIsEditing(false);
                        onUpdate?.();
                      }}
                    />
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="icon"
                onClick={handleDelete}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Target } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const goalSchema = z.object({
  name: z.string().min(1, "Goal name is required"),
  targetAmount: z.string().min(1, "Target amount is required"),
  currentAmount: z.string().optional().default("0"),
  deadline: z.date({ required_error: "Deadline is required" }),
  status: z.enum(["ACTIVE", "PAUSED"]).default("ACTIVE"),
});

export function GoalForm({ onSuccess, initialData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: initialData?.name || "",
      targetAmount: initialData?.targetAmount?.toString() || "",
      currentAmount: initialData?.currentAmount?.toString() || "0",
      deadline: initialData?.deadline ? new Date(initialData.deadline) : undefined,
      status: initialData?.status || "ACTIVE",
    },
  });

  const deadline = watch("deadline");

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const submitData = {
        name: data.name,
        targetAmount: parseFloat(data.targetAmount),
        currentAmount: parseFloat(data.currentAmount || "0"),
        deadline: data.deadline.toISOString(),
        status: data.status,
      };

      if (initialData?.id) {
        const { updateGoalAction } = await import("@/actions/goal");
        await updateGoalAction(initialData.id, submitData);
        toast.success("Goal updated successfully");
      } else {
        const { createGoalAction } = await import("@/actions/goal");
        await createGoalAction(submitData);
        toast.success("Goal created successfully");
        reset();
      }
      onSuccess?.();
    } catch (error) {
      toast.error(error.message || "Failed to save goal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Goal Name</label>
        <Input
          placeholder="e.g., Retirement Fund, House Down Payment"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Target Amount</label>
          <Input
            type="number"
            step="0.01"
            placeholder="100000"
            {...register("targetAmount")}
          />
          {errors.targetAmount && (
            <p className="text-sm text-red-500">{errors.targetAmount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Current Amount</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0"
            {...register("currentAmount")}
          />
          {errors.currentAmount && (
            <p className="text-sm text-red-500">{errors.currentAmount.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Target Date</label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !deadline && "text-muted-foreground"
              )}
            >
              {deadline ? deadline.toLocaleDateString() : "Select deadline"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={deadline}
              onSelect={(date) => {
                setValue("deadline", date);
                setCalendarOpen(false);
              }}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.deadline && (
          <p className="text-sm text-red-500">{errors.deadline.message}</p>
        )}
      </div>

      {initialData?.id && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            onValueChange={(value) => setValue("status", value)}
            defaultValue={watch("status")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PAUSED">Paused</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Target className="mr-2 h-4 w-4" />
            {initialData?.id ? "Update Goal" : "Create Goal"}
          </>
        )}
      </Button>
    </form>
  );
}

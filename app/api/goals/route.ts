import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const goals = await db.goal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    // Add progress to each goal
    const goalsWithProgress = goals.map((goal) => ({
      ...goal,
      progressPercent:
        goal.targetAmount > 0
          ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
          : 0,
      remaining: Math.max(goal.targetAmount - goal.currentAmount, 0),
      isCompleted: goal.currentAmount >= goal.targetAmount,
    }));

    return NextResponse.json({
      success: true,
      data: goalsWithProgress,
    });
  } catch (error) {
    console.error("[GOALS_GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

const goalCreateSchema = {
  parse: (data) => {
    const errors = [];
    if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
      errors.push({ field: "name", message: "Goal name is required" });
    }
    if (!data.targetAmount || isNaN(parseFloat(data.targetAmount)) || parseFloat(data.targetAmount) <= 0) {
      errors.push({ field: "targetAmount", message: "Target amount must be a positive number" });
    }
    if (!data.deadline || isNaN(Date.parse(data.deadline))) {
      errors.push({ field: "deadline", message: "Deadline is required" });
    }
    if (errors.length > 0) {
      throw { errors };
    }
    return {
      name: data.name.trim(),
      targetAmount: parseFloat(data.targetAmount),
      currentAmount: parseFloat(data.currentAmount || "0"),
      deadline: new Date(data.deadline),
      status: data.status || "ACTIVE",
    };
  },
};

export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsedData = goalCreateSchema.parse(body);

    const goal = await db.goal.create({
      data: {
        userId: user.id,
        name: parsedData.name,
        targetAmount: parsedData.targetAmount,
        currentAmount: parsedData.currentAmount,
        deadline: parsedData.deadline,
        status: parsedData.status,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...goal,
          progressPercent:
            goal.targetAmount > 0
              ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
              : 0,
          remaining: Math.max(goal.targetAmount - goal.currentAmount, 0),
          isCompleted: goal.currentAmount >= goal.targetAmount,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error.errors) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[GOALS_POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

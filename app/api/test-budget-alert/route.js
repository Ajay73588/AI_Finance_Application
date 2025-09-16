import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";

export async function POST() {
  try {
    // Trigger budget check manually for testing
    await inngest.send({
      name: "inngest/scheduled",
      data: {
        cron: "0 */6 * * *",
        ts: new Date().toISOString(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Budget check triggered manually" 
    });
  } catch (error) {
    console.error("Failed to trigger budget check:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

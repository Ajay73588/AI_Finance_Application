// Type declarations for server actions
declare module "@/actions/health" {
  export function computeHealthScoreAction(): Promise<{
    score: number;
    breakdown: Record<string, any>;
  }>;
}

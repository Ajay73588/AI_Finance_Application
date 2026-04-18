// Type declarations for lib/services modules
declare module "@/lib/services/healthScoreService" {
  export function computeHealthScore(userId: string): Promise<{
    score: number;
    breakdown: Record<string, any>;
  }>;
  export function getHealthScoreLabel(score: number): string;
}

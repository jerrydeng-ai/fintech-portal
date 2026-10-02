import type { RiskLevel } from "../types";

export function riskLevelForScore(score: number): RiskLevel {
  if (score >= 70) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

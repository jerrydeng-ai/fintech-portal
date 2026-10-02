export const CASE_STATUSES = ["PENDING", "IN_REVIEW", "APPROVED", "REJECTED", "ESCALATED"] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const REVIEW_ACTIONS = ["APPROVE", "REJECT", "ESCALATE"] as const;
export type ReviewAction = (typeof REVIEW_ACTIONS)[number];

export const CASE_SORT_KEYS = ["customerName", "country", "riskScore", "status", "createdAt"] as const;
export type CaseSortKey = (typeof CASE_SORT_KEYS)[number];

export type CaseQuery = {
  status?: CaseStatus;
  /** Multi-status filter, e.g. "all open" (PENDING + IN_REVIEW + ESCALATED). */
  statuses?: readonly CaseStatus[];
  riskLevel?: RiskLevel;
  search?: string;
  sortBy?: CaseSortKey;
  sortDir?: "asc" | "desc";
};

export type KycCaseSummary = {
  id: string;
  customerId: string;
  customerName: string;
  country: string;
  countryCode: string;
  riskScore: number;
  riskLevel: RiskLevel;
  reasonFlagged: string;
  status: CaseStatus;
  createdAt: string;
  assignedAnalystName: string | null;
};

export type RiskFactorDto = { label: string; points: number; description: string | null };

export type KycCaseDetail = KycCaseSummary & {
  version: number;
  updatedAt: string;
  customer: {
    id: string;
    fullName: string;
    email: string;
    country: string;
    dateOfBirth: string;
    accountCreatedAt: string;
  };
  verification: {
    identityVerification: string;
    documentType: string;
    documentStatus: string;
    addressVerification: string;
    sanctionsScreening: string;
    pepScreening: string;
  };
  riskFactors: RiskFactorDto[];
};

export type QueueStats = {
  pending: number;
  inReview: number;
  highRiskOpen: number;
  escalated: number;
  total: number;
};

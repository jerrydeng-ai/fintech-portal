import type { Prisma, PrismaClient } from "@prisma/client";
import { SYSTEM_ACTOR } from "../src/platform/audit/types";
import { DEMO_USERS } from "../src/platform/auth/demo-users";
import { riskLevelForScore } from "../src/modules/kyc/services/risk";
import type { CaseStatus } from "../src/modules/kyc/types";

type Factor = [label: string, points: number, description: string];

type SeedCase = {
  customerId: string;
  name: string;
  country: string;
  countryCode: string;
  dob: string;
  accountAgeDays: number;
  flaggedHoursAgo: number;
  reason: string;
  status: CaseStatus;
  analyst?: "usr_alice" | "usr_carol";
  factors: Factor[];
  checks?: Partial<{
    identityVerification: string;
    documentType: string;
    documentStatus: string;
    addressVerification: string;
    sanctionsScreening: string;
    pepScreening: string;
  }>;
  history?: Array<{ by: "usr_alice" | "usr_carol"; from: CaseStatus; to: CaseStatus; action: string; hoursAgo: number; comment?: string }>;
};

const CASES: SeedCase[] = [
  {
    customerId: "CUST-10231", name: "Marcus Ellery-Vance", country: "Cyprus", countryCode: "CY", dob: "1984-03-12",
    accountAgeDays: 21, flaggedHoursAgo: 3, reason: "Transaction velocity spike after account opening", status: "PENDING",
    factors: [["Country risk", 30, "Registered in a jurisdiction on the enhanced-due-diligence list"], ["Transaction velocity", 25, "42 outbound transfers in 48h, 6× peer median"], ["Address mismatch", 15, "Utility bill address differs from application"], ["Device anomaly", 12, "Login from emulator fingerprint"]],
    checks: { addressVerification: "MISMATCH" },
  },
  {
    customerId: "CUST-10244", name: "Priya Raman", country: "United Kingdom", countryCode: "GB", dob: "1991-08-02",
    accountAgeDays: 9, flaggedHoursAgo: 20, reason: "Large incoming wires on a new account", status: "IN_REVIEW", analyst: "usr_alice",
    factors: [["Transaction velocity", 28, "£180k received across 5 wires in 3 days"], ["Large incoming wires", 22, "Originating bank in a different country from customer"], ["New account age", 14, "Account opened 9 days ago"], ["Device anomaly", 10, "Shared device with another flagged account"]],
    history: [{ by: "usr_alice", from: "PENDING", to: "IN_REVIEW", action: "KYC_REVIEW_STARTED", hoursAgo: 4 }],
  },
  {
    customerId: "CUST-10252", name: "Diego Fuentes Ortiz", country: "Panama", countryCode: "PA", dob: "1972-11-27",
    accountAgeDays: 64, flaggedHoursAgo: 52, reason: "Potential PEP match and structured deposits", status: "ESCALATED", analyst: "usr_alice",
    factors: [["Country risk", 30, "High-risk jurisdiction for financial secrecy"], ["PEP potential match", 25, "Name match to a regional public official (82% similarity)"], ["Structuring pattern", 20, "Deposits clustered just below reporting threshold"], ["Shell company link", 13, "Beneficial owner of a recently formed holding company"]],
    checks: { pepScreening: "POTENTIAL_MATCH" },
    history: [
      { by: "usr_alice", from: "PENDING", to: "IN_REVIEW", action: "KYC_REVIEW_STARTED", hoursAgo: 30 },
      { by: "usr_alice", from: "IN_REVIEW", to: "ESCALATED", action: "KYC_ESCALATED", hoursAgo: 26, comment: "Potential PEP match needs senior sign-off and source-of-funds evidence." },
    ],
  },
  {
    customerId: "CUST-10267", name: "Hannah Okafor", country: "Nigeria", countryCode: "NG", dob: "1995-01-19",
    accountAgeDays: 33, flaggedHoursAgo: 7, reason: "Low-quality ID document and address mismatch", status: "PENDING",
    factors: [["Country risk", 25, "Elevated jurisdiction risk"], ["Document quality", 18, "Glare obscures MRZ on passport scan"], ["Address mismatch", 14, "Postcode does not match city"], ["Transaction velocity", 10, "Above-average P2P transfers"]],
    checks: { documentStatus: "LOW_QUALITY", addressVerification: "MISMATCH" },
  },
  {
    customerId: "CUST-10271", name: "Lukas Brandt", country: "Germany", countryCode: "DE", dob: "1988-06-30",
    accountAgeDays: 410, flaggedHoursAgo: 30, reason: "ID document expiring within 30 days", status: "PENDING",
    factors: [["Document expiring", 15, "Personalausweis expires in 24 days"], ["Name mismatch", 12, "Middle name missing on application"], ["New device", 8, "First login from new device"]],
    checks: { documentType: "NATIONAL_ID" },
  },
  {
    customerId: "CUST-10283", name: "Sofia Marchetti", country: "Italy", countryCode: "IT", dob: "1979-09-14",
    accountAgeDays: 120, flaggedHoursAgo: 44, reason: "Multiple accounts linked to one device", status: "IN_REVIEW", analyst: "usr_carol",
    factors: [["Address mismatch", 20, "Delivery and residential address differ"], ["Multiple accounts same device", 18, "3 customer profiles share one device ID"], ["Transaction velocity", 14, "Card spend up 4× month-on-month"]],
    checks: { addressVerification: "MISMATCH" },
    history: [{ by: "usr_carol", from: "PENDING", to: "IN_REVIEW", action: "KYC_REVIEW_STARTED", hoursAgo: 10 }],
  },
  {
    customerId: "CUST-10290", name: "Yusuf Al-Hakim", country: "United Arab Emirates", countryCode: "AE", dob: "1981-04-05",
    accountAgeDays: 15, flaggedHoursAgo: 5, reason: "Sanctions screening fuzzy match", status: "PENDING",
    factors: [["Large deposits", 28, "Cash-equivalent deposits totalling $240k"], ["Country risk", 22, "Regional transit hub risk weighting"], ["Sanctions fuzzy match", 20, "71% name similarity to a listed individual; DOB differs"], ["Transaction velocity", 9, "Rapid in-and-out movement of funds"]],
    checks: { sanctionsScreening: "POTENTIAL_MATCH", documentType: "RESIDENCE_PERMIT" },
  },
  {
    customerId: "CUST-10302", name: "Emily Chen", country: "Singapore", countryCode: "SG", dob: "1996-12-08",
    accountAgeDays: 40, flaggedHoursAgo: 96, reason: "Selfie liveness check retried", status: "APPROVED", analyst: "usr_alice",
    factors: [["Liveness retry", 15, "Liveness check passed on third attempt"], ["New account age", 13, "Account opened 40 days ago"]],
    history: [{ by: "usr_alice", from: "PENDING", to: "APPROVED", action: "KYC_APPROVED", hoursAgo: 70, comment: "Liveness retries due to poor lighting; documents consistent." }],
  },
  {
    customerId: "CUST-10315", name: "Viktor Sokolov", country: "Estonia", countryCode: "EE", dob: "1969-02-22",
    accountAgeDays: 8, flaggedHoursAgo: 60, reason: "Sanctions potential match with crypto exposure", status: "ESCALATED", analyst: "usr_carol",
    factors: [["Sanctions potential match", 35, "Surname and DOB match a listed entity associate"], ["Country risk", 20, "Cross-border exposure to sanctioned region"], ["Crypto exchange exposure", 20, "Funds sourced from an unregistered exchange"], ["VPN / proxy usage", 16, "All sessions via commercial VPN"]],
    checks: { sanctionsScreening: "POTENTIAL_MATCH", identityVerification: "PENDING" },
    history: [{ by: "usr_carol", from: "PENDING", to: "ESCALATED", action: "KYC_ESCALATED", hoursAgo: 40, comment: "Escalated to MLRO. Freeze outbound transfers pending sanctions review." }],
  },
  {
    customerId: "CUST-10328", name: "Grace Mwangi", country: "Kenya", countryCode: "KE", dob: "1993-07-17",
    accountAgeDays: 52, flaggedHoursAgo: 14, reason: "Address could not be verified", status: "PENDING",
    factors: [["Document quality", 18, "Blurred corners on ID scan"], ["Country risk", 15, "Moderate jurisdiction risk"], ["Address unverifiable", 13, "No match in address registry"]],
    checks: { addressVerification: "UNVERIFIED", documentStatus: "UNDER_REVIEW" },
  },
  {
    customerId: "CUST-10334", name: "Tomás Silva", country: "Brazil", countryCode: "BR", dob: "1986-10-03",
    accountAgeDays: 210, flaggedHoursAgo: 26, reason: "Chargeback history and velocity increase", status: "IN_REVIEW", analyst: "usr_alice",
    factors: [["Transaction velocity", 22, "Merchant payments up 5× in a week"], ["Chargeback history", 20, "4 chargebacks in 60 days"], ["Device anomaly", 16, "Device timezone inconsistent with location"]],
    history: [{ by: "usr_alice", from: "PENDING", to: "IN_REVIEW", action: "KYC_REVIEW_STARTED", hoursAgo: 6 }],
  },
  {
    customerId: "CUST-10347", name: "Olivia Bennett", country: "Canada", countryCode: "CA", dob: "1990-05-25",
    accountAgeDays: 300, flaggedHoursAgo: 120, reason: "Name mismatch between ID and application", status: "APPROVED", analyst: "usr_alice",
    factors: [["Name mismatch", 12, "Married name on application, maiden name on ID"], ["New device", 10, "First login from new device"]],
    checks: { documentType: "DRIVERS_LICENSE" },
    history: [{ by: "usr_alice", from: "PENDING", to: "APPROVED", action: "KYC_APPROVED", hoursAgo: 100, comment: "Marriage certificate provided; name change verified." }],
  },
  {
    customerId: "CUST-10351", name: "Arjun Mehta", country: "India", countryCode: "IN", dob: "1998-03-09",
    accountAgeDays: 18, flaggedHoursAgo: 9, reason: "Rapid peer-to-peer transfers", status: "PENDING",
    factors: [["Rapid P2P transfers", 25, "60 transfers to 41 unique recipients"], ["Address mismatch", 20, "Billing address in a different state"], ["Failed logins", 18, "11 failed logins before success"]],
    checks: { addressVerification: "MISMATCH" },
  },
  {
    customerId: "CUST-10366", name: "Chloé Laurent", country: "France", countryCode: "FR", dob: "1983-12-01",
    accountAgeDays: 75, flaggedHoursAgo: 150, reason: "Expired identity document", status: "REJECTED", analyst: "usr_alice",
    factors: [["Document expired", 25, "Passport expired 14 months ago"], ["Address mismatch", 16, "Proof of address older than 3 months"]],
    checks: { documentStatus: "EXPIRED", identityVerification: "FAILED", addressVerification: "MISMATCH" },
    history: [{ by: "usr_alice", from: "PENDING", to: "REJECTED", action: "KYC_REJECTED", hoursAgo: 130, comment: "Customer did not provide a valid ID within 14 days of request." }],
  },
  {
    customerId: "CUST-10372", name: "Mehmet Yilmaz", country: "Türkiye", countryCode: "TR", dob: "1977-08-21",
    accountAgeDays: 28, flaggedHoursAgo: 11, reason: "Third-party funding from unrelated accounts", status: "PENDING",
    factors: [["Country risk", 24, "Elevated jurisdiction risk"], ["Transaction velocity", 22, "Account balance turned over 9× in 2 weeks"], ["Third-party funding", 18, "Deposits from 7 unrelated individuals"], ["Device anomaly", 12, "Rooted Android device"]],
  },
  {
    customerId: "CUST-10385", name: "Isabella Rossi-Grant", country: "Malta", countryCode: "MT", dob: "1987-02-14",
    accountAgeDays: 95, flaggedHoursAgo: 36, reason: "Gaming industry exposure with large wires", status: "IN_REVIEW", analyst: "usr_alice",
    factors: [["Large wires", 24, "€95k from an online gaming operator"], ["Gaming industry exposure", 25, "Employer is a licensed gaming company"], ["Country risk", 20, "Gaming-hub jurisdiction weighting"]],
    history: [{ by: "usr_alice", from: "PENDING", to: "IN_REVIEW", action: "KYC_REVIEW_STARTED", hoursAgo: 12 }],
  },
  {
    customerId: "CUST-10391", name: "Kwame Asante", country: "Ghana", countryCode: "GH", dob: "1992-09-29",
    accountAgeDays: 46, flaggedHoursAgo: 18, reason: "Document under manual review", status: "PENDING",
    factors: [["Country risk", 20, "Moderate jurisdiction risk"], ["Document quality", 20, "Hologram not visible on scan"], ["Transaction velocity", 15, "Inbound remittances above profile"]],
    checks: { documentStatus: "UNDER_REVIEW" },
  },
  {
    customerId: "CUST-10404", name: "Anna Kowalska", country: "Poland", countryCode: "PL", dob: "1994-04-11",
    accountAgeDays: 180, flaggedHoursAgo: 40, reason: "Login from new device and unverified address", status: "PENDING",
    factors: [["New device", 16, "New device in a different city"], ["Address unverifiable", 15, "Recent move, registry not updated"]],
    checks: { addressVerification: "UNVERIFIED" },
  },
  {
    customerId: "CUST-10418", name: "Rafael Duarte", country: "Portugal", countryCode: "PT", dob: "2001-01-07",
    accountAgeDays: 4, flaggedHoursAgo: 2, reason: "Synthetic identity signals", status: "PENDING",
    factors: [["Synthetic identity signals", 35, "SSN-equivalent issued after stated DOB; thin credit file"], ["Transaction velocity", 25, "Maxed card limit within 48h"], ["Device anomaly", 24, "Device linked to 5 prior applications"]],
    checks: { identityVerification: "FAILED", documentStatus: "UNDER_REVIEW" },
  },
  {
    customerId: "CUST-10426", name: "Mei Tanaka", country: "Japan", countryCode: "JP", dob: "1985-06-18",
    accountAgeDays: 500, flaggedHoursAgo: 200, reason: "Name transliteration mismatch", status: "APPROVED", analyst: "usr_alice",
    factors: [["Name transliteration", 11, "Romanisation differs between ID and bank record"], ["New account age", 8, "Secondary account recently opened"]],
    history: [{ by: "usr_alice", from: "PENDING", to: "APPROVED", action: "KYC_APPROVED", hoursAgo: 180, comment: "Transliteration variance only; all other checks clear." }],
  },
];

const HOUR = 60 * 60 * 1000;

type SeedTxn = {
  customerId: string;
  name: string;
  merchantRef: string;
  amountCents: number;
  method: string;
  status: "SETTLED" | "REFUNDED";
  hoursAgo: number;
  refund?: { by: "usr_alice" | "usr_carol"; hoursAgo: number; reason: string };
};

const TRANSACTIONS: SeedTxn[] = [
  { customerId: "CUST-10231", name: "Marcus Ellery-Vance", merchantRef: "MRC-88541", amountCents: 12500, method: "VISA_CREDIT", status: "SETTLED", hoursAgo: 5 },
  { customerId: "CUST-10244", name: "Priya Raman", merchantRef: "MRC-90210", amountCents: 8420, method: "VISA_DEBIT", status: "SETTLED", hoursAgo: 9 },
  { customerId: "CUST-10252", name: "Diego Fuentes Ortiz", merchantRef: "MRC-77128", amountCents: 156000, method: "MASTERCARD_CREDIT", status: "SETTLED", hoursAgo: 14 },
  { customerId: "CUST-10267", name: "Hannah Okafor", merchantRef: "MRC-61204", amountCents: 4999, method: "AMEX", status: "SETTLED", hoursAgo: 22 },
  { customerId: "CUST-10271", name: "Lukas Brandt", merchantRef: "MRC-55876", amountCents: 23050, method: "VISA_CREDIT", status: "SETTLED", hoursAgo: 31 },
  { customerId: "CUST-10283", name: "Sofia Marchetti", merchantRef: "MRC-44091", amountCents: 31000, method: "MASTERCARD_DEBIT", status: "REFUNDED", hoursAgo: 60,
    refund: { by: "usr_carol", hoursAgo: 50, reason: "Duplicate charge confirmed by merchant." } },
  { customerId: "CUST-10290", name: "Yusuf Al-Hakim", merchantRef: "MRC-39817", amountCents: 75400, method: "VISA_CREDIT", status: "SETTLED", hoursAgo: 41 },
  { customerId: "CUST-10302", name: "Emily Chen", merchantRef: "MRC-28460", amountCents: 12100, method: "AMEX", status: "REFUNDED", hoursAgo: 96,
    refund: { by: "usr_alice", hoursAgo: 80, reason: "Service not rendered; goodwill refund." } },
  { customerId: "CUST-10315", name: "Viktor Sokolov", merchantRef: "MRC-19328", amountCents: 209900, method: "VISA_CREDIT", status: "SETTLED", hoursAgo: 48 },
  { customerId: "CUST-10328", name: "Grace Mwangi", merchantRef: "MRC-16027", amountCents: 6700, method: "MASTERCARD_DEBIT", status: "SETTLED", hoursAgo: 55 },
  { customerId: "CUST-10351", name: "Arjun Mehta", merchantRef: "MRC-07455", amountCents: 18800, method: "VISA_DEBIT", status: "SETTLED", hoursAgo: 70 },
  { customerId: "CUST-10404", name: "Anna Kowalska", merchantRef: "MRC-02893", amountCents: 44300, method: "MASTERCARD_CREDIT", status: "SETTLED", hoursAgo: 90 },
];

export async function seedDatabase(prisma: PrismaClient | Prisma.TransactionClient, now = new Date()): Promise<void> {
  const ago = (hours: number) => new Date(now.getTime() - hours * HOUR);

  for (const user of DEMO_USERS) {
    await prisma.user.create({ data: user });
  }
  const users = new Map(DEMO_USERS.map((u) => [u.id, u]));

  for (const [index, seed] of TRANSACTIONS.entries()) {
    const txnId = `TXN-${9001 + index}`;
    await prisma.transaction.create({
      data: {
        id: txnId,
        customerId: seed.customerId,
        customerName: seed.name,
        merchantRef: seed.merchantRef,
        amountCents: seed.amountCents,
        currency: "USD",
        method: seed.method,
        status: seed.status,
        createdAt: ago(seed.hoursAgo),
        refundedAt: seed.refund ? ago(seed.refund.hoursAgo) : null,
        refundedById: seed.refund?.by ?? null,
        refundedByName: seed.refund ? users.get(seed.refund.by)!.name : null,
        refundReason: seed.refund?.reason ?? null,
      },
    });
    if (seed.refund) {
      const actor = users.get(seed.refund.by)!;
      await prisma.auditEvent.create({
        data: {
          timestamp: ago(seed.refund.hoursAgo),
          userId: actor.id,
          userName: actor.name,
          userRole: actor.role,
          action: "REFUND_APPROVED",
          resourceType: "TRANSACTION",
          resourceId: txnId,
          previousState: JSON.stringify({ status: "SETTLED" }),
          newState: JSON.stringify({ status: "REFUNDED" }),
          metadata: JSON.stringify({ customerId: seed.customerId, customerName: seed.name, amountCents: seed.amountCents, currency: "USD", comment: seed.refund.reason }),
        },
      });
    }
  }

  // Audit is platform-wide, not KYC-specific: seed a feature-flag event as a second example.
  const carol = users.get("usr_carol")!;
  await prisma.auditEvent.create({
    data: {
      timestamp: ago(16),
      userId: carol.id,
      userName: carol.name,
      userRole: carol.role,
      action: "FEATURE_FLAG_CHANGED",
      resourceType: "FEATURE_FLAG",
      resourceId: "kyc_two_step_rejection",
      previousState: JSON.stringify({ enabled: false }),
      newState: JSON.stringify({ enabled: true }),
      metadata: JSON.stringify({ comment: "Enabled two-step rejection for HIGH-risk KYC cases." }),
    },
  });

  for (const [index, seed] of CASES.entries()) {
    const caseId = `KYC-${2001 + index}`;
    const riskScore = seed.factors.reduce((sum, [, points]) => sum + points, 0);
    await prisma.customer.create({
      data: {
        id: seed.customerId,
        fullName: seed.name,
        email: `${seed.name.toLowerCase().normalize("NFD").replace(/[^a-z ]/g, "").split(" ").join(".")}@example.com`,
        country: seed.country,
        countryCode: seed.countryCode,
        dateOfBirth: new Date(`${seed.dob}T00:00:00Z`),
        accountCreatedAt: ago(seed.accountAgeDays * 24),
      },
    });
    await prisma.kycCase.create({
      data: {
        id: caseId,
        customerId: seed.customerId,
        status: seed.status,
        riskScore,
        riskLevel: riskLevelForScore(riskScore),
        reasonFlagged: seed.reason,
        assignedAnalystId: seed.analyst ?? null,
        identityVerification: seed.checks?.identityVerification ?? "VERIFIED",
        documentType: seed.checks?.documentType ?? "PASSPORT",
        documentStatus: seed.checks?.documentStatus ?? "VALID",
        addressVerification: seed.checks?.addressVerification ?? "VERIFIED",
        sanctionsScreening: seed.checks?.sanctionsScreening ?? "CLEAR",
        pepScreening: seed.checks?.pepScreening ?? "CLEAR",
        version: 1 + (seed.history?.length ?? 0),
        createdAt: ago(seed.flaggedHoursAgo),
        riskFactors: {
          create: seed.factors.map(([label, points, description]) => ({ label, points, description })),
        },
      },
    });
    await prisma.auditEvent.create({
      data: {
        timestamp: ago(seed.flaggedHoursAgo),
        userId: SYSTEM_ACTOR.id,
        userName: SYSTEM_ACTOR.name,
        userRole: "SYSTEM",
        action: "KYC_CASE_FLAGGED",
        resourceType: "KYC_CASE",
        resourceId: caseId,
        newState: JSON.stringify({ status: "PENDING" }),
        metadata: JSON.stringify({ customerId: seed.customerId, customerName: seed.name, riskScore, reason: seed.reason }),
      },
    });
    for (const event of seed.history ?? []) {
      const actor = users.get(event.by)!;
      await prisma.auditEvent.create({
        data: {
          timestamp: ago(event.hoursAgo),
          userId: actor.id,
          userName: actor.name,
          userRole: actor.role,
          action: event.action,
          resourceType: "KYC_CASE",
          resourceId: caseId,
          previousState: JSON.stringify({ status: event.from }),
          newState: JSON.stringify({ status: event.to }),
          metadata: JSON.stringify({ customerId: seed.customerId, customerName: seed.name, riskScore, comment: event.comment ?? null }),
        },
      });
    }
  }
}

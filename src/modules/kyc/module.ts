import type { ToolModule } from "@/platform/shell/types";

/** Registration manifest: how the KYC tool plugs into the shared shell. */
export const kycModule: ToolModule = {
  id: "kyc",
  name: "KYC Reviews",
  description: "Manual review queue for customers flagged by automated KYC screening.",
  navItems: [{ label: "Review Queue", href: "/kyc", icon: "queue", permission: "kyc:view" }],
};

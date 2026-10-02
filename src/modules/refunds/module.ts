import type { ToolModule } from "@/platform/shell/types";

/** Registration manifest: how the Refund Operations tool plugs into the shared shell. */
export const refundsModule: ToolModule = {
  id: "refunds",
  name: "Refund Operations",
  description: "Search transactions and issue refunds with approval controls.",
  navItems: [{ label: "Refund Operations", href: "/refunds", icon: "refund", permission: "refund:view" }],
};

import type { Permission } from "@/platform/rbac/permissions";

export type NavIcon = "dashboard" | "queue" | "audit" | "architecture" | "refund" | "flag";

export type NavItem = {
  label: string;
  href: string;
  icon: NavIcon;
  /** Item is hidden unless the user holds this permission. */
  permission?: Permission;
};

/** Contract every internal tool implements to plug into the shared shell. */
export type ToolModule = {
  id: string;
  name: string;
  description: string;
  navItems: NavItem[];
};

export type NavSection = { title: string; items: NavItem[] };

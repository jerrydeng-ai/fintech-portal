import type { Permission } from "@/platform/rbac/permissions";
import type { NavItem, NavSection, ToolModule } from "./types";

const PLATFORM_NAV: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "dashboard" },
  { label: "Audit Log", href: "/audit", icon: "audit", permission: "audit:view" },
  { label: "Architecture", href: "/architecture", icon: "architecture" },
  { label: "Production Readiness", href: "/production-readiness", icon: "flag" },
];

function visible(items: NavItem[], permissions: readonly Permission[]): NavItem[] {
  return items.filter((item) => !item.permission || permissions.includes(item.permission));
}

export function buildNavigation(modules: readonly ToolModule[], permissions: readonly Permission[]): NavSection[] {
  const [dashboard, ...platformRest] = PLATFORM_NAV;
  return [
    { title: "Overview", items: visible([dashboard], permissions) },
    ...modules.map((module) => ({ title: module.name, items: visible(module.navItems, permissions) })),
    { title: "Platform", items: visible(platformRest, permissions) },
  ].filter((section) => section.items.length > 0);
}

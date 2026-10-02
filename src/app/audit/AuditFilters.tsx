"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SelectFilter } from "@/components/forms/SelectFilter";

export function AuditFilters({
  actions,
  resourceTypes,
  users,
}: {
  actions: string[];
  resourceTypes: string[];
  users: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function set(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <SelectFilter
        label="Action"
        value={searchParams.get("action") ?? ""}
        options={actions.map((a) => ({ value: a, label: a }))}
        onChange={(v) => set("action", v)}
      />
      <SelectFilter
        label="Resource"
        value={searchParams.get("resourceType") ?? ""}
        options={resourceTypes.map((r) => ({ value: r, label: r }))}
        onChange={(v) => set("resourceType", v)}
      />
      <SelectFilter
        label="User"
        value={searchParams.get("userId") ?? ""}
        options={users.map((u) => ({ value: u.id, label: u.name }))}
        onChange={(v) => set("userId", v)}
      />
    </div>
  );
}

import type { Permission } from "@/platform/rbac/permissions";

export function AccessDenied({ permission, message }: { permission: Permission; message?: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <h2 className="text-base font-semibold text-red-800">Access denied</h2>
      <p className="mt-1 text-sm text-red-700">
        {message ?? "Your role does not grant access to this page."} Required permission:{" "}
        <code className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-xs">{permission}</code>
      </p>
    </div>
  );
}

"use client";

export type SelectOption = { value: string; label: string };

export function SelectFilter({
  label,
  value,
  options,
  onChange,
  allLabel = "All",
}: {
  label: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  allLabel?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <span className="whitespace-nowrap">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

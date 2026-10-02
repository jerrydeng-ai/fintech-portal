export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export function toJsonColumn(value: JsonObject | null | undefined): string | null {
  return value == null ? null : JSON.stringify(value);
}

export function fromJsonColumn(value: string | null): JsonObject | null {
  if (value == null) return null;
  const parsed: unknown = JSON.parse(value);
  return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as JsonObject) : null;
}

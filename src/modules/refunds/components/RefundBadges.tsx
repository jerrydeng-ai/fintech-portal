import { StatusBadge, type BadgeTone } from "@/components/feedback/StatusBadge";
import { humanize } from "@/lib/format";
import type { TransactionStatus } from "../types";

const TONES: Record<TransactionStatus, BadgeTone> = { SETTLED: "info", REFUNDED: "success" };

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  return <StatusBadge label={humanize(status)} tone={TONES[status]} />;
}

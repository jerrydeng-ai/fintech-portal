import { kycModule } from "@/modules/kyc/module";
import type { ToolModule } from "@/platform/shell/types";

/** Composition root: every internal tool registered with the platform shell. Add tool #2 here. */
export const TOOL_MODULES: readonly ToolModule[] = [kycModule];

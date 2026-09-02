import type { OperationResult } from "@venore/plugin-sdk";

export type ResolveStreamableItemQuery = { itemId: string };

export type ResolveStreamableItem =
  | { kind: "local"; absolutePath: string; contentType: string; size: number }
  | { kind: "redirect"; url: string };

export type ResolveStreamableItemResult = OperationResult<ResolveStreamableItem>;

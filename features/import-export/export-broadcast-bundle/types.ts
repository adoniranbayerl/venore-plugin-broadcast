import type { OperationResult } from "@venore/plugin-sdk";
import type { BroadcastBundleManifest } from "../../../shared/broadcast-bundle-manifest";

export type ExportBroadcastBundleAssetFile = { path: string; data: Buffer };
export type ExportBroadcastBundleData = { manifest: BroadcastBundleManifest; files: ExportBroadcastBundleAssetFile[] };
export type ExportBroadcastBundleResult = OperationResult<ExportBroadcastBundleData>;

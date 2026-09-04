import { NextResponse } from "next/server";
import { exportBroadcastBundle, toExportZip } from "../../../index";
import { isPluginActive } from "@venore/plugin-sdk";

function statusForErrorCode(code: string): number {
  if (code === "rbac.authorization.unauthenticated") return 401;
  if (code === "rbac.authorization.forbidden") return 403;
  return 400;
}

// Download binário não cabe no contrato de Server Action (retorno serializável) — mesmo motivo de
// routes/api/course-export/route.ts do academy.
export async function GET(): Promise<NextResponse> {
  if (!(await isPluginActive("broadcast"))) {
    return NextResponse.json({ error: "O plugin Broadcast Studio está desabilitado." }, { status: 404 });
  }

  const result = await exportBroadcastBundle();
  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: statusForErrorCode(result.error.code) });
  }

  const zip = toExportZip(result.data);
  const filename = `broadcast-${new Date().toISOString().slice(0, 10)}.zip`;

  return new NextResponse(new Uint8Array(zip), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(zip.byteLength),
    },
  });
}

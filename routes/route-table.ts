import { asPluginApiHandler, asPluginPage, type PluginRouteTable } from "@venore/plugin-sdk";
import AdminPage from "./admin/page";
import OutPage from "./out/page";
import { GET as streamGET } from "./api/stream/route";
import { GET as outputEventsGET } from "./api/output-events/route";
import { GET as outputStateGET } from "./api/output-state/route";

// A view de saída foge por completo da shell do (platform) — área `standalone` (caminho após
// /ext/), casada pelo dispatcher genérico src/app/ext/[...slug]/ do core. URL: /ext/broadcast/out/:token.
export const broadcastRouteTable: PluginRouteTable = {
  admin: [{ pattern: "", Component: asPluginPage(AdminPage) }],
  standalone: [{ pattern: "broadcast/out/:token", Component: asPluginPage(OutPage) }],
  api: [
    { pattern: "stream/:itemId", handlers: { GET: asPluginApiHandler(streamGET) } },
    { pattern: "output/:token/events", handlers: { GET: asPluginApiHandler(outputEventsGET) } },
    { pattern: "output/:token/state", handlers: { GET: asPluginApiHandler(outputStateGET) } },
  ],
};

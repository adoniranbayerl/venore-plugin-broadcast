import { defineConfig } from "drizzle-kit";

// Migrations próprias do plugin (docs/venore-docks.md — "Sistema de plugins" / "Schema e
// migrations"). Paths relativos à RAIZ deste repo (o sync coloca o conteúdo em
// src/plugins/broadcast/ no host, mas `drizzle-kit generate` roda aqui no repo do plugin). A
// aplicação no host é feita pelo run-plugin-migrations.ts do core no install, lendo
// manifest.migrationsPath.
export default defineConfig({
  schema: ["./database/schema/index.ts"],
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
  // Tabela de tracking própria, pra não compartilhar o cursor de "última migration aplicada" com
  // o core (nem com outro plugin).
  migrations: { schema: "broadcast_migrations", table: "__drizzle_migrations" },
});

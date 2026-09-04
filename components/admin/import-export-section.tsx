"use client";

import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@venore/plugin-sdk/ui";
import { Button } from "@venore/plugin-sdk/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@venore/plugin-sdk/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@venore/plugin-sdk/ui";
import type { BroadcastImportReport } from "../../index";

type ImportReportOutcome = BroadcastImportReport["lines"][number]["outcome"];

const OUTCOME_LABEL: Record<ImportReportOutcome, string> = {
  created: "Criado",
  reused: "Reaproveitado",
  skipped: "Pulado",
  failed: "Falhou",
};

function badgeVariantForOutcome(outcome: ImportReportOutcome): "secondary" | "outline" | "destructive" {
  if (outcome === "failed") return "destructive";
  if (outcome === "created" || outcome === "reused") return "secondary";
  return "outline";
}

// Aba "Importar/Exportar" — pacote único com telas + playlists + agenda + mídia referenciada
// (pedido explícito do usuário: um pacote com tudo de uma vez, não item por item). Mesma estrutura
// de relatório de venore-plugin-academy/routes/admin/_components/import-course-dialog.tsx, mas
// inline na aba (não um Dialog) — broadcast já tem o conceito de aba dentro de UMA página
// (Configurações/Administradores), diferente do academy, que preferiu um Dialog solto por não
// querer página nova.
export function ImportExportSection() {
  const [pending, setPending] = useState(false);
  const [report, setReport] = useState<BroadcastImportReport | null>(null);

  async function handleImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("file");
    const file = fileInput instanceof HTMLInputElement ? fileInput.files?.[0] : null;
    if (!file) {
      toast.error("Selecione um arquivo .zip para importar.");
      return;
    }

    setPending(true);
    setReport(null);

    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/broadcast/import", { method: "POST", body: formData });
      const body = (await response.json()) as { report?: BroadcastImportReport; error?: string };

      if (!response.ok || !body.report) {
        toast.error(body.error ?? "Falha ao importar o pacote.");
        return;
      }

      setReport(body.report);
      toast.success(
        `Importação concluída: ${body.report.createdCount} criado(s), ${body.report.reusedCount} reaproveitado(s), ${body.report.skippedCount} pulado(s), ${body.report.failedCount} falhou(aram).`,
      );
      form.reset();
    } catch {
      toast.error("Falha inesperada ao importar o pacote.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Exportar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Baixa um .zip com todas as telas, playlists e agenda (+ mídia referenciada) desta instalação — pra backup ou pra
            configurar outro servidor com o mesmo conteúdo.
          </p>
          <Button asChild variant="outline" size="sm">
            <a href="/api/broadcast/export">
              <Download className="size-4" aria-hidden="true" />
              Exportar tudo
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Importar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Envie um .zip gerado pela exportação acima (deste servidor ou de outro). Telas, playlists e agendas com o mesmo
            nome de algo que já existe aqui são <strong>puladas</strong> — nada é sobrescrito ou mesclado.
          </p>
          <form onSubmit={handleImport} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="file"
              name="file"
              accept=".zip"
              required
              disabled={pending}
              className="rounded-sm text-sm text-muted-foreground outline-none ui-motion-base file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" disabled={pending}>
              <Upload className="size-4" aria-hidden="true" />
              {pending ? "Importando..." : "Importar"}
            </Button>
          </form>

          {report && (
            <div className="max-h-96 overflow-y-auto rounded-panel border border-border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Referência</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Detalhe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.lines.map((line, index) => (
                      <TableRow key={`${line.kind}-${line.ref}-${index}`}>
                        <TableCell className="text-xs text-muted-foreground">{line.kind}</TableCell>
                        <TableCell className="max-w-40 truncate text-xs" title={line.ref}>
                          {line.ref}
                        </TableCell>
                        <TableCell>
                          <Badge variant={badgeVariantForOutcome(line.outcome)}>{OUTCOME_LABEL[line.outcome]}</Badge>
                        </TableCell>
                        <TableCell className="max-w-72 text-xs text-wrap text-muted-foreground">{line.message ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

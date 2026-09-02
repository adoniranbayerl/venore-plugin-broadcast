"use client";

import { useActionState, useState } from "react";
import { CalendarDays, ListVideo, Tv } from "lucide-react";
import { Button } from "@venore/plugin-sdk/ui";
import { useActionToast } from "@venore/plugin-sdk/ui";
// Importa direto de contracts/, nunca do barrel (@/plugins/broadcast) — mesmo racional de
// agenda-section.tsx/outputs-section.tsx/playlists-section.tsx: client component nunca pode
// arrastar o barrel de server (Drizzle/pg) pro bundle do browser.
import type { BroadcastAgendaRecord, BroadcastOutputRecord, BroadcastPlaylistRecord } from "../../contracts/types";
import {
  setAgendaEditorsAction,
  setOutputEditorsAction,
  setPlaylistEditorsAction,
  type BroadcastActionState,
} from "./actions";

const initialState: BroadcastActionState = { error: null };

// Não importa UserRef de @/contexts/auth (barrel arrasta next-auth/server pro bundle do browser) —
// mesmo padrão de AssignRoleForm (admin/rbac/_components/assign-role-form.tsx): tipo inline,
// campos mínimos.
type AssignableUser = { id: string; name: string | null; email: string };

type ResourceKind = "output" | "playlist" | "agenda";

const RESOURCE_ID_FIELD: Record<ResourceKind, string> = {
  output: "outputId",
  playlist: "playlistId",
  agenda: "agendaId",
};

const RESOURCE_ACTION = {
  output: setOutputEditorsAction,
  playlist: setPlaylistEditorsAction,
  agenda: setAgendaEditorsAction,
} as const;

const RESOURCE_PERMISSION_LABEL: Record<ResourceKind, string> = {
  output: "Editar telas atribuídas",
  playlist: "Editar playlists atribuídas",
  agenda: "Editar agendas atribuídas",
};

// Único formulário de "responsável" reaproveitado pelos três blocos abaixo (Telas/Playlists/
// Agendas) — mesmo padrão que antes vivia espalhado em três componentes quase idênticos
// (AgendaEditorsForm em agenda-section.tsx, OutputEditorsForm em outputs-section.tsx), agora
// centralizado aqui: pedido explícito ("Superadmin pode definir quem são os administradores de
// telas, playlists e agendas... Podemos ter uma aba apenas para o Superadmin configurar isso")
// tirou a atribuição de dentro de cada card individual e trouxe pra um único lugar. A atribuição
// sozinha não dá acesso: a pessoa também precisa ter o papel/permission correspondente em
// /admin/rbac (ver shared/scoped-authorization/index.ts no backend).
function ResourceEditorsForm({
  kind,
  resourceId,
  allUsers,
  selectedUserIds,
}: {
  kind: ResourceKind;
  resourceId: string;
  allUsers: AssignableUser[];
  selectedUserIds: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedUserIds));
  const [state, formAction, pending] = useActionState(RESOURCE_ACTION[kind], initialState);
  useActionToast({ pending, error: state.error, successMessage: "Responsáveis atualizados." });

  function toggle(userId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-2 rounded-panel border border-border/60 bg-muted/20 p-2.5">
      <input type="hidden" name={RESOURCE_ID_FIELD[kind]} value={resourceId} />
      <input type="hidden" name="userIds" value={JSON.stringify([...selected])} />
      <p className="text-xs text-muted-foreground">
        Pessoas marcadas precisam também ter o papel &quot;{RESOURCE_PERMISSION_LABEL[kind]}&quot; em Papéis e Permissões — a atribuição
        sozinha não dá acesso.
      </p>
      {allUsers.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum usuário cadastrado ainda.</p>
      ) : (
        <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto">
          {allUsers.map((user) => (
            <label key={user.id} className="flex items-center gap-1.5 text-sm text-foreground">
              <input
                type="checkbox"
                checked={selected.has(user.id)}
                onChange={() => toggle(user.id)}
                className="size-4 shrink-0 rounded border-border"
              />
              <span className="truncate">{user.name ?? user.email} ({user.email})</span>
            </label>
          ))}
        </div>
      )}
      <Button type="submit" size="sm" variant="outline" disabled={pending}>Salvar responsáveis</Button>
    </form>
  );
}

// Cada recurso (tela/playlist/agenda) some do painel do Superadmin — chip de resumo (quantos
// responsáveis já atribuídos) + o form de seleção atrás de um <details>, mesmo racional de
// disclosure já usado nos cards de Agenda/Playlist (não precisa ficar sempre aberto).
function ResourceEditorsRow({
  kind,
  resourceId,
  name,
  allUsers,
  selectedUserIds,
}: {
  kind: ResourceKind;
  resourceId: string;
  name: string;
  allUsers: AssignableUser[];
  selectedUserIds: string[];
}) {
  return (
    <details className="rounded-panel border border-border bg-card p-2.5">
      <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm">
        <span className="truncate font-medium text-foreground">{name}</span>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
          {selectedUserIds.length === 0 ? "sem responsável" : `${selectedUserIds.length} responsável${selectedUserIds.length === 1 ? "" : "eis"}`}
        </span>
      </summary>
      <div className="mt-2">
        <ResourceEditorsForm kind={kind} resourceId={resourceId} allUsers={allUsers} selectedUserIds={selectedUserIds} />
      </div>
    </details>
  );
}

export function ResponsiblesSection({
  outputs,
  playlists,
  agendas,
  allUsers,
  outputEditorUserIdsByOutputId,
  playlistEditorUserIdsByPlaylistId,
  agendaEditorUserIdsByAgendaId,
}: {
  outputs: BroadcastOutputRecord[];
  playlists: BroadcastPlaylistRecord[];
  agendas: BroadcastAgendaRecord[];
  allUsers: AssignableUser[];
  outputEditorUserIdsByOutputId: Record<string, string[]>;
  playlistEditorUserIdsByPlaylistId: Record<string, string[]>;
  agendaEditorUserIdsByAgendaId: Record<string, string[]>;
}) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Só o Superadmin vê esta aba. Atribua quem é responsável por cada tela, playlist ou agenda — a pessoa só ganha acesso de fato
        depois de também ter o papel correspondente em Papéis e Permissões.
      </p>

      <section className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Tv className="size-4" aria-hidden="true" /> Telas
        </h3>
        {outputs.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma tela cadastrada ainda.</p>
        ) : (
          <div className="space-y-2">
            {outputs.map((output) => (
              <ResourceEditorsRow
                key={output.id}
                kind="output"
                resourceId={output.id}
                name={output.name}
                allUsers={allUsers}
                selectedUserIds={outputEditorUserIdsByOutputId[output.id] ?? []}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ListVideo className="size-4" aria-hidden="true" /> Playlists
        </h3>
        {playlists.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma playlist cadastrada ainda.</p>
        ) : (
          <div className="space-y-2">
            {playlists.map((playlist) => (
              <ResourceEditorsRow
                key={playlist.id}
                kind="playlist"
                resourceId={playlist.id}
                name={playlist.name}
                allUsers={allUsers}
                selectedUserIds={playlistEditorUserIdsByPlaylistId[playlist.id] ?? []}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CalendarDays className="size-4" aria-hidden="true" /> Agendas
        </h3>
        {agendas.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma agenda cadastrada ainda.</p>
        ) : (
          <div className="space-y-2">
            {agendas.map((agenda) => (
              <ResourceEditorsRow
                key={agenda.id}
                kind="agenda"
                resourceId={agenda.id}
                name={agenda.name}
                allUsers={allUsers}
                selectedUserIds={agendaEditorUserIdsByAgendaId[agenda.id] ?? []}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

import { authorizeActor, type AuthorizeActorResult } from "@venore/plugin-sdk/rbac";
import {
  findAgendaIdByEventId,
  findPlaylistIdByItemId,
  isUserAssignedToAgenda,
  isUserAssignedToOutput,
  isUserAssignedToPlaylist,
} from "./store";

const FORBIDDEN_AGENDA_ERROR = {
  code: "broadcast.agenda.forbidden_resource",
  message: "Você só tem permissão para editar as agendas atribuídas a você.",
};
const FORBIDDEN_OUTPUT_ERROR = {
  code: "broadcast.outputs.forbidden_resource",
  message: "Você só tem permissão para editar as telas atribuídas a você.",
};
const FORBIDDEN_PLAYLIST_ERROR = {
  code: "broadcast.playlists.forbidden_resource",
  message: "Você só tem permissão para editar as playlists atribuídas a você.",
};

// Camada de autorização por recurso — pedido explícito: "adicionar um responsável (role editor
// pra cima) com acesso e permissão para alterar apenas a agenda atribuída" (e o mesmo pra telas).
// broadcast.manage sempre passa (acesso total, sem checar atribuição nenhuma). Quem só tem a
// permission estreita (broadcast.agenda.manage/broadcast.outputs.manage) ainda precisa estar
// EXPLICITAMENTE atribuído ao recurso — a atribuição por si só nunca é suficiente, precisa das
// duas coisas: a permission (via papel em /admin/rbac) E a atribuição (via
// set-agenda-editors/set-output-editors, só broadcast.manage pode mexer nisso). Isso é o que
// garante "papel editor pra cima" antes da atribuição valer qualquer coisa.
export async function authorizeAgendaActor(agendaId: string): Promise<AuthorizeActorResult> {
  const full = await authorizeActor("broadcast.manage");
  if (full.authorized) return full;

  const scoped = await authorizeActor("broadcast.agenda.manage");
  if (!scoped.authorized) return scoped;

  const assigned = await isUserAssignedToAgenda(agendaId, scoped.actorId);
  if (!assigned) return { authorized: false, error: FORBIDDEN_AGENDA_ERROR };
  return scoped;
}

// create-agenda-event já recebe agendaId direto (usa authorizeAgendaActor acima); update/delete
// de evento só recebem eventId — resolve o pai antes de checar atribuição.
export async function authorizeAgendaEventActor(eventId: string): Promise<AuthorizeActorResult> {
  const full = await authorizeActor("broadcast.manage");
  if (full.authorized) return full;

  const scoped = await authorizeActor("broadcast.agenda.manage");
  if (!scoped.authorized) return scoped;

  const agendaId = await findAgendaIdByEventId(eventId);
  if (!agendaId) {
    return { authorized: false, error: { code: "broadcast.agenda.event_not_found", message: "Evento não encontrado." } };
  }

  const assigned = await isUserAssignedToAgenda(agendaId, scoped.actorId);
  if (!assigned) return { authorized: false, error: FORBIDDEN_AGENDA_ERROR };
  return scoped;
}

export async function authorizeOutputActor(outputId: string): Promise<AuthorizeActorResult> {
  const full = await authorizeActor("broadcast.manage");
  if (full.authorized) return full;

  const scoped = await authorizeActor("broadcast.outputs.manage");
  if (!scoped.authorized) return scoped;

  const assigned = await isUserAssignedToOutput(outputId, scoped.actorId);
  if (!assigned) return { authorized: false, error: FORBIDDEN_OUTPUT_ERROR };
  return scoped;
}

// Mesmo racional de authorizeAgendaActor/authorizeOutputActor, pra playlist — paridade pedida
// explicitamente (ver manifest.ts, permission broadcast.playlists.manage).
export async function authorizePlaylistActor(playlistId: string): Promise<AuthorizeActorResult> {
  const full = await authorizeActor("broadcast.manage");
  if (full.authorized) return full;

  const scoped = await authorizeActor("broadcast.playlists.manage");
  if (!scoped.authorized) return scoped;

  const assigned = await isUserAssignedToPlaylist(playlistId, scoped.actorId);
  if (!assigned) return { authorized: false, error: FORBIDDEN_PLAYLIST_ERROR };
  return scoped;
}

// create-media-asset-playlist-item e os demais "add-*" já recebem playlistId direto (usam
// authorizePlaylistActor acima); delete-playlist-item/update-playlist-item/
// toggle-playlist-item-visibility só recebem itemId — resolve o pai antes de checar atribuição
// (mesmo padrão de authorizeAgendaEventActor).
export async function authorizePlaylistItemActor(itemId: string): Promise<AuthorizeActorResult> {
  const full = await authorizeActor("broadcast.manage");
  if (full.authorized) return full;

  const scoped = await authorizeActor("broadcast.playlists.manage");
  if (!scoped.authorized) return scoped;

  const playlistId = await findPlaylistIdByItemId(itemId);
  if (!playlistId) {
    return { authorized: false, error: { code: "broadcast.playlists.item_not_found", message: "Item não encontrado." } };
  }

  const assigned = await isUserAssignedToPlaylist(playlistId, scoped.actorId);
  if (!assigned) return { authorized: false, error: FORBIDDEN_PLAYLIST_ERROR };
  return scoped;
}

export { findAgendaIdsAssignedToUser, findOutputIdsAssignedToUser, findPlaylistIdsAssignedToUser } from "./store";

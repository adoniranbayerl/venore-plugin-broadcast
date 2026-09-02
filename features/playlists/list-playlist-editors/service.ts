import { findAllPlaylistEditorLinks } from "./store";
import type { ListPlaylistEditorsResult } from "./types";

export async function listPlaylistEditors(): Promise<ListPlaylistEditorsResult> {
  const links = await findAllPlaylistEditorLinks();
  const userIdsByPlaylistId: Record<string, string[]> = {};
  for (const link of links) {
    (userIdsByPlaylistId[link.playlistId] ??= []).push(link.userId);
  }
  return { success: true, data: userIdsByPlaylistId };
}

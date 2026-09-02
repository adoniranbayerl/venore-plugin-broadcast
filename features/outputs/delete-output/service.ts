import { deleteOutputById } from "./store";
import type { DeleteOutputInput, DeleteOutputResult } from "./types";

export async function deleteOutput(input: DeleteOutputInput): Promise<DeleteOutputResult> {
  const deleted = await deleteOutputById(input.outputId);
  if (!deleted) {
    return { success: false, error: { code: "broadcast.delete-output.not_found", message: "Saída não encontrada." } };
  }
  return { success: true, data: { id: input.outputId } };
}

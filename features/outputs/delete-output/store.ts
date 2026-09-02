import { eq } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastOutputs, broadcastScenes } from "../../../database/schema";

// A cena de uma saída (key: "output-${outputId}") é dedicada a ela — nada mais a referencia. A FK
// output.currentSceneId é onDelete:"set null" (não cascade), então apagar a saída sozinha deixaria
// a cena/camadas órfãs no banco; por isso apaga as duas em transação: a saída primeiro (nada
// referencia outputs.id hoje), depois a cena por id (camadas somem em cascata, FK onDelete:
// "cascade" no schema).
export async function deleteOutputById(id: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [output] = await tx.delete(broadcastOutputs).where(eq(broadcastOutputs.id, id)).returning({ currentSceneId: broadcastOutputs.currentSceneId });
    if (!output) return false;
    if (output.currentSceneId) {
      await tx.delete(broadcastScenes).where(eq(broadcastScenes.id, output.currentSceneId));
    }
    return true;
  });
}

import { notFound } from "next/navigation";
import { getOutputState, verifyOutputPin } from "../../index";
import { readOutputPinCookie } from "../../shared/output-pin-cookie";
import { isPluginActive } from "@venore/plugin-sdk";
import { OutputCanvas } from "../../components/output/output-canvas";
import { OutputPinGate } from "./pin-form";

// Rota standalone fora de (platform) de propósito: a view de saída (o que abre na TV) não tem
// header/nav/footer nenhum, é só o canvas em camadas — não existe slot de tema pra "canvas
// fullscreen" (achado da pesquisa: ContentSlotProps/HeaderSlotProps não cobrem esse caso, e os
// dois plugins existentes que têm página pública standalone, birthdays/academy, ainda reusam o
// layout de (platform); este é o primeiro caso que precisa fugir dele por completo).
export default async function BroadcastOutputPage({ params }: { params: Promise<{ token: string }> }) {
  if (!(await isPluginActive("broadcast"))) {
    notFound();
  }

  const { token } = await params;

  // PIN opcional por saída — checado ANTES de resolver o estado completo (que já é servido pela
  // mesma chamada tanto aqui quanto pelas rotas de API de polling/SSE, ver routes/api/output-
  // state e routes/api/output-events, que replicam esta mesma checagem). O PIN em si nunca sai
  // do servidor — verifyOutputPin só devolve required/valid, nunca o valor armazenado.
  const pinCookie = await readOutputPinCookie(token);
  const pinCheck = await verifyOutputPin({ token, candidate: pinCookie });
  if (pinCheck.success && pinCheck.data.required && !pinCheck.data.valid) {
    return <OutputPinGate token={token} />;
  }

  const initialState = await getOutputState({ token });
  if (!initialState.success) {
    notFound();
  }

  // Tela offline (Fase 11): sem branch dedicado aqui de propósito. OutputCanvas é um client
  // component SSR-renderizado com initialState — quando initialState.offline é true ele já emite o
  // HTML da StandbyScreen no primeiro paint (sem flash de conteúdo), e continua sendo ele quem
  // escuta o SSE pra voltar ao conteúdo quando o admin desliga o modo offline. Um return direto de
  // <StandbyScreen> aqui quebraria justamente esse "voltar sozinho".
  return <OutputCanvas token={token} initialState={initialState.data} />;
}

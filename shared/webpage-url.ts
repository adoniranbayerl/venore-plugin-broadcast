// Validação compartilhada por add-webpage-playlist-item e update-playlist-item (as duas únicas
// escritas de item "webpage") — antes cada uma tinha sua própria cópia idêntica; extraída aqui pra
// não divergir de novo. Pedido explícito: "APENAS ROTAS DO DOMINIO podem ser adicionadas. Nunca
// sites externos" — antes qualquer URL http(s) absoluta também era aceita (o <iframe> da view usa
// o valor cru como src, então tecnicamente funcionava), mas o operador não deve poder embutir um
// site de fora na TV.
//
// "//host/..." (protocolo-relativo) também é rejeitado — resolveria pro host de quem serve a
// página igual uma URL absoluta, é a mesma brecha de site externo disfarçada de rota.
export function isValidInternalWebpageRoute(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

export const INVALID_WEBPAGE_ROUTE_MESSAGE =
  'Informe uma rota interna começando com "/" (ex: /cursos ou /company-metrics/tv/abc123) — sites externos não são aceitos.';

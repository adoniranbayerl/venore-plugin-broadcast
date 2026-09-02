// Validação do valor que sai de um <input type="color"> (sempre "#rrggbb") — usado por
// create-agenda/update-agenda pra rejeitar um backgroundColor mal formado antes de gravar.
export function isValidHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

/** Patamares do Livro Base: 5–95% e o vigésimo patamar em 99% (p. 23). */
export function getNexLevel(nex: number): number {
  if (!Number.isFinite(nex) || nex < 0 || nex > 100) throw new Error('NEX deve estar entre 0 e 99 (100 apenas para registros legados).');
  // Um registro legado de 100 não deve derrubar a ficha; equivale ao último patamar para estes cálculos.
  return nex >= 99 ? 20 : Math.floor(nex / 5);
}

/** Motivos informados pelo jogador/mestre; não são detecção automática de eventos. */
export const RITUAL_END_REASONS = [
  { kind: 'voluntario', label: 'Encerramento pelo conjurador', guidance: 'Ação livre; o conjurador deve estar dentro do alcance (Livro Base, p.121).' },
  { kind: 'nao_mantido', label: 'Manutenção não realizada neste turno', guidance: 'Sem gastar 1 PE no início do turno, o efeito sustentado termina (p.120).' },
  { kind: 'pe_indisponivel', label: 'PE indisponível para manutenção', guidance: 'Confirme a indisponibilidade e o encerramento. Nenhum PE adicional será gasto.' },
  { kind: 'morte_conjurador', label: 'Morte confirmada do conjurador', guidance: 'A morte afeta rituais sustentados (p.121). Ter 0 PV ou estar Morrendo não comprova morte.' },
  { kind: 'dissipado', label: 'Efeito dissipado', guidance: 'Confirme a resolução da dissipação com o mestre antes de encerrar.' },
  { kind: 'efeito_especifico', label: 'Gatilho da descrição do ritual', guidance: 'Descreva qual evento da versão do ritual ocorreu. Não presuma encerramento por dano após a conjuração.' },
  { kind: 'ajuste_manual', label: 'Ajuste manual do jogador ou mestre', guidance: 'Use para registros antigos ou efeitos que exigem conferência. Descreva o motivo.' },
] as const;
export type RitualEndReasonKind = typeof RITUAL_END_REASONS[number]['kind'];
export interface RitualEndReason { kind: RitualEndReasonKind; note?: string; rangeConfirmed?: boolean }

/** Valida declaração explícita; o servidor repete a validação e confere origem/permissão. */
export function validateRitualEndReason(reason: RitualEndReason | undefined): string | null {
  if (!reason || !RITUAL_END_REASONS.some(entry => entry.kind === reason.kind)) return 'Selecione o motivo do encerramento.';
  if (typeof reason.note !== 'undefined' && (typeof reason.note !== 'string' || reason.note.length > 500)) return 'O motivo deve ter no máximo 500 caracteres.';
  if (['efeito_especifico', 'ajuste_manual'].includes(reason.kind) && !reason.note?.trim()) return 'Descreva o evento ou ajuste antes de confirmar.';
  if (reason.kind === 'voluntario' && reason.rangeConfirmed !== true) return 'Confirme que o conjurador está dentro do alcance.';
  return null;
}

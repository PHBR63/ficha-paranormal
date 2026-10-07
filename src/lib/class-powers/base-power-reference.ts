import type { ClassId } from './types';

const verified: Record<string, number> = { 'Ataque Especial': 24, 'Eclético': 28, 'Perito': 28, 'Escolhido pelo Outro Lado': 32, 'Engenhosidade': 30 };
const chapters: Record<ClassId, string> = { Combatente: '24–27', Especialista: '28–31', Ocultista: '32–35' };

/** Corrige referências antigas sem transformar busca por nome em homologação de uma habilidade. */
export function getBasePowerReference(name: string, classId?: ClassId): string {
  return verified[name] ? `Livro Base v1.3, p.${verified[name]}`
    : `Referência individual pendente${classId ? `; seção da classe no Livro Base v1.3, pp.${chapters[classId]}` : ''}. Confira a origem e a regra antes de usar.`;
}

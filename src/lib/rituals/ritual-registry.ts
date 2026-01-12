/**
 * Registro e Utilitários de Rituais
 * Ordem Paranormal RPG v1.3
 */

import { UNIFIED_RITUALS } from './unified-rituals';
import type { UnifiedRitual } from './types';

/**
 * Busca um ritual pelo ID
 */
export function getRitualById(id: string): UnifiedRitual | undefined {
    return UNIFIED_RITUALS.find(r => r.id === id);
}

/**
 * Determina o nível efetivo do ritual (Base, Discente, Verdadeiro)
 * baseado nos aprimoramentos selecionados
 */
export function getEffectiveLevel(selectedEnhancements: string[] = []): 'base' | 'discente' | 'verdadeiro' {
    if (selectedEnhancements.some(e => e.toLowerCase() === 'verdadeiro')) {
        return 'verdadeiro';
    }
    if (selectedEnhancements.some(e => e.toLowerCase() === 'discente')) {
        return 'discente';
    }
    return 'base';
}

/**
 * Calcula o custo total de PE do ritual
 */
export function calculateRitualCost(
    ritual: UnifiedRitual,
    selectedEnhancements: string[] = []
): number {
    let totalCost = ritual.cost;

    if (!ritual.enhancements) return totalCost;

    for (const enhancementName of selectedEnhancements) {
        const enhancement = ritual.enhancements.find(
            e => e.name.toLowerCase() === enhancementName.toLowerCase()
        );
        if (enhancement) {
            // O custo de aprimoramento SUBSTITUI o custo base se for maior?
            // Não, aprimoramentos apenas aumentam o custo.
            // Em Ordem Paranormal, geralmente o custo muda PARA X.
            // Mas a estrutura de aprimoramento tem 'cost'.
            // Vamos assumir que soma, ou se é custo fixo do nível. 
            // Na descrição do ritual no livro: "Discente (+2 PE): muda para..." => Soma.
            // E no JSON eu coloquei `cost: 2` para Discente.
            // Então soma.
            totalCost += enhancement.cost;
        }
    }

    return totalCost;
}

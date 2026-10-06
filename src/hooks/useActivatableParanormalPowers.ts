import { BASE_PARANORMAL_POWER_RULES } from '@/lib/rules/base-paranormal-powers';
/** Orientações de poderes com contexto ainda manual; dados da regra estão no catálogo compartilhado.
 * Consultar um poder não altera recursos, usos ou bônus. Execução depende da conferência do mestre.
 */

import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { SavedParanormalPower, ParanormalElement } from '@/lib/paranormal-powers';

// =====================================================
// Tipos e Interfaces
// =====================================================

/** Tipos de limite de uso para poderes paranormais */
export type ParanormalUsageLimit = 'none' | 'perTurn' | 'perRound' | 'perScene' | 'perSession';

/** Tipo de custo do poder */
export type PowerCostType = 'pe' | 'pv' | 'none';

/** Configuração de um poder paranormal ativável */
export interface ActivatableParanormalPower {
  /** Requer contexto/efeito ainda não integrado; consulta não debita recursos nem simula confirmação. */
  manualResolution?: boolean;
  /** ID único do poder (deve coincidir com o ID do catálogo de poderes) */
  id: string;
  /** Nome de exibição */
  name: string;
  /** Descrição breve do efeito */
  shortEffect: string;
  /** Descrição completa */
  description: string;
  /** Tipo de custo (PE, PV ou nenhum) */
  costType: PowerCostType;
  /** Valor do custo */
  costValue: number;
  /** Limite de uso */
  limit: ParanormalUsageLimit;
  /** Quantidade de usos por período (considerando afinidade ou não) */
  usesPerPeriod: number;
  /** Quantidade de usos com afinidade (se aplicável) */
  usesWithAffinity?: number;
  /** Elemento do poder (para calcular afinidade) */
  element: ParanormalElement | 'generic';
  /** Ícone para exibição */
  icon: 'zap' | 'clock' | 'dice' | 'heart' | 'shield' | 'sword' | 'sparkles' | 'skull';
  /** Página de referência no livro */
  pageRef: string;
  /** Se o poder é passivo (sempre ativo, sem ativação manual) */
  isPassive?: boolean;
  /** ID do bônus condicional no SUE (se aplicável) */
  conditionalBonusId?: string;
}

/** Estado de uso de um poder paranormal */
export interface ParanormalPowerUsageState {
  /** Quantidade de vezes usado no período atual */
  usageCount: number;
  /** Máximo de usos neste período */
  maxUses: number;
}

/** Props do hook */
export interface UseActivatableParanormalPowersProps {
  /** Poderes paranormais do personagem */
  paranormalPowers: SavedParanormalPower[] | null | undefined;
  /** NEX atual do personagem */
  nex: number;
  /** Elemento de afinidade (se houver) */
  elementalAffinity?: ParanormalElement | string | null;
  /** Se a afinidade está ativa (NEX >= 50%) */
  affinityActive?: boolean;
  /** PV atual */
  hpCurrent: number;
  /** PE atual */
  peCurrent: number;
  /** Callback para alterar HP */
  onHPChange: (newHP: number) => void;
  /** Callback para alterar PE */
  onPEChange: (newPE: number) => void;
  /** Callback para registrar PE gasto */
  onTrackPESpent?: (abilityName: string, cost: number) => void;
  /** Callback para ativar/desativar bônus condicionais */
  onToggleConditionalBonus?: (bonusId: string, active: boolean) => void;
  /** Lista de bônus condicionais ativos */
  activeConditionalBonuses?: string[];
}

/** Retorno do hook */
export interface UseActivatableParanormalPowersReturn {
  /** Lista de poderes ativáveis disponíveis */
  availablePowers: (ActivatableParanormalPower & { hasAffinity: boolean })[];
  /** Estado de uso de cada poder */
  usageStates: Record<string, ParanormalPowerUsageState>;
  /** Verifica se pode usar um poder */
  canUse: (powerId: string) => boolean;
  /** Calcula o custo atual de um poder */
  getCost: (powerId: string) => { type: PowerCostType; value: number };
  /** Quantidade de usos restantes */
  getRemainingUses: (powerId: string) => number;
  /** Usa um poder */
  usePower: (powerId: string) => boolean;
  /** Reseta poderes por turno */
  resetTurn: () => void;
  /** Reseta poderes por rodada */
  resetRound: () => void;
  /** Reseta poderes por cena */
  resetScene: () => void;
  /** Reseta poderes por sessão */
  resetSession: () => void;
  /** Total de poderes ativáveis */
  totalPowers: number;
  /** Quantos poderes foram usados */
  usedCount: number;
  /** Verifica se um bônus condicional está ativo */
  isBonusActive: (powerId: string) => boolean;
}

// =====================================================
// Catálogo de Poderes Paranormais Ativáveis
// =====================================================

/**
 * Poderes paranormais que requerem ativação manual
 * Baseado no Livro Base v1.3 (páginas 114-116)
 */
const GUIDE_LAYOUT: Array<{ id: string; icon: ActivatableParanormalPower['icon'] }> = [
  {id:'arma-de-sangue',icon:'sword'}, {id:'sangue-vivo',icon:'heart'},
  {id:'escapar-da-morte',icon:'skull'}, {id:'surto-temporal',icon:'clock'},
  {id:'potencial-reaproveitado',icon:'zap'}, {id:'percepcao-paranormal',icon:'sparkles'},
  {id:'afortunado',icon:'dice'}, {id:'campo-protetor',icon:'shield'}, {id:'manipular-entropia',icon:'dice'},
];
const GUIDE_COSTS: Record<string, number> = { 'arma-de-sangue':2, 'surto-temporal':3, 'manipular-entropia':2, 'campo-protetor':1 };
/** Nenhum destes efeitos possui execução contextual integrada. A consulta não consome recursos. */
export const ACTIVATABLE_PARANORMAL_POWERS: ActivatableParanormalPower[] = GUIDE_LAYOUT.map(layout => {
  const rule = BASE_PARANORMAL_POWER_RULES.find(entry => entry.id === layout.id)!;
  const cost = GUIDE_COSTS[layout.id] ?? 0;
  return { id:layout.id, name:rule.name, element:rule.element, icon:layout.icon,
    description:rule.description, shortEffect:'Resolução manual — conferir gatilho, alvo e duração',
    costType:cost ? 'pe' : 'none',costValue:cost,manualResolution:true,
    limit:'none',usesPerPeriod:999,pageRef:'Livro Base pp.114–116' };
});
const manualReset = () => undefined;

/** Mantém a API dos painéis. Contadores/recursos não simulam uma execução ainda manual. */
export function useActivatableParanormalPowers(props: UseActivatableParanormalPowersProps): UseActivatableParanormalPowersReturn {
  const {paranormalPowers,nex,elementalAffinity,affinityActive=false}=props;
  const availablePowers=useMemo(() => ACTIVATABLE_PARANORMAL_POWERS.filter(power => paranormalPowers?.some(saved => saved.id === power.id)).map(power => {
    const hasAffinity=nex >= 50 && affinityActive && power.element === elementalAffinity && (paranormalPowers?.filter(saved => saved.id === power.id).length ?? 0) >= 2;
    const affinity=BASE_PARANORMAL_POWER_RULES.find(rule => rule.id === power.id)?.affinityDescription;
    return {...power,hasAffinity,description:hasAffinity && affinity ? `${power.description} Aprimoramento: ${affinity}` : power.description};
  }),[paranormalPowers,nex,elementalAffinity,affinityActive]);
  const canUse=useCallback((id:string) => availablePowers.some(power => power.id === id),[availablePowers]);
  const getCost=useCallback((id:string) => {
    const power=ACTIVATABLE_PARANORMAL_POWERS.find(entry => entry.id === id);
    return {type:power?.costType ?? 'none',value:power?.costValue ?? 0};
  },[]);
  const usePower=useCallback((id:string) => {
    const power=availablePowers.find(entry => entry.id === id);
    if (!power) {toast.error('Poder indisponível nesta ficha.');return false;}
    toast.info(`${power.name}: resolução manual`,{description:power.description,duration:12000});
    return false; // Não existe recibo de aplicação: nenhuma mensagem de sucesso, recurso ou uso alterado.
  },[availablePowers]);
  return {availablePowers,usageStates:{},canUse,getCost,usePower,getRemainingUses:() => 999,
    resetTurn:manualReset,resetRound:manualReset,resetScene:manualReset,resetSession:manualReset,
    totalPowers:availablePowers.length,usedCount:0,isBonusActive:() => false};
}

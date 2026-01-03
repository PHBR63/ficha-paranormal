/**
 * Hook para lógica da trilha Aniquilador
 * 
 * Centraliza toda a lógica de negócio da trilha Aniquilador,
 * permitindo reutilização entre versões desktop e mobile.
 * 
 * @module tracks/combatente
 */

import { useState, useMemo, useCallback } from 'react';
import { useToast, type EffectDuration } from '@/hooks';

// ==================== TIPOS ====================

/** Efeito de técnica ativável */
export interface TechniqueEffect {
  id: string;
  name: string;
  description: string;
  peCost: number;
  minNex: number;
  stackable?: boolean;
  maxStacks?: number;
}

/** Habilidade passiva */
export interface PassiveAbility {
  name: string;
  minNex: number;
  effect: string;
}

/** Props do hook */
export interface UseAniquiladorTrackProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  onActivateEffect?: (
    id: string, 
    name: string, 
    duration: EffectDuration, 
    metadata?: Record<string, unknown>
  ) => void;
}

// ==================== CONSTANTES ====================

/** Efeitos das Técnicas Secreta/Sublime (Livro Base v1.3) */
export const TECHNIQUE_EFFECTS: TechniqueEffect[] = [
  // Técnica Secreta (NEX 40%)
  {
    id: 'amplo',
    name: 'Amplo',
    description: 'Ataque atinge um alvo adicional adjacente ao original',
    peCost: 2,
    minNex: 40,
  },
  {
    id: 'destruidor',
    name: 'Destruidor',
    description: 'Aumenta o multiplicador de crítico em +1',
    peCost: 2,
    minNex: 40,
  },
  // Técnica Sublime (NEX 65%)
  {
    id: 'letal',
    name: 'Letal',
    description: 'Aumenta margem de ameaça em +2 (2x = +5)',
    peCost: 2,
    minNex: 65,
    stackable: true,
    maxStacks: 2,
  },
  {
    id: 'perfurante',
    name: 'Perfurante',
    description: 'Ignora até 5 pontos de resistência a dano',
    peCost: 2,
    minNex: 65,
  },
];

/** Habilidades passivas da trilha */
export const PASSIVE_ABILITIES: PassiveAbility[] = [
  { name: 'A Favorita', minNex: 10, effect: 'Categoria da arma favorita reduzida em I' },
  { name: 'Técnica Secreta', minNex: 40, effect: 'Categoria reduzida em II' },
  { name: 'Máquina de Matar', minNex: 99, effect: 'Categoria III, +2 margem, +1 dado de dano' },
];

/** IDs de efeitos para o SUE */
export const ANIQUILADOR_EFFECT_IDS = {
  TECNICA_AMPLO: 'track-tecnica-amplo',
  TECNICA_DESTRUIDOR: 'track-tecnica-destruidor',
  TECNICA_LETAL: 'track-tecnica-letal',
  TECNICA_PERFURANTE: 'track-tecnica-perfurante',
} as const;

// ==================== HOOK ====================

/**
 * Hook para gerenciar estado e lógica da trilha Aniquilador
 * 
 * @param props - Propriedades do hook
 * @returns Estado e handlers para o componente
 */
export function useAniquiladorTrack({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  onActivateEffect,
}: UseAniquiladorTrackProps) {
  const { toast } = useToast();
  
  // Estado local
  const [isActivating, setIsActivating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEffects, setSelectedEffects] = useState<Record<string, number>>({});

  // Verifica se é trilha Aniquilador
  const isAniquilador = useMemo(() => {
    if (!classTrack) return false;
    const trackNorm = classTrack.toLowerCase().replace(/\s+/g, '-');
    return trackNorm.includes('aniquilador');
  }, [classTrack]);

  // Efeitos disponíveis pelo NEX
  const availableEffects = useMemo(() => {
    return TECHNIQUE_EFFECTS.filter(e => nex >= e.minNex);
  }, [nex]);

  // Passivas desbloqueadas
  const passiveAbilities = useMemo(() => {
    return PASSIVE_ABILITIES.filter(p => nex >= p.minNex);
  }, [nex]);

  // Tem acesso a técnicas ativáveis? (NEX 40%+)
  const hasTechniques = nex >= 40;

  // Calcula custo total das técnicas selecionadas
  const totalCost = useMemo(() => {
    return Object.entries(selectedEffects).reduce((sum, [id, count]) => {
      const effect = TECHNIQUE_EFFECTS.find(e => e.id === id);
      return sum + (effect ? effect.peCost * count : 0);
    }, 0);
  }, [selectedEffects]);

  // Verifica se pode ativar
  const canActivate = totalCost > 0 && peCurrent >= totalCost;

  // Toggle de efeito selecionado
  const toggleEffect = useCallback((effectId: string) => {
    setSelectedEffects(prev => {
      const effect = TECHNIQUE_EFFECTS.find(e => e.id === effectId);
      const currentCount = prev[effectId] || 0;
      
      if (effect?.stackable && effect.maxStacks) {
        // Efeito empilhável: cicla 0 -> 1 -> 2 -> 0
        const nextCount = (currentCount + 1) % (effect.maxStacks + 1);
        if (nextCount === 0) {
          const { [effectId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [effectId]: nextCount };
      }
      
      // Efeito normal: toggle on/off
      if (currentCount > 0) {
        const { [effectId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [effectId]: 1 };
    });
  }, []);

  // Confirmar ativação das técnicas
  const handleConfirm = useCallback(async () => {
    if (!canActivate) {
      toast({
        title: totalCost === 0 ? 'Nenhum efeito selecionado' : 'PE insuficiente',
        description: totalCost > 0 ? `Você precisa de ${totalCost} PE.` : undefined,
        variant: 'destructive',
      });
      return;
    }

    setIsActivating(true);
    
    // Pequeno delay para feedback visual
    await new Promise(r => setTimeout(r, 300));

    const newPE = peCurrent - totalCost;
    onPEChange(newPE);

    // Registra cada efeito ativado no SUE
    const effectNames: string[] = [];
    Object.entries(selectedEffects).forEach(([id, count]) => {
      const effect = TECHNIQUE_EFFECTS.find(e => e.id === id);
      if (!effect) return;
      
      const effectId = `track-tecnica-${id}`;
      const stacks = count > 1 ? ` (${count}x)` : '';
      effectNames.push(`${effect.name}${stacks}`);
      
      onActivateEffect?.(effectId, effect.name, 'next-attack', { stacks: count });
    });

    toast({
      title: 'Técnicas Ativadas!',
      description: `${effectNames.join(', ')}. -${totalCost} PE (restam ${newPE})`,
    });

    setIsActivating(false);
    setModalOpen(false);
    setSelectedEffects({});
  }, [canActivate, totalCost, peCurrent, onPEChange, selectedEffects, onActivateEffect, toast]);

  // Abre o modal/drawer de seleção
  const openModal = useCallback(() => setModalOpen(true), []);

  // Fecha o modal/drawer e limpa seleção
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedEffects({});
  }, []);

  // Retorna estado e handlers
  return {
    // Estado
    isAniquilador,
    isActivating,
    modalOpen,
    selectedEffects,
    availableEffects,
    passiveAbilities,
    hasTechniques,
    totalCost,
    canActivate,
    peCurrent,
    nex,
    
    // Handlers
    toggleEffect,
    handleConfirm,
    openModal,
    closeModal,
    setModalOpen,
  };
}

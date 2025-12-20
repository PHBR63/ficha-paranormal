// Hook para gerenciar PE Temporário
// Usado por Flagelador (Absorver Angústia) e Lâmina Paranormal (Gladiador Paranormal)

import { useState, useCallback, useMemo } from 'react';
import { getPELimitByNex } from '@/lib/dice-roller';

/**
 * Interface para o estado de PE temporário
 */
export interface TempPEState {
  /** Quantidade atual de PE temporário */
  amount: number;
  /** Limite máximo por cena (igual ao limite de PE por turno para Gladiador Paranormal) */
  maxPerScene: number;
  /** Quanto foi ganho na cena atual */
  gainedThisScene: number;
  /** Fonte do PE temporário ('absorver-angustia' | 'gladiador-paranormal') */
  source: 'absorver-angustia' | 'gladiador-paranormal' | null;
}

/**
 * Interface para as props do hook
 */
export interface UseTempPEProps {
  /** NEX do personagem (para calcular limite por turno) */
  nex: number;
  /** ID da trilha do personagem */
  classTrack?: string;
  /** NEX mínimo para habilidades (65% para Absorver Angústia, 40% para Gladiador) */
  characterAbilities?: string[];
}

/**
 * Interface para o retorno do hook
 */
export interface UseTempPEReturn {
  /** Estado atual do PE temporário */
  tempPE: TempPEState;
  /** Adiciona PE temporário (via habilidade de trilha) */
  addTempPE: (amount: number, source: TempPEState['source']) => { success: boolean; added: number; message: string };
  /** Consome PE temporário (usado antes do PE normal) */
  consumeTempPE: (amount: number) => { consumed: number; remaining: number };
  /** Reseta PE temporário (nova cena) */
  resetScene: () => void;
  /** Verifica se o personagem tem acesso a habilidades de PE temporário */
  hasAbsorverAngustia: boolean;
  hasGladiadorParanormal: boolean;
  /** Limite máximo de PE temporário por cena */
  maxTempPE: number;
}

/**
 * Hook para gerenciar PE Temporário
 * 
 * Regras:
 * - Absorver Angústia (Flagelador, NEX 65%): Ganha PE temp = círculo do ritual ao reduzir inimigo a 0 PV
 * - Gladiador Paranormal (Lâmina Paranormal, NEX 40%): Ganha 2 PE temp ao acertar ataque corpo a corpo
 *   - Limite por cena = limite de PE por turno
 * - PE temporário é consumido ANTES do PE normal
 * - PE temporário expira ao final da cena
 */
export function useTempPE({
  nex,
  classTrack,
  characterAbilities = [],
}: UseTempPEProps): UseTempPEReturn {
  // Limite de PE por turno (usado como limite de PE temp por cena para Gladiador)
  const peLimit = getPELimitByNex(nex);

  // Verifica se tem as habilidades relevantes
  const hasAbsorverAngustia = useMemo(() => {
    // Flagelador NEX 65%+
    const isFlagelador = classTrack?.toLowerCase().includes('flagelador') || 
                         classTrack?.toLowerCase() === 'flagelador';
    const hasNex = nex >= 65;
    const hasAbility = characterAbilities.some(a => 
      a.toLowerCase().includes('absorver') || 
      a.toLowerCase().includes('angústia') ||
      a.toLowerCase().includes('angustia')
    );
    return (isFlagelador && hasNex) || hasAbility;
  }, [classTrack, nex, characterAbilities]);

  const hasGladiadorParanormal = useMemo(() => {
    // Lâmina Paranormal NEX 40%+
    const isLaminaParanormal = classTrack?.toLowerCase().includes('lâmina') || 
                                classTrack?.toLowerCase().includes('lamina') ||
                                classTrack?.toLowerCase() === 'lamina-paranormal';
    const hasNex = nex >= 40;
    const hasAbility = characterAbilities.some(a => 
      a.toLowerCase().includes('gladiador') || 
      a.toLowerCase().includes('paranormal')
    );
    return (isLaminaParanormal && hasNex) || hasAbility;
  }, [classTrack, nex, characterAbilities]);

  // Limite máximo de PE temporário
  // Absorver Angústia: sem limite explícito (apenas círculo do ritual)
  // Gladiador Paranormal: limite por cena = limite de PE por turno
  const maxTempPE = useMemo(() => {
    if (hasGladiadorParanormal) {
      return peLimit;
    }
    // Absorver Angústia não tem limite por cena, mas máximo prático é ~20 (rituais 4º círculo)
    if (hasAbsorverAngustia) {
      return 20;
    }
    return 0;
  }, [hasGladiadorParanormal, hasAbsorverAngustia, peLimit]);

  // Estado do PE temporário
  const [tempPE, setTempPE] = useState<TempPEState>({
    amount: 0,
    maxPerScene: maxTempPE,
    gainedThisScene: 0,
    source: null,
  });

  /**
   * Adiciona PE temporário
   * Respeita o limite por cena para Gladiador Paranormal
   */
  const addTempPE = useCallback((
    amount: number, 
    source: TempPEState['source']
  ): { success: boolean; added: number; message: string } => {
    // Verifica se tem a habilidade correspondente
    if (source === 'absorver-angustia' && !hasAbsorverAngustia) {
      return { success: false, added: 0, message: 'Você não possui Absorver Angústia!' };
    }
    if (source === 'gladiador-paranormal' && !hasGladiadorParanormal) {
      return { success: false, added: 0, message: 'Você não possui Gladiador Paranormal!' };
    }

    setTempPE(prev => {
      let actualAdd = amount;

      // Gladiador Paranormal tem limite por cena
      if (source === 'gladiador-paranormal') {
        const remainingLimit = prev.maxPerScene - prev.gainedThisScene;
        actualAdd = Math.min(amount, remainingLimit);
        
        if (actualAdd <= 0) {
          return prev; // Limite atingido
        }
      }

      return {
        ...prev,
        amount: prev.amount + actualAdd,
        gainedThisScene: prev.gainedThisScene + actualAdd,
        source: source || prev.source,
      };
    });

    // Calcula quanto foi realmente adicionado para a mensagem
    let actualAdded = amount;
    if (source === 'gladiador-paranormal') {
      const remainingLimit = tempPE.maxPerScene - tempPE.gainedThisScene;
      actualAdded = Math.min(amount, remainingLimit);
    }

    if (actualAdded <= 0) {
      return { 
        success: false, 
        added: 0, 
        message: `Limite de PE temporário por cena atingido (${tempPE.maxPerScene})!` 
      };
    }

    return { 
      success: true, 
      added: actualAdded, 
      message: `+${actualAdded} PE temporário!` 
    };
  }, [hasAbsorverAngustia, hasGladiadorParanormal, tempPE.maxPerScene, tempPE.gainedThisScene]);

  /**
   * Consome PE temporário (antes do PE normal)
   * Retorna quanto foi consumido e quanto resta a pagar com PE normal
   */
  const consumeTempPE = useCallback((amount: number): { consumed: number; remaining: number } => {
    let consumed = 0;
    let remaining = amount;

    setTempPE(prev => {
      consumed = Math.min(prev.amount, amount);
      remaining = amount - consumed;

      return {
        ...prev,
        amount: prev.amount - consumed,
      };
    });

    return { consumed, remaining };
  }, []);

  /**
   * Reseta o PE temporário (nova cena)
   */
  const resetScene = useCallback(() => {
    setTempPE({
      amount: 0,
      maxPerScene: maxTempPE,
      gainedThisScene: 0,
      source: null,
    });
  }, [maxTempPE]);

  return {
    tempPE,
    addTempPE,
    consumeTempPE,
    resetScene,
    hasAbsorverAngustia,
    hasGladiadorParanormal,
    maxTempPE,
  };
}

/**
 * Funções utilitárias para triggers automáticos
 */

/**
 * Calcula PE temporário a ganhar via Absorver Angústia
 * @param ritualCircle - Círculo do ritual usado para matar o inimigo
 * @returns Quantidade de PE temporário a ganhar
 */
export function calculateAbsorverAngustiaPE(ritualCircle: number): number {
  // PE temp = círculo do ritual
  return Math.max(1, Math.min(4, ritualCircle));
}

/**
 * Calcula PE temporário a ganhar via Gladiador Paranormal
 * @returns Sempre 2 PE temporário por acerto corpo a corpo
 */
export function calculateGladiadorParanormalPE(): number {
  return 2;
}

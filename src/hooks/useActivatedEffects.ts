/**
 * useActivatedEffects - Hook para gerenciar efeitos ativados manualmente
 * 
 * Gerencia o estado de habilidades de trilha que precisam ser ativadas pelo jogador
 * e integra com o Sistema Unificado de Efeitos (SUE).
 * 
 * Características:
 * - Estado compartilhado de efeitos ativos
 * - Persistência no banco de dados (sincronização automática)
 * - Integração com useRoundTracking para reset automático
 * - Suporte a efeitos com duração (turnos, rodadas, cena)
 * - Callbacks para notificar mudanças
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Tipos de duração de efeitos ativados
export type EffectDuration = 
  | 'instant'       // Efeito imediato, não persiste
  | 'next-attack'   // Até o próximo ataque
  | 'next-turn'     // Até o início do próximo turno
  | 'round'         // Até o final da rodada
  | 'scene'         // Até o final da cena
  | 'concentration'; // Enquanto concentrar

export interface ActivatedEffect {
  /** ID único do efeito (prefixado com 'track-', 'power-', etc.) */
  id: string;
  /** Nome do efeito para display */
  name: string;
  /** Quando o efeito foi ativado */
  activatedAt: number;
  /** Duração do efeito */
  duration: EffectDuration;
  /** Rodada em que foi ativado (para reset) */
  activatedInRound?: number;
  /** Dados extras específicos do efeito */
  metadata?: Record<string, unknown>;
}

export interface UseActivatedEffectsOptions {
  /** ID do personagem para persistência */
  characterId?: string;
  /** Se deve sincronizar com o banco automaticamente */
  enablePersistence?: boolean;
  /** Debounce em ms para salvar no banco (default: 500) */
  saveDebounceMs?: number;
}

export interface UseActivatedEffectsReturn {
  /** Lista de IDs de efeitos atualmente ativos */
  activatedEffectIds: string[];
  /** Lista completa de efeitos ativos com metadados */
  activatedEffects: ActivatedEffect[];
  /** Indica se está carregando do banco */
  isLoading: boolean;
  /** Ativa um efeito */
  activateEffect: (
    id: string, 
    name: string, 
    duration?: EffectDuration,
    metadata?: Record<string, unknown>
  ) => void;
  /** Desativa um efeito específico */
  deactivateEffect: (id: string) => void;
  /** Verifica se um efeito está ativo */
  isEffectActive: (id: string) => boolean;
  /** Limpa efeitos de 'next-attack' após um ataque */
  consumeAttackEffects: () => void;
  /** Limpa efeitos de 'next-turn' ao iniciar novo turno */
  consumeTurnEffects: () => void;
  /** Limpa efeitos de 'round' ao avançar rodada */
  consumeRoundEffects: () => void;
  /** Limpa todos os efeitos (fim de cena/combate) */
  clearAllEffects: () => void;
  /** Força salvamento imediato no banco */
  forceSave: () => Promise<void>;
}

/**
 * Hook para gerenciar efeitos ativados manualmente com persistência
 * 
 * @example
 * const { activatedEffectIds, activateEffect, isEffectActive } = useActivatedEffects({
 *   characterId: character.id,
 *   enablePersistence: true
 * });
 * 
 * // Ao ativar Disparo Letal
 * activateEffect('track-disparo-letal', 'Disparo Letal', 'next-attack');
 * 
 * // Passar para o SUE
 * const effects = useUnifiedEffects({
 *   ...characterState,
 *   activatedEffects: activatedEffectIds
 * });
 */
export function useActivatedEffects(
  options: UseActivatedEffectsOptions = {}
): UseActivatedEffectsReturn {
  const { 
    characterId, 
    enablePersistence = true,
    saveDebounceMs = 500 
  } = options;
  
  const { toast } = useToast();
  const [effects, setEffects] = useState<ActivatedEffect[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('[]');
  const isInitializedRef = useRef(false);

  // Lista de IDs para passar ao SUE
  const activatedEffectIds = useMemo(
    () => effects.map(e => e.id),
    [effects]
  );

  // Carrega efeitos do banco ao montar
  useEffect(() => {
    if (!characterId || !enablePersistence) {
      isInitializedRef.current = true;
      return;
    }

    const loadEffects = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('characters')
          .select('activated_effects')
          .eq('id', characterId)
          .single();

        if (error) {
          console.error('[useActivatedEffects] Erro ao carregar efeitos:', error);
          return;
        }

        // Valida e parseia os efeitos salvos
        const savedEffects = data?.activated_effects;
        if (Array.isArray(savedEffects) && savedEffects.length > 0) {
          // Cast e filtra efeitos expirados (next-attack e next-turn não devem persistir entre sessões)
          const parsedEffects = savedEffects as unknown as ActivatedEffect[];
          const validEffects = parsedEffects.filter((e) => 
            e && typeof e === 'object' && 'duration' in e &&
            (e.duration === 'scene' || e.duration === 'concentration')
          );
          setEffects(validEffects);
          lastSavedRef.current = JSON.stringify(validEffects);
        }
      } catch (err) {
        console.error('[useActivatedEffects] Erro inesperado:', err);
      } finally {
        setIsLoading(false);
        isInitializedRef.current = true;
      }
    };

    loadEffects();
  }, [characterId, enablePersistence]);

  // Salva efeitos no banco com debounce
  const saveToDatabase = useCallback(async (effectsToSave: ActivatedEffect[]) => {
    if (!characterId || !enablePersistence || !isInitializedRef.current) return;

    // Evita salvar se não mudou
    const serialized = JSON.stringify(effectsToSave);
    if (serialized === lastSavedRef.current) return;

    try {
      // Cast para tipo compatível com Supabase Json
      const { error } = await supabase
        .from('characters')
        .update({ activated_effects: JSON.parse(JSON.stringify(effectsToSave)) })
        .eq('id', characterId);

      if (error) {
        console.error('[useActivatedEffects] Erro ao salvar efeitos:', error);
        toast({
          title: "Erro ao salvar efeitos",
          description: "Seus efeitos ativados podem não persistir.",
          variant: "destructive"
        });
        return;
      }

      lastSavedRef.current = serialized;
    } catch (err) {
      console.error('[useActivatedEffects] Erro inesperado ao salvar:', err);
    }
  }, [characterId, enablePersistence, toast]);

  // Debounce para salvar
  const scheduleSave = useCallback((newEffects: ActivatedEffect[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveToDatabase(newEffects);
    }, saveDebounceMs);
  }, [saveToDatabase, saveDebounceMs]);

  // Força salvamento imediato
  const forceSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    await saveToDatabase(effects);
  }, [effects, saveToDatabase]);

  // Limpa timeout ao desmontar
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Ativa um novo efeito
  const activateEffect = useCallback((
    id: string,
    name: string,
    duration: EffectDuration = 'round',
    metadata?: Record<string, unknown>
  ) => {
    setEffects(prev => {
      // Remove efeito existente com mesmo ID (substitui)
      const filtered = prev.filter(e => e.id !== id);
      
      const newEffects = [...filtered, {
        id,
        name,
        activatedAt: Date.now(),
        duration,
        metadata,
      }];
      
      // Agenda salvamento
      scheduleSave(newEffects);
      
      return newEffects;
    });
  }, [scheduleSave]);

  // Desativa um efeito específico
  const deactivateEffect = useCallback((id: string) => {
    setEffects(prev => {
      const newEffects = prev.filter(e => e.id !== id);
      scheduleSave(newEffects);
      return newEffects;
    });
  }, [scheduleSave]);

  // Verifica se um efeito está ativo
  const isEffectActive = useCallback((id: string) => {
    return effects.some(e => e.id === id);
  }, [effects]);

  // Consome efeitos de 'next-attack' após atacar
  const consumeAttackEffects = useCallback(() => {
    setEffects(prev => {
      const newEffects = prev.filter(e => e.duration !== 'next-attack');
      scheduleSave(newEffects);
      return newEffects;
    });
  }, [scheduleSave]);

  // Consome efeitos de 'next-turn' ao iniciar novo turno
  const consumeTurnEffects = useCallback(() => {
    setEffects(prev => {
      const newEffects = prev.filter(e => e.duration !== 'next-turn');
      scheduleSave(newEffects);
      return newEffects;
    });
  }, [scheduleSave]);

  // Consome efeitos de 'round' ao avançar rodada
  const consumeRoundEffects = useCallback(() => {
    setEffects(prev => {
      const newEffects = prev.filter(e => 
        e.duration !== 'round' && 
        e.duration !== 'next-turn' &&
        e.duration !== 'next-attack'
      );
      scheduleSave(newEffects);
      return newEffects;
    });
  }, [scheduleSave]);

  // Limpa todos os efeitos
  const clearAllEffects = useCallback(() => {
    setEffects([]);
    scheduleSave([]);
  }, [scheduleSave]);

  return {
    activatedEffectIds,
    activatedEffects: effects,
    isLoading,
    activateEffect,
    deactivateEffect,
    isEffectActive,
    consumeAttackEffects,
    consumeTurnEffects,
    consumeRoundEffects,
    clearAllEffects,
    forceSave,
  };
}

// ============================================
// IDs de efeitos de trilha conhecidos
// ============================================
export const TRACK_EFFECT_IDS = {
  // ============================================
  // ESPECIALISTA
  // ============================================
  
  // Atirador de Elite
  MIRA_DE_ELITE: 'track-mira-elite',
  DISPARO_LETAL: 'track-disparo-letal',
  DISPARO_IMPACTANTE: 'track-disparo-impactante',
  ATIRAR_PARA_MATAR: 'track-atirar-matar',
  
  // Infiltrador
  ATAQUE_FURTIVO: 'track-ataque-furtivo-trilha',
  GATUNO: 'track-gatuno',
  ASSASSINAR: 'track-assassinar',
  SOMBRA_FUGAZ: 'track-sombra-fugaz',
  
  // Médico de Campo
  PARAMEDICO: 'track-paramedico',
  EQUIPE_TRAUMA: 'track-equipe-trauma',
  RESGATE: 'track-resgate',
  REANIMACAO: 'track-reanimacao',
  
  // Negociador
  ELOQUENCIA: 'track-eloquencia',
  DISCURSO_MOTIVADOR: 'track-discurso-motivador',
  EU_CONHECO_UM_CARA: 'track-eu-conheco-um-cara',
  TRUQUE_MESTRE: 'track-truque-mestre',
  
  // Técnico
  INVENTARIO_OTIMIZADO: 'track-inventario-otimizado',
  REMENDAO: 'track-remendao',
  IMPROVISAR: 'track-improvisar',
  PREPARADO_PARA_TUDO: 'track-preparado-para-tudo',
  
  // ============================================
  // COMBATENTE
  // ============================================
  
  // Aniquilador
  A_FAVORITA: 'track-a-favorita',
  TECNICA_SECRETA: 'track-tecnica-secreta',
  TECNICA_SUBLIME: 'track-tecnica-sublime',
  MAQUINA_DE_MATAR: 'track-maquina-matar',
  
  // Comandante de Campo
  INSPIRAR_CONFIANCA: 'track-inspirar-confianca',
  ESTRATEGISTA: 'track-estrategista',
  BRECHA_NA_GUARDA: 'track-brecha-guarda',
  OFICIAL_COMANDANTE: 'track-oficial-comandante',
  
  // Guerreiro
  TECNICA_LETAL: 'track-tecnica-letal',
  REVIDAR: 'track-revidar',
  FORCA_OPRESSORA: 'track-forca-opressora',
  POTENCIA_MAXIMA: 'track-potencia-maxima',
  
  // Operações Especiais
  INICIATIVA_APRIMORADA: 'track-iniciativa-aprimorada',
  ATAQUE_EXTRA: 'track-ataque-extra',
  SURTO_ADRENALINA: 'track-surto-adrenalina',
  SEMPRE_ALERTA: 'track-sempre-alerta',
  
  // Tropa de Choque
  CASCA_GROSSA: 'track-casca-grossa',
  CAI_DENTRO: 'track-cai-dentro',
  DURO_DE_MATAR: 'track-duro-matar',
  INQUEBRAVEL: 'track-inquebravel',
} as const;

export type TrackEffectId = typeof TRACK_EFFECT_IDS[keyof typeof TRACK_EFFECT_IDS];

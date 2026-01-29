/**
 * useMasterActions - Hook para ações autorizadas do Mestre na campanha
 * 
 * Permite ao mestre ajustar PV/PE/SAN, aplicar/remover condições,
 * e gerenciar handouts dos personagens da campanha.
 * 
 * Sincronização em tempo real via Supabase.
 * 
 * ARQUITETURA: Usa padrão "Ref-First" para estabilizar callbacks e evitar
 * o erro React #185 (Maximum update depth exceeded). Todas as funções externas
 * (toast, onUpdate) são armazenadas em refs para não causarem recriação de callbacks.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Tipos para condições do personagem
export interface Condition {
  id: string;
  name: string;
  description?: string;
  duration?: number; // turnos restantes, -1 = permanente
}

// Tipos para handouts
export interface Handout {
  id: string;
  campaign_id: string;
  title: string;
  content?: string;
  image_url?: string;
  handout_type: 'document' | 'image' | 'clue' | 'npc';
  visibility: 'hidden' | 'visible' | 'shared_with';
  shared_with: string[];
  created_by: string;
  created_at: string;
  revealed_at?: string;
}

// Props do hook
export interface UseMasterActionsProps {
  campaignId: string;
  isMaster: boolean;
  onUpdate?: () => void;
}

// Retorno do hook
export interface MasterActionsReturn {
  // Estado
  isUpdating: boolean;
  lastError: string | null;
  
  // Ações de status
  adjustHP: (characterId: string, delta: number) => Promise<boolean>;
  adjustPE: (characterId: string, delta: number) => Promise<boolean>;
  adjustSAN: (characterId: string, delta: number) => Promise<boolean>;
  setHP: (characterId: string, value: number) => Promise<boolean>;
  setPE: (characterId: string, value: number) => Promise<boolean>;
  setSAN: (characterId: string, value: number) => Promise<boolean>;
  
  // Ações de condições
  applyCondition: (characterId: string, conditionName: string) => Promise<boolean>;
  removeCondition: (characterId: string, conditionName: string) => Promise<boolean>;
  clearAllConditions: (characterId: string) => Promise<boolean>;
  
  // Ações de handouts
  createHandout: (handout: Omit<Handout, 'id' | 'created_at' | 'created_by'>) => Promise<Handout | null>;
  revealHandout: (handoutId: string, targetUserIds?: string[]) => Promise<boolean>;
  hideHandout: (handoutId: string) => Promise<boolean>;
  deleteHandout: (handoutId: string) => Promise<boolean>;
}

export function useMasterActions({
  campaignId,
  isMaster,
  onUpdate,
}: UseMasterActionsProps): MasterActionsReturn {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // =====================================================
  // REFS PARA ESTABILIDADE (Padrão Ref-First)
  // Evita que mudanças em toast/onUpdate recriem callbacks
  // =====================================================
  const toastRef = useRef(toast);
  const onUpdateRef = useRef(onUpdate);
  const isMasterRef = useRef(isMaster);

  // Sincroniza refs quando valores mudam
  useEffect(() => { toastRef.current = toast; }, [toast]);
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);
  useEffect(() => { isMasterRef.current = isMaster; }, [isMaster]);

  // Helper para verificar autorização (usa ref para evitar deps instáveis)
  const checkAuth = useCallback(() => {
    if (!isMasterRef.current) {
      setLastError('Apenas o mestre pode executar esta ação');
      toastRef.current({
        title: 'Acesso negado',
        description: 'Apenas o mestre pode executar esta ação.',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  }, []); // Sem dependências - usa refs

  // =====================================================
  // AÇÕES DE STATUS (PV/PE/SAN)
  // =====================================================

  /**
   * Ajusta PV do personagem (delta pode ser positivo ou negativo)
   */
  const adjustHP = useCallback(async (characterId: string, delta: number): Promise<boolean> => {
    if (!checkAuth()) return false;
    
    setIsUpdating(true);
    setLastError(null);
    
    try {
      // Busca valores atuais
      const { data: char, error: fetchError } = await supabase
        .from('characters')
        .select('hp_current, hp_max')
        .eq('id', characterId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Calcula novo valor (clamped entre 0 e max)
      const newHP = Math.max(0, Math.min(char.hp_max, char.hp_current + delta));
      
      // Atualiza no banco
      const { error: updateError } = await supabase
        .from('characters')
        .update({ hp_current: newHP })
        .eq('id', characterId);
      
      if (updateError) throw updateError;
      
      toastRef.current({
        title: delta > 0 ? 'PV restaurado' : 'Dano aplicado',
        description: `PV ${delta > 0 ? '+' : ''}${delta} → ${newHP}/${char.hp_max}`,
      });
      
      onUpdateRef.current?.();
      return true;
    } catch (error: any) {
      setLastError(error.message);
      toastRef.current({
        title: 'Erro ao ajustar PV',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [checkAuth]); // Apenas checkAuth (que é estável)

  /**
   * Ajusta PE do personagem
   */
  const adjustPE = useCallback(async (characterId: string, delta: number): Promise<boolean> => {
    if (!checkAuth()) return false;
    
    setIsUpdating(true);
    setLastError(null);
    
    try {
      const { data: char, error: fetchError } = await supabase
        .from('characters')
        .select('pe_current, pe_max')
        .eq('id', characterId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newPE = Math.max(0, Math.min(char.pe_max, char.pe_current + delta));
      
      const { error: updateError } = await supabase
        .from('characters')
        .update({ pe_current: newPE })
        .eq('id', characterId);
      
      if (updateError) throw updateError;
      
      toastRef.current({
        title: delta > 0 ? 'PE restaurado' : 'PE consumido',
        description: `PE ${delta > 0 ? '+' : ''}${delta} → ${newPE}/${char.pe_max}`,
      });
      
      onUpdateRef.current?.();
      return true;
    } catch (error: any) {
      setLastError(error.message);
      toastRef.current({
        title: 'Erro ao ajustar PE',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [checkAuth]);

  /**
   * Ajusta SAN do personagem
   */
  const adjustSAN = useCallback(async (characterId: string, delta: number): Promise<boolean> => {
    if (!checkAuth()) return false;
    
    setIsUpdating(true);
    setLastError(null);
    
    try {
      const { data: char, error: fetchError } = await supabase
        .from('characters')
        .select('san_current, san_max')
        .eq('id', characterId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newSAN = Math.max(0, Math.min(char.san_max, char.san_current + delta));
      
      const { error: updateError } = await supabase
        .from('characters')
        .update({ san_current: newSAN })
        .eq('id', characterId);
      
      if (updateError) throw updateError;
      
      toastRef.current({
        title: delta > 0 ? 'Sanidade restaurada' : 'Sanidade perdida',
        description: `SAN ${delta > 0 ? '+' : ''}${delta} → ${newSAN}/${char.san_max}`,
      });
      
      onUpdateRef.current?.();
      return true;
    } catch (error: any) {
      setLastError(error.message);
      toastRef.current({
        title: 'Erro ao ajustar Sanidade',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [checkAuth]);

  /**
   * Define PV para valor absoluto
   */
  const setHP = useCallback(async (characterId: string, value: number): Promise<boolean> => {
    if (!checkAuth()) return false;
    
    setIsUpdating(true);
    setLastError(null);
    
    try {
      const { data: char, error: fetchError } = await supabase
        .from('characters')
        .select('hp_max')
        .eq('id', characterId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newHP = Math.max(0, Math.min(char.hp_max, value));
      
      const { error: updateError } = await supabase
        .from('characters')
        .update({ hp_current: newHP })
        .eq('id', characterId);
      
      if (updateError) throw updateError;
      
      toastRef.current({
        title: 'PV definido',
        description: `PV → ${newHP}/${char.hp_max}`,
      });
      
      onUpdateRef.current?.();
      return true;
    } catch (error: any) {
      setLastError(error.message);
      toastRef.current({
        title: 'Erro ao definir PV',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [checkAuth]);

  /**
   * Define PE para valor absoluto
   */
  const setPE = useCallback(async (characterId: string, value: number): Promise<boolean> => {
    if (!checkAuth()) return false;
    
    setIsUpdating(true);
    setLastError(null);
    
    try {
      const { data: char, error: fetchError } = await supabase
        .from('characters')
        .select('pe_max')
        .eq('id', characterId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newPE = Math.max(0, Math.min(char.pe_max, value));
      
      const { error: updateError } = await supabase
        .from('characters')
        .update({ pe_current: newPE })
        .eq('id', characterId);
      
      if (updateError) throw updateError;
      
      toastRef.current({
        title: 'PE definido',
        description: `PE → ${newPE}/${char.pe_max}`,
      });
      
      onUpdateRef.current?.();
      return true;
    } catch (error: any) {
      setLastError(error.message);
      toastRef.current({
        title: 'Erro ao definir PE',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [checkAuth]);

  /**
   * Define SAN para valor absoluto
   */
  const setSAN = useCallback(async (characterId: string, value: number): Promise<boolean> => {
    if (!checkAuth()) return false;
    
    setIsUpdating(true);
    setLastError(null);
    
    try {
      const { data: char, error: fetchError } = await supabase
        .from('characters')
        .select('san_max')
        .eq('id', characterId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newSAN = Math.max(0, Math.min(char.san_max, value));
      
      const { error: updateError } = await supabase
        .from('characters')
        .update({ san_current: newSAN })
        .eq('id', characterId);
      
      if (updateError) throw updateError;
      
      toastRef.current({
        title: 'Sanidade definida',
        description: `SAN → ${newSAN}/${char.san_max}`,
      });
      
      onUpdateRef.current?.();
      return true;
    } catch (error: any) {
      setLastError(error.message);
      toastRef.current({
        title: 'Erro ao definir Sanidade',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [checkAuth]);

  // =====================================================
  // AÇÕES DE CONDIÇÕES
  // =====================================================

  /**
   * Aplica uma condição ao personagem
   */
  const applyCondition = useCallback(async (characterId: string, conditionName: string): Promise<boolean> => {
    if (!checkAuth()) return false;
    
    setIsUpdating(true);
    setLastError(null);
    
    try {
      // Busca condições atuais
      const { data: char, error: fetchError } = await supabase
        .from('characters')
        .select('conditions')
        .eq('id', characterId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Adiciona nova condição se não existir
      const currentConditions = Array.isArray(char.conditions) ? char.conditions : [];
      if (currentConditions.includes(conditionName)) {
        toastRef.current({
          title: 'Condição já aplicada',
          description: `O personagem já possui a condição "${conditionName}".`,
        });
        return true;
      }
      
      const newConditions = [...currentConditions, conditionName];
      
      const { error: updateError } = await supabase
        .from('characters')
        .update({ conditions: newConditions })
        .eq('id', characterId);
      
      if (updateError) throw updateError;
      
      toastRef.current({
        title: 'Condição aplicada',
        description: `"${conditionName}" foi aplicada ao personagem.`,
      });
      
      onUpdateRef.current?.();
      return true;
    } catch (error: any) {
      setLastError(error.message);
      toastRef.current({
        title: 'Erro ao aplicar condição',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [checkAuth]);

  /**
   * Remove uma condição do personagem
   */
  const removeCondition = useCallback(async (characterId: string, conditionName: string): Promise<boolean> => {
    if (!checkAuth()) return false;
    
    setIsUpdating(true);
    setLastError(null);
    
    try {
      const { data: char, error: fetchError } = await supabase
        .from('characters')
        .select('conditions')
        .eq('id', characterId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const currentConditions = Array.isArray(char.conditions) ? char.conditions : [];
      const newConditions = currentConditions.filter((c: string) => c !== conditionName);
      
      const { error: updateError } = await supabase
        .from('characters')
        .update({ conditions: newConditions })
        .eq('id', characterId);
      
      if (updateError) throw updateError;
      
      toastRef.current({
        title: 'Condição removida',
        description: `"${conditionName}" foi removida do personagem.`,
      });
      
      onUpdateRef.current?.();
      return true;
    } catch (error: any) {
      setLastError(error.message);
      toastRef.current({
        title: 'Erro ao remover condição',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [checkAuth]);

  /**
   * Remove todas as condições do personagem
   */
  const clearAllConditions = useCallback(async (characterId: string): Promise<boolean> => {
    if (!checkAuth()) return false;
    
    setIsUpdating(true);
    setLastError(null);
    
    try {
      const { error: updateError } = await supabase
        .from('characters')
        .update({ conditions: [] })
        .eq('id', characterId);
      
      if (updateError) throw updateError;
      
      toastRef.current({
        title: 'Condições limpas',
        description: 'Todas as condições foram removidas.',
      });
      
      onUpdateRef.current?.();
      return true;
    } catch (error: any) {
      setLastError(error.message);
      toastRef.current({
        title: 'Erro ao limpar condições',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [checkAuth]);

  // =====================================================
  // AÇÕES DE HANDOUTS
  // =====================================================

  /**
   * Cria um novo handout
   */
  const createHandout = useCallback(async (
    handout: Omit<Handout, 'id' | 'created_at' | 'created_by'>
  ): Promise<Handout | null> => {
    if (!checkAuth()) return null;
    
    setIsUpdating(true);
    setLastError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('campaign_handouts')
        .insert({
          ...handout,
          campaign_id: campaignId,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toastRef.current({
        title: 'Handout criado',
        description: `"${handout.title}" foi criado com sucesso.`,
      });
      
      onUpdateRef.current?.();
      return data as Handout;
    } catch (error: any) {
      setLastError(error.message);
      toastRef.current({
        title: 'Erro ao criar handout',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [checkAuth, campaignId]);

  /**
   * Revela um handout para todos ou para usuários específicos
   */
  const revealHandout = useCallback(async (handoutId: string, targetUserIds?: string[]): Promise<boolean> => {
    if (!checkAuth()) return false;
    
    setIsUpdating(true);
    setLastError(null);
    
    try {
      const updateData = targetUserIds && targetUserIds.length > 0
        ? { visibility: 'shared_with', shared_with: targetUserIds, revealed_at: new Date().toISOString() }
        : { visibility: 'visible', revealed_at: new Date().toISOString() };
      
      const { error } = await supabase
        .from('campaign_handouts')
        .update(updateData)
        .eq('id', handoutId);
      
      if (error) throw error;
      
      toastRef.current({
        title: 'Handout revelado',
        description: targetUserIds 
          ? `Revelado para ${targetUserIds.length} jogador(es).`
          : 'Revelado para todos os jogadores.',
      });
      
      onUpdateRef.current?.();
      return true;
    } catch (error: any) {
      setLastError(error.message);
      toastRef.current({
        title: 'Erro ao revelar handout',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [checkAuth]);

  /**
   * Esconde um handout
   */
  const hideHandout = useCallback(async (handoutId: string): Promise<boolean> => {
    if (!checkAuth()) return false;
    
    setIsUpdating(true);
    setLastError(null);
    
    try {
      const { error } = await supabase
        .from('campaign_handouts')
        .update({ visibility: 'hidden', shared_with: [] })
        .eq('id', handoutId);
      
      if (error) throw error;
      
      toastRef.current({
        title: 'Handout escondido',
        description: 'O handout não está mais visível para os jogadores.',
      });
      
      onUpdateRef.current?.();
      return true;
    } catch (error: any) {
      setLastError(error.message);
      toastRef.current({
        title: 'Erro ao esconder handout',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [checkAuth]);

  /**
   * Deleta um handout
   */
  const deleteHandout = useCallback(async (handoutId: string): Promise<boolean> => {
    if (!checkAuth()) return false;
    
    setIsUpdating(true);
    setLastError(null);
    
    try {
      const { error } = await supabase
        .from('campaign_handouts')
        .delete()
        .eq('id', handoutId);
      
      if (error) throw error;
      
      toastRef.current({
        title: 'Handout deletado',
        description: 'O handout foi removido permanentemente.',
      });
      
      onUpdateRef.current?.();
      return true;
    } catch (error: any) {
      setLastError(error.message);
      toastRef.current({
        title: 'Erro ao deletar handout',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [checkAuth]);

  return {
    isUpdating,
    lastError,
    adjustHP,
    adjustPE,
    adjustSAN,
    setHP,
    setPE,
    setSAN,
    applyCondition,
    removeCondition,
    clearAllConditions,
    createHandout,
    revealHandout,
    hideHandout,
    deleteHandout,
  };
}

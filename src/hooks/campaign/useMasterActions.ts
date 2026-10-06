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
import { prepareResourceChange, prepareConditionChange, type ConfirmResourceOperation, type CharacterResource, type ResourceMode } from '@/services/character-resource-service';

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

  // Mantém a mesma requisição após falha de conexão; uma confirmação encerra
  // a operação e permite um novo ajuste intencional com outro UUID.
  const pendingOperations = useRef(new Map<string, Promise<ConfirmResourceOperation>>());
  const runConfirmed = useCallback(async (key: string, prepare: () => Promise<ConfirmResourceOperation>, title: string): Promise<boolean> => {
    if (!checkAuth()) return false;
    setIsUpdating(true); setLastError(null);
    let requestPrepared = false;
    try {
      let prepared = pendingOperations.current.get(key);
      if (!prepared) { prepared = prepare(); pendingOperations.current.set(key, prepared); }
      const operation = await prepared;
      requestPrepared = true;
      await operation();
      pendingOperations.current.delete(key);
      toastRef.current({ title, description: 'Alteração confirmada e registrada no servidor.' });
      onUpdateRef.current?.();
      return true;
    } catch (cause) {
      if (!requestPrepared) pendingOperations.current.delete(key);
      // Um conflito confirmado não foi aplicado: a próxima ação relê a ficha.
      // Falha de rede conserva a requisição porque o resultado é desconhecido.
      if (cause && typeof cause === 'object' && 'code' in cause && ['40001', '42501', '22023'].includes(String(cause.code))) pendingOperations.current.delete(key);
      const message = cause instanceof Error ? cause.message : 'Alteração não confirmada.';
      setLastError(message);
      toastRef.current({ title: 'Alteração não confirmada', description: message, variant: 'destructive' });
      return false;
    } finally { setIsUpdating(false); }
  }, [checkAuth]);

  const changeResource = useCallback((id: string, resource: CharacterResource, mode: ResourceMode, value: number, title: string) =>
    runConfirmed(`${id}:${resource}:${mode}:${value}`, () => prepareResourceChange(id, resource, mode, value), title), [runConfirmed]);
  const adjustHP = useCallback((id: string, value: number) => changeResource(id, 'hp', 'delta', value, value > 0 ? 'PV restaurado' : 'Dano aplicado'), [changeResource]);
  const adjustPE = useCallback((id: string, value: number) => changeResource(id, 'pe', 'delta', value, value > 0 ? 'PE restaurado' : 'PE consumido'), [changeResource]);
  const adjustSAN = useCallback((id: string, value: number) => changeResource(id, 'san', 'delta', value, value > 0 ? 'Sanidade restaurada' : 'Sanidade perdida'), [changeResource]);
  const setHP = useCallback((id: string, value: number) => changeResource(id, 'hp', 'set', value, 'PV definido'), [changeResource]);
  const setPE = useCallback((id: string, value: number) => changeResource(id, 'pe', 'set', value, 'PE definido'), [changeResource]);
  const setSAN = useCallback((id: string, value: number) => changeResource(id, 'san', 'set', value, 'Sanidade definida'), [changeResource]);
  const applyCondition = useCallback((id: string, name: string) => runConfirmed(`${id}:add:${name}`, () => prepareConditionChange(id, 'add', name), 'Condição aplicada'), [runConfirmed]);
  const removeCondition = useCallback((id: string, name: string) => runConfirmed(`${id}:remove:${name}`, () => prepareConditionChange(id, 'remove', name), 'Condição removida'), [runConfirmed]);
  const clearAllConditions = useCallback((id: string) => runConfirmed(`${id}:clear`, () => prepareConditionChange(id, 'clear'), 'Condições limpas'), [runConfirmed]);
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
        .eq('id', handoutId)
        .select('id')
        .single();
      
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
        .eq('id', handoutId)
        .select('id')
        .single();
      
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
        .eq('id', handoutId)
        .select('id')
        .single();
      
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

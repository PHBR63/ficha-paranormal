/**
 * useMacros - Hook para gerenciar macros de rolagem do personagem
 * 
 * Persiste macros localmente (localStorage) e sincroniza com o banco se disponível.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { RollMacro, MacroType } from '@/components/combat/MacroEditor';

// Chave de armazenamento local
const STORAGE_KEY = 'op-character-macros';

// Macros padrão para novos personagens
const DEFAULT_MACROS: Omit<RollMacro, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Teste Simples',
    type: 'skill',
    diceCount: 1,
    diceType: 20,
    bonus: 0,
    icon: 'dices',
    color: 'default',
    showInBar: true,
  },
  {
    name: 'Fortitude',
    type: 'save',
    diceCount: 1,
    diceType: 20,
    bonus: 0,
    icon: 'shield',
    color: 'green',
    showInBar: true,
    label: 'Teste de Fortitude',
  },
  {
    name: 'Reflexos',
    type: 'save',
    diceCount: 1,
    diceType: 20,
    bonus: 0,
    icon: 'zap',
    color: 'blue',
    showInBar: true,
    label: 'Teste de Reflexos',
  },
  {
    name: 'Vontade',
    type: 'save',
    diceCount: 1,
    diceType: 20,
    bonus: 0,
    icon: 'sparkles',
    color: 'purple',
    showInBar: true,
    label: 'Teste de Vontade',
  },
];

export interface UseMacrosProps {
  characterId: string;
  includeDefaults?: boolean;
}

export interface UseMacrosReturn {
  // Estado
  macros: RollMacro[];
  isLoading: boolean;
  
  // CRUD
  addMacro: (macro: Omit<RollMacro, 'id' | 'createdAt' | 'updatedAt'>) => RollMacro;
  updateMacro: (macroId: string, updates: Partial<Omit<RollMacro, 'id' | 'createdAt'>>) => void;
  deleteMacro: (macroId: string) => void;
  
  // Ordenação
  reorderMacros: (fromIndex: number, toIndex: number) => void;
  
  // Utilitários
  getMacrosByType: (type: MacroType) => RollMacro[];
  getVisibleMacros: () => RollMacro[];
  duplicateMacro: (macroId: string) => RollMacro | null;
  
  // Importação/Exportação
  exportMacros: () => string;
  importMacros: (json: string) => number;
  resetToDefaults: () => void;
}

export function useMacros({
  characterId,
  includeDefaults = true,
}: UseMacrosProps): UseMacrosReturn {
  const [macros, setMacros] = useState<RollMacro[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Chave de storage específica do personagem
  const storageKey = `${STORAGE_KEY}-${characterId}`;

  // Carrega macros do localStorage
  useEffect(() => {
    setIsLoading(true);
    
    try {
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        // Converte datas de string para Date
        const withDates = parsed.map((m: any) => ({
          ...m,
          createdAt: new Date(m.createdAt),
          updatedAt: new Date(m.updatedAt),
        }));
        setMacros(withDates);
      } else if (includeDefaults) {
        // Cria macros padrão para novo personagem
        const defaults = DEFAULT_MACROS.map((m, i) => ({
          ...m,
          id: `default-${i}-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        setMacros(defaults);
        localStorage.setItem(storageKey, JSON.stringify(defaults));
      }
    } catch (error) {
      console.error('Erro ao carregar macros:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey, includeDefaults]);

  // Salva macros no localStorage
  const saveMacros = useCallback((newMacros: RollMacro[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newMacros));
    } catch (error) {
      console.error('Erro ao salvar macros:', error);
    }
  }, [storageKey]);

  // Adiciona nova macro
  const addMacro = useCallback((
    macroData: Omit<RollMacro, 'id' | 'createdAt' | 'updatedAt'>
  ): RollMacro => {
    const newMacro: RollMacro = {
      ...macroData,
      id: `macro-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setMacros(prev => {
      const updated = [...prev, newMacro];
      saveMacros(updated);
      return updated;
    });

    return newMacro;
  }, [saveMacros]);

  // Atualiza macro existente
  const updateMacro = useCallback((
    macroId: string,
    updates: Partial<Omit<RollMacro, 'id' | 'createdAt'>>
  ) => {
    setMacros(prev => {
      const updated = prev.map(m => 
        m.id === macroId
          ? { ...m, ...updates, updatedAt: new Date() }
          : m
      );
      saveMacros(updated);
      return updated;
    });
  }, [saveMacros]);

  // Remove macro
  const deleteMacro = useCallback((macroId: string) => {
    setMacros(prev => {
      const updated = prev.filter(m => m.id !== macroId);
      saveMacros(updated);
      return updated;
    });
  }, [saveMacros]);

  // Reordena macros
  const reorderMacros = useCallback((fromIndex: number, toIndex: number) => {
    setMacros(prev => {
      const updated = [...prev];
      const [removed] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, removed);
      saveMacros(updated);
      return updated;
    });
  }, [saveMacros]);

  // Filtra por tipo
  const getMacrosByType = useCallback((type: MacroType): RollMacro[] => {
    return macros.filter(m => m.type === type);
  }, [macros]);

  // Retorna apenas macros visíveis na barra
  const getVisibleMacros = useCallback((): RollMacro[] => {
    return macros.filter(m => m.showInBar);
  }, [macros]);

  // Duplica macro
  const duplicateMacro = useCallback((macroId: string): RollMacro | null => {
    const original = macros.find(m => m.id === macroId);
    if (!original) return null;

    const duplicate: RollMacro = {
      ...original,
      id: `macro-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: `${original.name} (cópia)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setMacros(prev => {
      const updated = [...prev, duplicate];
      saveMacros(updated);
      return updated;
    });

    return duplicate;
  }, [macros, saveMacros]);

  // Exporta macros como JSON
  const exportMacros = useCallback((): string => {
    return JSON.stringify(macros, null, 2);
  }, [macros]);

  // Importa macros de JSON
  const importMacros = useCallback((json: string): number => {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) return 0;

      const imported: RollMacro[] = parsed.map((m: any) => ({
        ...m,
        id: `imported-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      setMacros(prev => {
        const updated = [...prev, ...imported];
        saveMacros(updated);
        return updated;
      });

      return imported.length;
    } catch (error) {
      console.error('Erro ao importar macros:', error);
      return 0;
    }
  }, [saveMacros]);

  // Reseta para macros padrão
  const resetToDefaults = useCallback(() => {
    const defaults = DEFAULT_MACROS.map((m, i) => ({
      ...m,
      id: `default-${i}-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    setMacros(defaults);
    saveMacros(defaults);
  }, [saveMacros]);

  return {
    // Estado
    macros,
    isLoading,
    
    // CRUD
    addMacro,
    updateMacro,
    deleteMacro,
    
    // Ordenação
    reorderMacros,
    
    // Utilitários
    getMacrosByType,
    getVisibleMacros,
    duplicateMacro,
    
    // Importação/Exportação
    exportMacros,
    importMacros,
    resetToDefaults,
  };
}

/**
 * Hook para gerenciar histórico de validações
 * Persiste resultados em localStorage para análise de tendências
 */

import { useState, useEffect, useCallback } from 'react';

export interface ValidationHistoryEntry {
  id: string;
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  successRate: number;
  categorySummary: Record<string, { passed: number; failed: number; total: number }>;
}

const STORAGE_KEY = 'ordo_validation_history';
const MAX_HISTORY_ENTRIES = 50; // Máximo de entradas para manter

export function useValidationHistory() {
  const [history, setHistory] = useState<ValidationHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar histórico do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ValidationHistoryEntry[];
        setHistory(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de validações:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Salvar nova entrada
  const addEntry = useCallback((entry: Omit<ValidationHistoryEntry, 'id'>) => {
    const newEntry: ValidationHistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
    };

    setHistory(prev => {
      // Adiciona nova entrada e limita ao máximo
      const updated = [newEntry, ...prev].slice(0, MAX_HISTORY_ENTRIES);
      
      // Persiste no localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Erro ao salvar histórico:', error);
      }
      
      return updated;
    });

    return newEntry;
  }, []);

  // Limpar histórico
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
    }
  }, []);

  // Estatísticas agregadas
  const stats = {
    totalRuns: history.length,
    averageSuccessRate: history.length > 0 
      ? Math.round(history.reduce((sum, h) => sum + h.successRate, 0) / history.length)
      : 0,
    lastRun: history[0] || null,
    bestRun: history.length > 0 
      ? history.reduce((best, current) => current.successRate > best.successRate ? current : best)
      : null,
    trend: calculateTrend(history),
  };

  return {
    history,
    isLoading,
    addEntry,
    clearHistory,
    stats,
  };
}

// Calcula tendência baseada nas últimas execuções
function calculateTrend(history: ValidationHistoryEntry[]): 'up' | 'down' | 'stable' | 'unknown' {
  if (history.length < 2) return 'unknown';
  
  // Compara média das últimas 3 com as 3 anteriores
  const recent = history.slice(0, Math.min(3, history.length));
  const older = history.slice(3, Math.min(6, history.length));
  
  if (older.length === 0) return 'unknown';
  
  const recentAvg = recent.reduce((sum, h) => sum + h.successRate, 0) / recent.length;
  const olderAvg = older.reduce((sum, h) => sum + h.successRate, 0) / older.length;
  
  const diff = recentAvg - olderAvg;
  
  if (diff > 2) return 'up';
  if (diff < -2) return 'down';
  return 'stable';
}

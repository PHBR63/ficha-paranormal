/**
 * Hook de Auditoria de Personagem
 * 
 * Executa auditoria automática ao carregar um personagem e
 * disponibiliza resultados para exibição na interface.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  auditCharacter, 
  autoFixCharacterIssues,
  AuditResult, 
  AuditIssue,
  CharacterForAudit 
} from '@/lib/character-audit-engine';
import { toast } from './use-toast';

interface UseCharacterAuditOptions {
  // Se true, executa auditoria automaticamente ao carregar
  autoRun?: boolean;
  // Se true, aplica correções automáticas sem confirmação
  autoFix?: boolean;
  // Se true, corrige problemas críticos (severity: 'error') automaticamente
  autoFixCritical?: boolean;
  // Callback executado após correções serem aplicadas (para invalidar cache)
  onFixComplete?: () => Promise<unknown> | void;
}

interface UseCharacterAuditReturn {
  // Resultado da auditoria
  auditResult: AuditResult | null;
  // Se está executando auditoria
  isAuditing: boolean;
  // Se está aplicando correções
  isFixing: boolean;
  // Erro, se houver
  error: string | null;
  // Re-executa a auditoria
  runAudit: () => Promise<void>;
  // Aplica correções automáticas
  applyAutoFixes: () => Promise<{ success: boolean; message: string }>;
  // Descarta um problema (oculta da lista)
  dismissIssue: (issueId: string) => void;
  // Problemas descartados
  dismissedIssues: Set<string>;
  // Problemas visíveis (não descartados)
  visibleIssues: AuditIssue[];
  // Contadores
  counts: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
    autoFixable: number;
  };
}

export function useCharacterAudit(
  character: CharacterForAudit | null,
  userId: string | null,
  options: UseCharacterAuditOptions = {}
): UseCharacterAuditReturn {
  const { autoRun = true, autoFix = false, autoFixCritical = false, onFixComplete } = options;
  
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedIssues, setDismissedIssues] = useState<Set<string>>(new Set());
  
  // Executa auditoria
  const runAudit = useCallback(async () => {
    if (!character) {
      setAuditResult(null);
      return;
    }
    
    setIsAuditing(true);
    setError(null);
    
    try {
      const result = await auditCharacter(character);
      setAuditResult(result);
      
      // Auto-fix se habilitado e há problemas corrigíveis
      if (autoFix && userId && result.autoFixableIssues.length > 0) {
        setIsFixing(true);
        const fixResult = await autoFixCharacterIssues(
          character.id,
          userId,
          result.autoFixableIssues,
          {
            paranormal_powers: character.paranormal_powers,
            nex: character.nex,
            origin: character.origin,
            skills: character.skills,
          }
        );
        
        if (fixResult.success && fixResult.fixedCount > 0) {
          // Re-executar auditoria após correções
          const newResult = await auditCharacter(character);
          setAuditResult(newResult);
        }
        setIsFixing(false);
      }
    } catch (err) {
      console.error('[useCharacterAudit] Erro na auditoria:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido na auditoria');
    } finally {
      setIsAuditing(false);
    }
  }, [character, userId, autoFix]);
  
  // Aplica correções automáticas
  const applyAutoFixes = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!character || !userId || !auditResult) {
      return { success: false, message: 'Dados insuficientes para correção' };
    }
    
    if (auditResult.autoFixableIssues.length === 0) {
      return { success: true, message: 'Nenhum problema para corrigir automaticamente' };
    }
    
    setIsFixing(true);
    
    try {
      const result = await autoFixCharacterIssues(
        character.id,
        userId,
        auditResult.autoFixableIssues,
        {
          paranormal_powers: character.paranormal_powers,
          nex: character.nex,
          origin: character.origin,
          skills: character.skills, // Necessário para correções de perícias
        }
      );
      
      if (result.success) {
        // Chama callback para invalidar cache/refetch ANTES de re-auditar
        if (onFixComplete) {
          await onFixComplete();
        }
        
        // Re-executar auditoria após correções
        await runAudit();
        return { 
          success: true, 
          message: `${result.fixedCount} correção(ões) aplicada(s): ${result.appliedFixes.join(', ')}` 
        };
      } else {
        return { 
          success: false, 
          message: `Erro ao aplicar correções: ${result.errors.join(', ')}` 
        };
      }
    } catch (err) {
      console.error('[useCharacterAudit] Erro ao aplicar correções:', err);
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Erro desconhecido' 
      };
    } finally {
      setIsFixing(false);
    }
  }, [character, userId, auditResult, runAudit, onFixComplete]);
  
  // Descarta um problema
  const dismissIssue = useCallback((issueId: string) => {
    setDismissedIssues(prev => new Set([...prev, issueId]));
  }, []);
  
  // Executa auditoria automaticamente quando o personagem muda
  useEffect(() => {
    if (autoRun && character) {
      runAudit();
    }
  }, [character?.id, character?.nex, character?.paranormal_powers?.length, autoRun]);
  
  // Auto-fix silencioso para problemas corrigíveis (com notificação discreta)
  // React 19: valor inicial obrigatório
  const hasNotifiedRef = useRef<boolean>(false);
  
  useEffect(() => {
    async function autoFixAllIssues() {
      if (!autoFixCritical || !auditResult || isFixing) return;
      
      // Corrige TODOS os problemas auto-corrigíveis (não só críticos)
      const fixableIssues = auditResult.autoFixableIssues;
      
      if (fixableIssues.length === 0) return;
      
      console.log('[useCharacterAudit] Auto-corrigindo problemas silenciosamente:', fixableIssues.length);
      const result = await applyAutoFixes();
      
      // Notificação discreta apenas uma vez por sessão de correção
      if (result.success && result.message.includes('correção') && !hasNotifiedRef.current) {
        hasNotifiedRef.current = true;
        
        // Toast discreto com detalhes das correções (texto simples, sem JSX)
        const issueNames = fixableIssues.map(i => i.title).join(', ');
        toast({
          title: '✓ Ficha ajustada automaticamente',
          description: `${fixableIssues.length} correção(ões): ${issueNames}`,
          duration: 4000,
        });
        
        // Reset após um tempo para permitir novas notificações
        setTimeout(() => {
          hasNotifiedRef.current = false;
        }, 30000);
      }
    }
    
    autoFixAllIssues();
  }, [autoFixCritical, auditResult?.autoFixableIssues?.length, isFixing]);
  
  // Problemas visíveis (não descartados)
  const visibleIssues = auditResult?.issues.filter(i => !dismissedIssues.has(i.id)) || [];
  
  // Contadores
  const counts = {
    total: visibleIssues.length,
    errors: visibleIssues.filter(i => i.severity === 'error').length,
    warnings: visibleIssues.filter(i => i.severity === 'warning').length,
    info: visibleIssues.filter(i => i.severity === 'info').length,
    autoFixable: visibleIssues.filter(i => i.autoFixable).length,
  };
  
  return {
    auditResult,
    isAuditing,
    isFixing,
    error,
    runAudit,
    applyAutoFixes,
    dismissIssue,
    dismissedIssues,
    visibleIssues,
    counts,
  };
}

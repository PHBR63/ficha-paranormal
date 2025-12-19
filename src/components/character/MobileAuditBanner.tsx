/**
 * MobileAuditBanner - Versão compacta do banner de auditoria para dispositivos móveis
 * Mostra alertas de problemas detectados com opção de correção rápida
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Wrench, 
  ChevronDown, 
  ChevronUp,
  X,
  RefreshCw,
  Shield,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AuditIssue, AuditResult } from '@/lib/character-audit-engine';
import { cn } from '@/lib/utils';

interface MobileAuditBannerProps {
  auditResult: AuditResult | null;
  visibleIssues: AuditIssue[];
  counts: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
    autoFixable: number;
  };
  isAuditing: boolean;
  isFixing: boolean;
  onAutoFix: () => Promise<{ success: boolean; message: string }>;
  onDismiss: (issueId: string) => void;
  onRerunAudit: () => void;
}

// Configuração por severidade - cores e ícones
const SEVERITY_CONFIG = {
  error: {
    icon: AlertCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
  },
  info: {
    icon: Info,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/30',
  },
};

// Ícones por categoria de problema
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sanity: Shield,
  transcender: Sparkles,
  hp: AlertCircle,
  pe: AlertCircle,
  defense: Shield,
  skills: Info,
  powers: Sparkles,
  records: AlertTriangle,
};

export function MobileAuditBanner({
  auditResult,
  visibleIssues,
  counts,
  isAuditing,
  isFixing,
  onAutoFix,
  onDismiss,
  onRerunAudit,
}: MobileAuditBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [fixMessage, setFixMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Estado de loading durante auditoria
  if (isAuditing) {
    return (
      <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-muted/50 border border-muted">
        <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Auditando...</span>
      </div>
    );
  }
  
  // Sem problemas = não exibe nada
  if (!auditResult || counts.total === 0) {
    return null;
  }
  
  // Determina severidade mais alta para cor do banner
  const highestSeverity = counts.errors > 0 ? 'error' : counts.warnings > 0 ? 'warning' : 'info';
  const config = SEVERITY_CONFIG[highestSeverity];
  
  // Handler de correção automática
  const handleAutoFix = async () => {
    setFixMessage(null);
    const result = await onAutoFix();
    setFixMessage({
      type: result.success ? 'success' : 'error',
      text: result.message,
    });
    
    // Limpa mensagem após 4 segundos
    setTimeout(() => setFixMessage(null), 4000);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-lg border overflow-hidden",
        config.borderColor,
        config.bgColor
      )}
    >
      {/* Header compacto */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 active:bg-black/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <config.icon className={cn("w-4 h-4", config.color)} />
          <span className="text-xs font-medium">
            {counts.total} problema{counts.total !== 1 ? 's' : ''}
          </span>
          
          {/* Badges compactas */}
          <div className="flex items-center gap-1">
            {counts.errors > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-destructive/20 text-destructive rounded">
                {counts.errors}
              </span>
            )}
            {counts.warnings > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-warning/20 text-warning rounded">
                {counts.warnings}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          {/* Botão de correção rápida (quando colapsado) */}
          {counts.autoFixable > 0 && !isExpanded && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleAutoFix();
              }}
              disabled={isFixing}
              className="h-6 px-2 text-[10px] gap-1"
            >
              <Wrench className={cn("w-3 h-3", isFixing && 'animate-spin')} />
              Corrigir
            </Button>
          )}
          
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>
      
      {/* Mensagem de resultado */}
      <AnimatePresence>
        {fixMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "px-2 py-1.5 text-[10px] flex items-center gap-1.5",
              fixMessage.type === 'success' 
                ? 'bg-success/10 text-success' 
                : 'bg-destructive/10 text-destructive'
            )}
          >
            {fixMessage.type === 'success' ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            {fixMessage.text}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Lista expandida de problemas */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-inherit"
          >
            <div className="p-2 space-y-2">
              {/* Ações */}
              <div className="flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onRerunAudit}
                  className="h-6 px-2 text-[10px] gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Re-auditar
                </Button>
                
                {counts.autoFixable > 0 && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleAutoFix}
                    disabled={isFixing}
                    className="h-6 px-2 text-[10px] gap-1"
                  >
                    <Wrench className={cn("w-3 h-3", isFixing && 'animate-spin')} />
                    Corrigir {counts.autoFixable}
                  </Button>
                )}
              </div>
              
              {/* Lista de problemas */}
              <ScrollArea className="max-h-48">
                <div className="space-y-1.5">
                  {visibleIssues.map((issue) => {
                    const severityConfig = SEVERITY_CONFIG[issue.severity];
                    const CategoryIcon = CATEGORY_ICONS[issue.category] || AlertCircle;
                    
                    return (
                      <div 
                        key={issue.id} 
                        className={cn(
                          "p-2 rounded-lg border",
                          severityConfig.bgColor,
                          severityConfig.borderColor
                        )}
                      >
                        {/* Header do problema */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <CategoryIcon className={cn("w-3 h-3 flex-shrink-0", severityConfig.color)} />
                            <span className="text-xs font-medium truncate">
                              {issue.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {issue.autoFixable && (
                              <Wrench className="w-3 h-3 text-muted-foreground" />
                            )}
                            <button
                              onClick={() => onDismiss(issue.id)}
                              className="p-0.5 hover:bg-background/50 rounded"
                            >
                              <X className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Descrição */}
                        <p className="text-[10px] text-muted-foreground mb-1.5 line-clamp-2">
                          {issue.description}
                        </p>
                        
                        {/* Valores atual vs esperado */}
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className="text-muted-foreground">
                            Atual: <strong className={severityConfig.color}>{String(issue.currentValue)}</strong>
                          </span>
                          <span className="text-muted-foreground">
                            Esperado: <strong className="text-success">{String(issue.expectedValue)}</strong>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              
              {/* Resumo de Transcender compacto */}
              {auditResult?.transcender && auditResult.transcender.powersTotal > 0 && (
                <div className="p-2 rounded-lg bg-paranormal/5 border border-paranormal/20">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-3 h-3 text-paranormal" />
                    <span className="text-xs font-medium">Transcender</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                    <span>Slots: <strong>{auditResult.transcender.slotsUsed}/{auditResult.transcender.slotsTotal}</strong></span>
                    <span>Origem: <strong>{auditResult.transcender.powersFromOrigin}</strong></span>
                    <span>Total: <strong className={auditResult.transcender.excessPowers > 0 ? 'text-destructive' : ''}>
                      {auditResult.transcender.powersTotal}
                    </strong></span>
                    {auditResult.transcender.excessPowers > 0 && (
                      <span className="text-destructive">⚠️ +{auditResult.transcender.excessPowers} excesso</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

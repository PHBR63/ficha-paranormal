/**
 * Banner de Auditoria de Personagem
 * 
 * Exibe alertas quando problemas são detectados no personagem,
 * permitindo correção automática ou revisão manual.
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
  Sparkles,
  Trash2,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomScroll } from '@/components/ui/custom-scroll';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { AuditIssue, AuditResult } from '@/lib/character-audit-engine';
import confetti from 'canvas-confetti';

interface CharacterAuditBannerProps {
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
  /** Callback para ações manuais de correção (ex: abrir modal de remoção de poderes) */
  onManualFix?: (issueCategory: string, issueId?: string) => void;
  className?: string;
}

// Ícones e cores por severidade
const SEVERITY_CONFIG = {
  error: {
    icon: AlertCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
    badgeVariant: 'destructive' as const,
    label: 'Erro',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    badgeVariant: 'warning' as const,
    label: 'Aviso',
  },
  info: {
    icon: Info,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/30',
    badgeVariant: 'secondary' as const,
    label: 'Info',
  },
};

// Ícones por categoria
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sanity: Shield,
  transcender: Sparkles,
  rituals: BookOpen,
  hp: AlertCircle,
  pe: AlertCircle,
  defense: Shield,
  skills: Info,
  skill_training: GraduationCap,
  powers: Sparkles,
  records: AlertTriangle,
};

// Cores específicas por categoria (sobrescrevem as cores de severidade para diferenciação visual)
const CATEGORY_COLORS: Record<string, { color: string; bgColor: string; borderColor: string }> = {
  transcender: {
    color: 'text-paranormal',
    bgColor: 'bg-paranormal/10',
    borderColor: 'border-paranormal/30',
  },
  rituals: {
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
  sanity: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  hp: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
  pe: {
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
  },
  defense: {
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  skill_training: {
    color: 'text-pe',
    bgColor: 'bg-pe/10',
    borderColor: 'border-pe/30',
  },
};

// Descrições explicativas por categoria para tooltips
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  sanity: 'Sanidade - Problemas relacionados aos pontos de sanidade do personagem',
  transcender: 'Poderes Paranormais - Problemas com poderes de Transcender ou afinidades elementais',
  rituals: 'Rituais - Problemas relacionados à quantidade ou requisitos de rituais',
  hp: 'Pontos de Vida - Problemas com cálculo ou valores de PV',
  pe: 'Pontos de Esforço - Problemas com cálculo ou valores de PE',
  defense: 'Defesa - Problemas com o cálculo de defesa do personagem',
  skills: 'Perícias - Problemas com distribuição ou valores de perícias',
  skill_training: 'Treinamento de Perícias - Problemas com níveis (Veterano/Expert) ou quantidade de perícias treinadas',
  powers: 'Poderes Gerais - Problemas com poderes de classe ou origem',
  records: 'Registros - Inconsistências nos registros do personagem',
};

export function CharacterAuditBanner({
  auditResult,
  visibleIssues,
  counts,
  isAuditing,
  isFixing,
  onAutoFix,
  onDismiss,
  onRerunAudit,
  onManualFix,
  className = '',
}: CharacterAuditBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [fixMessage, setFixMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Se não há problemas ou está auditando, não exibe
  if (isAuditing) {
    return (
      <div className={`flex items-center justify-center gap-2 p-3 rounded-lg bg-muted/50 border border-muted ${className}`}>
        <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Auditando personagem...</span>
      </div>
    );
  }
  
  if (!auditResult || counts.total === 0) {
    return null;
  }
  
  // Determina a severidade mais alta para o banner principal
  const highestSeverity = counts.errors > 0 ? 'error' : counts.warnings > 0 ? 'warning' : 'info';
  const config = SEVERITY_CONFIG[highestSeverity];
  
  const handleAutoFix = async () => {
    setFixMessage(null);
    const result = await onAutoFix();
    setFixMessage({
      type: result.success ? 'success' : 'error',
      text: result.message,
    });
    
    // Feedback visual de sucesso com confetti e toast
    if (result.success) {
      // Dispara confetti celebratório
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.3 },
        colors: ['#22c55e', '#10b981', '#34d399', '#6ee7b7'],
      });
      
      // Toast de sucesso
      toast({
        title: '✅ Correção aplicada!',
        description: result.message,
        duration: 4000,
      });
    } else {
      // Toast de erro
      toast({
        title: '❌ Erro na correção',
        description: result.message,
        variant: 'destructive',
        duration: 5000,
      });
    }
    
    // Limpa mensagem após 5 segundos
    setTimeout(() => setFixMessage(null), 5000);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border ${config.borderColor} ${config.bgColor} ${className}`}
    >
      {/* Header do Banner */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-black/5 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-3">
          <config.icon className={`w-5 h-5 ${config.color}`} />
          <div className="text-left">
            <span className="font-medium text-sm">
              {counts.total} problema{counts.total !== 1 ? 's' : ''} encontrado{counts.total !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              {counts.errors > 0 && (
                <Badge variant="destructive" className="text-xs h-5">
                  {counts.errors} erro{counts.errors !== 1 ? 's' : ''}
                </Badge>
              )}
              {counts.warnings > 0 && (
                <Badge variant="outline" className="text-xs h-5 bg-warning/20 text-warning border-warning/30">
                  {counts.warnings} aviso{counts.warnings !== 1 ? 's' : ''}
                </Badge>
              )}
              {counts.info > 0 && (
                <Badge variant="secondary" className="text-xs h-5">
                  {counts.info} info
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {counts.autoFixable > 0 && !isExpanded && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAutoFix();
                    }}
                    disabled={isFixing}
                    className="h-7 text-xs gap-1"
                  >
                    <Wrench className={`w-3 h-3 ${isFixing ? 'animate-spin' : ''}`} />
                    Corrigir ({counts.autoFixable})
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Corrigir automaticamente {counts.autoFixable} problema{counts.autoFixable !== 1 ? 's' : ''}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>
      
      {/* Mensagem de correção */}
      <AnimatePresence>
        {fixMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`px-3 py-2 text-sm flex items-center gap-2 ${
              fixMessage.type === 'success' 
                ? 'bg-success/10 text-success' 
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {fixMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {fixMessage.text}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Lista de Problemas (expandida) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-inherit"
          >
            <div className="p-3 space-y-3">
              {/* Ações */}
              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onRerunAudit}
                  className="h-7 text-xs gap-1"
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
                    className="h-7 text-xs gap-1"
                  >
                    <Wrench className={`w-3 h-3 ${isFixing ? 'animate-spin' : ''}`} />
                    Corrigir {counts.autoFixable} problema{counts.autoFixable !== 1 ? 's' : ''}
                  </Button>
                )}
              </div>
              
              {/* Lista de problemas com scroll visível */}
              <CustomScroll maxHeight="calc(50vh - 140px)" className="pr-1">
                <div className="space-y-2 pr-2">
                  {visibleIssues.map((issue) => {
                    const severityConfig = SEVERITY_CONFIG[issue.severity];
                    const CategoryIcon = CATEGORY_ICONS[issue.category] || AlertCircle;
                    // Usa cores da categoria se disponível, senão usa severidade
                    const categoryColors = CATEGORY_COLORS[issue.category];
                    const cardBg = categoryColors?.bgColor || severityConfig.bgColor;
                    const cardBorder = categoryColors?.borderColor || severityConfig.borderColor;
                    const iconColor = categoryColors?.color || severityConfig.color;
                    const categoryTooltip = CATEGORY_DESCRIPTIONS[issue.category] || issue.category;
                    
                      return (
                        <Card 
                          key={issue.id} 
                          className={`${cardBg} ${cardBorder} transition-all duration-200 hover:scale-[1.01] hover:shadow-md hover:border-opacity-60`}
                        >
                        <CardHeader className="p-3 pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help">
                                      <CategoryIcon className={`w-4 h-4 ${iconColor}`} />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent 
                                    side="top" 
                                    className="max-w-xs animate-in fade-in-0 zoom-in-95 duration-200"
                                  >
                                    <p className="text-xs">{categoryTooltip}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <CardTitle className="text-sm font-medium">
                                {issue.title}
                              </CardTitle>
                            </div>
                            <div className="flex items-center gap-1">
                              {issue.autoFixable && (
                                <Badge variant="outline" className="text-xs h-5 gap-1">
                                  <Wrench className="w-3 h-3" />
                                  Auto
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onDismiss(issue.id)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <p className="text-xs text-muted-foreground mb-2">
                            {issue.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-muted-foreground">
                              Atual: <strong className={severityConfig.color}>{String(issue.currentValue)}</strong>
                            </span>
                            <span className="text-muted-foreground">
                              Esperado: <strong className="text-success">{String(issue.expectedValue)}</strong>
                            </span>
                          </div>
                          {issue.fixAction && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              💡 {issue.fixAction}
                            </p>
                          )}
                          {/* Botão de ação manual para problemas não auto-corrigíveis */}
                          {!issue.autoFixable && (issue.category === 'transcender' || issue.category === 'rituals' || issue.category === 'skill_training') && onManualFix && (
                            <Button
                              size="sm"
                              variant={issue.category === 'skill_training' ? 'default' : 'destructive'}
                              onClick={() => onManualFix(issue.category, issue.id)}
                              className="mt-2 h-7 text-xs gap-1"
                            >
                              {issue.category === 'rituals' ? (
                                <BookOpen className="w-3 h-3" />
                              ) : issue.category === 'skill_training' ? (
                                <GraduationCap className="w-3 h-3" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                              {issue.category === 'transcender' ? 'Remover Poderes' : 
                               issue.category === 'rituals' ? 'Remover Rituais' : 
                               'Configurar Perícias'}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CustomScroll>
              
              {/* Resumo de Transcender (se houver dados) */}
              {auditResult?.transcender && auditResult.transcender.powersTotal > 0 && (
                <Card className="bg-paranormal/5 border-paranormal/20">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-paranormal" />
                      Resumo de Transcender
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Slots totais:</span>{' '}
                        <strong>{auditResult.transcender.slotsTotal}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Slots usados:</span>{' '}
                        <strong>{auditResult.transcender.slotsUsed}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Poderes de origem:</span>{' '}
                        <strong>{auditResult.transcender.powersFromOrigin}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total de poderes:</span>{' '}
                        <strong className={auditResult.transcender.excessPowers > 0 ? 'text-destructive' : ''}>
                          {auditResult.transcender.powersTotal}
                        </strong>
                      </div>
                    </div>
                    {auditResult.transcender.excessPowers > 0 && (
                      <p className="text-xs text-destructive mt-2">
                        ⚠️ {auditResult.transcender.excessPowers} poder(es) excedente(s)
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Modal de Correção Automática de Validação
 * 
 * Exibe problemas detectados pelo validateCharacter com opção de
 * aplicar correções automáticas para problemas auto-corrigíveis.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Wrench,
  ChevronRight,
  Shield,
  Sparkles,
  BookOpen,
  Swords,
  Zap,
  X,
  RefreshCw,
  Check,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import type { ValidationIssue, ValidationResult, SuggestedFix } from '@/lib/rules-engine/types';
import confetti from 'canvas-confetti';

// ========================================
// TIPOS
// ========================================

interface ValidationAutoFixModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  validationResult: ValidationResult | null;
  onApplyFixes: (fixes: ApplicableFix[]) => Promise<ApplyFixesResult>;
  onRefresh?: () => void;
  isApplying?: boolean;
  characterName?: string;
}

export interface ApplicableFix {
  ruleId: string;
  field: string;
  action: SuggestedFix['action'];
  value?: unknown;
  description: string;
}

export interface ApplyFixesResult {
  success: boolean;
  appliedCount: number;
  failedCount: number;
  errors: string[];
}

// ========================================
// CONFIGURAÇÕES DE SEVERIDADE
// ========================================

const SEVERITY_CONFIG = {
  error: {
    icon: AlertCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
    label: 'Erro',
    badgeVariant: 'destructive' as const,
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    label: 'Aviso',
    badgeVariant: 'outline' as const,
  },
  info: {
    icon: Info,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/30',
    label: 'Info',
    badgeVariant: 'secondary' as const,
  },
};

// Ícones por categoria de regra
const RULE_CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'attributes': Zap,
  'skills': BookOpen,
  'powers': Sparkles,
  'rituals': BookOpen,
  'defense': Shield,
  'combat': Swords,
  'resources': AlertCircle,
};

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

export function ValidationAutoFixModal({
  open,
  onOpenChange,
  validationResult,
  onApplyFixes,
  onRefresh,
  isApplying = false,
  characterName,
}: ValidationAutoFixModalProps) {
  const [selectedFixes, setSelectedFixes] = useState<Set<string>>(new Set());
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const [applyResult, setApplyResult] = useState<ApplyFixesResult | null>(null);

  // Separar issues por tipo
  const { autoFixable, manual, fixableIssues } = useMemo(() => {
    if (!validationResult) {
      return { autoFixable: [], manual: [], fixableIssues: [] };
    }

    const autoFixable = validationResult.issues.filter(
      i => i.autoFixable && i.suggestedFix
    );
    const manual = validationResult.issues.filter(i => !i.autoFixable);
    const fixableIssues = autoFixable;

    return { autoFixable, manual, fixableIssues };
  }, [validationResult]);

  // Selecionar/deselecionar todas
  const toggleSelectAll = () => {
    if (selectedFixes.size === fixableIssues.length) {
      setSelectedFixes(new Set());
    } else {
      setSelectedFixes(new Set(fixableIssues.map(i => i.ruleId)));
    }
  };

  // Toggle individual
  const toggleFix = (ruleId: string) => {
    const newSet = new Set(selectedFixes);
    if (newSet.has(ruleId)) {
      newSet.delete(ruleId);
    } else {
      newSet.add(ruleId);
    }
    setSelectedFixes(newSet);
  };

  // Toggle expansão
  const toggleExpand = (ruleId: string) => {
    const newSet = new Set(expandedRules);
    if (newSet.has(ruleId)) {
      newSet.delete(ruleId);
    } else {
      newSet.add(ruleId);
    }
    setExpandedRules(newSet);
  };

  // Aplicar correções selecionadas
  const handleApplyFixes = async () => {
    const fixesToApply: ApplicableFix[] = fixableIssues
      .filter(i => selectedFixes.has(i.ruleId) && i.suggestedFix)
      .map(i => ({
        ruleId: i.ruleId,
        field: i.suggestedFix!.field,
        action: i.suggestedFix!.action,
        value: i.suggestedFix!.value,
        description: i.suggestedFix!.description,
      }));

    if (fixesToApply.length === 0) {
      toast({
        title: 'Nenhuma correção selecionada',
        description: 'Selecione pelo menos uma correção para aplicar.',
        variant: 'destructive',
      });
      return;
    }

    const result = await onApplyFixes(fixesToApply);
    setApplyResult(result);

    if (result.success && result.appliedCount > 0) {
      // Confetti de sucesso
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.4 },
        colors: ['#22c55e', '#10b981', '#34d399', '#6ee7b7'],
      });

      toast({
        title: '✅ Correções aplicadas!',
        description: `${result.appliedCount} correção(ões) aplicada(s) com sucesso.`,
        duration: 4000,
      });

      // Limpa seleção
      setSelectedFixes(new Set());

      // Fecha modal após delay
      setTimeout(() => {
        onOpenChange(false);
        setApplyResult(null);
      }, 1500);
    } else if (result.errors.length > 0) {
      toast({
        title: '❌ Erro ao aplicar correções',
        description: result.errors.join(', '),
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  // Obter ícone baseado na regra
  const getRuleIcon = (ruleId: string) => {
    const category = ruleId.split('-')[0];
    return RULE_CATEGORY_ICONS[category] || AlertCircle;
  };

  // Sem resultado de validação
  if (!validationResult) {
    return null;
  }

  const hasIssues = validationResult.issues.length > 0;
  const allSelected = selectedFixes.size === fixableIssues.length && fixableIssues.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            Correção Automática
            {characterName && (
              <span className="text-muted-foreground font-normal text-sm">
                - {characterName}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {hasIssues
              ? `${validationResult.errorCount} erro(s) e ${validationResult.warningCount} aviso(s) encontrados.`
              : 'Nenhum problema encontrado no personagem.'}
          </DialogDescription>
        </DialogHeader>

        {/* Corpo do Modal com layout flex para scroll adequado */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Estatísticas - header fixo */}
          <div className="flex items-center gap-3 mb-4 flex-shrink-0">
            {validationResult.errorCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationResult.errorCount} erros
              </Badge>
            )}
            {validationResult.warningCount > 0 && (
              <Badge variant="outline" className="gap-1 bg-warning/20 text-warning border-warning/30">
                <AlertTriangle className="w-3 h-3" />
                {validationResult.warningCount} avisos
              </Badge>
            )}
            {fixableIssues.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Wrench className="w-3 h-3" />
                {fixableIssues.length} auto-corrigíveis
              </Badge>
            )}
          </div>

          {/* Seleção rápida - header fixo */}
          {fixableIssues.length > 0 && (
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/50 flex-shrink-0">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Checkbox checked={allSelected} />
                <span>
                  {allSelected ? 'Desselecionar todas' : 'Selecionar todas'}
                </span>
              </button>
              {selectedFixes.size > 0 && (
                <span className="text-xs text-muted-foreground">
                  {selectedFixes.size} selecionada(s)
                </span>
              )}
            </div>
          )}

          {/* Lista de Issues - área scrollável que preenche o espaço restante */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-2">
            <div className="space-y-2">
              {/* Auto-corrigíveis */}
              {fixableIssues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Correções Automáticas
                  </h4>
                  {fixableIssues.map((issue) => (
                    <IssueCard
                      key={issue.ruleId}
                      issue={issue}
                      selected={selectedFixes.has(issue.ruleId)}
                      expanded={expandedRules.has(issue.ruleId)}
                      onToggleSelect={() => toggleFix(issue.ruleId)}
                      onToggleExpand={() => toggleExpand(issue.ruleId)}
                      showCheckbox
                    />
                  ))}
                </div>
              )}

              {/* Manuais */}
              {manual.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Revisão Manual Necessária
                  </h4>
                  {manual.map((issue) => (
                    <IssueCard
                      key={issue.ruleId}
                      issue={issue}
                      selected={false}
                      expanded={expandedRules.has(issue.ruleId)}
                      onToggleSelect={() => {}}
                      onToggleExpand={() => toggleExpand(issue.ruleId)}
                      showCheckbox={false}
                    />
                  ))}
                </div>
              )}

              {/* Sem problemas */}
              {!hasIssues && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-success mb-3" />
                  <h3 className="font-medium text-lg">Tudo em ordem!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    O personagem está em conformidade com todas as regras.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="gap-2 sm:gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isApplying}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Revalidar
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isApplying}
          >
            Fechar
          </Button>

          {selectedFixes.size > 0 && (
            <Button
              onClick={handleApplyFixes}
              disabled={isApplying || selectedFixes.size === 0}
            >
              {isApplying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  Aplicando...
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4 mr-1" />
                  Aplicar {selectedFixes.size} correção(ões)
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ========================================
// COMPONENTE DE CARD DE ISSUE
// ========================================

interface IssueCardProps {
  issue: ValidationIssue;
  selected: boolean;
  expanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  showCheckbox: boolean;
}

function IssueCard({
  issue,
  selected,
  expanded,
  onToggleSelect,
  onToggleExpand,
  showCheckbox,
}: IssueCardProps) {
  const config = SEVERITY_CONFIG[issue.severity];
  const Icon = config.icon;

  return (
    <Card
      className={`transition-all duration-200 ${
        selected ? 'ring-2 ring-primary/50' : ''
      } ${config.bgColor} ${config.borderColor}`}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start gap-3">
          {showCheckbox && (
            <Checkbox
              checked={selected}
              onCheckedChange={onToggleSelect}
              className="mt-0.5"
            />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 ${config.color} shrink-0`} />
              <CardTitle className="text-sm font-medium truncate">
                {issue.message}
              </CardTitle>
            </div>
            
            {issue.path && (
              <p className="text-xs text-muted-foreground mt-1">
                Campo: <code className="bg-muted px-1 py-0.5 rounded">{issue.path}</code>
              </p>
            )}
          </div>

          <button
            onClick={onToggleExpand}
            className="p-1 hover:bg-black/10 rounded transition-colors shrink-0"
          >
            <ChevronRight
              className={`w-4 h-4 text-muted-foreground transition-transform ${
                expanded ? 'rotate-90' : ''
              }`}
            />
          </button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {expanded && issue.suggestedFix && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="p-3 pt-0 border-t border-inherit mt-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {issue.suggestedFix.action}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {issue.suggestedFix.field}
                  </span>
                </div>
                
                <p className="text-sm">
                  💡 {issue.suggestedFix.description}
                </p>
                
                {issue.suggestedFix.value !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    Novo valor:{' '}
                    <code className="bg-muted px-1 py-0.5 rounded">
                      {String(issue.suggestedFix.value)}
                    </code>
                  </p>
                )}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default ValidationAutoFixModal;

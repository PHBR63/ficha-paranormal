/**
 * SUE DevTools Panel
 * Painel de desenvolvimento para visualizar dados de hardening do SUE
 * 
 * Exibe:
 * - Ordem de aplicação completa
 * - Breakdowns de stacking por categoria
 * - Todos os efeitos preparados
 * - Metadados de processamento
 * 
 * @module components/dev/SUEDevToolsPanel
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bug, 
  Layers, 
  ArrowDownUp, 
  Clock, 
  ChevronDown, 
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Zap,
  Shield,
  Swords,
  Heart,
  Brain,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  EFFECT_APPLICATION_ORDER,
  STACKING_RULES,
  type PreparedEffect,
  type PreprocessResult,
  type BonusCategory,
  type EffectSource,
} from '@/lib/sue';

// ========================================
// TIPOS
// ========================================

interface SUEDevToolsPanelProps {
  /** Resultado do pré-processamento do SUE */
  hardeningData: PreprocessResult | null;
  /** Se está expandido ou minimizado */
  defaultExpanded?: boolean;
  /** Classe CSS adicional */
  className?: string;
  /** Controle externo: se deve estar visível (respeitando modo desenvolvedor) */
  isDeveloperMode?: boolean;
}

// ========================================
// CONSTANTES DE VISUALIZAÇÃO
// ========================================

/** Mapeamento de fontes para cores (usando tokens semânticos via classes) */
const SOURCE_COLORS: Record<EffectSource, string> = {
  skill_training: 'bg-muted-foreground/80',
  origin: 'bg-primary/80',
  class_ability: 'bg-accent/80',
  class_power: 'bg-accent',
  track: 'bg-secondary-foreground/70',
  general_power: 'bg-primary/60',
  paranormal_power: 'bg-destructive/70',
  equipment: 'bg-primary/70',
  ritual: 'bg-accent/70',
  condition: 'bg-destructive',
};

/** Mapeamento de fontes para labels */
const SOURCE_LABELS: Record<EffectSource, string> = {
  skill_training: 'Treino',
  origin: 'Origem',
  class_ability: 'Hab. Classe',
  class_power: 'Poder Classe',
  track: 'Trilha',
  general_power: 'Poder Geral',
  paranormal_power: 'Paranormal',
  equipment: 'Equipamento',
  ritual: 'Ritual',
  condition: 'Condição',
};

/** Mapeamento de categorias para ícones */
const CATEGORY_ICONS: Record<BonusCategory, React.ReactNode> = {
  attack: <Swords className="h-3 w-3" />,
  damage: <Zap className="h-3 w-3" />,
  defense: <Shield className="h-3 w-3" />,
  resistance: <Shield className="h-3 w-3" />,
  skill: <Brain className="h-3 w-3" />,
  resource: <Heart className="h-3 w-3" />,
  movement: <ArrowDownUp className="h-3 w-3" />,
  initiative: <Clock className="h-3 w-3" />,
  critical: <AlertCircle className="h-3 w-3" />,
  damage_reduction: <Shield className="h-3 w-3" />,
  special: <Zap className="h-3 w-3" />,
};

// ========================================
// COMPONENTES AUXILIARES
// ========================================

/** Badge de fonte colorido */
function SourceBadge({ source }: { source: EffectSource }) {
  return (
    <Badge 
      variant="secondary" 
      className={`${SOURCE_COLORS[source]} text-white text-[10px] px-1.5 py-0`}
    >
      {SOURCE_LABELS[source]}
    </Badge>
  );
}

/** Indicador de status de aplicação */
function ApplicationStatus({ applied, excluded }: { applied: boolean; excluded?: boolean }) {
  if (excluded) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <XCircle className="h-3.5 w-3.5 text-destructive" />
          </TooltipTrigger>
          <TooltipContent>Excluído por stacking</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return applied ? (
    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
  ) : (
    <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
  );
}

/** Seção de ordem de aplicação */
function ApplicationOrderSection() {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Ordem de Aplicação (10 Passos)
      </h4>
      <div className="grid grid-cols-2 gap-1">
        {EFFECT_APPLICATION_ORDER.map((source, index) => (
          <div 
            key={source}
            className="flex items-center gap-2 p-1.5 rounded bg-muted/30"
          >
            <span className="text-[10px] font-mono text-muted-foreground w-4">
              {index + 1}.
            </span>
            <SourceBadge source={source} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Seção de regras de stacking */
function StackingRulesSection() {
  const [expanded, setExpanded] = useState<EffectSource | null>(null);
  
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Regras de Stacking por Fonte
      </h4>
      <div className="space-y-1">
        {(Object.entries(STACKING_RULES) as [EffectSource, typeof STACKING_RULES[EffectSource]][]).map(
          ([source, config]) => (
            <Collapsible
              key={source}
              open={expanded === source}
              onOpenChange={(open) => setExpanded(open ? source : null)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-1.5 rounded hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <SourceBadge source={source} />
                  <span className="text-xs text-muted-foreground">
                    {config.defaultRule}
                  </span>
                </div>
                {expanded === source ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pl-4 py-1 space-y-1 text-xs">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">Stack consigo:</span>
                    <span>{config.sameInstanceStacks ? 'Sim' : 'Não'}</span>
                  </div>
                  {config.categoryOverrides && (
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground">Overrides:</span>
                      {Object.entries(config.categoryOverrides).map(([cat, rule]) => (
                        <div key={cat} className="flex gap-2 pl-2">
                          <span className="font-mono text-[10px]">{cat}:</span>
                          <span className="text-[10px]">{rule}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {config.maxStacks && (
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">Max Stacks:</span>
                      <span>{config.maxStacks}</span>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        )}
      </div>
    </div>
  );
}

/** Lista de efeitos preparados */
function PreparedEffectsSection({ effects }: { effects: PreparedEffect[] }) {
  const [filter, setFilter] = useState<EffectSource | 'all'>('all');
  
  const filtered = useMemo(() => {
    if (filter === 'all') return effects;
    return effects.filter(e => e.source === filter);
  }, [effects, filter]);
  
  const grouped = useMemo(() => {
    const map = new Map<EffectSource, PreparedEffect[]>();
    for (const effect of filtered) {
      const existing = map.get(effect.source) ?? [];
      map.set(effect.source, [...existing, effect]);
    }
    return map;
  }, [filtered]);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Efeitos Preparados ({effects.length})
        </h4>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as EffectSource | 'all')}
          className="text-[10px] bg-muted border-none rounded px-1 py-0.5"
        >
          <option value="all">Todos</option>
          {EFFECT_APPLICATION_ORDER.map(source => (
            <option key={source} value={source}>{SOURCE_LABELS[source]}</option>
          ))}
        </select>
      </div>
      
      <ScrollArea className="h-[200px]">
        <div className="space-y-2 pr-2">
          {Array.from(grouped.entries()).map(([source, sourceEffects]) => (
            <div key={source} className="space-y-1">
              <div className="flex items-center gap-2">
                <SourceBadge source={source} />
                <span className="text-[10px] text-muted-foreground">
                  ({sourceEffects.length})
                </span>
              </div>
              <div className="pl-2 space-y-0.5">
                {sourceEffects.map(effect => (
                  <div 
                    key={effect.id}
                    className="flex items-center justify-between p-1 rounded bg-muted/20 text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <ApplicationStatus 
                        applied={effect.stackingApplied} 
                        excluded={(effect.excludedByStacking?.length ?? 0) > 0}
                      />
                      <span className="truncate">{effect.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      #{effect.applicationOrder}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

/** Seção de breakdowns de stacking */
function StackingBreakdownsSection({ 
  breakdowns 
}: { 
  breakdowns: Map<BonusCategory, { applied: unknown[]; excluded: unknown[] }> 
}) {
  const entries = Array.from(breakdowns.entries());
  
  if (entries.length === 0) {
    return (
      <div className="text-xs text-muted-foreground text-center py-4">
        Nenhum breakdown disponível
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Breakdowns por Categoria
      </h4>
      <div className="space-y-1">
        {entries.map(([category, result]) => (
          <div 
            key={category}
            className="flex items-center justify-between p-1.5 rounded bg-muted/30"
          >
            <div className="flex items-center gap-2">
              {CATEGORY_ICONS[category]}
              <span className="text-xs capitalize">{category}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] px-1 py-0 text-primary">
                ✓ {result.applied.length}
              </Badge>
              {result.excluded.length > 0 && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 text-destructive">
                  ✗ {result.excluded.length}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Seção de efeitos excluídos */
function ExcludedEffectsSection({ 
  excluded 
}: { 
  excluded: PreprocessResult['excludedEffects'] 
}) {
  if (excluded.length === 0) {
    return (
      <div className="text-xs text-muted-foreground text-center py-4">
        Nenhum efeito foi excluído por stacking
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <XCircle className="h-3.5 w-3.5 text-destructive" />
        Efeitos Excluídos ({excluded.length})
      </h4>
      <div className="space-y-1">
        {excluded.map((item, idx) => (
          <div 
            key={idx}
            className="p-2 rounded bg-destructive/10 border border-destructive/20 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{item.effect.name}</span>
              <SourceBadge source={item.effect.source} />
            </div>
            <div className="mt-1 text-muted-foreground">
              <span>Motivo: {item.reason}</span>
              <span className="ml-2">→ {item.replacedBy}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Seção de metadados */
function MetadataSection({ metadata }: { metadata: PreprocessResult['metadata'] }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(metadata, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Metadados de Processamento
        </h4>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-5 w-5 p-0"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3 w-3 text-primary" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded bg-muted/30">
          <span className="text-muted-foreground">Recebidos</span>
          <div className="font-mono font-medium">{metadata.totalReceived}</div>
        </div>
        <div className="p-2 rounded bg-muted/30">
          <span className="text-muted-foreground">Após Ordenar</span>
          <div className="font-mono font-medium">{metadata.totalAfterOrdering}</div>
        </div>
        <div className="p-2 rounded bg-muted/30">
          <span className="text-muted-foreground">Após Stacking</span>
          <div className="font-mono font-medium">{metadata.totalAfterStacking}</div>
        </div>
        <div className="p-2 rounded bg-muted/30">
          <span className="text-muted-foreground">Tempo</span>
          <div className="font-mono font-medium">
            {metadata.processingTimeMs.toFixed(2)}ms
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

export function SUEDevToolsPanel({ 
  hardeningData,
  defaultExpanded = false,
  className = '',
  isDeveloperMode = false
}: SUEDevToolsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isVisible, setIsVisible] = useState(true);
  
  // Só renderiza se modo desenvolvedor estiver ativo
  // Em produção, também oculta por segurança
  if (import.meta.env.PROD || !isDeveloperMode) {
    return null;
  }
  
  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 h-8 px-2 bg-background/80 backdrop-blur"
        onClick={() => setIsVisible(true)}
      >
        <Bug className="h-4 w-4 mr-1" />
        SUE
      </Button>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed bottom-4 right-4 z-50 bg-background/95 backdrop-blur border rounded-lg shadow-xl ${className}`}
      style={{ width: isExpanded ? '400px' : '140px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium">SUE DevTools</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <Layers className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={() => setIsVisible(false)}
          >
            <EyeOff className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {/* Conteúdo */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {hardeningData ? (
              <Tabs defaultValue="effects" className="w-full">
                <TabsList className="w-full justify-start px-2 py-1 h-8 bg-transparent border-b rounded-none">
                  <TabsTrigger value="effects" className="text-[10px] px-2 py-1 h-6">
                    Efeitos
                  </TabsTrigger>
                  <TabsTrigger value="stacking" className="text-[10px] px-2 py-1 h-6">
                    Stacking
                  </TabsTrigger>
                  <TabsTrigger value="order" className="text-[10px] px-2 py-1 h-6">
                    Ordem
                  </TabsTrigger>
                  <TabsTrigger value="excluded" className="text-[10px] px-2 py-1 h-6">
                    Excluídos
                  </TabsTrigger>
                </TabsList>
                
                <div className="p-3 max-h-[400px] overflow-auto">
                  <TabsContent value="effects" className="mt-0 space-y-4">
                    <MetadataSection metadata={hardeningData.metadata} />
                    <PreparedEffectsSection effects={hardeningData.effects} />
                  </TabsContent>
                  
                  <TabsContent value="stacking" className="mt-0 space-y-4">
                    <StackingBreakdownsSection breakdowns={hardeningData.stackingBreakdowns} />
                    <StackingRulesSection />
                  </TabsContent>
                  
                  <TabsContent value="order" className="mt-0">
                    <ApplicationOrderSection />
                  </TabsContent>
                  
                  <TabsContent value="excluded" className="mt-0">
                    <ExcludedEffectsSection excluded={hardeningData.excludedEffects} />
                  </TabsContent>
                </div>
              </Tabs>
            ) : (
              <div className="p-4 text-center text-xs text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum dado de hardening disponível.</p>
                <p className="mt-1">Carregue um personagem para visualizar.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mini-status quando colapsado */}
      {!isExpanded && hardeningData && (
        <div className="p-2 text-[10px] text-muted-foreground">
          <div className="flex justify-between">
            <span>Efeitos:</span>
            <span className="font-mono">{hardeningData.effects.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Excluídos:</span>
            <span className="font-mono">{hardeningData.excludedEffects.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Tempo:</span>
            <span className="font-mono">{hardeningData.metadata.processingTimeMs.toFixed(1)}ms</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default SUEDevToolsPanel;

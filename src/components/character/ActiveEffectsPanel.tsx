/**
 * ActiveEffectsPanel - Painel de visualização de efeitos ativos do SUE
 * 
 * Exibe todos os efeitos unificados ativos do personagem, agrupados por fonte
 * (origem, trilha, condição, ritual). Mostra detalhes de cada bônus aplicado.
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Sword, 
  Heart, 
  Zap, 
  Eye, 
  AlertTriangle, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  User,
  Skull,
  Target,
  BookOpen,
  Flame,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
import { cn } from '@/lib/utils';
import type { UnifiedEffectsResult, UnifiedEffect, ComputedEffects } from '@/hooks';

// =====================================================
// Props
// =====================================================

interface ActiveEffectsPanelProps {
  /** Resultado do hook useUnifiedEffects */
  effectsResult: UnifiedEffectsResult;
  /** Modo compacto para mobile */
  compact?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

// =====================================================
// Constantes de Estilo
// =====================================================

/** Cores por fonte de efeito */
const SOURCE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  origin: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  track: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  condition: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  ritual: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  class_ability: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  class_power: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  general_power: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  paranormal_power: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
  equipment: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
  skill_training: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
};

/** Ícones por fonte de efeito */
const SOURCE_ICONS: Record<string, React.ElementType> = {
  origin: User,
  track: Target,
  condition: AlertTriangle,
  ritual: Sparkles,
  class_ability: Shield,
  class_power: Sword,
  general_power: Zap,
  paranormal_power: Flame,
  equipment: Shield,
  skill_training: BookOpen,
};

/** Labels por fonte de efeito */
const SOURCE_LABELS: Record<string, string> = {
  origin: 'Origem',
  track: 'Trilha',
  condition: 'Condição',
  ritual: 'Ritual',
  class_ability: 'Habilidade',
  class_power: 'Poder de Classe',
  general_power: 'Poder Geral',
  paranormal_power: 'Poder Paranormal',
  equipment: 'Equipamento',
  skill_training: 'Treinamento',
};

// =====================================================
// Componentes Auxiliares
// =====================================================

/** Badge de fonte com estilo apropriado */
function SourceBadge({ source }: { source: string }) {
  const colors = SOURCE_COLORS[source] || SOURCE_COLORS.origin;
  const Icon = SOURCE_ICONS[source] || User;
  const label = SOURCE_LABELS[source] || source;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'text-xs px-2 py-0.5 gap-1',
        colors.bg,
        colors.text,
        colors.border
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

/** Renderiza um valor de bônus com formatação */
function BonusValue({ value, positive = true }: { value: number | string; positive?: boolean }) {
  const numValue = typeof value === 'number' ? value : parseInt(value);
  const isPositive = !isNaN(numValue) && numValue > 0;
  const isNegative = !isNaN(numValue) && numValue < 0;
  
  return (
    <span className={cn(
      'font-mono font-semibold',
      isPositive && 'text-green-400',
      isNegative && 'text-red-400',
      !isPositive && !isNegative && 'text-muted-foreground'
    )}>
      {typeof value === 'number' && value > 0 ? '+' : ''}{value}
    </span>
  );
}

/** Card de efeito individual */
function EffectCard({ effect, compact }: { effect: UnifiedEffect; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const colors = SOURCE_COLORS[effect.source] || SOURCE_COLORS.origin;
  const mechanics = effect.mechanics;

  // Extrai bônus numéricos para exibição rápida
  const quickBonuses: Array<{ label: string; value: number | string }> = [];
  
  if (mechanics.attackBonus) quickBonuses.push({ label: 'Ataque', value: mechanics.attackBonus });
  if (mechanics.damageBonus) quickBonuses.push({ label: 'Dano', value: mechanics.damageBonus });
  if (mechanics.defenseBonus) quickBonuses.push({ label: 'Defesa', value: mechanics.defenseBonus });
  if (mechanics.initiativeBonus) quickBonuses.push({ label: 'Iniciativa', value: mechanics.initiativeBonus });
  if (mechanics.fortitudeBonus) quickBonuses.push({ label: 'Fortitude', value: mechanics.fortitudeBonus });
  if (mechanics.reflexosBonus) quickBonuses.push({ label: 'Reflexos', value: mechanics.reflexosBonus });
  if (mechanics.vontadeBonus) quickBonuses.push({ label: 'Vontade', value: mechanics.vontadeBonus });
  if (mechanics.criticalMarginBonus) quickBonuses.push({ label: 'Crítico', value: mechanics.criticalMarginBonus });
  if (mechanics.damageReduction) quickBonuses.push({ label: 'RD', value: mechanics.damageReduction });
  if (mechanics.hpBonus) quickBonuses.push({ label: 'PV', value: mechanics.hpBonus });
  if (mechanics.peBonus) quickBonuses.push({ label: 'PE', value: mechanics.peBonus });

  // Verifica se tem conteúdo para expandir
  const hasExpandableContent = 
    effect.description || 
    mechanics.specialEffects?.length || 
    mechanics.skillBonus ||
    mechanics.grantsProficiency?.length;

  if (compact) {
    return (
      <div className={cn(
        'px-2 py-1.5 rounded-md border flex items-center justify-between gap-2',
        colors.bg,
        colors.border
      )}>
        <div className="flex items-center gap-2 min-w-0">
          <SourceBadge source={effect.source} />
          <span className="text-sm font-medium truncate">{effect.name}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {quickBonuses.slice(0, 2).map((bonus, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {bonus.label}: <BonusValue value={bonus.value} />
            </Badge>
          ))}
          {quickBonuses.length > 2 && (
            <Badge variant="secondary" className="text-xs">+{quickBonuses.length - 2}</Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className={cn(
        'rounded-lg border transition-colors',
        colors.bg,
        colors.border,
        expanded && 'ring-1 ring-primary/30'
      )}>
        <CollapsibleTrigger asChild>
          <button className="w-full px-3 py-2 flex items-center justify-between gap-2 hover:bg-white/5 transition-colors rounded-t-lg">
            <div className="flex items-center gap-2 min-w-0">
              <SourceBadge source={effect.source} />
              <span className="font-medium truncate">{effect.name}</span>
              {!effect.isActive && (
                <Badge variant="outline" className="text-xs bg-muted/50">Inativo</Badge>
              )}
              {effect.isToggleable && (
                <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400">
                  Ativável
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {quickBonuses.length > 0 && (
                <div className="hidden sm:flex items-center gap-1">
                  {quickBonuses.slice(0, 3).map((bonus, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {bonus.label}: <BonusValue value={bonus.value} />
                    </Badge>
                  ))}
                </div>
              )}
              {hasExpandableContent && (
                expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2">
            <Separator className="opacity-30" />
            
            {/* Descrição */}
            {effect.description && (
              <p className="text-sm text-muted-foreground">{effect.description}</p>
            )}

            {/* Bônus numéricos */}
            {quickBonuses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {quickBonuses.map((bonus, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {bonus.label}: <BonusValue value={bonus.value} />
                  </Badge>
                ))}
              </div>
            )}

            {/* Bônus de perícias */}
            {mechanics.skillBonus && Object.keys(mechanics.skillBonus).length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">Perícias:</span>
                {Object.entries(mechanics.skillBonus).map(([skill, bonus]) => (
                  <Badge key={skill} variant="secondary" className="text-xs capitalize">
                    {skill}: <BonusValue value={bonus as number} />
                  </Badge>
                ))}
              </div>
            )}

            {/* Proficiências */}
            {mechanics.grantsProficiency && mechanics.grantsProficiency.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">Proficiências:</span>
                {mechanics.grantsProficiency.map((prof, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {prof}
                  </Badge>
                ))}
              </div>
            )}

            {/* Efeitos especiais */}
            {mechanics.specialEffects && mechanics.specialEffects.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Efeitos:</span>
                <ul className="text-sm space-y-0.5">
                  {mechanics.specialEffects.map((effect, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <Sparkles className="h-3 w-3 mt-1 text-primary flex-shrink-0" />
                      <span>{effect}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Fonte */}
            <p className="text-xs text-muted-foreground opacity-60">
              Fonte: {effect.sourceName}
            </p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/** Seção de resumo de bônus totais */
function BonusSummarySection({ computed }: { computed: ComputedEffects }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {/* Ataque */}
      {computed.attack.general !== 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 p-2 rounded-md bg-red-500/10 border border-red-500/20">
                <Sword className="h-4 w-4 text-red-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Ataque</p>
                  <BonusValue value={computed.attack.general} />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {computed.attack.breakdown.map((b, i) => (
                <p key={i} className="text-xs">{b.source}: {b.value > 0 ? '+' : ''}{b.value}</p>
              ))}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Defesa */}
      {computed.defense.general !== 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 p-2 rounded-md bg-blue-500/10 border border-blue-500/20">
                <Shield className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Defesa</p>
                  <BonusValue value={computed.defense.general} />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {computed.defense.breakdown.map((b, i) => (
                <p key={i} className="text-xs">{b.source}: {b.value > 0 ? '+' : ''}{b.value}</p>
              ))}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* PV */}
      {computed.resources.hpBonus !== 0 && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-green-500/10 border border-green-500/20">
          <Heart className="h-4 w-4 text-green-400" />
          <div>
            <p className="text-xs text-muted-foreground">PV</p>
            <BonusValue value={computed.resources.hpBonus} />
          </div>
        </div>
      )}

      {/* Iniciativa */}
      {computed.initiative.bonus !== 0 && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-500/10 border border-yellow-500/20">
          <Zap className="h-4 w-4 text-yellow-400" />
          <div>
            <p className="text-xs text-muted-foreground">Iniciativa</p>
            <BonusValue value={computed.initiative.bonus} />
          </div>
        </div>
      )}
    </div>
  );
}

/** Grupo de efeitos por fonte */
function EffectGroup({ 
  title, 
  effects, 
  compact,
  defaultOpen = true 
}: { 
  title: string; 
  effects: UnifiedEffect[]; 
  compact?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (effects.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-between px-2 py-1 h-auto"
        >
          <span className="text-sm font-medium">{title}</span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{effects.length}</Badge>
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 mt-2">
          {effects.map(effect => (
            <EffectCard key={effect.id} effect={effect} compact={compact} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// =====================================================
// Componente Principal
// =====================================================

/**
 * Painel que exibe todos os efeitos ativos do Sistema Unificado de Efeitos
 */
export function ActiveEffectsPanel({ 
  effectsResult, 
  compact = false,
  className 
}: ActiveEffectsPanelProps) {
  const { allEffects, computed, bySource } = effectsResult;
  const [showAll, setShowAll] = useState(false);

  // Filtra efeitos ativos vs inativos
  const activeEffects = allEffects.filter(e => e.isActive);
  const inactiveEffects = allEffects.filter(e => !e.isActive);

  // Verifica se há algum efeito
  const hasEffects = allEffects.length > 0;
  const hasActiveEffects = activeEffects.length > 0;

  if (!hasEffects) {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="py-6 text-center text-muted-foreground">
          <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum efeito ativo</p>
          <p className="text-xs opacity-70">
            Efeitos de origem, trilha, condições e rituais aparecerão aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Efeitos Ativos</span>
          </div>
          <Badge variant="outline">
            {activeEffects.length} / {allEffects.length}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Resumo de bônus totais */}
        <BonusSummarySection computed={computed} />

        <Separator />

        {/* Efeitos por fonte */}
        <div className="space-y-3">
          <EffectGroup 
            title="Origem" 
            effects={bySource.origin} 
            compact={compact}
          />
          <EffectGroup 
            title="Trilha" 
            effects={bySource.track} 
            compact={compact}
          />
          <EffectGroup 
            title="Condições" 
            effects={bySource.condition} 
            compact={compact}
          />
          <EffectGroup 
            title="Rituais" 
            effects={bySource.ritual} 
            compact={compact}
          />
        </div>

        {/* Efeitos inativos (toggleáveis) */}
        {inactiveEffects.length > 0 && (
          <>
            <Separator />
            <Collapsible open={showAll} onOpenChange={setShowAll}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-muted-foreground"
                >
                  {showAll ? 'Ocultar inativos' : `Mostrar ${inactiveEffects.length} efeitos inativos`}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2 mt-2 opacity-60">
                  {inactiveEffects.map(effect => (
                    <EffectCard key={effect.id} effect={effect} compact />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}

        {/* Flags especiais */}
        {(computed.flags.cannotAct || computed.flags.cannotMove || computed.flags.isHelpless) && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-2">
              {computed.flags.cannotAct && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Não pode agir
                </Badge>
              )}
              {computed.flags.cannotReact && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Não pode reagir
                </Badge>
              )}
              {computed.flags.cannotMove && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Não pode mover
                </Badge>
              )}
              {computed.flags.isHelpless && (
                <Badge variant="destructive" className="text-xs">
                  <Skull className="h-3 w-3 mr-1" />
                  Indefeso
                </Badge>
              )}
              {computed.flags.isUnconscious && (
                <Badge variant="destructive" className="text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  Inconsciente
                </Badge>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ActiveEffectsPanel;

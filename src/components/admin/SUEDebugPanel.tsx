/**
 * SUEDebugPanel - Painel de Debug do Sistema Unificado de Efeitos
 * 
 * Visualização em tempo real de todos os ComputedEffects com:
 * - Breakdown por fonte (Origin, Track, Power, Ritual, Condition)
 * - Export de estado do SUE para JSON
 * - Acessível via modo desenvolvedor ou admin
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bug,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Eye,
  EyeOff,
  Filter,
  RefreshCw,
  Search,
  Sword,
  Shield,
  Heart,
  Zap,
  Target,
  User,
  Sparkles,
  AlertTriangle,
  Flame,
  BookOpen,
  Activity,
  Footprints,
  Brain,
  Check,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type {
  UnifiedEffectsResult,
  UnifiedEffect,
  ComputedEffects,
} from '@/hooks/useUnifiedEffects';

// =====================================================
// Tipos e Interfaces
// =====================================================

interface SUEDebugPanelProps {
  /** Resultado do hook useUnifiedEffects */
  effectsResult: UnifiedEffectsResult;
  /** Nome do personagem (para export) */
  characterName?: string;
  /** Modo compacto para mobile */
  compact?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

interface BreakdownItem {
  source: string;
  value: number | string | boolean;
  conditional?: string;
}

type SourceType = 'origin' | 'track' | 'condition' | 'ritual' | 'paranormal_power' | 'class_power';

// =====================================================
// Constantes de Estilo
// =====================================================

const SOURCE_CONFIG: Record<SourceType, { 
  label: string; 
  icon: React.ElementType; 
  color: string;
  bgColor: string;
}> = {
  origin: { 
    label: 'Origem', 
    icon: User, 
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  track: { 
    label: 'Trilha', 
    icon: Target, 
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  condition: { 
    label: 'Condição', 
    icon: AlertTriangle, 
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
  },
  ritual: { 
    label: 'Ritual', 
    icon: Sparkles, 
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
  paranormal_power: { 
    label: 'Poder Paranormal', 
    icon: Flame, 
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
  },
  class_power: { 
    label: 'Poder de Classe', 
    icon: Sword, 
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
};

const CATEGORY_CONFIG = {
  combat: { label: 'Combate', icon: Sword, color: 'text-red-400' },
  defense: { label: 'Defesa', icon: Shield, color: 'text-blue-400' },
  resources: { label: 'Recursos', icon: Heart, color: 'text-pink-400' },
  skills: { label: 'Perícias', icon: BookOpen, color: 'text-cyan-400' },
  movement: { label: 'Movimento', icon: Footprints, color: 'text-green-400' },
  special: { label: 'Especial', icon: Sparkles, color: 'text-purple-400' },
  advanced: { label: 'Avançado', icon: Activity, color: 'text-orange-400' },
  occultist: { label: 'Ocultista', icon: Brain, color: 'text-violet-400' },
};

// =====================================================
// Componente Principal
// =====================================================

export function SUEDebugPanel({
  effectsResult,
  characterName = 'Personagem',
  compact = false,
  className,
}: SUEDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedSources, setSelectedSources] = useState<SourceType[]>([
    'origin', 'track', 'condition', 'ritual', 'paranormal_power', 'class_power'
  ]);
  const [activeTab, setActiveTab] = useState('computed');

  const { allEffects, computed, bySource } = effectsResult;

  // Estatísticas gerais
  const stats = useMemo(() => {
    const activeEffects = allEffects.filter(e => e.isActive);
    const inactiveEffects = allEffects.filter(e => !e.isActive);
    
    return {
      total: allEffects.length,
      active: activeEffects.length,
      inactive: inactiveEffects.length,
      bySource: {
        origin: bySource.origin.length,
        track: bySource.track.length,
        condition: bySource.condition.length,
        ritual: bySource.ritual.length,
        paranormal_power: bySource.paranormal_power.length,
        class_power: bySource.class_power.length,
      },
    };
  }, [allEffects, bySource]);

  // Efeitos filtrados
  const filteredEffects = useMemo(() => {
    let effects = allEffects;
    
    // Filtra por fonte selecionada
    effects = effects.filter(e => selectedSources.includes(e.source as SourceType));
    
    // Filtra inativos
    if (!showInactive) {
      effects = effects.filter(e => e.isActive);
    }
    
    // Filtra por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      effects = effects.filter(e => 
        e.name.toLowerCase().includes(term) ||
        e.sourceId?.toLowerCase().includes(term) ||
        e.sourceName?.toLowerCase().includes(term)
      );
    }
    
    return effects;
  }, [allEffects, selectedSources, showInactive, searchTerm]);

  // Export para JSON
  const handleExportJSON = () => {
    const exportData = {
      characterName,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      stats,
      allEffects: allEffects.map(e => ({
        id: e.id,
        name: e.name,
        source: e.source,
        sourceId: e.sourceId,
        sourceName: e.sourceName,
        isActive: e.isActive,
        mechanics: e.mechanics,
        conditions: e.conditions,
      })),
      computed,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sue-debug-${characterName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('JSON exportado com sucesso!');
  };

  // Copia para clipboard
  const handleCopyToClipboard = () => {
    const exportData = {
      stats,
      computed,
      effectsCount: stats.total,
    };
    
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    toast.success('Copiado para a área de transferência!');
  };

  // Toggle fonte
  const toggleSource = (source: SourceType) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  if (!isOpen) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(true)}
              className={cn(
                "fixed bottom-4 right-4 z-50",
                "bg-background/80 backdrop-blur-sm border-primary/30",
                "hover:bg-primary/10 hover:border-primary",
                className
              )}
            >
              <Bug className="h-4 w-4 mr-2" />
              SUE Debug
              <Badge variant="secondary" className="ml-2">
                {stats.active}
              </Badge>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Abrir Painel de Debug do SUE</p>
            <p className="text-xs text-muted-foreground">
              {stats.total} efeitos ({stats.active} ativos)
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn(
        "fixed bottom-4 right-4 z-50",
        "w-[600px] max-w-[calc(100vw-2rem)]",
        compact && "w-[400px]",
        className
      )}
    >
      <Card className="border-primary/30 bg-background/95 backdrop-blur-md shadow-xl">
        {/* Header */}
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">SUE Debug Panel</CardTitle>
              <Badge variant="outline" className="text-xs">
                v1.0
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleCopyToClipboard}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copiar resumo</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleExportJSON}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Exportar JSON</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {Object.entries(stats.bySource).map(([source, count]) => {
              const config = SOURCE_CONFIG[source as SourceType];
              if (!config || count === 0) return null;
              const Icon = config.icon;
              return (
                <Badge
                  key={source}
                  variant="secondary"
                  className={cn(
                    "cursor-pointer transition-opacity",
                    config.bgColor,
                    !selectedSources.includes(source as SourceType) && "opacity-40"
                  )}
                  onClick={() => toggleSource(source as SourceType)}
                >
                  <Icon className={cn("h-3 w-3 mr-1", config.color)} />
                  {count}
                </Badge>
              );
            })}
            <Separator orientation="vertical" className="h-4" />
            <Badge variant={stats.inactive > 0 ? "destructive" : "secondary"}>
              {stats.inactive} inativos
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {/* Search & Filters */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar efeitos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <label htmlFor="show-inactive" className="text-xs text-muted-foreground">
                Inativos
              </label>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 h-8">
              <TabsTrigger value="computed" className="text-xs">
                Computed
              </TabsTrigger>
              <TabsTrigger value="effects" className="text-xs">
                Efeitos ({filteredEffects.length})
              </TabsTrigger>
              <TabsTrigger value="breakdown" className="text-xs">
                Breakdown
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px] mt-3">
              {/* Tab: Computed Effects */}
              <TabsContent value="computed" className="mt-0">
                <ComputedEffectsView computed={computed} compact={compact} />
              </TabsContent>

              {/* Tab: Raw Effects */}
              <TabsContent value="effects" className="mt-0">
                <RawEffectsView effects={filteredEffects} compact={compact} />
              </TabsContent>

              {/* Tab: Breakdown by Source */}
              <TabsContent value="breakdown" className="mt-0">
                <BreakdownView bySource={bySource} compact={compact} />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// =====================================================
// Sub-componentes
// =====================================================

/** Visualização dos efeitos computados */
function ComputedEffectsView({ 
  computed, 
  compact 
}: { 
  computed: ComputedEffects; 
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      {/* Combate */}
      <EffectCategorySection
        title="Combate"
        icon={Sword}
        color="text-red-400"
        items={[
          { label: 'Ataque (geral)', value: computed.attack.general, breakdown: computed.attack.breakdown },
          { label: 'Ataque (corpo)', value: computed.attack.melee },
          { label: 'Ataque (distância)', value: computed.attack.ranged },
          { label: 'Dano (geral)', value: computed.damage.general, breakdown: computed.damage.breakdown },
          { label: 'Margem Crítico', value: computed.critical.marginBonus },
          { label: 'Mult. Crítico', value: computed.critical.multiplierBonus },
        ]}
        compact={compact}
      />

      {/* Defesa */}
      <EffectCategorySection
        title="Defesa"
        icon={Shield}
        color="text-blue-400"
        items={[
          { label: 'Defesa (geral)', value: computed.defense.general, breakdown: computed.defense.breakdown },
          { label: 'vs Corpo-a-corpo', value: computed.defense.vsMelee },
          { label: 'vs Distância', value: computed.defense.vsRanged },
          { label: 'RD Física', value: computed.damageReduction.physical },
          { label: 'RD Paranormal', value: computed.damageReduction.paranormal },
        ]}
        compact={compact}
      />

      {/* Resistências */}
      <EffectCategorySection
        title="Resistências"
        icon={Shield}
        color="text-green-400"
        items={[
          { label: 'Fortitude', value: computed.resistances.fortitude },
          { label: 'Reflexos', value: computed.resistances.reflexos },
          { label: 'Vontade', value: computed.resistances.vontade },
        ]}
        compact={compact}
      />

      {/* Recursos */}
      <EffectCategorySection
        title="Recursos"
        icon={Heart}
        color="text-pink-400"
        items={[
          { label: 'Bônus PV', value: computed.resources.hpBonus },
          { label: 'Bônus PE', value: computed.resources.peBonus },
          { label: 'Bônus SAN', value: computed.resources.sanityBonus },
          { label: 'PV Temporário', value: computed.resources.tempHP },
        ]}
        compact={compact}
      />

      {/* Movimento & Iniciativa */}
      <EffectCategorySection
        title="Movimento & Iniciativa"
        icon={Footprints}
        color="text-green-400"
        items={[
          { label: 'Movimento', value: computed.movement.bonus },
          { label: 'Mult. Movimento', value: computed.movement.multiplier },
          { label: 'Iniciativa', value: computed.initiative.bonus },
        ]}
        compact={compact}
      />

      {/* Flags de Estado */}
      <FlagsSection flags={computed.flags} compact={compact} />

      {/* Combate Avançado */}
      <CombatAdvancedSection combatAdvanced={computed.combatAdvanced} compact={compact} />

      {/* Ataque Furtivo */}
      {computed.sneakAttack.available && (
        <SneakAttackSection sneakAttack={computed.sneakAttack} compact={compact} />
      )}

      {/* Cura */}
      {computed.healing.available && (
        <HealingSection healing={computed.healing} compact={compact} />
      )}

      {/* Ocultista */}
      {(computed.occultist?.bonusRituals?.perCircle > 0 || computed.occultist?.grimoire?.available) && (
        <OccultistSection occultist={computed.occultist} compact={compact} />
      )}

      {/* Perícias */}
      {Object.keys(computed.skills).length > 0 && (
        <SkillsSection skills={computed.skills} compact={compact} />
      )}
    </div>
  );
}

/** Seção de categoria de efeitos */
function EffectCategorySection({
  title,
  icon: Icon,
  color,
  items,
  compact,
}: {
  title: string;
  icon: React.ElementType;
  color: string;
  items: Array<{ label: string; value: number; breakdown?: BreakdownItem[] }>;
  compact?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const hasValues = items.some(item => item.value !== 0);

  if (!hasValues) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <Icon className={cn("h-4 w-4", color)} />
          <span className="text-sm font-medium">{title}</span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className={cn("grid gap-1 pl-6 pt-1", compact ? "grid-cols-2" : "grid-cols-3")}>
          {items.map((item, idx) => (
            item.value !== 0 && (
              <div key={idx} className="flex items-center justify-between text-xs bg-muted/30 rounded px-2 py-1">
                <span className="text-muted-foreground truncate">{item.label}</span>
                <Badge 
                  variant={item.value > 0 ? "default" : "destructive"} 
                  className="text-xs ml-1"
                >
                  {item.value > 0 ? '+' : ''}{item.value}
                </Badge>
              </div>
            )
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Seção de flags de estado */
function FlagsSection({ 
  flags, 
  compact 
}: { 
  flags: ComputedEffects['flags']; 
  compact?: boolean;
}) {
  const activeFlags = Object.entries(flags).filter(([_, value]) => value);
  
  if (activeFlags.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-400" />
        <span className="text-sm font-medium">Flags Ativas</span>
      </div>
      <div className="flex flex-wrap gap-1 pl-6">
        {activeFlags.map(([flag]) => (
          <Badge key={flag} variant="destructive" className="text-xs">
            {flag}
          </Badge>
        ))}
      </div>
    </div>
  );
}

/** Seção de combate avançado */
function CombatAdvancedSection({ 
  combatAdvanced, 
  compact 
}: { 
  combatAdvanced: ComputedEffects['combatAdvanced']; 
  compact?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const hasContent = 
    combatAdvanced.specialAttackMultiplier.value > 1 ||
    combatAdvanced.extraActions.length > 0 ||
    combatAdvanced.maximumDamageOnCrit.enabled ||
    combatAdvanced.blockVigorBonus.enabled ||
    combatAdvanced.occultismAsAttack.enabled ||
    combatAdvanced.taunt.available ||
    combatAdvanced.targetStateControl.available ||
    combatAdvanced.conditionalBonuses.whenWounded.active ||
    combatAdvanced.conditionalBonuses.whenDying.canAct;

  if (!hasContent) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <Activity className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-medium">Combate Avançado</span>
          <Badge variant="secondary" className="text-xs">
            {[
              combatAdvanced.specialAttackMultiplier.value > 1,
              combatAdvanced.extraActions.length > 0,
              combatAdvanced.maximumDamageOnCrit.enabled,
              combatAdvanced.taunt.available,
            ].filter(Boolean).length} ativos
          </Badge>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 pl-6 pt-1">
          {combatAdvanced.specialAttackMultiplier.value > 1 && (
            <div className="text-xs">
              <span className="text-muted-foreground">Multiplicador Ataque Especial:</span>
              <Badge className="ml-1">x{combatAdvanced.specialAttackMultiplier.value}</Badge>
              {combatAdvanced.specialAttackMultiplier.weaponRestriction !== 'any' && (
                <span className="text-muted-foreground ml-1">
                  ({combatAdvanced.specialAttackMultiplier.weaponRestriction})
                </span>
              )}
            </div>
          )}
          
          {combatAdvanced.extraActions.length > 0 && (
            <div className="text-xs">
              <span className="text-muted-foreground">Ações Extras:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {combatAdvanced.extraActions.map((action, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {action.type} ({action.trigger})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {combatAdvanced.maximumDamageOnCrit.enabled && (
            <div className="text-xs flex items-center gap-1">
              <Check className="h-3 w-3 text-green-400" />
              <span>Dano Máximo em Crítico</span>
              {combatAdvanced.maximumDamageOnCrit.weaponTypes.length > 0 && (
                <span className="text-muted-foreground">
                  ({combatAdvanced.maximumDamageOnCrit.weaponTypes.join(', ')})
                </span>
              )}
            </div>
          )}

          {combatAdvanced.blockVigorBonus.enabled && (
            <div className="text-xs flex items-center gap-1">
              <Check className="h-3 w-3 text-green-400" />
              <span>Bônus de Vigor ao Bloquear</span>
            </div>
          )}

          {combatAdvanced.occultismAsAttack.enabled && (
            <div className="text-xs flex items-center gap-1">
              <Check className="h-3 w-3 text-green-400" />
              <span>Ocultismo como Ataque</span>
            </div>
          )}

          {combatAdvanced.taunt.available && (
            <div className="text-xs">
              <span className="text-muted-foreground">Provocar:</span>
              {combatAdvanced.taunt.abilities.map((ab, idx) => (
                <Badge key={idx} variant="outline" className="ml-1 text-xs">
                  {ab.name}
                </Badge>
              ))}
            </div>
          )}

          {combatAdvanced.conditionalBonuses.whenWounded.active && (
            <div className="text-xs">
              <span className="text-muted-foreground">Quando Ferido:</span>
              <Badge className="ml-1">+{combatAdvanced.conditionalBonuses.whenWounded.defenseBonus} Defesa</Badge>
              <Badge className="ml-1">RD {combatAdvanced.conditionalBonuses.whenWounded.damageReduction}</Badge>
            </div>
          )}

          {combatAdvanced.conditionalBonuses.whenDying.canAct && (
            <div className="text-xs flex items-center gap-1">
              <Check className="h-3 w-3 text-green-400" />
              <span>Pode Agir Morrendo</span>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Seção de ataque furtivo */
function SneakAttackSection({ 
  sneakAttack, 
  compact 
}: { 
  sneakAttack: ComputedEffects['sneakAttack']; 
  compact?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 text-violet-400" />
        <span className="text-sm font-medium">Ataque Furtivo</span>
        <Badge className="text-xs">{sneakAttack.totalDice}{sneakAttack.dieType}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-1 pl-6 text-xs">
        <div>Custo PE: {sneakAttack.peCost}</div>
        <div>Usos/Rodada: {sneakAttack.usesPerRound || '∞'}</div>
        {sneakAttack.multiplier > 1 && <div>Multiplicador: x{sneakAttack.multiplier}</div>}
      </div>
    </div>
  );
}

/** Seção de cura */
function HealingSection({ 
  healing, 
  compact 
}: { 
  healing: ComputedEffects['healing']; 
  compact?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Heart className="h-4 w-4 text-pink-400" />
        <span className="text-sm font-medium">Curar Aliado</span>
        <Badge className="text-xs">{healing.baseDice}{healing.dieType}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-1 pl-6 text-xs">
        <div>Custo PE: {healing.peCost}</div>
        <div>Alcance: {healing.range}</div>
        <div>Ação: {healing.actionType}</div>
      </div>
    </div>
  );
}

/** Seção de ocultista */
function OccultistSection({ 
  occultist, 
  compact 
}: { 
  occultist: ComputedEffects['occultist']; 
  compact?: boolean;
}) {
  if (!occultist) return null;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-violet-400" />
        <span className="text-sm font-medium">Ocultista</span>
      </div>
      <div className="space-y-1 pl-6 text-xs">
        {occultist.bonusRituals?.perCircle > 0 && (
          <div>Rituais Bônus: +{occultist.bonusRituals.perCircle}/círculo</div>
        )}
        {occultist.grimoire?.available && (
          <div className="flex items-center gap-1">
            <Check className="h-3 w-3 text-green-400" />
            <span>Grimório Disponível</span>
          </div>
        )}
        {occultist.ritualPowerBonus?.affectsDamage && (
          <div>Bônus de Dano em Rituais Ativo</div>
        )}
      </div>
    </div>
  );
}

/** Seção de perícias */
function SkillsSection({ 
  skills, 
  compact 
}: { 
  skills: ComputedEffects['skills']; 
  compact?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const skillEntries = Object.entries(skills).filter(([_, data]) => data.bonus !== 0);

  if (skillEntries.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <BookOpen className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-medium">Perícias</span>
          <Badge variant="secondary" className="text-xs">
            {skillEntries.length}
          </Badge>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className={cn("grid gap-1 pl-6 pt-1", compact ? "grid-cols-2" : "grid-cols-3")}>
          {skillEntries.map(([skill, data]) => (
            <div key={skill} className="flex items-center justify-between text-xs bg-muted/30 rounded px-2 py-1">
              <span className="text-muted-foreground truncate capitalize">{skill}</span>
              <Badge variant={data.bonus > 0 ? "default" : "destructive"} className="text-xs ml-1">
                {data.bonus > 0 ? '+' : ''}{data.bonus}
              </Badge>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Visualização dos efeitos brutos */
function RawEffectsView({ 
  effects, 
  compact 
}: { 
  effects: UnifiedEffect[]; 
  compact?: boolean;
}) {
  if (effects.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        Nenhum efeito encontrado
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {effects.map((effect) => {
        const config = SOURCE_CONFIG[effect.source as SourceType];
        const Icon = config?.icon || Zap;
        
        return (
          <div 
            key={effect.id}
            className={cn(
              "p-2 rounded-lg border",
              config?.bgColor || 'bg-muted/30',
              "border-border/50",
              !effect.isActive && "opacity-50"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", config?.color || 'text-muted-foreground')} />
                <span className="text-sm font-medium">{effect.name}</span>
                {!effect.isActive && (
                  <Badge variant="secondary" className="text-xs">Inativo</Badge>
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                {config?.label || effect.source}
              </Badge>
            </div>
            {effect.sourceName && (
              <div className="text-xs text-muted-foreground mt-1 pl-6">
                Fonte: {effect.sourceName}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Visualização por breakdown de fonte */
function BreakdownView({ 
  bySource, 
  compact 
}: { 
  bySource: UnifiedEffectsResult['bySource']; 
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      {(Object.entries(bySource) as [SourceType, UnifiedEffect[]][]).map(([source, effects]) => {
        if (effects.length === 0) return null;
        
        const config = SOURCE_CONFIG[source];
        const Icon = config?.icon || Zap;
        const activeCount = effects.filter(e => e.isActive).length;

        return (
          <Collapsible key={source}>
            <CollapsibleTrigger asChild>
              <div className={cn(
                "flex items-center justify-between p-2 rounded-lg cursor-pointer",
                "hover:bg-muted/50 transition-colors",
                config?.bgColor || 'bg-muted/30'
              )}>
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", config?.color)} />
                  <span className="text-sm font-medium">{config?.label || source}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {activeCount}/{effects.length}
                  </Badge>
                  <ChevronDown className="h-3 w-3" />
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-1 pl-4 pt-2">
                {effects.map((effect) => (
                  <div 
                    key={effect.id}
                    className={cn(
                      "flex items-center justify-between text-xs p-1 rounded",
                      "bg-background/50",
                      !effect.isActive && "opacity-50"
                    )}
                  >
                    <span className="truncate">{effect.name}</span>
                    <div className="flex items-center gap-1">
                      {effect.isActive ? (
                        <Check className="h-3 w-3 text-green-400" />
                      ) : (
                        <X className="h-3 w-3 text-red-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}

export default SUEDebugPanel;

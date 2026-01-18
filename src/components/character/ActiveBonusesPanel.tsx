/**
 * ActiveBonusesPanel - Painel expandido mostrando todos os bônus ativos do personagem
 * Organizado por categorias com detalhes de cada fonte
 * Permite ativar/desativar bônus condicionais
 */

import { motion } from 'framer-motion';
import { 
  Shield, Swords, Heart, Zap, Brain, Star, Sparkles, 
  Target, Crosshair, Activity, Flame, ToggleLeft, ToggleRight, Stethoscope
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { BonusSummary, BonusBreakdown, ConditionalBonus } from '@/hooks/useCharacterBonusSummary';

// Configuração de ícones e cores por tipo de bônus
const BONUS_TYPE_CONFIG = {
  origin: { icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Origem' },
  ability: { icon: Zap, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Habilidade' },
  general_power: { icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Poder Geral' },
  paranormal: { icon: Flame, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Paranormal' },
  equipment: { icon: Shield, color: 'text-slate-500', bg: 'bg-slate-500/10', label: 'Equipamento' },
  ritual: { icon: Sparkles, color: 'text-pink-500', bg: 'bg-pink-500/10', label: 'Ritual' },
  skill_training: { icon: Activity, color: 'text-cyan-500', bg: 'bg-cyan-500/10', label: 'Treinamento' },
  track_effect: { icon: Stethoscope, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Efeito de Trilha' },
};

// Tipo de categoria de filtro
export type BonusPanelFilter = 'all' | 'combat' | 'defense' | 'ritual' | 'paranormal' | 'skill' | 'resistance';

interface ActiveBonusesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bonusSummary: BonusSummary;
  activeBonusSources: string[];
  onToggleConditionalBonus?: (bonusId: string, active: boolean) => void;
  filter?: BonusPanelFilter;
  onFilterChange?: (filter: BonusPanelFilter) => void;
}

// Componente para card de bônus condicional toggleável
function ConditionalBonusCard({ 
  bonus, 
  onToggle 
}: { 
  bonus: ConditionalBonus; 
  onToggle?: (id: string, active: boolean) => void;
}) {
  const config = BONUS_TYPE_CONFIG[bonus.source] || BONUS_TYPE_CONFIG.general_power;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-3 rounded-lg border transition-all duration-200",
        bonus.active 
          ? "bg-primary/10 border-primary/30 shadow-sm shadow-primary/10" 
          : "bg-muted/30 border-border"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Info do bônus */}
        <div className="flex items-start gap-3 flex-1">
          <div className={cn(
            "p-2 rounded-md transition-colors",
            bonus.active ? config.bg : "bg-muted"
          )}>
            <Icon className={cn("w-4 h-4", bonus.active ? config.color : "text-muted-foreground")} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-medium text-sm",
                bonus.active ? "text-foreground" : "text-muted-foreground"
              )}>
                {bonus.name}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              {bonus.condition}
            </span>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {bonus.effects.map((effect, i) => (
                <Badge 
                  key={i} 
                  variant={bonus.active ? "default" : "secondary"}
                  className={cn(
                    "text-[10px] px-1.5 py-0",
                    bonus.active && "bg-success/20 text-success border-success/30"
                  )}
                >
                  {effect}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Toggle Switch */}
        <Switch
          checked={bonus.active}
          onCheckedChange={(checked) => onToggle?.(bonus.id, checked)}
          className="data-[state=checked]:bg-primary"
        />
      </div>
    </motion.div>
  );
}

// Componente para renderizar um item de bônus individual
function BonusItem({ bonus, showType = true }: { bonus: BonusBreakdown; showType?: boolean }) {
  const config = BONUS_TYPE_CONFIG[bonus.type] || BONUS_TYPE_CONFIG.equipment;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-start gap-3 p-2 rounded-lg transition-colors",
        bonus.active ? "bg-card/50" : "bg-muted/30 opacity-60"
      )}
    >
      {/* Ícone do tipo */}
      <div className={cn("p-1.5 rounded-md", config.bg)}>
        <Icon className={cn("w-4 h-4", config.color)} />
      </div>

      {/* Detalhes do bônus */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">{bonus.source}</span>
          <span className={cn(
            "font-display text-sm shrink-0",
            bonus.active && typeof bonus.value === 'number' && bonus.value > 0 ? "text-success" : 
            bonus.active ? "text-primary" : "text-muted-foreground"
          )}>
            {typeof bonus.value === 'number' ? `+${bonus.value}` : bonus.value}
          </span>
        </div>
        
        {/* Tipo e condição */}
        <div className="flex items-center gap-2 mt-0.5">
          {showType && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {config.label}
            </Badge>
          )}
          {bonus.conditional && (
            <span className="text-[11px] text-muted-foreground italic">
              {bonus.conditional}
            </span>
          )}
          {!bonus.active && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-muted">
              Inativo
            </Badge>
          )}
          {bonus.toggleable && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
              Toggleável
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Componente para seção de categoria de bônus
function BonusSection({ 
  title, 
  icon: Icon, 
  iconColor,
  children, 
  total,
  isEmpty = false 
}: { 
  title: string; 
  icon: React.ElementType; 
  iconColor: string;
  children: React.ReactNode;
  total?: number | string;
  isEmpty?: boolean;
}) {
  if (isEmpty) return null;

  return (
    <div className="space-y-2">
      {/* Header da seção */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-5 h-5", iconColor)} />
          <span className="font-display text-sm uppercase tracking-wider">{title}</span>
        </div>
        {total !== undefined && (
          <span className="font-display text-lg text-primary">
            {typeof total === 'number' ? `+${total}` : total}
          </span>
        )}
      </div>
      
      {/* Lista de bônus */}
      <div className="space-y-1 pl-1">
        {children}
      </div>
    </div>
  );
}

// Configuração de filtros com labels
const FILTER_OPTIONS: { id: BonusPanelFilter; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'Todos', icon: Sparkles },
  { id: 'combat', label: 'Combate', icon: Swords },
  { id: 'defense', label: 'Defesa', icon: Shield },
  { id: 'resistance', label: 'Resistências', icon: Activity },
  { id: 'skill', label: 'Perícias', icon: Target },
  { id: 'paranormal', label: 'Paranormal', icon: Flame },
];

export function ActiveBonusesPanel({
  open,
  onOpenChange,
  bonusSummary,
  activeBonusSources,
  onToggleConditionalBonus,
  filter = 'all',
  onFilterChange,
}: ActiveBonusesPanelProps) {
  // Conta total de bônus ativos
  const totalBonuses = activeBonusSources.length;

  // Verifica se há bônus em cada categoria
  const hasDefense = bonusSummary.defense.total > 0;
  const hasResistances = bonusSummary.resistances.fortitude.total > 0 || 
                         bonusSummary.resistances.reflexos.total > 0 || 
                         bonusSummary.resistances.vontade.total > 0;
  const hasCombat = bonusSummary.combat.attack.breakdown.length > 0 ||
                    bonusSummary.combat.damage.breakdown.length > 0 ||
                    bonusSummary.combat.criticalMargin.total > 0 ||
                    bonusSummary.combat.initiative.total > 0;
  const hasDR = bonusSummary.damageReduction.physical.total > 0 ||
                bonusSummary.damageReduction.paranormal.total > 0;
  const hasSkills = Object.keys(bonusSummary.skills).length > 0;
  const hasSpecial = bonusSummary.special.length > 0;
  const hasStats = bonusSummary.hpBonus > 0 || bonusSummary.peBonus > 0;
  const hasConditional = bonusSummary.conditionalBonuses && bonusSummary.conditionalBonuses.length > 0;

  // Função para verificar se uma seção deve ser mostrada com base no filtro
  const shouldShowSection = (sectionFilter: BonusPanelFilter): boolean => {
    if (filter === 'all') return true;
    return filter === sectionFilter;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        {/* Header */}
        <SheetHeader className="p-4 pb-2 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="p-2 rounded-lg bg-primary/10"
              >
                <Sparkles className="w-5 h-5 text-primary" />
              </motion.div>
              <div>
                <SheetTitle className="font-display text-lg">Bônus Ativos</SheetTitle>
                <p className="text-xs text-muted-foreground">
                  {totalBonuses} {totalBonuses === 1 ? 'bônus ativo' : 'bônus ativos'}
                  {filter !== 'all' && (
                    <span className="text-primary ml-1">
                      • Filtrado: {FILTER_OPTIONS.find(f => f.id === filter)?.label}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          {/* Filtros por categoria */}
          <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-border/50">
            {FILTER_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isActive = filter === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onFilterChange?.(option.id)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all",
                    "border focus:outline-none focus:ring-2 focus:ring-primary/50",
                    isActive 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </SheetHeader>

        {/* Conteúdo com scroll */}
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-4 space-y-6">
            
            {/* === BÔNUS CONDICIONAIS (Toggle) - Sempre mostrar quando filtro é 'all' ou 'combat' === */}
            {hasConditional && (filter === 'all' || filter === 'combat') && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <ToggleRight className="w-5 h-5 text-primary" />
                    <span className="font-display text-sm uppercase tracking-wider">Bônus Condicionais</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Ative quando as condições forem atendidas
                  </p>
                  <div className="space-y-2">
                    {bonusSummary.conditionalBonuses.map((bonus) => (
                      <ConditionalBonusCard
                        key={bonus.id}
                        bonus={bonus}
                        onToggle={onToggleConditionalBonus}
                      />
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}
            
            {/* === STATS (HP/PE) - Mostrar em 'all' ou 'paranormal' === */}
            {shouldShowSection('paranormal') && (
              <BonusSection
                title="Recursos"
                icon={Heart}
                iconColor="text-hp"
                isEmpty={!hasStats}
              >
                {bonusSummary.hpBonus > 0 && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-hp/10">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-hp" />
                      <span className="text-sm">HP Máximo</span>
                    </div>
                    <span className="font-display text-success">+{bonusSummary.hpBonus}</span>
                  </div>
                )}
                {bonusSummary.peBonus > 0 && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-pe/10">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-pe" />
                      <span className="text-sm">PE Máximo</span>
                    </div>
                    <span className="font-display text-success">+{bonusSummary.peBonus}</span>
                  </div>
                )}
              </BonusSection>
            )}

            {hasStats && shouldShowSection('paranormal') && <Separator />}

            {/* === DEFESA === */}
            {shouldShowSection('defense') && (
              <BonusSection
                title="Defesa"
                icon={Shield}
                iconColor="text-primary"
                total={bonusSummary.defense.total}
                isEmpty={!hasDefense}
              >
                {bonusSummary.defense.breakdown.map((bonus, i) => (
                  <BonusItem 
                    key={`defense-${i}`} 
                    bonus={{
                      source: bonus.source,
                      value: bonus.bonus,
                      type: bonus.type,
                      conditional: bonus.conditional,
                      active: bonus.active,
                    }} 
                  />
                ))}
              </BonusSection>
            )}

            {hasDefense && shouldShowSection('defense') && <Separator />}

            {/* === RESISTÊNCIAS === */}
            {shouldShowSection('resistance') && (
              <BonusSection
                title="Resistências"
                icon={Activity}
                iconColor="text-san"
                isEmpty={!hasResistances}
              >
                {/* Fortitude */}
                {bonusSummary.resistances.fortitude.total > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-sm text-muted-foreground">Fortitude</span>
                      <span className="font-display text-success">+{bonusSummary.resistances.fortitude.total}</span>
                    </div>
                    {bonusSummary.resistances.fortitude.breakdown.map((b, i) => (
                      <div key={`fort-${i}`} className="text-xs text-foreground/60 pl-4">
                        • {b.source}: +{b.fortitude}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Reflexos */}
                {bonusSummary.resistances.reflexos.total > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-sm text-muted-foreground">Reflexos</span>
                      <span className="font-display text-success">+{bonusSummary.resistances.reflexos.total}</span>
                    </div>
                    {bonusSummary.resistances.reflexos.breakdown.map((b, i) => (
                      <div key={`ref-${i}`} className="text-xs text-foreground/60 pl-4">
                        • {b.source}: +{b.reflexos}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Vontade */}
                {bonusSummary.resistances.vontade.total > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-sm text-muted-foreground">Vontade</span>
                      <span className="font-display text-success">+{bonusSummary.resistances.vontade.total}</span>
                    </div>
                    {bonusSummary.resistances.vontade.breakdown.map((b, i) => (
                      <div key={`von-${i}`} className="text-xs text-foreground/60 pl-4">
                        • {b.source}: +{b.vontade}
                      </div>
                    ))}
                  </div>
                )}
              </BonusSection>
            )}

            {hasResistances && shouldShowSection('resistance') && <Separator />}

            {/* === COMBATE === */}
            {shouldShowSection('combat') && (
              <BonusSection
                title="Combate"
                icon={Swords}
                iconColor="text-destructive"
                isEmpty={!hasCombat}
              >
                {/* Ataque */}
                {bonusSummary.combat.attack.breakdown.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 px-2">
                      <Crosshair className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">Ataque</span>
                    </div>
                    {bonusSummary.combat.attack.breakdown.map((bonus, i) => (
                      <BonusItem key={`atk-${i}`} bonus={bonus} />
                    ))}
                  </div>
                )}
                
                {/* Dano */}
                {bonusSummary.combat.damage.breakdown.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center gap-2 px-2">
                      <Target className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">Dano</span>
                    </div>
                    {bonusSummary.combat.damage.breakdown.map((bonus, i) => (
                      <BonusItem key={`dmg-${i}`} bonus={bonus} />
                    ))}
                  </div>
                )}
                
                {/* Margem de Crítico */}
                {bonusSummary.combat.criticalMargin.total > 0 && (
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-sm">Margem de Ameaça</span>
                      <span className="font-display text-success">+{bonusSummary.combat.criticalMargin.total}</span>
                    </div>
                    {bonusSummary.combat.criticalMargin.breakdown.map((bonus, i) => (
                      <BonusItem key={`crit-${i}`} bonus={bonus} showType={false} />
                    ))}
                  </div>
                )}
                
                {/* Iniciativa */}
                {bonusSummary.combat.initiative.total > 0 && (
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-sm">Iniciativa</span>
                      <span className="font-display text-success">+{bonusSummary.combat.initiative.total}</span>
                    </div>
                    {bonusSummary.combat.initiative.breakdown.map((bonus, i) => (
                      <BonusItem key={`init-${i}`} bonus={bonus} showType={false} />
                    ))}
                  </div>
                )}
              </BonusSection>
            )}

            {hasCombat && shouldShowSection('combat') && <Separator />}

            {/* === REDUÇÃO DE DANO === */}
            {shouldShowSection('defense') && (
              <BonusSection
                title="Redução de Dano"
                icon={Shield}
                iconColor="text-slate-400"
                isEmpty={!hasDR}
              >
                {bonusSummary.damageReduction.physical.total > 0 && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-500/10">
                    <span className="text-sm">RD Físico</span>
                    <span className="font-display text-success">{bonusSummary.damageReduction.physical.total}</span>
                  </div>
                )}
                {bonusSummary.damageReduction.paranormal.total > 0 && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-purple-500/10">
                    <span className="text-sm">RD Paranormal</span>
                    <span className="font-display text-success">{bonusSummary.damageReduction.paranormal.total}</span>
                  </div>
                )}
              </BonusSection>
            )}

            {hasDR && shouldShowSection('defense') && <Separator />}

            {/* === PERÍCIAS === */}
            {shouldShowSection('skill') && (
              <BonusSection
                title="Perícias"
                icon={Brain}
                iconColor="text-blue-400"
                isEmpty={!hasSkills}
              >
                {Object.entries(bonusSummary.skills).map(([skill, data]) => (
                  <div key={skill} className="space-y-1">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-sm capitalize">{skill}</span>
                      <span className="font-display text-success">+{data.total}</span>
                    </div>
                    {data.breakdown.map((bonus, i) => (
                      <div key={`${skill}-${i}`} className="text-xs text-muted-foreground pl-4">
                        • {bonus.source}
                      </div>
                    ))}
                  </div>
                ))}
              </BonusSection>
            )}

            {hasSkills && shouldShowSection('skill') && <Separator />}

            {/* === EFEITOS ESPECIAIS === */}
            {shouldShowSection('paranormal') && (
              <BonusSection
                title="Efeitos Especiais"
                icon={Sparkles}
                iconColor="text-paranormal"
                isEmpty={!hasSpecial}
              >
                {bonusSummary.special.map((bonus, i) => (
                  <BonusItem key={`special-${i}`} bonus={bonus} />
                ))}
              </BonusSection>
            )}

            {/* Mensagem se não houver bônus */}
            {totalBonuses === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum bônus ativo no momento</p>
                <p className="text-xs mt-1">
                  Bônus de origem, poderes e equipamentos aparecerão aqui
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

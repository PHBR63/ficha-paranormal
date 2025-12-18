/**
 * TrackCombatBonusesBar - Barra de bônus de trilha na seção de combate
 * Mostra modificadores de dano e ataque de habilidades como Mira de Elite e Golpe Pesado
 */

import { motion } from 'framer-motion';
import { Crosshair, Swords, Target, Zap, Shield, Brain, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BonusBreakdown, CombatBonuses, DamageReduction, EffectResistances } from '@/hooks/useCharacterBonusSummary';

interface TrackCombatBonusesBarProps {
  combat: CombatBonuses;
  damageReduction: DamageReduction;
  effectResistances: EffectResistances;
  className?: string;
}

// Componente de item de bônus individual
function BonusItem({
  icon: Icon,
  label,
  value,
  tooltip,
  variant = 'default',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  tooltip: React.ReactNode;
  variant?: 'default' | 'attack' | 'damage' | 'defense' | 'critical';
}) {
  const variantColors = {
    default: 'bg-muted/50 text-foreground',
    attack: 'bg-primary/15 text-primary border-primary/30',
    damage: 'bg-destructive/15 text-destructive border-destructive/30',
    defense: 'bg-energy/15 text-energy border-energy/30',
    critical: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium cursor-help",
              variantColors[variant]
            )}
          >
            <Icon className="w-3 h-3" />
            <span className="uppercase text-[10px]">{label}</span>
            <span className="font-display">{typeof value === 'number' && value > 0 ? `+${value}` : value}</span>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Renderiza breakdown de bônus
function renderBreakdown(breakdown: BonusBreakdown[]) {
  return (
    <div className="space-y-1">
      {breakdown.map((b, i) => (
        <div key={i} className="flex items-center justify-between text-xs">
          <span className={cn(!b.active && "text-muted-foreground line-through")}>
            {b.source}
            {b.conditional && <span className="text-muted-foreground ml-1">({b.conditional})</span>}
          </span>
          <span className={cn("font-medium", b.active && "text-primary")}>
            {typeof b.value === 'number' && b.value > 0 ? `+${b.value}` : b.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TrackCombatBonusesBar({
  combat,
  damageReduction,
  effectResistances,
  className,
}: TrackCombatBonusesBarProps) {
  // Filtra apenas bônus de habilidades de trilha
  const attackBonuses = combat.attack.breakdown.filter(b => 
    b.type === 'ability' && b.active
  );
  const damageBonuses = combat.damage.breakdown.filter(b => 
    b.type === 'ability' && b.active
  );
  const criticalBonuses = combat.criticalMargin.breakdown.filter(b => 
    b.type === 'ability' && b.active
  );
  const initiativeBonuses = combat.initiative.breakdown.filter(b => 
    b.type === 'ability' && b.active
  );
  const rdPhysical = damageReduction.physical.breakdown.filter(b => 
    b.type === 'ability' && b.active
  );

  // Se não há bônus de trilha, não mostra nada
  const hasTrackBonuses = 
    attackBonuses.length > 0 || 
    damageBonuses.length > 0 || 
    criticalBonuses.length > 0 ||
    initiativeBonuses.length > 0 ||
    rdPhysical.length > 0;

  if (!hasTrackBonuses) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {/* Bônus de Ataque */}
      {attackBonuses.length > 0 && (
        <BonusItem
          icon={Crosshair}
          label="Ataque"
          value={attackBonuses.reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0)}
          variant="attack"
          tooltip={
            <div>
              <p className="font-medium mb-1">Bônus de Ataque (Trilha)</p>
              {renderBreakdown(attackBonuses)}
            </div>
          }
        />
      )}

      {/* Bônus de Dano */}
      {damageBonuses.length > 0 && (
        <BonusItem
          icon={Swords}
          label="Dano"
          value={
            damageBonuses.some(b => typeof b.value === 'string')
              ? damageBonuses.map(b => `+${b.value}`).join(' ')
              : damageBonuses.reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0)
          }
          variant="damage"
          tooltip={
            <div>
              <p className="font-medium mb-1">Bônus de Dano (Trilha)</p>
              {renderBreakdown(damageBonuses)}
            </div>
          }
        />
      )}

      {/* Margem de Ameaça */}
      {criticalBonuses.length > 0 && (
        <BonusItem
          icon={Target}
          label="Crítico"
          value={criticalBonuses.reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0)}
          variant="critical"
          tooltip={
            <div>
              <p className="font-medium mb-1">Margem de Ameaça (Trilha)</p>
              {renderBreakdown(criticalBonuses)}
              <p className="text-muted-foreground text-[10px] mt-1">
                Reduz número necessário para crítico
              </p>
            </div>
          }
        />
      )}

      {/* Iniciativa */}
      {initiativeBonuses.length > 0 && (
        <BonusItem
          icon={Zap}
          label="Iniciativa"
          value={initiativeBonuses.reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0)}
          variant="default"
          tooltip={
            <div>
              <p className="font-medium mb-1">Bônus de Iniciativa (Trilha)</p>
              {renderBreakdown(initiativeBonuses)}
            </div>
          }
        />
      )}

      {/* Redução de Dano */}
      {rdPhysical.length > 0 && (
        <BonusItem
          icon={Shield}
          label="RD"
          value={rdPhysical.reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0)}
          variant="defense"
          tooltip={
            <div>
              <p className="font-medium mb-1">Redução de Dano (Trilha)</p>
              {renderBreakdown(rdPhysical)}
              <p className="text-muted-foreground text-[10px] mt-1">
                Reduz dano físico recebido
              </p>
            </div>
          }
        />
      )}
    </div>
  );
}
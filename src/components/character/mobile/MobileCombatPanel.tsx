/**
 * MobileCombatPanel - Painel de combate otimizado para mobile
 * Lista armas equipadas com stats e botões de ataque
 * Exibe buffs ativos e permite rolagem de iniciativa
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sword, 
  Target, 
  Crosshair, 
  Hand,
  Zap,
  Sparkles,
  Dices,
  ChevronDown,
  ChevronUp,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { WeaponBuff, ELEMENT_BUFF_COLORS } from '@/hooks/useWeaponBuffs';
import { getElementConfig } from '@/lib/element-config';

// Interface para arma
export interface WeaponEntry {
  id: string;
  name: string;
  type: 'Briga' | 'Arremesso' | 'Disparo' | 'Corpo a Corpo';
  damage: string;
  damageType?: string;
  ammoCurrent?: number;
  ammoMax?: number;
  range?: string;
  critical?: string;
  criticalMultiplier?: string;
  special?: string;
  notes?: string;
  ammoType?: string;
}

// Props do componente
interface MobileCombatPanelProps {
  weapons: WeaponEntry[];
  weaponBuffs?: WeaponBuff[];
  agility: number;
  onWeaponClick: (weapon: WeaponEntry) => void;
  onRollInitiative?: () => void;
}

// Ícone por tipo de arma
function WeaponTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'Briga':
      return <Hand className="w-4 h-4" />;
    case 'Arremesso':
      return <Target className="w-4 h-4" />;
    case 'Disparo':
      return <Crosshair className="w-4 h-4" />;
    default:
      return <Sword className="w-4 h-4" />;
  }
}

// Card de arma individual
function WeaponCard({ 
  weapon, 
  buffs,
  onClick 
}: { 
  weapon: WeaponEntry; 
  buffs: WeaponBuff[];
  onClick: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  
  // Verifica se tem munição
  const hasAmmo = weapon.ammoCurrent !== undefined && weapon.ammoMax !== undefined;
  const isOutOfAmmo = hasAmmo && weapon.ammoCurrent === 0;
  
  // Todos os buffs se aplicam a todas as armas (Amaldiçoar Arma afeta arma tocada)
  const activeBuffs = buffs;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-3 rounded-lg border transition-all",
        isOutOfAmmo 
          ? "bg-destructive/10 border-destructive/30 opacity-60" 
          : "bg-card/50 border-border active:bg-card/80"
      )}
    >
      {/* Header da arma */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
            "bg-primary/10 text-primary"
          )}>
            <WeaponTypeIcon type={weapon.type} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{weapon.name}</p>
            <p className="text-[10px] text-muted-foreground">{weapon.type}</p>
          </div>
        </div>
        
        {/* Stats compactos */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="outline" className="text-[10px] px-1.5">
            {weapon.damage}
          </Badge>
          <Badge 
            variant="outline" 
            className="text-[10px] px-1.5 text-destructive border-destructive/30"
          >
            {weapon.critical || '20'}
          </Badge>
        </div>
      </div>

      {/* Buffs ativos */}
      {activeBuffs.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {activeBuffs.map(buff => {
            const elementConfig = getElementConfig(buff.element);
            return (
              <span
                key={buff.id}
                className={cn(
                  "px-1.5 py-0.5 rounded text-[9px] font-medium",
                  "flex items-center gap-1",
                  elementConfig?.bg || "bg-primary/10",
                  elementConfig?.text || "text-primary"
                )}
              >
                <Sparkles className="w-2.5 h-2.5" />
                {buff.ritualName}
              </span>
            );
          })}
        </div>
      )}

      {/* Munição */}
      {hasAmmo && (
        <div className="flex items-center gap-2 mt-2 text-[10px]">
          <span className="text-muted-foreground">Munição:</span>
          <span className={cn(
            "font-medium",
            isOutOfAmmo ? "text-destructive" : "text-foreground"
          )}>
            {weapon.ammoCurrent}/{weapon.ammoMax}
          </span>
        </div>
      )}

      {/* Detalhes expandidos */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-2 mt-2 border-t border-border space-y-1 text-[10px] text-muted-foreground">
              {weapon.range && <p>Alcance: {weapon.range}</p>}
              {weapon.special && <p>Especial: {weapon.special}</p>}
              {weapon.notes && <p>Notas: {weapon.notes}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botões de ação */}
      <div className="flex gap-2 mt-3">
        <Button
          onClick={onClick}
          disabled={isOutOfAmmo}
          size="sm"
          className="flex-1 h-10 font-display text-xs"
        >
          <Sword className="w-4 h-4 mr-1" />
          ATACAR
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="h-10 px-2"
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>
    </motion.div>
  );
}

export function MobileCombatPanel({
  weapons,
  weaponBuffs = [],
  agility,
  onWeaponClick,
  onRollInitiative,
}: MobileCombatPanelProps) {
  // Separa armas por tipo
  const meleeWeapons = weapons.filter(w => w.type !== 'Disparo' && w.type !== 'Arremesso');
  const rangedWeapons = weapons.filter(w => w.type === 'Disparo' || w.type === 'Arremesso');

  if (weapons.length === 0) {
    return (
      <div className="ordo-panel p-4 text-center">
        <Sword className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">Nenhuma arma equipada</p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          Equipe armas no inventário para usar no combate
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header com iniciativa */}
      <div className="ordo-panel p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">COMBATE</p>
            <p className="text-[10px] text-muted-foreground">
              {weapons.length} arma{weapons.length > 1 ? 's' : ''} equipada{weapons.length > 1 ? 's' : ''}
            </p>
          </div>
          {onRollInitiative && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRollInitiative}
              className="h-9 gap-1.5 text-xs font-display"
            >
              <Dices className="w-4 h-4" />
              INICIATIVA
            </Button>
          )}
        </div>

        {/* Buffs globais ativos */}
        {weaponBuffs.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-[10px] text-muted-foreground mb-2">Buffs ativos:</p>
            <div className="flex flex-wrap gap-1.5">
              {weaponBuffs.map(buff => {
                const elementConfig = getElementConfig(buff.element);
                return (
                  <span
                    key={buff.id}
                    className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-medium",
                      "flex items-center gap-1.5",
                      elementConfig?.bg || "bg-primary/10",
                      elementConfig?.text || "text-primary",
                      elementConfig?.border || "border-primary/30",
                      "border"
                    )}
                  >
                    <Flame className="w-3 h-3" />
                    {buff.ritualName}
                    {buff.attackBonus && <span>+{buff.attackBonus} atk</span>}
                    {buff.criticalBonus && <span>-{buff.criticalBonus} crit</span>}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Lista de armas corpo a corpo */}
      {meleeWeapons.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-1">
            Corpo a Corpo ({meleeWeapons.length})
          </p>
          {meleeWeapons.map(weapon => (
            <WeaponCard
              key={weapon.id}
              weapon={weapon}
              buffs={weaponBuffs}
              onClick={() => onWeaponClick(weapon)}
            />
          ))}
        </div>
      )}

      {/* Lista de armas à distância */}
      {rangedWeapons.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-1">
            À Distância ({rangedWeapons.length})
          </p>
          {rangedWeapons.map(weapon => (
            <WeaponCard
              key={weapon.id}
              weapon={weapon}
              buffs={weaponBuffs}
              onClick={() => onWeaponClick(weapon)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

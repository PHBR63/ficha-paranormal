/**
 * MobileCombatDrawer - Drawer dedicado para combate mobile
 * Inclui lista de armas, iniciativa, resistências e ações rápidas
 */

import { useState, useMemo, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sword, 
  Shield, 
  Zap, 
  Brain,
  Dices,
  Target,
  Crosshair,
  Hand,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { WeaponBuff } from '@/hooks/useWeaponBuffs';
import { getElementConfig } from '@/lib/element-config';

// Interface para arma (reutilizada do MobileCombatPanel)
export interface WeaponEntry {
  id: string;
  name: string;
  type: 'Briga' | 'Arremesso' | 'Disparo' | 'Corpo a Corpo' | string;
  damage: string;
  damageType?: string;
  ammoCurrent?: number;
  ammoMax?: number;
  range?: string;
  critical?: string;
  criticalMultiplier?: string;
  special?: string;
  notes?: string;
}

// Interface para resistências
interface ResistanceStats {
  fortitude: number;
  reflexos: number;
  vontade: number;
  bonuses?: {
    fortitude?: number;
    reflexos?: number;
    vontade?: number;
  };
}

interface MobileCombatDrawerProps {
  weapons: WeaponEntry[];
  weaponBuffs?: WeaponBuff[];
  attributes: {
    agility: number;
    strength: number;
    vigor: number;
    presence: number;
  };
  resistances?: ResistanceStats;
  onAttack: (weapon: WeaponEntry) => void;
  onRollInitiative: () => void;
  onResistanceCheck: (type: 'fortitude' | 'reflexos' | 'vontade') => void;
  className?: string;
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

// Card de arma compacto
const CompactWeaponCard = memo(function CompactWeaponCard({
  weapon,
  buffs,
  onAttack,
}: {
  weapon: WeaponEntry;
  buffs: WeaponBuff[];
  onAttack: () => void;
}) {
  const hasAmmo = weapon.ammoCurrent !== undefined && weapon.ammoMax !== undefined;
  const isOutOfAmmo = hasAmmo && weapon.ammoCurrent === 0;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={cn(
        "p-3 rounded-lg border transition-all",
        isOutOfAmmo 
          ? "bg-destructive/10 border-destructive/30 opacity-60" 
          : "bg-card/50 border-border active:bg-card/80"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <WeaponTypeIcon type={weapon.type} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{weapon.name}</p>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>{weapon.damage}</span>
              <span>•</span>
              <span className="text-destructive">{weapon.critical || '20'}</span>
              {hasAmmo && (
                <>
                  <span>•</span>
                  <span className={isOutOfAmmo ? "text-destructive" : ""}>
                    {weapon.ammoCurrent}/{weapon.ammoMax}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Buffs ativos (indicador compacto) */}
        {buffs.length > 0 && (
          <div className="flex -space-x-1">
            {buffs.slice(0, 2).map(buff => {
              const config = getElementConfig(buff.element);
              return (
                <span
                  key={buff.id}
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px]",
                    config?.bg || "bg-primary/10"
                  )}
                >
                  <Sparkles className="w-3 h-3" />
                </span>
              );
            })}
            {buffs.length > 2 && (
              <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px]">
                +{buffs.length - 2}
              </span>
            )}
          </div>
        )}
        
        <Button
          onClick={onAttack}
          disabled={isOutOfAmmo}
          size="sm"
          className="h-9 px-3 font-display text-xs"
        >
          <Sword className="w-3.5 h-3.5 mr-1" />
          ATK
        </Button>
      </div>
    </motion.div>
  );
});

// Card de resistência
const ResistanceCard = memo(function ResistanceCard({
  type,
  label,
  icon: Icon,
  pool,
  bonus,
  color,
  onClick,
}: {
  type: 'fortitude' | 'reflexos' | 'vontade';
  label: string;
  icon: React.ElementType;
  pool: number;
  bonus?: number;
  color: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg border text-center transition-all",
        "bg-card/50 border-border active:bg-card/80"
      )}
    >
      <Icon className={cn("w-5 h-5 mx-auto mb-1", color)} />
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
      <p className="font-display text-lg">
        {pool}d
        {bonus && bonus > 0 && (
          <span className="text-success text-sm ml-0.5">+{bonus}</span>
        )}
      </p>
    </motion.button>
  );
});

export const MobileCombatDrawer = memo(function MobileCombatDrawer({
  weapons,
  weaponBuffs = [],
  attributes,
  resistances,
  onAttack,
  onRollInitiative,
  onResistanceCheck,
  className,
}: MobileCombatDrawerProps) {
  const [open, setOpen] = useState(false);
  
  // Separa armas por tipo
  const { meleeWeapons, rangedWeapons } = useMemo(() => ({
    meleeWeapons: weapons.filter(w => w.type !== 'Disparo' && w.type !== 'Arremesso'),
    rangedWeapons: weapons.filter(w => w.type === 'Disparo' || w.type === 'Arremesso'),
  }), [weapons]);

  // Handler para ataque com feedback
  const handleAttack = useCallback((weapon: WeaponEntry) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
    onAttack(weapon);
    setOpen(false);
  }, [onAttack]);

  // Handler para resistência com feedback
  const handleResistance = useCallback((type: 'fortitude' | 'reflexos' | 'vontade') => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onResistanceCheck(type);
  }, [onResistanceCheck]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          className={cn("gap-2 font-display", className)}
        >
          <Sword className="w-4 h-4" />
          COMBATE
          {weapons.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {weapons.length}
            </Badge>
          )}
        </Button>
      </DrawerTrigger>
      
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DrawerTitle className="font-display text-lg">
              Modo Combate
            </DrawerTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if ('vibrate' in navigator) navigator.vibrate(10);
                onRollInitiative();
              }}
              className="h-8 gap-1.5 text-xs font-display"
            >
              <Dices className="w-4 h-4" />
              INICIATIVA
            </Button>
          </div>
        </DrawerHeader>
        
        <div className="px-4 pb-6 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Seção de Resistências */}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
              Testes de Resistência
            </p>
            <div className="grid grid-cols-3 gap-2">
              <ResistanceCard
                type="fortitude"
                label="Fortitude"
                icon={Shield}
                pool={attributes.vigor}
                bonus={resistances?.bonuses?.fortitude}
                color="text-green-500"
                onClick={() => handleResistance('fortitude')}
              />
              <ResistanceCard
                type="reflexos"
                label="Reflexos"
                icon={Zap}
                pool={attributes.agility}
                bonus={resistances?.bonuses?.reflexos}
                color="text-blue-500"
                onClick={() => handleResistance('reflexos')}
              />
              <ResistanceCard
                type="vontade"
                label="Vontade"
                icon={Brain}
                pool={attributes.presence}
                bonus={resistances?.bonuses?.vontade}
                color="text-purple-500"
                onClick={() => handleResistance('vontade')}
              />
            </div>
          </div>
          
          {/* Buffs ativos globais */}
          {weaponBuffs.length > 0 && (
            <div className="p-3 rounded-lg bg-paranormal/10 border border-paranormal/20">
              <p className="text-[10px] text-paranormal uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Buffs Ativos
              </p>
              <div className="flex flex-wrap gap-1.5">
                {weaponBuffs.map(buff => {
                  const config = getElementConfig(buff.element);
                  return (
                    <span
                      key={buff.id}
                      className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-medium flex items-center gap-1",
                        config?.bg || "bg-primary/10",
                        config?.text || "text-primary"
                      )}
                    >
                      {buff.ritualName}
                      {buff.attackBonus && <span>+{buff.attackBonus}</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Lista de armas */}
          {weapons.length > 0 ? (
            <>
              {meleeWeapons.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                    Corpo a Corpo ({meleeWeapons.length})
                  </p>
                  <div className="space-y-2">
                    {meleeWeapons.map(weapon => (
                      <CompactWeaponCard
                        key={weapon.id}
                        weapon={weapon}
                        buffs={weaponBuffs}
                        onAttack={() => handleAttack(weapon)}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {rangedWeapons.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                    À Distância ({rangedWeapons.length})
                  </p>
                  <div className="space-y-2">
                    {rangedWeapons.map(weapon => (
                      <CompactWeaponCard
                        key={weapon.id}
                        weapon={weapon}
                        buffs={weaponBuffs}
                        onAttack={() => handleAttack(weapon)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <Sword className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma arma equipada</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1">
                Equipe armas no inventário
              </p>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
});

export default MobileCombatDrawer;

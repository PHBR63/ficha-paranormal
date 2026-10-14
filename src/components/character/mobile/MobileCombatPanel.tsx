import { WeaponBuffIndicator } from '../WeaponBuffIndicator';
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
  Award,
} from '@/components/icons/ordem-icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { WeaponBuff, ELEMENT_BUFF_COLORS } from '@/hooks/useWeaponBuffs';
import { getElementConfig } from '@/lib/element-config';
import { type WeaponDisplayType } from '@/lib/weapon-type-inference';
import { getWeaponGroupForWeapon, getWeaponGroupName } from '@/lib/constants/weapon-groups';

// Interface para arma - usa WeaponDisplayType do módulo de inferência
export interface WeaponEntry {
  id: string;
  name: string;
  type: WeaponDisplayType;
  damage: string;
  damageType?: string;
  ammoCurrent?: number;
  ammoMax?: number;
  range?: string;
  baseRange?: string;
  critical?: string;
  criticalMultiplier?: string;
  special?: string;
  notes?: string;
  ammoType?: string;
  catalogId?: string;
  weaponType?: string;
  properties?: string[];
  appliedModifications?: string[];
  modificationAttackBonus?: number;
  modificationEffects?: string[];
  /** Indica se esta arma é a favorita do Aniquilador (habilidade "A Favorita") */
  isFavoriteWeapon?: boolean;
  favoriteAbilityId?: string;
  /** Categoria da arma para proficiência (0=Simples, I=Tática, II=Pesada) */
  category?: '0' | 'I' | 'II';
}

// Props do componente
interface MobileCombatPanelProps {
  weapons: WeaponEntry[];
  weaponBuffs?: WeaponBuff[];
  agility: number;
  strength?: number;
  onWeaponClick: (weapon: WeaponEntry) => void;
  onRollInitiative?: () => void;
  /** Grupos de armas escolhidos em Especialista em Arma */
  especialistaArmaGroups?: string[];
  /** Dano desarmado do SUE (Artista Marcial) */
  unarmedDamage?: string;
  /** Se o personagem tem Artista Marcial (ataque ágil) */
  hasArtistaMarcial?: boolean;
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
  onClick,
  especialistaArmaGroups = [],
}: { 
  weapon: WeaponEntry; 
  buffs: WeaponBuff[];
  onClick: () => void;
  especialistaArmaGroups?: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  
  // Verifica se tem munição
  const hasAmmo = weapon.ammoCurrent !== undefined && weapon.ammoMax !== undefined;
  const isOutOfAmmo = hasAmmo && weapon.ammoCurrent === 0;
  
  // Todos os buffs se aplicam a todas as armas (Amaldiçoar Arma afeta arma tocada)
  const activeBuffs = buffs;
  
  // Verifica se esta arma tem bônus de Especialista em Arma
  const weaponGroup = useMemo(() => {
    return getWeaponGroupForWeapon(weapon.id || weapon.name);
  }, [weapon.id, weapon.name]);
  
  const hasEspecialistaBonus = weaponGroup && especialistaArmaGroups.includes(weaponGroup);

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
        
        {/* Stats compactos + indicador Especialista */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Indicador compacto de Especialista em Arma */}
          {hasEspecialistaBonus && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30">
                    <Award className="w-3 h-3" />
                    <span className="text-[9px] font-bold">+2</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px]">
                  <p className="text-xs font-medium">Especialista em Arma</p>
                  <p className="text-[10px] text-muted-foreground">
                    +2 no ataque e dano ({getWeaponGroupName(weaponGroup!)})
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
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
          aria-label={`Detalhes da arma ${weapon.name}`}
          aria-expanded={expanded}
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
  strength = 0,
  onWeaponClick,
  onRollInitiative,
  especialistaArmaGroups = [],
  unarmedDamage,
  hasArtistaMarcial = false,
}: MobileCombatPanelProps) {
  // Separa armas por tipo
  const meleeWeapons = weapons.filter(w => w.type !== 'Disparo' && w.type !== 'Arremesso');
  const rangedWeapons = weapons.filter(w => w.type === 'Disparo' || w.type === 'Arremesso');

  // Cria entrada de ataque desarmado
  const unarmedWeaponEntry: WeaponEntry = {
    id: '__unarmed__',
    name: 'Ataque Desarmado',
    type: 'Briga',
    damage: unarmedDamage || '1d4',
    damageType: 'contusão',
    critical: '20',
    criticalMultiplier: 'x2',
    special: hasArtistaMarcial ? 'Ágil, Letal' : undefined,
  };

  // Handler para ataque desarmado
  const handleUnarmedClick = () => {
    onWeaponClick(unarmedWeaponEntry);
  };

  // Se não tem armas, mostra apenas opção desarmada
  if (weapons.length === 0) {
    return (
      <div className="space-y-3">
        {/* Header com iniciativa */}
        <div className="ordo-panel p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">COMBATE</p>
              <p className="text-[10px] text-muted-foreground">
                Nenhuma arma equipada
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
        </div>

        <WeaponBuffIndicator buffs={weaponBuffs} />
        {/* Ataque Desarmado */}
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-1">
            Desarmado
          </p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg border bg-card/50 border-border active:bg-card/80 cursor-pointer"
            onClick={handleUnarmedClick}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-orange-500/10 text-orange-500">
                  <Hand className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">Ataque Desarmado</p>
                  <p className="text-[10px] text-muted-foreground">Briga</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {hasArtistaMarcial && (
                  <Badge variant="secondary" className="text-[9px] bg-orange-500/20 text-orange-400 border-orange-500/30">
                    Ágil
                  </Badge>
                )}
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold text-orange-500">
                    {unarmedDamage || '1d4'}
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    {hasArtistaMarcial ? '+AGI' : '+FOR'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
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
              <WeaponBuffIndicator buffs={weaponBuffs} />
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
              especialistaArmaGroups={especialistaArmaGroups}
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
              especialistaArmaGroups={especialistaArmaGroups}
            />
          ))}
        </div>
      )}
    </div>
  );
}

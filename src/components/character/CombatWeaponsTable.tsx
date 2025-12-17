/**
 * CombatWeaponsTable - Tabela de armas/combate estilo ficha de papel
 * Mostra armas equipadas com detalhes de dano, munição, alcance
 * Integra modal de combate com seleção de bônus e rolagem de dano
 * Fase 5: Mostra buffs de rituais como Amaldiçoar Arma
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sword, Target, Crosshair, Dices, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CombatRollModal } from './CombatRollModal';
import { DiceRollResult } from '@/lib/dice-roller';
import { WeaponBuff } from '@/hooks/useWeaponBuffs';
import { WeaponBuffIndicator, WeaponBuffsPanel } from './WeaponBuffIndicator';
import { formatDamageFormula } from '@/lib/ritual-effects';
import type { SustainedRitual } from '@/lib/sustained-rituals';

// Interface para arma com dados completos
export interface WeaponEntry {
  id: string;
  name: string;
  type: 'Briga' | 'Arremesso' | 'Disparo' | 'Corpo a Corpo';
  damage: string;
  damageType?: string; // Tipo de dano (Corte, Balístico, Impacto, etc.)
  ammoCurrenteRent?: number;
  ammoMax?: number;
  range?: string;
  critical?: string; // Valor de crítico (ex: "19")
  criticalMultiplier?: string; // Multiplicador (ex: "x3")
  special?: string; // Propriedades especiais
  notes?: string;
  ammoType?: string; // Tipo de munição
}

// Props com dados necessários para o sistema de combate
interface CombatWeaponsTableProps {
  weapons: WeaponEntry[];
  className?: string;
  
  // Dados do personagem para cálculos de combate
  attributes?: {
    agility: number;
    strength: number;
    presence: number;
    intellect: number;
    vigor: number;
  };
  skills?: Record<string, number>;
  
  // Recursos
  currentPE?: number;
  maxPE?: number;
  onPEChange?: (newPE: number) => void;
  
  // Dados de classe e poderes
  characterClass?: string;
  abilities?: string[];
  paranormalPowers?: Array<{ id: string; name: string; element: string }>;
  hasAffinity?: boolean;
  affinityElement?: string | null;
  sustainedRituals?: SustainedRitual[]; // Rituais sustentados ativos
  nex?: number;
  
  // Callback para histórico
  onRollComplete?: (result: DiceRollResult) => void;
  
  // Fallback antigo para compatibilidade
  onRollAttack?: (weapon: WeaponEntry) => void;
  
  // Fase 5: Buffs de arma ativos
  weaponBuffs?: WeaponBuff[];
  onRemoveWeaponBuff?: (buffId: string) => void;
  onClearAllWeaponBuffs?: () => void;
}

// Ícone por tipo de arma
function WeaponTypeIcon({ type }: { type: WeaponEntry['type'] }) {
  switch (type) {
    case 'Briga':
      return <Sword className="w-4 h-4" />;
    case 'Arremesso':
      return <Target className="w-4 h-4" />;
    case 'Disparo':
      return <Crosshair className="w-4 h-4" />;
    default:
      return <Sword className="w-4 h-4" />;
  }
}

export function CombatWeaponsTable({ 
  weapons,
  className,
  attributes,
  skills,
  currentPE,
  maxPE,
  onPEChange,
  characterClass,
  abilities,
  paranormalPowers,
  hasAffinity,
  affinityElement,
  sustainedRituals = [],
  nex,
  onRollComplete,
  onRollAttack, // Fallback antigo
  // Fase 5: Props de buffs de arma
  weaponBuffs = [],
  onRemoveWeaponBuff,
  onClearAllWeaponBuffs,
}: CombatWeaponsTableProps) {
  // Estado do modal de combate
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponEntry | null>(null);
  const [combatModalOpen, setCombatModalOpen] = useState(false);

  // Handler de clique na arma
  const handleWeaponClick = (weapon: WeaponEntry) => {
    // Se temos os dados necessários, abre o modal de combate completo
    if (attributes && skills && currentPE !== undefined && onPEChange) {
      setSelectedWeapon(weapon);
      setCombatModalOpen(true);
    } else if (onRollAttack) {
      // Fallback para comportamento antigo
      onRollAttack(weapon);
    }
  };

  // Se não há armas, mostra mensagem
  if (weapons.length === 0) {
    return (
      <div className={cn("sheet-panel p-4", className)}>
        <h3 className="font-display text-sm tracking-wider text-primary mb-4 uppercase">
          Combate
        </h3>
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhuma arma equipada. Equipe armas no inventário.
        </p>
      </div>
    );
  }

  // Calcula bônus totais dos buffs de arma
  const totalAttackBonus = weaponBuffs.reduce((sum, b) => sum + (b.attackBonus || 0), 0);
  const totalCriticalBonus = weaponBuffs.reduce((sum, b) => sum + (b.criticalBonus || 0), 0);
  const totalCriticalMultiplierBonus = weaponBuffs.reduce((sum, b) => sum + (b.criticalMultiplierBonus || 0), 0);
  const bonusDamageStrings = weaponBuffs
    .filter(b => b.bonusDamage)
    .map(b => `+${formatDamageFormula(b.bonusDamage!)}`);
  const hasBuffs = weaponBuffs.length > 0;

  return (
    <div className={cn("sheet-panel p-4", className)}>
      <h3 className="font-display text-sm tracking-wider text-primary mb-4 uppercase flex items-center gap-2">
        <Dices className="w-4 h-4" />
        Combate
        {hasBuffs && (
          <span className="ml-auto flex items-center gap-1 text-xs font-normal text-amber-400">
            <Sparkles className="w-3 h-3" />
            {weaponBuffs.length} buff{weaponBuffs.length > 1 ? 's' : ''}
          </span>
        )}
      </h3>

      {/* Painel de buffs ativos (Fase 5) */}
      {hasBuffs && (
        <WeaponBuffsPanel
          buffs={weaponBuffs}
          onRemoveBuff={onRemoveWeaponBuff}
          onClearAll={onClearAllWeaponBuffs}
          className="mb-4"
        />
      )}
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wider">
                Nome
              </TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wider">
                Tipo
              </TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wider">
                Dano
              </TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wider">
                Mun.
              </TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wider">
                Alcance
              </TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wider">
                Crítico
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weapons.map((weapon, index) => {
              // Calcula crítico modificado pelos buffs
              const baseCritical = parseInt(weapon.critical || '20');
              const modifiedCritical = baseCritical - totalCriticalBonus;
              const baseMultiplier = weapon.criticalMultiplier || 'x2';
              const multiplierNum = parseInt(baseMultiplier.replace('x', ''));
              const modifiedMultiplier = `x${multiplierNum + totalCriticalMultiplierBonus}`;
              const criticalChanged = totalCriticalBonus > 0 || totalCriticalMultiplierBonus > 0;

              return (
                <motion.tr
                  key={weapon.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "border-border/30 cursor-pointer group",
                    "hover:bg-primary/10 transition-colors",
                    hasBuffs && "bg-primary/5" // Destaque visual quando há buffs
                  )}
                  onClick={() => handleWeaponClick(weapon)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <WeaponTypeIcon type={weapon.type} />
                      <span className="group-hover:text-primary transition-colors">
                        {weapon.name}
                      </span>
                      <Dices className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {/* Indicador compacto de buffs na linha da arma */}
                    {hasBuffs && (
                      <WeaponBuffIndicator buffs={weaponBuffs} compact className="mt-1" />
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs px-2 py-0.5 rounded bg-secondary/50 text-secondary-foreground">
                      {weapon.type}
                    </span>
                  </TableCell>
                  <TableCell className="font-display">
                    <div className="flex flex-col">
                      {/* Dano base + dano bônus dos buffs */}
                      <span className={cn(
                        "text-destructive",
                        hasBuffs && "flex items-center gap-1"
                      )}>
                        {weapon.damage}
                        {bonusDamageStrings.length > 0 && (
                          <span className="text-amber-400 font-medium">
                            {bonusDamageStrings.join(' ')}
                          </span>
                        )}
                      </span>
                      {weapon.damageType && (
                        <span className="text-[10px] text-muted-foreground font-normal">
                          {weapon.damageType}
                          {bonusDamageStrings.length > 0 && ' + elemental'}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {weapon.ammoMax !== undefined || weapon.ammoType ? (
                      <span className="text-sm">
                        {weapon.ammoMax ? `${weapon.ammoCurrenteRent ?? weapon.ammoMax}/${weapon.ammoMax}` : weapon.ammoType || '—'}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {weapon.range || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className={cn(criticalChanged && "text-amber-400")}>
                        {modifiedCritical}{modifiedMultiplier}
                        {criticalChanged && (
                          <span className="text-[10px] text-muted-foreground ml-1">
                            (era {weapon.critical || '20'}{baseMultiplier})
                          </span>
                        )}
                      </span>
                      {weapon.special && (
                        <span className="text-[10px] text-muted-foreground" title={weapon.special}>
                          {weapon.special.length > 20 ? weapon.special.substring(0, 20) + '...' : weapon.special}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </motion.tr>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Modal de combate completo */}
      {attributes && skills && currentPE !== undefined && maxPE !== undefined && onPEChange && (
        <CombatRollModal
          open={combatModalOpen}
          onClose={() => {
            setCombatModalOpen(false);
            setSelectedWeapon(null);
          }}
          weapon={selectedWeapon}
          attributes={attributes}
          skills={skills}
          currentPE={currentPE}
          maxPE={maxPE}
          onPEChange={onPEChange}
          characterClass={characterClass || ''}
          abilities={abilities || []}
          paranormalPowers={paranormalPowers || []}
          hasAffinity={hasAffinity || false}
          affinityElement={affinityElement}
          sustainedRituals={sustainedRituals}
          nex={nex || 5}
          onRollComplete={onRollComplete}
        />
      )}
    </div>
  );
}

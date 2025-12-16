/**
 * CombatWeaponsTable - Tabela de armas/combate estilo ficha de papel
 * Mostra armas equipadas com detalhes de dano, munição, alcance
 * Integra modal de combate com seleção de bônus e rolagem de dano
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sword, Target, Crosshair, Dices } from 'lucide-react';
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
  activeRituals?: string[];
  nex?: number;
  
  // Callback para histórico
  onRollComplete?: (result: DiceRollResult) => void;
  
  // Fallback antigo para compatibilidade
  onRollAttack?: (weapon: WeaponEntry) => void;
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
  activeRituals,
  nex,
  onRollComplete,
  onRollAttack, // Fallback antigo
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

  return (
    <div className={cn("sheet-panel p-4", className)}>
      <h3 className="font-display text-sm tracking-wider text-primary mb-4 uppercase flex items-center gap-2">
        <Dices className="w-4 h-4" />
        Combate
      </h3>
      
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
            {weapons.map((weapon, index) => (
              <motion.tr
                key={weapon.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "border-border/30 cursor-pointer group",
                  "hover:bg-primary/10 transition-colors"
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
                </TableCell>
                <TableCell>
                  <span className="text-xs px-2 py-0.5 rounded bg-secondary/50 text-secondary-foreground">
                    {weapon.type}
                  </span>
                </TableCell>
                <TableCell className="font-display text-destructive">
                  <div className="flex flex-col">
                    <span>{weapon.damage}</span>
                    {weapon.damageType && (
                      <span className="text-[10px] text-muted-foreground font-normal">
                        {weapon.damageType}
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
                    <span>{weapon.critical || '20'}{weapon.criticalMultiplier ? ` ${weapon.criticalMultiplier}` : ' x2'}</span>
                    {weapon.special && (
                      <span className="text-[10px] text-muted-foreground" title={weapon.special}>
                        {weapon.special.length > 20 ? weapon.special.substring(0, 20) + '...' : weapon.special}
                      </span>
                    )}
                  </div>
                </TableCell>
              </motion.tr>
            ))}
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
          activeRituals={activeRituals}
          nex={nex || 5}
          onRollComplete={onRollComplete}
        />
      )}
    </div>
  );
}

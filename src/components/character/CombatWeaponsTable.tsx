/**
 * CombatWeaponsTable - Tabela de armas/combate estilo ficha de papel
 * Mostra armas equipadas com detalhes de dano, munição, alcance
 */

import { motion } from 'framer-motion';
import { Sword, Target, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface WeaponEntry {
  id: string;
  name: string;
  type: 'Briga' | 'Arremesso' | 'Disparo' | 'Corpo a Corpo';
  damage: string;
  ammoCurrenteRent?: number;
  ammoMax?: number;
  range?: string;
  critical?: string;
  notes?: string;
}

interface CombatWeaponsTableProps {
  weapons: WeaponEntry[];
  onRollAttack?: (weapon: WeaponEntry) => void;
  className?: string;
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
  onRollAttack, 
  className 
}: CombatWeaponsTableProps) {
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
      <h3 className="font-display text-sm tracking-wider text-primary mb-4 uppercase">
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
                  "border-border/30 cursor-pointer",
                  "hover:bg-primary/10 transition-colors"
                )}
                onClick={() => onRollAttack?.(weapon)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <WeaponTypeIcon type={weapon.type} />
                    {weapon.name}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs px-2 py-0.5 rounded bg-secondary/50 text-secondary-foreground">
                    {weapon.type}
                  </span>
                </TableCell>
                <TableCell className="font-display text-destructive">
                  {weapon.damage}
                </TableCell>
                <TableCell>
                  {weapon.ammoMax !== undefined ? (
                    <span className="text-sm">
                      {weapon.ammoCurrenteRent ?? weapon.ammoMax}/{weapon.ammoMax}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {weapon.range || <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  {weapon.critical || '20'}
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

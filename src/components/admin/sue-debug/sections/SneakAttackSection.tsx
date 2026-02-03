/**
 * SneakAttackSection - Seção de Ataque Furtivo
 * 
 * Exibe dados do ataque furtivo: dados de dano, custo PE, usos por rodada.
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ComputedEffects } from '@/hooks';

interface SneakAttackSectionProps {
  sneakAttack: ComputedEffects['sneakAttack'];
  compact?: boolean;
}

/**
 * Seção que exibe detalhes do ataque furtivo
 */
export function SneakAttackSection({ sneakAttack, compact }: SneakAttackSectionProps) {
  if (!sneakAttack.available) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 text-violet-400" />
        <span className="text-sm font-medium">Ataque Furtivo</span>
        <Badge className="text-xs">
          {sneakAttack.totalDice}{sneakAttack.dieType}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-1 pl-6 text-xs">
        <div>Custo PE: {sneakAttack.peCost}</div>
        <div>Usos/Rodada: {sneakAttack.usesPerRound || '∞'}</div>
        {sneakAttack.multiplier > 1 && (
          <div>Multiplicador: x{sneakAttack.multiplier}</div>
        )}
      </div>
    </div>
  );
}

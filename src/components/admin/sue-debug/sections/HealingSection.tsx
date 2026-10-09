/**
 * HealingSection - Seção de Cura
 * 
 * Exibe dados da habilidade de cura: dados, custo PE, alcance, ação.
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import { Heart } from '@/components/icons/ordem-icons';
import { Badge } from '@/components/ui/badge';
import type { ComputedEffects } from '@/hooks';

interface HealingSectionProps {
  healing: ComputedEffects['healing'];
  compact?: boolean;
}

/**
 * Seção que exibe detalhes da habilidade de cura
 */
export function HealingSection({ healing, compact }: HealingSectionProps) {
  if (!healing.available) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Heart className="h-4 w-4 text-pink-400" />
        <span className="text-sm font-medium">Curar Aliado</span>
        <Badge className="text-xs">
          {healing.baseDice}{healing.dieType}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-1 pl-6 text-xs">
        <div>Custo PE: {healing.peCost}</div>
        <div>Alcance: {healing.range}</div>
        <div>Ação: {healing.actionType}</div>
      </div>
    </div>
  );
}

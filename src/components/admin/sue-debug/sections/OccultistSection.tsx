/**
 * OccultistSection - Seção de Ocultista
 * 
 * Exibe bônus específicos do ocultista: rituais bônus, grimório, etc.
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import { Brain, Check } from '@/components/icons/ordem-icons';
import type { ComputedEffects } from '@/hooks';

interface OccultistSectionProps {
  occultist: ComputedEffects['occultist'];
  compact?: boolean;
}

/**
 * Seção que exibe bônus específicos do ocultista
 */
export function OccultistSection({ occultist, compact }: OccultistSectionProps) {
  if (!occultist) return null;
  
  // Verifica se há conteúdo para mostrar
  const hasContent = 
    (occultist.bonusRituals?.perCircle ?? 0) > 0 || 
    occultist.grimoire?.available;
  
  if (!hasContent) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-violet-400" />
        <span className="text-sm font-medium">Ocultista</span>
      </div>
      <div className="space-y-1 pl-6 text-xs">
        {occultist.bonusRituals?.perCircle > 0 && (
          <div>Rituais Bônus: +{occultist.bonusRituals.perCircle}/círculo</div>
        )}
        {occultist.grimoire?.available && (
          <div className="flex items-center gap-1">
            <Check className="h-3 w-3 text-emerald-400" />
            <span>Grimório Disponível</span>
          </div>
        )}
        {occultist.ritualPowerBonus?.affectsDamage && (
          <div>Bônus de Dano em Rituais Ativo</div>
        )}
      </div>
    </div>
  );
}

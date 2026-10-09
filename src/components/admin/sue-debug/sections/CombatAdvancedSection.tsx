/**
 * CombatAdvancedSection - Seção de combate avançado
 * 
 * Exibe mecânicas avançadas como multiplicadores de ataque especial,
 * ações extras, dano máximo em crítico, provocar, etc.
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import { useState } from 'react';
import { Activity, ChevronDown, ChevronRight, Check } from '@/components/icons/ordem-icons';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { ComputedEffects } from '@/hooks';

interface CombatAdvancedSectionProps {
  combatAdvanced: ComputedEffects['combatAdvanced'];
  compact?: boolean;
}

/**
 * Seção colapsável para mecânicas de combate avançado
 */
export function CombatAdvancedSection({ 
  combatAdvanced, 
  compact 
}: CombatAdvancedSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Verifica se há conteúdo para mostrar
  const hasContent = 
    combatAdvanced.specialAttackMultiplier.value > 1 ||
    combatAdvanced.extraActions.length > 0 ||
    combatAdvanced.maximumDamageOnCrit.enabled ||
    combatAdvanced.blockVigorBonus.enabled ||
    combatAdvanced.occultismAsAttack.enabled ||
    combatAdvanced.taunt.available ||
    combatAdvanced.targetStateControl.available ||
    combatAdvanced.conditionalBonuses.whenWounded.active ||
    combatAdvanced.conditionalBonuses.whenDying.canAct;

  if (!hasContent) return null;

  // Conta quantas features estão ativas
  const activeCount = [
    combatAdvanced.specialAttackMultiplier.value > 1,
    combatAdvanced.extraActions.length > 0,
    combatAdvanced.maximumDamageOnCrit.enabled,
    combatAdvanced.taunt.available,
  ].filter(Boolean).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
          {isOpen ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          <Activity className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-medium">Combate Avançado</span>
          <Badge variant="secondary" className="text-xs">
            {activeCount} ativos
          </Badge>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 pl-6 pt-1">
          {/* Multiplicador de Ataque Especial */}
          {combatAdvanced.specialAttackMultiplier.value > 1 && (
            <div className="text-xs">
              <span className="text-muted-foreground">Multiplicador Ataque Especial:</span>
              <Badge className="ml-1">x{combatAdvanced.specialAttackMultiplier.value}</Badge>
              {combatAdvanced.specialAttackMultiplier.weaponRestriction !== 'any' && (
                <span className="text-muted-foreground ml-1">
                  ({combatAdvanced.specialAttackMultiplier.weaponRestriction})
                </span>
              )}
            </div>
          )}
          
          {/* Ações Extras */}
          {combatAdvanced.extraActions.length > 0 && (
            <div className="text-xs">
              <span className="text-muted-foreground">Ações Extras:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {combatAdvanced.extraActions.map((action, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {action.type} ({action.trigger})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Dano Máximo em Crítico */}
          {combatAdvanced.maximumDamageOnCrit.enabled && (
            <div className="text-xs flex items-center gap-1">
              <Check className="h-3 w-3 text-emerald-400" />
              <span>Dano Máximo em Crítico</span>
              {combatAdvanced.maximumDamageOnCrit.weaponTypes.length > 0 && (
                <span className="text-muted-foreground">
                  ({combatAdvanced.maximumDamageOnCrit.weaponTypes.join(', ')})
                </span>
              )}
            </div>
          )}

          {/* Bônus de Vigor ao Bloquear */}
          {combatAdvanced.blockVigorBonus.enabled && (
            <div className="text-xs flex items-center gap-1">
              <Check className="h-3 w-3 text-emerald-400" />
              <span>Bônus de Vigor ao Bloquear</span>
            </div>
          )}

          {/* Ocultismo como Ataque */}
          {combatAdvanced.occultismAsAttack.enabled && (
            <div className="text-xs flex items-center gap-1">
              <Check className="h-3 w-3 text-emerald-400" />
              <span>Ocultismo como Ataque</span>
            </div>
          )}

          {/* Provocar */}
          {combatAdvanced.taunt.available && (
            <div className="text-xs">
              <span className="text-muted-foreground">Provocar:</span>
              {combatAdvanced.taunt.abilities.map((ab, idx) => (
                <Badge key={idx} variant="outline" className="ml-1 text-xs">
                  {ab.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Bônus Quando Ferido */}
          {combatAdvanced.conditionalBonuses.whenWounded.active && (
            <div className="text-xs">
              <span className="text-muted-foreground">Quando Ferido:</span>
              <Badge className="ml-1">
                +{combatAdvanced.conditionalBonuses.whenWounded.defenseBonus} Defesa
              </Badge>
              <Badge className="ml-1">
                RD {combatAdvanced.conditionalBonuses.whenWounded.damageReduction}
              </Badge>
            </div>
          )}

          {/* Pode Agir Morrendo */}
          {combatAdvanced.conditionalBonuses.whenDying.canAct && (
            <div className="text-xs flex items-center gap-1">
              <Check className="h-3 w-3 text-emerald-400" />
              <span>Pode Agir Morrendo</span>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

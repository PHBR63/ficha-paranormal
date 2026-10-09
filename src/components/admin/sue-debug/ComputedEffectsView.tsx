/**
 * ComputedEffectsView - Visualização dos efeitos computados do SUE
 * 
 * Exibe os efeitos agrupados por categoria (combate, defesa, recursos, etc.)
 * com seções colapsáveis e suporte a breakdown detalhado.
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import { Sword, Shield, Heart, Footprints } from '@/components/icons/ordem-icons';
import type { ComputedEffects } from '@/hooks';
import { EffectCategorySection } from './EffectCategorySection';
import {
  FlagsSection,
  CombatAdvancedSection,
  SneakAttackSection,
  HealingSection,
  OccultistSection,
  SkillsSection,
} from './sections';

interface ComputedEffectsViewProps {
  computed: ComputedEffects;
  compact?: boolean;
}

/**
 * Visualiza todos os efeitos computados do SUE organizados por categoria
 */
export function ComputedEffectsView({ computed, compact }: ComputedEffectsViewProps) {
  return (
    <div className="space-y-3">
      {/* Combate */}
      <EffectCategorySection
        title="Combate"
        icon={Sword}
        color="text-rose-400"
        items={[
          { label: 'Ataque (geral)', value: computed.attack.general, breakdown: computed.attack.breakdown },
          { label: 'Ataque (corpo)', value: computed.attack.melee },
          { label: 'Ataque (distância)', value: computed.attack.ranged },
          { label: 'Dano (geral)', value: computed.damage.general, breakdown: computed.damage.breakdown },
          { label: 'Margem Crítico', value: computed.critical.marginBonus },
          { label: 'Mult. Crítico', value: computed.critical.multiplierBonus },
        ]}
        compact={compact}
      />

      {/* Defesa */}
      <EffectCategorySection
        title="Defesa"
        icon={Shield}
        color="text-sky-400"
        items={[
          { label: 'Defesa (geral)', value: computed.defense.general, breakdown: computed.defense.breakdown },
          { label: 'vs Corpo-a-corpo', value: computed.defense.vsMelee },
          { label: 'vs Distância', value: computed.defense.vsRanged },
          { label: 'RD Física', value: computed.damageReduction.physical },
          { label: 'RD Paranormal', value: computed.damageReduction.paranormal },
        ]}
        compact={compact}
      />

      {/* Resistências */}
      <EffectCategorySection
        title="Resistências"
        icon={Shield}
        color="text-emerald-400"
        items={[
          { label: 'Fortitude', value: computed.resistances.fortitude },
          { label: 'Reflexos', value: computed.resistances.reflexos },
          { label: 'Vontade', value: computed.resistances.vontade },
        ]}
        compact={compact}
      />

      {/* Recursos */}
      <EffectCategorySection
        title="Recursos"
        icon={Heart}
        color="text-pink-400"
        items={[
          { label: 'Bônus PV', value: computed.resources.hpBonus },
          { label: 'Bônus PE', value: computed.resources.peBonus },
          { label: 'Bônus SAN', value: computed.resources.sanityBonus },
          { label: 'PV Temporário', value: computed.resources.tempHP },
        ]}
        compact={compact}
      />

      {/* Movimento & Iniciativa */}
      <EffectCategorySection
        title="Movimento & Iniciativa"
        icon={Footprints}
        color="text-emerald-400"
        items={[
          { label: 'Movimento', value: computed.movement.bonus },
          { label: 'Mult. Movimento', value: computed.movement.multiplier },
          { label: 'Iniciativa', value: computed.initiative.bonus },
        ]}
        compact={compact}
      />

      {/* Flags de Estado */}
      <FlagsSection flags={computed.flags} compact={compact} />

      {/* Combate Avançado */}
      <CombatAdvancedSection combatAdvanced={computed.combatAdvanced} compact={compact} />

      {/* Ataque Furtivo */}
      {computed.sneakAttack.available && (
        <SneakAttackSection sneakAttack={computed.sneakAttack} compact={compact} />
      )}

      {/* Cura */}
      {computed.healing.available && (
        <HealingSection healing={computed.healing} compact={compact} />
      )}

      {/* Ocultista */}
      {(computed.occultist?.bonusRituals?.perCircle > 0 || computed.occultist?.grimoire?.available) && (
        <OccultistSection occultist={computed.occultist} compact={compact} />
      )}

      {/* Perícias */}
      {Object.keys(computed.skills).length > 0 && (
        <SkillsSection skills={computed.skills} compact={compact} />
      )}
    </div>
  );
}

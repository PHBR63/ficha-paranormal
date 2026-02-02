/**
 * LazyModals - Modais da ficha com lazy loading
 * 
 * Centraliza todos os modais pesados da ficha de personagem
 * com lazy loading para otimização do bundle inicial.
 * 
 * @module components/character/sheet/LazyModals
 */

import { lazy, Suspense, memo, type ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

// ========================================
// FALLBACK DE LOADING
// ========================================

/** Componente de loading para modais */
const ModalLoadingFallback = memo(function ModalLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
});

// ========================================
// MODAIS LAZY LOADED
// ========================================

/** Modal de Progressão de NEX */
export const NexProgressionModal = lazy(() =>
  import('@/components/character/NexProgressionModal').then((m) => ({
    default: m.NexProgressionModal,
  }))
);

/** Modal de Seleção de Rituais */
export const RitualSelectionModal = lazy(() =>
  import('@/components/character/RitualSelectionModal').then((m) => ({
    default: m.RitualSelectionModal,
  }))
);

/** Modal de Edição de Personagem */
export const CharacterEditModal = lazy(() =>
  import('@/components/character/CharacterEditModal').then((m) => ({
    default: m.CharacterEditModal,
  }))
);

/** Modal de Seleção de Poder Paranormal */
export const ParanormalPowerSelectModal = lazy(() =>
  import('@/components/character/ParanormalPowerSelectModal').then((m) => ({
    default: m.ParanormalPowerSelectModal,
  }))
);

/** Modal de Rolagem de Combate */
export const CombatRollModal = lazy(() =>
  import('@/components/character/CombatRollModal').then((m) => ({
    default: m.CombatRollModal,
  }))
);

/** Modal de Rolagem de Dados */
export const DiceRollModal = lazy(() =>
  import('@/components/dice/DiceRollModal').then((m) => ({
    default: m.DiceRollModal,
  }))
);

/** Modal de Seleção de Grau de Treinamento */
export const TrainingGradeSelectModal = lazy(() =>
  import('@/components/character/TrainingGradeSelectModal').then((m) => ({
    default: m.TrainingGradeSelectModal,
  }))
);

/** Modal de Correção Automática de Validação */
export const ValidationAutoFixModal = lazy(() =>
  import('@/components/character/ValidationAutoFixModal').then((m) => ({
    default: m.ValidationAutoFixModal,
  }))
);

/** Modal de Descanso */
export const RestModal = lazy(() =>
  import('@/components/character/RestModal').then((m) => ({
    default: m.RestModal,
  }))
);

/** Modal de Correção de Perícias Faltantes */
export const MissingSkillsFixModal = lazy(() =>
  import('@/components/character/MissingSkillsFixModal').then((m) => ({
    default: m.MissingSkillsFixModal,
  }))
);

/** Modal de Rituais para Não-Ocultistas */
export const NonOccultistRitualModal = lazy(() =>
  import('@/components/character/NonOccultistRitualModal').then((m) => ({
    default: m.NonOccultistRitualModal,
  }))
);

/** Modal de Seleção de Perícia por Intelecto */
export const IntellectSkillSelectModal = lazy(() =>
  import('@/components/character/IntellectSkillSelectModal').then((m) => ({
    default: m.IntellectSkillSelectModal,
  }))
);

/** Modal de Seleção de Resistência Elemental */
export const ElementResistanceSelectModal = lazy(() =>
  import('@/components/character/ElementResistanceSelectModal').then((m) => ({
    default: m.ElementResistanceSelectModal,
  }))
);

/** Modal de Detalhes de Habilidade */
export const AbilityDetailModal = lazy(() =>
  import('@/components/character/AbilityDetailModal').then((m) => ({
    default: m.AbilityDetailModal,
  }))
);

/** Modal de Conjuração de Ritual */
export const RitualCastModal = lazy(() =>
  import('@/components/character/RitualCastModal').then((m) => ({
    default: m.RitualCastModal,
  }))
);

/** Modal de Dano/Cura de Ritual */
export const RitualDamageModal = lazy(() =>
  import('@/components/character/RitualDamageModal').then((m) => ({
    default: m.RitualDamageModal,
  }))
);

/** Modal de Teste de Resistência */
export const ResistanceCheckModal = lazy(() =>
  import('@/components/character/ResistanceCheckModal').then((m) => ({
    default: m.ResistanceCheckModal,
  }))
);

/** Modal de Condições de Ritual */
export const RitualConditionModal = lazy(() =>
  import('@/components/character/RitualConditionApplicator').then((m) => ({
    default: m.RitualConditionModal,
  }))
);

/** Wizard de Efeitos de Ritual */
export const RitualEffectWizard = lazy(() =>
  import('@/components/character/RitualEffectWizard').then((m) => ({
    default: m.RitualEffectWizard,
  }))
);

/** Modal de Remoção de Rituais Excedentes */
export const ExcessRitualsRemovalModal = lazy(() =>
  import('@/components/character/ExcessRitualsRemovalModal').then((m) => ({
    default: m.ExcessRitualsRemovalModal,
  }))
);

/** Modal de Remoção de Poderes Excedentes */
export const ExcessPowersRemovalModal = lazy(() =>
  import('@/components/character/ExcessPowersRemovalModal').then((m) => ({
    default: m.ExcessPowersRemovalModal,
  }))
);

/** Modal de Salvar Template */
export const TemplateSaveModal = lazy(() =>
  import('@/components/templates/TemplateSaveModal').then((m) => ({
    default: m.TemplateSaveModal,
  }))
);

// ========================================
// WRAPPER COM SUSPENSE
// ========================================

/**
 * HOC para envolver modais lazy-loaded com Suspense
 */
export function withSuspense<P extends object>(
  LazyComponent: ComponentType<P>,
  fallback = <ModalLoadingFallback />
) {
  return memo(function SuspenseWrapped(props: P) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  });
}

// ========================================
// MODAIS PRÉ-ENVOLVIDOS (OPCIONAL)
// ========================================

/**
 * Versões pré-envolvidas dos modais com Suspense
 * Use quando quiser garantir que o fallback seja exibido automaticamente
 */
export const LazyModals = {
  NexProgression: withSuspense(NexProgressionModal),
  RitualSelection: withSuspense(RitualSelectionModal),
  CharacterEdit: withSuspense(CharacterEditModal),
  ParanormalPowerSelect: withSuspense(ParanormalPowerSelectModal),
  CombatRoll: withSuspense(CombatRollModal),
  DiceRoll: withSuspense(DiceRollModal),
  TrainingGradeSelect: withSuspense(TrainingGradeSelectModal),
  ValidationAutoFix: withSuspense(ValidationAutoFixModal),
  Rest: withSuspense(RestModal),
  MissingSkillsFix: withSuspense(MissingSkillsFixModal),
  NonOccultistRitual: withSuspense(NonOccultistRitualModal),
  IntellectSkillSelect: withSuspense(IntellectSkillSelectModal),
  ElementResistanceSelect: withSuspense(ElementResistanceSelectModal),
  AbilityDetail: withSuspense(AbilityDetailModal),
  RitualCast: withSuspense(RitualCastModal),
  RitualDamage: withSuspense(RitualDamageModal),
  ResistanceCheck: withSuspense(ResistanceCheckModal),
  RitualCondition: withSuspense(RitualConditionModal),
  RitualEffectWizard: withSuspense(RitualEffectWizard),
  ExcessRitualsRemoval: withSuspense(ExcessRitualsRemovalModal),
  ExcessPowersRemoval: withSuspense(ExcessPowersRemovalModal),
  TemplateSave: withSuspense(TemplateSaveModal),
} as const;

export type LazyModalName = keyof typeof LazyModals;

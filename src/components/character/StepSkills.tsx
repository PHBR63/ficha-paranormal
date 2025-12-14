import { useState } from 'react';
import { SKILLS } from '@/lib/character-data';
import { cn } from '@/lib/utils';
import { AlertTriangle, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SkillChoiceModal, ConflictResolutionModal } from './SkillChoiceModal';
import type { CharacterFormData } from '@/pages/CharacterCreate';
import type { RebuildResult } from '@/lib/character-builder-engine';

interface StepSkillsProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
  buildResult: RebuildResult;
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  agility: 'AGI',
  strength: 'FOR',
  intellect: 'INT',
  presence: 'PRE',
  vigor: 'VIG',
};

export function StepSkills({ formData, updateFormData, buildResult }: StepSkillsProps) {
  const [choiceModalOpen, setChoiceModalOpen] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [activeChoice, setActiveChoice] = useState<typeof buildResult.pendingChoices[0] | null>(null);
  const [activeConflict, setActiveConflict] = useState<string | null>(null);

  const {
    originSkills,
    classSkills,
    pendingChoices,
    pendingConflicts,
    allTrainedSkills,
  } = buildResult;

  // Calculate free skill points
  const freePointsTotal = classSkills.free.length + formData.freeSkills.length;
  const usedFreePoints = formData.freeSkills.length;
  const classData = formData.characterClass === 'Combatente' 
    ? 1 + formData.attributes.intellect
    : formData.characterClass === 'Especialista'
    ? 7 + formData.attributes.intellect
    : formData.characterClass === 'Ocultista'
    ? 3 + formData.attributes.intellect
    : 0;
  const remainingFreePoints = Math.max(0, classData - usedFreePoints);

  const handleChoiceSelect = (choiceId: string, skillId: string) => {
    updateFormData({
      classSkillChoices: {
        ...formData.classSkillChoices,
        [choiceId]: skillId,
      },
    });
    setChoiceModalOpen(false);
  };

  const handleConflictResolve = (conflictSkillId: string, substituteSkillId: string) => {
    updateFormData({
      conflictResolutions: {
        ...formData.conflictResolutions,
        [conflictSkillId]: substituteSkillId,
      },
    });
    setConflictModalOpen(false);
  };

  const toggleFreeSkill = (skillId: string) => {
    const isSelected = formData.freeSkills.includes(skillId);
    
    if (isSelected) {
      updateFormData({
        freeSkills: formData.freeSkills.filter(s => s !== skillId),
      });
    } else if (remainingFreePoints > 0) {
      updateFormData({
        freeSkills: [...formData.freeSkills, skillId],
      });
    }
  };

  // Skills that can't be selected as free (already trained)
  const unavailableSkills = new Set([
    ...originSkills,
    ...classSkills.mandatory,
    ...Object.values(formData.classSkillChoices),
    ...Object.values(formData.conflictResolutions),
  ]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl tracking-wider mb-2">PERÍCIAS</h2>
        <p className="text-muted-foreground text-sm">
          Configure as perícias do seu personagem. Algumas são automáticas, outras você escolhe.
        </p>
      </div>

      {/* Pending Choices Warning */}
      {(pendingChoices.length > 0 || pendingConflicts.length > 0) && (
        <div className="ordo-panel p-4 bg-warning/10 border-warning/30">
          <div className="flex items-center gap-2 text-warning mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium text-sm">Ações pendentes</span>
          </div>
          <div className="space-y-2">
            {pendingChoices.map(choice => (
              <Button
                key={choice.id}
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveChoice(choice);
                  setChoiceModalOpen(true);
                }}
                className="mr-2"
              >
                Escolher: {choice.label}
              </Button>
            ))}
            {pendingConflicts.map(skillId => {
              const skill = SKILLS.find(s => s.id === skillId);
              return (
                <Button
                  key={skillId}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveConflict(skillId);
                    setConflictModalOpen(true);
                  }}
                  className="mr-2 border-warning text-warning"
                >
                  Resolver conflito: {skill?.name}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Origin Skills - Automatic */}
      {originSkills.length > 0 && (
        <div className="ordo-panel p-4">
          <h3 className="font-display text-sm tracking-wider text-secondary mb-3">
            ✓ PERÍCIAS DA ORIGEM (automático)
          </h3>
          <div className="flex flex-wrap gap-2">
            {originSkills.map(skillId => {
              const skill = SKILLS.find(s => s.id === skillId);
              if (!skill) return null;
              return (
                <div
                  key={skillId}
                  className="flex items-center gap-2 px-3 py-2 bg-secondary/20 text-secondary rounded-sm"
                >
                  <Check className="w-3 h-3" />
                  <span className="text-sm">{skill.name}</span>
                  <span className="text-xs opacity-70">({ATTRIBUTE_LABELS[skill.attribute]})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Class Mandatory Skills */}
      {classSkills.mandatory.length > 0 && (
        <div className="ordo-panel p-4">
          <h3 className="font-display text-sm tracking-wider text-primary mb-3">
            ✓ PERÍCIAS OBRIGATÓRIAS DA CLASSE
          </h3>
          <div className="flex flex-wrap gap-2">
            {classSkills.mandatory.map(skillId => {
              const skill = SKILLS.find(s => s.id === skillId);
              const isConflict = originSkills.includes(skillId);
              const resolution = formData.conflictResolutions[skillId];
              const resolvedSkill = resolution ? SKILLS.find(s => s.id === resolution) : null;
              
              if (!skill) return null;
              
              return (
                <div key={skillId} className="flex items-center gap-2">
                  {isConflict ? (
                    resolvedSkill ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-primary/20 rounded-sm">
                        <Check className="w-3 h-3 text-primary" />
                        <span className="text-sm line-through text-muted-foreground">{skill.name}</span>
                        <span className="text-sm">→ {resolvedSkill.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 bg-warning/20 text-warning rounded-sm">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-sm">{skill.name} (conflito)</span>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 bg-primary/20 text-primary rounded-sm">
                      <Check className="w-3 h-3" />
                      <span className="text-sm">{skill.name}</span>
                      <span className="text-xs opacity-70">({ATTRIBUTE_LABELS[skill.attribute]})</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Class Choice Skills */}
      {buildResult.pendingChoices.length > 0 || Object.keys(formData.classSkillChoices).length > 0 ? (
        <div className="ordo-panel p-4">
          <h3 className="font-display text-sm tracking-wider text-primary mb-3">
            ESCOLHAS DA CLASSE
          </h3>
          <div className="space-y-2">
            {Object.entries(formData.classSkillChoices).map(([choiceId, skillId]) => {
              const skill = SKILLS.find(s => s.id === skillId);
              return (
                <div key={choiceId} className="flex items-center gap-2 px-3 py-2 bg-primary/20 text-primary rounded-sm inline-block mr-2">
                  <Check className="w-3 h-3" />
                  <span className="text-sm">{skill?.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Free Skills Counter */}
      <div className="ordo-panel p-4 text-center">
        <p className="text-sm text-muted-foreground mb-1">PERÍCIAS LIVRES RESTANTES</p>
        <p className={`font-display text-4xl ${remainingFreePoints === 0 ? 'text-success' : 'text-secondary'}`}>
          {remainingFreePoints} / {classData}
        </p>
      </div>

      {/* Free Skills Selection */}
      <div className="ordo-panel p-4">
        <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3">
          SELECIONAR PERÍCIAS LIVRES
        </h3>
        <div className="grid md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
          {SKILLS.map((skill) => {
            const isUnavailable = unavailableSkills.has(skill.id);
            const isSelected = formData.freeSkills.includes(skill.id);
            const attrValue = formData.attributes[skill.attribute as keyof typeof formData.attributes];
            const trainingBonus = isSelected || isUnavailable ? 5 : 0;
            const totalBonus = attrValue + trainingBonus;

            return (
              <button
                key={skill.id}
                onClick={() => !isUnavailable && toggleFreeSkill(skill.id)}
                disabled={isUnavailable || (!isSelected && remainingFreePoints <= 0)}
                className={cn(
                  'p-3 text-left transition-all flex items-center justify-between rounded-sm border',
                  isUnavailable && 'opacity-50 cursor-not-allowed bg-muted/50 border-transparent',
                  isSelected && !isUnavailable && 'border-secondary bg-secondary/10',
                  !isSelected && !isUnavailable && remainingFreePoints <= 0 && 'opacity-50 cursor-not-allowed border-border',
                  !isSelected && !isUnavailable && remainingFreePoints > 0 && 'border-border hover:border-secondary/50'
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'w-6 h-6 rounded-sm border flex items-center justify-center text-xs',
                    isSelected || isUnavailable
                      ? 'bg-secondary border-secondary text-secondary-foreground' 
                      : 'border-border text-muted-foreground'
                  )}>
                    {isUnavailable ? <Lock className="w-3 h-3" /> : isSelected ? '✓' : null}
                  </div>
                  <span className="font-medium text-sm">{skill.name}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {ATTRIBUTE_LABELS[skill.attribute]}
                  </span>
                  {skill.requiresTraining && (
                    <span className="text-xs text-warning">T</span>
                  )}
                </div>
                <div className="text-right">
                  <span className={cn(
                    'font-display text-lg',
                    isSelected || isUnavailable ? 'text-secondary' : 'text-muted-foreground'
                  )}>
                    +{totalBonus}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <div className="ordo-panel p-4 bg-primary/5 border-primary/20">
        <p className="text-sm text-muted-foreground">
          <span className="text-primary font-medium">NOTA:</span> Perícias marcadas com <span className="text-warning">T</span> requerem treinamento para serem usadas.
          Cada perícia treinada adiciona +5 ao bônus base do atributo.
        </p>
      </div>

      {/* Choice Modal */}
      {activeChoice && (
        <SkillChoiceModal
          open={choiceModalOpen}
          onOpenChange={setChoiceModalOpen}
          title={`Escolha: ${activeChoice.label}`}
          description="Selecione uma das opções abaixo para seu personagem."
          options={activeChoice.options}
          selectedSkill={formData.classSkillChoices[activeChoice.id] || null}
          onSelect={(skillId) => handleChoiceSelect(activeChoice.id, skillId)}
          excludeSkills={[...originSkills, ...classSkills.mandatory]}
        />
      )}

      {/* Conflict Resolution Modal */}
      {activeConflict && (
        <ConflictResolutionModal
          open={conflictModalOpen}
          onOpenChange={setConflictModalOpen}
          conflictSkillId={activeConflict}
          alreadyTrainedSkills={allTrainedSkills}
          onSelect={(skillId) => handleConflictResolve(activeConflict, skillId)}
        />
      )}
    </div>
  );
}

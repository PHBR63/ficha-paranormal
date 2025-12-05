import { SKILLS, TRAINING_LEVELS, CLASSES } from '@/lib/character-data';
import { cn } from '@/lib/utils';
import type { CharacterFormData } from '@/pages/CharacterCreate';

interface StepSkillsProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  agility: 'AGI',
  strength: 'FOR',
  intellect: 'INT',
  presence: 'PRE',
  vigor: 'VIG',
};

export function StepSkills({ formData, updateFormData }: StepSkillsProps) {
  const classData = CLASSES.find(c => c.id === formData.characterClass);
  const nexMultiplier = Math.floor(formData.nex / 5);
  const totalSkillPoints = classData ? classData.skillsPerNex * nexMultiplier : 0;
  
  const usedPoints = Object.values(formData.skills).reduce((a, b) => a + b, 0);
  const remainingPoints = totalSkillPoints - usedPoints;

  const toggleSkill = (skillId: string) => {
    const currentLevel = formData.skills[skillId] || 0;
    const newLevel = currentLevel >= 1 ? 0 : 1; // Toggle between 0 and 1 (Treinado)
    
    // Check if we have points
    if (newLevel > currentLevel && remainingPoints <= 0) return;

    const newSkills = { ...formData.skills };
    if (newLevel === 0) {
      delete newSkills[skillId];
    } else {
      newSkills[skillId] = newLevel;
    }

    updateFormData({ skills: newSkills });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl tracking-wider mb-2">PERÍCIAS</h2>
        <p className="text-muted-foreground text-sm">
          Selecione as perícias nas quais seu personagem é treinado.
        </p>
      </div>

      {/* Points counter */}
      <div className="ordo-panel p-4 text-center mb-6">
        <p className="text-sm text-muted-foreground mb-1">PONTOS DE PERÍCIA RESTANTES</p>
        <p className={`font-display text-4xl ${remainingPoints === 0 ? 'text-success' : 'text-secondary'}`}>
          {remainingPoints} / {totalSkillPoints}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {classData?.name}: {classData?.skillsPerNex} perícias por 5% de NEX
        </p>
      </div>

      {/* Skills grid */}
      <div className="grid md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2">
        {SKILLS.map((skill) => {
          const isSelected = (formData.skills[skill.id] || 0) > 0;
          const attrValue = formData.attributes[skill.attribute as keyof typeof formData.attributes];
          const trainingBonus = isSelected ? 5 : 0;
          const totalBonus = attrValue + trainingBonus;

          return (
            <button
              key={skill.id}
              onClick={() => toggleSkill(skill.id)}
              disabled={!isSelected && remainingPoints <= 0}
              className={cn(
                'ordo-panel p-3 text-left transition-all flex items-center justify-between',
                isSelected && 'border-secondary bg-secondary/5',
                !isSelected && remainingPoints <= 0 && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-6 h-6 rounded-sm border flex items-center justify-center text-xs',
                  isSelected 
                    ? 'bg-secondary border-secondary text-secondary-foreground' 
                    : 'border-border text-muted-foreground'
                )}>
                  {isSelected && '✓'}
                </div>
                <span className="font-medium">{skill.name}</span>
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {ATTRIBUTE_LABELS[skill.attribute]}
                </span>
              </div>
              <div className="text-right">
                <span className={cn(
                  'font-display text-lg',
                  isSelected ? 'text-secondary' : 'text-muted-foreground'
                )}>
                  +{totalBonus}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="ordo-panel p-4 bg-primary/5 border-primary/20">
        <p className="text-sm text-muted-foreground">
          <span className="text-primary font-medium">NOTA:</span> Cada perícia treinada adiciona +5 
          ao bônus base do atributo. Graus superiores (Veterano, Expert) são desbloqueados em NEX mais altos.
        </p>
      </div>
    </div>
  );
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SKILLS } from '@/lib/character-data';
import { cn } from '@/lib/utils';

interface SkillChoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  options: string[];
  selectedSkill: string | null;
  onSelect: (skillId: string) => void;
  excludeSkills?: string[];
}

export function SkillChoiceModal({
  open,
  onOpenChange,
  title,
  description,
  options,
  selectedSkill,
  onSelect,
  excludeSkills = [],
}: SkillChoiceModalProps) {
  const availableOptions = options.filter(opt => !excludeSkills.includes(opt));

  const handleSelect = (skillId: string) => {
    onSelect(skillId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-4">
          {availableOptions.map((skillId) => {
            const skill = SKILLS.find(s => s.id === skillId);
            if (!skill) return null;

            const isSelected = selectedSkill === skillId;

            return (
              <Button
                key={skillId}
                variant="outline"
                onClick={() => handleSelect(skillId)}
                className={cn(
                  'w-full justify-start h-auto py-3',
                  isSelected && 'border-primary bg-primary/10'
                )}
              >
                <div className="text-left">
                  <p className="font-medium">{skill.name}</p>
                  <p className="text-xs text-muted-foreground">{skill.description}</p>
                </div>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ConflictResolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflictSkillId: string;
  alreadyTrainedSkills: string[];
  onSelect: (skillId: string) => void;
}

export function ConflictResolutionModal({
  open,
  onOpenChange,
  conflictSkillId,
  alreadyTrainedSkills,
  onSelect,
}: ConflictResolutionModalProps) {
  const conflictSkill = SKILLS.find(s => s.id === conflictSkillId);
  
  // Todas as perícias exceto as já treinadas
  const availableSkills = SKILLS.filter(
    s => !alreadyTrainedSkills.includes(s.id) && s.id !== conflictSkillId
  );

  const handleSelect = (skillId: string) => {
    onSelect(skillId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider text-warning">
            CONFLITO DE PERÍCIA
          </DialogTitle>
          <DialogDescription>
            A perícia <strong>{conflictSkill?.name}</strong> já foi concedida pela sua origem.
            Escolha outra perícia para substituí-la.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 mt-4">
          {availableSkills.map((skill) => (
            <Button
              key={skill.id}
              variant="outline"
              onClick={() => handleSelect(skill.id)}
              className="justify-start h-auto py-2 px-3"
            >
              <div className="text-left">
                <p className="font-medium text-sm">{skill.name}</p>
                <p className="text-xs text-muted-foreground truncate">{skill.attribute.toUpperCase()}</p>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

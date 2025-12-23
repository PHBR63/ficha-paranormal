import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SKILLS } from '@/lib/character-data';
import { cn } from '@/lib/utils';
import { Check, Search } from 'lucide-react';
import { ATTRIBUTE_ABBR } from '@/lib/constants/attributes';

interface AmnesicSkillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (skills: string[]) => void;
  currentSelection?: string[];
}

export function AmnesicSkillModal({
  open,
  onOpenChange,
  onConfirm,
  currentSelection = [],
}: AmnesicSkillModalProps) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>(currentSelection);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSkills = SKILLS.filter(skill =>
    skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    skill.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSkill = (skillId: string) => {
    if (selectedSkills.includes(skillId)) {
      setSelectedSkills(prev => prev.filter(id => id !== skillId));
    } else if (selectedSkills.length < 2) {
      setSelectedSkills(prev => [...prev, skillId]);
    }
  };

  const handleConfirm = () => {
    if (selectedSkills.length === 2) {
      onConfirm(selectedSkills);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider text-paranormal">
            MEMÓRIAS FRAGMENTADAS
          </DialogTitle>
          <DialogDescription>
            Como amnésico, você pode escolher <strong>2 perícias</strong> quaisquer 
            para serem treinadas. Essas representam fragmentos do seu passado esquecido.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar perícia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {filteredSkills.map((skill) => {
            const isSelected = selectedSkills.includes(skill.id);
            const isDisabled = !isSelected && selectedSkills.length >= 2;

            return (
              <button
                key={skill.id}
                onClick={() => !isDisabled && toggleSkill(skill.id)}
                disabled={isDisabled}
                className={cn(
                  'w-full p-3 text-left rounded-lg border transition-all',
                  isSelected && 'border-paranormal bg-paranormal/10',
                  !isSelected && !isDisabled && 'border-border hover:border-paranormal/50',
                  isDisabled && 'opacity-50 cursor-not-allowed border-border'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{skill.name}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-muted rounded">
                        {ATTRIBUTE_ABBR[skill.attribute as keyof typeof ATTRIBUTE_ABBR]}
                      </span>
                      {skill.requiresTraining && (
                        <span className="text-xs text-warning">Requer treino</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {skill.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-paranormal flex items-center justify-center">
                      <Check className="w-4 h-4 text-paranormal-foreground" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <DialogFooter className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Selecionadas: <span className="text-paranormal font-medium">{selectedSkills.length}/2</span>
          </p>
          <Button
            onClick={handleConfirm}
            disabled={selectedSkills.length !== 2}
            className="font-display tracking-wider"
          >
            CONFIRMAR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

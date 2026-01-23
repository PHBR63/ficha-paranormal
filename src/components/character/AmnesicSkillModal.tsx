import { useState } from 'react';
import {
  MobileModal,
  MobileModalContent,
  MobileModalHeader,
  MobileModalBody,
  MobileModalFooter,
  MobileModalTitle,
  MobileModalDescription,
} from '@/components/ui/mobile-modal';
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
    <MobileModal open={open} onOpenChange={onOpenChange}>
      <MobileModalContent size="md">
        <MobileModalHeader>
          <MobileModalTitle className="font-display tracking-wider text-paranormal">
            MEMÓRIAS FRAGMENTADAS
          </MobileModalTitle>
          <MobileModalDescription>
            Como amnésico, você pode escolher <strong>2 perícias</strong> quaisquer 
            para serem treinadas. Essas representam fragmentos do seu passado esquecido.
          </MobileModalDescription>
        </MobileModalHeader>

        <div className="relative px-4 sm:px-6 mb-2">
          <Search className="absolute left-7 sm:left-9 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar perícia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Padrão do projeto: calc() ao invés de vh puro para garantir scroll no mobile */}
        <MobileModalBody useScrollArea={true} maxHeight="calc(85vh - 220px)">
          <div className="space-y-2">
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
        </MobileModalBody>

        <MobileModalFooter className="flex items-center justify-between">
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
        </MobileModalFooter>
      </MobileModalContent>
    </MobileModal>
  );
}

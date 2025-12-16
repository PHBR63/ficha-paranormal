/**
 * SkillChoiceModal - Modal para escolha de perícias
 * 
 * Suporta:
 * - Escolha simples entre opções da classe
 * - Terceira opção "escolher outra perícia" quando há conflito com origem (Combatente)
 * - Resolução de conflitos de perícias
 * - Validação de perícias válidas do sistema
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SKILLS } from '@/lib/character-data';
import { isValidSkillId } from '@/lib/character-builder-engine';
import { cn } from '@/lib/utils';
import { AlertTriangle, Sparkles, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SkillChoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  options: string[];
  selectedSkill: string | null;
  onSelect: (skillId: string) => void;
  excludeSkills?: string[];
  /** Permite escolher qualquer perícia quando todas as opções estão em conflito */
  allowFreeChoice?: boolean;
  /** Lista de perícias já treinadas (para a opção livre) */
  alreadyTrainedSkills?: string[];
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
  allowFreeChoice = false,
  alreadyTrainedSkills = [],
}: SkillChoiceModalProps) {
  const [showFreeChoice, setShowFreeChoice] = useState(false);
  
  // Opções disponíveis (não excluídas)
  const availableOptions = options.filter(opt => !excludeSkills.includes(opt));
  
  // Opções em conflito (já treinadas pela origem)
  const conflictOptions = options.filter(opt => excludeSkills.includes(opt));
  
  // Verificar se há conflito em alguma opção
  const hasConflict = conflictOptions.length > 0;
  
  // Todas as perícias disponíveis para escolha livre
  const allAvailableSkills = SKILLS.filter(
    s => !alreadyTrainedSkills.includes(s.id) && !options.includes(s.id)
  );

  // Valida e seleciona a perícia
  const handleSelect = (skillId: string) => {
    // Validação de segurança: verificar se é uma perícia válida
    if (!isValidSkillId(skillId)) {
      toast({
        title: "Perícia inválida",
        description: "A perícia selecionada não é válida. Por favor, escolha outra.",
        variant: "destructive",
      });
      return;
    }
    
    onSelect(skillId);
    setShowFreeChoice(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    setShowFreeChoice(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Aviso de conflito */}
        {hasConflict && allowFreeChoice && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Conflito detectado!</p>
              <p className="text-xs opacity-80">
                {conflictOptions.length === 1 
                  ? `A perícia "${SKILLS.find(s => s.id === conflictOptions[0])?.name}" já foi concedida pela sua origem.`
                  : `Algumas perícias já foram concedidas pela sua origem.`
                }
                {' '}Você pode escolher a outra opção ou selecionar qualquer perícia livre.
              </p>
            </div>
          </div>
        )}

        {!showFreeChoice ? (
          <div className="space-y-2 mt-4">
            {/* Opções normais */}
            {options.map((skillId) => {
              const skill = SKILLS.find(s => s.id === skillId);
              if (!skill) return null;

              const isSelected = selectedSkill === skillId;
              const isConflict = excludeSkills.includes(skillId);

              return (
                <Button
                  key={skillId}
                  variant="outline"
                  onClick={() => !isConflict && handleSelect(skillId)}
                  disabled={isConflict}
                  className={cn(
                    'w-full justify-start h-auto py-3',
                    isSelected && 'border-primary bg-primary/10',
                    isConflict && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{skill.name}</p>
                      {isConflict && (
                        <Badge variant="outline" className="text-xs text-warning border-warning">
                          Já treinada
                        </Badge>
                      )}
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{skill.description}</p>
                  </div>
                </Button>
              );
            })}

            {/* Terceira opção: escolher outra perícia */}
            {allowFreeChoice && hasConflict && (
              <Button
                variant="outline"
                onClick={() => setShowFreeChoice(true)}
                className="w-full justify-start h-auto py-3 border-dashed border-primary/50 hover:border-primary"
              >
                <div className="text-left flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-medium text-primary">Escolher outra perícia</p>
                    <p className="text-xs text-muted-foreground">
                      Selecione qualquer perícia disponível como substituição
                    </p>
                  </div>
                </div>
              </Button>
            )}
          </div>
        ) : (
          /* Lista de todas as perícias disponíveis */
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Escolha uma perícia:</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowFreeChoice(false)}
              >
                Voltar
              </Button>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="grid grid-cols-2 gap-2">
                {allAvailableSkills.map((skill) => (
                  <Button
                    key={skill.id}
                    variant="outline"
                    onClick={() => handleSelect(skill.id)}
                    className="justify-start h-auto py-2 px-3"
                  >
                    <div className="text-left">
                      <p className="font-medium text-sm">{skill.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {skill.attribute.toUpperCase()}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
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

  // Valida e seleciona a perícia de substituição
  const handleSelect = (skillId: string) => {
    // Validação de segurança: verificar se é uma perícia válida
    if (!isValidSkillId(skillId)) {
      toast({
        title: "Perícia inválida",
        description: "A perícia selecionada não é válida. Por favor, escolha outra.",
        variant: "destructive",
      });
      return;
    }
    
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

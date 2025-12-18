/**
 * Modal para selecionar perícias de Intelecto
 * Usado pelo poder paranormal "Expansão de Conhecimento"
 */

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Check, AlertCircle } from 'lucide-react';

// Perícias baseadas em Intelecto (oficial do livro)
export const INTELLECT_SKILLS = [
  { id: 'atualidades', name: 'Atualidades', description: 'Conhecimento geral sobre notícias, cultura pop e eventos atuais.' },
  { id: 'ciencias', name: 'Ciências', description: 'Física, química, biologia, matemática e outras ciências exatas.' },
  { id: 'investigacao', name: 'Investigação', description: 'Procurar pistas, pesquisar informações e resolver enigmas.' },
  { id: 'medicina', name: 'Medicina', description: 'Tratar ferimentos, curar doenças e procedimentos médicos.' },
  { id: 'ocultismo', name: 'Ocultismo', description: 'Conhecimento sobre o paranormal e criaturas do Outro Lado.' },
  { id: 'profissao', name: 'Profissão', description: 'Conhecimento e habilidades de uma profissão específica.' },
  { id: 'sobrevivencia', name: 'Sobrevivência', description: 'Orientar-se, rastrear, encontrar comida na natureza.' },
  { id: 'tatica', name: 'Tática', description: 'Planejamento militar, estratégia e análise de combate.' },
  { id: 'tecnologia', name: 'Tecnologia', description: 'Usar, consertar e hackear equipamentos eletrônicos.' },
];

interface IntellectSkillSelectModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (skillIds: string[]) => void;
  hasAffinity: boolean; // Se tem afinidade de Conhecimento (pode escolher 2)
  alreadyChosenSkills?: string[]; // Perícias já escolhidas anteriormente
}

export function IntellectSkillSelectModal({
  open,
  onClose,
  onConfirm,
  hasAffinity,
  alreadyChosenSkills = [],
}: IntellectSkillSelectModalProps) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  
  const maxSelections = hasAffinity ? 2 : 1;
  
  const availableSkills = useMemo(() => 
    INTELLECT_SKILLS.filter(s => !alreadyChosenSkills.includes(s.id)),
    [alreadyChosenSkills]
  );
  
  const handleToggleSkill = (skillId: string) => {
    setSelectedSkills(prev => {
      if (prev.includes(skillId)) {
        return prev.filter(id => id !== skillId);
      }
      if (prev.length >= maxSelections) {
        // Substitui o primeiro selecionado
        return [...prev.slice(1), skillId];
      }
      return [...prev, skillId];
    });
  };
  
  const handleConfirm = () => {
    if (selectedSkills.length > 0) {
      onConfirm(selectedSkills);
      setSelectedSkills([]);
    }
  };
  
  const handleClose = () => {
    setSelectedSkills([]);
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] grid grid-rows-[auto_minmax(0,1fr)_auto] gap-4">
        <DialogHeader>
          <DialogTitle className="font-display text-lg tracking-wider flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-500" />
            EXPANSÃO DE CONHECIMENTO
          </DialogTitle>
          <DialogDescription>
            Escolha {maxSelections} perícia{maxSelections > 1 ? 's' : ''} de Intelecto para receber +5.
            {hasAffinity && (
              <Badge variant="outline" className="ml-2 text-blue-500 border-blue-500/50">
                Afinidade de Conhecimento
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="min-h-0 -mx-6 px-6 pr-4">
          <div className="space-y-2 pb-4">
            {availableSkills.map(skill => {
              const isSelected = selectedSkills.includes(skill.id);
              
              return (
                <div
                  key={skill.id}
                  onClick={() => handleToggleSkill(skill.id)}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-all
                    ${isSelected 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={() => handleToggleSkill(skill.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{skill.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {skill.description}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">+5</Badge>
                  </div>
                </div>
              );
            })}
            
            {availableSkills.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Todas as perícias de Intelecto já foram escolhidas.</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex-1 text-sm text-muted-foreground">
            {selectedSkills.length}/{maxSelections} selecionada(s)
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={selectedSkills.length === 0}
            >
              Confirmar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

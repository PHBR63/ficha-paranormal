/**
 * Modal para selecionar perícias de Intelecto
 * Usado pelo poder paranormal "Expansão de Conhecimento"
 * 
 * IDs centralizados em: src/lib/constants/game-ids.ts
 */

import { useState, useMemo } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Brain, Check, AlertCircle } from 'lucide-react';
import { INTELLECT_SKILL_IDS, SKILL_IDS } from '@/lib/constants/game-ids';

// Perícias baseadas em Intelecto (usando IDs centralizados)
export const INTELLECT_SKILLS = [
  { id: SKILL_IDS.ATUALIDADES, name: 'Atualidades', description: 'Conhecimento geral sobre notícias, cultura pop e eventos atuais.' },
  { id: SKILL_IDS.CIENCIAS, name: 'Ciências', description: 'Física, química, biologia, matemática e outras ciências exatas.' },
  { id: SKILL_IDS.INVESTIGACAO, name: 'Investigação', description: 'Procurar pistas, pesquisar informações e resolver enigmas.' },
  { id: SKILL_IDS.MEDICINA, name: 'Medicina', description: 'Tratar ferimentos, curar doenças e procedimentos médicos.' },
  { id: SKILL_IDS.OCULTISMO, name: 'Ocultismo', description: 'Conhecimento sobre o paranormal e criaturas do Outro Lado.' },
  { id: SKILL_IDS.PROFISSAO, name: 'Profissão', description: 'Conhecimento e habilidades de uma profissão específica.' },
  { id: SKILL_IDS.SOBREVIVENCIA, name: 'Sobrevivência', description: 'Orientar-se, rastrear, encontrar comida na natureza.' },
  { id: SKILL_IDS.TATICA, name: 'Tática', description: 'Planejamento militar, estratégia e análise de combate.' },
  { id: SKILL_IDS.TECNOLOGIA, name: 'Tecnologia', description: 'Usar, consertar e hackear equipamentos eletrônicos.' },
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
    <MobileModal open={open} onOpenChange={handleClose}>
      <MobileModalContent size="md">
        <MobileModalHeader>
          <MobileModalTitle className="font-display text-lg tracking-wider flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-500" />
            EXPANSÃO DE CONHECIMENTO
          </MobileModalTitle>
          <MobileModalDescription>
            Escolha {maxSelections} perícia{maxSelections > 1 ? 's' : ''} de Intelecto para receber +5.
            {hasAffinity && (
              <Badge variant="outline" className="ml-2 text-blue-500 border-blue-500/50">
                Afinidade de Conhecimento
              </Badge>
            )}
          </MobileModalDescription>
        </MobileModalHeader>
        
        <MobileModalBody>
          <div className="space-y-2">
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
                      id={`skill-select-${skill.id}`}
                      checked={isSelected}
                      onCheckedChange={() => handleToggleSkill(skill.id)}
                      aria-label={`Selecionar ${skill.name}`}
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
        </MobileModalBody>
        
        <MobileModalFooter>
          <div className="flex-1 text-sm text-muted-foreground">
            {selectedSkills.length}/{maxSelections} selecionada(s)
          </div>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedSkills.length === 0}
          >
            Confirmar
          </Button>
        </MobileModalFooter>
      </MobileModalContent>
    </MobileModal>
  );
}

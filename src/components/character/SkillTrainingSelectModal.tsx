/**
 * Modal de Seleção de Perícias para o poder "Treinamento em Perícia"
 * 
 * Regras oficiais (Livro Base v1.3):
 * - Escolha 2 perícias para treinar
 * - TREINAMENTO EM PERÍCIA: Só permite treinar perícias DESTREINADAS → Treinado
 * - Aumentar grau de treinamento (Treinado→Veterano, Veterano→Expert) só é possível
 *   com a habilidade "Grau de Treinamento" (NEX 35% e 70%)
 * 
 * IMPORTANTE: Perícias já escolhidas em instâncias anteriores deste poder
 * não podem ser escolhidas novamente.
 */

import { useState, useMemo, useCallback } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  GraduationCap, 
  TrendingUp, 
  Check,
  ChevronRight,
  Star,
  Ban
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SKILLS } from '@/lib/character-data';

// Tipos de nível de treinamento
export type TrainingLevel = 0 | 1 | 2 | 3;

// Interface para uma escolha de perícia com upgrade
export interface SkillTrainingChoice {
  skillId: string;
  fromLevel: TrainingLevel;
  toLevel: TrainingLevel;
}

// Interface para o resultado do modal
export interface SkillTrainingResult {
  powerId: string;
  instanceIndex: number;
  choices: SkillTrainingChoice[];
}

interface SkillTrainingSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: SkillTrainingResult) => void;
  powerId: string;
  instanceIndex: number;
  nex: number;
  currentSkills: Record<string, number>;
  existingChoices?: SkillTrainingChoice[];
  /** IDs de perícias já escolhidas em outras instâncias deste poder (para bloquear repetição) */
  alreadyTrainedByPower?: string[];
}

// Labels para níveis de treinamento
const LEVEL_LABELS: Record<TrainingLevel, string> = {
  0: 'Destreinado',
  1: 'Treinado',
  2: 'Veterano',
  3: 'Expert',
};

// Cores para níveis - usando tokens semânticos do design system
const LEVEL_COLORS: Record<TrainingLevel, string> = {
  0: 'bg-muted text-muted-foreground',
  1: 'bg-pe/20 text-pe border-pe/30',
  2: 'bg-warning/20 text-warning border-warning/30',
  3: 'bg-paranormal/20 text-paranormal border-paranormal/30',
};

export function SkillTrainingSelectModal({
  isOpen,
  onClose,
  onConfirm,
  powerId,
  instanceIndex,
  currentSkills,
  existingChoices = [],
  alreadyTrainedByPower = [],
}: SkillTrainingSelectModalProps) {
  // Estado das escolhas (2 perícias)
  const [choices, setChoices] = useState<SkillTrainingChoice[]>(
    existingChoices.length === 2 ? existingChoices : []
  );
  
  // Descrição fixa para Treinamento em Perícia
  const nexDescription = 'Escolha 2 perícias destreinadas para se tornar Treinado. Para aumentar o grau de treinamento, use a habilidade "Grau de Treinamento".';
  
  // Perícias disponíveis para seleção (apenas DESTREINADAS e não escolhidas anteriormente)
  const availableSkills = useMemo(() => {
    return SKILLS.filter(skill => {
      const currentLevel = (currentSkills[skill.id] || 0) as TrainingLevel;
      if (currentLevel !== 0) return false;
      if (alreadyTrainedByPower.includes(skill.id)) return false;
      return true;
    }).map(skill => ({
      ...skill,
      currentLevel: 0 as TrainingLevel,
    }));
  }, [currentSkills, alreadyTrainedByPower]);
  
  const selectedSkillIds = useMemo(() => choices.map(c => c.skillId), [choices]);
  
  const toggleSkill = useCallback((skillId: string) => {
    setChoices(prev => {
      const existingIndex = prev.findIndex(c => c.skillId === skillId);
      if (existingIndex !== -1) {
        return prev.filter(c => c.skillId !== skillId);
      } else if (prev.length < 2) {
        return [...prev, { skillId, fromLevel: 0 as TrainingLevel, toLevel: 1 as TrainingLevel }];
      }
      return prev;
    });
  }, []);
  
  const isValid = choices.length === 2;
  
  const handleConfirm = useCallback(() => {
    if (!isValid) return;
    onConfirm({ powerId, instanceIndex, choices });
  }, [isValid, onConfirm, powerId, instanceIndex, choices]);
  
  const handleCancel = useCallback(() => {
    setChoices(existingChoices.length === 2 ? existingChoices : []);
    onClose();
  }, [existingChoices, onClose]);

  return (
    <MobileModal open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <MobileModalContent size="md">
        <MobileModalHeader>
          <MobileModalTitle className="flex items-center gap-2 font-display tracking-wider">
            <GraduationCap className="w-5 h-5 text-primary" />
            TREINAMENTO EM PERÍCIA
          </MobileModalTitle>
          <MobileModalDescription>{nexDescription}</MobileModalDescription>
        </MobileModalHeader>
        
        <div className="flex items-center justify-between px-4 sm:px-6 py-2 bg-muted/50 rounded-lg mx-4 sm:mx-6">
          <span className="text-sm text-muted-foreground">Perícias selecionadas</span>
          <Badge variant={isValid ? 'default' : 'outline'} className={cn(isValid && 'bg-success/20 text-success border-success/30')}>
            {choices.length}/2
          </Badge>
        </div>
        
        {/* Body com scroll - resumo dentro do body para não ocupar espaço fixo */}
        <MobileModalBody useScrollArea={true} maxHeight="calc(60vh - 80px)">
          <div className="space-y-3">
            {/* Lista de perícias */}
            <div className="space-y-1">
              {availableSkills.map(skill => {
                const isSelected = selectedSkillIds.includes(skill.id);
                const canSelect = isSelected || choices.length < 2;
                
                return (
                  <div
                    key={skill.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer',
                      isSelected ? 'bg-primary/10 border-primary/30' : canSelect ? 'bg-card hover:bg-muted/50 border-border' : 'bg-muted/30 border-border/50 opacity-50 cursor-not-allowed'
                    )}
                    onClick={() => canSelect && toggleSkill(skill.id)}
                  >
                    <Checkbox checked={isSelected} disabled={!canSelect} className="pointer-events-none" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{skill.name}</span>
                        {skill.requiresTraining && <Badge variant="outline" className="text-[10px] px-1 py-0">Req. Treino</Badge>}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="outline" className={cn('text-[10px] px-1.5', LEVEL_COLORS[0])}>{LEVEL_LABELS[0]}</Badge>
                        {isSelected && (
                          <>
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                            <Badge variant="outline" className={cn('text-[10px] px-1.5', LEVEL_COLORS[1])}>{LEVEL_LABELS[1]}</Badge>
                            <TrendingUp className="w-3 h-3 text-success ml-1" />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {availableSkills.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Ban className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma perícia disponível para treinamento.</p>
                  <p className="text-xs mt-1">Todas as perícias já estão treinadas ou foram escolhidas anteriormente.</p>
                </div>
              )}
            </div>
            
            {/* Resumo das escolhas - dentro do body para não ocupar espaço fixo */}
            {choices.length > 0 && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Resumo:</p>
                <div className="space-y-1">
                  {choices.map((choice, idx) => {
                    const skill = SKILLS.find(s => s.id === choice.skillId);
                    return (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Star className="w-3 h-3 text-primary" />
                        <span className="font-medium">{skill?.name}</span>
                        <span className="text-muted-foreground">→ {LEVEL_LABELS[1]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </MobileModalBody>
        
        <MobileModalFooter bordered>
          <Button variant="outline" onClick={handleCancel}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!isValid} className="gap-2">
            <Check className="w-4 h-4" />
            Confirmar
          </Button>
        </MobileModalFooter>
      </MobileModalContent>
    </MobileModal>
  );
}

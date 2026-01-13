/**
 * Modal de Seleção de Perícias para o poder "Treinamento em Perícia"
 * 
 * Regras oficiais (Livro Base v1.3):
 * - Escolha 2 perícias para treinar
 * - NEX < 35%: Pode apenas treinar perícias não treinadas → Treinado
 * - NEX 35-69%: Pode também escolher Treinado → Veterano
 * - NEX 70%+: Pode também escolher Veterano → Expert
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
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  GraduationCap, 
  TrendingUp, 
  AlertCircle, 
  Check,
  ChevronRight,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SKILLS, TRAINING_LEVELS } from '@/lib/character-data';

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
}

// Labels para níveis de treinamento
const LEVEL_LABELS: Record<TrainingLevel, string> = {
  0: 'Destreinado',
  1: 'Treinado',
  2: 'Veterano',
  3: 'Expert',
};

// Cores para níveis
const LEVEL_COLORS: Record<TrainingLevel, string> = {
  0: 'bg-muted text-muted-foreground',
  1: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  2: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  3: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export function SkillTrainingSelectModal({
  isOpen,
  onClose,
  onConfirm,
  powerId,
  instanceIndex,
  nex,
  currentSkills,
  existingChoices = [],
}: SkillTrainingSelectModalProps) {
  // Estado das escolhas (2 perícias)
  const [choices, setChoices] = useState<SkillTrainingChoice[]>(
    existingChoices.length === 2 ? existingChoices : []
  );
  
  // Determinar níveis máximos permitidos baseado no NEX
  const maxTargetLevel = useMemo((): TrainingLevel => {
    if (nex >= 70) return 3; // Expert
    if (nex >= 35) return 2; // Veterano
    return 1; // Treinado
  }, [nex]);
  
  // Obter descrição do que é possível neste NEX
  const nexDescription = useMemo(() => {
    if (nex >= 70) {
      return 'Você pode treinar perícias não treinadas, avançar treinadas para veterano, ou veteranas para expert.';
    }
    if (nex >= 35) {
      return 'Você pode treinar perícias não treinadas ou avançar treinadas para veterano.';
    }
    return 'Você pode treinar perícias que ainda não possui treinamento.';
  }, [nex]);
  
  // Perícias disponíveis para seleção (que podem receber upgrade)
  const availableSkills = useMemo(() => {
    return SKILLS.filter(skill => {
      const currentLevel = (currentSkills[skill.id] || 0) as TrainingLevel;
      // Pode selecionar se o nível atual + 1 não excede o máximo permitido pelo NEX
      return currentLevel < maxTargetLevel;
    }).map(skill => ({
      ...skill,
      currentLevel: (currentSkills[skill.id] || 0) as TrainingLevel,
      possibleTargetLevels: getPossibleTargetLevels(
        (currentSkills[skill.id] || 0) as TrainingLevel,
        maxTargetLevel
      ),
    }));
  }, [currentSkills, maxTargetLevel]);
  
  // Perícias já escolhidas nesta instância
  const selectedSkillIds = useMemo(() => 
    choices.map(c => c.skillId), 
  [choices]);
  
  // Handler para selecionar/deselecionar uma perícia
  const toggleSkill = useCallback((skillId: string, currentLevel: TrainingLevel) => {
    setChoices(prev => {
      const existingIndex = prev.findIndex(c => c.skillId === skillId);
      
      if (existingIndex !== -1) {
        // Remove se já selecionada
        return prev.filter(c => c.skillId !== skillId);
      } else if (prev.length < 2) {
        // Adiciona se há espaço (máximo 2)
        const toLevel = (currentLevel + 1) as TrainingLevel;
        return [...prev, { skillId, fromLevel: currentLevel, toLevel }];
      }
      
      return prev;
    });
  }, []);
  
  // Handler para mudar o nível alvo de uma perícia
  const changeTargetLevel = useCallback((skillId: string, newLevel: TrainingLevel) => {
    setChoices(prev => prev.map(c => 
      c.skillId === skillId ? { ...c, toLevel: newLevel } : c
    ));
  }, []);
  
  // Validação: precisa ter exatamente 2 perícias
  const isValid = choices.length === 2;
  
  // Handler de confirmação
  const handleConfirm = useCallback(() => {
    if (!isValid) return;
    
    onConfirm({
      powerId,
      instanceIndex,
      choices,
    });
  }, [isValid, onConfirm, powerId, instanceIndex, choices]);
  
  // Handler de cancelamento
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
          <MobileModalDescription>
            {nexDescription}
          </MobileModalDescription>
        </MobileModalHeader>
        
        {/* Contador de seleção */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2 bg-muted/50 rounded-lg mx-4 sm:mx-6">
          <span className="text-sm text-muted-foreground">Perícias selecionadas</span>
          <Badge 
            variant={isValid ? 'default' : 'outline'}
            className={cn(
              isValid && 'bg-green-500/20 text-green-400 border-green-500/30'
            )}
          >
            {choices.length}/2
          </Badge>
        </div>
        
        {/* Lista de perícias com scroll */}
        <MobileModalBody useScrollArea={true} maxHeight="55vh">
          <div className="space-y-1">
            {availableSkills.map(skill => {
              const isSelected = selectedSkillIds.includes(skill.id);
              const choice = choices.find(c => c.skillId === skill.id);
              const canSelect = isSelected || choices.length < 2;
              
              return (
                <div
                  key={skill.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer',
                    isSelected
                      ? 'bg-primary/10 border-primary/30'
                      : canSelect
                        ? 'bg-card hover:bg-muted/50 border-border'
                        : 'bg-muted/30 border-border/50 opacity-50 cursor-not-allowed'
                  )}
                  onClick={() => canSelect && toggleSkill(skill.id, skill.currentLevel)}
                >
                  {/* Checkbox */}
                  <Checkbox
                    checked={isSelected}
                    disabled={!canSelect}
                    className="pointer-events-none"
                  />
                  
                  {/* Info da perícia */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{skill.name}</span>
                      {skill.requiresTraining && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          Req. Treino
                        </Badge>
                      )}
                    </div>
                    
                    {/* Níveis atual → alvo */}
                    <div className="flex items-center gap-1 mt-1">
                      <Badge 
                        variant="outline" 
                        className={cn('text-[10px] px-1.5', LEVEL_COLORS[skill.currentLevel])}
                      >
                        {LEVEL_LABELS[skill.currentLevel]}
                      </Badge>
                      
                      {isSelected && choice && (
                        <>
                          <ChevronRight className="w-3 h-3 text-muted-foreground" />
                          
                          {/* Se há múltiplas opções de nível alvo, mostra select */}
                          {skill.possibleTargetLevels.length > 1 ? (
                            <Select
                              value={String(choice.toLevel)}
                              onValueChange={(v) => {
                                // Previne propagação do clique
                                changeTargetLevel(skill.id, Number(v) as TrainingLevel);
                              }}
                            >
                              <SelectTrigger 
                                className="h-5 w-auto min-w-[90px] text-[10px] px-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {skill.possibleTargetLevels.map(level => (
                                  <SelectItem key={level} value={String(level)}>
                                    {LEVEL_LABELS[level]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge 
                              variant="outline" 
                              className={cn('text-[10px] px-1.5', LEVEL_COLORS[choice.toLevel])}
                            >
                              {LEVEL_LABELS[choice.toLevel]}
                            </Badge>
                          )}
                          
                          <TrendingUp className="w-3 h-3 text-green-500 ml-1" />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {availableSkills.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma perícia disponível para treinamento.</p>
                <p className="text-xs mt-1">
                  Todas as perícias já estão no nível máximo permitido para seu NEX.
                </p>
              </div>
            )}
          </div>
        </MobileModalBody>
        
        {/* Resumo das escolhas */}
        {choices.length > 0 && (
          <div className="px-4 sm:px-6 py-3 bg-muted/30 rounded-lg mx-4 sm:mx-6">
            <p className="text-xs text-muted-foreground mb-2">Resumo:</p>
            <div className="space-y-1">
              {choices.map((choice, idx) => {
                const skill = SKILLS.find(s => s.id === choice.skillId);
                return (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Star className="w-3 h-3 text-primary" />
                    <span className="font-medium">{skill?.name}</span>
                    <span className="text-muted-foreground">
                      {LEVEL_LABELS[choice.fromLevel]} → {LEVEL_LABELS[choice.toLevel]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <MobileModalFooter bordered>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!isValid}
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            Confirmar
          </Button>
        </MobileModalFooter>
      </MobileModalContent>
    </MobileModal>
  );
}

/**
 * Retorna os níveis de treinamento possíveis para uma perícia
 * baseado no nível atual e no máximo permitido pelo NEX
 */
function getPossibleTargetLevels(
  currentLevel: TrainingLevel,
  maxLevel: TrainingLevel
): TrainingLevel[] {
  const levels: TrainingLevel[] = [];
  
  for (let level = currentLevel + 1; level <= maxLevel; level++) {
    levels.push(level as TrainingLevel);
  }
  
  return levels;
}

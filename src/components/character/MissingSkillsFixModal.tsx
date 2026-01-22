/**
 * Modal de Correção de Perícias Faltantes
 * 
 * Exibido quando a auditoria detecta que o personagem tem menos
 * perícias treinadas do que o esperado pelas regras.
 * 
 * Regras:
 * - Mostra as perícias já treinadas como TRAVADAS (não podem ser removidas)
 * - Permite selecionar apenas as perícias que faltam para atingir o esperado
 * - Segue o padrão visual dos outros modais de seleção de perícias
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
  Check,
  Lock,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SKILLS } from '@/lib/character-data';

// Labels para níveis de treinamento
const LEVEL_LABELS: Record<number, string> = {
  0: 'Destreinado',
  1: 'Treinado',
  2: 'Veterano',
  3: 'Expert',
};

// Cores para níveis - usando tokens semânticos do design system
const LEVEL_COLORS: Record<number, string> = {
  0: 'bg-muted text-muted-foreground',
  1: 'bg-pe/20 text-pe border-pe/30',
  2: 'bg-warning/20 text-warning border-warning/30',
  3: 'bg-paranormal/20 text-paranormal border-paranormal/30',
};

interface MissingSkillsFixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newSkills: string[]) => void;
  /** Perícias atuais do personagem (id -> nível) */
  currentSkills: Record<string, number>;
  /** Número total de perícias treinadas atualmente */
  currentTrainedCount: number;
  /** Número esperado de perícias treinadas */
  expectedTrainedCount: number;
  /** Detalhes para exibição (origem, classe, poderes) */
  details?: {
    originCount: number;
    classCount: number;
    powersCount: number;
  };
}

export function MissingSkillsFixModal({
  isOpen,
  onClose,
  onConfirm,
  currentSkills,
  currentTrainedCount,
  expectedTrainedCount,
  details,
}: MissingSkillsFixModalProps) {
  // Perícias selecionadas para treinar (novas)
  const [selectedNewSkills, setSelectedNewSkills] = useState<string[]>([]);
  
  // Número de perícias que precisam ser adicionadas
  const missingCount = Math.max(0, expectedTrainedCount - currentTrainedCount);
  
  // Perícias já treinadas (travadas)
  const lockedSkills = useMemo(() => {
    return SKILLS.filter(skill => (currentSkills[skill.id] || 0) > 0);
  }, [currentSkills]);
  
  // Perícias disponíveis para seleção (destreinadas)
  const availableSkills = useMemo(() => {
    return SKILLS.filter(skill => {
      const currentLevel = currentSkills[skill.id] || 0;
      return currentLevel === 0;
    });
  }, [currentSkills]);
  
  // Alternar seleção de uma perícia
  const toggleSkill = useCallback((skillId: string) => {
    setSelectedNewSkills(prev => {
      const exists = prev.includes(skillId);
      if (exists) {
        return prev.filter(id => id !== skillId);
      } else if (prev.length < missingCount) {
        return [...prev, skillId];
      }
      return prev;
    });
  }, [missingCount]);
  
  // Validação - precisa ter selecionado exatamente o número de perícias faltantes
  const isValid = selectedNewSkills.length === missingCount;
  
  // Confirmar seleção
  const handleConfirm = useCallback(() => {
    if (!isValid) return;
    onConfirm(selectedNewSkills);
  }, [isValid, onConfirm, selectedNewSkills]);
  
  // Cancelar
  const handleCancel = useCallback(() => {
    setSelectedNewSkills([]);
    onClose();
  }, [onClose]);

  return (
    <MobileModal open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <MobileModalContent size="lg">
        <MobileModalHeader>
          <MobileModalTitle className="flex items-center gap-2 font-display tracking-wider">
            <AlertCircle className="w-5 h-5 text-warning" />
            PERÍCIAS FALTANTES
          </MobileModalTitle>
          <MobileModalDescription>
            {details ? (
              <>
                Esperado: {expectedTrainedCount} perícias ({details.originCount} origem + {details.classCount} classe
                {details.powersCount > 0 ? ` + ${details.powersCount} poderes` : ''}).
                {' '}Você tem {currentTrainedCount}. Selecione mais {missingCount}.
              </>
            ) : (
              <>
                Esperado: {expectedTrainedCount} perícias. Você tem {currentTrainedCount}.
                {' '}Selecione mais {missingCount} para completar.
              </>
            )}
          </MobileModalDescription>
        </MobileModalHeader>
        
        {/* Contador de progresso - FORA do scroll, área fixa */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2 bg-muted/50 rounded-lg mx-4 sm:mx-6">
          <span className="text-sm text-muted-foreground">Perícias a adicionar</span>
          <Badge 
            variant={isValid ? 'default' : 'outline'} 
            className={cn(isValid && 'bg-success/20 text-success border-success/30')}
          >
            {selectedNewSkills.length}/{missingCount}
          </Badge>
        </div>
        
        {/* Seção de perícias travadas (já treinadas) - FORA do scroll para não ocupar espaço */}
        {lockedSkills.length > 0 && (
          <div className="space-y-2 px-4 sm:px-6 pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              <span>Perícias já treinadas ({lockedSkills.length})</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {lockedSkills.map(skill => {
                const level = currentSkills[skill.id] || 1;
                return (
                  <div
                    key={skill.id}
                    className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border border-border/50 opacity-70"
                  >
                    <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="text-xs font-medium truncate flex-1">{skill.name}</span>
                    <Badge 
                      variant="outline" 
                      className={cn('text-[9px] px-1 py-0 shrink-0', LEVEL_COLORS[level])}
                    >
                      {LEVEL_LABELS[level]}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* 
          Scroll padrão do sistema - contém APENAS a lista selecionável
          maxHeight reduzido para caber em telas menores quando há muitas perícias travadas
        */}
        <MobileModalBody useScrollArea={true} maxHeight="calc(50vh - 80px)">
          <div className="space-y-2">
            {/* Seção de perícias disponíveis para seleção */}
            {availableSkills.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <GraduationCap className="w-3 h-3" />
                  <span>Selecione {missingCount} perícia{missingCount !== 1 ? 's' : ''} para treinar</span>
                </div>
                <div className="space-y-1">
                  {availableSkills.map(skill => {
                    const isSelected = selectedNewSkills.includes(skill.id);
                    const canSelect = isSelected || selectedNewSkills.length < missingCount;
                    
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
                        onClick={() => canSelect && toggleSkill(skill.id)}
                      >
                        <Checkbox 
                          checked={isSelected} 
                          disabled={!canSelect} 
                          className="pointer-events-none" 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{skill.name}</span>
                            {skill.requiresTraining && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                Req. Treino
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge 
                              variant="outline" 
                              className={cn('text-[10px] px-1.5', LEVEL_COLORS[0])}
                            >
                              {LEVEL_LABELS[0]}
                            </Badge>
                            {isSelected && (
                              <>
                                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                <Badge 
                                  variant="outline" 
                                  className={cn('text-[10px] px-1.5', LEVEL_COLORS[1])}
                                >
                                  {LEVEL_LABELS[1]}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Mensagem se não há perícias disponíveis */}
            {availableSkills.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Todas as perícias já estão treinadas!</p>
                <p className="text-xs mt-1">Não há mais perícias disponíveis para seleção.</p>
              </div>
            )}
            
            {/* Resumo das novas seleções */}
            {selectedNewSkills.length > 0 && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Novas perícias a treinar:</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNewSkills.map(skillId => {
                    const skill = SKILLS.find(s => s.id === skillId);
                    return (
                      <Badge 
                        key={skillId}
                        variant="outline" 
                        className="text-xs bg-primary/10 border-primary/30 text-primary"
                      >
                        {skill?.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </MobileModalBody>
        
        <MobileModalFooter bordered>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid} className="gap-2">
            <Check className="w-4 h-4" />
            Confirmar ({selectedNewSkills.length}/{missingCount})
          </Button>
        </MobileModalFooter>
      </MobileModalContent>
    </MobileModal>
  );
}

/**
 * Modal de Seleção para Grau de Treinamento (NEX 35% e 70%)
 * 
 * Regras oficiais (Livro Base v1.3):
 * - Disponível para todas as classes nos NEX 35% e 70%
 * - Combatente: 2 + Intelecto perícias
 * - Especialista: 5 + Intelecto perícias
 * - Ocultista: 3 + Intelecto perícias
 * - NEX 35%: Perícias Treinadas podem virar Veteranas
 * - NEX 70%: Perícias Treinadas podem virar Veteranas OU Veteranas podem virar Expert
 * 
 * IMPORTANTE: Esta habilidade é a ÚNICA forma oficial de aumentar o grau
 * de treinamento de perícias além do nível inicial.
 * 
 * @module TrainingGradeSelectModal
 */

import { useState, useMemo, useCallback } from 'react';
import {
  MobileModal,
  MobileModalContent,
  MobileModalHeader,
  MobileModalFooter,
  MobileModalTitle,
  MobileModalDescription,
} from '@/components/ui/mobile-modal';
import { CustomScroll } from '@/components/ui/custom-scroll';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  GraduationCap, 
  ArrowUp, 
  Check,
  Star,
  Award,
  Ban,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SKILLS } from '@/lib/character-data';

// ========== TIPOS ==========

/** Níveis de treinamento de perícia */
export type TrainingLevel = 0 | 1 | 2 | 3;

/** Labels para níveis de treinamento */
const LEVEL_LABELS: Record<TrainingLevel, string> = {
  0: 'Destreinado',
  1: 'Treinado',
  2: 'Veterano',
  3: 'Expert',
};

/** Cores para níveis de treinamento - usando tokens semânticos */
const LEVEL_COLORS: Record<TrainingLevel, string> = {
  0: 'bg-muted text-muted-foreground',
  1: 'bg-pe/20 text-pe border-pe/30',
  2: 'bg-warning/20 text-warning border-warning/30',
  3: 'bg-paranormal/20 text-paranormal border-paranormal/30',
};

/** Interface para upgrade de perícia */
export interface SkillUpgradeChoice {
  skillId: string;
  fromLevel: TrainingLevel;
  toLevel: TrainingLevel;
}

/** Resultado do modal */
export interface TrainingGradeResult {
  nex: 35 | 70;
  choices: SkillUpgradeChoice[];
}

/** Classes válidas para Grau de Treinamento */
type ValidClass = 'Combatente' | 'Especialista' | 'Ocultista';

/** Quantidade base por classe (+ Intelecto) */
const CLASS_BASE_COUNT: Record<ValidClass, number> = {
  Combatente: 2,
  Especialista: 5,
  Ocultista: 3,
};

interface TrainingGradeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: TrainingGradeResult) => void;
  /** NEX atual (35 ou 70) */
  nex: 35 | 70;
  /** Classe do personagem */
  characterClass: string;
  /** Intelecto do personagem */
  intellect: number;
  /** Mapa de perícias: skillId → nível atual */
  currentSkills: Record<string, number>;
  /** Escolhas já feitas anteriormente (para edição) */
  existingChoices?: SkillUpgradeChoice[];
}

export function TrainingGradeSelectModal({
  isOpen,
  onClose,
  onConfirm,
  nex,
  characterClass,
  intellect,
  currentSkills,
  existingChoices = [],
}: TrainingGradeSelectModalProps) {
  // Estado das escolhas
  const [choices, setChoices] = useState<SkillUpgradeChoice[]>(
    existingChoices.length > 0 ? existingChoices : []
  );

  // Calcula quantidade máxima de escolhas baseado na classe
  const maxChoices = useMemo(() => {
    const baseCount = CLASS_BASE_COUNT[characterClass as ValidClass] || 2;
    return baseCount + intellect;
  }, [characterClass, intellect]);

  // Descrição baseada no NEX e classe
  const description = useMemo(() => {
    const baseCount = CLASS_BASE_COUNT[characterClass as ValidClass] || 2;
    const className = characterClass || 'Personagem';
    
    if (nex === 35) {
      return `${className}: Escolha ${maxChoices} perícias (${baseCount} + Int ${intellect}) para aumentar de Treinado para Veterano.`;
    } else {
      return `${className}: Escolha ${maxChoices} perícias (${baseCount} + Int ${intellect}) para aumentar o grau de treinamento (Treinado → Veterano ou Veterano → Expert).`;
    }
  }, [nex, characterClass, intellect, maxChoices]);

  // Filtra perícias elegíveis baseado no NEX
  const availableSkills = useMemo(() => {
    const eligible: Array<{
      id: string;
      name: string;
      currentLevel: TrainingLevel;
      nextLevel: TrainingLevel;
    }> = [];

    for (const skill of SKILLS) {
      const currentLevel = (currentSkills[skill.id] || 0) as TrainingLevel;

      if (nex === 35) {
        // NEX 35%: Somente Treinado (1) pode virar Veterano (2)
        if (currentLevel === 1) {
          eligible.push({
            id: skill.id,
            name: skill.name,
            currentLevel: 1,
            nextLevel: 2,
          });
        }
      } else if (nex === 70) {
        // NEX 70%: Treinado → Veterano OU Veterano → Expert
        if (currentLevel === 1) {
          eligible.push({
            id: skill.id,
            name: skill.name,
            currentLevel: 1,
            nextLevel: 2,
          });
        } else if (currentLevel === 2) {
          eligible.push({
            id: skill.id,
            name: skill.name,
            currentLevel: 2,
            nextLevel: 3,
          });
        }
      }
    }

    // Ordena: primeiro veteranos (podem virar expert), depois treinados, alfabético
    eligible.sort((a, b) => {
      if (a.currentLevel !== b.currentLevel) {
        return b.currentLevel - a.currentLevel; // Veteranos primeiro no NEX 70%
      }
      return a.name.localeCompare(b.name);
    });

    return eligible;
  }, [currentSkills, nex]);

  // IDs selecionados para verificação rápida
  const selectedSkillIds = useMemo(() => choices.map(c => c.skillId), [choices]);

  // Toggle de seleção de perícia
  const toggleSkill = useCallback((skillId: string, fromLevel: TrainingLevel, toLevel: TrainingLevel) => {
    setChoices(prev => {
      const existingIndex = prev.findIndex(c => c.skillId === skillId);
      
      if (existingIndex !== -1) {
        // Remove se já está selecionado
        return prev.filter(c => c.skillId !== skillId);
      } else if (prev.length < maxChoices) {
        // Adiciona se ainda há espaço
        return [...prev, { skillId, fromLevel, toLevel }];
      }
      
      return prev;
    });
  }, [maxChoices]);

  // Valida se seleção está completa
  const isValid = choices.length === maxChoices;

  // Handler de confirmação (fecha modal após confirmar)
  const handleConfirm = useCallback(() => {
    if (!isValid) return;
    onConfirm({ nex, choices });
    onClose(); // Fecha o modal após confirmar
  }, [isValid, onConfirm, nex, choices, onClose]);

  // Handler de cancelamento (restaura estado anterior)
  const handleCancel = useCallback(() => {
    setChoices(existingChoices.length > 0 ? existingChoices : []);
    onClose();
  }, [existingChoices, onClose]);

  return (
    <MobileModal open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <MobileModalContent size="md">
        <MobileModalHeader>
          <div className="flex items-center justify-between">
            <MobileModalTitle className="flex items-center gap-2 font-display tracking-wider">
              <GraduationCap className="w-5 h-5 text-primary" />
              GRAU DE TREINAMENTO
            </MobileModalTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">NEX {nex}%</Badge>
              <Badge 
                variant={isValid ? 'default' : 'outline'} 
                className={cn(isValid && 'bg-success/20 text-success border-success/30')}
              >
                {choices.length}/{maxChoices}
              </Badge>
            </div>
          </div>
          <MobileModalDescription className="mt-2">{description}</MobileModalDescription>
        </MobileModalHeader>

        {/* Área de scroll com scrollbar visível usando CustomScroll */}
        <div className="flex-1 min-h-0 px-4 sm:px-6">
          <CustomScroll maxHeight="calc(60vh - 100px)" className="w-full rounded-md">
            <div className="space-y-3 pr-3 pb-2">
              {/* Lista de perícias */}
              <div className="space-y-1">
                {availableSkills.map(skill => {
                  const isSelected = selectedSkillIds.includes(skill.id);
                  const canSelect = isSelected || choices.length < maxChoices;

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
                      onClick={() => canSelect && toggleSkill(skill.id, skill.currentLevel, skill.nextLevel)}
                    >
                      <Checkbox 
                        checked={isSelected} 
                        disabled={!canSelect} 
                        className="pointer-events-none" 
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{skill.name}</span>
                        </div>
                        
                        {/* Indicador de progressão */}
                        <div className="flex items-center gap-1 mt-1">
                          <Badge 
                            variant="outline" 
                            className={cn('text-[10px] px-1.5', LEVEL_COLORS[skill.currentLevel])}
                          >
                            {LEVEL_LABELS[skill.currentLevel]}
                          </Badge>
                          
                          <ArrowUp className="w-3 h-3 text-primary" />
                          
                          <Badge 
                            variant="outline" 
                            className={cn('text-[10px] px-1.5', LEVEL_COLORS[skill.nextLevel])}
                          >
                            {LEVEL_LABELS[skill.nextLevel]}
                          </Badge>
                          
                          {/* Ícones indicativos */}
                          {skill.nextLevel === 2 && (
                            <Award className="w-3.5 h-3.5 text-warning ml-1" />
                          )}
                          {skill.nextLevel === 3 && (
                            <Star className="w-3.5 h-3.5 text-paranormal ml-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Mensagem quando não há perícias elegíveis */}
                {availableSkills.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground space-y-3">
                    <Ban className="w-10 h-10 mx-auto opacity-50" />
                    <div>
                      <p className="text-sm font-medium">Nenhuma perícia elegível encontrada.</p>
                      <p className="text-xs mt-2 px-4">
                        {nex === 35 
                          ? "Você precisa ter pelo menos uma perícia no nível TREINADO para poder aumentá-la para VETERANO."
                          : "Você precisa ter perícias no nível TREINADO (→ Veterano) ou VETERANO (→ Expert) para usar este recurso."
                        }
                      </p>
                    </div>
                    <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg mx-4">
                      <p className="text-xs text-warning">
                        💡 <strong>Dica:</strong> Primeiro, adquira perícias Treinadas através da sua origem, 
                        classe ou do poder "Treinamento em Perícia".
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Resumo das seleções - DENTRO do scroll */}
              {choices.length > 0 && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Resumo:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {choices.map((choice, idx) => {
                      const skill = availableSkills.find(s => s.id === choice.skillId);
                      return (
                        <Badge 
                          key={idx}
                          variant="secondary"
                          className={cn(
                            "text-xs cursor-pointer hover:bg-destructive/20",
                            choice.toLevel === 3 && "bg-paranormal/20 text-paranormal"
                          )}
                          onClick={() => toggleSkill(choice.skillId, choice.fromLevel, choice.toLevel)}
                        >
                          {skill?.name || choice.skillId} → {LEVEL_LABELS[choice.toLevel]}
                          <span className="ml-1 opacity-50">×</span>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Aviso de seleção incompleta - DENTRO do scroll */}
              {!isValid && choices.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-warning">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  <span>Selecione {maxChoices - choices.length} perícia{maxChoices - choices.length !== 1 ? 's' : ''} para continuar.</span>
                </div>
              )}
            </div>
          </CustomScroll>
        </div>

        <MobileModalFooter bordered>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid} className="gap-2">
            <Check className="w-4 h-4" />
            Confirmar ({choices.length}/{maxChoices})
          </Button>
        </MobileModalFooter>
      </MobileModalContent>
    </MobileModal>
  );
}

/**
 * Calcula a quantidade de perícias para Grau de Treinamento
 * @param characterClass - Classe do personagem
 * @param intellect - Valor de Intelecto
 * @returns Quantidade de perícias que podem ser escolhidas
 */
export function getTrainingGradeCount(characterClass: string, intellect: number): number {
  const baseCount = CLASS_BASE_COUNT[characterClass as ValidClass] || 2;
  return baseCount + intellect;
}

/**
 * Verifica se a seleção de Grau de Treinamento está completa
 * @param selectedCount - Quantidade de perícias selecionadas
 * @param characterClass - Classe do personagem
 * @param intellect - Valor de Intelecto
 * @returns true se a seleção está completa
 */
export function isTrainingGradeSelectionComplete(
  selectedCount: number,
  characterClass: string,
  intellect: number
): boolean {
  const required = getTrainingGradeCount(characterClass, intellect);
  return selectedCount === required;
}

/**
 * Aplica os upgrades de Grau de Treinamento às perícias
 * @param currentSkills - Mapa atual de perícias
 * @param upgrades - Lista de upgrades a aplicar
 * @returns Novo mapa de perícias com upgrades aplicados
 */
export function applyTrainingGradeUpgrades(
  currentSkills: Record<string, number>,
  upgrades: SkillUpgradeChoice[]
): Record<string, number> {
  const newSkills = { ...currentSkills };
  
  for (const upgrade of upgrades) {
    // Aplica o upgrade, respeitando limite de 3 (Expert)
    newSkills[upgrade.skillId] = Math.min(upgrade.toLevel, 3);
  }
  
  return newSkills;
}

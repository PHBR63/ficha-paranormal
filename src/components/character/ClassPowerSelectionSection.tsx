/**
 * Seção de Seleção de Poderes de Classe na Progressão de NEX
 * 
 * Permite ao jogador escolher poderes de classe disponíveis durante
 * a progressão de NEX, com validação de pré-requisitos em tempo real.
 * 
 * Inclui tratamento especial para Transcender: abre ParanormalPowerSelectModal
 * ao invés de ClassPowerSubchoiceModal quando requiresChoice.type === 'power'.
 * 
 * @module ClassPowerSelectionSection
 */

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sword, Lock, Check, AlertCircle, Plus, Info, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ALL_SKILL_TRAINING_IDS } from '@/lib/constants/game-ids';
import { getChoosableAbilities, getAbilityChoiceCount, ClassAbility } from '@/lib/class-abilities';
import { 
  checkPowerPrerequisites, 
  hasPowerPrerequisites, 
  CharacterDataForPrerequisites,
  formatPrerequisitesText,
  getUnifiedPower 
} from '@/lib/class-abilities-prerequisites';
import { ClassPowerSubchoiceModal, ClassPowerSubchoice } from './ClassPowerSubchoiceModal';
import { ParanormalPowerSelectModal } from './ParanormalPowerSelectModal';
import { TranscenderAffinityStep } from './TranscenderAffinityStep';
import { UnifiedClassPower } from '@/lib/class-powers/types';
import { 
  ParanormalPower, 
  ParanormalElement,
  getPowerById,
  ELEMENT_LABELS 
} from '@/lib/paranormal-powers';

// ================== TIPOS ==================

interface ClassPowerSelectionSectionProps {
  /** ID da classe do personagem */
  classId: string;
  /** NEX atual do personagem */
  currentNex: number;
  /** NEX para o qual está subindo */
  targetNex: number;
  /** Dados do personagem para validação de pré-requisitos */
  characterData: CharacterDataForPrerequisites;
  /** Poderes já possuídos pelo personagem */
  existingAbilities: string[];
  /** Poderes selecionados nesta progressão */
  selectedPowers: string[];
  /** Callback quando poderes são atualizados */
  onPowersChange: (powers: string[]) => void;
  /** Sub-escolhas de poderes (para poderes como Especialista em Arma) */
  classPowerChoices: Record<string, ClassPowerSubchoice>;
  /** Callback quando sub-escolhas são atualizadas */
  onClassPowerChoicesChange: (choices: Record<string, ClassPowerSubchoice>) => void;
  /** Se Transcender foi usado (bloqueia seleção de poderes de classe) */
  usedTranscender?: boolean;
  /** Poderes paranormais já possuídos pelo personagem (para Transcender) */
  characterParanormalPowers?: ParanormalPower[];
  /** Afinidade elemental do personagem */
  elementalAffinity?: ParanormalElement | null;
  /** Se a afinidade está ativa */
  affinityActive?: boolean;
  /** Callback quando Transcender é usado (para bloquear ganho de Sanidade) */
  onTranscenderUsed?: () => void;
  /** Callback quando afinidade elemental é selecionada durante o fluxo de Transcender */
  onPendingAffinityChange?: (affinity: ParanormalElement | null) => void;
}

// ================== FUNÇÕES AUXILIARES ==================

/**
 * Calcula quantas escolhas de poder o personagem ganha neste NEX
 */
function getPowerChoicesThisNex(currentNex: number, targetNex: number): number {
  const currentChoices = getAbilityChoiceCount(currentNex);
  const targetChoices = getAbilityChoiceCount(targetNex);
  return targetChoices - currentChoices;
}

/**
 * Verifica se um poder é repetível (pode ser escolhido múltiplas vezes)
 */
function isRepeatablePower(powerId: string): boolean {
  // IDs centralizados em game-ids.ts (ALL_SKILL_TRAINING_IDS)
  return (ALL_SKILL_TRAINING_IDS as readonly string[]).includes(powerId);
}

/**
 * Verifica se um poder requer sub-escolha
 */
function isPowerWithSubchoice(powerId: string): boolean {
  const power = getUnifiedPower(powerId);
  return !!(power?.effects?.base?.requiresChoice);
}

// ================== COMPONENTE PRINCIPAL ==================

export function ClassPowerSelectionSection({
  classId,
  currentNex,
  targetNex,
  characterData,
  existingAbilities,
  selectedPowers,
  onPowersChange,
  classPowerChoices,
  onClassPowerChoicesChange,
  usedTranscender = false,
  characterParanormalPowers = [],
  elementalAffinity,
  affinityActive = false,
  onTranscenderUsed,
  onPendingAffinityChange,
}: ClassPowerSelectionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [subchoiceModalOpen, setSubchoiceModalOpen] = useState(false);
  const [pendingPower, setPendingPower] = useState<UnifiedClassPower | null>(null);
  // Estado para modal de seleção de poder paranormal (Transcender)
  const [paranormalSelectOpen, setParanormalSelectOpen] = useState(false);
  // Estado para modal de seleção de afinidade elemental (Transcender NEX 50+)
  const [affinityStepOpen, setAffinityStepOpen] = useState(false);
  // Afinidade selecionada durante o fluxo de Transcender (antes de salvar)
  const [pendingAffinity, setPendingAffinity] = useState<ParanormalElement | null>(null);
  // Estado para rastrear quais descrições estão expandidas
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  // Estado de transição entre afinidade e poderes paranormais
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Toggle de expansão de descrição (não dispara seleção do card)
  const toggleDescription = useCallback((powerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDescriptions(prev => {
      const next = new Set(prev);
      if (next.has(powerId)) {
        next.delete(powerId);
      } else {
        next.add(powerId);
      }
      return next;
    });
  }, []);

  // Calcula quantas escolhas de poder este NEX oferece
  const powerChoicesCount = useMemo(() => {
    return getPowerChoicesThisNex(currentNex, targetNex);
  }, [currentNex, targetNex]);

  // Poderes de classe disponíveis para escolha
  const availablePowers = useMemo(() => {
    return getChoosableAbilities(classId, targetNex);
  }, [classId, targetNex]);

  // Dados do personagem incluindo poderes selecionados (para validação dinâmica)
  const dynamicCharacterData: CharacterDataForPrerequisites = useMemo(() => ({
    ...characterData,
    powers: [...characterData.powers, ...selectedPowers],
  }), [characterData, selectedPowers]);

  // Cache de resultados de pré-requisitos
  const prerequisiteResults = useMemo(() => {
    const results: Record<string, { meets: boolean; missing: string[] }> = {};
    for (const power of availablePowers) {
      if (hasPowerPrerequisites(power.id)) {
        results[power.id] = checkPowerPrerequisites(power.id, dynamicCharacterData);
      }
    }
    return results;
  }, [availablePowers, dynamicCharacterData]);

  // Handler para toggle de poder
  const handleTogglePower = useCallback((power: ClassAbility) => {
    const isCurrentlySelected = selectedPowers.includes(power.id);
    
    if (isCurrentlySelected) {
      // Remove poder
      onPowersChange(selectedPowers.filter(p => p !== power.id));
      
      // Remove sub-escolhas associadas
      if (classPowerChoices[power.id]) {
        const newChoices = { ...classPowerChoices };
        delete newChoices[power.id];
        onClassPowerChoicesChange(newChoices);
      }
      return;
    }

    // Verifica limite
    if (selectedPowers.length >= powerChoicesCount) {
      return; // Limite atingido
    }

    // Verifica pré-requisitos
    const prereqResult = prerequisiteResults[power.id];
    if (prereqResult && !prereqResult.meets) {
      return; // Não atende pré-requisitos
    }

    // Verifica se já possui (para não-repetíveis)
    if (!isRepeatablePower(power.id) && existingAbilities.includes(power.id)) {
      return; // Já possui
    }

    // Verifica se precisa de sub-escolha
    const unifiedPower = getUnifiedPower(power.id);
    if (unifiedPower && isPowerWithSubchoice(power.id)) {
      const choiceType = unifiedPower.effects?.base?.requiresChoice?.type;
      
      // TRANSCENDER: Escolha de tipo 'power' abre ParanormalPowerSelectModal
      // Se NEX >= 50 e sem afinidade elemental, abre primeiro o step de afinidade
      if (choiceType === 'power') {
        setPendingPower(unifiedPower);
        
        // Verifica se precisa escolher afinidade elemental primeiro
        const needsAffinityFirst = targetNex >= 50 && !elementalAffinity && !pendingAffinity;
        
        if (needsAffinityFirst) {
          // Abre step de seleção de afinidade antes do modal de poderes
          setAffinityStepOpen(true);
        } else {
          // Abre diretamente o modal de poderes paranormais
          setParanormalSelectOpen(true);
        }
        return;
      }
      
      // Outros tipos de escolha - abre modal normal
      setPendingPower(unifiedPower);
      setSubchoiceModalOpen(true);
      return;
    }

    // Adiciona poder diretamente
    onPowersChange([...selectedPowers, power.id]);
  }, [selectedPowers, powerChoicesCount, prerequisiteResults, existingAbilities, classPowerChoices, onPowersChange, onClassPowerChoicesChange]);

  // Handler para confirmar sub-escolha normal
  const handleSubchoiceConfirm = useCallback((choice: ClassPowerSubchoice) => {
    if (!pendingPower) return;

    // Adiciona poder
    onPowersChange([...selectedPowers, pendingPower.id]);

    // Salva sub-escolha
    onClassPowerChoicesChange({
      ...classPowerChoices,
      [pendingPower.id]: choice,
    });

    // Limpa estado
    setPendingPower(null);
    setSubchoiceModalOpen(false);
  }, [pendingPower, selectedPowers, classPowerChoices, onPowersChange, onClassPowerChoicesChange]);

  // Handler para seleção de poder paranormal (Transcender)
  // Inclui lógica para salvar a afinidade pendente junto com a escolha
  const handleParanormalPowerSelect = useCallback((paranormalPower: ParanormalPower) => {
    if (!pendingPower) return;
    
    // Adiciona Transcender aos poderes selecionados
    onPowersChange([...selectedPowers, pendingPower.id]);
    
    // Salva o poder paranormal escolhido como sub-escolha
    // Se há afinidade pendente, inclui na escolha para ser salva posteriormente
    const choiceData: ClassPowerSubchoice = {
      powerId: pendingPower.id,
      choiceType: 'power',
      chosenValues: [paranormalPower.id],
    };
    
    // Adiciona a afinidade pendente aos metadados da escolha
    if (pendingAffinity) {
      (choiceData as ClassPowerSubchoice & { pendingAffinity?: ParanormalElement }).pendingAffinity = pendingAffinity;
    }
    
    onClassPowerChoicesChange({
      ...classPowerChoices,
      [pendingPower.id]: choiceData,
    });
    
    // Sinaliza que Transcender foi usado (para bloquear ganho de Sanidade)
    onTranscenderUsed?.();
    
    // Fecha modal e limpa estado
    setParanormalSelectOpen(false);
    setPendingPower(null);
    // Não limpa pendingAffinity aqui - será usado no NexProgressionModal para salvar
  }, [pendingPower, pendingAffinity, selectedPowers, classPowerChoices, onPowersChange, onClassPowerChoicesChange, onTranscenderUsed]);

  // Handler para seleção de afinidade elemental no step de Transcender
  // Inclui transição animada entre os modais
  const handleAffinitySelect = useCallback((element: ParanormalElement) => {
    // Salva a afinidade pendente e notifica o componente pai
    setPendingAffinity(element);
    onPendingAffinityChange?.(element);
    
    // Inicia transição animada entre os modais
    setIsTransitioning(true);
    setAffinityStepOpen(false);
    
    // Aguarda a animação de saída antes de abrir o próximo modal
    setTimeout(() => {
      setParanormalSelectOpen(true);
      // Finaliza transição após a animação de entrada
      setTimeout(() => setIsTransitioning(false), 300);
    }, 250);
  }, [onPendingAffinityChange]);

  // Helper para obter nome do poder paranormal a partir do ID
  const getParanormalPowerName = useCallback((powerId: string): string => {
    const power = getPowerById(powerId);
    if (!power) return powerId;
    const elementLabel = power.element !== 'generic' 
      ? ` (${ELEMENT_LABELS[power.element]})`
      : '';
    return `${power.name}${elementLabel}`;
  }, []);

  // Se não há escolhas de poder neste NEX, não renderiza
  if (powerChoicesCount <= 0) {
    return null;
  }

  // Se Transcender foi usado, mostra aviso
  if (usedTranscender) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-muted/30 border border-border rounded-lg"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Você usou Transcender - a escolha de poder de classe foi trocada por um Poder Paranormal.
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Header colapsível */}
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Sword className="w-4 h-4 text-primary" />
                <h4 className="font-display text-sm tracking-wider">
                  PODERES DE CLASSE
                </h4>
                <Badge variant="outline" className="ml-2">
                  {selectedPowers.length}/{powerChoicesCount}
                </Badge>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            {/* Aviso se não selecionou todos */}
            {selectedPowers.length < powerChoicesCount && (
              <div className="flex items-center gap-2 p-2 bg-warning/10 border border-warning/30 rounded text-xs text-warning">
                <AlertCircle className="w-3 h-3" />
                Selecione {powerChoicesCount - selectedPowers.length} poder(es) de classe
              </div>
            )}

            {/* Lista de poderes */}
            <ScrollArea className="h-[350px] pr-2">
              <div className="space-y-2">
                {availablePowers.map((power) => {
                  const prereqResult = prerequisiteResults[power.id];
                  const isBlocked = prereqResult && !prereqResult.meets;
                  const isSelected = selectedPowers.includes(power.id);
                  const alreadyHas = !isRepeatablePower(power.id) && existingAbilities.includes(power.id);
                  const hasSubchoice = isPowerWithSubchoice(power.id);
                  const prereqText = formatPrerequisitesText(power.id);

                  // Conteúdo do card
                  const cardElement = (
                    <Card 
                      className={cn(
                        "transition-all duration-200",
                        // Bloqueado por pré-requisitos - não clicável
                        isBlocked && "opacity-50 cursor-not-allowed",
                        // Já possui (não repetível) - não clicável
                        alreadyHas && "opacity-40 cursor-default",
                        // Selecionado - visual destacado
                        isSelected && "ring-2 ring-primary border-primary bg-primary/5",
                        // Pode selecionar - cursor pointer e hover
                        !isBlocked && !alreadyHas && !isSelected && "cursor-pointer hover:border-primary/50 hover:bg-muted/50"
                      )}
                      onClick={() => {
                        // Já possui - ignora silenciosamente
                        if (alreadyHas) return;
                        
                        // Bloqueado por pré-requisitos - mostra toast explicativo
                        if (isBlocked && prereqResult) {
                          toast.error("Pré-requisitos não atendidos", {
                            description: prereqResult.missing.length 
                              ? `Faltam: ${prereqResult.missing.join(', ')}`
                              : 'Verifique os requisitos deste poder',
                          });
                          return;
                        }
                        
                        handleTogglePower(power);
                      }}
                    >
                      <CardHeader className="p-3 pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-sm">{power.name}</CardTitle>
                            {hasSubchoice && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="secondary" className="text-xs">
                                      <Plus className="w-3 h-3 mr-1" />
                                      Escolha
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Este poder requer uma escolha adicional</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {isBlocked && <Lock className="w-4 h-4 text-destructive" />}
                            {alreadyHas && <Check className="w-4 h-4 text-muted-foreground" />}
                            {isSelected && <Check className="w-4 h-4 text-primary" />}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        {/* Descrição com expansão */}
                        <div className="relative">
                          <CardDescription 
                            className={cn(
                              "text-xs transition-all duration-200",
                              !expandedDescriptions.has(power.id) && "line-clamp-2"
                            )}
                          >
                            {power.description}
                          </CardDescription>
                          
                          {/* Botão Ver mais/menos - só aparece se descrição for longa */}
                          {power.description.length > 100 && (
                            <button
                              type="button"
                              onClick={(e) => toggleDescription(power.id, e)}
                              className="text-xs text-primary hover:text-primary/80 mt-1.5 font-medium flex items-center gap-1 transition-colors"
                            >
                              {expandedDescriptions.has(power.id) ? (
                                <>
                                  <ChevronUp className="w-3 h-3" />
                                  Ver menos
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3" />
                                  Ver mais
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        
                        {/* Mostrar pré-requisitos se existirem */}
                        {prereqText && (
                          <p className={cn(
                            "text-xs mt-2 italic",
                            isBlocked ? "text-destructive" : "text-muted-foreground"
                          )}>
                            {prereqText}
                          </p>
                        )}
                        
                        {/* Mostrar o que falta se bloqueado */}
                        {isBlocked && prereqResult && (
                          <p className="text-xs text-destructive mt-1 font-medium">
                            ⚠️ Faltam: {prereqResult.missing.join(', ')}
                          </p>
                        )}
                        
                        {/* Indicador de já possui */}
                        {alreadyHas && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ✓ Você já possui este poder
                          </p>
                        )}

                        {/* Sub-escolha feita */}
                        {isSelected && classPowerChoices[power.id] && (
                          <div className="mt-2 p-2 bg-primary/10 rounded text-xs">
                            <span className="font-medium">Escolha: </span>
                            {classPowerChoices[power.id].choiceType === 'power' ? (
                              <span className="inline-flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-paranormal" />
                                {getParanormalPowerName(classPowerChoices[power.id].chosenValues[0])}
                              </span>
                            ) : (
                              classPowerChoices[power.id].chosenValues.join(', ')
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );

                  // Se bloqueado, envolver em tooltip com detalhes dos pré-requisitos
                  if (isBlocked && prereqResult) {
                    return (
                      <TooltipProvider key={power.id}>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <div>{cardElement}</div>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="right" 
                            className="max-w-[280px] p-3 bg-destructive/10 border-destructive/30"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-destructive font-medium">
                                <Lock className="w-4 h-4" />
                                <span>Pré-requisitos não atendidos</span>
                              </div>
                              <div className="text-xs space-y-1">
                                <p className="text-muted-foreground">Para desbloquear este poder, você precisa de:</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                  {prereqResult.missing.map((req, idx) => (
                                    <li key={idx} className="text-destructive">{req}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  }

                  // Card normal sem tooltip
                  return <div key={power.id}>{cardElement}</div>;
                })}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </motion.div>
      </Collapsible>

      {/* Modal de sub-escolha normal (grupo de armas, perícias, atributos) */}
      {pendingPower && (
        <ClassPowerSubchoiceModal
          open={subchoiceModalOpen}
          onClose={() => {
            setPendingPower(null);
            setSubchoiceModalOpen(false);
          }}
          power={pendingPower}
          onConfirm={handleSubchoiceConfirm}
          // Para poderes como Perito que exigem perícias treinadas
          trainedSkillIds={characterData.trainedSkills || []}
          existingWeaponGroups={Object.values(classPowerChoices)
            .filter(c => c.choiceType === 'weaponGroup')
            .flatMap(c => c.chosenValues)
          }
          existingSkillChoices={Object.values(classPowerChoices)
            .filter(c => c.choiceType === 'skill')
            .flatMap(c => c.chosenValues)
          }
        />
      )}

      {/* Step de seleção de Afinidade Elemental (Transcender NEX 50+) */}
      <TranscenderAffinityStep
        open={affinityStepOpen}
        onOpenChange={(open) => {
          setAffinityStepOpen(open);
          if (!open && !isTransitioning) setPendingPower(null);
        }}
        onSelectAffinity={handleAffinitySelect}
        targetNex={targetNex}
        isTransitioning={isTransitioning}
      />

      {/* Modal de seleção de Poder Paranormal (Transcender) */}
      <ParanormalPowerSelectModal
        open={paranormalSelectOpen}
        onOpenChange={(open) => {
          setParanormalSelectOpen(open);
          if (!open) {
            setPendingPower(null);
            setPendingAffinity(null); // Limpa afinidade pendente se cancelar
          }
        }}
        onSelectPower={handleParanormalPowerSelect}
        characterPowers={characterParanormalPowers}
        // Usa afinidade pendente se disponível, senão usa a existente
        elementalAffinity={pendingAffinity || elementalAffinity || undefined}
        // Afinidade está ativa se já existia ou se foi selecionada agora
        affinityActive={affinityActive || !!pendingAffinity}
        // Indica se está em transição do step de afinidade
        isFromAffinityStep={isTransitioning}
      />
    </>
  );
}

// ================== VALIDAÇÃO ==================

/**
 * Verifica se a seleção de poderes de classe está completa
 */
export function isClassPowerSelectionComplete(
  selectedPowers: string[],
  currentNex: number,
  targetNex: number,
  usedTranscender: boolean
): boolean {
  if (usedTranscender) return true; // Transcender substitui a escolha
  
  const requiredCount = getPowerChoicesThisNex(currentNex, targetNex);
  return selectedPowers.length >= requiredCount;
}

/**
 * StepSkills - Passo de seleção de perícias
 * 
 * Integrado com:
 * - Perícias da origem (automáticas)
 * - Perícias obrigatórias da classe
 * - Perícias de escolha da classe
 * - Perícias livres (baseadas em INT + classe + NEX)
 * - RuleBookTip: Explicações do livro de regras
 * - Validação Zod: Schemas centralizados
 */

import { useState, useMemo } from 'react';
import { SKILLS, getExtraSkillsByNex } from '@/lib/character-data';
import { getClassSkillRules } from '@/lib/character-builder-engine';
import { cn } from '@/lib/utils';
import { AlertTriangle, Check, Lock, Search, ChevronDown, ChevronRight, ChevronsUpDown } from '@/components/icons/ordem-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { SkillChoiceModal, ConflictResolutionModal } from './SkillChoiceModal';
import { RuleBookTip } from './RuleBookTip';
import { getRulebookContent } from '@/lib/rulebook-content';
import { skillIdSchema, VALID_SKILL_IDS } from '@/lib/validation-schemas';
import {
  ATTRIBUTE_ORDER,
  ATTRIBUTE_NAMES,
  ATTRIBUTE_ABBR,
  ATTRIBUTE_CARD_CLASSES,
  ATTRIBUTE_TEXT_COLORS,
  ATTRIBUTE_RING_COLORS,
  type AttributeKey,
} from '@/lib/constants/attributes';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { CharacterFormData } from '@/pages/CharacterCreate';
import type { RebuildResult } from '@/lib/character-builder-engine';
import { CreationTrainingPanel } from './CreationTrainingPanel';

interface StepSkillsProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
  buildResult: RebuildResult;
}

// Usa as constantes centralizadas - apenas ATTRIBUTE_ABBR para badges compactos
// ATTRIBUTE_ORDER, ATTRIBUTE_NAMES, ATTRIBUTE_CARD_CLASSES, etc. vêm de @/lib/constants/attributes

export function StepSkills({ formData, updateFormData, buildResult }: StepSkillsProps) {
  const [choiceModalOpen, setChoiceModalOpen] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [activeChoice, setActiveChoice] = useState<typeof buildResult.pendingChoices[0] | null>(null);
  const [activeConflict, setActiveConflict] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAttributes, setExpandedAttributes] = useState<string[]>(ATTRIBUTE_ORDER);

  const {
    originSkills,
    classSkills,
    pendingChoices,
    pendingConflicts,
    allTrainedSkills,
  } = buildResult;

  // Use unified calculation from engine + NEX bonus
  const classRules = useMemo(() => {
    if (!formData.characterClass) return { mandatory: [], choices: [], freePoints: 0 };
    return getClassSkillRules(formData.characterClass, formData.attributes.intellect);
  }, [formData.characterClass, formData.attributes.intellect]);

  // Total de perícias livres = apenas base da classe (perícias extras vêm do poder "Treinamento em Perícia")
  const totalFreePoints = classRules.freePoints;
  // Templates legados podem repetir treinamentos de origem/classe na lista livre.
  // Conte apenas escolhas livres distintas, preservando os dados recebidos.
  const grantedSkills = new Set([
    ...originSkills,
    ...classSkills.mandatory,
    ...classSkills.fromChoices,
    ...Object.values(formData.conflictResolutions),
  ]);
  const usedFreePoints = new Set(formData.freeSkills.filter(skill => !grantedSkills.has(skill))).size;
  const remainingFreePoints = Math.max(0, totalFreePoints - usedFreePoints);
  const progressPercentage = totalFreePoints > 0 ? ((totalFreePoints - remainingFreePoints) / totalFreePoints) * 100 : 0;

  // Group skills by attribute
  const skillsByAttribute = useMemo(() => {
    const grouped: Record<string, typeof SKILLS> = {};
    
    ATTRIBUTE_ORDER.forEach(attr => {
      grouped[attr] = SKILLS.filter(s => s.attribute === attr);
    });
    
    return grouped;
  }, []);

  // Filter skills by search
  const filteredSkillsByAttribute = useMemo(() => {
    if (!searchQuery.trim()) return skillsByAttribute;
    
    const query = searchQuery.toLowerCase();
    const filtered: Record<string, typeof SKILLS> = {};
    
    ATTRIBUTE_ORDER.forEach(attr => {
      filtered[attr] = skillsByAttribute[attr].filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query)
      );
    });
    
    return filtered;
  }, [skillsByAttribute, searchQuery]);

  const handleChoiceSelect = (choiceId: string, skillId: string) => {
    updateFormData({
      classSkillChoices: {
        ...formData.classSkillChoices,
        [choiceId]: skillId,
      },
    });
    setChoiceModalOpen(false);
  };

  const handleConflictResolve = (conflictSkillId: string, substituteSkillId: string) => {
    updateFormData({
      conflictResolutions: {
        ...formData.conflictResolutions,
        [conflictSkillId]: substituteSkillId,
      },
    });
    setConflictModalOpen(false);
  };

  const toggleFreeSkill = (skillId: string) => {
    const isSelected = formData.freeSkills.includes(skillId);
    
    if (isSelected) {
      updateFormData({
        freeSkills: formData.freeSkills.filter(s => s !== skillId),
      });
    } else if (remainingFreePoints > 0) {
      updateFormData({
        freeSkills: [...formData.freeSkills, skillId],
      });
    }
  };

  const toggleAttribute = (attr: string) => {
    setExpandedAttributes(prev =>
      prev.includes(attr)
        ? prev.filter(a => a !== attr)
        : [...prev, attr]
    );
  };

  // Skills that can't be selected as free (already trained)
  const unavailableSkills = useMemo(() => new Set([
    ...originSkills,
    ...classSkills.mandatory,
    ...Object.values(formData.classSkillChoices),
    ...Object.values(formData.conflictResolutions),
  ]), [originSkills, classSkills.mandatory, formData.classSkillChoices, formData.conflictResolutions]);

  // Contador de perícias treinadas por atributo
  const trainedByAttribute = useMemo(() => {
    const counts: Record<string, { trained: number; total: number }> = {};
    ATTRIBUTE_ORDER.forEach(attr => {
      const attrSkills = skillsByAttribute[attr] || [];
      const trained = attrSkills.filter(s => 
        unavailableSkills.has(s.id) || formData.freeSkills.includes(s.id)
      ).length;
      counts[attr] = { trained, total: attrSkills.length };
    });
    return counts;
  }, [skillsByAttribute, unavailableSkills, formData.freeSkills]);

  const allExpanded = expandedAttributes.length === ATTRIBUTE_ORDER.length;
  const toggleAllSections = () => {
    setExpandedAttributes(allExpanded ? [] : [...ATTRIBUTE_ORDER]);
  };

  // Conteúdo educativo do livro
  const rulebookContent = getRulebookContent('skills');

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl tracking-wider mb-2">PERÍCIAS</h2>
          <p className="text-muted-foreground text-sm">
            Configure as perícias do seu personagem. Algumas são automáticas, outras você escolhe.
          </p>
        </div>


        {/* Painel educativo do livro de regras */}
        {rulebookContent && (
          <RuleBookTip section={rulebookContent} defaultExpanded={false} />
        )}

        {/* Pending Choices Warning */}
        <AnimatePresence>
          {(pendingChoices.length > 0 || pendingConflicts.length > 0) && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="ordo-panel p-4 bg-warning/10 border-warning/30"
            >
              <div className="flex items-center gap-2 text-warning mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium text-sm">Ações pendentes</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {pendingChoices.map(choice => (
                  <Button
                    key={choice.id}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveChoice(choice);
                      setChoiceModalOpen(true);
                    }}
                  >
                    Escolher: {choice.label}
                  </Button>
                ))}
                {pendingConflicts.map(skillId => {
                  const skill = SKILLS.find(s => s.id === skillId);
                  return (
                    <Button
                      key={skillId}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveConflict(skillId);
                        setConflictModalOpen(true);
                      }}
                      className="border-warning text-warning"
                    >
                      Resolver conflito: {skill?.name}
                    </Button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Origin Skills - Automatic */}
        {originSkills.length > 0 && (
          <motion.div 
            className="ordo-panel p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="font-display text-sm tracking-wider text-secondary mb-3">
              ✓ PERÍCIAS DA ORIGEM (automático)
            </h3>
            <div className="flex flex-wrap gap-2">
              {originSkills.map(skillId => {
                const skill = SKILLS.find(s => s.id === skillId);
                if (!skill) return null;
                return (
                  <div
                    key={skillId}
                    className="flex items-center gap-2 px-3 py-2 bg-secondary/20 text-secondary rounded-sm"
                  >
                    <Check className="w-3 h-3" />
                    <span className="text-sm">{skill.name}</span>
                    <span className="text-xs opacity-70">({ATTRIBUTE_NAMES[skill.attribute]})</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Class Mandatory Skills */}
        {classSkills.mandatory.length > 0 && (
          <motion.div 
            className="ordo-panel p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="font-display text-sm tracking-wider text-primary mb-3">
              ✓ PERÍCIAS OBRIGATÓRIAS DA CLASSE
            </h3>
            <div className="flex flex-wrap gap-2">
              {classSkills.mandatory.map(skillId => {
                const skill = SKILLS.find(s => s.id === skillId);
                const isConflict = originSkills.includes(skillId);
                const resolution = formData.conflictResolutions[skillId];
                const resolvedSkill = resolution ? SKILLS.find(s => s.id === resolution) : null;
                
                if (!skill) return null;
                
                return (
                  <div key={skillId} className="flex items-center gap-2">
                    {isConflict ? (
                      resolvedSkill ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-primary/20 rounded-sm">
                          <Check className="w-3 h-3 text-primary" />
                          <span className="text-sm line-through text-muted-foreground">{skill.name}</span>
                          <span className="text-sm">→ {resolvedSkill.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-2 bg-warning/20 text-warning rounded-sm">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="text-sm">{skill.name} (conflito)</span>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 bg-primary/20 text-primary rounded-sm">
                        <Check className="w-3 h-3" />
                        <span className="text-sm">{skill.name}</span>
                        <span className="text-xs opacity-70">({ATTRIBUTE_NAMES[skill.attribute]})</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Class Choice Skills */}
        {Object.keys(formData.classSkillChoices).length > 0 && (
          <motion.div 
            className="ordo-panel p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h3 className="font-display text-sm tracking-wider text-primary mb-3">
              ESCOLHAS DA CLASSE
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(formData.classSkillChoices).map(([choiceId, skillId]) => {
                const skill = SKILLS.find(s => s.id === skillId);
                return (
                  <div key={choiceId} className="flex items-center gap-2 px-3 py-2 bg-primary/20 text-primary rounded-sm">
                    <Check className="w-3 h-3" />
                    <span className="text-sm">{skill?.name}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Free Skills Counter with Progress Bar */}
        <motion.div 
          className="ordo-panel p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">PERÍCIAS LIVRES</p>
              {/* Breakdown de onde vem os pontos - apenas da classe */}
              <div className="flex gap-1 text-xs">
                <span className="px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
                  Classe: {totalFreePoints}
                </span>
              </div>
            </div>
            <p className={cn(
              'font-display text-2xl',
              remainingFreePoints === 0 ? 'text-success' : 'text-secondary'
            )}>
              {usedFreePoints} / {totalFreePoints}
            </p>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          {remainingFreePoints === 0 && (
            <motion.p 
              className="text-xs text-success mt-2 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              ✓ Todas as perícias livres selecionadas
            </motion.p>
          )}
        </motion.div>

        {/* Painel de atributos para referência */}
        <motion.div 
          className="ordo-panel p-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Seus Atributos</span>
            <span className="text-xs text-muted-foreground">(usados nos testes)</span>
          </div>
          <TooltipProvider delayDuration={200}>
            <div className="flex flex-wrap justify-center gap-3">
              {ATTRIBUTE_ORDER.map((attr) => {
                const value = formData.attributes[attr as keyof typeof formData.attributes];
                const label = ATTRIBUTE_ABBR[attr];
                const colors = ATTRIBUTE_CARD_CLASSES[attr];
                const textColor = ATTRIBUTE_TEXT_COLORS[attr];
                const attrSkills = skillsByAttribute[attr] || [];
                const isHighlighted = expandedAttributes.length === 1 && expandedAttributes[0] === attr;
                const { trained, total } = trainedByAttribute[attr];
                
                return (
                  <Tooltip key={attr}>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={() => {
                          setExpandedAttributes([attr]);
                        }}
                        className={cn(
                          'flex flex-col items-center gap-1 px-3 py-2 rounded border transition-all cursor-pointer',
                          colors,
                          isHighlighted && 'ring-2 ring-offset-1 ring-offset-background scale-105 shadow-lg',
                          isHighlighted && attr === 'agility' && 'ring-blue-400',
                          isHighlighted && attr === 'strength' && 'ring-red-400',
                          isHighlighted && attr === 'intellect' && 'ring-yellow-400',
                          isHighlighted && attr === 'presence' && 'ring-purple-400',
                          isHighlighted && attr === 'vigor' && 'ring-green-400',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn('text-xs font-semibold', textColor)}>{label}</span>
                          <span className={cn('font-display text-xl font-bold', textColor)}>
                            {value >= 0 ? `+${value}` : value}
                          </span>
                        </div>
                        <span className={cn(
                          'text-[10px] font-medium',
                          trained === total ? 'text-green-400' : 'text-muted-foreground'
                        )}>
                          {trained}/{total} treinadas
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px]">
                      <p className="font-semibold text-xs mb-1">Perícias de {ATTRIBUTE_NAMES[attr]}:</p>
                      <p className="text-xs text-muted-foreground">
                        {attrSkills.map(s => s.name).join(', ')}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </motion.div>

        {/* Search + Expand/Collapse */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar perícia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleAllSections}
            className="shrink-0"
            title={allExpanded ? 'Recolher todas' : 'Expandir todas'}
          >
            <ChevronsUpDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Free Skills Selection - Grouped by Attribute */}
        <div className="space-y-3">
          {ATTRIBUTE_ORDER.map((attr) => {
            const skills = filteredSkillsByAttribute[attr];
            const isExpanded = expandedAttributes.includes(attr);
            const attrLabel = ATTRIBUTE_ABBR[attr];
            const attrColors = ATTRIBUTE_CARD_CLASSES[attr];
            const trainedInAttr = skills.filter(s => 
              unavailableSkills.has(s.id) || formData.freeSkills.includes(s.id)
            ).length;

            if (skills.length === 0) return null;

            return (
              <Collapsible
                key={attr}
                open={isExpanded}
                onOpenChange={() => toggleAttribute(attr)}
              >
                <CollapsibleTrigger asChild>
                  <button className={cn(
                    'w-full ordo-panel p-3 flex items-center justify-between transition-all',
                    'hover:border-primary/30',
                    isExpanded && 'border-primary/20'
                  )}>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium border',
                        attrColors
                      )}>
                        {attrLabel}
                      </span>
                      <span className="font-display text-sm tracking-wider">
                        {ATTRIBUTE_NAMES[attr]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({trainedInAttr}/{skills.length} treinadas)
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid md:grid-cols-2 gap-2 mt-2 pl-4">
                    {skills.map((skill) => {
                      // Verifica se a perícia já está treinada por outra fonte (origem, classe, escolhas)
                      const isUnavailable = unavailableSkills.has(skill.id);
                      // Verifica se foi selecionada como perícia livre
                      const isSelected = formData.freeSkills.includes(skill.id);
                      // Perícia treinada = +5 de bônus (valor do atributo é mostrado apenas na ficha final)
                      const isTrained = isSelected || isUnavailable;

                      return (
                        <Tooltip key={skill.id}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => !isUnavailable && toggleFreeSkill(skill.id)}
                              disabled={isUnavailable || (!isSelected && remainingFreePoints <= 0)}
                              className={cn(
                                'p-3 text-left transition-all flex items-center justify-between rounded-sm border',
                                isUnavailable && 'opacity-50 cursor-not-allowed bg-muted/50 border-transparent',
                                isSelected && !isUnavailable && 'border-secondary bg-secondary/10',
                                !isSelected && !isUnavailable && remainingFreePoints <= 0 && 'opacity-50 cursor-not-allowed border-border',
                                !isSelected && !isUnavailable && remainingFreePoints > 0 && 'border-border hover:border-secondary/50'
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  'w-6 h-6 rounded-sm border flex items-center justify-center text-xs',
                                  isTrained
                                    ? 'bg-secondary border-secondary text-secondary-foreground' 
                                    : 'border-border text-muted-foreground'
                                )}>
                                  {isUnavailable ? <Lock className="w-3 h-3" /> : isSelected ? '✓' : null}
                                </div>
                                <span className="font-medium text-sm">{skill.name}</span>
                                {skill.requiresTraining && (
                                  <span className="text-xs text-warning">T</span>
                                )}
                              </div>
                              <div className="text-right">
                                {isTrained ? (
                                  <span className="font-display text-lg text-secondary">+5</span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">não treinada</span>
                                )}
                              </div>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="font-medium">{skill.name}</p>
                            <p className="text-xs text-muted-foreground">{skill.description}</p>
                            {skill.requiresTraining && (
                              <p className="text-xs text-warning mt-1">Requer treinamento para usar</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>

        <CreationTrainingPanel formData={formData} updateFormData={updateFormData} />
        {/* Info */}
        <div className="ordo-panel p-4 bg-primary/5 border-primary/20">
          <p className="text-sm text-muted-foreground">
            <span className="text-primary font-medium">NOTA:</span> Perícias marcadas com <span className="text-warning">T</span> requerem treinamento para serem usadas.
            O atributo define os dados rolados; o treinamento adiciona +5 ao d20 selecionado, junto dos demais modificadores.
          </p>
        </div>

        {/* Choice Modal - com suporte a terceira opção para Combatente */}
        {activeChoice && (
          <SkillChoiceModal
            open={choiceModalOpen}
            onOpenChange={setChoiceModalOpen}
            title={`Escolha: ${activeChoice.label}`}
            description="Selecione uma das opções abaixo para seu personagem."
            options={activeChoice.options}
            selectedSkill={formData.classSkillChoices[activeChoice.id] || null}
            onSelect={(skillId) => handleChoiceSelect(activeChoice.id, skillId)}
            excludeSkills={originSkills}
            // Permite escolha livre quando há conflito (especialmente para Combatente)
            allowFreeChoice={formData.characterClass === 'Combatente'}
            alreadyTrainedSkills={allTrainedSkills}
          />
        )}

        {/* Conflict Resolution Modal */}
        {activeConflict && (
          <ConflictResolutionModal
            open={conflictModalOpen}
            onOpenChange={setConflictModalOpen}
            conflictSkillId={activeConflict}
            alreadyTrainedSkills={allTrainedSkills}
            onSelect={(skillId) => handleConflictResolve(activeConflict, skillId)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

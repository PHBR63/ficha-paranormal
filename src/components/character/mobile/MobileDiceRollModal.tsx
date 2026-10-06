/**
 * MobileDiceRollModal - Modal de rolagem de dados otimizado para mobile
 * Usa Drawer (vaul) para melhor UX em telas pequenas
 * Rola automaticamente ao abrir e exibe resultado com animação
 * 
 * Usa o pool compartilhado e as condições canônicas, preservando bônus preparados pela tela.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, RotateCcw, X, Sparkles, Info, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  MobileDrawer,
  MobileDrawerContent,
  MobileDrawerHeader,
  MobileDrawerTitle,
  MobileDrawerDescription,
  MobileDrawerBody,
  MobileDrawerFooter 
} from '@/components/ui/mobile-drawer';
import { MobileButtonGroup } from '@/components/ui/mobile-button-group';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { getAttributeDicePool } from '@/lib/attribute-dice-pool';
import { getConditionTestDicePenalty, resolveConditionTestAttribute } from '@/lib/conditions/condition-test-penalty';
import confetti from 'canvas-confetti';
import { DiceRollResult, rollSkillTest } from '@/lib/dice-roller';
import { useConfirmedDiceRoll, type ConfirmDicePE } from '@/hooks/useConfirmedDiceRoll';
import { 
  usePowerActivation, 
  type ActivatablePower,
  type SkillTrainingLevel,
  bonusToTrainingLevel,
  getTrainingLevelValue,
} from '@/components/dice/PowerActivationPanel';
import { calculatePowerActivationEffects } from '@/lib/class-powers/activatable-powers-bridge';
import { type SkillRollCharacterConfig } from '@/hooks/sue/useSkillRollWithSUE';

// Interface para detalhamento de bônus por origem
export interface BonusSource {
  label: string;
  value: number;
  type: 'skill' | 'resistance' | 'power' | 'track' | 'origin' | 'item' | 'other';
  description?: string;
  sourceName?: string;
}

// Mapeamento de perícias para seus atributos base (Livro Base v1.3)
const SKILL_ATTRIBUTE_MAP: Record<string, 'strength' | 'agility' | 'vigor' | 'intellect' | 'presence'> = {
  // Agilidade
  acrobacia: 'agility', reflexos: 'agility', furtividade: 'agility', 
  crime: 'agility', pilotagem: 'agility', pontaria: 'agility',
  // Força
  atletismo: 'strength', luta: 'strength',
  // Presença
  artes: 'presence', atuacao: 'presence', diplomacia: 'presence',
  enganacao: 'presence', intimidacao: 'presence', vontade: 'presence',
  // Intelecto
  ciencias: 'intellect', investigacao: 'intellect', medicina: 'intellect',
  ocultismo: 'intellect', percepcao: 'intellect', profissao: 'intellect',
  sobrevivencia: 'intellect', tatica: 'intellect', tecnologia: 'intellect',
  adestramento: 'intellect', intuicao: 'intellect', religiao: 'intellect',
  // Vigor (resistências)
  fortitude: 'vigor',
};

// Props do modal mobile (com paridade desktop para ativação de poderes)
interface MobileDiceRollModalProps {
  open: boolean;
  onClose: () => void;
  label: string;
  attributeValue: number;
  skillBonus?: number;
  resistanceBonus?: number;
  extraDice?: number;      // Dados extras no pool (Discurso Motivador +1d20 ou +2d20)
  bonusSources?: BonusSource[];
  onRollComplete?: (result: DiceRollResult) => void;
  // Novas props para ativação de poderes (paridade desktop)
  activatablePowers?: ActivatablePower[];
  peCurrent?: number;
  nex?: number;
  intellect?: number;
  strength?: number;   // Força para Incansável/Presteza Atlética
  agility?: number;    // Agilidade para Incansável/Presteza Atlética
  presence?: number;   // Presença para Impostor (Enganação usa Presença)
  vigor?: number;      // Vigor para completar mapeamento de atributos
  onPEChange?: ConfirmDicePE;
  // Perícia sendo testada (ID para filtrar poderes aplicáveis como Perito)
  currentSkill?: string;
  // Nível de treinamento atual da perícia (para filtrar Eclético)
  // Eclético só aparece se oferecer um nível SUPERIOR ao atual
  currentSkillTrainingLevel?: SkillTrainingLevel;
  // Bônus de perícias do personagem (para swapToSkill como Impostor/Motor de Busca)
  characterSkills?: Record<string, number>;
  // Props para integração SUE (opcional - para migração incremental)
  characterConfig?: SkillRollCharacterConfig;
  activeConditions?: string[];
}

// Componente de dado individual
function DiceDisplay({ 
  value, 
  isHighlighted, 
  isCritical,
  index 
}: { 
  value: number; 
  isHighlighted: boolean;
  isCritical: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: -20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
      className={cn(
        'w-12 h-12 rounded-lg flex items-center justify-center font-display text-lg font-bold',
        'border-2 shadow-lg',
        isHighlighted
          ? isCritical
            ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500'
            : 'bg-primary/20 border-primary text-primary'
          : 'bg-muted/50 border-border text-muted-foreground'
      )}
    >
      {value}
    </motion.div>
  );
}

export function MobileDiceRollModal({
  open,
  onClose,
  label,
  attributeValue,
  skillBonus = 0,
  resistanceBonus = 0,
  extraDice = 0,       // Dados extras no pool (Discurso Motivador +1d20 ou +2d20)
  bonusSources = [],
  onRollComplete,
  // Novas props para ativação de poderes
  activatablePowers = [],
  peCurrent = 0,
  nex = 5,
  intellect = 1,
  strength = 1,   // Valor padrão para Força
  agility = 1,    // Valor padrão para Agilidade
  presence = 1,   // Valor padrão para Presença (Impostor)
  vigor = 1,      // Valor padrão para Vigor
  onPEChange,
  currentSkill,
  currentSkillTrainingLevel, // Nível de treinamento atual (para filtrar Eclético)
  characterSkills = {}, // Bônus de perícias do personagem
  // SUE Config (migração incremental)
  characterConfig,
  activeConditions = [],
}: MobileDiceRollModalProps) {
  const sourceTrainingBonus = useMemo(() => {
    const sources = bonusSources.filter(source => source.type === 'skill' && Number.isFinite(source.value));
    return sources.length ? sources.reduce((sum, source) => sum + source.value, 0) : undefined;
  }, [bonusSources]);
  const effectiveTrainingLevel: SkillTrainingLevel = useMemo(() => {
    if (currentSkillTrainingLevel) return currentSkillTrainingLevel;
    return bonusToTrainingLevel(sourceTrainingBonus ?? skillBonus);
  }, [currentSkillTrainingLevel, sourceTrainingBonus, skillBonus]);
  // O mobile renderiza sua própria lista: aplica os mesmos requisitos do painel
  // desktop antes de permitir ativação ou cobrança de poderes neste teste.
  const skillPowers = useMemo(() => {
    const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s-]+/g, '');
    const skill = normalize(currentSkill || label);
    const matches = (value: string) => skill === normalize(value) || skill.includes(normalize(value)) || normalize(value).includes(skill);
    return activatablePowers.filter(power => {
      if (power.effectType === 'combat_bonus') return false;
      if (power.applicableSkills?.length && !power.applicableSkills.some(matches)) return false;
      if (power.excludedSkills?.some(matches)) return false;
      const offeredTraining = power.id === 'ecletico' || power.id === 'ecletico-treinado' ? 1
        : power.id === 'ecletico-veterano' ? 2 : power.id === 'ecletico-expert' ? 3 : undefined;
      return offeredTraining === undefined || getTrainingLevelValue(effectiveTrainingLevel) < offeredTraining;
    });
  }, [activatablePowers, currentSkill, label, effectiveTrainingLevel]);
  // === FASE DE ROLAGEM ===
  // 'preparing' = modal aberto, aguardando seleção de poderes
  // 'rolling' = animação de dados
  // 'done' = resultado exibido
  const [phase, setPhase] = useState<'preparing' | 'rolling' | 'done'>('preparing');
  const { confirm: confirmRoll, reset: resetRoll, pending: pendingConfirmation, confirming: confirmingPE, error: confirmationError } = useConfirmedDiceRoll();
  const [displayDice, setDisplayDice] = useState<number[]>([]);
  const [result, setResult] = useState<DiceRollResult | null>(null);
  const [isPowerPanelExpanded, setIsPowerPanelExpanded] = useState(true);
  
  // Refs (React 19: valor inicial obrigatório)
  const hasRolledRef = useRef<boolean>(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Hook para gerenciar ativação de poderes (paridade desktop)
  const {
    activationStates,
    togglePower,
    resetActivations,
    getActivePowers: getStoredActivePowers,
  } = usePowerActivation(skillPowers);
  const getActivePowers = useCallback(() => getStoredActivePowers().filter(state => skillPowers.some(power => power.id === state.powerId)), [getStoredActivePowers, skillPowers]);
  const getTotalPECost = useCallback(() => getActivePowers().reduce((sum, state) => sum + state.peCost, 0), [getActivePowers]);

  // Calcular efeitos dos poderes ativados
  const activatedPowerEffects = useMemo(() => {
    const activePowers = getActivePowers();
    let extraBonus = 0;
    const extraDice: string[] = [];
    let attributeSwap: string | undefined;
    let skillSwap: string | undefined; // Impostor/Motor de Busca: substitui perícia
    const notes: string[] = [];
    
    // Eclético: bônus de treinamento temporário (substitui, não soma)
    // Verifica qual tier de Eclético está ativo para calcular bônus de substituição
    let ecleticoBonus: number | undefined;
    
    for (const ap of activePowers) {
      const effects = calculatePowerActivationEffects(ap.powerId, nex, intellect);
      
      // Tratamento especial para Eclético: é SUBSTITUIÇÃO, não adição
      // O Eclético dá "os benefícios de ser treinado", ou seja, o bônus TOTAL do nível
      if (ap.powerId.startsWith('ecletico')) {
        // Armazena o bônus do Eclético para uso especial
        ecleticoBonus = effects.skillBonusChange;
        if (effects.specialNote) notes.push(effects.specialNote);
        // NÃO soma ao extraBonus - será tratado separadamente
        continue;
      }
      
      extraBonus += effects.skillBonusChange;
      if (effects.extraDice) extraDice.push(effects.extraDice);
      if (effects.attributeSwap) attributeSwap = effects.attributeSwap;
      if (effects.swapToSkill) skillSwap = effects.swapToSkill;
      if (effects.specialNote) notes.push(effects.specialNote);
    }
    
    return { extraBonus, extraDice, attributeSwap, skillSwap, notes, ecleticoBonus };
  }, [getActivePowers, nex, intellect]);
  
  // Calcula o bônus efetivo da perícia considerando swapToSkill (Impostor/Motor de Busca)
  // e também Eclético (que SUBSTITUI o bônus de treinamento, não soma)
  const effectiveSkillBonus = useMemo(() => {
    // Prioridade 1: Troca de perícia (Impostor/Motor de Busca)
    const swap = activatedPowerEffects.skillSwap;
    if (swap && characterSkills[swap] !== undefined) {
      // Usa o bônus da perícia substituta (Enganação para Impostor, Tecnologia para Motor de Busca)
      return characterSkills[swap];
    }
    
    // Prioridade 2: Eclético ativo - SUBSTITUI o bônus de treinamento
    // O Eclético dá "os benefícios de ser treinado/veterano/expert"
    // Portanto, se ativo, usa o bônus do Eclético NO LUGAR do bônus atual
    if (activatedPowerEffects.ecleticoBonus !== undefined) {
      // Retorna o bônus do Eclético, substituindo completamente o skillBonus original
      return activatedPowerEffects.ecleticoBonus;
    }
    
    return skillBonus;
  }, [activatedPowerEffects.skillSwap, activatedPowerEffects.ecleticoBonus, characterSkills, skillBonus]);

  // Cores para cada tipo de bônus
  const bonusTypeColors: Record<BonusSource['type'], string> = {
    skill: 'bg-primary/20 text-primary',
    resistance: 'bg-green-500/20 text-green-500',
    power: 'bg-purple-500/20 text-purple-500',
    track: 'bg-orange-500/20 text-orange-500',
    origin: 'bg-blue-500/20 text-blue-500',
    item: 'bg-amber-500/20 text-amber-500',
    other: 'bg-secondary/50 text-secondary-foreground',
  };

  // Calcula quantidade de dados (considera troca de atributo OU swapToSkill)
  const effectiveAttribute = useMemo(() => {
    // Prioridade 1: Troca de perícia (swapToSkill) - usa o atributo da nova perícia
    const skillSwap = activatedPowerEffects.skillSwap;
    if (skillSwap) {
      const newAttr = SKILL_ATTRIBUTE_MAP[skillSwap];
      if (newAttr === 'presence') return presence;
      if (newAttr === 'intellect') return intellect;
      if (newAttr === 'strength') return strength;
      if (newAttr === 'agility') return agility;
      if (newAttr === 'vigor') return vigor;
    }
    
    // Prioridade 2: Troca de atributo por poder ativado no modal
    const attrSwap = activatedPowerEffects.attributeSwap;
    if (attrSwap === 'intellect') return intellect;
    if (attrSwap === 'strength') return strength;
    if (attrSwap === 'agility') return agility;
    if (attrSwap === 'presence') return presence;
    if (attrSwap === 'vigor') return vigor;
    
    return attributeValue;
  }, [activatedPowerEffects.skillSwap, activatedPowerEffects.attributeSwap, intellect, strength, agility, presence, vigor, attributeValue]);
  
  const testedSkill = activatedPowerEffects.skillSwap || currentSkill || label;
  const testedAttribute = resolveConditionTestAttribute(testedSkill, SKILL_ATTRIBUTE_MAP, activatedPowerEffects.attributeSwap);
  const dicePenalty = getConditionTestDicePenalty(characterConfig?.activeConditions ?? activeConditions, testedAttribute as keyof SkillRollCharacterConfig['attributes'], testedSkill);
  const dicePool = getAttributeDicePool(effectiveAttribute > 0 ? effectiveAttribute + extraDice : effectiveAttribute, dicePenalty);
  const diceCount = dicePool.count;

  // Função para executar a rolagem
  const executeRoll = useCallback(() => {
    if (confirmingPE) return;
    if (pendingConfirmation) { void confirmRoll(); return; }
    // Limpa animação anterior
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }

    setPhase('rolling');
    setResult(null);
    
    let frameCount = 0;
    const maxFrames = 10;
    
    // Animação de números aleatórios
    animationRef.current = setInterval(() => {
      const randomValues = Array.from({ length: diceCount }, () => 
        Math.floor(Math.random() * 20) + 1
      );
      setDisplayDice(randomValues);
      
      frameCount++;
      
      if (frameCount >= maxFrames) {
        if (animationRef.current) {
          clearInterval(animationRef.current);
          animationRef.current = null;
        }
        
        // Rolagem real com bônus de poderes ativados, swapToSkill, Eclético e troca de atributo
        const powerBonus = activatedPowerEffects.extraBonus;
        // Usa effectiveSkillBonus se skillSwap OU ecleticoBonus estiver ativo
        const hasSkillReplacement = activatedPowerEffects.skillSwap || activatedPowerEffects.ecleticoBonus !== undefined;
        const baseSkillBonus = activatedPowerEffects.skillSwap ? effectiveSkillBonus
          : activatedPowerEffects.ecleticoBonus !== undefined ? effectiveSkillBonus + skillBonus - (sourceTrainingBonus ?? skillBonus) : skillBonus;
        const totalBonus = baseSkillBonus + resistanceBonus + powerBonus;
        const recordedSkillBonus = hasSkillReplacement ? effectiveSkillBonus : sourceTrainingBonus ?? baseSkillBonus;
        
        // Calcula atributo efetivo (considera swapToSkill ou troca de atributo)
        let finalAttribute = attributeValue;
        if (activatedPowerEffects.skillSwap) {
          const newAttr = SKILL_ATTRIBUTE_MAP[activatedPowerEffects.skillSwap];
          if (newAttr === 'presence') finalAttribute = presence;
          else if (newAttr === 'intellect') finalAttribute = intellect;
          else if (newAttr === 'strength') finalAttribute = strength;
          else if (newAttr === 'agility') finalAttribute = agility;
          else if (newAttr === 'vigor') finalAttribute = vigor;
        } else {
          const swap = activatedPowerEffects.attributeSwap;
          if (swap === 'intellect') finalAttribute = intellect;
          else if (swap === 'strength') finalAttribute = strength;
          else if (swap === 'agility') finalAttribute = agility;
          else if (swap === 'presence') finalAttribute = presence;
          else if (swap === 'vigor') finalAttribute = vigor;
        }
        
        const rollResult = rollSkillTest({
          attributeValue: finalAttribute,
          dicePenalty,
          skillBonus: recordedSkillBonus,
          otherBonuses: totalBonus - recordedSkillBonus,
          extraDice,  // Passa dados extras do Discurso Motivador
          label,
        });
        
        const peCost = getTotalPECost();
        void confirmRoll({ result: rollResult, nextPE: peCost > 0 ? Math.max(0, peCurrent - peCost) : undefined, confirmPE: onPEChange,
          onConfirmed: () => {
            setDisplayDice(rollResult.dice);
            setResult(rollResult);
            setPhase('done');

            // Confetti em crítico
            if (rollResult.isCritical) {
              confetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.7 },
                colors: ['#ffd700', '#ff6b6b', '#4ecdc4'],
              });
            }

            onRollComplete?.(rollResult);
          },
        }).then(confirmed => { if (!confirmed) setPhase('done'); });
      }
    }, 80);
  }, [pendingConfirmation, confirmingPE, confirmRoll, dicePenalty, attributeValue, skillBonus, sourceTrainingBonus, effectiveSkillBonus, resistanceBonus, extraDice, activatedPowerEffects, label, diceCount, onRollComplete, getTotalPECost, onPEChange, peCurrent, intellect, strength, agility, presence, vigor]);

  // Handler para iniciar a rolagem (clique no botão "Rolar Dados")
  const handleStartRoll = useCallback(() => {
    if (phase === 'preparing' && !hasRolledRef.current) {
      hasRolledRef.current = true;
      executeRoll();
    }
  }, [phase, executeRoll]);

  // Efeito para iniciar fase de preparação quando abre
  // (NÃO rola automaticamente - aguarda ação do jogador)
  useEffect(() => {
    if (open) {
      setPhase('preparing');
      hasRolledRef.current = false;
    }
  }, [open]);

  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
      setPhase('preparing');
      setDisplayDice([]);
      setResult(null);
      hasRolledRef.current = false;
      resetActivations();
      resetRoll(); // Reset ativação de poderes
    }
  }, [open, resetActivations, resetRoll]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, []);

  const total = result?.total || 0;
  const isRolling = phase === 'rolling' || confirmingPE;
  const resultBonusSources: BonusSource[] = result && !activatedPowerEffects.skillSwap && activatedPowerEffects.ecleticoBonus !== undefined
    ? [...bonusSources.filter(source => source.type !== 'skill'), { label: 'Treinamento (Eclético)', value: result.skillBonus, type: 'skill' }]
    : bonusSources;

  return (
    <MobileDrawer open={open} onOpenChange={(isOpen) => !isOpen && !confirmingPE && onClose()}>
      <MobileDrawerContent maxHeight="lg">
        <MobileDrawerHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Dices className="w-5 h-5 text-primary" />
            <MobileDrawerTitle className="font-display text-lg tracking-wider">
              {label}
            </MobileDrawerTitle>
          </div>
          <MobileDrawerDescription className="text-xs">
            {dicePool.keep === 'lowest'
              ? `Desvantagem: ${diceCount}d20, pega o menor`
              : `Pool de ${diceCount}d20, pega o maior`
            }
          </MobileDrawerDescription>
        </MobileDrawerHeader>

        <MobileDrawerBody useScrollArea={false}>
          <div className="space-y-4">
            {/* Painel de ativação de poderes - APARECE PRIMEIRO na fase preparing */}
            {phase === 'preparing' && skillPowers.length > 0 && peCurrent > 0 && (
              <div className="border-b border-border pb-3">
                <button
                  onClick={() => setIsPowerPanelExpanded(!isPowerPanelExpanded)}
                  className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-yellow-500" />
                    Poderes Ativáveis ({skillPowers.length})
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-[10px]">
                      PE: {peCurrent} | Custo: {getTotalPECost()}
                    </span>
                    {isPowerPanelExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </span>
                </button>
                
                <AnimatePresence>
                  {isPowerPanelExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2">
                        {skillPowers.map((power) => {
                          const isActive = activationStates.find(s => s.powerId === power.id)?.isActive || false;
                          const canAfford = isActive || peCurrent >= getTotalPECost() + (power.peCost || 0);
                          
                          return (
                            <div
                              key={power.id}
                              className={cn(
                                'flex items-center justify-between p-2 rounded-lg border transition-colors',
                                isActive 
                                  ? 'bg-accent/20 border-accent' 
                                  : 'bg-muted/30 border-border',
                                !canAfford && !isActive && 'opacity-50'
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-medium truncate">
                                    {power.name}
                                  </span>
                                  {power.peCost && power.peCost > 0 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary shrink-0">
                                      {power.peCost} PE
                                    </span>
                                  )}
                                </div>
                                {power.description && (
                                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                    {power.description}
                                  </p>
                                )}
                              </div>
                              <Switch
                                checked={isActive}
                                onCheckedChange={(checked) => {
                                  if (canAfford || isActive) {
                                    togglePower(power.id, checked);
                                  }
                                }}
                                disabled={!canAfford && !isActive}
                                className="ml-2 shrink-0 scale-90"
                              />
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Indicador de bônus ativo */}
                      {activatedPowerEffects.extraBonus > 0 && (
                        <div className="mt-2 p-2 rounded bg-accent/10 border border-accent/30">
                          <div className="flex items-center gap-1.5 text-xs text-accent">
                            <Sparkles className="w-3 h-3" />
                            <span>Bônus ativado: +{activatedPowerEffects.extraBonus}</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Área dos dados */}
            <div className="flex flex-wrap justify-center gap-2 min-h-[60px]">
              {displayDice.map((die, index) => (
                <DiceDisplay
                  key={`dice-${index}`}
                  value={die}
                  isHighlighted={result !== null && die === result.keptDice}
                  isCritical={result?.isCritical || false}
                  index={index}
                />
              ))}
              
              {/* Placeholder */}
              {displayDice.length === 0 && (
                <div className="flex gap-2">
                  {Array.from({ length: diceCount }).map((_, i) => (
                    <div 
                      key={`placeholder-${i}`}
                      className="w-12 h-12 rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center"
                    >
                      <Dices className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botão ROLAR DADOS - só na fase preparing */}
            {phase === 'preparing' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center pt-2"
              >
                <Button 
                  onClick={handleStartRoll}
                  size="lg"
                  className="w-full gap-2 font-display text-base tracking-wider"
                >
                  <Dices className="w-5 h-5" />
                  ROLAR DADOS
                </Button>
              </motion.div>
            )}

            {/* Painel de ativação de poderes - versão compacta APÓS rolagem */}
            {phase !== 'preparing' && skillPowers.length > 0 && peCurrent > 0 && (
              <div className="border-t border-border pt-3 mt-3">
                <button
                  onClick={() => setIsPowerPanelExpanded(!isPowerPanelExpanded)}
                  className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-yellow-500" />
                    Poderes Ativáveis ({skillPowers.length})
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-[10px]">
                      PE: {peCurrent} | Custo: {getTotalPECost()}
                    </span>
                    {isPowerPanelExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </span>
                </button>
                
                <AnimatePresence>
                  {isPowerPanelExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2">
                        {skillPowers.map((power) => {
                          const isActive = activationStates.find(s => s.powerId === power.id)?.isActive || false;
                          const canAfford = isActive || peCurrent >= getTotalPECost() + (power.peCost || 0);
                          
                          return (
                            <div
                              key={power.id}
                              className={cn(
                                'flex items-center justify-between p-2 rounded-lg border transition-colors',
                                isActive 
                                  ? 'bg-accent/20 border-accent' 
                                  : 'bg-muted/30 border-border',
                                !canAfford && !isActive && 'opacity-50'
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-medium truncate">
                                    {power.name}
                                  </span>
                                  {power.peCost && power.peCost > 0 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary shrink-0">
                                      {power.peCost} PE
                                    </span>
                                  )}
                                </div>
                                {power.description && (
                                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                    {power.description}
                                  </p>
                                )}
                              </div>
                              <Switch
                                checked={isActive}
                                onCheckedChange={(checked) => {
                                  if (canAfford || isActive) {
                                    togglePower(power.id, checked);
                                  }
                                }}
                                disabled={!canAfford && !isActive}
                                className="ml-2 shrink-0 scale-90"
                              />
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Indicador de bônus ativo */}
                      {activatedPowerEffects.extraBonus > 0 && (
                        <div className="mt-2 p-2 rounded bg-accent/10 border border-accent/30">
                          <div className="flex items-center gap-1.5 text-xs text-accent">
                            <Sparkles className="w-3 h-3" />
                            <span>Bônus ativado: +{activatedPowerEffects.extraBonus}</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Resultado */}
            <AnimatePresence mode="wait">
              {result && phase === 'done' && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {/* Breakdown compacto */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
                    <span className="px-2 py-1 rounded bg-secondary/50 font-medium">
                      d20: {result.keptDice}
                    </span>
                    
                    {resultBonusSources.length > 0 ? (
                      resultBonusSources.filter(s => s.value !== 0).map((source, idx) => (
                        <TooltipProvider key={idx} delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className={cn(
                                'px-2 py-1 rounded font-medium flex items-center gap-1',
                                bonusTypeColors[source.type]
                              )}>
                                {source.label}: {source.value > 0 ? '+' : ''}{source.value}
                                {(source.description || source.sourceName) && (
                                  <Info className="w-3 h-3 opacity-60" />
                                )}
                              </span>
                            </TooltipTrigger>
                            {(source.description || source.sourceName) && (
                              <TooltipContent side="top" className="max-w-[200px] text-xs">
                                <p className="font-medium">{source.sourceName || source.label}</p>
                                {source.description && (
                                  <p className="text-muted-foreground mt-0.5">{source.description}</p>
                                )}
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      ))
                    ) : (
                      <>
                        {skillBonus > 0 && (
                          <span className="px-2 py-1 rounded bg-primary/20 text-primary font-medium">
                            Perícia: +{skillBonus}
                          </span>
                        )}
                        {resistanceBonus > 0 && (
                          <span className="px-2 py-1 rounded bg-green-500/20 text-green-500 font-medium">
                            Resistência: +{resistanceBonus}
                          </span>
                        )}
                      </>
                    )}
                    
                    {/* Badges de poderes ativados - indicador visual no breakdown */}
                    {getActivePowers().map((activePower) => {
                      // Buscar dados completos do poder na lista de poderes ativáveis
                      const powerData = skillPowers.find(p => p.id === activePower.powerId);
                      if (!powerData) return null;
                      
                      const effects = calculatePowerActivationEffects(activePower.powerId, nex, intellect);
                      if (activePower.powerId.startsWith('ecletico')) return null;
                      if (effects.skillBonusChange === 0) return null;
                      
                      return (
                        <TooltipProvider key={activePower.powerId} delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="px-2 py-1 rounded font-medium flex items-center gap-1 bg-accent/20 text-accent-foreground">
                                <Zap className="w-3 h-3 text-accent" />
                                +{effects.skillBonusChange} {powerData.name}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px] text-xs">
                              <p className="font-medium">{powerData.name}</p>
                              <p className="text-muted-foreground mt-0.5">
                                {powerData.description || `Bônus de +${effects.skillBonusChange} ativado por ${powerData.peCost || 0} PE`}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                    
                    {/* Indicador de PE consumido */}
                    {getTotalPECost() > 0 && (
                      <span className="px-2 py-1 rounded font-medium flex items-center gap-1 bg-destructive/20 text-destructive">
                        -{getTotalPECost()} PE
                      </span>
                    )}
                  </div>

                  {/* Total grande */}
                  <p className="text-center text-xs text-muted-foreground">Cálculo: {result.keptDice} + perícia ({result.skillBonus}) + outros bônus ({result.otherBonuses}) = {result.total}</p>
                  <div className="text-center">
                    <motion.div 
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 12 }}
                      className={cn(
                        'font-display text-5xl font-bold',
                        result.isCritical && 'text-yellow-500',
                        result.isDisadvantage && !result.isCritical && 'text-destructive'
                      )}
                    >
                      {total}
                    </motion.div>
                    
                    {/* Badges de status */}
                    <div className="flex justify-center gap-2 mt-2">
                      {result.isCritical && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-display"
                        >
                          <Sparkles className="w-3 h-3" />
                          CRÍTICO!
                        </motion.span>
                      )}
                      {result.isDisadvantage && (
                        <span className="px-2 py-1 rounded-full bg-destructive/20 text-destructive text-xs font-display">
                          DESVANTAGEM
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Indicador de rolagem */}
            {isRolling && (
              <div className="text-center text-muted-foreground text-sm animate-pulse">
                Rolando dados...
              </div>
            )}
          </div>
        </MobileDrawerBody>

        {confirmationError && <p role="alert" className="px-4 text-sm text-destructive">{confirmationError}</p>}
        <MobileDrawerFooter>
          <MobileButtonGroup
            buttons={[
              {
                id: 'reroll',
                label: pendingConfirmation ? 'TENTAR CONFIRMAÇÃO' : 'ROLAR NOVAMENTE',
                icon: <RotateCcw className={cn(isRolling && 'animate-spin')} />,
                onClick: executeRoll,
                variant: 'outline',
                type: 'secondary',
                disabled: isRolling,
              },
              {
                id: 'close',
                label: '',
                ariaLabel: 'Fechar rolagem',
                disabled: confirmingPE,
                icon: <X />,
                onClick: onClose,
                variant: 'ghost',
                type: 'secondary',
              },
            ]}
          />
        </MobileDrawerFooter>
      </MobileDrawerContent>
    </MobileDrawer>
  );
}

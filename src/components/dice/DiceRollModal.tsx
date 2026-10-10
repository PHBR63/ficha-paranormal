/**
 * DiceRollModal - Modal de rolagem imediata de dados
 * Abre instantaneamente ao clicar em uma perícia/atributo
 * Rola automaticamente e exibe resultado com animação
 * 
 * Usa o pool compartilhado e as condições canônicas, preservando bônus preparados pela tela.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, X, RotateCcw, Sparkles, Info, Zap } from '@/components/icons/ordem-icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getSkillTrainingBonus } from '@/lib/skill-training';
import { getSkillTrainingRequirement } from '@/lib/skill-test-requirements';
import { getAttributeDicePool } from '@/lib/attribute-dice-pool';
import { getConditionTestDicePenalty, resolveConditionTestAttribute } from '@/lib/conditions/condition-test-penalty';
import confetti from 'canvas-confetti';
import { DiceRollResult, rollSkillTest } from '@/lib/dice-roller';
import { useConfirmedDiceRoll, type ConfirmDicePE } from '@/hooks/useConfirmedDiceRoll';
import { 
  PowerActivationPanel, 
  usePowerActivation, 
  type ActivatablePower,
  type SkillTrainingLevel,
  bonusToTrainingLevel,
} from './PowerActivationPanel';
import { calculatePowerActivationEffects } from '@/lib/class-powers/activatable-powers-bridge';
import { type SkillRollCharacterConfig } from '@/hooks/sue/useSkillRollWithSUE';

// Interface para detalhamento de bônus por origem
export interface BonusSource {
  label: string;
  value: number;
  type: 'skill' | 'resistance' | 'power' | 'track' | 'origin' | 'item' | 'other';
  description?: string; // Descrição detalhada da fonte do bônus
  sourceName?: string;  // Nome específico do poder/ritual/item que concede o bônus
}

// Interface para props da modal
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

interface DiceRollModalProps {
  open: boolean;
  onClose: () => void;
  label: string;
  attributeValue: number;
  skillBonus?: number;
  resistanceBonus?: number; // Bônus de resistência (Fortitude, Reflexos, Vontade)
  extraDice?: number;      // Dados extras no pool (Discurso Motivador +1d20 ou +2d20)
  bonusSources?: BonusSource[]; // Detalhamento dos bônus aplicados
  onRollComplete?: (result: DiceRollResult) => void;
  // Novas props para ativação de poderes
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
  // Graus persistidos 0–3, separados dos bônus numéricos de characterSkills.
  characterSkillTraining?: Record<string, number>;
  // Conhecimento Aplicado: se ativo, próximo teste usa Intelecto (exceto Luta/Pontaria)
  conhecimentoAplicadoAtivo?: boolean;
  onConhecimentoAplicadoUsed?: () => void;
  // Props para integração SUE (opcional - para migração incremental)
  characterConfig?: SkillRollCharacterConfig;
  activeConditions?: string[];
}

// Componente de dado individual - animação simples sem loop
function DiceDisplay({ 
  value, 
  isHighlighted, 
  isCritical,
  isAnimating 
}: { 
  value: number; 
  isHighlighted: boolean;
  isCritical: boolean;
  isAnimating: boolean;
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        rotate: isAnimating ? 360 : 0,
      }}
      transition={{ 
        duration: 0.3,
        rotate: { duration: 0.5, ease: "easeOut" }
      }}
      className={cn(
        'w-14 h-14 rounded-lg flex items-center justify-center font-display text-xl font-bold',
        'border-2 shadow-lg transition-colors duration-300',
        isHighlighted
          ? isCritical
            ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-yellow-500/30'
            : 'bg-primary/20 border-primary text-primary shadow-primary/30'
          : 'bg-muted/50 border-border text-muted-foreground'
      )}
    >
      {value}
    </motion.div>
  );
}

export function DiceRollModal({
  open,
  onClose,
  label,
  attributeValue,
  skillBonus = 0,
  resistanceBonus = 0,
  extraDice = 0,
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
  characterSkillTraining,
  characterSkills = {}, // Bônus de perícias do personagem
  // Conhecimento Aplicado
  conhecimentoAplicadoAtivo = false,
  onConhecimentoAplicadoUsed,
  // SUE Config (migração incremental)
  characterConfig,
  activeConditions = [],
}: DiceRollModalProps) {
  const sourceTrainingBonus = useMemo(() => {
    if (characterSkillTraining) return getSkillTrainingBonus(characterSkillTraining, currentSkill || label);
    const trainingSources = bonusSources.filter(source => source.type === 'skill' && Number.isFinite(source.value));
    return trainingSources.length > 0 ? trainingSources.reduce((sum, source) => sum + source.value, 0) : undefined;
  }, [bonusSources, characterSkillTraining, currentSkill, label]);
  // Bônus de poder não eleva o treinamento usado para os requisitos do Eclético.
  const effectiveTrainingLevel: SkillTrainingLevel = useMemo(() => {
    if (currentSkillTrainingLevel) return currentSkillTrainingLevel;
    if (characterSkillTraining) return bonusToTrainingLevel(getSkillTrainingBonus(characterSkillTraining, currentSkill || label));
    return bonusToTrainingLevel(sourceTrainingBonus ?? skillBonus);
  }, [currentSkillTrainingLevel, characterSkillTraining, currentSkill, label, sourceTrainingBonus, skillBonus]);
  // === FASE DE ROLAGEM ===
  // 'preparing' = modal aberto, aguardando seleção de poderes
  // 'rolling' = animação de dados
  // 'done' = resultado exibido
  // Estados
  const [phase, setPhase] = useState<'preparing' | 'rolling' | 'done'>('preparing');
  const { confirm: confirmRoll, reset: resetRoll, pending: pendingConfirmation, confirming: confirmingPE, error: confirmationError } = useConfirmedDiceRoll();
  const [displayDice, setDisplayDice] = useState<number[]>([]);
  const [result, setResult] = useState<DiceRollResult | null>(null);
  const [isPowerPanelExpanded, setIsPowerPanelExpanded] = useState(true);
  // Poderes exclusivos de ataque/dano pertencem ao modal de combate; não
  // podem alterar testes de perícia nem consumir PE neste fluxo.
  const skillPowers = useMemo(() => activatablePowers.filter(power => power.effectType !== 'combat_bonus'), [activatablePowers]);
  
  // Hook para gerenciar ativação de poderes
  const {
    activationStates,
    togglePower,
    resetActivations,
    getActivePowers: getStoredActivePowers,
  } = usePowerActivation(skillPowers);
  const getActivePowers = useCallback(() => getStoredActivePowers().filter(state => skillPowers.some(power => power.id === state.powerId)), [getStoredActivePowers, skillPowers]);
  const getTotalPECost = useCallback(() => getActivePowers().reduce((sum, state) => sum + state.peCost, 0), [getActivePowers]);
  
  // Ref para controlar se já rolou nesta abertura (React 19: valor inicial obrigatório)
  const hasRolledRef = useRef<boolean>(false);
  // Ref para o intervalo de animação (React 19: valor inicial obrigatório)
  const animationRef = useRef<NodeJS.Timeout | null>(null);

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

  // Calcula bônus adicionais dos poderes ativados
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

  // Verifica se deve usar Conhecimento Aplicado (ativo externamente, exclui Luta/Pontaria)
  const shouldUseConhecimentoAplicado = useMemo(() => {
    if (!conhecimentoAplicadoAtivo) return false;
    
    // Verifica se é Luta ou Pontaria pelo label (que pode ser o nome da perícia)
    const labelLower = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const excludedSkills = ['luta', 'pontaria', 'fighting', 'aim', 'shooting'];
    
    return !excludedSkills.some(skill => labelLower.includes(skill));
  }, [conhecimentoAplicadoAtivo, label]);

  // Calcula quantidade de dados (considera troca de atributo OU swapToSkill OU Conhecimento Aplicado)
  const effectiveAttribute = useMemo(() => {
    // Prioridade 1: Conhecimento Aplicado ativo externamente
    if (shouldUseConhecimentoAplicado) return intellect;
    
    // Prioridade 2: Troca de perícia (swapToSkill) - usa o atributo da nova perícia
    const skillSwap = activatedPowerEffects.skillSwap;
    if (skillSwap) {
      const newAttr = SKILL_ATTRIBUTE_MAP[skillSwap];
      if (newAttr === 'presence') return presence;
      if (newAttr === 'intellect') return intellect;
      if (newAttr === 'strength') return strength;
      if (newAttr === 'agility') return agility;
      if (newAttr === 'vigor') return vigor;
    }
    
    // Prioridade 3: Troca de atributo por poder ativado no modal
    const attrSwap = activatedPowerEffects.attributeSwap;
    if (attrSwap === 'intellect') return intellect;
    if (attrSwap === 'strength') return strength;
    if (attrSwap === 'agility') return agility;
    if (attrSwap === 'presence') return presence;
    if (attrSwap === 'vigor') return vigor;
    
    return attributeValue;
  }, [shouldUseConhecimentoAplicado, activatedPowerEffects.skillSwap, activatedPowerEffects.attributeSwap, intellect, strength, agility, presence, vigor, attributeValue]);
  
  const testedSkill = activatedPowerEffects.skillSwap || currentSkill || label;
  const trainingRequirement = getSkillTrainingRequirement(testedSkill, characterSkillTraining ?? {}, activatedPowerEffects.ecleticoBonus);
  const testedAttribute = resolveConditionTestAttribute(testedSkill, SKILL_ATTRIBUTE_MAP, (shouldUseConhecimentoAplicado ? 'intellect' : undefined) || activatedPowerEffects.attributeSwap);
  const dicePenalty = getConditionTestDicePenalty(characterConfig?.activeConditions ?? activeConditions, testedAttribute as keyof SkillRollCharacterConfig['attributes'], testedSkill);
  const dicePool = getAttributeDicePool(effectiveAttribute > 0 ? effectiveAttribute + extraDice : effectiveAttribute, dicePenalty);
  const diceCount = dicePool.count;

  // Função para executar a rolagem
  const executeRoll = useCallback(() => {
    if (confirmingPE) return;
    if (pendingConfirmation) { void confirmRoll(); return; }
    if (trainingRequirement) return;
    // Limpa qualquer animação anterior
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }

    setPhase('rolling');
    setResult(null);
    
    let frameCount = 0;
    const maxFrames = 12;
    
    // Calcula bônus final: usa effectiveSkillBonus se swapToSkill estiver ativo
    const powerBonus = activatedPowerEffects.extraBonus;
    const ecleticoReplacesTraining = !activatedPowerEffects.skillSwap && activatedPowerEffects.ecleticoBonus !== undefined;
    // Eclético substitui somente o treinamento. Bônus numéricos já preparados
    // de poderes/itens continuam somados; não adicionamos o treinamento duas vezes.
    const baseSkillBonus = activatedPowerEffects.skillSwap ? effectiveSkillBonus
      : ecleticoReplacesTraining ? effectiveSkillBonus + skillBonus - (sourceTrainingBonus ?? skillBonus) : skillBonus;
    const totalBonus = baseSkillBonus + resistanceBonus + powerBonus;
    // As telas podem preparar skillBonus como total agregado. Só separamos o
    // treinamento quando existe uma origem explícita, sem recalcular o total.
    const recordedSkillBonus = activatedPowerEffects.skillSwap || ecleticoReplacesTraining ? effectiveSkillBonus
      : sourceTrainingBonus ?? baseSkillBonus;
    
    // Calcula atributo efetivo (Conhecimento Aplicado OU swapToSkill OU troca por poder ativado)
    let finalAttribute = attributeValue;
    const usedConhecimentoAplicado = shouldUseConhecimentoAplicado;
    
    if (usedConhecimentoAplicado) {
      finalAttribute = intellect;
    } else if (activatedPowerEffects.skillSwap) {
      // Usa o atributo da perícia substituta
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
    
    const finalDiceCount = getAttributeDicePool(finalAttribute > 0 ? finalAttribute + extraDice : finalAttribute, dicePenalty).count;
    
    // Animação de números aleatórios
    animationRef.current = setInterval(() => {
      const randomValues = Array.from({ length: finalDiceCount }, () => 
        Math.floor(Math.random() * 20) + 1
      );
      setDisplayDice(randomValues);
      
      frameCount++;
      
      if (frameCount >= maxFrames) {
        // Para a animação
        if (animationRef.current) {
          clearInterval(animationRef.current);
          animationRef.current = null;
        }
        
        // Executa a rolagem real
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
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#ffd700', '#ff6b6b', '#4ecdc4'],
              });
            }

            // Callback
            onRollComplete?.(rollResult);

            // Consome Conhecimento Aplicado se foi usado
            if (usedConhecimentoAplicado && onConhecimentoAplicadoUsed) {
              onConhecimentoAplicadoUsed();
            }
          },
        }).then(confirmed => { if (!confirmed) setPhase('done'); });
      }
    }, 100);
  }, [
    pendingConfirmation, confirmingPE, confirmRoll,
    dicePenalty,
    extraDice,
    skillBonus, 
    sourceTrainingBonus,
    effectiveSkillBonus,
    resistanceBonus, 
    attributeValue, 
    intellect,
    strength,
    agility,
    presence,
    vigor,
    label, 
    trainingRequirement,
    onRollComplete, 
    activatedPowerEffects, 
    getTotalPECost, 
    onPEChange, 
    peCurrent,
    shouldUseConhecimentoAplicado,
    onConhecimentoAplicadoUsed,
  ]);

  // Efeito para iniciar fase de preparação quando abre
  // (NÃO rola automaticamente - aguarda ação do jogador)
  useEffect(() => {
    if (open) {
      setPhase('preparing');
      hasRolledRef.current = false;
    }
  }, [open]);

  // Efeito para resetar quando fecha
  useEffect(() => {
    if (!open) {
      // Limpa animação se estiver rodando
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
      // Reset estados
      setPhase('preparing');
      setDisplayDice([]);
      setResult(null);
      hasRolledRef.current = false;
      // Reset ativações de poderes
      resetActivations();
      resetRoll();
    }
  }, [open, resetActivations, resetRoll]);

  // Handler para iniciar a rolagem (clique no botão "Rolar Dados")
  const handleStartRoll = useCallback(() => {
    if (phase === 'preparing' && !hasRolledRef.current) {
      hasRolledRef.current = true;
      executeRoll();
    }
  }, [phase, executeRoll]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, []);

  // Handler para rolar novamente
  const handleReroll = () => {
    executeRoll();
  };

  const total = result?.total || 0;
  const isRolling = phase === 'rolling' || confirmingPE;
  const resultBonusSources: BonusSource[] = result && !activatedPowerEffects.skillSwap && activatedPowerEffects.ecleticoBonus !== undefined
    ? [...bonusSources.filter(source => source.type !== 'skill'), { label: 'Treinamento (Eclético)', value: result.skillBonus, type: 'skill' }]
    : bonusSources;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !confirmingPE && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-wider text-center flex items-center justify-center gap-2">
            <Dices className="w-5 h-5 text-primary" />
            {label}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {dicePool.keep === 'lowest'
              ? `Desvantagem: ${diceCount}d20, pega o menor`
              : `Pool de ${diceCount}d20, pega o maior`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Painel de ativação de poderes - APARECE PRIMEIRO na fase preparing */}
          {phase === 'preparing' && skillPowers.length > 0 && peCurrent > 0 && (
            <div className="border-b border-border pb-4">
              <button
                onClick={() => setIsPowerPanelExpanded(!isPowerPanelExpanded)}
                className="w-full flex items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Poderes Ativáveis ({skillPowers.length})
                </span>
                <span className="text-xs">
                  PE: {peCurrent} | Custo: {getTotalPECost()}
                </span>
              </button>
              
              {isPowerPanelExpanded && (
                <PowerActivationPanel
                  availablePowers={skillPowers}
                  activationStates={activationStates}
                  onPowerToggle={togglePower}
                  peCurrent={peCurrent}
                  currentSkill={currentSkill || label}
                  currentSkillTrainingLevel={effectiveTrainingLevel}
                  isExpanded={isPowerPanelExpanded}
                  onExpandToggle={() => setIsPowerPanelExpanded(!isPowerPanelExpanded)}
                />
              )}
            </div>
          )}

          {/* Área dos dados */}
          <div className="flex flex-wrap justify-center gap-3 min-h-[80px]">
            {displayDice.map((die, index) => (
              <DiceDisplay
                key={`dice-${index}`}
                value={die}
                isHighlighted={result !== null && die === result.keptDice}
                isCritical={result?.isCritical || false}
                isAnimating={isRolling}
              />
            ))}
            
            {/* Placeholder quando não há dados */}
            {displayDice.length === 0 && (
              <div className="flex gap-3">
                {Array.from({ length: diceCount }).map((_, i) => (
                  <div 
                    key={`placeholder-${i}`}
                    className="w-14 h-14 rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center"
                  >
                    <Dices className="w-6 h-6 text-muted-foreground/50" />
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
              className="flex justify-center"
            >
              <Button 
                onClick={handleStartRoll}
                disabled={Boolean(trainingRequirement)}
                size="lg"
                className="w-full max-w-xs gap-2 font-display text-lg tracking-wider"
              >
                <Dices className="w-5 h-5" />
                ROLAR DADOS
              </Button>
            </motion.div>
          )}

          {/* Painel de ativação de poderes - versão compacta APÓS rolagem */}
          {phase !== 'preparing' && skillPowers.length > 0 && peCurrent > 0 && (
            <div className="border-t border-border pt-4">
              <button
                onClick={() => setIsPowerPanelExpanded(!isPowerPanelExpanded)}
                className="w-full flex items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Poderes Ativáveis ({skillPowers.length})
                </span>
                <span className="text-xs">
                  PE: {peCurrent} | Custo: {getTotalPECost()}
                </span>
              </button>
              
              {isPowerPanelExpanded && (
                <PowerActivationPanel
                  availablePowers={skillPowers}
                  activationStates={activationStates}
                  onPowerToggle={togglePower}
                  peCurrent={peCurrent}
                  currentSkill={currentSkill || label}
                  currentSkillTrainingLevel={effectiveTrainingLevel}
                  isExpanded={isPowerPanelExpanded}
                  onExpandToggle={() => setIsPowerPanelExpanded(!isPowerPanelExpanded)}
                />
              )}
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
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {/* Breakdown do cálculo - mostra bônus detalhados por origem com tooltips */}
                <TooltipProvider delayDuration={200}>
                  <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                    <span className="px-3 py-1 rounded bg-secondary/50 font-medium">
                      d20: {result.keptDice}
                    </span>
                    
                    {/* Se há detalhamento de bônus, mostra por origem com tooltips */}
                    {resultBonusSources.length > 0 ? (
                      resultBonusSources.filter(s => s.value !== 0).map((source, idx) => (
                        <span key={idx} className="flex items-center gap-1">
                          <span className="text-muted-foreground">+</span>
                          {source.description || source.sourceName ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={cn(
                                  'px-3 py-1 rounded font-medium cursor-help flex items-center gap-1',
                                  bonusTypeColors[source.type]
                                )}>
                                  {source.label}: {source.value > 0 ? '+' : ''}{source.value}
                                  <Info className="w-3 h-3 opacity-60" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="font-medium">{source.sourceName || source.label}</p>
                                {source.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{source.description}</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className={cn(
                              'px-3 py-1 rounded font-medium',
                              bonusTypeColors[source.type]
                            )}>
                              {source.label}: {source.value > 0 ? '+' : ''}{source.value}
                            </span>
                          )}
                        </span>
                      ))
                    ) : (
                      <>
                        {/* Fallback para bônus simples sem detalhamento */}
                        {skillBonus > 0 && (
                          <>
                            <span className="text-muted-foreground">+</span>
                            <span className="px-3 py-1 rounded bg-primary/20 text-primary font-medium">
                              Perícia: +{skillBonus}
                            </span>
                          </>
                        )}
                        {resistanceBonus > 0 && (
                          <>
                            <span className="text-muted-foreground">+</span>
                            <span className="px-3 py-1 rounded bg-green-500/20 text-green-500 font-medium">
                              Resistência: +{resistanceBonus}
                            </span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </TooltipProvider>
                <p className="text-center text-xs text-muted-foreground">
                  Cálculo: {result.keptDice} + perícia ({result.skillBonus}) + outros bônus ({result.otherBonuses}) = {result.total}
                </p>

                {/* Total grande */}
                <div className="text-center">
                  <motion.div 
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                    className={cn(
                      'font-display text-6xl font-bold',
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
                        transition={{ delay: 0.1 }}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-500 text-sm font-display"
                      >
                        <Sparkles className="w-4 h-4" />
                        CRÍTICO!
                      </motion.span>
                    )}
                    {result.isDisadvantage && (
                      <span className="px-3 py-1 rounded-full bg-destructive/20 text-destructive text-sm font-display">
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

          {trainingRequirement && <p role="alert" className="px-4 text-sm text-destructive">{trainingRequirement}</p>}
          {confirmationError && <p role="alert" className="text-sm text-destructive">{confirmationError}</p>}
          {/* Botões de ação */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleReroll}
              disabled={isRolling || (!pendingConfirmation && Boolean(trainingRequirement))}
              className="flex-1 font-display"
            >
              <RotateCcw className={cn('w-4 h-4 mr-2', isRolling && 'animate-spin')} />
              {pendingConfirmation ? 'TENTAR CONFIRMAÇÃO' : 'ROLAR NOVAMENTE'}
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={confirmingPE}
              className="font-display"
            >
              <X className="w-4 h-4 mr-2" />
              FECHAR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useMemo, useCallback } from 'react';
import { CharacterFormData } from '@/pages/CharacterCreate';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Sword, 
  Sparkles, 
  Brain, 
  Shield, 
  Zap, 
  Star,
  Lock,
  CheckCircle2,
  Eye,
  TrendingUp,
  Plus,
  Minus,
  AlertTriangle,
  Repeat,
  GraduationCap,
  Settings2,
  Ban
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  ALL_TRANSCENDER_IDS, 
  ALL_SKILL_TRAINING_IDS 
} from '@/lib/constants/game-ids';
import { 
  getAvailableAbilities, 
  getCoreAbilities, 
  getChoosableAbilities,
  getAbilityChoiceCount,
  ClassAbility
} from '@/lib/class-abilities';
import { RuleBookTip } from './RuleBookTip';
import { getRulebookContent } from '@/lib/rulebook-content';
import { AbilityDetailModal } from './AbilityDetailModal';
import { VersatilitySection, VersatilityChoice, isVersatilityChoiceComplete } from './VersatilitySection';
import { SkillTrainingSelectModal, SkillTrainingResult, SkillTrainingChoice } from './SkillTrainingSelectModal';
import { ParanormalPowerSelectModal } from './ParanormalPowerSelectModal';
import { PowerSubchoiceModal } from './PowerSubchoiceModal';
import { ClassPowerSubchoiceModal, ClassPowerSubchoice } from './ClassPowerSubchoiceModal';
import { calculateDerivedStats, SKILLS } from '@/lib/character-data';
import { rebuildCharacterSheet } from '@/lib/character-builder-engine';
import { 
  type ParanormalPower, 
  type ParanormalElement,
  getPowerById as getParanormalPowerById,
  PARANORMAL_POWERS 
} from '@/lib/paranormal-powers';
import {
  checkPowerPrerequisites,
  formatPrerequisitesText,
  hasPowerPrerequisites,
  getUnifiedPower,
  type CharacterDataForPrerequisites,
  type PrerequisiteCheckResult,
} from '@/lib/class-abilities-prerequisites';
import type { UnifiedClassPower } from '@/lib/class-powers/types';

// ==================== MARCOS DE PROGRESSÃO OFICIAIS (Tabelas 1.3, 1.4, 1.5) ====================
// Mapeamento de habilidades que evoluem com NEX conforme livro oficial

const EVOLVING_ABILITIES: Record<string, { nexMarkers: number[]; evolutions: string[] }> = {
  // Combatente - Ataque Especial (Tabela 1.3)
  // NEX 5%: 2 PE, +5 | NEX 25%: 3 PE, +10 | NEX 55%: 4 PE, +15 | NEX 85%: 5 PE, +20
  'ataque-especial': {
    nexMarkers: [5, 25, 55, 85],
    evolutions: [
      '2 PE para +5 (ataque ou dano)',
      '3 PE para +10 (ataque ou dano)',
      '4 PE para +15 (ataque ou dano)',
      '5 PE para +20 (ataque ou dano)'
    ]
  },
  
  // Especialista - Perito (Tabela 1.4)
  // NEX 5%: +1d6 (2 PE) | NEX 25%: +1d8 (3 PE) | NEX 55%: +1d10 (4 PE) | NEX 85%: +1d12 (5 PE)
  'perito': {
    nexMarkers: [5, 25, 55, 85],
    evolutions: [
      '+1d6 ao resultado (2 PE)',
      '+1d8 ao resultado (3 PE)',
      '+1d10 ao resultado (4 PE)',
      '+1d12 ao resultado (5 PE)'
    ]
  },
  
  // Ocultista - Escolhido pelo Outro Lado (Tabela 1.5)
  // NEX 5%: 1º círculo | NEX 25%: 2º círculo | NEX 55%: 3º círculo | NEX 85%: 4º círculo
  'escolhido-pelo-outro-lado': {
    nexMarkers: [5, 25, 55, 85],
    evolutions: [
      'Rituais de 1º círculo',
      'Rituais de 2º círculo',
      'Rituais de 3º círculo', 
      'Rituais de 4º círculo'
    ]
  },
  
  // Especialista - Engenhosidade (NEX 40% e 75%)
  'engenhosidade': {
    nexMarkers: [40, 75],
    evolutions: [
      'Veterano (+2 PE adicional)',
      'Expert (+4 PE adicional)'
    ]
  }
};

interface StepAbilitiesProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

const CLASS_ICONS: Record<string, React.ElementType> = {
  'Combatente': Sword,
  'Especialista': Brain,
  'Ocultista': Sparkles,
};

const CLASS_COLORS: Record<string, string> = {
  'Combatente': 'from-red-500/20 to-orange-500/20 border-red-500/30',
  'Especialista': 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  'Ocultista': 'from-purple-500/20 to-violet-500/20 border-purple-500/30',
};

export function StepAbilities({ formData, updateFormData }: StepAbilitiesProps) {
  const { characterClass, nex, abilities, classTrack, skillTrainingChoices = {}, transcenderChoices = {} } = formData;
  
  // Estado para o modal de detalhes
  const [selectedAbilityForDetail, setSelectedAbilityForDetail] = useState<ClassAbility | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Estado para o modal de Treinamento em Perícia
  const [skillTrainingModalOpen, setSkillTrainingModalOpen] = useState(false);
  const [pendingSkillTraining, setPendingSkillTraining] = useState<{
    powerId: string;
    instanceIndex: number;
  } | null>(null);
  
  // Estado para o modal de Transcender (escolha de poder paranormal)
  const [transcenderModalOpen, setTranscenderModalOpen] = useState(false);
  const [pendingTranscender, setPendingTranscender] = useState<{
    powerId: string;
    instanceIndex: number;
  } | null>(null);
  
  // Estado para o modal de sub-escolhas do poder paranormal
  const [subchoiceModalOpen, setSubchoiceModalOpen] = useState(false);
  const [pendingPowerForSubchoice, setPendingPowerForSubchoice] = useState<ParanormalPower | null>(null);
  
  // Estado para o modal de sub-escolhas de poderes de CLASSE (Especialista em Arma, etc.)
  const [classPowerSubchoiceModalOpen, setClassPowerSubchoiceModalOpen] = useState(false);
  const [pendingClassPowerForSubchoice, setPendingClassPowerForSubchoice] = useState<UnifiedClassPower | null>(null);
  const [pendingClassPowerInstance, setPendingClassPowerInstance] = useState<number>(0);
  
  // Escolhas de sub-poderes de classe já feitas (para evitar duplicação)
  const classPowerChoices = useMemo(() => (formData as any).classPowerChoices || {}, [formData]);
  
  // Estado para Versatilidade (NEX >= 50%)
  const [versatilityChoice, setVersatilityChoice] = useState<VersatilityChoice | null>(
    (formData as any).versatilityChoice || null
  );
  
  // Verifica se personagem está em NEX 50%+ (precisa fazer escolha de Versatilidade)
  const showVersatility = nex >= 50 && classTrack;
  
  // Calcula se a escolha de poder de classe adicional via Versatilidade foi feita
  const extraPowerFromVersatility = versatilityChoice?.type === 'class_power' ? 1 : 0;
  
  const coreAbilities = characterClass ? getCoreAbilities(characterClass, nex) : [];
  const choosableAbilities = characterClass ? getChoosableAbilities(characterClass, nex) : [];
  const baseMaxChoices = getAbilityChoiceCount(nex);
  // Se escolheu poder de classe via Versatilidade, ganha +1 escolha
  const maxChoices = baseMaxChoices + extraPowerFromVersatility;
  
  // Contar TODAS as ocorrências de abilities no array (incluindo repetições)
  const totalAbilitiesSelected = abilities.filter(a => 
    choosableAbilities.some(ca => ca.id === a)
  ).length;
  const remainingChoices = maxChoices - totalAbilitiesSelected;
  
  // Para poderes únicos selecionados (para mostrar na UI)
  const uniqueSelectedIds = [...new Set(abilities.filter(a => 
    choosableAbilities.some(ca => ca.id === a)
  ))];
  
  const ClassIcon = CLASS_ICONS[characterClass] || Star;
  const classColor = CLASS_COLORS[characterClass] || '';
  
  // Função auxiliar para contar ocorrências de um poder no array
  const getAbilityCount = useCallback((abilityId: string) => {
    return abilities.filter(a => a === abilityId).length;
  }, [abilities]);
  
  // Calcular níveis de perícias atuais para o modal de Treinamento
  const currentSkillLevels = useMemo(() => {
    // Rebuild para obter as perícias atuais
    const buildState = {
      name: formData.name || '',
      playerName: formData.playerName || '',
      concept: formData.concept || '',
      age: formData.age,
      gender: formData.gender || '',
      appearance: formData.appearance || '',
      personality: formData.personality || '',
      origin: formData.origin,
      characterClass: formData.characterClass,
      nex: formData.nex,
      patent: formData.patent || 'Recruta',
      attributes: formData.attributes,
      originSkills: formData.originSkills,
      classSkillChoices: formData.classSkillChoices,
      freeSkills: formData.freeSkills,
      conflictResolutions: formData.conflictResolutions,
      powers: formData.powers,
      background: formData.background || '',
    };
    
    const result = rebuildCharacterSheet(buildState);
    const levels: Record<string, number> = {};
    
    // Todas as perícias treinadas começam no nível 1 (Treinado)
    result.allTrainedSkills.forEach(skillId => {
      levels[skillId] = 1;
    });
    
    // Aplicar upgrades de escolhas anteriores de Treinamento em Perícia
    Object.values(skillTrainingChoices).forEach(choices => {
      choices.forEach(choice => {
        if (choice.toLevel > (levels[choice.skillId] || 0)) {
          levels[choice.skillId] = choice.toLevel;
        }
      });
    });
    
    return levels;
  }, [formData.name, formData.playerName, formData.concept, formData.age, formData.gender,
      formData.appearance, formData.personality, formData.origin, formData.characterClass, 
      formData.nex, formData.patent, formData.attributes, formData.originSkills,
      formData.classSkillChoices, formData.freeSkills, formData.conflictResolutions, 
      formData.powers, formData.background, skillTrainingChoices]);
  
  // Calcular custo de sanidade do Transcender (perda do ganho de SAN)
  const sanityGainPerNex = useMemo(() => {
    if (!characterClass) return 0;
    // Calcular ganho de SAN entre NEX 10% e 15% (representa ganho por marco de 5%)
    const stats5 = calculateDerivedStats(characterClass, 1, 1, 5);
    const stats10 = calculateDerivedStats(characterClass, 1, 1, 10);
    return stats10.san - stats5.san;
  }, [characterClass]);
  
  // Contar quantas vezes Transcender foi escolhido
  const transcenderCount = useMemo(() => {
    const transcenderIds = ['transcender', 'transcender-esp', 'transcender-ocultista'];
    return abilities.filter(a => transcenderIds.includes(a)).length;
  }, [abilities]);
  
  // ==================== VALIDAÇÃO DE PRÉ-REQUISITOS ====================
  
  // Dados do personagem para verificação de pré-requisitos
  const characterDataForPrereqs: CharacterDataForPrerequisites = useMemo(() => {
    // Rebuild para obter perícias treinadas
    const buildState = {
      name: formData.name || '',
      playerName: formData.playerName || '',
      concept: formData.concept || '',
      age: formData.age,
      gender: formData.gender || '',
      appearance: formData.appearance || '',
      personality: formData.personality || '',
      origin: formData.origin,
      characterClass: formData.characterClass,
      nex: formData.nex,
      patent: formData.patent || 'Recruta',
      attributes: formData.attributes,
      originSkills: formData.originSkills,
      classSkillChoices: formData.classSkillChoices,
      freeSkills: formData.freeSkills,
      conflictResolutions: formData.conflictResolutions,
      powers: formData.powers,
      background: formData.background || '',
    };
    
    const result = rebuildCharacterSheet(buildState);
    
    return {
      nex: formData.nex,
      attributes: {
        strength: formData.attributes.strength,
        agility: formData.attributes.agility,
        vigor: formData.attributes.vigor,
        intellect: formData.attributes.intellect,
        presence: formData.attributes.presence,
      },
      trainedSkills: result.allTrainedSkills,
      skillLevels: currentSkillLevels,
      powers: abilities,
      proficiencies: result.proficiencies,
    };
  }, [
    formData.name, formData.playerName, formData.concept, formData.age, formData.gender,
    formData.appearance, formData.personality, formData.origin, formData.characterClass,
    formData.nex, formData.patent, formData.attributes, formData.originSkills,
    formData.classSkillChoices, formData.freeSkills, formData.conflictResolutions,
    formData.powers, formData.background, abilities, currentSkillLevels
  ]);
  
  // Cache de verificação de pré-requisitos para cada poder
  const prerequisiteResults = useMemo(() => {
    const results: Record<string, PrerequisiteCheckResult> = {};
    
    for (const ability of choosableAbilities) {
      if (hasPowerPrerequisites(ability.id)) {
        results[ability.id] = checkPowerPrerequisites(ability.id, characterDataForPrereqs);
      }
    }
    
    return results;
  }, [choosableAbilities, characterDataForPrereqs]);
  
  // Função para verificar se um poder pode ser selecionado (atende pré-requisitos)
  const canSelectPower = useCallback((abilityId: string): boolean => {
    const result = prerequisiteResults[abilityId];
    // Se não há pré-requisitos ou atende todos, pode selecionar
    return !result || result.meets;
  }, [prerequisiteResults]);
  
  // Função para obter mensagem de pré-requisitos faltantes
  const getMissingPrerequisites = useCallback((abilityId: string): string[] => {
    const result = prerequisiteResults[abilityId];
    return result?.missing || [];
  }, [prerequisiteResults]);
  
  // Abre o modal com os detalhes da habilidade
  const openAbilityDetail = (ability: ClassAbility) => {
    setSelectedAbilityForDetail(ability);
    setIsDetailModalOpen(true);
  };

  // Verifica se um poder é Treinamento em Perícia (IDs centralizados)
  const isSkillTrainingPower = useCallback((abilityId: string) => {
    return (ALL_SKILL_TRAINING_IDS as readonly string[]).includes(abilityId);
  }, []);
  
  // Verifica se um poder é Transcender (IDs centralizados)
  const isTranscenderPower = useCallback((abilityId: string) => {
    return (ALL_TRANSCENDER_IDS as readonly string[]).includes(abilityId);
  }, []);
  
  // Gera a chave para armazenar escolhas de Treinamento em Perícia
  const getSkillTrainingKey = useCallback((powerId: string, instanceIndex: number) => {
    return `${powerId}-${instanceIndex}`;
  }, []);
  
  // Obtém as escolhas de uma instância específica de Treinamento em Perícia
  const getSkillTrainingForInstance = useCallback((powerId: string, instanceIndex: number) => {
    const key = getSkillTrainingKey(powerId, instanceIndex);
    return skillTrainingChoices[key] || [];
  }, [skillTrainingChoices, getSkillTrainingKey]);
  
  // Handler para adicionar uma instância de Treinamento em Perícia (abre modal)
  const handleAddSkillTraining = useCallback((abilityId: string) => {
    if (remainingChoices <= 0) return;
    
    // Calcular qual será o índice desta nova instância
    const currentCount = getAbilityCount(abilityId);
    const newInstanceIndex = currentCount;
    
    // Abrir modal para escolher as perícias
    setPendingSkillTraining({
      powerId: abilityId,
      instanceIndex: newInstanceIndex,
    });
    setSkillTrainingModalOpen(true);
  }, [remainingChoices, getAbilityCount]);
  
  // Handler para confirmar escolhas de Treinamento em Perícia
  const handleSkillTrainingConfirm = useCallback((result: SkillTrainingResult) => {
    const key = getSkillTrainingKey(result.powerId, result.instanceIndex);
    
    // Adicionar o poder ao array de abilities
    const newAbilities = [...abilities, result.powerId];
    
    // Salvar as escolhas de perícias
    const newSkillTrainingChoices = {
      ...skillTrainingChoices,
      [key]: result.choices,
    };
    
    updateFormData({
      abilities: newAbilities,
      skillTrainingChoices: newSkillTrainingChoices,
    } as any);
    
    // Fechar modal
    setSkillTrainingModalOpen(false);
    setPendingSkillTraining(null);
  }, [abilities, skillTrainingChoices, getSkillTrainingKey, updateFormData]);
  
  // Handler para remover instância de Treinamento em Perícia
  const handleRemoveSkillTraining = useCallback((abilityId: string) => {
    const count = getAbilityCount(abilityId);
    if (count === 0) return;
    
    // Remove a última instância
    const lastInstanceIndex = count - 1;
    const key = getSkillTrainingKey(abilityId, lastInstanceIndex);
    
    // Remover do array de abilities
    const index = abilities.lastIndexOf(abilityId);
    if (index !== -1) {
      const newAbilities = [...abilities];
      newAbilities.splice(index, 1);
      
      // Remover as escolhas de perícias desta instância
      const newSkillTrainingChoices = { ...skillTrainingChoices };
      delete newSkillTrainingChoices[key];
      
      updateFormData({
        abilities: newAbilities,
        skillTrainingChoices: newSkillTrainingChoices,
      } as any);
    }
  }, [abilities, skillTrainingChoices, getAbilityCount, getSkillTrainingKey, updateFormData]);

  // Handler para adicionar uma instância de Transcender (abre modal de poder paranormal)
  const handleAddTranscender = useCallback((abilityId: string) => {
    if (remainingChoices <= 0) return;
    
    // Calcular qual será o índice desta nova instância
    const currentCount = getAbilityCount(abilityId);
    const newInstanceIndex = currentCount;
    
    // Abrir modal para escolher o poder paranormal
    setPendingTranscender({
      powerId: abilityId,
      instanceIndex: newInstanceIndex,
    });
    setTranscenderModalOpen(true);
  }, [remainingChoices, getAbilityCount]);
  
  // Obtém os poderes paranormais já escolhidos via Transcender (para validação de pré-requisitos)
  const characterParanormalPowers = useMemo(() => {
    const powers: ParanormalPower[] = [];
    Object.values(transcenderChoices).forEach(choice => {
      const power = getParanormalPowerById(choice.powerId);
      if (power) {
        powers.push(power);
      }
    });
    return powers;
  }, [transcenderChoices]);
  
  // Gera a chave para armazenar escolhas de Transcender
  const getTranscenderKey = useCallback((powerId: string, instanceIndex: number) => {
    return `${powerId}-${instanceIndex}`;
  }, []);
  
  // Handler para quando um poder paranormal é selecionado no modal de Transcender
  const handleTranscenderPowerSelect = useCallback((power: ParanormalPower) => {
    // Se o poder requer escolha adicional (perícias, ritual, elemento), abre o modal de sub-escolhas
    if (power.requiresChoice) {
      setPendingPowerForSubchoice(power);
      setTranscenderModalOpen(false);
      setSubchoiceModalOpen(true);
    } else {
      // Poder não requer escolha adicional, confirma diretamente
      // Chama confirmTranscenderChoice inline para evitar problemas de referência stale
      if (!pendingTranscender) return;
      
      const key = getTranscenderKey(pendingTranscender.powerId, pendingTranscender.instanceIndex);
      
      // Adicionar o poder Transcender ao array de abilities
      const newAbilities = [...abilities, pendingTranscender.powerId];
      
      // Salvar a escolha do poder paranormal
      const newTranscenderChoices = {
        ...transcenderChoices,
        [key]: {
          powerId: power.id,
          powerName: power.name,
          powerElement: power.element,
          subchoices: undefined,
        },
      };
      
      updateFormData({
        abilities: newAbilities,
        transcenderChoices: newTranscenderChoices,
      } as any);
      
      // Fechar modais
      setTranscenderModalOpen(false);
      setPendingTranscender(null);
    }
  }, [pendingTranscender, abilities, transcenderChoices, getTranscenderKey, updateFormData]);
  
  // Confirma a escolha de Transcender (com ou sem sub-escolhas)
  const confirmTranscenderChoice = useCallback((power: ParanormalPower, subchoices?: { skills?: string[]; ritualId?: string; resistElement?: string }) => {
    if (!pendingTranscender) return;
    
    const key = getTranscenderKey(pendingTranscender.powerId, pendingTranscender.instanceIndex);
    
    // Adicionar o poder Transcender ao array de abilities
    const newAbilities = [...abilities, pendingTranscender.powerId];
    
    // Salvar a escolha do poder paranormal
    const newTranscenderChoices = {
      ...transcenderChoices,
      [key]: {
        powerId: power.id,
        powerName: power.name,
        powerElement: power.element,
        subchoices,
      },
    };
    
    updateFormData({
      abilities: newAbilities,
      transcenderChoices: newTranscenderChoices,
    } as any);
    
    // Fechar modais
    setTranscenderModalOpen(false);
    setSubchoiceModalOpen(false);
    setPendingTranscender(null);
    setPendingPowerForSubchoice(null);
  }, [abilities, transcenderChoices, pendingTranscender, getTranscenderKey, updateFormData]);
  
  // Handler para confirmar sub-escolhas do poder paranormal
  const handleSubchoiceConfirm = useCallback((subchoices: { skills?: string[]; ritualId?: string; resistElement?: string }) => {
    if (pendingPowerForSubchoice) {
      confirmTranscenderChoice(pendingPowerForSubchoice, subchoices);
    }
  }, [pendingPowerForSubchoice, confirmTranscenderChoice]);
  
  // Handler para remover instância de Transcender
  const handleRemoveTranscender = useCallback((abilityId: string) => {
    const count = getAbilityCount(abilityId);
    if (count === 0) return;
    
    // Remove a última instância
    const lastInstanceIndex = count - 1;
    const key = getTranscenderKey(abilityId, lastInstanceIndex);
    
    // Remover do array de abilities
    const index = abilities.lastIndexOf(abilityId);
    if (index !== -1) {
      const newAbilities = [...abilities];
      newAbilities.splice(index, 1);
      
      // Remover a escolha de poder paranormal desta instância
      const newTranscenderChoices = { ...transcenderChoices };
      delete newTranscenderChoices[key];
      
      updateFormData({
        abilities: newAbilities,
        transcenderChoices: newTranscenderChoices,
      } as any);
    }
  }, [abilities, transcenderChoices, getAbilityCount, getTranscenderKey, updateFormData]);

  // Verifica se um poder de classe requer sub-escolha (Especialista em Arma, etc.)
  const isClassPowerWithChoice = useCallback((abilityId: string): boolean => {
    const unifiedPower = getUnifiedPower(abilityId);
    return !!(unifiedPower?.effects?.base?.requiresChoice);
  }, []);
  
  // Buscar grupos de armas já escolhidos (para Especialista em Arma)
  const existingWeaponGroups = useMemo(() => {
    const groups: string[] = [];
    Object.values(classPowerChoices).forEach((choice: any) => {
      if (choice?.choiceType === 'weaponGroup') {
        groups.push(...(choice.chosenValues || []));
      }
    });
    return groups;
  }, [classPowerChoices]);
  
  // Handler para adicionar poder que requer sub-escolha
  const handleAddClassPowerWithChoice = useCallback((abilityId: string) => {
    if (remainingChoices <= 0) return;
    
    const unifiedPower = getUnifiedPower(abilityId);
    if (!unifiedPower) return;
    
    const currentCount = getAbilityCount(abilityId);
    
    setPendingClassPowerForSubchoice(unifiedPower);
    setPendingClassPowerInstance(currentCount);
    setClassPowerSubchoiceModalOpen(true);
  }, [remainingChoices, getAbilityCount]);
  
  // Handler para confirmar sub-escolha de poder de classe
  const handleClassPowerSubchoiceConfirm = useCallback((choice: ClassPowerSubchoice) => {
    if (!pendingClassPowerForSubchoice) return;
    
    const powerId = pendingClassPowerForSubchoice.id;
    const choiceKey = `${powerId}-${pendingClassPowerInstance}`;
    
    // Salvar a escolha e adicionar o poder
    updateFormData({
      abilities: [...abilities, powerId],
      classPowerChoices: {
        ...classPowerChoices,
        [choiceKey]: choice,
      },
    } as any);
    
    // Fechar modal
    setClassPowerSubchoiceModalOpen(false);
    setPendingClassPowerForSubchoice(null);
    setPendingClassPowerInstance(0);
  }, [abilities, classPowerChoices, pendingClassPowerForSubchoice, pendingClassPowerInstance, updateFormData]);

  // Handler para adicionar uma instância de um poder (usado para poderes repetíveis)
  const handleAddAbility = useCallback((abilityId: string) => {
    // Se for Treinamento em Perícia, abre o modal
    if (isSkillTrainingPower(abilityId)) {
      handleAddSkillTraining(abilityId);
      return;
    }
    
    // Se for Transcender, abre o modal de poder paranormal
    if (isTranscenderPower(abilityId)) {
      handleAddTranscender(abilityId);
      return;
    }
    
    // Se for poder de classe que requer sub-escolha (Especialista em Arma, etc.)
    if (isClassPowerWithChoice(abilityId)) {
      handleAddClassPowerWithChoice(abilityId);
      return;
    }
    
    if (remainingChoices > 0) {
      updateFormData({
        abilities: [...abilities, abilityId]
      });
    }
  }, [abilities, remainingChoices, updateFormData, isSkillTrainingPower, handleAddSkillTraining, isTranscenderPower, handleAddTranscender, isClassPowerWithChoice, handleAddClassPowerWithChoice]);
  
  // Handler para remover UMA instância de um poder (usado para poderes repetíveis)
  const handleRemoveOneInstance = useCallback((abilityId: string) => {
    // Se for Treinamento em Perícia, usa handler específico
    if (isSkillTrainingPower(abilityId)) {
      handleRemoveSkillTraining(abilityId);
      return;
    }
    
    // Se for Transcender, usa handler específico
    if (isTranscenderPower(abilityId)) {
      handleRemoveTranscender(abilityId);
      return;
    }
    
    // Encontrar a última ocorrência do poder
    const index = abilities.lastIndexOf(abilityId);
    if (index !== -1) {
      const newAbilities = [...abilities];
      newAbilities.splice(index, 1);
      
      // Se for poder com sub-escolha, remover também a escolha correspondente
      if (isClassPowerWithChoice(abilityId)) {
        // Encontrar a última instância (maior índice)
        const currentCount = getAbilityCount(abilityId);
        const choiceKey = `${abilityId}-${currentCount - 1}`;
        const newClassPowerChoices = { ...classPowerChoices };
        delete newClassPowerChoices[choiceKey];
        
        updateFormData({
          abilities: newAbilities,
          classPowerChoices: newClassPowerChoices,
        } as any);
      } else {
        updateFormData({ abilities: newAbilities });
      }
    }
  }, [abilities, updateFormData, isSkillTrainingPower, handleRemoveSkillTraining, isTranscenderPower, handleRemoveTranscender, isClassPowerWithChoice, getAbilityCount, classPowerChoices]);

  // Handler antigo para poderes não-repetíveis (toggle simples)
  // IMPORTANTE: Valida pré-requisitos antes de permitir adição
  const handleToggleAbility = useCallback((abilityId: string) => {
    const ability = choosableAbilities.find(a => a.id === abilityId);
    const isRepeatable = ability?.isRepeatable ?? false;
    const count = getAbilityCount(abilityId);
    
    // Se estiver removendo, permite sempre
    if (count > 0 && !isRepeatable) {
      handleRemoveOneInstance(abilityId);
      return;
    }
    
    // Para adição, verificar pré-requisitos primeiro
    if (!canSelectPower(abilityId)) {
      const missing = getMissingPrerequisites(abilityId);
      // Bloqueia e informa o usuário
      console.warn(`[StepAbilities] Bloqueado: ${ability?.name || abilityId} - Faltam: ${missing.join(', ')}`);
      return;
    }
    
    if (isRepeatable) {
      // Para repetíveis, adiciona nova instância se houver espaço
      if (remainingChoices > 0) {
        handleAddAbility(abilityId);
      }
    } else {
      // Para não-repetíveis, adiciona se houver espaço
      if (remainingChoices > 0) {
        handleAddAbility(abilityId);
      }
    }
  }, [choosableAbilities, getAbilityCount, remainingChoices, handleAddAbility, handleRemoveOneInstance, canSelectPower, getMissingPrerequisites]);
  
  // Handler para escolha de Versatilidade
  const handleVersatilityChange = useCallback((choice: VersatilityChoice) => {
    setVersatilityChoice(choice);
    // Atualiza o formData com a escolha (para persistir no draft e validação)
    updateFormData({
      versatilityChoice: choice,
      // Se escolheu habilidade de trilha diferente, adiciona ao trackAbilities
      secondaryTrackAbility: choice.type === 'track_ability' && choice.abilityName 
        ? choice.abilityName 
        : null,
    } as any);
  }, [updateFormData]);

  if (!characterClass) {
    return (
      <div className="text-center py-12">
        <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">
          Selecione uma classe primeiro
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          As habilidades dependem da classe escolhida.
        </p>
      </div>
    );
  }

  // Conteúdo educativo do livro
  const rulebookContent = getRulebookContent('abilities');

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <ClassIcon className="w-6 h-6 text-primary" />
            <h2 className="font-display text-2xl tracking-wider text-foreground">
              HABILIDADES DE {characterClass.toUpperCase()}
            </h2>
          </div>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Com NEX {nex}%, seu agente possui habilidades específicas da classe. 
            Habilidades fundamentais são automáticas; as demais são escolhidas.
          </p>
        </div>

        {/* Painel educativo do livro de regras */}
        {rulebookContent && (
          <RuleBookTip section={rulebookContent} defaultExpanded={false} />
        )}

        {/* Seção de Versatilidade (NEX 50%+) */}
        {showVersatility && classTrack && (
          <VersatilitySection
            classId={characterClass}
            currentTrackId={classTrack}
            onSelect={handleVersatilityChange}
            selected={versatilityChoice}
            compact
          />
        )}

        {/* Choice Counter com validação visual */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-lg border bg-gradient-to-r space-y-3",
            classColor
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sword className="w-5 h-5 text-primary" />
              <span className="font-medium">Poderes de Classe</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {totalAbilitiesSelected} / {maxChoices} escolhidos
              </span>
              <Badge variant={remainingChoices > 0 ? "secondary" : "default"}>
                {remainingChoices > 0 ? `${remainingChoices} restante${remainingChoices > 1 ? 's' : ''}` : 'Completo'}
              </Badge>
            </div>
          </div>
          
          {/* Marcos de NEX onde se ganha poderes */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-muted-foreground mr-2">Ganhos em:</span>
            {[15, 30, 45, 60, 75, 90].map((nexMarker) => {
              const isReached = nex >= nexMarker;
              const isCurrent = nex === nexMarker;
              // Contar quantos poderes deveria ter até este NEX
              const powersAtThisNex = [15, 30, 45, 60, 75, 90].filter(n => n <= nexMarker).length;
              const hasPowerAtThisNex = powersAtThisNex <= totalAbilitiesSelected;
              
              return (
                <Badge
                  key={nexMarker}
                  variant="outline"
                  className={cn(
                    'text-xs px-2 py-0.5 transition-all',
                    isReached 
                      ? hasPowerAtThisNex
                        ? 'bg-success/20 text-success border-success/30'
                        : 'bg-warning/20 text-warning border-warning/30'
                      : 'text-muted-foreground opacity-50',
                    isCurrent && 'ring-1 ring-offset-1 ring-offset-background ring-primary'
                  )}
                >
                  {isReached && hasPowerAtThisNex ? (
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                  ) : isReached ? (
                    <Star className="w-3 h-3 mr-1" />
                  ) : (
                    <Lock className="w-3 h-3 mr-1 opacity-50" />
                  )}
                  {nexMarker}%
                </Badge>
              );
            })}
          </div>
        </motion.div>

        {/* Layout responsivo: 1 coluna em telas menores, 2 em lg+ */}
        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Core Abilities */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="font-display tracking-wider">HABILIDADES FUNDAMENTAIS</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Concedidas automaticamente pela classe e NEX
            </p>
            
            <ScrollArea className="h-[450px] pr-4">
              <div className="space-y-3">
                <AnimatePresence>
                  {coreAbilities.map((ability, index) => {
                    // Verificar se a habilidade evolui com NEX
                    const evolution = EVOLVING_ABILITIES[ability.id];
                    const hasEvolution = !!evolution;
                    
                    // Calcular evolução atual e próxima
                    let currentEvolutionIndex = 0;
                    let nextEvolutionNex: number | null = null;
                    
                    if (hasEvolution) {
                      for (let i = evolution.nexMarkers.length - 1; i >= 0; i--) {
                        if (nex >= evolution.nexMarkers[i]) {
                          currentEvolutionIndex = i;
                          break;
                        }
                      }
                      // Encontrar próximo marco
                      const nextIndex = currentEvolutionIndex + 1;
                      if (nextIndex < evolution.nexMarkers.length) {
                        nextEvolutionNex = evolution.nexMarkers[nextIndex];
                      }
                    }
                    
                    return (
                      <motion.div
                        key={ability.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "p-4 rounded-lg border bg-gradient-to-r cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all",
                          classColor
                        )}
                        onClick={() => openAbilityDetail(ability)}
                      >
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium text-foreground">{ability.name}</h4>
                                <Badge variant="outline" className="text-xs">
                                  NEX {ability.minNex}%
                                </Badge>
                                {/* Indicador de habilidade que evolui */}
                                {hasEvolution && (
                                  <Badge variant="secondary" className="text-xs gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    Evolui
                                  </Badge>
                                )}
                              </div>
                              <Eye className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors flex-shrink-0" />
                            </div>
                            
                            {/* Descrição base */}
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {ability.description}
                            </p>
                            
                            {/* Painel de evolução atual (para habilidades que evoluem) */}
                            {hasEvolution && (
                              <div className="mt-3 p-2 rounded bg-background/50 border border-border/50">
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-muted-foreground">Nível atual:</span>
                                  <Badge variant="default" className="text-xs">
                                    {evolution.evolutions[currentEvolutionIndex]}
                                  </Badge>
                                </div>
                                {nextEvolutionNex && (
                                  <div className="flex items-center gap-2 text-xs mt-1">
                                    <span className="text-muted-foreground">Próxima evolução:</span>
                                    <span className="text-primary">
                                      NEX {nextEvolutionNex}% → {evolution.evolutions[currentEvolutionIndex + 1]}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                
                {coreAbilities.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma habilidade fundamental disponível
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Choosable Abilities */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="font-display tracking-wider">HABILIDADES OPCIONAIS</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Escolha {maxChoices} habilidade{maxChoices !== 1 ? 's' : ''} adicionai{maxChoices !== 1 ? 's' : ''}
            </p>
            
            <ScrollArea className="h-[450px] pr-4">
              <div className="space-y-3">
                <AnimatePresence>
                  {choosableAbilities.map((ability, index) => {
                    const count = getAbilityCount(ability.id);
                    const isSelected = count > 0;
                    const isRepeatable = ability.isRepeatable ?? false;
                    
                    // Verificar pré-requisitos
                    const meetsPrereqs = canSelectPower(ability.id);
                    const missingPrereqs = getMissingPrerequisites(ability.id);
                    const hasPrereqs = hasPowerPrerequisites(ability.id);
                    const prereqText = formatPrerequisitesText(ability.id);
                    
                    // Desabilitado se não atende pré-requisitos OU se não tem escolhas restantes
                    const isDisabledByPrereqs = !meetsPrereqs && !isSelected;
                    const isDisabledByChoices = !isSelected && remainingChoices === 0;
                    const isDisabled = isDisabledByPrereqs || isDisabledByChoices;
                    
                    // Verificar se é Transcender para mostrar aviso de SAN
                    const isTranscender = ability.id.includes('transcender');
                    
                    return (
                      <motion.div
                        key={ability.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "p-4 rounded-lg border transition-all",
                          isSelected 
                            ? cn("bg-gradient-to-r", classColor)
                            : isDisabledByPrereqs
                              ? "bg-destructive/5 border-destructive/20 opacity-60"
                              : "bg-card/50 hover:bg-card/80",
                          isDisabledByChoices && !isDisabledByPrereqs && !isRepeatable && "opacity-50"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Controle de seleção - diferente para repetíveis */}
                          {isRepeatable ? (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                disabled={count === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveOneInstance(ability.id);
                                }}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className={cn(
                                "w-6 text-center text-sm font-bold",
                                count > 0 ? "text-primary" : "text-muted-foreground"
                              )}>
                                {count}
                              </span>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                disabled={isDisabled}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddAbility(ability.id);
                                }}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : isDisabledByPrereqs ? (
                            // Ícone de bloqueio para pré-requisitos não atendidos
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="mt-0.5 p-1">
                                  <Ban className="w-4 h-4 text-destructive" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs">
                                <div className="space-y-1">
                                  <p className="font-medium text-destructive">Pré-requisitos não atendidos:</p>
                                  <ul className="text-xs space-y-0.5">
                                    {missingPrereqs.map((prereq, i) => (
                                      <li key={i} className="flex items-center gap-1">
                                        <span className="text-destructive">✗</span>
                                        {prereq}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Checkbox
                              checked={isSelected}
                              disabled={isDisabled}
                              className="mt-0.5 cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                              onCheckedChange={() => !isDisabled && handleToggleAbility(ability.id)}
                            />
                          )}
                          
                          {/* Área clicável para abrir modal */}
                          <div 
                            className="flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openAbilityDetail(ability)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={cn(
                                  "font-medium",
                                  isDisabledByPrereqs ? "text-muted-foreground" : "text-foreground"
                                )}>
                                  {ability.name}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  NEX {ability.minNex}%
                                </Badge>
                                {/* Badge de repetível */}
                                {isRepeatable && (
                                  <Badge variant="secondary" className="text-xs gap-1">
                                    <Repeat className="w-3 h-3" />
                                    Repetível
                                  </Badge>
                                )}
                                {/* Badge de pré-requisitos */}
                                {hasPrereqs && (
                                  <Badge 
                                    variant={meetsPrereqs ? "outline" : "destructive"}
                                    className={cn(
                                      "text-xs gap-1",
                                      meetsPrereqs && "border-success/50 text-success"
                                    )}
                                  >
                                    {meetsPrereqs ? (
                                      <>
                                        <CheckCircle2 className="w-3 h-3" />
                                        Pré-requisitos
                                      </>
                                    ) : (
                                      <>
                                        <Lock className="w-3 h-3" />
                                        Requisitos
                                      </>
                                    )}
                                  </Badge>
                                )}
                              </div>
                              <Eye className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors flex-shrink-0" />
                            </div>
                            <p className={cn(
                              "text-sm mt-1 line-clamp-2",
                              isDisabledByPrereqs ? "text-muted-foreground/70" : "text-muted-foreground"
                            )}>
                              {ability.description}
                            </p>
                            
                            {/* Mostrar pré-requisitos faltantes */}
                            {isDisabledByPrereqs && missingPrereqs.length > 0 && (
                              <div className="mt-2 p-2 bg-destructive/10 border border-destructive/30 rounded">
                                <div className="flex items-start gap-2">
                                  <Lock className="w-3 h-3 text-destructive flex-shrink-0 mt-0.5" />
                                  <div className="space-y-1">
                                    <span className="text-xs font-medium text-destructive">
                                      Faltam:
                                    </span>
                                    <ul className="text-xs text-destructive/80 space-y-0.5">
                                      {missingPrereqs.map((prereq, i) => (
                                        <li key={i}>• {prereq}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Aviso de custo de SAN para Transcender */}
                            {isTranscender && !isDisabledByPrereqs && (
                              <div className="mt-2 p-2 bg-warning/10 border border-warning/30 rounded flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0" />
                                <span className="text-xs text-warning">
                                  Custo: -{sanityGainPerNex} SAN máxima por escolha
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                
                {choosableAbilities.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma habilidade opcional disponível para NEX {nex}%</p>
                    <p className="text-xs mt-1">Aumente o NEX para desbloquear mais opções</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Summary */}
        {(coreAbilities.length > 0 || totalAbilitiesSelected > 0) && (
          <>
            <Separator />
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <h4 className="font-display text-sm tracking-wider mb-3 text-muted-foreground">
                RESUMO DE HABILIDADES
              </h4>
              <div className="flex flex-wrap gap-2">
                {coreAbilities.map(ability => (
                  <Badge key={ability.id} className="bg-primary/20 text-primary">
                    {ability.name}
                  </Badge>
                ))}
                {/* Agrupar poderes escolhidos por ID e mostrar contador para repetíveis */}
                {uniqueSelectedIds.map(abilityId => {
                  const ability = choosableAbilities.find(a => a.id === abilityId);
                  const count = getAbilityCount(abilityId);
                  return ability ? (
                    <Badge key={ability.id} variant="secondary" className="gap-1">
                      {ability.name}
                      {count > 1 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-background/50 text-xs font-bold">
                          ×{count}
                        </span>
                      )}
                    </Badge>
                  ) : null;
                })}
              </div>
              
              {/* Aviso de perda de Sanidade por Transcender */}
              {transcenderCount > 0 && (
                <div className="mt-3 p-2 rounded bg-warning/10 border border-warning/30 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
                  <span className="text-xs text-warning">
                    Transcender ×{transcenderCount}: -{transcenderCount * sanityGainPerNex} SAN máxima
                  </span>
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Modal de detalhes da habilidade */}
        {/* IMPORTANTE: canSelect considera pré-requisitos para bloquear seleção */}
        <AbilityDetailModal
          ability={selectedAbilityForDetail}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedAbilityForDetail(null);
          }}
          nex={nex}
          isSelected={selectedAbilityForDetail ? getAbilityCount(selectedAbilityForDetail.id) > 0 : false}
          isCore={selectedAbilityForDetail ? coreAbilities.some(ca => ca.id === selectedAbilityForDetail.id) : false}
          onToggle={selectedAbilityForDetail ? () => handleToggleAbility(selectedAbilityForDetail.id) : undefined}
          canSelect={
            // Já selecionado = pode desmarcar
            (selectedAbilityForDetail ? getAbilityCount(selectedAbilityForDetail.id) > 0 : false) ||
            // Ou: há escolhas E cumpre pré-requisitos
            (remainingChoices > 0 && (selectedAbilityForDetail ? canSelectPower(selectedAbilityForDetail.id) : false))
          }
          missingPrerequisites={selectedAbilityForDetail ? getMissingPrerequisites(selectedAbilityForDetail.id) : []}
        />
        
        {/* Modal de seleção de perícias para Treinamento em Perícia */}
        {pendingSkillTraining && (
          <SkillTrainingSelectModal
            isOpen={skillTrainingModalOpen}
            onClose={() => {
              setSkillTrainingModalOpen(false);
              setPendingSkillTraining(null);
            }}
            onConfirm={handleSkillTrainingConfirm}
            powerId={pendingSkillTraining.powerId}
            instanceIndex={pendingSkillTraining.instanceIndex}
            nex={nex}
            currentSkills={currentSkillLevels}
            existingChoices={getSkillTrainingForInstance(
              pendingSkillTraining.powerId, 
              pendingSkillTraining.instanceIndex
            ) as SkillTrainingChoice[]}
            alreadyTrainedByPower={
              // Coleta todas as perícias já escolhidas em instâncias ANTERIORES deste poder
              Object.entries(skillTrainingChoices)
                .filter(([key]) => {
                  // Filtra apenas instâncias do mesmo powerId, mas com índice menor
                  const [powerId, indexStr] = key.split('-');
                  const index = parseInt(indexStr, 10);
                  return powerId === pendingSkillTraining.powerId && index < pendingSkillTraining.instanceIndex;
                })
                .flatMap(([, choices]) => (choices as SkillTrainingChoice[]).map(c => c.skillId))
            }
          />
        )}
        
        {/* Modal de seleção de poder paranormal para Transcender */}
        <ParanormalPowerSelectModal
          open={transcenderModalOpen}
          onOpenChange={(open) => {
            setTranscenderModalOpen(open);
            if (!open) {
              setPendingTranscender(null);
            }
          }}
          onSelectPower={handleTranscenderPowerSelect}
          characterPowers={characterParanormalPowers}
          elementalAffinity={null}
          affinityActive={false}
        />
        
        {/* Modal de sub-escolhas para poderes paranormais que requerem escolha adicional */}
        {pendingPowerForSubchoice && (
          <PowerSubchoiceModal
            open={subchoiceModalOpen}
            onClose={() => {
              setSubchoiceModalOpen(false);
              setPendingPowerForSubchoice(null);
              // Reabre o modal de Transcender se o usuário cancelar
              if (pendingTranscender) {
                setTranscenderModalOpen(true);
              }
            }}
            onConfirm={handleSubchoiceConfirm}
            power={pendingPowerForSubchoice}
            hasAffinity={false}
          />
        )}
        
        {/* Modal de sub-escolhas para poderes de CLASSE (Especialista em Arma, etc.) */}
        {pendingClassPowerForSubchoice && (
          <ClassPowerSubchoiceModal
            open={classPowerSubchoiceModalOpen}
            onClose={() => {
              setClassPowerSubchoiceModalOpen(false);
              setPendingClassPowerForSubchoice(null);
              setPendingClassPowerInstance(0);
            }}
            power={pendingClassPowerForSubchoice}
            onConfirm={handleClassPowerSubchoiceConfirm}
            instanceIndex={pendingClassPowerInstance}
            existingWeaponGroups={existingWeaponGroups}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

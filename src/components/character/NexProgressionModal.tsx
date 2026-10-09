import { ConhecimentoSymbol, EnergiaSymbol, MorteSymbol, SangueSymbol } from '@/components/icons/element-symbols';
/**
 * Modal de Progressão de NEX
 * Permite subir de nível, recalcular stats, desbloquear habilidades/rituais,
 * escolher poderes paranormais via Transcender e selecionar Afinidade Elemental no NEX 50%
 * 
 * SISTEMA TRANSCENDER ATUALIZADO:
 * - Verifica elegibilidade por NEX/trilha antes de permitir uso
 * - Impede uso múltiplo na mesma oportunidade de escolha
 * - Aplica custo de Sanidade atomicamente
 * - Rastreia escolhas e sub-escolhas obrigatórias
 * - Valida sub-escolhas antes de confirmar (skills, rituais, elementos)
 * 
 * ATUALIZADO: Refatorado para usar MobileModal reutilizável
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, Sparkles, Heart, Zap, Brain, ChevronRight, Lock, Unlock, BookOpen, Route, Check, Loader2, Star, AlertTriangle, Info } from '@/components/icons/ordem-icons';
import { 
  CLASSES, 
  getPatentByNex, 
  calculateDerivedStats, 
  getTrackById,
  getAvailableTrackAbilities,
} from '@/lib/character-data';
import { getMaxRitualCircle, getRitualCount } from '@/lib/rituals/legacy-exports';
import {
  ParanormalPower,
  ParanormalElement,
  ELEMENT_LABELS,
  ELEMENT_COLORS,
  ELEMENT_BG_COLORS,
  AFFINITY_DESCRIPTIONS,
  getPowerById,
} from '@/lib/paranormal-powers';
import {
  canUseTranscender,
  calculateTranscenderSanityCost,
  initTranscenderChoice,
  resolveTranscenderChoice,
  validatePowerSubchoice,
  getTranscenderStatus,
  isValidPowerChoiceNex,
  ChoiceOpportunity,
} from '@/lib/transcender-system';
import { supabase } from '@/integrations/supabase/client';
import { validateBeforeSave, getMaxParanormalPowers } from '@/lib/character-audit-engine';
import { ParanormalPowerSelectModal } from './ParanormalPowerSelectModal';
import { PowerSubchoiceModal } from './PowerSubchoiceModal';
import { NonOccultistRitualModal, RitualSource } from './NonOccultistRitualModal';
import { AttributeIncreaseSection, isAttributeIncreaseNex } from './AttributeIncreaseSection';
import { VersatilitySection, isVersatilityChoiceComplete, VersatilityChoice } from './VersatilitySection';
import { TrainingGradeSection, isTrainingGradeComplete, getTrainingGradeSkillCount } from './TrainingGradeSection';
import { ClassPowerSelectionSection, isClassPowerSelectionComplete } from './ClassPowerSelectionSection';
import { ClassPowerSubchoice } from './ClassPowerSubchoiceModal';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import confetti from 'canvas-confetti';
import { VALID_NEX_VALUES, isValidNexValue } from '@/lib/constants/game-ids';
import { AttributeKey } from '@/lib/constants/attributes';

// NEX válidos - usando valores centralizados de game-ids.ts
const NEX_VALUES: number[] = [...VALID_NEX_VALUES];

// Ícones por elemento para seleção de afinidade
const AFFINITY_ICONS: Record<ParanormalElement, React.ComponentType<{ className?: string }>> = {
  sangue: SangueSymbol,
  morte: MorteSymbol,
  conhecimento: ConhecimentoSymbol,
  energia: EnergiaSymbol,
};

/**
 * Calcula o ganho de sanidade para um específico aumento de NEX
 */
function getSanityGainForNex(characterClass: string, currentNex: number, nextNex: number): number {
  const currentStats = calculateDerivedStats(characterClass, 1, 1, currentNex);
  const nextStats = calculateDerivedStats(characterClass, 1, 1, nextNex);
  return nextStats.san - currentStats.san;
}

interface NexProgressionModalProps {
  open: boolean;
  onClose: () => void;
  character: {
    id: string;
    name: string;
    class: string;
    class_track: string | null;
    nex: number;
    vigor: number;
    presence: number;
    agility: number;
    strength: number;
    intellect: number;
    origin: string;
    hp_max: number;
    pe_max: number;
    san_max: number;
    rituals: string[];
    abilities: string[];
    skills: Record<string, number>; // Mapa de perícias para Grau de Treinamento
    paranormal_powers?: ParanormalPower[];
    elemental_affinity?: ParanormalElement | null;
    affinity_active?: boolean;
  };
  onLevelUp: (newNex: number, newStats: {
    hp_max: number;
    pe_max: number;
    san_max: number;
    patent: string;
    newAbilities: string[];
    elemental_affinity?: ParanormalElement | null;
    affinity_active?: boolean;
    paranormal_powers?: ParanormalPower[];
    attributeIncrease?: string; // Atributo aumentado (agility, strength, etc)
    versatilityChoice?: VersatilityChoice; // Escolha da Versatilidade (NEX 50%)
    skillUpgrades?: string[]; // Perícias atualizadas pelo Grau de Treinamento (NEX 35%, 70%)
    classPowerChoices?: Record<string, ClassPowerSubchoice>; // Sub-escolhas de poderes de classe
  }) => Promise<void>;
}

export function NexProgressionModal({ 
  open, 
  onClose, 
  character, 
  onLevelUp 
}: NexProgressionModalProps) {
  const { user } = useAuth();
  const [selectedNex, setSelectedNex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Estado para seleção de Afinidade Elemental
  const [selectedAffinity, setSelectedAffinity] = useState<ParanormalElement | null>(null);
  
  // Estado para modal de seleção de poderes paranormais
  const [powerSelectOpen, setPowerSelectOpen] = useState(false);
  const [pendingPowers, setPendingPowers] = useState<ParanormalPower[]>(
    character.paranormal_powers || []
  );
  
  // Estado para rastrear se Transcender foi usado nesta progressão
  const [usedTranscender, setUsedTranscender] = useState(false);
  
  // Estado para controle de Transcender
  const [transcenderEligible, setTranscenderEligible] = useState(false);
  const [transcenderChoiceId, setTranscenderChoiceId] = useState<string | null>(null);
  const [transcenderOpportunities, setTranscenderOpportunities] = useState<ChoiceOpportunity[]>([]);
  const [checkingTranscender, setCheckingTranscender] = useState(false);
  
  // Estado para poder selecionado e sub-escolhas
  const [selectedPower, setSelectedPower] = useState<ParanormalPower | null>(null);
  const [subchoiceModalOpen, setSubchoiceModalOpen] = useState(false);
  const [pendingSubchoices, setPendingSubchoices] = useState<{
    skills?: string[];
    ritualId?: string;
    resistElement?: ParanormalElement;
  } | null>(null);
  
  // Estado para modal de seleção de ritual (poder "Aprender Ritual")
  const [ritualSelectOpen, setRitualSelectOpen] = useState(false);
  const [pendingRituals, setPendingRituals] = useState<string[]>([]);
  const [ritualForSubchoice, setRitualForSubchoice] = useState<string | null>(null);
  
  // Estado para seleção de aumento de atributo
  const [selectedAttributeIncrease, setSelectedAttributeIncrease] = useState<string | null>(null);
  
  // Estado para seleção de Versatilidade (NEX 50%)
  const [versatilityChoice, setVersatilityChoice] = useState<VersatilityChoice | null>(null);
  
  // Estado para seleção de Grau de Treinamento (NEX 35%, 70% - Especialista)
  const [selectedTrainingSkills, setSelectedTrainingSkills] = useState<string[]>([]);
  
  // Estado para seleção de Poderes de Classe
  const [selectedClassPowers, setSelectedClassPowers] = useState<string[]>([]);
  const [classPowerChoices, setClassPowerChoices] = useState<Record<string, ClassPowerSubchoice>>({});
  
  // Verificar se está subindo para NEX 50% (escolhe afinidade)
  const currentNexIndex = NEX_VALUES.indexOf(character.nex);
  const nextNex = currentNexIndex < NEX_VALUES.length - 1 ? NEX_VALUES[currentNexIndex + 1] : null;
  const isReachingNex50 = nextNex === 50 && !character.elemental_affinity;
  
  // Verificar se este NEX oferece aumento de atributo (20%, 50%, 80%, 95%)
  const showAttributeIncrease = nextNex ? isAttributeIncreaseNex(nextNex) : false;
  
  // Verificar se este NEX oferece Versatilidade (chegando no NEX 50%)
  const showVersatility = nextNex === 50;
  
  // Verificar se este NEX oferece Grau de Treinamento (NEX 35%, 70% - TODAS as classes)
  const showTrainingGrade = (nextNex === 35 || nextNex === 70);
  
  // Dados do personagem para validação de pré-requisitos de poderes de classe
  const characterDataForPrerequisites = useMemo(() => ({
    nex: nextNex || character.nex,
    attributes: {
      strength: character.strength,
      agility: character.agility,
      vigor: character.vigor,
      intellect: character.intellect,
      presence: character.presence,
    },
    trainedSkills: Object.keys(character.skills).filter(s => character.skills[s] >= 1),
    skillLevels: character.skills,
    powers: character.abilities || [],
    proficiencies: [],
  }), [character, nextNex]);
  
  // Verificar elegibilidade de Transcender quando modal abre
  // API corrigida: funciona para TODAS as classes, deriva marcos da tabela oficial
  useEffect(() => {
    async function checkTranscender() {
      if (!open || !nextNex || !user) return;
      
      setCheckingTranscender(true);
      try {
        // Verificar status geral de Transcender (nova API simplificada)
        const status = await getTranscenderStatus(
          character.id,
          nextNex
        );
        setTranscenderOpportunities(status.opportunities);
        
        // Verificar se pode usar neste NEX específico (nova API simplificada)
        const eligibility = await canUseTranscender(
          character.id,
          user.id,
          nextNex
        );
        
        setTranscenderEligible(eligibility.eligible);
        if (eligibility.existingChoiceId) {
          setTranscenderChoiceId(eligibility.existingChoiceId);
        }
      } catch (error) {
        console.error('Erro ao verificar Transcender:', error);
      } finally {
        setCheckingTranscender(false);
      }
    }
    
    checkTranscender();
  }, [open, nextNex, character.id, user]);
  
  // Verificar se terá habilidade Transcender na trilha
  const hasTranscender = useMemo(() => {
    const abilities = character.abilities || [];
    return abilities.some(a => 
      typeof a === 'string' 
        ? a.toLowerCase().includes('transcender')
        : (a as any)?.name?.toLowerCase().includes('transcender')
    );
  }, [character.abilities]);
  
  // Calcula a sanidade que seria ganha neste NEX
  const sanityGainThisNex = useMemo(() => {
    if (!nextNex) return 0;
    return getSanityGainForNex(character.class, character.nex, nextNex);
  }, [character.class, character.nex, nextNex]);

  // Calcula stats para NEX atual e próximo
  const currentStats = useMemo(() => {
    return calculateDerivedStats(
      character.class,
      character.vigor,
      character.presence,
      character.nex,
      character.origin,
      character.abilities as string[]
    );
  }, [character]);

  const nextStats = useMemo(() => {
    if (!nextNex) return null;
    return calculateDerivedStats(
      character.class,
      character.vigor,
      character.presence,
      nextNex,
      character.origin,
      character.abilities as string[]
    );
  }, [character, nextNex]);

  // Habilidades da trilha atual vs próximo NEX
  const track = character.class_track ? getTrackById(character.class_track) : null;
  
  const currentTrackAbilities = useMemo(() => {
    if (!track) return [];
    return getAvailableTrackAbilities(track.id, character.nex);
  }, [track, character.nex]);

  const nextTrackAbilities = useMemo(() => {
    if (!track || !nextNex) return [];
    return getAvailableTrackAbilities(track.id, nextNex);
  }, [track, nextNex]);

  const newTrackAbilities = nextTrackAbilities.filter(
    a => !currentTrackAbilities.some(c => c.id === a.id)
  );
  
  // Verifica se alguma nova habilidade é Transcender
  const newTranscenderAbility = newTrackAbilities.find(a => 
    a.name.toLowerCase().includes('transcender')
  );

  // Rituais disponíveis (para Ocultistas)
  const isOcultist = character.class === 'Ocultista';
  const ocultistClass = CLASSES.find(c => c.id === 'Ocultista') as any;
  const ritualsPerNex = ocultistClass?.ritualsPerNex || {};
  
  const currentRitualInfo = ritualsPerNex[character.nex] || { count: 0, maxCircle: 1 };
  const nextRitualInfo = nextNex ? (ritualsPerNex[nextNex] || { count: 0, maxCircle: 1 }) : null;
  
  const newRitualSlots = nextRitualInfo ? nextRitualInfo.count - currentRitualInfo.count : 0;
  const newMaxCircle = nextRitualInfo && nextRitualInfo.maxCircle > currentRitualInfo.maxCircle;

  // Patent
  const currentPatent = getPatentByNex(character.nex);
  const nextPatent = nextNex ? getPatentByNex(nextNex) : null;
  const patentChanged = nextPatent && nextPatent !== currentPatent;

  // Handler para abrir modal de seleção de poderes via Transcender
  const handleOpenTranscender = async () => {
    if (!user || !nextNex) return;
    
    // Iniciar escolha no banco
    const result = await initTranscenderChoice(character.id, user.id, nextNex);
    if (!result.success) {
      toast.error('Erro ao iniciar Transcender', { description: result.error });
      return;
    }
    
    setTranscenderChoiceId(result.choiceId || null);
    setPowerSelectOpen(true);
  };

  // Handler para selecionar poder paranormal
  const handleSelectPower = (power: ParanormalPower) => {
    setPowerSelectOpen(false);
    
    // Verificar se o poder requer sub-escolha
    const validation = validatePowerSubchoice(power);
    
    if (validation.requiresChoice) {
      setSelectedPower(power);
      
      // Se for escolha de ritual, abre modal de rituais
      if (validation.choiceType === 'ritual') {
        setRitualSelectOpen(true);
      } else {
        setSubchoiceModalOpen(true);
      }
    } else {
      // Poder não requer escolha, adiciona diretamente
      finalizePowerSelection(power);
    }
  };
  
  // Handler para confirmar sub-escolha
  const handleSubchoiceConfirm = (choices: {
    skills?: string[];
    ritualId?: string;
    resistElement?: ParanormalElement;
  }) => {
    setSubchoiceModalOpen(false);
    
    if (selectedPower) {
      setPendingSubchoices(choices);
      finalizePowerSelection(selectedPower, choices);
    }
  };
  
  // Handler para selecionar ritual (para sub-escolha ou poder "Aprender Ritual")
  const handleRitualSelectForSubchoice = (ritualId: string) => {
    setRitualSelectOpen(false);
    
    if (selectedPower) {
      const choices = { ritualId };
      setPendingSubchoices(choices);
      finalizePowerSelection(selectedPower, choices);
    }
  };
  
  // Finaliza a seleção de poder
  const finalizePowerSelection = async (
    power: ParanormalPower,
    subchoices?: {
      skills?: string[];
      ritualId?: string;
      resistElement?: ParanormalElement;
    }
  ) => {
    // Adiciona o poder à lista pendente
    setPendingPowers(prev => [...prev, power]);
    setUsedTranscender(true);
    
    // Se o poder é "Aprender Ritual" e não tem sub-escolha ainda, abre modal
    if (power.id === 'aprender-ritual' && !subchoices?.ritualId) {
      setSelectedPower(power);
      setRitualSelectOpen(true);
      return;
    }
    
    // Limpa estado
    setSelectedPower(null);
    setPendingSubchoices(null);
    
    toast.success('Poder Paranormal selecionado', {
      description: `${power.name} será adicionado ao subir de NEX.`,
    });
  };
  
  // Handler para selecionar ritual (fora do Transcender)
  const handleRitualSelect = (ritualId: string) => {
    setPendingRituals(prev => [...prev, ritualId]);
    setRitualSelectOpen(false);
  };

  const handleLevelUp = async () => {
    if (!nextNex || !nextStats || !user) return;
    
    // Validação: se está chegando no NEX 50%, precisa escolher afinidade
    if (isReachingNex50 && !selectedAffinity) {
      toast.error('Escolha obrigatória', {
        description: 'Você precisa escolher uma Afinidade Elemental para continuar.',
      });
      return;
    }
    
    // Validação: se é NEX de aumento de atributo, precisa escolher
    if (showAttributeIncrease && !selectedAttributeIncrease) {
      toast.error('Escolha obrigatória', {
        description: 'Você precisa escolher um atributo para aumentar.',
      });
      return;
    }
    
    // Validação: se é NEX 50%, precisa fazer escolha de Versatilidade
    if (showVersatility && !isVersatilityChoiceComplete(versatilityChoice)) {
      toast.error('Escolha obrigatória', {
        description: 'Você precisa fazer a escolha da Versatilidade.',
      });
      return;
    }
    
    // Validação: se é NEX de Grau de Treinamento (todas as classes), precisa completar seleção
    if (showTrainingGrade && !isTrainingGradeComplete(selectedTrainingSkills, character.class, character.intellect)) {
      const required = getTrainingGradeSkillCount(character.class, character.intellect);
      toast.error('Escolha obrigatória', {
        description: `Você precisa selecionar ${required} perícias para o Grau de Treinamento.`,
      });
      return;
    }
    
    // Validação: se há escolhas de poder de classe disponíveis, precisa completar (exceto se usou Transcender)
    if (!usedTranscender && !isClassPowerSelectionComplete(selectedClassPowers, character.nex, nextNex, usedTranscender)) {
      toast.error('Escolha obrigatória', {
        description: 'Você precisa selecionar os poderes de classe disponíveis.',
      });
      return;
    }
    
    // Validação: atributo selecionado não pode estar no limite
    if (showAttributeIncrease && selectedAttributeIncrease) {
      const attrValue = character[selectedAttributeIncrease as keyof typeof character] as number;
      if (attrValue >= 5) {
        toast.error('Atributo no limite', {
          description: 'O atributo selecionado já está no valor máximo (5).',
        });
        return;
      }
    }
    
    // === VALIDAÇÃO PREVENTIVA ===
    // Verifica limite de poderes paranormais antes de permitir progressão
    const powerLimits = getMaxParanormalPowers(nextNex, character.origin);
    if (pendingPowers.length > powerLimits.total) {
      toast.error('Limite de poderes excedido', {
        description: `Máximo de ${powerLimits.total} poderes permitidos (${powerLimits.fromTranscender} Transcender + ${powerLimits.fromOrigin} origem). Remova ${pendingPowers.length - powerLimits.total} poder(es).`,
      });
      return;
    }
    
    // Valida dados antes de salvar
    const validation = validateBeforeSave({
      class: character.class,
      origin: character.origin,
      nex: nextNex,
      vigor: character.vigor,
      presence: character.presence,
      hp_max: nextStats.hp,
      pe_max: nextStats.pe,
      san_max: nextStats.san,
      paranormal_powers: pendingPowers.map(p => ({ id: p.id })),
    });
    
    if (!validation.valid) {
      toast.error('Erro de validação', {
        description: validation.errors.join(', '),
      });
      return;
    }
    
    // Mostra avisos (não bloqueantes)
    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        toast.warning('Aviso', { description: warning });
      });
    }
    
    setSaving(true);
    
    try {
      // Se usou Transcender, resolve a escolha no banco
      if (usedTranscender && transcenderChoiceId) {
        const newPower = pendingPowers.find(
          p => !character.paranormal_powers?.some(cp => cp.id === p.id)
        );
        
        if (newPower) {
          const sanityCost = calculateTranscenderSanityCost(
            character.class,
            character.nex,
            nextNex
          );
          
          const result = await resolveTranscenderChoice(
            transcenderChoiceId,
            newPower,
            sanityCost,
            pendingSubchoices || undefined
          );
          
          if (!result.success) {
            toast.error('Erro ao salvar Transcender', { description: result.error });
            setSaving(false);
            return;
          }
        }
      }
      
      // Se NÃO usou Transcender mas está em NEX de escolha de poder, registra como class_power
      // Isso garante que o slot seja marcado como usado para poder de classe
      if (!usedTranscender && isValidPowerChoiceNex(nextNex) && user) {
        try {
          await supabase.from('character_power_choices').insert({
            character_id: character.id,
            user_id: user.id,
            nex: nextNex,
            choice_type: 'class_power',
            status: 'resolved',
            resolution: { picked: 'class_power' },
            sanity_delta: 0,
            resolved_at: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Erro ao registrar escolha de poder de classe:', error);
          // Não bloqueia a progressão se falhar
        }
      }

      // Calcula novas habilidades (adiciona as da trilha)
      let newAbilities = [...newTrackAbilities.map(a => a.name)];
      
      // Adiciona poderes de classe selecionados
      if (selectedClassPowers.length > 0) {
        newAbilities.push(...selectedClassPowers);
      }
      
      // Se escolheu habilidade de trilha diferente via Versatilidade, adiciona
      if (showVersatility && versatilityChoice?.type === 'track_ability' && versatilityChoice.abilityName) {
        newAbilities.push(versatilityChoice.abilityName);
      }
      
      // Determina afinidade e se está ativa
      let newAffinity = character.elemental_affinity || null;
      let newAffinityActive = character.affinity_active || false;
      
      // Se está atingindo NEX 50 E selecionou afinidade (via card antigo)
      // OU se selecionou afinidade via fluxo de Transcender (NEX >= 50)
      if (selectedAffinity && !newAffinity) {
        newAffinity = selectedAffinity;
        // Se já está em NEX 50+ ou vai atingir, ativa a afinidade imediatamente
        if (nextNex && nextNex >= 50) {
          newAffinityActive = true;
        }
      }
      
      // Se já tem afinidade e está subindo de NEX (primeira vez após escolher),
      // ativa a afinidade
      if (newAffinity && !newAffinityActive && nextNex && nextNex > 50) {
        newAffinityActive = true;
      }
      
      // REGRA TRANSCENDER: Se usou Transcender, NÃO ganha sanidade deste NEX
      const finalSanMax = usedTranscender 
        ? character.san_max  // Mantém a sanidade atual
        : nextStats.san;     // Recebe a sanidade normal do novo NEX
      
      // ================== CONSOLIDAÇÃO DE PODERES PARANORMAIS ==================
      // Extrai poderes paranormais das sub-escolhas de Transcender (via ClassPowerSelectionSection)
      // e mescla com pendingPowers (via fluxo direto) para garantir que todos sejam salvos
      let consolidatedParanormalPowers = [...pendingPowers];
      
      // Verifica se há sub-escolhas de poder de classe que contêm poderes paranormais (Transcender)
      Object.values(classPowerChoices).forEach(choice => {
        // Sub-escolhas de Transcender têm choiceType: 'power' e chosenValues contém IDs de poderes paranormais
        if (choice.choiceType === 'power' && choice.chosenValues && choice.chosenValues.length > 0) {
          choice.chosenValues.forEach(paranormalPowerId => {
            // Verifica se o poder já não está na lista consolidada
            const alreadyExists = consolidatedParanormalPowers.some(p => p.id === paranormalPowerId);
            if (!alreadyExists) {
              // Busca o poder paranormal completo pelo ID
              const fullPower = getPowerById(paranormalPowerId);
              if (fullPower) {
                consolidatedParanormalPowers.push(fullPower);
                console.log(`[Transcender] Poder paranormal extraído de sub-escolha: ${fullPower.name}`);
              } else {
                console.warn(`[Transcender] Poder paranormal não encontrado: ${paranormalPowerId}`);
              }
            }
          });
        }
      });
      
      await onLevelUp(nextNex, {
        hp_max: nextStats.hp,
        pe_max: nextStats.pe,
        san_max: finalSanMax,
        patent: nextPatent || currentPatent,
        newAbilities,
        elemental_affinity: newAffinity,
        affinity_active: newAffinityActive,
        paranormal_powers: consolidatedParanormalPowers,
        attributeIncrease: showAttributeIncrease ? selectedAttributeIncrease || undefined : undefined,
        versatilityChoice: showVersatility ? versatilityChoice || undefined : undefined,
        skillUpgrades: showTrainingGrade && selectedTrainingSkills.length > 0 ? selectedTrainingSkills : undefined,
        classPowerChoices: Object.keys(classPowerChoices).length > 0 ? classPowerChoices : undefined,
      });

      // Efeito de celebração
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#a855f7', '#ec4899', '#6366f1', '#22c55e'],
      });

      onClose();
    } catch (error) {
      console.error('Erro ao subir de NEX:', error);
      toast.error('Erro ao subir de NEX');
    } finally {
      setSaving(false);
    }
  };

  // Modal de NEX máximo alcançado
  if (!nextNex) {
    return (
      <MobileModal open={open} onOpenChange={onClose}>
        <MobileModalContent size="sm">
          <MobileModalHeader>
            <MobileModalTitle className="font-display tracking-wider text-center">
              NEX MÁXIMO ALCANÇADO
            </MobileModalTitle>
          </MobileModalHeader>
          
          <MobileModalBody useScrollArea={false}>
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <p className="text-4xl font-display text-primary mb-2">{character.nex}%</p>
              <p className="text-muted-foreground">
                {character.name} alcançou o nível máximo de experiência!
              </p>
            </div>
          </MobileModalBody>
          
          <MobileModalFooter>
            <Button onClick={onClose} className="w-full">Fechar</Button>
          </MobileModalFooter>
        </MobileModalContent>
      </MobileModal>
    );
  }

  return (
    <>
      <MobileModal open={open} onOpenChange={onClose}>
        <MobileModalContent size="lg">
          <MobileModalHeader>
            <MobileModalTitle className="font-display tracking-wider text-center flex items-center justify-center gap-2">
              <ArrowUp className="w-5 h-5 text-primary" />
              PROGRESSÃO DE NEX
            </MobileModalTitle>
            <MobileModalDescription className="text-center">
              {character.name} está pronto para evoluir!
            </MobileModalDescription>
          </MobileModalHeader>

          <MobileModalBody>
            <div className="space-y-6">
              {/* Comparação de NEX */}
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">ATUAL</p>
                  <div className="w-24 h-24 rounded-lg bg-muted/50 border border-border flex flex-col items-center justify-center">
                    <span className="font-display text-3xl">{character.nex}%</span>
                    <span className="text-xs text-muted-foreground">{currentPatent}</span>
                  </div>
                </div>
                
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <ChevronRight className="w-8 h-8 text-primary" />
                </motion.div>
                
                <div className="text-center">
                  <p className="text-xs text-primary mb-1">NOVO</p>
                  <div className="w-24 h-24 rounded-lg bg-primary/20 border border-primary flex flex-col items-center justify-center">
                    <span className="font-display text-3xl text-primary">{nextNex}%</span>
                    <span className="text-xs text-primary/70">{nextPatent}</span>
                  </div>
                </div>
              </div>

              {/* Mudança de Patente */}
              {patentChanged && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-success/10 border border-success/30 rounded-lg text-center"
                >
                  <Badge variant="secondary" className="bg-success/20 text-success mb-2">
                    <Unlock className="w-3 h-3 mr-1" />
                    PROMOÇÃO!
                  </Badge>
                  <p className="text-success font-display text-lg">
                    {currentPatent} → {nextPatent}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Novos itens e recursos disponíveis!
                  </p>
                </motion.div>
              )}

              {/* Seleção de Afinidade Elemental (NEX 50%) */}
              {isReachingNex50 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-paranormal" />
                    <h4 className="font-display text-sm tracking-wider text-paranormal">
                      ESCOLHER AFINIDADE ELEMENTAL
                    </h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ao atingir NEX 50%, você desenvolve uma afinidade com um dos elementos paranormais.
                    Poderes desse elemento terão efeitos aprimorados.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {(['sangue', 'morte', 'conhecimento', 'energia'] as ParanormalElement[]).map((element) => {
                      const Icon = AFFINITY_ICONS[element];
                      const isSelected = selectedAffinity === element;
                      const colorClass = ELEMENT_COLORS[element];
                      const bgClass = ELEMENT_BG_COLORS[element];
                      
                      return (
                        <Card
                          key={element}
                          className={`
                            cursor-pointer transition-all duration-200
                            ${isSelected 
                              ? 'ring-2 ring-primary border-primary bg-primary/10' 
                              : 'hover:border-primary/50 hover:bg-muted/50'
                            }
                          `}
                          onClick={() => setSelectedAffinity(element)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded ${bgClass}`}>
                                  <Icon className={`h-4 w-4 ${colorClass}`} />
                                </div>
                                <CardTitle className="text-sm">{ELEMENT_LABELS[element]}</CardTitle>
                              </div>
                              {isSelected && (
                                <Check className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <CardDescription className="text-xs">
                              {AFFINITY_DESCRIPTIONS[element]}
                            </CardDescription>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  
                  {!selectedAffinity && (
                    <p className="text-xs text-warning text-center">
                      ⚠️ Você precisa escolher uma afinidade elemental para continuar
                    </p>
                  )}
                </motion.div>
              )}

              {/* Seção de Versatilidade (NEX 50%) */}
              {showVersatility && character.class_track && (
                <VersatilitySection
                  classId={character.class}
                  currentTrackId={character.class_track}
                  onSelect={setVersatilityChoice}
                  selected={versatilityChoice}
                  characterData={{
                    nex: nextNex || character.nex,
                    attributes: {
                      strength: character.strength,
                      agility: character.agility,
                      vigor: character.vigor,
                      intellect: character.intellect,
                      presence: character.presence,
                    },
                    trainedSkills: Object.keys(character.skills).filter(s => character.skills[s] >= 1),
                    skillLevels: character.skills,
                    powers: character.abilities || [],
                    proficiencies: [], // TODO: Adicionar se necessário
                  }}
                />
              )}
              
              {/* Seção de Grau de Treinamento (NEX 35%, 70% - Todas as classes) */}
              {showTrainingGrade && nextNex && (
                <TrainingGradeSection
                  characterClass={character.class}
                  characterIntellect={character.intellect}
                  currentNex={nextNex as 35 | 70}
                  skills={character.skills}
                  selectedSkills={selectedTrainingSkills}
                  onSelect={setSelectedTrainingSkills}
                />
              )}

              {/* Seção de Poderes de Classe */}
              {nextNex && !usedTranscender && (
                <ClassPowerSelectionSection
                  classId={character.class}
                  currentNex={character.nex}
                  targetNex={nextNex}
                  characterData={characterDataForPrerequisites}
                  existingAbilities={character.abilities || []}
                  selectedPowers={selectedClassPowers}
                  onPowersChange={setSelectedClassPowers}
                  classPowerChoices={classPowerChoices}
                  onClassPowerChoicesChange={setClassPowerChoices}
                  usedTranscender={usedTranscender}
                  characterParanormalPowers={pendingPowers}
                  elementalAffinity={character.elemental_affinity as ParanormalElement | null}
                  affinityActive={character.affinity_active || false}
                  onTranscenderUsed={() => setUsedTranscender(true)}
                  onPendingAffinityChange={(affinity) => {
                    // Quando afinidade é selecionada no fluxo de Transcender,
                    // atualiza o estado local para ser salvo na confirmação
                    if (affinity) {
                      setSelectedAffinity(affinity);
                    }
                  }}
                />
              )}

              {/* Stats Changes */}
              {nextStats && (
                <div className="space-y-2">
                  <h4 className="font-display text-sm tracking-wider text-muted-foreground">
                    AUMENTO DE STATS
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {/* HP */}
                    <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-center">
                      <Heart className="w-5 h-5 text-destructive mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">PV MÁX</p>
                      <p className="font-display text-lg">
                        {character.hp_max} → <span className="text-destructive">{nextStats.hp}</span>
                      </p>
                      <Badge className="text-xs font-bold bg-destructive text-destructive-foreground shadow-sm">
                        +{nextStats.hp - character.hp_max}
                      </Badge>
                    </div>
                    
                    {/* PE */}
                    <div className="p-3 bg-pe/10 border border-pe/30 rounded-lg text-center">
                      <Zap className="w-5 h-5 text-pe mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">PE MÁX</p>
                      <p className="font-display text-lg">
                        {character.pe_max} → <span className="text-pe">{nextStats.pe}</span>
                      </p>
                      <Badge className="text-xs font-bold bg-pe text-pe-foreground shadow-sm">
                        +{nextStats.pe - character.pe_max}
                      </Badge>
                    </div>
                    
                    {/* SAN - Mostra perda se Transcender foi usado */}
                    <div className={`p-3 rounded-lg text-center ${
                      usedTranscender 
                        ? 'bg-warning/10 border border-warning/30' 
                        : 'bg-san/10 border border-san/30'
                    }`}>
                      <Brain className={`w-5 h-5 mx-auto mb-1 ${usedTranscender ? 'text-warning' : 'text-san'}`} />
                      <p className="text-xs text-muted-foreground">SAN MÁX</p>
                      <p className="font-display text-lg">
                        {character.san_max} → <span className={usedTranscender ? 'text-warning' : 'text-san'}>
                          {usedTranscender ? character.san_max : nextStats.san}
                        </span>
                      </p>
                      {usedTranscender ? (
                        <Badge className="text-xs font-bold bg-warning text-warning-foreground shadow-sm">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          +0 (Transcender)
                        </Badge>
                      ) : (
                        <Badge className="text-xs font-bold bg-san text-san-foreground shadow-sm">
                          +{nextStats.san - character.san_max}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Seção de Aumento de Atributo (NEX 20%, 50%, 80%, 95%) */}
              {showAttributeIncrease && nextNex && (
                <AttributeIncreaseSection
                  currentAttributes={{
                    agility: character.agility,
                    strength: character.strength,
                    intellect: character.intellect,
                    presence: character.presence,
                    vigor: character.vigor,
                  }}
                  selectedAttribute={selectedAttributeIncrease as AttributeKey | null}
                  onSelect={(attr) => setSelectedAttributeIncrease(attr)}
                  targetNex={nextNex}
                />
              )}

              {/* Seção de Transcender */}
              {(newTranscenderAbility || transcenderEligible) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-paranormal" />
                    <h4 className="font-display text-sm tracking-wider text-paranormal">
                      TRANSCENDER
                    </h4>
                    {checkingTranscender && (
                      <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  
                  {usedTranscender ? (
                    <div className="p-4 bg-paranormal/10 border border-paranormal/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="w-4 h-4 text-paranormal" />
                        <span className="font-medium text-paranormal">Transcender utilizado</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Você escolheu um Poder Paranormal nesta progressão.
                        O ganho de Sanidade deste NEX foi sacrificado.
                      </p>
                    </div>
                  ) : transcenderEligible ? (
                    <div className="p-4 bg-muted/50 border border-border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-warning" />
                        <span className="text-xs font-medium text-warning">
                          Custo: você não receberá o aumento de Sanidade deste NEX (+{sanityGainThisNex} SAN)
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Use <strong>Transcender</strong> para trocar sua escolha de poder de classe 
                        por um Poder Paranormal à sua escolha.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full border-paranormal/50 hover:bg-paranormal/10"
                        onClick={handleOpenTranscender}
                        title="Você não receberá o aumento de Sanidade deste NEX"
                      >
                        <Sparkles className="w-4 h-4 mr-2 text-paranormal" />
                        Usar Transcender
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/30 border border-border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">Transcender indisponível</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Você já usou Transcender neste NEX ou não há oportunidade disponível.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Novas Habilidades da Trilha */}
              {newTrackAbilities.length > 0 && track && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4 text-primary" />
                    <h4 className="font-display text-sm tracking-wider text-primary">
                      NOVAS HABILIDADES DA TRILHA
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {newTrackAbilities.map((ability) => (
                      <div 
                        key={ability.id}
                        className="p-3 bg-primary/10 border border-primary/30 rounded-lg"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Unlock className="w-4 h-4 text-primary" />
                          <span className="font-medium text-primary">{ability.name}</span>
                          <Badge variant="outline" className="text-xs">NEX {ability.minNex}%</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{ability.description}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Seção de Poderes Paranormais Pendentes */}
              {pendingPowers.length > (character.paranormal_powers?.length || 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-paranormal" />
                    <h4 className="font-display text-sm tracking-wider text-paranormal">
                      NOVOS PODERES PARANORMAIS
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {pendingPowers
                      .filter(p => !character.paranormal_powers?.some(cp => cp.id === p.id))
                      .map((power) => (
                        <div
                          key={power.id}
                          className="p-3 bg-paranormal/10 border border-paranormal/30 rounded-lg"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Check className="w-4 h-4 text-paranormal" />
                            <span className="font-medium text-paranormal">{power.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {ELEMENT_LABELS[power.element]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{power.description}</p>
                        </div>
                      ))}
                  </div>
                </motion.div>
              )}

              {/* Novos Rituais (Ocultistas) */}
              {isOcultist && (newRitualSlots > 0 || newMaxCircle) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-paranormal" />
                    <h4 className="font-display text-sm tracking-wider text-paranormal">
                      PROGRESSÃO DE RITUAIS
                    </h4>
                  </div>
                  <div className="p-4 bg-paranormal/10 border border-paranormal/30 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      {newRitualSlots > 0 && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">RITUAIS CONHECIDOS</p>
                          <p className="font-display text-xl">
                            {currentRitualInfo.count} → <span className="text-paranormal">{nextRitualInfo?.count}</span>
                          </p>
                          <Badge variant="outline" className="text-xs text-paranormal border-paranormal/50">
                            +{newRitualSlots} novo{newRitualSlots > 1 ? 's' : ''}
                          </Badge>
                        </div>
                      )}
                      {newMaxCircle && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">CÍRCULO MÁXIMO</p>
                          <p className="font-display text-xl">
                            {currentRitualInfo.maxCircle}º → <span className="text-paranormal">{nextRitualInfo?.maxCircle}º</span>
                          </p>
                          <Badge variant="outline" className="text-xs text-paranormal border-paranormal/50">
                            <Unlock className="w-3 h-3 mr-1" />
                            Desbloqueado!
                          </Badge>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      Você poderá escolher novos rituais após subir de NEX.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </MobileModalBody>

          <MobileModalFooter>
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button 
              onClick={handleLevelUp} 
              disabled={saving || (isReachingNex50 && !selectedAffinity)}
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ArrowUp className="w-4 h-4 mr-2" />
              )}
              SUBIR PARA NEX {nextNex}%
            </Button>
          </MobileModalFooter>
        </MobileModalContent>
      </MobileModal>

      {/* Modal de Seleção de Poderes Paranormais */}
      <ParanormalPowerSelectModal
        open={powerSelectOpen}
        onOpenChange={setPowerSelectOpen}
        onSelectPower={handleSelectPower}
        characterPowers={pendingPowers}
        elementalAffinity={selectedAffinity || character.elemental_affinity}
        affinityActive={character.affinity_active}
      />
      
      {/* Modal de Sub-Escolha de Poder */}
      {selectedPower && (
        <PowerSubchoiceModal
          open={subchoiceModalOpen}
          onClose={() => {
            setSubchoiceModalOpen(false);
            setSelectedPower(null);
          }}
          power={selectedPower}
          hasAffinity={!!character.affinity_active}
          affinityElement={character.elemental_affinity || undefined}
          onConfirm={handleSubchoiceConfirm}
          onOpenRitualSelect={() => {
            setSubchoiceModalOpen(false);
            setRitualSelectOpen(true);
          }}
        />
      )}
      
      {/* Modal de Seleção de Ritual (para sub-escolha ou poder "Aprender Ritual") */}
      <NonOccultistRitualModal
        open={ritualSelectOpen}
        onClose={() => setRitualSelectOpen(false)}
        source="ritual-aprendido"
        currentRituals={[...character.rituals, ...pendingRituals]}
        onConfirm={(selectedRituals) => {
          if (selectedPower) {
            // Sub-escolha de ritual para poder
            if (selectedRituals.length > 0) {
              handleRitualSelectForSubchoice(selectedRituals[0]);
            }
          } else {
            // Seleção normal de ritual
            setPendingRituals(prev => [...prev, ...selectedRituals]);
          }
          setRitualSelectOpen(false);
        }}
      />
    </>
  );
}

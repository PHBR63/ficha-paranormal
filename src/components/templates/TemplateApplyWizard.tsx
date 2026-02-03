/**
 * Wizard de Aplicação Interativa de Template (v2 - Híbrido Inteligente)
 * Steps dinâmicos: mostra apenas steps que precisam de ajuste/escolha
 * NEX ajustável com recálculo de limites em tempo real
 * Validações oficiais v1.3
 * 
 * @module components/templates/TemplateApplyWizard
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  Package,
  Minus,
  Plus,
  AlertTriangle,
  Info,
  User,
  Gauge,
  Swords,
  BookOpen,
  Wand2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CharacterTemplate, TemplateWithAuthor, CharacterTemplateData } from '@/types/templates';
import type { CharacterFormData } from '@/pages/CharacterCreate';
import { ORIGINS, CLASSES, getExtraSkillsByNex, getOcultistRituals, getExtraAttributePoints } from '@/lib/character-data';
import { getMaxAttributeByNex, getClassSkillRules } from '@/lib/character-builder-engine';
import { ALL_RITUALS } from '@/lib/rituals/legacy-exports';

// ========================================
// Tipos Internos
// ========================================

/** Estado completo do wizard */
interface WizardState {
  // Conceito
  name: string;
  concept: string;
  age: number | null;
  
  // NEX
  nex: number;
  
  // Atributos
  attributes: {
    strength: number;
    agility: number;
    vigor: number;
    intellect: number;
    presence: number;
  };
  
  // Perícias
  skills: string[];
  
  // Poderes
  powers: string[];
  
  // Rituais (Ocultista)
  rituals: string[];
}

/** Configuração de step dinâmico */
interface DynamicStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  /** Função que determina se o step deve aparecer */
  shouldShow: (state: WizardState, data: CharacterTemplateData | undefined) => boolean;
}

interface TemplateApplyWizardProps {
  /** Template a ser aplicado */
  template: CharacterTemplate | TemplateWithAuthor | null;
  /** Se o modal está aberto */
  isOpen: boolean;
  /** NEX inicial do personagem (sugerido) */
  nex: number;
  /** Callback para fechar */
  onClose: () => void;
  /** Callback para aplicar com os valores ajustados */
  onApply: (adjustedData: Partial<CharacterFormData>) => void;
}

// ========================================
// Constantes
// ========================================

/** Steps dinâmicos - aparecem conforme necessidade */
const ALL_STEPS: DynamicStep[] = [
  {
    id: 'concept',
    title: 'Conceito',
    description: 'Nome e conceito do personagem',
    icon: <User className="w-4 h-4" />,
    shouldShow: () => true, // Sempre mostra
  },
  {
    id: 'nex',
    title: 'NEX',
    description: 'Nível de exposição paranormal',
    icon: <Gauge className="w-4 h-4" />,
    shouldShow: (_, data) => {
      // Mostra se o template tem range de NEX
      if (!data) return true;
      return true; // Sempre mostra para permitir ajuste
    },
  },
  {
    id: 'attributes',
    title: 'Atributos',
    description: 'Distribuição de pontos',
    icon: <Sparkles className="w-4 h-4" />,
    shouldShow: () => true, // Sempre mostra pois usuário pode querer ajustar
  },
  {
    id: 'skills',
    title: 'Perícias',
    description: 'Perícias treinadas',
    icon: <BookOpen className="w-4 h-4" />,
    shouldShow: () => true, // Sempre mostra
  },
  {
    id: 'powers',
    title: 'Poderes',
    description: 'Poderes de classe',
    icon: <Swords className="w-4 h-4" />,
    shouldShow: (_, data) => {
      // Mostra se o template tem poderes sugeridos
      return (data?.classPowers?.length ?? 0) > 0;
    },
  },
  {
    id: 'rituals',
    title: 'Rituais',
    description: 'Rituais iniciais',
    icon: <Wand2 className="w-4 h-4" />,
    shouldShow: (_, data) => {
      // Mostra apenas para Ocultistas
      return data?.classId?.toLowerCase() === 'ocultista';
    },
  },
  {
    id: 'review',
    title: 'Revisar',
    description: 'Confirme suas escolhas',
    icon: <Check className="w-4 h-4" />,
    shouldShow: () => true, // Sempre mostra
  },
];

const ATTRIBUTES = [
  { id: 'agility', name: 'Agilidade', abbr: 'AGI', color: 'text-green-500' },
  { id: 'strength', name: 'Força', abbr: 'FOR', color: 'text-red-500' },
  { id: 'intellect', name: 'Intelecto', abbr: 'INT', color: 'text-blue-500' },
  { id: 'presence', name: 'Presença', abbr: 'PRE', color: 'text-purple-500' },
  { id: 'vigor', name: 'Vigor', abbr: 'VIG', color: 'text-yellow-500' },
];

const SKILL_LABELS: Record<string, string> = {
  acrobacia: 'Acrobacia', adestramento: 'Adestramento', artes: 'Artes',
  atletismo: 'Atletismo', atualidades: 'Atualidades', ciencias: 'Ciências',
  crime: 'Crime', diplomacia: 'Diplomacia', enganacao: 'Enganação',
  fortitude: 'Fortitude', furtividade: 'Furtividade', iniciativa: 'Iniciativa',
  intimidacao: 'Intimidação', intuicao: 'Intuição', investigacao: 'Investigação',
  luta: 'Luta', medicina: 'Medicina', ocultismo: 'Ocultismo',
  percepcao: 'Percepção', pilotagem: 'Pilotagem', pontaria: 'Pontaria',
  profissao: 'Profissão', reflexos: 'Reflexos', religiao: 'Religião',
  sobrevivencia: 'Sobrevivência', tatica: 'Tática', tecnologia: 'Tecnologia',
  vontade: 'Vontade',
};

// NEX válidos conforme v1.3
const NEX_VALUES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 99];

// ========================================
// Componente Principal
// ========================================

export function TemplateApplyWizard({
  template,
  isOpen,
  nex,
  onClose,
  onApply,
}: TemplateApplyWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // Dados do template
  const data = template?.template_data;
  
  // Estado inicial baseado no template
  const createInitialState = useCallback((): WizardState => {
    const templateNex = data ? Math.max(template?.min_nex ?? 5, nex) : nex;
    return {
      name: data?.appearance?.suggested_name || '',
      concept: data?.appearance?.suggested_concept || '',
      age: null,
      nex: templateNex,
      attributes: {
        strength: data?.attributes?.strength ?? 1,
        agility: data?.attributes?.agility ?? 1,
        vigor: data?.attributes?.vigor ?? 1,
        intellect: data?.attributes?.intellect ?? 1,
        presence: data?.attributes?.presence ?? 1,
      },
      skills: data?.trainedSkills ?? [],
      powers: data?.classPowers?.map(p => p.powerId) ?? [],
      rituals: data?.initialRituals ?? [],
    };
  }, [data, template, nex]);
  
  const [wizardState, setWizardState] = useState<WizardState>(createInitialState);

  // Reset ao mudar de template
  useEffect(() => {
    if (isOpen && template) {
      setWizardState(createInitialState());
      setCurrentStepIndex(0);
    }
  }, [isOpen, template, createInitialState]);

  // Steps visíveis dinamicamente
  const visibleSteps = useMemo(() => {
    return ALL_STEPS.filter(step => step.shouldShow(wizardState, data));
  }, [wizardState, data]);

  const currentStep = visibleSteps[currentStepIndex];

  // ========================================
  // Cálculos de limites por NEX
  // ========================================
  
  const maxAttribute = getMaxAttributeByNex(wizardState.nex);
  const extraAttributePoints = getExtraAttributePoints(wizardState.nex);
  const baseAttributePoints = 4 + extraAttributePoints;
  
  // Calcular pontos de atributos usados
  const attributePointsUsed = useMemo(() => {
    return Object.values(wizardState.attributes).reduce((sum, val) => sum + val, 0) - 5;
  }, [wizardState.attributes]);
  
  const attributePointsRemaining = baseAttributePoints - attributePointsUsed;

  // Calcular limite de perícias (INT + base da classe + extras por NEX)
  const skillLimit = useMemo(() => {
    if (!data?.classId) return 5;
    const classRules = getClassSkillRules(data.classId, wizardState.attributes.intellect);
    const nexExtra = getExtraSkillsByNex(wizardState.nex);
    return classRules.freePoints + nexExtra;
  }, [data?.classId, wizardState.attributes.intellect, wizardState.nex]);

  // Calcular limite de rituais (Ocultista)
  const ritualLimit = useMemo(() => {
    if (data?.classId?.toLowerCase() !== 'ocultista') return 0;
    const ritualsAllowed = getOcultistRituals(wizardState.nex);
    return ritualsAllowed?.count ?? 0;
  }, [data?.classId, wizardState.nex]);

  // Círculo máximo de ritual permitido
  const maxRitualCircle = useMemo(() => {
    if (wizardState.nex < 40) return 1;
    if (wizardState.nex < 65) return 2;
    if (wizardState.nex < 80) return 3;
    return 4;
  }, [wizardState.nex]);

  // ========================================
  // Validações por step
  // ========================================
  
  const isConceptValid = wizardState.name.trim().length >= 2;
  const isNexValid = NEX_VALUES.includes(wizardState.nex) && 
    wizardState.nex >= (template?.min_nex ?? 5) &&
    wizardState.nex <= (template?.max_nex ?? 99);
  const isAttributesValid = attributePointsRemaining === 0 && 
    Object.values(wizardState.attributes).every(v => v >= 0 && v <= maxAttribute);
  const isSkillsValid = wizardState.skills.length >= 2 && wizardState.skills.length <= skillLimit + 5; // +5 margem para origem
  const isPowersValid = true; // Poderes são opcionais no template
  const isRitualsValid = data?.classId?.toLowerCase() !== 'ocultista' || 
    (wizardState.rituals.length > 0 && wizardState.rituals.length <= ritualLimit);

  // ========================================
  // Handlers
  // ========================================

  const handleNext = () => {
    if (currentStepIndex < visibleSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleApply = () => {
    if (!data) return;

    const adjustedData: Partial<CharacterFormData> = {
      name: wizardState.name,
      concept: wizardState.concept,
      age: wizardState.age,
      nex: wizardState.nex,
      origin: data.origin,
      characterClass: data.classId,
      classTrack: data.classTrack || '',
      attributes: wizardState.attributes,
      freeSkills: wizardState.skills,
      abilities: wizardState.powers,
      rituals: wizardState.rituals,
    };

    onApply(adjustedData);
    onClose();
  };

  const updateState = useCallback(<K extends keyof WizardState>(
    key: K,
    value: WizardState[K]
  ) => {
    setWizardState(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateAttribute = useCallback((attrId: string, delta: number) => {
    setWizardState(prev => {
      const currentValue = prev.attributes[attrId as keyof typeof prev.attributes];
      const newValue = currentValue + delta;
      
      if (newValue < 0 || newValue > maxAttribute) return prev;
      
      // Verificar pontos restantes
      const currentUsed = Object.values(prev.attributes).reduce((sum, v) => sum + v, 0) - 5;
      if (delta > 0 && currentUsed >= baseAttributePoints) return prev;
      
      return {
        ...prev,
        attributes: { ...prev.attributes, [attrId]: newValue },
      };
    });
  }, [maxAttribute, baseAttributePoints]);

  const toggleSkill = useCallback((skillId: string) => {
    setWizardState(prev => ({
      ...prev,
      skills: prev.skills.includes(skillId)
        ? prev.skills.filter(s => s !== skillId)
        : [...prev.skills, skillId],
    }));
  }, []);

  const togglePower = useCallback((powerId: string) => {
    setWizardState(prev => ({
      ...prev,
      powers: prev.powers.includes(powerId)
        ? prev.powers.filter(p => p !== powerId)
        : [...prev.powers, powerId],
    }));
  }, []);

  const toggleRitual = useCallback((ritualId: string) => {
    setWizardState(prev => {
      const isSelected = prev.rituals.includes(ritualId);
      if (!isSelected && prev.rituals.length >= ritualLimit) {
        return prev; // Não pode adicionar mais
      }
      return {
        ...prev,
        rituals: isSelected
          ? prev.rituals.filter(r => r !== ritualId)
          : [...prev.rituals, ritualId],
      };
    });
  }, [ritualLimit]);

  // Ajustar seleções quando NEX muda
  useEffect(() => {
    // Verificar se rituais selecionados ainda são válidos para o novo NEX
    if (data?.classId?.toLowerCase() === 'ocultista') {
      const allowedRituals = getOcultistRituals(wizardState.nex);
      if (allowedRituals && wizardState.rituals.length > allowedRituals.count) {
        setWizardState(prev => ({
          ...prev,
          rituals: prev.rituals.slice(0, allowedRituals.count),
        }));
      }
    }
    
    // Verificar atributos
    const newMax = getMaxAttributeByNex(wizardState.nex);
    const needsAttrAdjust = Object.values(wizardState.attributes).some(v => v > newMax);
    if (needsAttrAdjust) {
      setWizardState(prev => ({
        ...prev,
        attributes: {
          strength: Math.min(prev.attributes.strength, newMax),
          agility: Math.min(prev.attributes.agility, newMax),
          vigor: Math.min(prev.attributes.vigor, newMax),
          intellect: Math.min(prev.attributes.intellect, newMax),
          presence: Math.min(prev.attributes.presence, newMax),
        },
      }));
    }
  }, [wizardState.nex, data?.classId]);

  // Verificar se pode avançar
  const canProceed = useCallback(() => {
    switch (currentStep?.id) {
      case 'concept': return isConceptValid;
      case 'nex': return isNexValid;
      case 'attributes': return isAttributesValid;
      case 'skills': return isSkillsValid;
      case 'powers': return isPowersValid;
      case 'rituals': return isRitualsValid;
      case 'review': return true;
      default: return false;
    }
  }, [currentStep?.id, isConceptValid, isNexValid, isAttributesValid, isSkillsValid, isPowersValid, isRitualsValid]);

  // ========================================
  // Renderização de Steps
  // ========================================

  const renderStep = () => {
    switch (currentStep?.id) {
      case 'concept':
        return (
          <StepConcept
            name={wizardState.name}
            concept={wizardState.concept}
            suggestedName={data?.appearance?.suggested_name}
            suggestedConcept={data?.appearance?.suggested_concept}
            suggestedBackground={data?.appearance?.suggested_background}
            onNameChange={(v) => updateState('name', v)}
            onConceptChange={(v) => updateState('concept', v)}
          />
        );
      case 'nex':
        return (
          <StepNex
            nex={wizardState.nex}
            minNex={template?.min_nex ?? 5}
            maxNex={template?.max_nex ?? 99}
            suggestedNex={template?.min_nex ?? 5}
            onNexChange={(v) => updateState('nex', v)}
          />
        );
      case 'attributes':
        return (
          <StepAttributes
            attributes={wizardState.attributes}
            pointsRemaining={attributePointsRemaining}
            totalPoints={baseAttributePoints}
            maxAttribute={maxAttribute}
            nex={wizardState.nex}
            onUpdate={updateAttribute}
          />
        );
      case 'skills':
        return (
          <StepSkills
            selectedSkills={wizardState.skills}
            suggestedSkills={data?.trainedSkills || []}
            skillLimit={skillLimit}
            origin={data?.origin}
            classId={data?.classId}
            onToggle={toggleSkill}
          />
        );
      case 'powers':
        return (
          <StepPowers
            selectedPowers={wizardState.powers}
            suggestedPowers={data?.classPowers?.map(p => p.powerId) || []}
            classId={data?.classId || ''}
            nex={wizardState.nex}
            onToggle={togglePower}
          />
        );
      case 'rituals':
        return (
          <StepRituals
            selectedRituals={wizardState.rituals}
            suggestedRituals={data?.initialRituals || []}
            ritualLimit={ritualLimit}
            maxCircle={maxRitualCircle}
            elementalAffinity={data?.elementalAffinity}
            onToggle={toggleRitual}
          />
        );
      case 'review':
        return (
          <StepReview
            state={wizardState}
            templateName={template?.name || ''}
            classId={data?.classId || ''}
            origin={data?.origin || ''}
            classTrack={data?.classTrack}
          />
        );
      default:
        return null;
    }
  };

  if (!template) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-3 font-display text-xl tracking-wider">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-foreground">APLICAR TEMPLATE</span>
              <p className="text-sm font-normal text-muted-foreground mt-0.5">
                {template.name}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Stepper dinâmico */}
        <div className="px-6 py-3 border-b border-border bg-muted/30 shrink-0 overflow-x-auto">
          <div className="flex items-center justify-between min-w-max">
            {visibleSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                      index < currentStepIndex
                        ? 'bg-primary text-primary-foreground'
                        : index === currentStepIndex
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {index < currentStepIndex ? <Check className="w-4 h-4" /> : step.icon}
                  </div>
                  <span className={cn(
                    'text-xs mt-1 hidden sm:block whitespace-nowrap',
                    index === currentStepIndex ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}>
                    {step.title}
                  </span>
                </div>
                {index < visibleSteps.length - 1 && (
                  <div className={cn(
                    'h-0.5 w-6 sm:w-10 mx-1 sm:mx-2',
                    index < currentStepIndex ? 'bg-primary' : 'bg-border'
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 px-6 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep?.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex justify-between">
          <Button
            variant="outline"
            onClick={currentStepIndex === 0 ? onClose : handleBack}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {currentStepIndex === 0 ? 'Cancelar' : 'Voltar'}
          </Button>

          {currentStepIndex < visibleSteps.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleApply}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Check className="w-4 h-4" />
              Aplicar Template
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ========================================
// Sub-componentes de Steps
// ========================================

// Step: Conceito
interface StepConceptProps {
  name: string;
  concept: string;
  suggestedName?: string;
  suggestedConcept?: string;
  suggestedBackground?: string;
  onNameChange: (v: string) => void;
  onConceptChange: (v: string) => void;
}

function StepConcept({
  name,
  concept,
  suggestedName,
  suggestedConcept,
  suggestedBackground,
  onNameChange,
  onConceptChange,
}: StepConceptProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-display text-lg tracking-wider mb-2">CONCEITO DO PERSONAGEM</h3>
        <p className="text-sm text-muted-foreground">
          Defina quem é seu agente da Ordem
        </p>
      </div>

      {/* Sugestões do template */}
      {(suggestedName || suggestedConcept) && (
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
          <div className="flex items-center gap-2 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Sugestões do Template
          </div>
          {suggestedName && (
            <button
              onClick={() => onNameChange(suggestedName)}
              className="w-full text-left text-sm p-2 rounded bg-background/50 hover:bg-background transition-colors"
            >
              <span className="text-muted-foreground">Nome sugerido:</span>{' '}
              <span className="font-medium">{suggestedName}</span>
            </button>
          )}
          {suggestedConcept && (
            <button
              onClick={() => onConceptChange(suggestedConcept)}
              className="w-full text-left text-sm p-2 rounded bg-background/50 hover:bg-background transition-colors"
            >
              <span className="text-muted-foreground">Conceito:</span>{' '}
              <span className="font-medium">{suggestedConcept}</span>
            </button>
          )}
        </div>
      )}

      {/* Campos */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Agente *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Ex: Agente Silva"
            className="font-medium"
          />
          {name.length > 0 && name.length < 2 && (
            <p className="text-xs text-destructive">Nome deve ter pelo menos 2 caracteres</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="concept">Conceito (opcional)</Label>
          <Textarea
            id="concept"
            value={concept}
            onChange={(e) => onConceptChange(e.target.value)}
            placeholder="Uma breve descrição do seu personagem..."
            rows={3}
          />
        </div>
      </div>

      {/* Background sugerido */}
      {suggestedBackground && (
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Histórico sugerido:</p>
          <p className="text-sm">{suggestedBackground}</p>
        </div>
      )}
    </div>
  );
}

// Step: NEX
interface StepNexProps {
  nex: number;
  minNex: number;
  maxNex: number;
  suggestedNex: number;
  onNexChange: (v: number) => void;
}

function StepNex({ nex, minNex, maxNex, suggestedNex, onNexChange }: StepNexProps) {
  // Filtrar NEX válidos dentro do range
  const validNexValues = NEX_VALUES.filter(v => v >= minNex && v <= maxNex);
  const nexIndex = validNexValues.indexOf(nex);
  
  // Calcular benefícios do NEX
  const extraPoints = getExtraAttributePoints(nex);
  const extraSkills = getExtraSkillsByNex(nex);
  const maxAttr = getMaxAttributeByNex(nex);
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-display text-lg tracking-wider mb-2">NÍVEL DE EXPOSIÇÃO (NEX)</h3>
        <p className="text-sm text-muted-foreground">
          Ajuste o NEX do seu personagem
        </p>
      </div>

      {/* Sugestão do template */}
      <div className="flex items-center justify-center gap-2">
        <Badge variant="outline" className="gap-1">
          <Sparkles className="w-3 h-3" />
          Template sugere: {suggestedNex}%
        </Badge>
        {nex !== suggestedNex && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNexChange(suggestedNex)}
            className="h-6 text-xs"
          >
            Usar sugerido
          </Button>
        )}
      </div>

      {/* Slider de NEX */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">NEX Mínimo: {minNex}%</span>
          <span className="text-sm text-muted-foreground">NEX Máximo: {maxNex}%</span>
        </div>
        
        <div className="px-2">
          <Slider
            value={[nexIndex >= 0 ? nexIndex : 0]}
            min={0}
            max={validNexValues.length - 1}
            step={1}
            onValueChange={([index]) => onNexChange(validNexValues[index])}
            className="w-full"
          />
        </div>

        <div className="text-center">
          <span className="text-4xl font-display font-bold text-primary">{nex}%</span>
        </div>
      </div>

      {/* Benefícios por NEX */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-card border border-border text-center">
          <p className="text-xs text-muted-foreground mb-1">Pontos Extra</p>
          <p className="text-lg font-bold text-primary">+{extraPoints}</p>
        </div>
        <div className="p-3 rounded-lg bg-card border border-border text-center">
          <p className="text-xs text-muted-foreground mb-1">Perícias Extra</p>
          <p className="text-lg font-bold text-blue-500">+{extraSkills}</p>
        </div>
        <div className="p-3 rounded-lg bg-card border border-border text-center">
          <p className="text-xs text-muted-foreground mb-1">Atributo Máx</p>
          <p className="text-lg font-bold text-yellow-500">{maxAttr}</p>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
        <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          O NEX determina sua experiência paranormal. NEX mais alto significa mais recursos,
          mas também maior exposição aos perigos do Outro Lado.
        </p>
      </div>
    </div>
  );
}

// Step: Atributos
interface StepAttributesProps {
  attributes: WizardState['attributes'];
  pointsRemaining: number;
  totalPoints: number;
  maxAttribute: number;
  nex: number;
  onUpdate: (attrId: string, delta: number) => void;
}

function StepAttributes({
  attributes,
  pointsRemaining,
  totalPoints,
  maxAttribute,
  nex,
  onUpdate,
}: StepAttributesProps) {
  const hasZeroAttribute = Object.values(attributes).some(v => v === 0);
  const zeroCount = Object.values(attributes).filter(v => v === 0).length;
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-display text-lg tracking-wider mb-2">DISTRIBUIÇÃO DE ATRIBUTOS</h3>
        <p className="text-sm text-muted-foreground">
          Ajuste os atributos conforme seu estilo de jogo
        </p>
      </div>

      {/* Info de NEX */}
      <div className="flex items-center justify-center gap-4">
        <Badge variant="secondary">NEX {nex}%</Badge>
        <Badge variant="outline">Máximo por atributo: {maxAttribute}</Badge>
      </div>

      {/* Pontos restantes */}
      <div className={cn(
        'flex items-center justify-center gap-2 p-3 rounded-lg',
        pointsRemaining === 0
          ? 'bg-green-500/10 border border-green-500/30'
          : pointsRemaining < 0
          ? 'bg-destructive/10 border border-destructive/30'
          : 'bg-primary/10 border border-primary/30'
      )}>
        <span className="text-sm font-medium">Pontos:</span>
        <Badge variant={pointsRemaining === 0 ? 'default' : 'outline'} className={cn(
          pointsRemaining < 0 && 'bg-destructive text-destructive-foreground'
        )}>
          {totalPoints - pointsRemaining} / {totalPoints}
        </Badge>
        {pointsRemaining > 0 && (
          <span className="text-xs text-muted-foreground">
            ({pointsRemaining} restantes)
          </span>
        )}
      </div>

      {/* Atributos */}
      <div className="space-y-3">
        {ATTRIBUTES.map((attr) => (
          <div
            key={attr.id}
            className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
          >
            <div className="flex items-center gap-3">
              <span className={cn('font-mono font-bold text-lg', attr.color)}>
                {attr.abbr}
              </span>
              <span className="text-sm">{attr.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8"
                onClick={() => onUpdate(attr.id, -1)}
                disabled={attributes[attr.id as keyof typeof attributes] <= 0}
              >
                <Minus className="w-4 h-4" />
              </Button>
              
              <span className="w-8 text-center font-mono text-lg font-bold">
                {attributes[attr.id as keyof typeof attributes]}
              </span>
              
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8"
                onClick={() => onUpdate(attr.id, 1)}
                disabled={
                  attributes[attr.id as keyof typeof attributes] >= maxAttribute ||
                  pointsRemaining <= 0
                }
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Info sobre atributo 0 */}
      {hasZeroAttribute && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            {zeroCount === 1 
              ? 'Reduzir um atributo a 0 dá +1 ponto extra (já aplicado).'
              : 'Atenção: Apenas UM atributo pode ser reduzido a 0 por personagem.'}
          </p>
        </div>
      )}
    </div>
  );
}

// Step: Perícias
interface StepSkillsProps {
  selectedSkills: string[];
  suggestedSkills: string[];
  skillLimit: number;
  origin?: string;
  classId?: string;
  onToggle: (skillId: string) => void;
}

function StepSkills({
  selectedSkills,
  suggestedSkills,
  skillLimit,
  origin,
  classId,
  onToggle,
}: StepSkillsProps) {
  const allSkills = Object.entries(SKILL_LABELS);
  
  // Obter perícias de origem
  const originData = ORIGINS.find(o => o.id === origin);
  const originSkills = originData?.skills || [];
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-display text-lg tracking-wider mb-2">PERÍCIAS TREINADAS</h3>
        <p className="text-sm text-muted-foreground">
          Selecione as perícias em que seu agente será treinado
        </p>
      </div>

      {/* Contadores */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Badge variant="outline" className={cn(
          selectedSkills.length > skillLimit + originSkills.length && 'border-destructive text-destructive'
        )}>
          {selectedSkills.length} / {skillLimit + originSkills.length} perícias
        </Badge>
        {originSkills.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            +{originSkills.length} da origem
          </Badge>
        )}
        {suggestedSkills.length > 0 && (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Sparkles className="w-3 h-3" />
            {suggestedSkills.length} sugeridas
          </Badge>
        )}
      </div>

      {/* Grid de perícias */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {allSkills.map(([skillId, skillName]) => {
          const isSelected = selectedSkills.includes(skillId);
          const isSuggested = suggestedSkills.includes(skillId);
          const isFromOrigin = originSkills.map(s => s.toLowerCase().replace(/\s+/g, '')).includes(skillId);
          
          return (
            <button
              key={skillId}
              onClick={() => onToggle(skillId)}
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg border text-left transition-all text-sm',
                isSelected
                  ? 'bg-primary/10 border-primary/50 text-primary'
                  : 'bg-card border-border hover:border-primary/30',
                isFromOrigin && !isSelected && 'border-yellow-500/30'
              )}
            >
              <Checkbox checked={isSelected} className="pointer-events-none" />
              <span className="flex-1 truncate">{skillName}</span>
              {isSuggested && !isSelected && (
                <Sparkles className="w-3 h-3 text-primary/50" />
              )}
              {isFromOrigin && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="text-[10px] px-1 py-0">OR</Badge>
                    </TooltipTrigger>
                    <TooltipContent>Da origem</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Step: Poderes
interface StepPowersProps {
  selectedPowers: string[];
  suggestedPowers: string[];
  classId: string;
  nex: number;
  onToggle: (powerId: string) => void;
}

function StepPowers({
  selectedPowers,
  suggestedPowers,
  classId,
  nex,
  onToggle,
}: StepPowersProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-display text-lg tracking-wider mb-2">PODERES DE CLASSE</h3>
        <p className="text-sm text-muted-foreground">
          Confirme os poderes sugeridos pelo template
        </p>
      </div>

      {/* Info */}
      <div className="flex items-center justify-center gap-2">
        <Badge variant="outline">{selectedPowers.length} selecionados</Badge>
        <Badge variant="secondary">NEX {nex}%</Badge>
      </div>

      {/* Poderes sugeridos */}
      <div className="space-y-2">
        {suggestedPowers.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            Este template não sugere poderes específicos.
            Você poderá escolhê-los na ficha completa.
          </p>
        ) : (
          suggestedPowers.map((powerId) => {
            const isSelected = selectedPowers.includes(powerId);
            return (
              <button
                key={powerId}
                onClick={() => onToggle(powerId)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                  isSelected
                    ? 'bg-primary/10 border-primary/50'
                    : 'bg-card border-border hover:border-primary/30'
                )}
              >
                <Checkbox checked={isSelected} className="pointer-events-none" />
                <span className="font-medium capitalize">{powerId.replace(/-/g, ' ')}</span>
              </button>
            );
          })
        )}
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
        <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Você pode ajustar seus poderes após criar o personagem na ficha completa.
        </p>
      </div>
    </div>
  );
}

// Step: Rituais
interface StepRitualsProps {
  selectedRituals: string[];
  suggestedRituals: string[];
  ritualLimit: number;
  maxCircle: number;
  elementalAffinity?: string;
  onToggle: (ritualId: string) => void;
}

function StepRituals({
  selectedRituals,
  suggestedRituals,
  ritualLimit,
  maxCircle,
  elementalAffinity,
  onToggle,
}: StepRitualsProps) {
  // Filtrar rituais disponíveis por círculo
  const availableRituals = useMemo(() => {
    return ALL_RITUALS.filter(r => r.circle <= maxCircle);
  }, [maxCircle]);

  // Agrupar por elemento
  const ritualsByElement = useMemo(() => {
    const grouped: Record<string, typeof availableRituals> = {};
    availableRituals.forEach(ritual => {
      const element = ritual.element || 'Variado';
      if (!grouped[element]) grouped[element] = [];
      grouped[element].push(ritual);
    });
    return grouped;
  }, [availableRituals]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-display text-lg tracking-wider mb-2">RITUAIS INICIAIS</h3>
        <p className="text-sm text-muted-foreground">
          Escolha os rituais que seu ocultista conhece
        </p>
      </div>

      {/* Contadores */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Badge variant={selectedRituals.length === ritualLimit ? 'default' : 'outline'} className={cn(
          selectedRituals.length > ritualLimit && 'border-destructive text-destructive'
        )}>
          {selectedRituals.length} / {ritualLimit} rituais
        </Badge>
        <Badge variant="secondary">Círculo máximo: {maxCircle}º</Badge>
        {elementalAffinity && (
          <Badge variant="outline" className="gap-1">
            <Wand2 className="w-3 h-3" />
            Afinidade: {elementalAffinity}
          </Badge>
        )}
      </div>

      {/* Lista de rituais por elemento */}
      <ScrollArea className="h-[300px]">
        <div className="space-y-4 pr-4">
          {Object.entries(ritualsByElement).map(([element, rituals]) => (
            <div key={element} className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background py-1">
                {element} ({rituals.length})
              </h4>
              <div className="space-y-1">
                {rituals.map((ritual) => {
                  const isSelected = selectedRituals.includes(ritual.id);
                  const isSuggested = suggestedRituals.includes(ritual.id);
                  const isAffinity = elementalAffinity && ritual.element === elementalAffinity;
                  
                  return (
                    <button
                      key={ritual.id}
                      onClick={() => onToggle(ritual.id)}
                      disabled={!isSelected && selectedRituals.length >= ritualLimit}
                      className={cn(
                        'w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-all text-sm',
                        isSelected
                          ? 'bg-purple-500/10 border-purple-500/50'
                          : 'bg-card border-border hover:border-purple-500/30',
                        isAffinity && !isSelected && 'border-purple-500/30',
                        !isSelected && selectedRituals.length >= ritualLimit && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <Checkbox checked={isSelected} className="pointer-events-none" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{ritual.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {ritual.circle}º Círculo
                        </span>
                      </div>
                      {isSuggested && !isSelected && (
                        <Sparkles className="w-3 h-3 text-purple-500/50 shrink-0" />
                      )}
                      {isAffinity && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">
                          Afinidade
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// Step: Revisão
interface StepReviewProps {
  state: WizardState;
  templateName: string;
  classId: string;
  origin: string;
  classTrack?: string | null;
}

function StepReview({ state, templateName, classId, origin, classTrack }: StepReviewProps) {
  const total = Object.values(state.attributes).reduce((sum, val) => sum + val, 0);
  const isOcultista = classId.toLowerCase() === 'ocultista';
  
  // Obter nomes legíveis
  const originData = ORIGINS.find(o => o.id === origin);
  const classData = CLASSES.find(c => c.id === classId);
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-display text-lg tracking-wider mb-2">REVISÃO FINAL</h3>
        <p className="text-sm text-muted-foreground">
          Confirme suas escolhas antes de aplicar o template
        </p>
      </div>

      {/* Template Info */}
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
        <Package className="w-8 h-8 text-primary mx-auto mb-2" />
        <p className="font-display tracking-wider">{templateName}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {classData?.name} • {originData?.name} • NEX {state.nex}%
        </p>
      </div>

      {/* Nome */}
      <div className="p-4 rounded-lg bg-card border border-border">
        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Personagem</h4>
        <p className="font-display text-lg tracking-wider">{state.name}</p>
        {state.concept && (
          <p className="text-sm text-muted-foreground mt-1">{state.concept}</p>
        )}
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Atributos */}
        <div className="p-4 rounded-lg bg-card border border-border">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Atributos ({total} pts)</h4>
          <div className="grid grid-cols-5 gap-2 text-center">
            {ATTRIBUTES.map((attr) => (
              <div key={attr.id}>
                <span className={cn('text-xs font-mono', attr.color)}>{attr.abbr}</span>
                <p className="font-bold">{state.attributes[attr.id as keyof typeof state.attributes]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Perícias */}
        <div className="p-4 rounded-lg bg-card border border-border">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Perícias ({state.skills.length})</h4>
          <div className="flex flex-wrap gap-1">
            {state.skills.slice(0, 6).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {SKILL_LABELS[skill] || skill}
              </Badge>
            ))}
            {state.skills.length > 6 && (
              <Badge variant="outline" className="text-xs">
                +{state.skills.length - 6}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Poderes */}
      {state.powers.length > 0 && (
        <div className="p-4 rounded-lg bg-card border border-border">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Poderes ({state.powers.length})</h4>
          <div className="flex flex-wrap gap-1">
            {state.powers.map((power) => (
              <Badge key={power} variant="secondary" className="text-xs capitalize">
                {power.replace(/-/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Rituais */}
      {isOcultista && state.rituals.length > 0 && (
        <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
          <h4 className="text-sm font-medium mb-3 text-purple-400">Rituais ({state.rituals.length})</h4>
          <div className="flex flex-wrap gap-1">
            {state.rituals.map((ritual) => {
              const ritualData = ALL_RITUALS.find(r => r.id === ritual);
              return (
                <Badge 
                  key={ritual} 
                  className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30"
                >
                  {ritualData?.name || ritual}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Aviso final */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
        <p className="text-xs text-green-600 dark:text-green-400">
          Tudo pronto! Clique em "Aplicar Template" para preencher o formulário com essas configurações.
        </p>
      </div>
    </div>
  );
}

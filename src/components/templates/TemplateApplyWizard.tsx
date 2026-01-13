/**
 * Wizard de Aplicação Interativa de Template
 * Permite ajustar atributos, perícias e poderes antes de aplicar
 * 
 * @module components/templates/TemplateApplyWizard
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  Package,
  Minus,
  Plus,
  AlertTriangle,
  Info,
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
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CharacterTemplate, TemplateWithAuthor, CharacterTemplateData, TemplateAttributes } from '@/types/templates';
import type { CharacterFormData } from '@/pages/CharacterCreate';
import { ORIGINS, CLASSES, getExtraAttributePoints } from '@/lib/character-data';
import { getMaxAttributeByNex } from '@/lib/character-builder-engine';

// ========================================
// Tipos Internos
// ========================================

interface WizardState {
  /** Atributos ajustados */
  attributes: {
    strength: number;
    agility: number;
    vigor: number;
    intellect: number;
    presence: number;
  };
  /** Perícias selecionadas */
  skills: string[];
  /** Poderes selecionados */
  powers: string[];
  /** Rituais selecionados (Ocultista) */
  rituals: string[];
}

interface TemplateApplyWizardProps {
  /** Template a ser aplicado */
  template: CharacterTemplate | TemplateWithAuthor | null;
  /** Se o modal está aberto */
  isOpen: boolean;
  /** NEX inicial do personagem */
  nex: number;
  /** Callback para fechar */
  onClose: () => void;
  /** Callback para aplicar com os valores ajustados */
  onApply: (adjustedData: Partial<CharacterFormData>) => void;
}

// ========================================
// Constantes
// ========================================

const WIZARD_STEPS = [
  { id: 'attributes', title: 'Atributos', description: 'Ajuste a distribuição de atributos' },
  { id: 'skills', title: 'Perícias', description: 'Selecione suas perícias treinadas' },
  { id: 'powers', title: 'Poderes', description: 'Escolha seus poderes de classe' },
  { id: 'review', title: 'Revisar', description: 'Confirme suas escolhas' },
];

const ATTRIBUTES = [
  { id: 'agility', name: 'Agilidade', abbr: 'AGI', color: 'text-green-500' },
  { id: 'strength', name: 'Força', abbr: 'FOR', color: 'text-red-500' },
  { id: 'intellect', name: 'Intelecto', abbr: 'INT', color: 'text-blue-500' },
  { id: 'presence', name: 'Presença', abbr: 'PRE', color: 'text-purple-500' },
  { id: 'vigor', name: 'Vigor', abbr: 'VIG', color: 'text-yellow-500' },
];

const SKILL_LABELS: Record<string, string> = {
  acrobacia: 'Acrobacia',
  adestramento: 'Adestramento',
  artes: 'Artes',
  atletismo: 'Atletismo',
  atualidades: 'Atualidades',
  ciencias: 'Ciências',
  crime: 'Crime',
  diplomacia: 'Diplomacia',
  enganacao: 'Enganação',
  fortitude: 'Fortitude',
  furtividade: 'Furtividade',
  iniciativa: 'Iniciativa',
  intimidacao: 'Intimidação',
  intuicao: 'Intuição',
  investigacao: 'Investigação',
  luta: 'Luta',
  medicina: 'Medicina',
  ocultismo: 'Ocultismo',
  percepcao: 'Percepção',
  pilotagem: 'Pilotagem',
  pontaria: 'Pontaria',
  profissao: 'Profissão',
  reflexos: 'Reflexos',
  religiao: 'Religião',
  sobrevivencia: 'Sobrevivência',
  tatica: 'Tática',
  tecnologia: 'Tecnologia',
  vontade: 'Vontade',
};

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
  const [currentStep, setCurrentStep] = useState(0);
  
  // Estado do wizard baseado no template
  const [wizardState, setWizardState] = useState<WizardState>(() => {
    const data = template?.template_data;
    return {
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
  });

  // Reset ao mudar de template
  const templateId = template?.id;
  const resetState = useCallback(() => {
    const data = template?.template_data;
    setWizardState({
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
    });
    setCurrentStep(0);
  }, [template]);

  // Dados do template
  const data = template?.template_data;

  // Calcular pontos de atributos
  const maxAttribute = getMaxAttributeByNex(nex);
  const extraPoints = getExtraAttributePoints(nex);
  const basePoints = 4 + extraPoints; // 4 pontos base + extras por NEX
  
  const totalAttributePoints = useMemo(() => {
    return Object.values(wizardState.attributes).reduce((sum, val) => sum + val, 0) - 5; // -5 porque cada atributo começa em 1
  }, [wizardState.attributes]);

  const pointsRemaining = basePoints - totalAttributePoints;

  // Validações
  const isAttributesValid = pointsRemaining === 0 && Object.values(wizardState.attributes).every(v => v >= 0 && v <= maxAttribute);
  const isSkillsValid = wizardState.skills.length >= 2;
  const isPowersValid = wizardState.powers.length >= 1;

  // Navegar entre steps
  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Aplicar template
  const handleApply = () => {
    if (!data) return;

    const adjustedData: Partial<CharacterFormData> = {
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

  // Atualizar atributo
  const updateAttribute = (attrId: string, delta: number) => {
    setWizardState(prev => {
      const currentValue = prev.attributes[attrId as keyof typeof prev.attributes];
      const newValue = currentValue + delta;
      
      // Verificar limites
      if (newValue < 0 || newValue > maxAttribute) return prev;
      
      // Verificar pontos restantes
      if (delta > 0 && pointsRemaining <= 0) return prev;
      
      return {
        ...prev,
        attributes: {
          ...prev.attributes,
          [attrId]: newValue,
        },
      };
    });
  };

  // Toggle skill
  const toggleSkill = (skillId: string) => {
    setWizardState(prev => {
      const isSelected = prev.skills.includes(skillId);
      return {
        ...prev,
        skills: isSelected
          ? prev.skills.filter(s => s !== skillId)
          : [...prev.skills, skillId],
      };
    });
  };

  // Toggle power
  const togglePower = (powerId: string) => {
    setWizardState(prev => {
      const isSelected = prev.powers.includes(powerId);
      return {
        ...prev,
        powers: isSelected
          ? prev.powers.filter(p => p !== powerId)
          : [...prev.powers, powerId],
      };
    });
  };

  // Renderizar step atual
  const renderStep = () => {
    switch (WIZARD_STEPS[currentStep].id) {
      case 'attributes':
        return (
          <StepAttributes
            attributes={wizardState.attributes}
            pointsRemaining={pointsRemaining}
            maxAttribute={maxAttribute}
            onUpdate={updateAttribute}
          />
        );
      case 'skills':
        return (
          <StepSkills
            selectedSkills={wizardState.skills}
            suggestedSkills={data?.trainedSkills || []}
            onToggle={toggleSkill}
          />
        );
      case 'powers':
        return (
          <StepPowers
            selectedPowers={wizardState.powers}
            suggestedPowers={data?.classPowers?.map(p => p.powerId) || []}
            classId={data?.classId || ''}
            rituals={wizardState.rituals}
            initialRituals={data?.initialRituals || []}
            onTogglePower={togglePower}
            onToggleRitual={(ritualId) => {
              setWizardState(prev => ({
                ...prev,
                rituals: prev.rituals.includes(ritualId)
                  ? prev.rituals.filter(r => r !== ritualId)
                  : [...prev.rituals, ritualId],
              }));
            }}
          />
        );
      case 'review':
        return (
          <StepReview
            templateName={template?.name || ''}
            attributes={wizardState.attributes}
            skills={wizardState.skills}
            powers={wizardState.powers}
            rituals={wizardState.rituals}
            classId={data?.classId || ''}
          />
        );
      default:
        return null;
    }
  };

  // Verificar se pode avançar
  const canProceed = () => {
    switch (WIZARD_STEPS[currentStep].id) {
      case 'attributes':
        return isAttributesValid;
      case 'skills':
        return isSkillsValid;
      case 'powers':
        return isPowersValid;
      case 'review':
        return true;
      default:
        return false;
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

        {/* Stepper */}
        <div className="px-6 py-4 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                      index < currentStep
                        ? 'bg-primary text-primary-foreground'
                        : index === currentStep
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {index < currentStep ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={cn(
                    'text-xs mt-1 hidden sm:block',
                    index === currentStep ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}>
                    {step.title}
                  </span>
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 w-12 mx-2',
                      index < currentStep ? 'bg-primary' : 'bg-border'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 px-6 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
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
            onClick={currentStep === 0 ? onClose : handleBack}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {currentStep === 0 ? 'Cancelar' : 'Voltar'}
          </Button>

          {currentStep < WIZARD_STEPS.length - 1 ? (
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

interface StepAttributesProps {
  attributes: WizardState['attributes'];
  pointsRemaining: number;
  maxAttribute: number;
  onUpdate: (attrId: string, delta: number) => void;
}

function StepAttributes({ attributes, pointsRemaining, maxAttribute, onUpdate }: StepAttributesProps) {
  const hasZeroAttribute = Object.values(attributes).some(v => v === 0);
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-display text-lg tracking-wider mb-2">DISTRIBUIÇÃO DE ATRIBUTOS</h3>
        <p className="text-sm text-muted-foreground">
          Ajuste os atributos conforme seu estilo de jogo
        </p>
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
        <span className="text-sm font-medium">
          Pontos restantes:
        </span>
        <Badge variant={pointsRemaining === 0 ? 'default' : 'outline'} className={cn(
          pointsRemaining < 0 && 'bg-destructive text-destructive-foreground'
        )}>
          {pointsRemaining}
        </Badge>
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

      {/* Info sobre reduzir a 0 */}
      {hasZeroAttribute && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            Reduzir um atributo a 0 dá +1 ponto extra, mas apenas uma vez.
          </p>
        </div>
      )}
    </div>
  );
}

interface StepSkillsProps {
  selectedSkills: string[];
  suggestedSkills: string[];
  onToggle: (skillId: string) => void;
}

function StepSkills({ selectedSkills, suggestedSkills, onToggle }: StepSkillsProps) {
  const allSkills = Object.entries(SKILL_LABELS);
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-display text-lg tracking-wider mb-2">PERÍCIAS TREINADAS</h3>
        <p className="text-sm text-muted-foreground">
          Selecione as perícias em que seu agente será treinado
        </p>
      </div>

      {/* Info */}
      <div className="flex items-center justify-center gap-2">
        <Badge variant="outline">
          {selectedSkills.length} selecionadas
        </Badge>
        {suggestedSkills.length > 0 && (
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="w-3 h-3" />
            Sugeridas pelo template
          </Badge>
        )}
      </div>

      {/* Grid de perícias */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {allSkills.map(([skillId, skillName]) => {
          const isSelected = selectedSkills.includes(skillId);
          const isSuggested = suggestedSkills.includes(skillId);
          
          return (
            <button
              key={skillId}
              onClick={() => onToggle(skillId)}
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg border text-left transition-all text-sm',
                isSelected
                  ? 'bg-primary/10 border-primary/50 text-primary'
                  : 'bg-card border-border hover:border-primary/30'
              )}
            >
              <Checkbox checked={isSelected} className="pointer-events-none" />
              <span className="flex-1 truncate">{skillName}</span>
              {isSuggested && !isSelected && (
                <Sparkles className="w-3 h-3 text-primary/50" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface StepPowersProps {
  selectedPowers: string[];
  suggestedPowers: string[];
  classId: string;
  rituals: string[];
  initialRituals: string[];
  onTogglePower: (powerId: string) => void;
  onToggleRitual: (ritualId: string) => void;
}

function StepPowers({ 
  selectedPowers, 
  suggestedPowers, 
  classId,
  rituals,
  initialRituals,
  onTogglePower,
  onToggleRitual,
}: StepPowersProps) {
  const isOcultista = classId.toLowerCase() === 'ocultista';
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-display text-lg tracking-wider mb-2">PODERES E RITUAIS</h3>
        <p className="text-sm text-muted-foreground">
          Confirme os poderes de classe sugeridos pelo template
        </p>
      </div>

      {/* Poderes selecionados */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Poderes de Classe</h4>
        <div className="space-y-2">
          {suggestedPowers.map((powerId) => {
            const isSelected = selectedPowers.includes(powerId);
            return (
              <button
                key={powerId}
                onClick={() => onTogglePower(powerId)}
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
          })}
        </div>
      </div>

      {/* Rituais (apenas Ocultista) */}
      {isOcultista && initialRituals.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Rituais Iniciais</h4>
          <div className="space-y-2">
            {initialRituals.map((ritualId) => {
              const isSelected = rituals.includes(ritualId);
              return (
                <button
                  key={ritualId}
                  onClick={() => onToggleRitual(ritualId)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                    isSelected
                      ? 'bg-purple-500/10 border-purple-500/50'
                      : 'bg-card border-border hover:border-purple-500/30'
                  )}
                >
                  <Checkbox checked={isSelected} className="pointer-events-none" />
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="font-medium capitalize">{ritualId.replace(/-/g, ' ')}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

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

interface StepReviewProps {
  templateName: string;
  attributes: WizardState['attributes'];
  skills: string[];
  powers: string[];
  rituals: string[];
  classId: string;
}

function StepReview({ templateName, attributes, skills, powers, rituals, classId }: StepReviewProps) {
  const total = Object.values(attributes).reduce((sum, val) => sum + val, 0);
  const isOcultista = classId.toLowerCase() === 'ocultista';
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-display text-lg tracking-wider mb-2">REVISÃO FINAL</h3>
        <p className="text-sm text-muted-foreground">
          Confirme suas escolhas antes de aplicar o template
        </p>
      </div>

      {/* Template */}
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
        <Package className="w-8 h-8 text-primary mx-auto mb-2" />
        <p className="font-display tracking-wider">{templateName}</p>
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
                <p className="font-bold">{attributes[attr.id as keyof typeof attributes]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Perícias */}
        <div className="p-4 rounded-lg bg-card border border-border">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Perícias ({skills.length})</h4>
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 6).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {SKILL_LABELS[skill] || skill}
              </Badge>
            ))}
            {skills.length > 6 && (
              <Badge variant="outline" className="text-xs">
                +{skills.length - 6}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Poderes */}
      <div className="p-4 rounded-lg bg-card border border-border">
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Poderes ({powers.length})</h4>
        <div className="flex flex-wrap gap-1">
          {powers.map((power) => (
            <Badge key={power} variant="secondary" className="text-xs capitalize">
              {power.replace(/-/g, ' ')}
            </Badge>
          ))}
        </div>
      </div>

      {/* Rituais */}
      {isOcultista && rituals.length > 0 && (
        <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
          <h4 className="text-sm font-medium mb-3 text-purple-400">Rituais ({rituals.length})</h4>
          <div className="flex flex-wrap gap-1">
            {rituals.map((ritual) => (
              <Badge key={ritual} className="text-xs capitalize bg-purple-500/20 text-purple-300 border-purple-500/30">
                {ritual.replace(/-/g, ' ')}
              </Badge>
            ))}
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

/**
 * Wizard de Criação de Templates
 * Guia passo-a-passo para criar templates válidos
 * Valida contra regras oficiais v1.3 em tempo real
 * 
 * @module components/templates/TemplateCreationWizard
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  User,
  Swords,
  BookOpen,
  Package,
  Save,
  Eye,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { CLASSES, ORIGINS } from '@/lib/character-data';
import { CLASS_IDS, VALID_SKILL_IDS, ELEMENT_IDS, TRACKS_BY_CLASS } from '@/lib/constants/game-ids';
import {
  validateTemplate,
  type TemplateValidationResult,
} from '@/lib/templates/template-validation-engine';
import type {
  CharacterTemplateData,
  TemplateDifficulty,
  CreateTemplateDto,
} from '@/types/templates';
import { TEMPLATE_SCHEMA_VERSION, ALL_TEMPLATE_TAGS, DIFFICULTY_LABELS } from '@/types/templates';

// ========================================
// Tipos Internos
// ========================================

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface CreationState {
  // Metadados do template
  name: string;
  description: string;
  tags: string[];
  difficulty: TemplateDifficulty;
  isPublic: boolean;
  
  // Dados do personagem
  origin: string;
  classId: string;
  classTrack: string | null;
  elementalAffinity: string;
  
  // Atributos
  attributes: {
    strength: number;
    agility: number;
    vigor: number;
    intellect: number;
    presence: number;
  };
  
  // Perícias
  trainedSkills: string[];
  
  // Rituais (Ocultista)
  initialRituals: string[];
}

interface TemplateCreationWizardProps {
  /** Se o modal está aberto */
  isOpen: boolean;
  /** Callback para fechar */
  onClose: () => void;
  /** Callback ao criar template */
  onCreate: (dto: CreateTemplateDto) => void;
  /** Se está salvando */
  isSaving?: boolean;
}

// ========================================
// Constantes
// ========================================

const CREATION_STEPS: WizardStep[] = [
  { id: 'basics', title: 'Informações', description: 'Nome e descrição', icon: <User className="w-4 h-4" /> },
  { id: 'class', title: 'Classe', description: 'Classe e trilha', icon: <Swords className="w-4 h-4" /> },
  { id: 'attributes', title: 'Atributos', description: 'Distribuição de pontos', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'skills', title: 'Perícias', description: 'Perícias treinadas', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'review', title: 'Revisar', description: 'Validação final', icon: <Check className="w-4 h-4" /> },
];

const ATTRIBUTES_CONFIG = [
  { id: 'strength', name: 'Força', abbr: 'FOR', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  { id: 'agility', name: 'Agilidade', abbr: 'AGI', color: 'text-green-500', bgColor: 'bg-green-500/10' },
  { id: 'vigor', name: 'Vigor', abbr: 'VIG', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  { id: 'intellect', name: 'Intelecto', abbr: 'INT', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { id: 'presence', name: 'Presença', abbr: 'PRE', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
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

const INITIAL_STATE: CreationState = {
  name: '',
  description: '',
  tags: [],
  difficulty: 'beginner',
  isPublic: false,
  origin: '',
  classId: '',
  classTrack: null,
  elementalAffinity: '',
  attributes: { strength: 1, agility: 1, vigor: 1, intellect: 1, presence: 1 },
  trainedSkills: [],
  initialRituals: [],
};

// ========================================
// Componente Principal
// ========================================

export function TemplateCreationWizard({
  isOpen,
  onClose,
  onCreate,
  isSaving = false,
}: TemplateCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState<CreationState>(INITIAL_STATE);
  
  // Reset ao abrir
  useEffect(() => {
    if (isOpen) {
      setState(INITIAL_STATE);
      setCurrentStep(0);
    }
  }, [isOpen]);

  // Validação em tempo real
  const validation = useMemo((): TemplateValidationResult | null => {
    if (!state.classId || !state.origin) return null;
    
    const templateData: CharacterTemplateData = {
      origin: state.origin,
      classId: state.classId,
      classTrack: state.classTrack,
      elementalAffinity: state.elementalAffinity || undefined,
      attributes: state.attributes,
      trainedSkills: state.trainedSkills,
      classPowers: [],
      equipment: { weapons: [], items: [] },
      initialRituals: state.initialRituals.length > 0 ? state.initialRituals : undefined,
      schema_version: TEMPLATE_SCHEMA_VERSION,
    };
    
    return validateTemplate(templateData);
  }, [state]);

  // Atualizar estado
  const updateState = useCallback(<K extends keyof CreationState>(
    key: K,
    value: CreationState[K]
  ) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  // Atualizar atributo
  const updateAttribute = useCallback((attrId: string, delta: number) => {
    setState(prev => {
      const currentValue = prev.attributes[attrId as keyof typeof prev.attributes];
      const newValue = Math.max(0, Math.min(5, currentValue + delta));
      
      // Verificar pontos disponíveis (4 pontos base)
      const totalPoints = Object.values(prev.attributes).reduce((sum, v) => sum + v, 0);
      if (delta > 0 && totalPoints >= 9) return prev; // 5 base + 4 extras = 9 máximo
      
      return {
        ...prev,
        attributes: { ...prev.attributes, [attrId]: newValue },
      };
    });
  }, []);

  // Toggle skill
  const toggleSkill = useCallback((skillId: string) => {
    setState(prev => ({
      ...prev,
      trainedSkills: prev.trainedSkills.includes(skillId)
        ? prev.trainedSkills.filter(s => s !== skillId)
        : [...prev.trainedSkills, skillId],
    }));
  }, []);

  // Toggle tag
  const toggleTag = useCallback((tag: string) => {
    setState(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  }, []);

  // Calcular pontos de atributo
  const attributePoints = useMemo(() => {
    const total = Object.values(state.attributes).reduce((sum, v) => sum + v, 0);
    return { used: total - 5, max: 4, remaining: 4 - (total - 5) };
  }, [state.attributes]);

  // Verificar se pode avançar
  const canProceed = useCallback(() => {
    switch (CREATION_STEPS[currentStep].id) {
      case 'basics':
        return state.name.trim().length >= 3;
      case 'class':
        return state.classId && state.origin && 
          (state.classId !== CLASS_IDS.OCULTISTA || state.elementalAffinity);
      case 'attributes':
        return attributePoints.remaining === 0;
      case 'skills':
        return state.trainedSkills.length >= 2;
      case 'review':
        return validation?.isValid ?? false;
      default:
        return false;
    }
  }, [currentStep, state, attributePoints.remaining, validation]);

  // Criar template
  const handleCreate = useCallback(() => {
    const templateData: CharacterTemplateData = {
      origin: state.origin,
      classId: state.classId,
      classTrack: state.classTrack,
      elementalAffinity: state.elementalAffinity || undefined,
      attributes: state.attributes,
      trainedSkills: state.trainedSkills,
      classPowers: [],
      equipment: { weapons: [], items: [] },
      initialRituals: state.initialRituals.length > 0 ? state.initialRituals : undefined,
      schema_version: TEMPLATE_SCHEMA_VERSION,
    };

    const dto: CreateTemplateDto = {
      name: state.name,
      description: state.description || undefined,
      is_public: state.isPublic,
      tags: state.tags,
      difficulty_level: state.difficulty,
      template_data: templateData,
      min_nex: 5,
      max_nex: 99,
    };

    onCreate(dto);
  }, [state, onCreate]);

  // Obter trilhas disponíveis para a classe
  const availableTracks = useMemo(() => {
    if (!state.classId) return [];
    const normalizedClass = state.classId.toLowerCase() as keyof typeof TRACKS_BY_CLASS;
    return TRACKS_BY_CLASS[normalizedClass] || [];
  }, [state.classId]);

  // Renderizar step atual
  const renderStep = () => {
    switch (CREATION_STEPS[currentStep].id) {
      case 'basics':
        return (
          <StepBasics
            name={state.name}
            description={state.description}
            tags={state.tags}
            difficulty={state.difficulty}
            isPublic={state.isPublic}
            onNameChange={(v) => updateState('name', v)}
            onDescriptionChange={(v) => updateState('description', v)}
            onToggleTag={toggleTag}
            onDifficultyChange={(v) => updateState('difficulty', v)}
            onPublicChange={(v) => updateState('isPublic', v)}
          />
        );
      case 'class':
        return (
          <StepClass
            classId={state.classId}
            origin={state.origin}
            classTrack={state.classTrack}
            elementalAffinity={state.elementalAffinity}
            availableTracks={availableTracks}
            onClassChange={(v) => {
              updateState('classId', v);
              updateState('classTrack', null);
              updateState('elementalAffinity', '');
            }}
            onOriginChange={(v) => updateState('origin', v)}
            onTrackChange={(v) => updateState('classTrack', v)}
            onAffinityChange={(v) => updateState('elementalAffinity', v)}
          />
        );
      case 'attributes':
        return (
          <StepAttributes
            attributes={state.attributes}
            points={attributePoints}
            onUpdate={updateAttribute}
          />
        );
      case 'skills':
        return (
          <StepSkills
            selectedSkills={state.trainedSkills}
            origin={state.origin}
            classId={state.classId}
            intellect={state.attributes.intellect}
            onToggle={toggleSkill}
          />
        );
      case 'review':
        return (
          <StepReview
            state={state}
            validation={validation}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-3 font-display text-xl tracking-wider">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-foreground">CRIAR TEMPLATE</span>
              <p className="text-sm font-normal text-muted-foreground mt-0.5">
                Crie um modelo de personagem reutilizável
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="px-6 py-3 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center justify-between">
            {CREATION_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                      index < currentStep
                        ? 'bg-primary text-primary-foreground'
                        : index === currentStep
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {index < currentStep ? <Check className="w-4 h-4" /> : step.icon}
                  </div>
                  <span className={cn(
                    'text-xs mt-1 hidden sm:block',
                    index === currentStep ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}>
                    {step.title}
                  </span>
                </div>
                {index < CREATION_STEPS.length - 1 && (
                  <div className={cn(
                    'h-0.5 w-8 sm:w-12 mx-1 sm:mx-2',
                    index < currentStep ? 'bg-primary' : 'bg-border'
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
            onClick={currentStep === 0 ? onClose : () => setCurrentStep(p => p - 1)}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {currentStep === 0 ? 'Cancelar' : 'Voltar'}
          </Button>

          {currentStep < CREATION_STEPS.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(p => p + 1)}
              disabled={!canProceed()}
              className="gap-2"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={!canProceed() || isSaving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Salvando...' : 'Criar Template'}
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

// Step 1: Informações Básicas
interface StepBasicsProps {
  name: string;
  description: string;
  tags: string[];
  difficulty: TemplateDifficulty;
  isPublic: boolean;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onToggleTag: (tag: string) => void;
  onDifficultyChange: (v: TemplateDifficulty) => void;
  onPublicChange: (v: boolean) => void;
}

function StepBasics({
  name, description, tags, difficulty, isPublic,
  onNameChange, onDescriptionChange, onToggleTag, onDifficultyChange, onPublicChange,
}: StepBasicsProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="font-display text-lg tracking-wider mb-2">INFORMAÇÕES DO TEMPLATE</h3>
        <p className="text-sm text-muted-foreground">
          Defina nome, descrição e tags do seu template
        </p>
      </div>

      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="template-name">Nome do Template *</Label>
        <Input
          id="template-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Ex: Soldado de Linha de Frente"
          maxLength={50}
        />
        <p className="text-xs text-muted-foreground">
          {name.length}/50 caracteres
        </p>
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="template-desc">Descrição</Label>
        <Textarea
          id="template-desc"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Descreva o conceito e estilo de jogo deste template..."
          rows={3}
          maxLength={300}
        />
        <p className="text-xs text-muted-foreground">
          {description.length}/300 caracteres
        </p>
      </div>

      {/* Dificuldade */}
      <div className="space-y-2">
        <Label>Nível de Dificuldade</Label>
        <RadioGroup
          value={difficulty}
          onValueChange={(v) => onDifficultyChange(v as TemplateDifficulty)}
          className="flex gap-4"
        >
          {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
            <div key={level} className="flex items-center gap-2">
              <RadioGroupItem value={level} id={`diff-${level}`} />
              <Label htmlFor={`diff-${level}`} className="cursor-pointer">
                {DIFFICULTY_LABELS[level]}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags (selecione até 4)</Label>
        <div className="flex flex-wrap gap-2">
          {ALL_TEMPLATE_TAGS.map(tag => (
            <Badge
              key={tag}
              variant={tags.includes(tag) ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-colors',
                tags.includes(tag) && 'bg-primary'
              )}
              onClick={() => tags.length < 4 || tags.includes(tag) ? onToggleTag(tag) : null}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Público */}
      <div className="flex items-center gap-2 pt-2">
        <Checkbox
          id="is-public"
          checked={isPublic}
          onCheckedChange={(checked) => onPublicChange(checked === true)}
        />
        <Label htmlFor="is-public" className="cursor-pointer">
          Tornar template público (outros jogadores poderão usar)
        </Label>
      </div>
    </div>
  );
}

// Step 2: Classe e Origem
interface StepClassProps {
  classId: string;
  origin: string;
  classTrack: string | null;
  elementalAffinity: string;
  availableTracks: readonly string[];
  onClassChange: (v: string) => void;
  onOriginChange: (v: string) => void;
  onTrackChange: (v: string | null) => void;
  onAffinityChange: (v: string) => void;
}

function StepClass({
  classId, origin, classTrack, elementalAffinity, availableTracks,
  onClassChange, onOriginChange, onTrackChange, onAffinityChange,
}: StepClassProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="font-display text-lg tracking-wider mb-2">CLASSE E ORIGEM</h3>
        <p className="text-sm text-muted-foreground">
          Escolha a classe, origem e trilha do template
        </p>
      </div>

      {/* Classe */}
      <div className="space-y-2">
        <Label>Classe *</Label>
        <div className="grid grid-cols-3 gap-3">
          {CLASSES.slice(0, 3).map(cls => (
            <button
              key={cls.id}
              onClick={() => onClassChange(cls.id)}
              className={cn(
                'p-4 rounded-lg border-2 transition-all text-center',
                classId === cls.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="font-display text-sm tracking-wider">{cls.name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                PV: {cls.pvBase} | PE: {cls.peBase}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Trilha */}
      {classId && availableTracks.length > 0 && (
        <div className="space-y-2">
          <Label>Trilha de Classe</Label>
          <Select value={classTrack || ''} onValueChange={(v) => onTrackChange(v || null)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma trilha (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhuma trilha</SelectItem>
              {availableTracks.map(track => (
                <SelectItem key={track} value={track}>
                  {track.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Afinidade (Ocultista) */}
      {classId === CLASS_IDS.OCULTISTA && (
        <div className="space-y-2">
          <Label>Afinidade Elemental *</Label>
          <div className="grid grid-cols-5 gap-2">
            {Object.values(ELEMENT_IDS).map(element => (
              <button
                key={element}
                onClick={() => onAffinityChange(element)}
                className={cn(
                  'p-3 rounded-lg border-2 transition-all text-center text-sm',
                  elementalAffinity === element
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                )}
              >
                {element}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Origem */}
      <div className="space-y-2">
        <Label>Origem *</Label>
        <Select value={origin} onValueChange={onOriginChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma origem" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {ORIGINS.map(o => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {origin && (
          <p className="text-xs text-muted-foreground">
            Perícias: {ORIGINS.find(o => o.id === origin)?.skills?.join(', ') || 'A definir'}
          </p>
        )}
      </div>
    </div>
  );
}

// Step 3: Atributos
interface StepAttributesProps {
  attributes: CreationState['attributes'];
  points: { used: number; max: number; remaining: number };
  onUpdate: (attrId: string, delta: number) => void;
}

function StepAttributes({ attributes, points, onUpdate }: StepAttributesProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="font-display text-lg tracking-wider mb-2">DISTRIBUIÇÃO DE ATRIBUTOS</h3>
        <p className="text-sm text-muted-foreground">
          Distribua 4 pontos entre os atributos (máximo 5 cada)
        </p>
      </div>

      {/* Pontos */}
      <div className={cn(
        'flex items-center justify-center gap-2 p-3 rounded-lg',
        points.remaining === 0
          ? 'bg-green-500/10 border border-green-500/30'
          : 'bg-primary/10 border border-primary/30'
      )}>
        <span className="text-sm font-medium">Pontos restantes:</span>
        <Badge variant={points.remaining === 0 ? 'default' : 'outline'}>
          {points.remaining}
        </Badge>
      </div>

      {/* Atributos */}
      <div className="grid gap-3">
        {ATTRIBUTES_CONFIG.map(attr => (
          <div
            key={attr.id}
            className={cn('flex items-center gap-4 p-3 rounded-lg', attr.bgColor)}
          >
            <div className="w-24">
              <div className={cn('font-display text-sm tracking-wider', attr.color)}>
                {attr.abbr}
              </div>
              <div className="text-xs text-muted-foreground">{attr.name}</div>
            </div>
            
            <div className="flex items-center gap-2 flex-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onUpdate(attr.id, -1)}
                disabled={attributes[attr.id as keyof typeof attributes] <= 0}
              >
                <span className="text-lg">−</span>
              </Button>
              
              <div className="w-12 text-center">
                <span className="text-2xl font-bold">
                  {attributes[attr.id as keyof typeof attributes]}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onUpdate(attr.id, 1)}
                disabled={
                  attributes[attr.id as keyof typeof attributes] >= 5 ||
                  points.remaining <= 0
                }
              >
                <span className="text-lg">+</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Step 4: Perícias
interface StepSkillsProps {
  selectedSkills: string[];
  origin: string;
  classId: string;
  intellect: number;
  onToggle: (skillId: string) => void;
}

function StepSkills({ selectedSkills, origin, classId, intellect, onToggle }: StepSkillsProps) {
  const originData = ORIGINS.find(o => o.id === origin);
  const classData = CLASSES.find(c => c.id === classId);
  
  const originSkills = originData?.skills || [];
  const baseSkills = classData?.freeSkillsBase || 1;
  const maxFreeSkills = intellect + baseSkills;
  
  // Perícias da origem são automáticas
  const freeSkillsSelected = selectedSkills.filter(s => !originSkills.includes(s)).length;
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="font-display text-lg tracking-wider mb-2">PERÍCIAS TREINADAS</h3>
        <p className="text-sm text-muted-foreground">
          Selecione {maxFreeSkills} perícias livres (origem: {originSkills.length} automáticas)
        </p>
      </div>

      {/* Info */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div className="text-sm">
          <span className="text-muted-foreground">Perícias livres:</span>
          <span className={cn(
            'ml-2 font-medium',
            freeSkillsSelected === maxFreeSkills ? 'text-green-500' : 'text-primary'
          )}>
            {freeSkillsSelected}/{maxFreeSkills}
          </span>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Total:</span>
          <span className="ml-2 font-medium">{selectedSkills.length + originSkills.length}</span>
        </div>
      </div>

      {/* Perícias da Origem */}
      {originSkills.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">DA ORIGEM (automáticas)</Label>
          <div className="flex flex-wrap gap-2">
            {originSkills.map(skill => (
              <Badge key={skill} variant="secondary" className="cursor-not-allowed opacity-70">
                {SKILL_LABELS[skill] || skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Perícias Livres */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">PERÍCIAS LIVRES</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {VALID_SKILL_IDS.filter(s => s !== 'iniciativa' && !originSkills.includes(s)).map(skill => {
            const isSelected = selectedSkills.includes(skill);
            const canSelect = isSelected || freeSkillsSelected < maxFreeSkills;
            
            return (
              <button
                key={skill}
                onClick={() => canSelect && onToggle(skill)}
                disabled={!canSelect}
                className={cn(
                  'p-2 text-sm rounded-lg border transition-all text-left',
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : canSelect
                    ? 'border-border hover:border-primary/50'
                    : 'border-border opacity-50 cursor-not-allowed'
                )}
              >
                {SKILL_LABELS[skill] || skill}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Step 5: Revisão
interface StepReviewProps {
  state: CreationState;
  validation: TemplateValidationResult | null;
}

function StepReview({ state, validation }: StepReviewProps) {
  const classData = CLASSES.find(c => c.id === state.classId);
  const originData = ORIGINS.find(o => o.id === state.origin);
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="font-display text-lg tracking-wider mb-2">REVISÃO DO TEMPLATE</h3>
        <p className="text-sm text-muted-foreground">
          Confirme as informações antes de criar
        </p>
      </div>

      {/* Status de Validação */}
      {validation && (
        <div className={cn(
          'flex items-center gap-3 p-4 rounded-lg border',
          validation.isValid
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-destructive/10 border-destructive/30'
        )}>
          {validation.isValid ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <XCircle className="w-5 h-5 text-destructive" />
          )}
          <div>
            <div className="font-medium">
              {validation.isValid ? 'Template Válido' : 'Template Inválido'}
            </div>
            {!validation.isValid && (
              <div className="text-sm text-muted-foreground">
                {validation.errors.length} erro(s) encontrado(s)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Erros */}
      {validation && validation.errors.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-destructive">ERROS</Label>
          {validation.errors.map((error, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded bg-destructive/10 text-sm">
              <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <span>{error.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Avisos */}
      {validation && validation.warnings.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-yellow-500">AVISOS</Label>
          {validation.warnings.map((warning, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded bg-yellow-500/10 text-sm">
              <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <span>{warning.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Resumo */}
      <div className="grid gap-4">
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="text-xs text-muted-foreground mb-1">NOME</div>
          <div className="font-medium">{state.name}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">CLASSE</div>
            <div className="font-medium">{classData?.name || '-'}</div>
            {state.classTrack && (
              <div className="text-sm text-muted-foreground">
                Trilha: {state.classTrack.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </div>
            )}
          </div>
          
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">ORIGEM</div>
            <div className="font-medium">{originData?.name || '-'}</div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/50">
          <div className="text-xs text-muted-foreground mb-2">ATRIBUTOS</div>
          <div className="flex gap-4">
            {ATTRIBUTES_CONFIG.map(attr => (
              <div key={attr.id} className="text-center">
                <div className={cn('font-display text-xs', attr.color)}>{attr.abbr}</div>
                <div className="text-lg font-bold">
                  {state.attributes[attr.id as keyof typeof state.attributes]}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/50">
          <div className="text-xs text-muted-foreground mb-2">
            PERÍCIAS ({state.trainedSkills.length + (originData?.skills?.length || 0)} total)
          </div>
          <div className="flex flex-wrap gap-1">
            {[...(originData?.skills || []), ...state.trainedSkills].map(skill => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {SKILL_LABELS[skill] || skill}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

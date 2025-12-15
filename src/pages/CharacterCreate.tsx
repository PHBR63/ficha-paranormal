import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StepConcept } from '@/components/character/StepConcept';
import { StepNex } from '@/components/character/StepNex';
import { StepAttributes } from '@/components/character/StepAttributes';
import { StepOrigin } from '@/components/character/StepOrigin';
import { StepClass } from '@/components/character/StepClass';
import { StepTrack } from '@/components/character/StepTrack';
import { StepRituals } from '@/components/character/StepRituals';
import { StepSkills } from '@/components/character/StepSkills';
import { StepAbilities } from '@/components/character/StepAbilities';
import { StepReview } from '@/components/character/StepReview';
import { CharacterCreationStepper } from '@/components/character/CharacterCreationStepper';
import { StatsPreviewWidget } from '@/components/character/StatsPreviewWidget';
import { RestoreDraftDialog } from '@/components/character/RestoreDraftDialog';
import { ExitConfirmDialog } from '@/components/character/ExitConfirmDialog';
import { 
  ORIGINS, 
  CLASSES, 
  calculateDerivedStats, 
  calculateDefense,
  getOcultistRituals,
  getAbilityChoicesByNex,
  getExtraSkillsByNex
} from '@/lib/character-data';
import { rebuildCharacterSheet, buildStateToFormData, CLASS_PROFICIENCIES, getClassSkillRules } from '@/lib/character-builder-engine';
import { getCoreAbilities, getChoosableAbilities } from '@/lib/class-abilities';
import { useCharacterAutoSave, loadCharacterDraft, clearCharacterDraft } from '@/hooks/useCharacterAutoSave';
import confetti from 'canvas-confetti';

export type CharacterFormData = {
  // Conceito
  name: string;
  playerName: string;
  concept: string;
  age: number | null;
  gender: string;
  appearance: string;
  personality: string;
  
  // Photo
  photoUrl: string | null;
  photoFile: File | null;
  
  // Core
  origin: string;
  characterClass: string;
  nex: number;
  
  // Atributos
  attributes: {
    agility: number;
    strength: number;
    intellect: number;
    presence: number;
    vigor: number;
  };
  
  // Perícias
  originSkills: string[];
  classSkillChoices: Record<string, string>;
  freeSkills: string[];
  conflictResolutions: Record<string, string>;
  skills: Record<string, number>;
  
  // Outros
  powers: Array<{ name: string; description: string }>;
  background: string;
  proficiencies: string[];
  abilities: string[];
  classTrack: string;
  trackAbilities: string[];
  
  // Rituais (apenas para Ocultistas)
  rituals: string[];
};

// Base steps - rituais será inserido dinamicamente para Ocultistas
const BASE_STEPS = [
  { id: 'concept', title: 'CONCEITO' },
  { id: 'nex', title: 'NEX' },
  { id: 'attributes', title: 'ATRIBUTOS' },
  { id: 'origin', title: 'ORIGEM' },
  { id: 'class', title: 'CLASSE' },
  { id: 'track', title: 'TRILHA' },
  // Rituais é inserido aqui para Ocultistas
  { id: 'skills', title: 'PERÍCIAS' },
  { id: 'abilities', title: 'HABILIDADES' },
  { id: 'review', title: 'REVISÃO' },
];

const initialFormData: CharacterFormData = {
  name: '',
  playerName: '',
  concept: '',
  age: null,
  gender: '',
  appearance: '',
  personality: '',
  photoUrl: null,
  photoFile: null,
  origin: '',
  characterClass: '',
  nex: 5,
  attributes: {
    agility: 1,
    strength: 1,
    intellect: 1,
    presence: 1,
    vigor: 1,
  },
  originSkills: [],
  classSkillChoices: {},
  freeSkills: [],
  conflictResolutions: {},
  skills: {},
  powers: [],
  background: '',
  proficiencies: [],
  abilities: [],
  classTrack: '',
  trackAbilities: [],
  rituals: [],
};

export default function CharacterCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CharacterFormData>(initialFormData);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [draftData, setDraftData] = useState<ReturnType<typeof loadCharacterDraft>>(null);

  // Auto-save hook
  useCharacterAutoSave(formData, currentStep, formData.name.length > 0);

  // Check for draft on mount
  useEffect(() => {
    const draft = loadCharacterDraft();
    if (draft && draft.formData.name) {
      setDraftData(draft);
      setShowRestoreDialog(true);
    }
  }, []);

  const handleRestoreDraft = useCallback(() => {
    if (draftData) {
      setFormData({ ...draftData.formData, photoFile: null });
      setCurrentStep(draftData.currentStep);
      toast({
        title: 'Rascunho restaurado',
        description: 'Seu progresso anterior foi recuperado.',
      });
    }
    setShowRestoreDialog(false);
  }, [draftData, toast]);

  const handleDiscardDraft = useCallback(() => {
    clearCharacterDraft();
    setShowRestoreDialog(false);
  }, []);

  // Referência para o NEX anterior (para detectar mudanças)
  const previousNexRef = useRef(formData.nex);

  const updateFormData = useCallback((updates: Partial<CharacterFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Efeito para reset automático quando o NEX mudar
  useEffect(() => {
    const previousNex = previousNexRef.current;
    const currentNex = formData.nex;

    // Se o NEX mudou, verificar se precisa resetar seleções
    if (previousNex !== currentNex) {
      let needsUpdate = false;
      const updates: Partial<CharacterFormData> = {};

      // Verificar rituais (apenas Ocultista)
      if (formData.characterClass === 'Ocultista') {
        const ritualsAllowed = getOcultistRituals(currentNex);
        if (ritualsAllowed && formData.rituals.length > ritualsAllowed.count) {
          // Manter apenas os primeiros rituais permitidos
          updates.rituals = formData.rituals.slice(0, ritualsAllowed.count);
          needsUpdate = true;
          toast({
            title: 'Rituais ajustados',
            description: `O novo NEX permite apenas ${ritualsAllowed.count} rituais. Alguns foram removidos.`,
          });
        }
      }

      // Verificar habilidades opcionais
      const maxAbilities = getAbilityChoicesByNex(currentNex);
      const currentAbilities = formData.abilities.length;
      if (currentAbilities > maxAbilities) {
        updates.abilities = formData.abilities.slice(0, maxAbilities);
        needsUpdate = true;
        toast({
          title: 'Habilidades ajustadas',
          description: `O novo NEX permite apenas ${maxAbilities} habilidades opcionais. Algumas foram removidas.`,
        });
      }

      // Verificar perícias livres
      if (formData.characterClass) {
        const classRules = getClassSkillRules(formData.characterClass, formData.attributes.intellect);
        const nexExtraSkills = getExtraSkillsByNex(currentNex);
        const totalAllowed = classRules.freePoints + nexExtraSkills;
        
        if (formData.freeSkills.length > totalAllowed) {
          updates.freeSkills = formData.freeSkills.slice(0, totalAllowed);
          needsUpdate = true;
          toast({
            title: 'Perícias ajustadas',
            description: `O novo NEX permite apenas ${totalAllowed} perícias livres. Algumas foram removidas.`,
          });
        }
      }

      // Aplicar atualizações se necessário
      if (needsUpdate) {
        setFormData(prev => ({ ...prev, ...updates }));
      }

      // Atualizar referência
      previousNexRef.current = currentNex;
    }
  }, [formData.nex, formData.characterClass, formData.rituals.length, formData.abilities.length, formData.freeSkills.length, formData.attributes.intellect, toast]);

  // Rebuild character sheet state
  const buildState = useMemo(() => ({
    ...formData,
  }), [formData]);
  
  const buildResult = useMemo(() => rebuildCharacterSheet(buildState), [buildState]);

  // Steps dinâmicos - inclui Rituais apenas para Ocultistas
  const isOcultist = formData.characterClass === 'Ocultista';
  const STEPS = useMemo(() => {
    if (isOcultist) {
      // Insere o step de Rituais após Trilha (índice 5 no BASE_STEPS)
      const steps = [...BASE_STEPS];
      steps.splice(6, 0, { id: 'rituals', title: 'RITUAIS' });
      return steps;
    }
    return BASE_STEPS;
  }, [isOcultist]);

  // Obter quantidade de rituais permitidos para validação
  const ocultistClass = CLASSES.find(c => c.id === 'Ocultista');
  const ritualsPerNex = (ocultistClass as any)?.ritualsPerNex || {};
  const requiredRituals = ritualsPerNex[formData.nex]?.count || 0;

  // Derived stats for preview
  const previewStats = useMemo(() => {
    if (!formData.characterClass) {
      return { hp: 0, pe: 0, san: 0, defense: 10, movement: 9 };
    }
    const stats = calculateDerivedStats(
      formData.characterClass,
      formData.attributes.vigor,
      formData.attributes.presence,
      formData.nex,
      formData.origin
    );
    return {
      ...stats,
      defense: calculateDefense(formData.attributes.agility),
      movement: 9,
    };
  }, [formData.characterClass, formData.attributes, formData.nex, formData.origin]);

  // Calcula completed steps baseado no step ID ao invés de índice fixo
  const completedSteps = useMemo(() => {
    const completed: number[] = [];
    
    STEPS.forEach((step, index) => {
      switch (step.id) {
        case 'concept':
          if (formData.name.trim().length >= 2) completed.push(index);
          break;
        case 'nex':
          // Sempre completo (tem valor padrão)
          completed.push(index);
          break;
        case 'attributes':
          const total = Object.values(formData.attributes).reduce((a, b) => a + b, 0);
          if (total === 9 || total === 10) completed.push(index);
          break;
        case 'origin':
          if (formData.origin !== '') completed.push(index);
          break;
        case 'class':
          if (formData.characterClass !== '') completed.push(index);
          break;
        case 'track':
          if (formData.classTrack !== '') completed.push(index);
          break;
        case 'rituals':
          // Completo se selecionou a quantidade correta de rituais
          if (formData.rituals.length === requiredRituals) completed.push(index);
          break;
        case 'skills':
          if (buildResult.pendingChoices.length === 0 && buildResult.pendingConflicts.length === 0 && formData.characterClass) {
            completed.push(index);
          }
          break;
        case 'abilities':
          // Sempre completo se classe foi selecionada (escolhas são opcionais)
          if (formData.characterClass !== '') completed.push(index);
          break;
        case 'review':
          // Verifica se pode finalizar e, se for Ocultista, se rituais estão completos
          const ritualsOk = !isOcultist || formData.rituals.length === requiredRituals;
          if (buildResult.canFinalize && formData.classTrack !== '' && ritualsOk) {
            completed.push(index);
          }
          break;
      }
    });
    
    return completed;
  }, [formData, buildResult, STEPS, requiredRituals, isOcultist]);

  const canProceed = useCallback(() => {
    return completedSteps.includes(currentStep);
  }, [completedSteps, currentStep]);

  const canNavigateToStep = useCallback((step: number) => {
    // Can always go back
    if (step < currentStep) return true;
    // Can go forward if all previous steps are complete
    for (let i = 0; i < step; i++) {
      if (!completedSteps.includes(i)) return false;
    }
    return true;
  }, [currentStep, completedSteps]);

  const handleStepClick = useCallback((step: number) => {
    if (canNavigateToStep(step)) {
      setCurrentStep(step);
    }
  }, [canNavigateToStep]);

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, STEPS.length]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleExitRequest = useCallback(() => {
    if (formData.name) {
      setShowExitDialog(true);
    } else {
      navigate('/dashboard');
    }
  }, [formData.name, navigate]);

  const handleExitConfirm = useCallback(() => {
    setShowExitDialog(false);
    navigate('/dashboard');
  }, [navigate]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);

    try {
      // Upload photo to Supabase Storage if exists
      let photoUrl: string | null = null;
      
      if (formData.photoFile) {
        const fileExt = formData.photoFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('character-avatars')
          .upload(fileName, formData.photoFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Error uploading photo:', uploadError);
          toast({
            title: 'Aviso',
            description: 'Não foi possível fazer upload da foto, mas o personagem será salvo.',
            variant: 'destructive',
          });
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('character-avatars')
            .getPublicUrl(fileName);
          
          photoUrl = publicUrl;
        }
      }

      const derivedStats = calculateDerivedStats(
        formData.characterClass,
        formData.attributes.vigor,
        formData.attributes.presence,
        formData.nex,
        formData.origin
      );

      const originData = ORIGINS.find(o => o.id === formData.origin);
      const powers = [
        ...(originData?.powers || []).map(p => ({ 
          name: p, 
          description: originData?.powerDescription || '' 
        })),
        ...formData.powers
      ];

      const allSkills = buildStateToFormData(buildState);
      const proficiencies = CLASS_PROFICIENCIES[formData.characterClass] || [];
      
      // Combine core abilities with user-selected abilities and track abilities
      const coreAbilities = getCoreAbilities(formData.characterClass, formData.nex);
      const choosableAbilities = getChoosableAbilities(formData.characterClass, formData.nex);
      const allAbilities = [
        ...coreAbilities.map(a => a.name),
        ...formData.abilities
          .filter(id => choosableAbilities.some(a => a.id === id))
          .map(id => choosableAbilities.find(a => a.id === id)?.name || id),
        // Inclui habilidades da trilha desbloqueadas pelo NEX atual
        ...formData.trackAbilities
      ];

      const { error } = await supabase.from('characters').insert({
        user_id: user.id,
        name: formData.name,
        player_name: formData.playerName || null,
        origin: formData.origin,
        class: formData.characterClass,
        nex: formData.nex,
        agility: formData.attributes.agility,
        strength: formData.attributes.strength,
        intellect: formData.attributes.intellect,
        presence: formData.attributes.presence,
        vigor: formData.attributes.vigor,
        hp_current: derivedStats.hp,
        hp_max: derivedStats.hp,
        pe_current: derivedStats.pe,
        pe_max: derivedStats.pe,
        san_current: derivedStats.san,
        san_max: derivedStats.san,
        defense: calculateDefense(formData.attributes.agility),
        skills: allSkills,
        powers: powers,
        background: formData.background || null,
        concept: formData.concept || null,
        age: formData.age,
        gender: formData.gender || null,
        appearance: formData.appearance || null,
        personality: formData.personality || null,
        photo_url: photoUrl,
        movement: 9,
        proficiencies: proficiencies,
        abilities: allAbilities,
        class_track: formData.classTrack || null,
        rituals: formData.rituals || [],
      });

      if (error) throw error;

      // Clear draft after successful save
      clearCharacterDraft();

      // Celebration effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#ec4899', '#6366f1'],
      });

      toast({
        title: 'Agente registrado!',
        description: `${formData.name} foi adicionado ao sistema da Ordo Realitas.`,
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    const stepVariants = {
      enter: { opacity: 0, x: 20 },
      center: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
    };

    // Usar step.id para renderizar o componente correto
    const currentStepId = STEPS[currentStep]?.id;
    
    const content = (() => {
      switch (currentStepId) {
        case 'concept':
          return <StepConcept formData={formData} updateFormData={updateFormData} />;
        case 'nex':
          return <StepNex formData={formData} updateFormData={updateFormData} />;
        case 'attributes':
          return <StepAttributes formData={formData} updateFormData={updateFormData} />;
        case 'origin':
          return <StepOrigin formData={formData} updateFormData={updateFormData} />;
        case 'class':
          return <StepClass formData={formData} updateFormData={updateFormData} />;
        case 'track':
          return <StepTrack formData={formData} updateFormData={updateFormData} />;
        case 'rituals':
          return <StepRituals formData={formData} updateFormData={updateFormData} />;
        case 'skills':
          return <StepSkills formData={formData} updateFormData={updateFormData} buildResult={buildResult} />;
        case 'abilities':
          return <StepAbilities formData={formData} updateFormData={updateFormData} />;
        case 'review':
          return <StepReview formData={formData} buildResult={buildResult} updateFormData={updateFormData} onStepClick={handleStepClick} />;
        default:
          return null;
      }
    })();

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleExitRequest}
              className="text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="font-display text-xl tracking-wider">NOVO AGENTE</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Stepper */}
        <div className="mb-8">
          <CharacterCreationStepper
            steps={STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
            canNavigate={canNavigateToStep}
          />
        </div>

        {/* Step content */}
        <div className="ordo-panel p-6 mb-6">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="font-display tracking-wider"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            ANTERIOR
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="font-display tracking-wider"
            >
              PRÓXIMO
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={saving || !buildResult.canFinalize}
              className="font-display tracking-wider bg-primary hover:bg-primary/90"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              FINALIZAR CADASTRO
            </Button>
          )}
        </div>
      </main>

      {/* Stats Preview Widget */}
      <StatsPreviewWidget
        hp={previewStats.hp}
        pe={previewStats.pe}
        san={previewStats.san}
        defense={previewStats.defense}
        movement={previewStats.movement}
        characterClass={formData.characterClass}
        show={currentStep >= 1 && currentStep <= 4 && !!formData.characterClass}
      />

      {/* Dialogs */}
      <RestoreDraftDialog
        open={showRestoreDialog}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
        characterName={draftData?.formData.name}
        savedAt={draftData?.savedAt}
      />

      <ExitConfirmDialog
        open={showExitDialog}
        onConfirm={handleExitConfirm}
        onCancel={() => setShowExitDialog(false)}
      />
    </div>
  );
}

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Particles } from '@/components/ui/particles';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { useThemeColors } from '@/hooks/useThemeColors';
import { StepConcept } from '@/components/character/StepConcept';
import { StepNex } from '@/components/character/StepNex';
import { StepPatent } from '@/components/character/StepPatent';
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
import { CreationHelpButton } from '@/components/character/CreationHelpModal';
import { 
  ORIGINS, 
  CLASSES, 
  calculateDerivedStats, 
  calculateDefense,
  getOcultistRituals,
  getAbilityChoicesByNex,
  getExtraSkillsByNex
} from '@/lib/character-data';
import { rebuildCharacterSheet, buildStateToFormData, CLASS_PROFICIENCIES, getClassSkillRules, validateAttributes } from '@/lib/character-builder-engine';
import { getCoreAbilities, getChoosableAbilities } from '@/lib/class-abilities';
import { useCharacterAutoSave, loadCharacterDraft, clearCharacterDraft } from '@/hooks/useCharacterAutoSave';
import { validateCharacter } from '@/lib/character-validation';
import { CORE_ORIGIN_IDS } from '@/lib/constants/game-ids';
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
  patent: string; // Patente selecionada manualmente (independente do NEX)
  
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
  
  // Poder paranormal da origem (Cultista Arrependido)
  originParanormalPower: string | null;
};

// Base steps - rituais será inserido dinamicamente para Ocultistas
const BASE_STEPS = [
  { id: 'concept', title: 'CONCEITO' },
  { id: 'nex', title: 'NEX' },
  { id: 'patent', title: 'PATENTE' }, // Novo step de patente independente
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
  patent: 'Recruta', // Patente padrão
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
  originParanormalPower: null,
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

  // Derived stats for preview - se monta progressivamente durante a criação
  const previewStats = useMemo(() => {
    // DEF e MOV podem ser calculados desde os atributos
    const defense = calculateDefense(formData.attributes.agility);
    const movement = formData.origin === CORE_ORIGIN_IDS.ATLETA ? 12 : 9;
    
    // PV, PE, SAN só podem ser calculados com classe
    if (!formData.characterClass) {
      return { hp: null, pe: null, san: null, defense, movement };
    }
    
    const stats = calculateDerivedStats(
      formData.characterClass,
      formData.attributes.vigor,
      formData.attributes.presence,
      formData.nex,
      formData.origin,
      formData.abilities
    );
    return {
      ...stats,
      defense,
      movement,
    };
  }, [formData.characterClass, formData.attributes, formData.nex, formData.origin, formData.abilities]);

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
        case 'patent':
          // Sempre completo (tem valor padrão)
          completed.push(index);
          break;
        case 'attributes':
          // Usa validateAttributes do engine para considerar NEX e regra do zero
          const attrValidation = validateAttributes(formData.attributes, formData.nex);
          // Válido se: sem erros, todos os pontos usados, e no máximo 1 atributo em 0
          if (attrValidation.valid && attrValidation.remainingPoints === 0) {
            completed.push(index);
          }
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
    
    // Validar dados do personagem antes de salvar
    const validation = validateCharacter({
      name: formData.name,
      class: formData.characterClass,
      class_track: formData.classTrack,
      origin: formData.origin,
      nex: formData.nex,
    });

    if (!validation.valid) {
      toast({
        title: 'Dados inválidos',
        description: validation.errors.join('\n'),
        variant: 'destructive',
      });
      return;
    }

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

      // Monta array de poderes paranormais (Cultista Arrependido)
      const paranormalPowers = formData.originParanormalPower 
        ? [{ id: formData.originParanormalPower, source: 'origin' }] 
        : [];

      const { error } = await supabase.from('characters').insert({
        user_id: user.id,
        name: formData.name,
        player_name: formData.playerName || null,
        origin: formData.origin,
        class: formData.characterClass,
        nex: formData.nex,
        patent: formData.patent || 'Recruta', // Patente selecionada manualmente
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
        paranormal_powers: paranormalPowers,
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
        case 'patent':
          return <StepPatent formData={formData} updateFormData={updateFormData} />;
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

  const themeColors = useThemeColors();

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0 relative overflow-hidden">
      {/* Atmospheric Effects - Dynamic */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <FlickeringGrid 
          className="absolute inset-0 opacity-[0.03]"
          squareSize={3}
          gridGap={8}
          flickerChance={0.02}
          color={`rgb(${themeColors.rgb})`}
        />
        <Particles
          className="absolute inset-0"
          quantity={25}
          staticity={40}
          color={themeColors.primary}
          size={0.4}
        />
        {/* Mist - Dynamic */}
        <div 
          className="absolute inset-0 bg-gradient-to-t via-transparent to-transparent"
          style={{ 
            backgroundImage: `linear-gradient(to top, ${themeColors.primary}10, transparent, transparent)` 
          }}
        />
        {/* Scan lines - Dynamic */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${themeColors.primary}18 2px, ${themeColors.primary}18 4px)`,
          }}
        />
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      </div>

      {/* Header - Responsivo */}
      <header className="border-b border-border bg-card/80 sticky top-0 z-30 backdrop-blur-md">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleExitRequest}
              className="text-muted-foreground px-2 sm:px-3"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Voltar</span>
            </Button>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <h1 className="font-display text-lg sm:text-xl tracking-wider text-primary">NOVO AGENTE</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl relative z-10">
        {/* Stepper */}
        <div className="mb-4 sm:mb-8">
          <CharacterCreationStepper
            steps={STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
            canNavigate={canNavigateToStep}
          />
        </div>

        {/* Step content */}
        <div className="ordo-panel p-3 sm:p-6 mb-4 sm:mb-6">
          {renderStep()}
        </div>

        {/* Navigation - Desktop */}
        <div className="hidden sm:flex justify-between">
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

        {/* Navigation - Mobile (Fixed bottom) */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur-sm border-t border-border z-40 flex justify-between gap-2">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="font-display tracking-wider flex-1 text-xs h-11"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            ANTERIOR
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="font-display tracking-wider flex-1 text-xs h-11"
            >
              PRÓXIMO
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={saving || !buildResult.canFinalize}
              className="font-display tracking-wider flex-1 text-xs h-11 bg-primary hover:bg-primary/90"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Check className="w-4 h-4 mr-1" />
              )}
              FINALIZAR
            </Button>
          )}
        </div>
      </main>

      {/* Stats Preview Widget - Aparece a partir do step de atributos e vai se montando */}
      <StatsPreviewWidget
        hp={previewStats.hp}
        pe={previewStats.pe}
        san={previewStats.san}
        defense={previewStats.defense}
        movement={previewStats.movement}
        characterClass={formData.characterClass}
        show={currentStep >= 3 && currentStep < STEPS.length - 1}
        vigor={formData.attributes.vigor}
        presence={formData.attributes.presence}
        agility={formData.attributes.agility}
        nex={formData.nex}
        originId={formData.origin}
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

      {/* Botão flutuante de ajuda - abre modal com glossário e fórmulas */}
      <CreationHelpButton />
    </div>
  );
}

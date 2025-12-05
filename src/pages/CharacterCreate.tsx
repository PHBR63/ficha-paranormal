import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { StepBasicInfo } from '@/components/character/StepBasicInfo';
import { StepAttributes } from '@/components/character/StepAttributes';
import { StepOrigin } from '@/components/character/StepOrigin';
import { StepClass } from '@/components/character/StepClass';
import { StepSkills } from '@/components/character/StepSkills';
import { StepReview } from '@/components/character/StepReview';
import { ORIGINS, CLASSES, calculateDerivedStats } from '@/lib/character-data';

export type CharacterFormData = {
  name: string;
  playerName: string;
  origin: string;
  characterClass: string;
  nex: number;
  attributes: {
    agility: number;
    strength: number;
    intellect: number;
    presence: number;
    vigor: number;
  };
  skills: Record<string, number>;
  powers: Array<{ name: string; description: string }>;
  background: string;
};

const STEPS = [
  { id: 'basic', title: 'INFORMAÇÕES' },
  { id: 'attributes', title: 'ATRIBUTOS' },
  { id: 'origin', title: 'ORIGEM' },
  { id: 'class', title: 'CLASSE' },
  { id: 'skills', title: 'PERÍCIAS' },
  { id: 'review', title: 'REVISÃO' },
];

export default function CharacterCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<CharacterFormData>({
    name: '',
    playerName: '',
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
    skills: {},
    powers: [],
    background: '',
  });

  const updateFormData = (updates: Partial<CharacterFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return formData.name.trim().length >= 2;
      case 1: {
        const total = Object.values(formData.attributes).reduce((a, b) => a + b, 0);
        return total === 9; // 4 points distributed (base 5 + 4 = 9)
      }
      case 2: return formData.origin !== '';
      case 3: return formData.characterClass !== '';
      case 4: return true; // Skills are optional at creation
      case 5: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);

    try {
      const derivedStats = calculateDerivedStats(
        formData.characterClass,
        formData.attributes.vigor,
        formData.attributes.presence,
        formData.nex
      );

      const originData = ORIGINS.find(o => o.id === formData.origin);
      const powers = [
        ...(originData?.powers || []).map(p => ({ name: p, description: '' })),
        ...formData.powers
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
        defense: 10 + formData.attributes.agility,
        skills: formData.skills,
        powers: powers,
        background: formData.background || null,
      });

      if (error) throw error;

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
    switch (currentStep) {
      case 0:
        return <StepBasicInfo formData={formData} updateFormData={updateFormData} />;
      case 1:
        return <StepAttributes formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <StepOrigin formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <StepClass formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <StepSkills formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <StepReview formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
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
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {STEPS.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}
              >
                <div 
                  className={`
                    w-8 h-8 rounded-sm flex items-center justify-center font-display text-sm
                    ${index < currentStep 
                      ? 'bg-primary text-primary-foreground' 
                      : index === currentStep 
                        ? 'bg-primary/20 border border-primary text-primary' 
                        : 'bg-muted text-muted-foreground'}
                  `}
                >
                  {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                {index < STEPS.length - 1 && (
                  <div 
                    className={`flex-1 h-0.5 mx-2 ${
                      index < currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="font-display text-lg tracking-wider text-primary">
              {STEPS[currentStep].title}
            </p>
            <p className="text-sm text-muted-foreground">
              Passo {currentStep + 1} de {STEPS.length}
            </p>
          </div>
        </div>

        {/* Step content */}
        <div className="ordo-panel p-6 mb-6 animate-fade-in">
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
              disabled={saving}
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
    </div>
  );
}

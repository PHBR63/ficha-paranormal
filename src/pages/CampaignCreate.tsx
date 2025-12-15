// Página de criação de campanha com wizard guiado
// Permite ao mestre criar uma nova mesa de RPG passo a passo

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';

// Steps do wizard
import { StepCampaignInfo } from '@/components/campaign/wizard/StepCampaignInfo';
import { StepCampaignSettings } from '@/components/campaign/wizard/StepCampaignSettings';
import { StepInitialSession } from '@/components/campaign/wizard/StepInitialSession';
import { StepInvitePlayers } from '@/components/campaign/wizard/StepInvitePlayers';
import { StepCampaignReview } from '@/components/campaign/wizard/StepCampaignReview';

// Tipagem dos dados do formulário
export interface CampaignFormData {
  // Step 1: Info básica
  name: string;
  description: string;
  coverImageUrl: string;
  
  // Step 2: Configurações
  mode: 'campaign' | 'oneshot' | 'sandbox';
  theme: 'paranormal' | 'cosmic' | 'dark' | 'mystery';
  allowPlayerNotes: boolean;
  sharedDiceRolls: boolean;
  houseRules: string[];
  
  // Step 3: Sessão inicial
  firstSessionDate: Date | null;
  firstSessionTime: string;
  sessionDuration: number; // em horas
  
  // Step 4: Convite (gerado após criação)
  inviteCode: string;
}

// Definição dos steps
const STEPS = [
  { id: 'info', title: 'Informações', description: 'Nome e descrição da campanha' },
  { id: 'settings', title: 'Configurações', description: 'Modo de jogo e regras' },
  { id: 'session', title: 'Primeira Sessão', description: 'Agende o início' },
  { id: 'invite', title: 'Convite', description: 'Gere o código de convite' },
  { id: 'review', title: 'Revisão', description: 'Confirme e crie' },
];

export default function CampaignCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estado do wizard
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  
  // Estado do formulário
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    coverImageUrl: '',
    mode: 'campaign',
    theme: 'paranormal',
    allowPlayerNotes: true,
    sharedDiceRolls: true,
    houseRules: [],
    firstSessionDate: null,
    firstSessionTime: '20:00',
    sessionDuration: 4,
    inviteCode: '',
  });
  
  // Atualiza campos do formulário
  const updateFormData = (updates: Partial<CampaignFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };
  
  // Gera código de convite aleatório
  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };
  
  // Validação por step
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0: // Info
        return formData.name.trim().length >= 3;
      case 1: // Settings
        return true; // Sempre válido, valores default
      case 2: // Session
        return true; // Opcional
      case 3: // Invite
        return formData.inviteCode.length > 0;
      case 4: // Review
        return true;
      default:
        return false;
    }
  };
  
  // Navegação
  const goToNextStep = () => {
    if (currentStep < STEPS.length - 1 && isStepValid(currentStep)) {
      // Se estamos indo para o step de convite, gera o código
      if (currentStep === 2 && !formData.inviteCode) {
        updateFormData({ inviteCode: generateInviteCode() });
      }
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  // Criação da campanha
  const handleCreateCampaign = async () => {
    if (!user) return;
    
    setIsCreating(true);
    try {
      // 1. Cria a campanha
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          cover_image_url: formData.coverImageUrl || null,
          master_id: user.id,
          settings: {
            mode: formData.mode,
            theme: formData.theme,
            allowPlayerNotes: formData.allowPlayerNotes,
            sharedDiceRolls: formData.sharedDiceRolls,
            houseRules: formData.houseRules,
          },
        })
        .select()
        .single();
        
      if (campaignError) throw campaignError;
      
      setCampaignId(campaign.id);
      
      // 2. Cria o código de convite
      const { error: inviteError } = await supabase
        .from('campaign_invites')
        .insert({
          campaign_id: campaign.id,
          invite_code: formData.inviteCode,
          created_by: user.id,
          max_uses: null, // Sem limite
        });
        
      if (inviteError) throw inviteError;
      
      // 3. Se tiver sessão inicial, cria
      if (formData.firstSessionDate) {
        const scheduledAt = new Date(formData.firstSessionDate);
        const [hours, minutes] = formData.firstSessionTime.split(':').map(Number);
        scheduledAt.setHours(hours, minutes, 0, 0);
        
        await supabase
          .from('campaign_sessions')
          .insert({
            campaign_id: campaign.id,
            session_number: 1,
            title: 'Sessão 1',
            scheduled_at: scheduledAt.toISOString(),
            status: 'scheduled',
          });
      }
      
      toast({
        title: 'Campanha criada com sucesso!',
        description: `"${campaign.name}" está pronta. Compartilhe o código ${formData.inviteCode} com seus jogadores.`,
      });
      
      // Redireciona para a campanha
      navigate(`/campaigns/${campaign.id}`);
      
    } catch (error: any) {
      console.error('Erro ao criar campanha:', error);
      toast({
        title: 'Erro ao criar campanha',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  // Renderiza o step atual
  const renderCurrentStep = () => {
    const props = { formData, updateFormData };
    
    switch (currentStep) {
      case 0:
        return <StepCampaignInfo {...props} />;
      case 1:
        return <StepCampaignSettings {...props} />;
      case 2:
        return <StepInitialSession {...props} />;
      case 3:
        return <StepInvitePlayers {...props} />;
      case 4:
        return <StepCampaignReview {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/campaigns">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="font-display text-2xl tracking-wider">CRIAR CAMPANHA</h1>
          </div>
        </div>
      </header>
      
      {/* Progress Steps */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {STEPS.map((step, index) => (
              <div 
                key={step.id}
                className="flex items-center"
              >
                {/* Step indicator */}
                <div className="flex flex-col items-center">
                  <div 
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-display text-lg
                      transition-all duration-300
                      ${index < currentStep 
                        ? 'bg-primary text-primary-foreground' 
                        : index === currentStep
                          ? 'bg-primary/20 text-primary border-2 border-primary'
                          : 'bg-muted text-muted-foreground'
                      }
                    `}
                  >
                    {index < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={`
                    text-xs mt-2 font-medium hidden sm:block
                    ${index <= currentStep ? 'text-foreground' : 'text-muted-foreground'}
                  `}>
                    {step.title}
                  </span>
                </div>
                
                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div 
                    className={`
                      w-12 sm:w-20 h-0.5 mx-2
                      transition-colors duration-300
                      ${index < currentStep ? 'bg-primary' : 'bg-muted'}
                    `}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderCurrentStep()}
            </motion.div>
          </AnimatePresence>
          
          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={goToPreviousStep}
              disabled={currentStep === 0}
              className="font-display tracking-wider"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              ANTERIOR
            </Button>
            
            {currentStep < STEPS.length - 1 ? (
              <Button
                onClick={goToNextStep}
                disabled={!isStepValid(currentStep)}
                className="font-display tracking-wider"
              >
                PRÓXIMO
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCreateCampaign}
                disabled={isCreating || !isStepValid(currentStep)}
                className="font-display tracking-wider bg-primary hover:bg-primary/90"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    CRIANDO...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    CRIAR CAMPANHA
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

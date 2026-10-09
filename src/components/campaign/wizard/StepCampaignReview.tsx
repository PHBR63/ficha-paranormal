// Step 5: Revisão final
// Mostra todos os dados antes de criar a campanha

import { Badge } from '@/components/ui/badge';
import { 
  Scroll, 
  Sparkles, 
  BookOpen,
  Moon,
  Skull,
  Search,
  Calendar,
  Clock,
  Users,
  FileText,
  Dice6,
  CheckCircle2
} from '@/components/icons/ordem-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CampaignFormData } from '@/pages/CampaignCreate';

interface StepCampaignReviewProps {
  formData: CampaignFormData;
  updateFormData: (updates: Partial<CampaignFormData>) => void;
}

// Labels e ícones para modo
const MODE_INFO = {
  campaign: { label: 'Campanha', icon: Scroll },
  oneshot: { label: 'One-Shot', icon: Sparkles },
  sandbox: { label: 'Sandbox', icon: BookOpen },
};

// Labels e ícones para tema
const THEME_INFO = {
  paranormal: { label: 'Paranormal', icon: Sparkles, color: 'text-primary' },
  cosmic: { label: 'Horror Cósmico', icon: Moon, color: 'text-blue-400' },
  dark: { label: 'Dark Fantasy', icon: Skull, color: 'text-red-400' },
  mystery: { label: 'Mistério', icon: Search, color: 'text-amber-400' },
};

export function StepCampaignReview({ formData }: StepCampaignReviewProps) {
  const modeInfo = MODE_INFO[formData.mode];
  const themeInfo = THEME_INFO[formData.theme];
  const ModeIcon = modeInfo.icon;
  const ThemeIcon = themeInfo.icon;

  return (
    <div className="space-y-6">
      {/* Título do step */}
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl tracking-wider mb-2">REVISÃO FINAL</h2>
        <p className="text-muted-foreground">
          Confira os dados da sua campanha antes de criar.
        </p>
      </div>
      
      {/* Preview visual */}
      <div className="ordo-panel overflow-hidden">
        {/* Capa */}
        {formData.coverImageUrl ? (
          <div className="aspect-video relative">
            <img 
              src={formData.coverImageUrl} 
              alt="Capa"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          </div>
        ) : (
          <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20" />
        )}
        
        {/* Info */}
        <div className="p-6 -mt-12 relative">
          <h3 className="font-display text-2xl tracking-wider mb-2">
            {formData.name}
          </h3>
          {formData.description && (
            <p className="text-sm text-muted-foreground mb-4">
              {formData.description}
            </p>
          )}
          
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <ModeIcon className="w-3 h-3" />
              {modeInfo.label}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <ThemeIcon className={`w-3 h-3 ${themeInfo.color}`} />
              {themeInfo.label}
            </Badge>
          </div>
        </div>
      </div>
      
      {/* Configurações */}
      <div className="ordo-panel p-4">
        <h4 className="font-display text-lg tracking-wider mb-4">CONFIGURAÇÕES</h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span>Notas de Jogadores</span>
            </div>
            <Badge variant={formData.allowPlayerNotes ? 'default' : 'secondary'}>
              {formData.allowPlayerNotes ? 'Ativado' : 'Desativado'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <Dice6 className="w-4 h-4 text-muted-foreground" />
              <span>Dados Compartilhados</span>
            </div>
            <Badge variant={formData.sharedDiceRolls ? 'default' : 'secondary'}>
              {formData.sharedDiceRolls ? 'Ativado' : 'Desativado'}
            </Badge>
          </div>
          
          {formData.houseRules.length > 0 && (
            <div className="py-2">
              <p className="text-sm text-muted-foreground mb-2">Regras da Casa:</p>
              <div className="flex flex-wrap gap-1">
                {formData.houseRules.map((rule, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {rule.length > 30 ? rule.slice(0, 30) + '...' : rule}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Primeira sessão */}
      {formData.firstSessionDate && (
        <div className="ordo-panel p-4">
          <h4 className="font-display text-lg tracking-wider mb-4">PRIMEIRA SESSÃO</h4>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>
                {format(formData.firstSessionDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>
                {formData.firstSessionTime} ({formData.sessionDuration}h de duração)
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Código de convite */}
      <div className="ordo-panel p-4">
        <h4 className="font-display text-lg tracking-wider mb-4">CÓDIGO DE CONVITE</h4>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Código para jogadores:</span>
          </div>
          <span className="font-display text-2xl tracking-widest text-primary">
            {formData.inviteCode}
          </span>
        </div>
      </div>
      
      {/* Confirmação */}
      <div className="ordo-panel p-4 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-primary" />
          <div>
            <p className="font-medium text-primary">Tudo pronto!</p>
            <p className="text-sm text-muted-foreground">
              Clique em "Criar Campanha" para finalizar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

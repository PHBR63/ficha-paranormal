// Step 4: Código de convite
// Gera e exibe o código para compartilhar com jogadores

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Copy, 
  Check, 
  RefreshCw, 
  Share2, 
  Users,
  MessageCircle,
  QrCode
} from '@/components/icons/ordem-icons';
import { useToast } from '@/hooks/use-toast';
import type { CampaignFormData } from '@/pages/CampaignCreate';
import { generateInitialInviteCode } from '@/services/campaign-setup-service';

interface StepInvitePlayersProps {
  formData: CampaignFormData;
  updateFormData: (updates: Partial<CampaignFormData>) => void;
}

export function StepInvitePlayers({ formData, updateFormData }: StepInvitePlayersProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  // Gera novo código
  const regenerateCode = () => {
    updateFormData({ inviteCode: generateInitialInviteCode() });
  };
  
  // Copia o código
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(formData.inviteCode);
      setCopied(true);
      toast({
        title: 'Código copiado!',
        description: 'Compartilhe com seus jogadores.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Erro ao copiar',
        description: 'Copie manualmente o código.',
        variant: 'destructive',
      });
    }
  };
  
  // Compartilha via WhatsApp
  const shareWhatsApp = () => {
    const message = encodeURIComponent(
      `🎲 Você foi convidado para a campanha "${formData.name}"!\n\n` +
      `Use o código: ${formData.inviteCode}\n\n` +
      `Acesse o Let's Roll e entre na campanha!`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };
  
  // Compartilha via API nativa (se disponível)
  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Convite para ${formData.name}`,
          text: `Use o código ${formData.inviteCode} para entrar na campanha!`,
        });
      } catch (err) {
        // Usuário cancelou ou erro
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Título do step */}
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl tracking-wider mb-2">CONVITE DE JOGADORES</h2>
        <p className="text-muted-foreground">
          Prepare o código. Ele só funciona depois que o servidor confirmar o convite.
        </p>
      </div>
      
      {/* Card do código */}
      <div className="ordo-panel p-6 text-center">
        <Label className="text-sm font-medium text-muted-foreground mb-4 block">
          CÓDIGO DE CONVITE
        </Label>
        
        <div className="relative inline-block">
          <div className="font-display text-5xl tracking-[0.3em] text-primary mb-4 select-all">
            {formData.inviteCode}
          </div>
          
          {/* Efeito de glow */}
          <div 
            className="absolute inset-0 blur-xl opacity-30"
            style={{ background: `hsl(var(--primary))` }}
          />
        </div>
        
        {/* Botões de ação */}
        <div className="flex justify-center gap-3 mt-6">
          <Button 
            variant="outline" 
            onClick={copyCode}
            className="font-display tracking-wider"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2 text-green-500" />
                COPIADO
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                COPIAR
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={regenerateCode}
            className="font-display tracking-wider"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            NOVO CÓDIGO
          </Button>
        </div>
      </div>
      
      {/* Opções de compartilhamento */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Compartilhar via</Label>
        
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2"
            onClick={shareWhatsApp}
          >
            <MessageCircle className="w-6 h-6 text-green-500" />
            <span className="text-sm">WhatsApp</span>
          </Button>
          
          {navigator.share && (
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={shareNative}
            >
              <Share2 className="w-6 h-6 text-primary" />
              <span className="text-sm">Compartilhar</span>
            </Button>
          )}
        </div>
      </div>
      
      {/* Instruções */}
      <div className="ordo-panel p-4 bg-muted/20">
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Como funciona?</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Compartilhe o código com seus jogadores</li>
              <li>Eles acessam "Campanhas" e clicam em "Entrar"</li>
              <li>Digitam o código e pronto!</li>
            </ol>
            <p className="text-xs mt-2">
              💡 O código não expira por padrão. Você pode gerenciar convites na página da campanha.
            </p>
          </div>
        </div>
      </div>
      
      {/* Preview da mensagem */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Mensagem sugerida</Label>
        <div className="ordo-panel p-4 bg-card">
          <p className="text-sm text-muted-foreground italic">
            "🎲 Você foi convidado para a campanha <strong>"{formData.name}"</strong>!<br />
            Use o código <strong>{formData.inviteCode}</strong> para entrar no Let's Roll."
          </p>
        </div>
      </div>
    </div>
  );
}

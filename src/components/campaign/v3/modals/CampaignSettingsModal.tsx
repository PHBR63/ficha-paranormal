/**
 * CampaignSettingsModal - Modal de configurações da campanha
 * 
 * Permite ao mestre:
 * - Editar nome/descrição
 * - Gerenciar código de convite
 * - Remover membros (kick)
 * 
 * @module components/campaign/v3/modals/CampaignSettingsModal
 */

import { memo, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Copy, RefreshCw, UserMinus, Settings, Users, Link2 } from 'lucide-react';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';

interface CampaignSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  campaignName: string;
  campaignDescription?: string | null;
  members: CampaignMemberV2[];
  onMemberUpdate?: () => void;
}

export const CampaignSettingsModal = memo(function CampaignSettingsModal({
  open,
  onOpenChange,
  campaignId,
  campaignName,
  campaignDescription,
  members,
  onMemberUpdate,
}: CampaignSettingsModalProps) {
  const { user } = useAuth();
  
  // Estado do formulário
  const [name, setName] = useState(campaignName);
  const [description, setDescription] = useState(campaignDescription || '');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingInvite, setIsLoadingInvite] = useState(false);

  // Sincroniza quando abre o modal
  useEffect(() => {
    if (open) {
      setName(campaignName);
      setDescription(campaignDescription || '');
      loadInviteCode();
    }
  }, [open, campaignName, campaignDescription]);

  // Carregar código de convite existente
  const loadInviteCode = useCallback(async () => {
    setIsLoadingInvite(true);
    const { data } = await supabase
      .from('campaign_invites')
      .select('invite_code')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      setInviteCode(data[0].invite_code);
    }
    setIsLoadingInvite(false);
  }, [campaignId]);

  // Salvar configurações gerais
  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      toast.error('Nome da campanha é obrigatório');
      return;
    }
    setIsSaving(true);
    const { error } = await supabase
      .from('campaigns')
      .update({ name: name.trim(), description: description.trim() || null })
      .eq('id', campaignId);

    if (error) {
      toast.error('Erro ao salvar configurações');
    } else {
      toast.success('Configurações salvas!');
    }
    setIsSaving(false);
  }, [campaignId, name, description]);

  // Gerar novo código de convite
  const handleGenerateInvite = useCallback(async () => {
    if (!user) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { error } = await supabase
      .from('campaign_invites')
      .insert({
        campaign_id: campaignId,
        invite_code: code,
        created_by: user.id,
        max_uses: 10,
      });

    if (error) {
      toast.error('Erro ao gerar convite');
      return;
    }

    setInviteCode(code);
    toast.success('Novo código de convite gerado!');
  }, [campaignId, user]);

  // Copiar código
  const handleCopyCode = useCallback(() => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      toast.success('Código copiado!');
    }
  }, [inviteCode]);

  // Remover membro
  const handleKickMember = useCallback(async (memberId: string, memberName: string) => {
    const { error } = await supabase
      .from('campaign_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      toast.error('Erro ao remover membro');
      return;
    }

    toast.success(`${memberName} removido da campanha`);
    onMemberUpdate?.();
  }, [onMemberUpdate]);

  // Filtra jogadores (exclui mestre)
  const players = members.filter(m => m.role !== 'master');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Configurações da Campanha
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="general" className="flex-1 gap-1.5 text-xs">
              <Settings className="h-3.5 w-3.5" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="invite" className="flex-1 gap-1.5 text-xs">
              <Link2 className="h-3.5 w-3.5" />
              Convite
            </TabsTrigger>
            <TabsTrigger value="members" className="flex-1 gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" />
              Membros
            </TabsTrigger>
          </TabsList>

          {/* Aba Geral */}
          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Nome da Campanha</Label>
              <Input
                id="campaign-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome da campanha..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-desc">Descrição</Label>
              <Textarea
                id="campaign-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição opcional..."
                rows={3}
              />
            </div>

            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </TabsContent>

          {/* Aba Convite */}
          <TabsContent value="invite" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Código de Convite</Label>
              {inviteCode ? (
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded-md text-center font-mono text-lg tracking-widest">
                    {inviteCode}
                  </code>
                  <Button variant="outline" size="icon" onClick={handleCopyCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isLoadingInvite ? 'Carregando...' : 'Nenhum código ativo'}
                </p>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleGenerateInvite}
            >
              <RefreshCw className="h-4 w-4" />
              Gerar Novo Código
            </Button>

            <p className="text-xs text-muted-foreground">
              O código pode ser usado por até 10 jogadores para entrar na campanha.
            </p>
          </TabsContent>

          {/* Aba Membros */}
          <TabsContent value="members" className="mt-4">
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {players.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum jogador na campanha
                  </p>
                )}

                {players.map((member) => {
                  const displayName = member.characters?.name || member.profiles?.display_name || 'Desconhecido';
                  const avatarUrl = member.characters?.photo_url || member.profiles?.avatar_url;
                  const initials = displayName.substring(0, 2).toUpperCase();

                  return (
                    <div 
                      key={member.id} 
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarUrl || undefined} />
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{displayName}</p>
                        {member.characters && (
                          <p className="text-xs text-muted-foreground">
                            {member.characters.class} • NEX {member.characters.nex}%
                          </p>
                        )}
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover {displayName}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Essa ação remove o jogador da campanha. Ele poderá entrar novamente com um código de convite.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleKickMember(member.id, displayName)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
});

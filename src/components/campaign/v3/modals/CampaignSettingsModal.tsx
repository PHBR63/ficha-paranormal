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

import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { createCampaignInvite, loadCampaignInvite, removeCampaignMember, saveCampaignSettings, type CampaignVersion } from '@/services/campaign-invite-service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  schemaVersion?: CampaignVersion;
  campaignName: string;
  campaignDescription?: string | null;
  members: CampaignMemberV2[];
  onMemberUpdate?: () => void;
}

export const CampaignSettingsModal = memo(function CampaignSettingsModal({
  open,
  onOpenChange,
  campaignId,
  schemaVersion = 'v1',
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

  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const mutationLock = useRef(false);
  const runMutation = useCallback(async (action: () => Promise<void>) => {
    if (mutationLock.current) return;
    mutationLock.current = true;
    setIsMutating(true);
    setSettingsError(null);
    try { await action(); }
    catch (error) { setSettingsError(error instanceof Error ? error.message : 'Não foi possível confirmar a alteração.'); }
    finally { mutationLock.current = false; setIsMutating(false); }
  }, []);

  const loadInviteCode = useCallback(async () => {
    setIsLoadingInvite(true);
    setInviteCode(null);
    try { setInviteCode(await loadCampaignInvite(campaignId, schemaVersion)); }
    catch (error) { setSettingsError(error instanceof Error ? error.message : 'Não foi possível carregar o convite.'); }
    finally { setIsLoadingInvite(false); }
  }, [campaignId, schemaVersion]);

  useEffect(() => {
    if (!open) return;
    setName(campaignName);
    setDescription(campaignDescription || '');
    setSettingsError(null);
    void loadInviteCode();
  }, [open, campaignName, campaignDescription, loadInviteCode]);

  const handleSave = useCallback(() => runMutation(async () => {
    setIsSaving(true);
    try {
      await saveCampaignSettings(campaignId, schemaVersion, name, description);
      toast.success('Configurações salvas!');
      onMemberUpdate?.();
    } finally { setIsSaving(false); }
  }), [runMutation, campaignId, schemaVersion, name, description, onMemberUpdate]);

  const handleGenerateInvite = useCallback(() => runMutation(async () => {
    if (!user) throw new Error('Entre na conta para gerar um convite.');
    const code = await createCampaignInvite(campaignId, user.id, schemaVersion);
    setInviteCode(code);
    toast.success('Novo código de convite gerado!');
  }), [runMutation, campaignId, schemaVersion, user]);

  const handleCopyCode = useCallback(() => runMutation(async () => {
    if (!inviteCode) return;
    await navigator.clipboard.writeText(inviteCode);
    toast.success('Código copiado!');
  }), [runMutation, inviteCode]);

  const handleKickMember = useCallback((memberId: string, memberName: string) => runMutation(async () => {
    await removeCampaignMember(campaignId, schemaVersion, memberId);
    toast.success(`${memberName} removido da campanha`);
    onMemberUpdate?.();
  }), [runMutation, campaignId, schemaVersion, onMemberUpdate]);

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
          <DialogDescription>Edite a campanha, seus convites e os membros autorizados.</DialogDescription>
        </DialogHeader>

        {settingsError && <p role="alert" className="text-sm text-destructive">{settingsError}</p>}
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
              disabled={isSaving || isMutating}
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
                  <code className="flex-1 min-w-0 break-all px-3 py-2 bg-muted rounded-md text-center font-mono text-lg tracking-widest">
                    {inviteCode}
                  </code>
                  <Button variant="outline" size="icon" onClick={handleCopyCode} disabled={isMutating} aria-label="Copiar código de convite">
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
              disabled={isMutating || isLoadingInvite}
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
                          <Button variant="ghost" size="icon" disabled={isMutating} aria-label={`Remover ${displayName} da campanha`} className="h-8 w-8 text-destructive hover:text-destructive">
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
                              disabled={isMutating}
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

/**
 * CampaignView - Página principal de visualização e gerenciamento da campanha
 * 
 * ARQUITETURA v2: Usa Singleton Pattern para hooks e Ref-First para callbacks
 * Todos os hooks são instanciados uma única vez no topo e passados via props
 * Isso evita o erro React #185 (Maximum update depth exceeded)
 * 
 * @module pages/CampaignView
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Loader2,
  Crown,
  Copy,
  RefreshCw,
  UserPlus,
  MessageSquare,
  Scroll,
  UserCog,
  Activity,
  Swords,
  Users,
  CalendarDays,
  Map,
  FileText,
  BookOpen,
  Clock,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// Hooks v2 reconstruídos
import { useCampaignData } from '@/hooks/campaign/useCampaignData';
import { useCampaignRealtime } from '@/hooks/campaign/useCampaignRealtime';
import { useCampaignPresence } from '@/hooks/campaign/useCampaignPresence';
import { useTacticalBoard } from '@/hooks/campaign/useTacticalBoard';
import { useMasterActions } from '@/hooks/campaign/useMasterActions';

// Componentes de abas (stateless)
import { CampaignChatTab, CampaignCombatTab, CampaignBoardTab, CampaignMasterTab } from '@/components/campaign/tabs';

// Componentes legados
import { CharacterSelectDialog } from '@/components/campaign/CharacterSelectDialog';
import { MemberConditionsPanel } from '@/components/campaign/MemberConditionsPanel';
import { PlayersSidebar } from '@/components/campaign/PlayersSidebar';
import { CampaignStatusGrid } from '@/components/campaign/CampaignStatusGrid';
import { SessionManager } from '@/components/campaign/SessionManager';
import { ActiveSessionBanner } from '@/components/campaign/ActiveSessionBanner';
import { NotesPanel } from '@/components/campaign/NotesPanel';
import { PlayerHandoutsViewer } from '@/components/campaign/handouts';
import { SessionDiary, CampaignTimeline } from '@/components/campaign/diary';
import { type CombatState, createCombatState } from '@/lib/game-engine';

interface CampaignInvite {
  id: string;
  invite_code: string;
  expires_at: string | null;
  max_uses: number | null;
  uses: number;
}

export default function CampaignView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Estabiliza userId para evitar re-renders quando objeto user muda de referência
  const userId = user?.id ?? '';
  const campaignId = id ?? '';

  // =====================================================
  // REFS PARA ESTABILIDADE (Padrão Ref-First)
  // =====================================================
  const toastRef = useRef(toast);
  const navigateRef = useRef(navigate);
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { toastRef.current = toast; }, [toast]);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  // Limpa timeout ao desmontar
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // =====================================================
  // HOOKS SINGLETON (Instância única no topo)
  // =====================================================
  
  // Hook de dados da campanha (campanha + membros)
  const campaignData = useCampaignData({
    campaignId,
    userId,
  });

  // Hook de realtime (chat + sessões)
  const realtime = useCampaignRealtime({
    campaignId,
    userId,
    enabled: !!campaignId && !!userId,
  });

  // Hook de presença (jogadores online)
  const currentMember = campaignData.members.find(m => m.user_id === userId);
  const presence = useCampaignPresence({
    campaignId,
    userId,
    userName: currentMember?.profiles?.display_name || undefined,
    userAvatar: currentMember?.profiles?.avatar_url || undefined,
    enabled: !!campaignId && !!userId,
  });

  // Hook do tabuleiro tático (única instância)
  const board = useTacticalBoard({
    campaignId,
    isMaster: campaignData.isMaster,
    enabled: !!campaignId,
  });

  // =====================================================
  // CALLBACK THROTTLED PARA UPDATES
  // =====================================================
  
  // Ref para refetch estável
  const refetchRef = useRef(campaignData.refetch);
  useEffect(() => { refetchRef.current = campaignData.refetch; }, [campaignData.refetch]);

  const onMemberUpdateThrottled = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      refetchRef.current();
    }, 500);
  }, []); // Sem deps = eternamente estável

  // Hook de ações do mestre (usa callback throttled)
  const masterActions = useMasterActions({
    campaignId,
    isMaster: campaignData.isMaster,
    onUpdate: onMemberUpdateThrottled,
  });

  // =====================================================
  // ESTADO LOCAL
  // =====================================================
  const [invite, setInvite] = useState<CampaignInvite | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [characterSelectOpen, setCharacterSelectOpen] = useState(false);
  const [sharedCombatState, setSharedCombatState] = useState<CombatState>(() => createCombatState());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Busca convite ativo ao carregar
  useEffect(() => {
    if (!campaignId) return;

    const fetchInvite = async () => {
      const { data } = await supabase
        .from('campaign_invites')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) setInvite(data);
    };

    fetchInvite();
  }, [campaignId]);

  // =====================================================
  // HANDLERS
  // =====================================================

  const generateInviteCode = async () => {
    if (!campaignId || !userId) return;

    setGeneratingInvite(true);
    try {
      const code = Array.from({ length: 6 }, () =>
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
      ).join('');

      // Usa .limit(1) para evitar erro 406 (Not Acceptable)
      const { data, error } = await supabase
        .from('campaign_invites')
        .insert({
          campaign_id: campaignId,
          invite_code: code,
          created_by: userId,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .limit(1);

      if (error) throw error;
      const inviteData = data?.[0];
      if (inviteData) setInvite(inviteData);

      toastRef.current({
        title: 'Código gerado!',
        description: 'O código expira em 7 dias.',
      });
    } catch (error: any) {
      toastRef.current({
        title: 'Erro ao gerar código',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setGeneratingInvite(false);
    }
  };

  const copyInviteCode = () => {
    if (invite) {
      navigator.clipboard.writeText(invite.invite_code);
      toastRef.current({
        title: 'Código copiado!',
        description: 'Compartilhe com os jogadores.',
      });
    }
  };

  const removeMember = useCallback(async (memberId: string) => {
    if (!confirm('Remover este jogador da campanha?')) return;

    try {
      const { error } = await supabase
        .from('campaign_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toastRef.current({ title: 'Jogador removido' });
      onMemberUpdateThrottled();
    } catch (error: any) {
      toastRef.current({
        title: 'Erro ao remover',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [onMemberUpdateThrottled]);

  const handleCharacterSelect = useCallback(async (characterId: string | null) => {
    if (!userId || !campaignId) return;

    const member = campaignData.members.find(m => m.user_id === userId);
    if (!member) return;

    try {
      const { error } = await supabase
        .from('campaign_members')
        .update({ character_id: characterId })
        .eq('id', member.id);

      if (error) throw error;

      toastRef.current({
        title: characterId ? 'Personagem selecionado!' : 'Personagem removido',
        description: characterId 
          ? 'Seu agente foi vinculado à campanha.' 
          : 'Você não está mais usando um personagem nesta campanha.',
      });

      onMemberUpdateThrottled();
    } catch (error: any) {
      toastRef.current({
        title: 'Erro ao selecionar personagem',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [userId, campaignId, campaignData.members, onMemberUpdateThrottled]);

  const handleEndSession = async () => {
    if (!realtime.activeSession || !campaignData.isMaster) return;

    const success = await realtime.endSession(realtime.activeSession.id);
    if (success) {
      // Atualiza current_session da campanha
      await supabase
        .from('campaigns')
        .update({ current_session: realtime.activeSession.session_number })
        .eq('id', campaignId);
    }
  };

  // Handler para enviar mensagens de sistema (usado pela aba do mestre)
  const sendSystemMessage = useCallback(async (content: string) => {
    await realtime.sendMessage(content, 'system', undefined, null);
  }, [realtime]);

  // =====================================================
  // LOADING / ERROR STATES
  // =====================================================

  if (campaignData.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-display tracking-wider">CARREGANDO CAMPANHA...</p>
        </div>
      </div>
    );
  }

  if (campaignData.error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive font-display mb-4">{campaignData.error}</p>
          <Button onClick={() => navigateRef.current('/campaigns')}>
            Voltar para Campanhas
          </Button>
        </div>
      </div>
    );
  }

  if (!campaignData.campaign) return null;

  const campaign = campaignData.campaign;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-20">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:py-4 gap-3">
            {/* Lado esquerdo - Info */}
            <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
              <Link to="/campaigns">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-primary/10 px-3">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline font-display text-xs tracking-wider">CAMPANHAS</span>
                </Button>
              </Link>
              <div className="h-8 w-px bg-border/50 hidden sm:block" />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  {campaignData.isMaster && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary/15 border border-primary/30">
                      <Crown className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-display tracking-wider text-primary hidden sm:inline">MESTRE</span>
                    </div>
                  )}
                  <h1 className="font-display text-lg sm:text-2xl tracking-wider truncate">
                    {campaign.name}
                  </h1>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Sessão {campaign.current_session}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                    {campaignData.members.length} agente{campaignData.members.length !== 1 ? 's' : ''} conectados
                  </p>
                </div>
              </div>
            </div>

            {/* Lado direito - Ações */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Botão de seleção de personagem - jogadores */}
              {!campaignData.isMaster && (
                <Button
                  variant="outline"
                  size="sm"
                  className="font-display text-[10px] sm:text-xs px-2 sm:px-3"
                  onClick={() => setCharacterSelectOpen(true)}
                >
                  <UserCog className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline ml-1 sm:ml-2">
                    {currentMember?.characters ? currentMember.characters.name : 'SELECIONAR'}
                  </span>
                </Button>
              )}

              {/* Dialog de convite - mestre */}
              {campaignData.isMaster && (
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="font-display text-[10px] sm:text-xs px-2 sm:px-3">
                      <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline ml-1 sm:ml-2">CONVIDAR</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-display text-lg sm:text-xl tracking-wider">
                        CONVIDAR JOGADORES
                      </DialogTitle>
                      <DialogDescription>
                        Compartilhe o código abaixo com os jogadores.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      {invite ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Input
                              value={invite.invite_code}
                              readOnly
                              className="font-display text-center text-xl sm:text-2xl tracking-widest"
                            />
                            <Button variant="outline" size="icon" onClick={copyInviteCode}>
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground text-center">
                            Usado {invite.uses} vezes •
                            {invite.expires_at && ` Expira em ${new Date(invite.expires_at).toLocaleDateString()}`}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-muted-foreground mb-4">
                            Nenhum código ativo. Gere um novo código.
                          </p>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={generateInviteCode}
                        disabled={generatingInvite}
                        className="w-full sm:w-auto"
                      >
                        {generatingInvite ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        {invite ? 'GERAR NOVO' : 'GERAR CÓDIGO'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Banner de sessão ativa */}
      {realtime.activeSession && (
        <ActiveSessionBanner
          sessionNumber={realtime.activeSession.session_number}
          sessionTitle={realtime.activeSession.title}
          startedAt={realtime.activeSession.started_at || ''}
          isMaster={campaignData.isMaster}
          memberCount={campaignData.members.length}
          onEndSession={handleEndSession}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs fixas no topo */}
            <div className="shrink-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur-md overflow-x-auto shadow-lg">
              <TabsList className="bg-transparent px-4 sm:px-6 lg:px-8 min-w-max h-12 sm:h-14">
                <TabsTrigger value="status" className="font-display tracking-wider text-xs sm:text-sm px-3 sm:px-5 h-10 sm:h-12 text-white/70 hover:text-white data-[state=active]:bg-primary/15 data-[state=active]:text-white transition-all">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                  <span className="hidden sm:inline">AGENTES</span>
                </TabsTrigger>
                <TabsTrigger value="chat" className="font-display tracking-wider text-xs sm:text-sm px-3 sm:px-5 h-10 sm:h-12 text-white/70 hover:text-white data-[state=active]:bg-primary/15 data-[state=active]:text-white transition-all">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                  <span className="hidden sm:inline">CHAT</span>
                </TabsTrigger>
                <TabsTrigger value="combat" className="font-display tracking-wider text-xs sm:text-sm px-3 sm:px-5 h-10 sm:h-12 text-white/70 hover:text-white data-[state=active]:bg-primary/15 data-[state=active]:text-white transition-all">
                  <Swords className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                  <span className="hidden sm:inline">COMBATE</span>
                </TabsTrigger>
                <TabsTrigger value="tactical" className="font-display tracking-wider text-xs sm:text-sm px-3 sm:px-5 h-10 sm:h-12 text-white/70 hover:text-white data-[state=active]:bg-primary/15 data-[state=active]:text-white transition-all">
                  <Map className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                  <span className="hidden sm:inline">TABULEIRO</span>
                </TabsTrigger>
                <TabsTrigger value="conditions" className="font-display tracking-wider text-xs sm:text-sm px-3 sm:px-5 h-10 sm:h-12 text-white/70 hover:text-white data-[state=active]:bg-primary/15 data-[state=active]:text-white transition-all">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                  <span className="hidden sm:inline">CONDIÇÕES</span>
                </TabsTrigger>
                <TabsTrigger value="notes" className="font-display tracking-wider text-xs sm:text-sm px-3 sm:px-5 h-10 sm:h-12 text-white/70 hover:text-white data-[state=active]:bg-primary/15 data-[state=active]:text-white transition-all">
                  <Scroll className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                  <span className="hidden sm:inline">NOTAS</span>
                </TabsTrigger>
                <TabsTrigger value="handouts" className="font-display tracking-wider text-xs sm:text-sm px-3 sm:px-5 h-10 sm:h-12 text-white/70 hover:text-white data-[state=active]:bg-primary/15 data-[state=active]:text-white transition-all">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                  <span className="hidden sm:inline">HANDOUTS</span>
                </TabsTrigger>
                <TabsTrigger value="sessions" className="font-display tracking-wider text-xs sm:text-sm px-3 sm:px-5 h-10 sm:h-12 text-white/70 hover:text-white data-[state=active]:bg-primary/15 data-[state=active]:text-white transition-all">
                  <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                  <span className="hidden sm:inline">SESSÕES</span>
                </TabsTrigger>
                <TabsTrigger value="diary" className="font-display tracking-wider text-xs sm:text-sm px-3 sm:px-5 h-10 sm:h-12 text-white/70 hover:text-white data-[state=active]:bg-primary/15 data-[state=active]:text-white transition-all">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                  <span className="hidden sm:inline">DIÁRIO</span>
                </TabsTrigger>
                {campaignData.isMaster && (
                  <TabsTrigger value="master" className="font-display tracking-wider text-xs sm:text-sm px-3 sm:px-5 h-10 sm:h-12 text-white/70 hover:text-white data-[state=active]:bg-primary/20 data-[state=active]:text-white transition-all">
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                    <span className="hidden sm:inline">MESTRE</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* Aba Status - Responsivo: ocupa toda largura disponível */}
            <TabsContent value="status" className="flex-1 p-4 sm:p-6 lg:p-8 m-0 overflow-auto">
              <div className="w-full">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl tracking-wider text-foreground">
                        STATUS DOS AGENTES
                      </h3>
                      <p className="text-sm text-muted-foreground">{campaignData.members.length} membros na campanha</p>
                    </div>
                  </div>
                </div>
                <CampaignStatusGrid members={campaignData.members as any} isMaster={campaignData.isMaster} />
              </div>
            </TabsContent>

            {/* Aba Chat - Usa componente stateless */}
            <TabsContent value="chat" className="flex-1 flex flex-col m-0 min-h-0">
              <CampaignChatTab
                campaignId={campaignId}
                messages={realtime.messages}
                sendMessage={realtime.sendMessage}
                currentUserId={userId}
                masterId={campaign.master_id}
                currentMember={currentMember}
                members={campaignData.members}
              />
            </TabsContent>

            {/* Aba Combate */}
            <TabsContent value="combat" className="flex-1 p-6 sm:p-8 m-0 overflow-auto">
              <CampaignCombatTab
                campaignId={campaignId}
                isMaster={campaignData.isMaster}
                board={board}
                combatState={sharedCombatState}
                onCombatUpdate={setSharedCombatState}
              />
            </TabsContent>

            {/* Aba Tabuleiro */}
            <TabsContent value="tactical" className="flex-1 p-4 sm:p-6 m-0 overflow-auto">
              <CampaignBoardTab
                campaignId={campaignId}
                isMaster={campaignData.isMaster}
                members={campaignData.members}
                board={board}
              />
            </TabsContent>

            {/* Aba Condições - Responsivo: expande em telas grandes */}
            <TabsContent value="conditions" className="flex-1 p-4 sm:p-6 lg:p-8 m-0 overflow-auto">
              <div className="max-w-4xl lg:max-w-6xl xl:max-w-full mx-auto">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl tracking-wider text-foreground">
                      STATUS DOS AGENTES
                    </h3>
                    <p className="text-sm text-muted-foreground">Condições e efeitos ativos</p>
                  </div>
                </div>
                <MemberConditionsPanel
                  members={campaignData.members as any}
                  isMaster={campaignData.isMaster}
                  onMemberUpdate={onMemberUpdateThrottled}
                />
              </div>
            </TabsContent>

            {/* Aba Notas - Responsivo: expande totalmente */}
            <TabsContent value="notes" className="flex-1 p-4 sm:p-6 lg:p-8 m-0 overflow-auto">
              <div className="w-full">
                <div className="ordo-panel p-4 sm:p-6 lg:p-8 h-full">
                  <NotesPanel campaignId={campaignId} isMaster={campaignData.isMaster} />
                </div>
              </div>
            </TabsContent>

            {/* Aba Handouts - Responsivo: expande em telas grandes */}
            <TabsContent value="handouts" className="flex-1 p-4 sm:p-6 lg:p-8 m-0 overflow-auto">
              <div className="max-w-5xl lg:max-w-6xl xl:max-w-full mx-auto">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl tracking-wider text-foreground">
                      DOCUMENTOS & PISTAS
                    </h3>
                    <p className="text-sm text-muted-foreground">Materiais compartilhados pelo mestre</p>
                  </div>
                </div>
                <PlayerHandoutsViewer campaignId={campaignId} />
              </div>
            </TabsContent>

            {/* Aba Sessões - Responsivo: expande em telas grandes */}
            <TabsContent value="sessions" className="flex-1 p-4 sm:p-6 lg:p-8 m-0 overflow-auto">
              <div className="max-w-4xl lg:max-w-5xl xl:max-w-full mx-auto">
                <SessionManager
                  campaignId={campaignId}
                  campaignName={campaign?.name}
                  currentSession={campaign?.current_session || 0}
                  isMaster={campaignData.isMaster}
                  onSessionUpdate={onMemberUpdateThrottled}
                />
              </div>
            </TabsContent>

            {/* Aba Diário - Responsivo: expande em telas grandes */}
            <TabsContent value="diary" className="flex-1 p-4 sm:p-6 lg:p-8 m-0 overflow-auto">
              <div className="max-w-5xl lg:max-w-6xl xl:max-w-full mx-auto">
                <Tabs defaultValue="diary" className="space-y-4">
                  <TabsList className="bg-card border border-border">
                    <TabsTrigger value="diary" className="font-display text-xs">
                      <BookOpen className="w-4 h-4 mr-1.5" />
                      DIÁRIO
                    </TabsTrigger>
                    <TabsTrigger value="timeline" className="font-display text-xs">
                      <Clock className="w-4 h-4 mr-1.5" />
                      LINHA DO TEMPO
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="diary" className="mt-4">
                    <SessionDiary
                      campaignId={campaignId}
                      campaignName={campaign?.name}
                      isMaster={campaignData.isMaster}
                    />
                  </TabsContent>

                  <TabsContent value="timeline" className="mt-4">
                    <CampaignTimeline
                      campaignId={campaignId}
                      isMaster={campaignData.isMaster}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>

            {/* Aba Mestre */}
            {campaignData.isMaster && (
              <TabsContent value="master" className="flex-1 p-4 m-0 overflow-auto">
                <CampaignMasterTab
                  campaignId={campaignId}
                  campaign={campaign}
                  members={campaignData.members}
                  onMemberUpdate={onMemberUpdateThrottled}
                  sendSystemMessage={sendSystemMessage}
                />
              </TabsContent>
            )}
          </Tabs>
        </main>

        {/* Sidebar de jogadores - Colapsável */}
        <PlayersSidebar
          members={campaignData.members as any}
          masterId={campaign.master_id}
          isMaster={campaignData.isMaster}
          onRemoveMember={removeMember}
          getUserStatus={presence.getUserStatus}
          isConnected={presence.isConnected}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        />
      </div>

      {/* Dialog de seleção de personagem */}
      <CharacterSelectDialog
        open={characterSelectOpen}
        onOpenChange={setCharacterSelectOpen}
        campaignId={campaignId}
        currentCharacterId={currentMember?.character_id || null}
        onCharacterSelect={handleCharacterSelect}
      />
    </div>
  );
}

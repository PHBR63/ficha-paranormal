/**
 * CampaignView - Página principal de visualização e gerenciamento da campanha
 * Integra chat, combate, sessões, notas e gerenciamento de jogadores
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Loader2,
  Crown,
  Send,
  Copy,
  RefreshCw,
  UserPlus,
  Dices,
  MessageSquare,
  Scroll,
  UserCog,
  Activity,
  Swords,
  Users,
  CalendarDays,
  Map,
  Music,
  FileText,
  BookOpen,
  Skull,
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
import { rollSkillTest } from '@/lib/dice-roller';
import { CharacterSelectDialog } from '@/components/campaign/CharacterSelectDialog';
import { MemberConditionsPanel } from '@/components/campaign/MemberConditionsPanel';
import { CombatTracker } from '@/components/combat/CombatTracker';
import { IntegratedCombatBoard } from '@/components/combat/IntegratedCombatBoard';
import { DiceRoller3D } from '@/components/dice/DiceRoller3D';
import { PlayersSidebar } from '@/components/campaign/PlayersSidebar';
import { CampaignStatusGrid } from '@/components/campaign/CampaignStatusGrid';
import { SessionManager } from '@/components/campaign/SessionManager';
import { ActiveSessionBanner } from '@/components/campaign/ActiveSessionBanner';
import { NotesPanel } from '@/components/campaign/NotesPanel';
import { MemberBonusesPanel } from '@/components/campaign/MemberBonusesPanel';
import { MasterSheetViewer } from '@/components/campaign/master/MasterSheetViewer';
import { TacticalBoard } from '@/components/campaign/tactical/TacticalBoard';
import { useTacticalBoard } from '@/hooks/campaign/useTacticalBoard';
import { useCampaignPresence } from '@/hooks/campaign/useCampaignPresence';
import { AudioMasterPanel, AudioPlayerBar, SoundSceneManager } from '@/components/campaign/audio';
import { WhisperDialog, ChatMessage, IntegratedDiceRoller, SessionActivityLog, parseDiceCommand, MacrosPanel } from '@/components/campaign/chat';
import { PlayerHandoutsViewer } from '@/components/campaign/handouts';
import { HandoutsManager } from '@/components/campaign/master/HandoutsManager';
import { SessionDiary, CampaignTimeline, SessionExporter } from '@/components/campaign/diary';
import { NPCManager } from '@/components/campaign/master';
import { type CombatState, createCombatState } from '@/lib/game-engine';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  master_id: string;
  status: string;
  current_session: number;
  settings: any;
}

interface CampaignMember {
  id: string;
  user_id: string;
  character_id: string | null;
  role: string;
  joined_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  characters?: {
    id: string;
    name: string;
    class: string;
    nex: number;
    hp_current: number;
    hp_max: number;
    pe_current: number;
    pe_max: number;
    san_current: number;
    san_max: number;
    photo_url: string | null;
    conditions: string[];
  } | null;
}

interface Message {
  id: string;
  user_id: string;
  character_id: string | null;
  message_type: string;
  content: string;
  metadata: any;
  created_at: string;
  profiles?: {
    display_name: string | null;
  };
  characters?: {
    name: string;
  } | null;
}

interface CampaignInvite {
  id: string;
  invite_code: string;
  expires_at: string | null;
  max_uses: number | null;
  uses: number;
}

// Tipo para sessão ativa
interface ActiveSession {
  id: string;
  session_number: number;
  title: string | null;
  started_at: string;
}

export default function CampaignView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Estabiliza userId para evitar re-renders quando objeto user muda de referência
  const userId = user?.id;

  // Refs para estabilizar dependências em useCallbacks (evita loop infinito #185)
  const toastRef = useRef(toast);
  const navigateRef = useRef(navigate);
  // Ref para debounce de updates em cascata
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    toastRef.current = toast;
    navigateRef.current = navigate;
  }, [toast, navigate]);

  // Cleanup do timeout ao desmontar
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [members, setMembers] = useState<CampaignMember[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [invite, setInvite] = useState<CampaignInvite | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);

  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [characterSelectOpen, setCharacterSelectOpen] = useState(false);
  const [endSessionDialogOpen, setEndSessionDialogOpen] = useState(false);
  const [endingSession, setEndingSession] = useState(false);

  // Estado de combate compartilhado entre CombatTracker e IntegratedCombatBoard
  const [sharedCombatState, setSharedCombatState] = useState<CombatState>(() => createCombatState());

  // IMPORTANTE: isMaster como boolean estável para evitar re-renders
  // Usa !! para garantir boolean (não undefined) e evitar mudança de tipo
  const isMaster = !!(campaign?.master_id && campaign.master_id === userId);
  const currentMember = members.find(m => m.user_id === userId);

  // Memoiza campaignId para estabilidade do hook tático
  const campaignIdStable = id || '';

  // Hook do tabuleiro tático elevado para compartilhamento com combate
  // NOTA: O hook usa refs internos para isMaster, então mudanças são seguras
  const board = useTacticalBoard({
    campaignId: campaignIdStable,
    isMaster,
  });

  // Hook de presença em tempo real para rastrear jogadores online
  // Usa valores primitivos estáveis extraídos do currentMember para evitar re-subscriptions
  const currentMemberName = currentMember?.profiles?.display_name || undefined;
  const currentMemberAvatar = currentMember?.profiles?.avatar_url || undefined;

  const presence = useCampaignPresence({
    campaignId: campaignIdStable,
    userId: userId || '',
    userName: currentMemberName,
    userAvatar: currentMemberAvatar,
    enabled: !!campaignIdStable && !!userId,
  });

  // Ref para controlar se é o carregamento inicial
  const isInitialLoadRef = useRef(true);
  const prevMessagesLengthRef = useRef(0);

  useEffect(() => {
    // Só faz scroll automático se:
    // 1. Não é o carregamento inicial
    // 2. Uma nova mensagem foi adicionada (não remoção/edição)
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      prevMessagesLengthRef.current = messages.length;
      return;
    }

    // Só faz scroll se houver mais mensagens do que antes
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  /**
   * Carrega dados da campanha com queries em lote (escalável e otimizado)
   * Em vez de N+1 queries, usa batch queries com merge em O(n)
   * Memoizado com useCallback para evitar re-criação a cada render
   */
  const fetchCampaignData = useCallback(async () => {
    if (!id || !userId) return;

    try {
      // 1. Fetch campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData);

      // 2. Fetch members com join em characters (FK válida)
      const { data: membersRaw, error: membersError } = await supabase
        .from('campaign_members')
        .select(`
          id, user_id, character_id, role, joined_at,
          characters (id, name, class, nex, hp_current, hp_max, pe_current, pe_max, san_current, san_max, photo_url, conditions)
        `)
        .eq('campaign_id', id);

      if (membersError) throw membersError;

      // 3. Busca profiles em lote (sem FK, então usa IN)
      const userIds = (membersRaw || []).map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      // 4. Cria lookup Map para O(1) e mescla
      const profileLookup: Record<string, typeof profiles extends (infer T)[] | null ? T : never> = {};
      (profiles || []).forEach(p => { profileLookup[p.user_id] = p; });

      const membersWithData = (membersRaw || []).map(member => ({
        ...member,
        profiles: profileLookup[member.user_id] || { display_name: null, avatar_url: null },
        characters: member.characters,
      }));

      setMembers(membersWithData as CampaignMember[]);

      // 5. Fetch messages
      const { data: messagesRaw, error: messagesError } = await supabase
        .from('campaign_messages')
        .select('*')
        .eq('campaign_id', id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (messagesError) throw messagesError;

      // 6. Busca profiles e characters para mensagens em lote
      const msgUserIds = [...new Set((messagesRaw || []).map(m => m.user_id))];
      const msgCharIds = [...new Set((messagesRaw || []).filter(m => m.character_id).map(m => m.character_id!))];

      const [msgProfilesRes, msgCharsRes] = await Promise.all([
        supabase.from('profiles').select('user_id, display_name').in('user_id', msgUserIds),
        msgCharIds.length > 0
          ? supabase.from('characters').select('id, name').in('id', msgCharIds)
          : Promise.resolve({ data: [] }),
      ]);

      // 7. Cria lookup objects e mescla mensagens
      const msgProfileLookup: Record<string, { user_id: string; display_name: string | null }> = {};
      (msgProfilesRes.data || []).forEach(p => { msgProfileLookup[p.user_id] = p; });

      const msgCharLookup: Record<string, { id: string; name: string }> = {};
      (msgCharsRes.data || []).forEach(c => { msgCharLookup[c.id] = c; });

      const messagesWithData = (messagesRaw || []).map(msg => ({
        ...msg,
        profiles: msgProfileLookup[msg.user_id] || { display_name: null },
        characters: msg.character_id ? msgCharLookup[msg.character_id] || null : null,
      }));

      setMessages(messagesWithData as Message[]);

      // 8. Fetch active invite com maybeSingle (evita erro 406)
      const { data: inviteData, error: inviteError } = await supabase
        .from('campaign_invites')
        .select('*')
        .eq('campaign_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!inviteError && inviteData) {
        setInvite(inviteData);
      }

    } catch (error: any) {
      console.error('Error fetching campaign:', error);
      toastRef.current({
        title: 'Erro',
        description: 'Não foi possível carregar a campanha.',
        variant: 'destructive',
      });
      navigateRef.current('/campaigns');
    } finally {
      setLoading(false);
    }
  }, [id, userId]); // toast e navigate removidos - usamos refs para estabilidade

  /**
   * Versão debounced de fetchCampaignData para passar como onMemberUpdate
   * Evita múltiplas chamadas em cascata quando vários componentes atualizam
   * Usa ref para sempre ter a versão mais recente do fetchCampaignData
   */
  const fetchCampaignDataRef = useRef(fetchCampaignData);
  useEffect(() => { fetchCampaignDataRef.current = fetchCampaignData; }, [fetchCampaignData]);

  const onMemberUpdateThrottled = useCallback(() => {
    // Limpa timeout anterior se existir
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    // Debounce de 500ms para evitar múltiplas chamadas em sequência
    updateTimeoutRef.current = setTimeout(() => {
      fetchCampaignDataRef.current();
    }, 500);
  }, []); // Sem dependências = estável para sempre

  /**
   * Subscribe para novas mensagens via Realtime
   * Memoizado com useCallback para evitar re-subscriptions em loop
   */
  const subscribeToMessages = useCallback(() => {
    if (!id) return;

    const channel = supabase
      .channel(`campaign-messages-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'campaign_messages',
          filter: `campaign_id=eq.${id}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;

          // Fetch profile - usando maybeSingle para evitar erro 406
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', newMsg.user_id)
            .maybeSingle();

          let character = null;
          if (newMsg.character_id) {
            // Usando maybeSingle para evitar erro 406
            const { data: charData } = await supabase
              .from('characters')
              .select('name')
              .eq('id', newMsg.character_id)
              .maybeSingle();
            character = charData;
          }

          const messageWithData = {
            ...newMsg,
            profiles: profile || { display_name: null },
            characters: character,
          } as Message;

          setMessages(prev => [...prev, messageWithData]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  /**
   * Busca sessão ativa da campanha
   * Memoizado com useCallback para poder ser usado como dependência
   */
  const fetchActiveSession = useCallback(async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('campaign_sessions')
        .select('id, session_number, title, started_at')
        .eq('campaign_id', id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.warn('Erro ao buscar sessão ativa:', error.message);
        setActiveSession(null);
        return;
      }
      setActiveSession(data);
    } catch (err) {
      console.error('Exceção ao buscar sessão:', err);
      setActiveSession(null);
    }
  }, [id]);

  /**
   * Subscribe para mudanças em sessões (realtime)
   * Memoizado com useCallback para evitar re-subscriptions em loop
   */
  const subscribeToSessions = useCallback(() => {
    if (!id) return;
    const channel = supabase
      .channel(`campaign-sessions-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaign_sessions', filter: `campaign_id=eq.${id}` }, () => fetchActiveSession())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [id, fetchActiveSession]);

  // Busca dados ao montar e subscribe para updates
  // Usa userId estável (não user objeto) para evitar loop de re-subscriptions
  useEffect(() => {
    if (!id || !userId) return;

    fetchCampaignData();
    fetchActiveSession();

    const cleanupMessages = subscribeToMessages();
    const cleanupSessions = subscribeToSessions();

    return () => {
      cleanupMessages?.();
      cleanupSessions?.();
    };
  }, [id, userId, fetchCampaignData, fetchActiveSession, subscribeToMessages, subscribeToSessions]);

  // Encerra a sessão ativa
  const handleEndSession = async () => {
    if (!activeSession || !isMaster) return;

    setEndingSession(true);
    try {
      const { error } = await supabase
        .from('campaign_sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', activeSession.id);

      if (error) throw error;

      // Atualiza o número da sessão na campanha
      await supabase
        .from('campaigns')
        .update({ current_session: activeSession.session_number })
        .eq('id', id);

      setActiveSession(null);
      toast({
        title: 'Sessão encerrada!',
        description: `Sessão #${activeSession.session_number} foi finalizada.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao encerrar sessão',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setEndingSession(false);
    }
  };

  const sendMessage = async (type: string = 'chat', content: string = messageInput, metadata: any = {}) => {
    if (!user || !id || (!content.trim() && type === 'chat')) return;

    // Verifica se é comando de dados e executa a rolagem real
    const diceCommand = parseDiceCommand(content);
    if (diceCommand.isCommand && type === 'chat') {
      // Usa dice-roller para rolagens simples (sem contexto de personagem)
      // Rolagens com bônus de personagem usam os hooks SUE nos modais específicos
      const { rollSkillTest, rollDamage } = await import('@/lib/dice-roller');

      let rollContent: string;
      let rollMetadata: any;

      if (diceCommand.damageType) {
        // Rolagem de dano (ex: /r 2d6+3)
        const { count, sides, bonus } = diceCommand.damageType;
        const result = rollDamage({
          diceCount: count,
          diceType: sides,
          bonusDamage: bonus,
        });

        const bonusText = bonus > 0 ? `+${bonus}` : '';
        rollContent = `🎲 ${diceCommand.label}: ${count}d${sides}${bonusText} [${result.dice.join(', ')}] → **${result.total}**`;
        rollMetadata = {
          dice: result.dice,
          total: result.total,
          bonusDamage: result.bonusDamage,
          damageType: diceCommand.label,
          isDamage: true,
        };
      } else {
        // Rolagem de teste (ex: /r 2d20+5 ou /r 3)
        const result = rollSkillTest({
          attributeValue: diceCommand.diceCount || 1,
          skillBonus: diceCommand.bonus || 0,
          label: diceCommand.label || 'Teste',
        });

        const bonusText = result.skillBonus > 0 ? ` +${result.skillBonus}` : '';
        const critText = result.isCritical ? ' ★ CRÍTICO!' : '';
        rollContent = `🎲 ${result.label}: [${result.dice.join(', ')}]${bonusText} → **${result.total}**${critText}`;
        rollMetadata = {
          dice: result.dice,
          keptDice: result.keptDice,
          skillBonus: result.skillBonus,
          total: result.total,
          isCritical: result.isCritical,
          isDisadvantage: result.isDisadvantage,
          label: result.label,
        };
      }

      handleDiceRoll(rollContent, 'dice_roll', rollMetadata);
      return;
    }

    setSending(true);
    try {
      const currentMember = members.find(m => m.user_id === user.id);

      const { error } = await supabase
        .from('campaign_messages')
        .insert({
          campaign_id: id,
          user_id: user.id,
          character_id: currentMember?.character_id || null,
          message_type: type,
          content: content.trim(),
          metadata,
        });

      if (error) throw error;
      setMessageInput('');
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  // Handler para rolagens do IntegratedDiceRoller
  const handleDiceRoll = async (content: string, type: string, metadata: any) => {
    if (!user || !id) return;

    setSending(true);
    try {
      const currentMember = members.find(m => m.user_id === user.id);

      const { error } = await supabase
        .from('campaign_messages')
        .insert({
          campaign_id: id,
          user_id: user.id,
          character_id: currentMember?.character_id || null,
          message_type: type,
          content,
          metadata,
        });

      if (error) throw error;
      setMessageInput('');
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar rolagem',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const generateInviteCode = async () => {
    if (!id || !user) return;

    setGeneratingInvite(true);
    try {
      // Generate random code
      const code = Array.from({ length: 6 }, () =>
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
      ).join('');

      const { data, error } = await supabase
        .from('campaign_invites')
        .insert({
          campaign_id: id,
          invite_code: code,
          created_by: user.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        })
        .select()
        .single();

      if (error) throw error;
      setInvite(data);

      toast({
        title: 'Código gerado!',
        description: 'O código expira em 7 dias.',
      });
    } catch (error: any) {
      toast({
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
      toast({
        title: 'Código copiado!',
        description: 'Compartilhe com os jogadores.',
      });
    }
  };

  /**
   * Remove um membro da campanha
   * Memoizado com useCallback para ser passado como prop estável
   */
  const removeMember = useCallback(async (memberId: string) => {
    if (!confirm('Remover este jogador da campanha?')) return;

    try {
      const { error } = await supabase
        .from('campaign_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setMembers(prev => prev.filter(m => m.id !== memberId));
      toastRef.current({ title: 'Jogador removido' });
    } catch (error: any) {
      toastRef.current({
        title: 'Erro ao remover',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, []); // toast removido - usamos ref

  /**
   * Seleciona um personagem para o jogador atual
   * Memoizado com useCallback para ser passado como prop estável
   */
  const handleCharacterSelect = useCallback(async (characterId: string | null) => {
    if (!userId || !id) return;

    // Busca o membro atual a partir do state mais recente
    const member = members.find(m => m.user_id === userId);
    if (!member) return;

    try {
      const { error } = await supabase
        .from('campaign_members')
        .update({ character_id: characterId })
        .eq('id', member.id);

      if (error) throw error;

      // Update local state
      setMembers(prev => prev.map(m =>
        m.id === member.id
          ? { ...m, character_id: characterId }
          : m
      ));

      // Refetch to get updated character info
      if (characterId) {
        const { data: charData } = await supabase
          .from('characters')
          .select('id, name, class, nex, hp_current, hp_max, pe_current, pe_max, san_current, san_max, photo_url, conditions')
          .eq('id', characterId)
          .single();

        if (charData) {
          const typedCharData = {
            ...charData,
            conditions: Array.isArray(charData.conditions) ? charData.conditions as string[] : [],
          };
          setMembers(prev => prev.map(m =>
            m.id === member.id
              ? { ...m, character_id: characterId, characters: typedCharData }
              : m
          ));
        }
      } else {
        setMembers(prev => prev.map(m =>
          m.id === member.id
            ? { ...m, character_id: null, characters: null }
            : m
        ));
      }

      toastRef.current({
        title: characterId ? 'Personagem selecionado!' : 'Personagem removido',
        description: characterId ? 'Seu agente foi vinculado à campanha.' : 'Você não está mais usando um personagem nesta campanha.',
      });
    } catch (error: any) {
      toastRef.current({
        title: 'Erro ao selecionar personagem',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [userId, id, members]); // toast removido - usamos ref. members mantido pois é usado na lógica

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-display tracking-wider">CARREGANDO CAMPANHA...</p>
        </div>
      </div>
    );
  }

  if (!campaign) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Expandido */}
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
                  {isMaster && (
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
                    {members.length} agente{members.length !== 1 ? 's' : ''} conectados
                  </p>
                </div>
              </div>
            </div>

            {/* Lado direito - Ações */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Character Select Button - for players */}
              {!isMaster && (
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

              {isMaster && (
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
      {activeSession && (
        <ActiveSessionBanner
          sessionNumber={activeSession.session_number}
          sessionTitle={activeSession.title}
          startedAt={activeSession.started_at}
          isMaster={isMaster}
          memberCount={members.length}
          onEndSession={handleEndSession}
        />
      )}

      {/* Main content - Expandido */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs melhoradas - FIXAS NO TOPO */}
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
                {isMaster && (
                  <TabsTrigger value="master" className="font-display tracking-wider text-xs sm:text-sm px-3 sm:px-5 h-10 sm:h-12 text-white/70 hover:text-white data-[state=active]:bg-primary/20 data-[state=active]:text-white transition-all">
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                    <span className="hidden sm:inline">MESTRE</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* Status Grid Tab - Expandido */}
            <TabsContent value="status" className="flex-1 p-6 sm:p-8 m-0 overflow-auto">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl tracking-wider text-foreground">
                        STATUS DOS AGENTES
                      </h3>
                      <p className="text-sm text-muted-foreground">{members.length} membros na campanha</p>
                    </div>
                  </div>
                </div>
                <CampaignStatusGrid members={members} isMaster={isMaster} />
              </div>
            </TabsContent>

            <TabsContent value="chat" className="flex-1 flex flex-col m-0 min-h-0">
              {/* Messages - Área expandida */}
              {/*
                Estabilidade (React 19): evitamos Radix ScrollArea aqui.
                Motivo: o ScrollArea faz medições/reflows que podem entrar em loop
                quando a lista atualiza rapidamente (realtime), resultando no erro #185.
                Padrão já aplicado no PlayersSidebar.
              */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                <div className="space-y-4 max-w-4xl mx-auto">
                  {messages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      currentUserId={user?.id || ''}
                      masterId={campaign.master_id}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input - Expandido e mais visível */}
              <div className="p-4 sm:p-6 border-t border-border bg-card/80 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Rolador de Dados Integrado */}
                    <IntegratedDiceRoller
                      onRoll={handleDiceRoll}
                      characterName={currentMember?.characters?.name}
                      disabled={sending}
                    />

                    {/* Log de Atividades */}
                    <SessionActivityLog messages={messages} />

                    {/* Botão de Sussurros */}
                    <WhisperDialog
                      campaignId={id || ''}
                      members={members}
                      currentCharacterId={currentMember?.character_id}
                    />

                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      disabled={sending}
                      className="text-sm sm:text-base h-11 sm:h-12"
                    />
                    <Button
                      onClick={() => sendMessage()}
                      disabled={sending || !messageInput.trim()}
                      size="lg"
                      className="h-11 sm:h-12 px-4 sm:px-6"
                    >
                      {sending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="combat" className="flex-1 p-6 sm:p-8 m-0 overflow-auto">
              <div className="space-y-8 max-w-7xl mx-auto">
                {/* CombatTracker principal */}
                <CombatTracker
                  campaignId={id}
                  isMaster={isMaster}
                  onCombatUpdate={setSharedCombatState}
                />

                {/* Integração com tabuleiro tático */}
                <IntegratedCombatBoard
                  board={board}
                  combatState={sharedCombatState}
                  isMaster={isMaster}
                  movementPerRound={9}
                />
              </div>
            </TabsContent>

            <TabsContent value="tactical" className="flex-1 p-4 sm:p-6 m-0 overflow-auto">
              <TacticalBoard
                campaignId={id || ''}
                isMaster={isMaster}
                members={members}
                externalBoard={board}
              />
            </TabsContent>

            <TabsContent value="conditions" className="flex-1 p-6 sm:p-8 m-0 overflow-auto">
              <div className="max-w-3xl mx-auto">
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
                  members={members}
                  isMaster={isMaster}
                  onMemberUpdate={onMemberUpdateThrottled}
                />
              </div>
            </TabsContent>

            <TabsContent value="notes" className="flex-1 p-6 sm:p-8 m-0 overflow-auto">
              <div className="max-w-4xl mx-auto">
                <div className="ordo-panel p-6 sm:p-8 h-full">
                  <NotesPanel campaignId={id || ''} isMaster={isMaster} />
                </div>
              </div>
            </TabsContent>

            {/* Aba de Handouts para jogadores - Expandida */}
            <TabsContent value="handouts" className="flex-1 p-6 sm:p-8 m-0 overflow-auto">
              <div className="max-w-5xl mx-auto">
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
                <PlayerHandoutsViewer campaignId={id || ''} />
              </div>
            </TabsContent>

            <TabsContent value="sessions" className="flex-1 p-6 sm:p-8 m-0 overflow-auto">
              <div className="max-w-4xl mx-auto">
                <SessionManager
                  campaignId={id || ''}
                  campaignName={campaign?.name}
                  currentSession={campaign?.current_session || 0}
                  isMaster={isMaster}
                  onSessionUpdate={fetchActiveSession}
                />
              </div>
            </TabsContent>

            {/* Diário da Campanha - Expandido com subabas */}
            <TabsContent value="diary" className="flex-1 p-6 sm:p-8 m-0 overflow-auto">
              <div className="max-w-5xl mx-auto">
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
                      campaignId={id || ''}
                      campaignName={campaign?.name}
                      isMaster={isMaster}
                    />
                  </TabsContent>

                  <TabsContent value="timeline" className="mt-4">
                    <CampaignTimeline
                      campaignId={id || ''}
                      isMaster={isMaster}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>

            {isMaster && (
              <TabsContent value="master" className="flex-1 p-4 m-0 overflow-auto">
                <Tabs defaultValue="sheets" className="space-y-4">
                  <TabsList className="bg-card border border-border flex-wrap h-auto py-1">
                    <TabsTrigger value="sheets" className="font-display text-xs">FICHAS</TabsTrigger>
                    <TabsTrigger value="npcs" className="font-display text-xs">NPCs</TabsTrigger>
                    <TabsTrigger value="macros" className="font-display text-xs">MACROS</TabsTrigger>
                    <TabsTrigger value="handouts" className="font-display text-xs">HANDOUTS</TabsTrigger>
                    <TabsTrigger value="audio" className="font-display text-xs">ÁUDIO</TabsTrigger>
                    <TabsTrigger value="controls" className="font-display text-xs">CONTROLES</TabsTrigger>
                    <TabsTrigger value="bonuses" className="font-display text-xs">BÔNUS</TabsTrigger>
                  </TabsList>

                  {/* Aba de Fichas - Nova */}
                  <TabsContent value="sheets" className="mt-4">
                    <MasterSheetViewer
                      campaignId={id || ''}
                      members={members}
                      onMemberUpdate={onMemberUpdateThrottled}
                    />
                  </TabsContent>

                  {/* Aba de NPCs/Bestiário */}
                  <TabsContent value="npcs" className="mt-4">
                    <NPCManager campaignId={id || ''} />
                  </TabsContent>

                  {/* Aba de Macros de Rolagem */}
                  <TabsContent value="macros" className="mt-4">
                    <div className="ordo-panel p-6">
                      <MacrosPanel campaignId={id || ''} />
                    </div>
                  </TabsContent>

                  {/* Aba de Handouts do Mestre */}
                  <TabsContent value="handouts" className="mt-4">
                    <div className="ordo-panel p-6">
                      <HandoutsManager campaignId={id || ''} members={members} />
                    </div>
                  </TabsContent>

                  {/* Aba de Áudio - Com Cenas de Som */}
                  <TabsContent value="audio" className="mt-4 space-y-6">
                    <AudioMasterPanel campaignId={id || ''} isMaster={isMaster} />
                    <SoundSceneManager campaignId={id || ''} isMaster={isMaster} />
                  </TabsContent>

                  {/* Aba de Controles */}
                  <TabsContent value="controls" className="mt-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Controle de Sessão */}
                      <div className="ordo-panel p-6">
                        <h3 className="font-display text-lg tracking-wider mb-4 text-primary">
                          CONTROLE DE SESSÃO
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm text-muted-foreground">Sessão Atual</label>
                            <p className="font-display text-4xl">{campaign.current_session}</p>
                          </div>
                          <Button className="w-full font-display">
                            INICIAR NOVA SESSÃO
                          </Button>
                        </div>
                      </div>

                      {/* Ações Rápidas */}
                      <div className="ordo-panel p-6">
                        <h3 className="font-display text-lg tracking-wider mb-4 text-primary">
                          AÇÕES RÁPIDAS
                        </h3>
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => {
                              sendMessage('system', '⚔️ O Mestre iniciou uma cena de combate!');
                            }}
                          >
                            Iniciar Combate
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => {
                              sendMessage('system', '🔍 O Mestre pediu testes de Percepção.');
                            }}
                          >
                            Pedir Teste de Percepção
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => {
                              sendMessage('system', '🧠 O Mestre pediu testes de Vontade.');
                            }}
                          >
                            Pedir Teste de Vontade
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Aba de Bônus */}
                  <TabsContent value="bonuses" className="mt-4">
                    <div className="ordo-panel p-6">
                      <MemberBonusesPanel campaignId={id || ''} />
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            )}
          </Tabs>
        </main>

        {/* Players Sidebar - Right side */}
        <PlayersSidebar
          members={members}
          masterId={campaign.master_id}
          isMaster={isMaster}
          onRemoveMember={removeMember}
          getUserStatus={presence.getUserStatus}
          isConnected={presence.isConnected}
        />
      </div>

      {/* Character Select Dialog */}
      <CharacterSelectDialog
        open={characterSelectOpen}
        onOpenChange={setCharacterSelectOpen}
        campaignId={id || ''}
        currentCharacterId={currentMember?.character_id || null}
        onCharacterSelect={handleCharacterSelect}
      />
    </div>
  );
}

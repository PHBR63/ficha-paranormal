import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Users
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
import { DiceRoller3D } from '@/components/dice/DiceRoller3D';
import { PlayersSidebar } from '@/components/campaign/PlayersSidebar';
import { CampaignStatusGrid } from '@/components/campaign/CampaignStatusGrid';

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

export default function CampaignView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [members, setMembers] = useState<CampaignMember[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [invite, setInvite] = useState<CampaignInvite | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [characterSelectOpen, setCharacterSelectOpen] = useState(false);

  const isMaster = campaign?.master_id === user?.id;
  const currentMember = members.find(m => m.user_id === user?.id);

  useEffect(() => {
    if (id && user) {
      fetchCampaignData();
      subscribeToMessages();
    }
  }, [id, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchCampaignData = async () => {
    if (!id || !user) return;

    try {
      // Fetch campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData);

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('campaign_members')
        .select('*')
        .eq('campaign_id', id);

      if (membersError) throw membersError;

      // Fetch profiles and characters separately for each member
      const membersWithData = await Promise.all(
        (membersData || []).map(async (member) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', member.user_id)
            .single();

          let character = null;
          if (member.character_id) {
            const { data: charData } = await supabase
              .from('characters')
              .select('id, name, class, nex, hp_current, hp_max, pe_current, pe_max, san_current, san_max, photo_url, conditions')
              .eq('id', member.character_id)
              .single();
            character = charData;
          }

          return {
            ...member,
            profiles: profile || { display_name: null, avatar_url: null },
            characters: character,
          };
        })
      );

      setMembers(membersWithData as CampaignMember[]);

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('campaign_messages')
        .select('*')
        .eq('campaign_id', id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (messagesError) throw messagesError;

      // Get profile info for messages
      const messagesWithProfiles = await Promise.all(
        (messagesData || []).map(async (msg) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', msg.user_id)
            .single();

          let character = null;
          if (msg.character_id) {
            const { data: charData } = await supabase
              .from('characters')
              .select('name')
              .eq('id', msg.character_id)
              .single();
            character = charData;
          }

          return {
            ...msg,
            profiles: profile || { display_name: null },
            characters: character,
          };
        })
      );

      setMessages(messagesWithProfiles as Message[]);

      // Fetch active invite
      const { data: inviteData } = await supabase
        .from('campaign_invites')
        .select('*')
        .eq('campaign_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (inviteData) {
        setInvite(inviteData);
      }

    } catch (error: any) {
      console.error('Error fetching campaign:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a campanha.',
        variant: 'destructive',
      });
      navigate('/campaigns');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!id) return;

    const channel = supabase
      .channel(`campaign-${id}`)
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
          
          // Fetch profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', newMsg.user_id)
            .single();

          let character = null;
          if (newMsg.character_id) {
            const { data: charData } = await supabase
              .from('characters')
              .select('name')
              .eq('id', newMsg.character_id)
              .single();
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
  };

  const sendMessage = async (type: string = 'chat', content: string = messageInput, metadata: any = {}) => {
    if (!user || !id || (!content.trim() && type === 'chat')) return;

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

  const rollDice = (diceCount: number, description: string) => {
    const result = rollSkillTest({
      attributeValue: diceCount,
      skillBonus: 0,
      label: description,
    });

    const content = `🎲 ${description}: [${result.dice.join(', ')}] → **${result.keptDice}**${result.isCritical ? ' ★ CRÍTICO!' : ''}`;
    
    sendMessage('dice_roll', content, {
      dice: result.dice,
      keptDice: result.keptDice,
      isCritical: result.isCritical,
    });
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

  const removeMember = async (memberId: string) => {
    if (!confirm('Remover este jogador da campanha?')) return;

    try {
      const { error } = await supabase
        .from('campaign_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      
      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast({ title: 'Jogador removido' });
    } catch (error: any) {
      toast({
        title: 'Erro ao remover',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCharacterSelect = async (characterId: string | null) => {
    if (!user || !id || !currentMember) return;

    try {
      const { error } = await supabase
        .from('campaign_members')
        .update({ character_id: characterId })
        .eq('id', currentMember.id);

      if (error) throw error;

      // Update local state
      setMembers(prev => prev.map(m => 
        m.id === currentMember.id 
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
            m.id === currentMember.id 
              ? { ...m, character_id: characterId, characters: typedCharData }
              : m
          ));
        }
      } else {
        setMembers(prev => prev.map(m => 
          m.id === currentMember.id 
            ? { ...m, character_id: null, characters: null }
            : m
        ));
      }

      toast({ 
        title: characterId ? 'Personagem selecionado!' : 'Personagem removido',
        description: characterId ? 'Seu agente foi vinculado à campanha.' : 'Você não está mais usando um personagem nesta campanha.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao selecionar personagem',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

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
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/campaigns">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Campanhas
                </Button>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div>
                <div className="flex items-center gap-2">
                  {isMaster && <Crown className="w-4 h-4 text-primary" />}
                  <h1 className="font-display text-xl tracking-wider">{campaign.name}</h1>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sessão {campaign.current_session} • {members.length} membros
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Character Select Button - for players */}
              {!isMaster && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="font-display"
                  onClick={() => setCharacterSelectOpen(true)}
                >
                  <UserCog className="w-4 h-4 mr-2" />
                  {currentMember?.characters ? currentMember.characters.name : 'SELECIONAR AGENTE'}
                </Button>
              )}

              {isMaster && (
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="font-display">
                      <UserPlus className="w-4 h-4 mr-2" />
                      CONVIDAR
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="font-display text-xl tracking-wider">
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
                              className="font-display text-center text-2xl tracking-widest"
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

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Main area */}
        <main className="flex-1 flex flex-col min-w-0">
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <div className="border-b border-border bg-card/30">
              <TabsList className="bg-transparent px-4">
                <TabsTrigger value="status" className="font-display tracking-wider">
                  <Users className="w-4 h-4 mr-2" />
                  AGENTES
                </TabsTrigger>
                <TabsTrigger value="chat" className="font-display tracking-wider">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  CHAT
                </TabsTrigger>
                <TabsTrigger value="combat" className="font-display tracking-wider">
                  <Swords className="w-4 h-4 mr-2" />
                  COMBATE
                </TabsTrigger>
                <TabsTrigger value="conditions" className="font-display tracking-wider">
                  <Activity className="w-4 h-4 mr-2" />
                  CONDIÇÕES
                </TabsTrigger>
                <TabsTrigger value="notes" className="font-display tracking-wider">
                  <Scroll className="w-4 h-4 mr-2" />
                  NOTAS
                </TabsTrigger>
                {isMaster && (
                  <TabsTrigger value="master" className="font-display tracking-wider text-primary">
                    <Crown className="w-4 h-4 mr-2" />
                    MESTRE
                  </TabsTrigger>
                )}
            </TabsList>
            </div>

            {/* Status Grid Tab - New */}
            <TabsContent value="status" className="flex-1 p-4 m-0 overflow-auto">
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <h3 className="font-display text-lg tracking-wider text-primary">
                      STATUS DOS AGENTES
                    </h3>
                  </div>
                </div>
                <CampaignStatusGrid members={members} isMaster={isMaster} />
              </div>
            </TabsContent>

            <TabsContent value="chat" className="flex-1 flex flex-col m-0 min-h-0">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3 max-w-3xl mx-auto">
                  {messages.map((msg) => {
                    const isOwn = msg.user_id === user?.id;
                    const isMasterMsg = msg.user_id === campaign.master_id;
                    const isDiceRoll = msg.message_type === 'dice_roll';
                    const isSystem = msg.message_type === 'system';

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          'max-w-[80%] rounded-lg p-3 animate-fade-in',
                          isSystem && 'mx-auto text-center bg-muted/30 text-muted-foreground text-sm',
                          isDiceRoll && 'bg-accent/10 border border-accent/20',
                          !isSystem && !isDiceRoll && (
                            isOwn 
                              ? 'ml-auto bg-primary/10 border border-primary/20' 
                              : 'bg-card border border-border'
                          )
                        )}
                      >
                        {!isSystem && (
                          <div className="flex items-center gap-2 mb-1">
                            {isMasterMsg && <Crown className="w-3 h-3 text-primary" />}
                            <span className="text-xs font-medium text-muted-foreground">
                              {msg.characters?.name || msg.profiles?.display_name || 'Anônimo'}
                            </span>
                            <span className="text-xs text-muted-foreground/50">
                              {new Date(msg.created_at).toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        )}
                        <p className={cn(
                          'text-sm',
                          isDiceRoll && 'font-display'
                        )}>
                          {msg.content}
                        </p>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-border bg-card/50 max-w-3xl mx-auto w-full">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => rollDice(1, 'Teste rápido')}
                    title="Rolar 1d20"
                  >
                    <Dices className="w-4 h-4" />
                  </Button>
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Digite uma mensagem..."
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    disabled={sending}
                  />
                  <Button
                    onClick={() => sendMessage()}
                    disabled={sending || !messageInput.trim()}
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="combat" className="flex-1 p-4 m-0 overflow-auto">
              <CombatTracker
                campaignId={id}
                isMaster={isMaster}
              />
            </TabsContent>

            <TabsContent value="conditions" className="flex-1 p-4 m-0 overflow-auto">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="w-5 h-5 text-primary" />
                  <h3 className="font-display text-lg tracking-wider text-primary">
                    STATUS DOS AGENTES
                  </h3>
                </div>
                <MemberConditionsPanel
                  members={members}
                  isMaster={isMaster}
                  onMemberUpdate={fetchCampaignData}
                />
              </div>
            </TabsContent>

            <TabsContent value="notes" className="flex-1 p-4 m-0">
              <div className="ordo-panel p-6 h-full">
                <h3 className="font-display text-lg tracking-wider mb-4 text-primary">
                  NOTAS DA CAMPANHA
                </h3>
                <Textarea
                  placeholder="Anote informações importantes aqui..."
                  className="min-h-[300px] resize-none"
                />
              </div>
            </TabsContent>

            {isMaster && (
              <TabsContent value="master" className="flex-1 p-4 m-0">
                <div className="grid md:grid-cols-2 gap-4">
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
            )}
          </Tabs>
        </main>
        
        {/* Players Sidebar - Right side */}
        <PlayersSidebar
          members={members}
          masterId={campaign.master_id}
          isMaster={isMaster}
          onRemoveMember={removeMember}
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

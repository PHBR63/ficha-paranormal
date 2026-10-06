import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { joinCampaignInvite } from '@/services/campaign-invite-service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast, useThemeColors } from '@/hooks';
import { Particles } from '@/components/ui/particles';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { DecryptedText } from '@/components/ui/decrypted-text';
import { ParanormalElementIcon } from '@/components/ui/paranormal-element-icon';
import { 
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { 
  Plus, 
  UsersThree, 
  Crown, 
  CalendarCheck, 
  SignIn 
} from '@phosphor-icons/react';
import { Logo } from '@/components/ui/logo';
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
import { PushNotificationToggle } from '@/components/pwa/PushNotificationToggle';
// useThemeColors já importado acima

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  master_id: string;
  status: string;
  current_session: number;
  created_at: string;
  member_count?: number;
  schemaVersion?: 'v1' | 'v2';
}

export default function Campaigns() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDescription, setNewCampaignDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [joinCharacterId, setJoinCharacterId] = useState('none');
  const [ownCharacters, setOwnCharacters] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [charactersError, setCharactersError] = useState<string | null>(null);
  const [characterReload, setCharacterReload] = useState(0);
  const [joinError, setJoinError] = useState<string | null>(null);
  const joinLock = useRef(false);
  useEffect(() => {
    if (!joinDialogOpen || !user?.id) return;
    let cancelled = false;
    setOwnCharacters([]); setJoinCharacterId('none'); setCharactersError(null); setJoinError(null); setLoadingCharacters(true);
    void (async () => {
      try {
        const { data, error } = await supabase.from('characters').select('id, name').eq('user_id', user.id).order('name');
        if (error) throw error;
        if (!cancelled) setOwnCharacters(data ?? []);
      } catch { if (!cancelled) setCharactersError('Não foi possível carregar suas fichas. Tente novamente.'); }
      finally { if (!cancelled) setLoadingCharacters(false); }
    })();
    return () => { cancelled = true; };
  }, [joinDialogOpen, user?.id, characterReload]);

  const fetchCampaigns = useCallback(async () => {
    if (!user) return;

    try {
      const loadVersion = async (version: 'v1' | 'v2'): Promise<Campaign[]> => {
        const memberTable = version === 'v2' ? 'campaign_members_v2' : 'campaign_members';
        const campaignTable = version === 'v2' ? 'campaigns_v2' : 'campaigns';
        const { data: membership, error: membershipError } = await supabase.from(memberTable).select('campaign_id').eq('user_id', user.id);
        if (membershipError) throw membershipError;
        const ids = [...new Set((membership ?? []).map(member => member.campaign_id))];
        if (!ids.length) return [];
        const { data, error } = await supabase.from(campaignTable).select('*').in('id', ids).order('updated_at', { ascending: false });
        if (error) throw error;
        return Promise.all((data ?? []).map(async campaign => {
          const { count, error: countError } = await supabase.from(memberTable).select('*', { count: 'exact', head: true }).eq('campaign_id', campaign.id);
          if (countError) throw countError;
          return { ...campaign, member_count: count ?? 0, schemaVersion: version };
        }));
      };
      const [v1, v2] = await Promise.all([loadVersion('v1'), loadVersion('v2')]);
      setCampaigns([...v2, ...v1]);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as campanhas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    void fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCreateCampaign = async () => {
    if (!user || !newCampaignName.trim()) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          name: newCampaignName.trim(),
          description: newCampaignDescription.trim() || null,
          master_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Campanha criada!',
        description: `"${data.name}" está pronta para receber agentes.`,
      });

      setCreateDialogOpen(false);
      setNewCampaignName('');
      setNewCampaignDescription('');
      navigate(`/campaigns/${data.id}`);
    } catch {
      toast({
        title: 'Erro ao criar campanha',
        description: 'Não foi possível confirmar a criação da campanha. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleJoinCampaign = async () => {
    if (!user || !inviteCode.trim() || loadingCharacters || charactersError || joinLock.current) return;
    joinLock.current = true; setJoining(true); setJoinError(null);
    try {
      if (joinCharacterId !== 'none' && !ownCharacters.some(character => character.id === joinCharacterId)) throw new Error('Selecione uma ficha da sua conta.');
      const receipt = await joinCampaignInvite(inviteCode, joinCharacterId === 'none' ? undefined : joinCharacterId);
      toast({ title: receipt.already_member ? 'Participação confirmada' : 'Você entrou na campanha!', description: `Bem-vindo a "${receipt.campaign_name}".` });
      setJoinDialogOpen(false); setInviteCode(''); setJoinCharacterId('none');
      navigate(`/campaigns/${receipt.campaign_id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível confirmar sua entrada na campanha.';
      setJoinError(message);
      toast({ title: 'Erro ao entrar na campanha', description: message, variant: 'destructive' });
    } finally { joinLock.current = false; setJoining(false); }
  };

  const themeColors = useThemeColors();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-landing-gradient-theme" />
        <FlickeringGrid className="opacity-20" squareSize={4} gridGap={8} flickerChance={0.2} color={`rgb(${themeColors.rgb})`} maxOpacity={0.2} />
        <div className="absolute inset-0 landing-noise pointer-events-none" />
        
        <div className="relative flex flex-col items-center gap-4">
          <Logo size="lg" animate glow />
          <p className="text-muted-foreground font-mono tracking-wider text-sm">CARREGANDO CAMPANHAS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects - Dynamic */}
      <div className="absolute inset-0 bg-landing-gradient-theme" />
      <FlickeringGrid className="opacity-20" squareSize={4} gridGap={8} flickerChance={0.15} color={`rgb(${themeColors.rgb})`} maxOpacity={0.15} />
      <div className="absolute inset-0 landing-noise pointer-events-none" />
      
      {/* Mist - Dynamic */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div 
          className="absolute top-1/4 right-1/3 w-[400px] h-[400px] rounded-full blur-[120px] animate-red-mist"
          style={{ backgroundColor: `${themeColors.primary}0D` }}
        />
        <div 
          className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] rounded-full blur-[100px] animate-red-mist"
          style={{ backgroundColor: `${themeColors.secondary}0D`, animationDelay: '3s' }}
        />
      </div>
      
      <div className="absolute inset-0 scan-lines opacity-10 pointer-events-none" />
      
      <Particles className="absolute inset-0 z-[1]" quantity={15} color={themeColors.primary} size={1} vx={0} vy={-0.1} staticity={100} ease={120} />
      
      <div className="absolute inset-0 vignette-theme pointer-events-none opacity-40" />

      {/* Header */}
      <header className="relative z-10 border-b border-[#8B0000]/20 bg-[#0D0A0B]/80 backdrop-blur-sm sticky top-0">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-[#808080] hover:text-[#F5F5F5] hover:bg-[#8B0000]/10 px-2 sm:px-3">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Dashboard</span>
                </Button>
              </Link>
              <div className="h-6 w-px bg-[#8B0000]/30 hidden sm:block" />
              <h1 className="font-display text-xl sm:text-2xl tracking-wider text-[#F5F5F5]">
                <DecryptedText text="CAMPANHAS" speed={40} />
              </h1>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2">
              <PushNotificationToggle variant="button" className="hidden sm:flex" />
              
              <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="font-display tracking-wider text-xs sm:text-sm px-2 sm:px-4 bg-[#1A1214] border border-[#8B0000]/30 hover:bg-[#8B0000]/20 hover:border-[#8B0000]/50 text-[#C0C0C0]">
                    <SignIn className="w-4 h-4" weight="duotone" />
                    <span className="hidden sm:inline ml-2">ENTRAR</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1A1214] border-[#8B0000]/30 max-w-[95vw] sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-display text-lg sm:text-xl tracking-wider text-[#F5F5F5]">
                      ENTRAR EM CAMPANHA
                    </DialogTitle>
                    <DialogDescription className="text-[#808080]">
                      Insira o código de convite fornecido pelo Mestre.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Input
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="CÓDIGO DE CONVITE"
                      className="font-display text-center text-lg sm:text-xl tracking-widest bg-[#0D0A0B]/50 border-[#8B0000]/30 text-[#F5F5F5] placeholder:text-[#505050] focus:border-[#8B0000]"
                      maxLength={80}
                      disabled={joining}
                      aria-label="Código de convite"
                    />
                  </div>
                  <div className="space-y-2 pb-4">
                    <Label>Ficha que participará da campanha</Label>
                    <Select value={joinCharacterId} onValueChange={setJoinCharacterId} disabled={joining || loadingCharacters || Boolean(charactersError)}>
                      <SelectTrigger aria-label="Ficha que participará da campanha"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Não vincular agora</SelectItem>
                        {ownCharacters.map(character => <SelectItem key={character.id} value={character.id}>{character.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {loadingCharacters && <p role="status" className="text-xs text-muted-foreground">Carregando suas fichas...</p>}
                    {charactersError && <div><p role="alert" className="text-sm text-destructive">{charactersError}</p><Button variant="outline" onClick={() => setCharacterReload(value => value + 1)}>Tentar carregar fichas</Button></div>}
                    {joinError && <p role="alert" className="text-sm text-destructive">{joinError}</p>}
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleJoinCampaign}
                      disabled={joining || !inviteCode.trim() || loadingCharacters || Boolean(charactersError)}
                      className="font-display tracking-wider w-full sm:w-auto bg-[#8B0000] hover:bg-[#B22222] text-white border border-[#B22222]/30"
                    >
                      {joining && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      ENTRAR
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Link to="/campaigns/create">
                <Button className="font-display tracking-wider text-xs sm:text-sm px-2 sm:px-4 bg-[#8B0000] hover:bg-[#B22222] text-white border border-[#B22222]/30 shadow-[0_0_15px_rgba(139,0,0,0.3)] hover:shadow-[0_0_25px_rgba(139,0,0,0.5)]">
                  <Plus className="w-4 h-4" weight="bold" />
                  <span className="hidden sm:inline ml-2">NOVA CAMPANHA</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {campaigns.length === 0 ? (
          <div className="text-center py-12 sm:py-20 relative">
            <div className="dossier-classified p-10 sm:p-16 max-w-lg mx-auto relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(139,0,0,0.1)_0%,_transparent_70%)]" />
              
              <div className="relative z-10">
                <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-8 rounded-full bg-[#8B0000]/10 border-2 border-[#8B0000]/30 flex items-center justify-center">
                  <UsersThree className="w-12 h-12 sm:w-16 sm:h-16 text-[#808080]" weight="duotone" />
                </div>
                <h2 className="font-display text-2xl sm:text-3xl tracking-wider text-[#F5F5F5] mb-3">
                  <DecryptedText text="NENHUMA CAMPANHA" speed={30} />
                </h2>
                <p className="text-sm sm:text-base text-[#808080] mb-6 sm:mb-8 max-w-sm mx-auto leading-relaxed">
                  Você ainda não participa de nenhuma campanha. Crie uma nova ou entre com um código de convite.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                  <Button onClick={() => setJoinDialogOpen(true)} size="lg" className="w-full sm:w-auto bg-[#1A1214] border border-[#8B0000]/30 hover:bg-[#8B0000]/20 text-[#C0C0C0]">
                    <SignIn className="w-5 h-5 mr-2" weight="duotone" />
                    Entrar com Código
                  </Button>
                  <Button onClick={() => setCreateDialogOpen(true)} size="lg" className="w-full sm:w-auto bg-[#8B0000] hover:bg-[#B22222] text-white border border-[#B22222]/30">
                    <Plus className="w-5 h-5 mr-2" weight="bold" />
                    Criar Campanha
                  </Button>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 text-[#8B0000]/10 font-display text-6xl tracking-widest rotate-[-15deg] select-none">
                VAZIO
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {campaigns.map((campaign, index) => {
              const isMaster = campaign.master_id === user?.id;
              
              return (
                <Link key={`${campaign.schemaVersion}:${campaign.id}`} to={`/campaigns/${campaign.id}`} className="group block">
                  <div className={cn(
                    'dossier-classified p-6 sm:p-8 h-full transition-all duration-300 min-h-[200px] sm:min-h-[240px]',
                    'hover:border-[#8B0000]/60 hover:shadow-[0_0_40px_rgba(139,0,0,0.25)] hover:scale-[1.02]',
                    isMaster && 'border-[#8B0000]/40'
                  )}>
                    {/* Classified tag */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[#8B0000]/40 text-[10px] font-mono uppercase tracking-wider rotate-12 inline-block">
                        Liberado
                      </span>
                    </div>
                    
                    {/* Header com Status */}
                    <div className="flex items-start justify-between mb-4 sm:mb-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {isMaster && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#8B0000]/20 border border-[#8B0000]/30">
                              <Crown className="w-4 h-4 text-[#B22222]" weight="duotone" />
                              <span className="text-[10px] sm:text-xs font-display tracking-wider text-[#B22222]">MESTRE</span>
                            </div>
                          )}
                          <span className={cn(
                            'text-xs px-3 py-1 rounded-full font-mono tracking-wider',
                            campaign.status === 'active' 
                              ? 'bg-green-900/40 text-green-400 border border-green-600/40' 
                              : 'bg-[#1A1214] text-[#808080] border border-[#8B0000]/20'
                          )}>
                            {campaign.status === 'active' ? '● ATIVA' : 
                             campaign.status === 'paused' ? '◐ PAUSADA' : 
                             campaign.status === 'completed' ? '◉ CONCLUÍDA' : '○ ARQUIVADA'}
                          </span>
                        </div>
                        <h3 className="font-display text-xl sm:text-2xl lg:text-3xl tracking-wider text-[#F5F5F5] group-hover:text-[#B22222] transition-colors line-clamp-1">
                          {campaign.name}
                        </h3>
                      </div>
                    </div>

                    {/* Descrição expandida */}
                    {campaign.description && (
                      <p className="text-sm sm:text-base text-[#808080] mb-6 line-clamp-3 leading-relaxed">
                        {campaign.description}
                      </p>
                    )}

                    {/* Stats footer - maior e mais detalhado */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#8B0000]/20">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#8B0000]/10 flex items-center justify-center">
                            <UsersThree className="w-4 h-4 text-[#B22222]" weight="duotone" />
                          </div>
                          <div>
                            <p className="text-xs text-[#606060] uppercase tracking-wider">Agentes</p>
                            <p className="font-display text-lg text-[#C0C0C0]">{campaign.member_count}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#8B0000]/10 flex items-center justify-center">
                            <CalendarCheck className="w-4 h-4 text-[#B22222]" weight="duotone" />
                          </div>
                          <div>
                            <p className="text-xs text-[#606060] uppercase tracking-wider">Sessão</p>
                            <p className="font-display text-lg text-[#C0C0C0]">{campaign.current_session}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Arrow indicator */}
                      <div className="w-10 h-10 rounded-full bg-[#8B0000]/10 flex items-center justify-center group-hover:bg-[#8B0000]/30 transition-colors">
                        <svg className="w-5 h-5 text-[#808080] group-hover:text-[#F5F5F5] transition-colors transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Bottom accent line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#8B0000]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

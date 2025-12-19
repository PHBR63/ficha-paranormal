import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Particles } from '@/components/ui/particles';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { DecryptedText } from '@/components/ui/decrypted-text';
import { ParanormalElementIcon } from '@/components/ui/paranormal-element-icon';
import { 
  Plus, 
  Users, 
  Crown, 
  Calendar, 
  ArrowLeft,
  Loader2,
  LogIn,
  Eye
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
import { PushNotificationToggle } from '@/components/pwa/PushNotificationToggle';
import { useThemeColors } from '@/hooks/useThemeColors';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  master_id: string;
  status: string;
  current_session: number;
  created_at: string;
  member_count?: number;
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

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  const fetchCampaigns = async () => {
    if (!user) return;

    try {
      const { data: memberCampaigns, error: memberError } = await supabase
        .from('campaign_members')
        .select('campaign_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      const campaignIds = memberCampaigns?.map(m => m.campaign_id) || [];
      
      if (campaignIds.length === 0) {
        setCampaigns([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .in('id', campaignIds)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const campaignsWithCounts = await Promise.all(
        (data || []).map(async (campaign) => {
          const { count } = await supabase
            .from('campaign_members')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id);
          
          return { ...campaign, member_count: count || 0 };
        })
      );

      setCampaigns(campaignsWithCounts);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as campanhas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
    } catch (error: any) {
      toast({
        title: 'Erro ao criar campanha',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleJoinCampaign = async () => {
    if (!user || !inviteCode.trim()) return;

    setJoining(true);
    try {
      const { data: validation, error: validationError } = await supabase
        .rpc('validate_campaign_invite', { code: inviteCode.trim() });

      if (validationError) throw validationError;

      const result = validation?.[0];
      if (!result?.valid) {
        throw new Error(result?.message || 'Código de convite inválido.');
      }

      const campaignId = result.campaign_id;

      const { data: existingMember } = await supabase
        .from('campaign_members')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        throw new Error('Você já é membro desta campanha.');
      }

      const { error: memberError } = await supabase
        .from('campaign_members')
        .insert({
          campaign_id: campaignId,
          user_id: user.id,
          role: 'player',
        });

      if (memberError) throw memberError;

      const { data: campaign } = await supabase
        .from('campaigns')
        .select('name')
        .eq('id', campaignId)
        .single();

      toast({
        title: 'Você entrou na campanha!',
        description: `Bem-vindo a "${campaign?.name || 'campanha'}".`,
      });

      setJoinDialogOpen(false);
      setInviteCode('');
      fetchCampaigns();
    } catch (error: any) {
      toast({
        title: 'Erro ao entrar na campanha',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setJoining(false);
    }
  };

  const themeColors = useThemeColors();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-landing-gradient-theme" />
        <FlickeringGrid className="opacity-20" squareSize={4} gridGap={8} flickerChance={0.2} color={`rgb(${themeColors.rgb})`} maxOpacity={0.2} />
        <div className="absolute inset-0 landing-noise pointer-events-none" />
        
        <div className="relative flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <Eye className="h-10 w-10 text-primary animate-pulse relative" />
          </div>
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
                    <LogIn className="w-4 h-4" />
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
                      maxLength={8}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleJoinCampaign}
                      disabled={joining || !inviteCode.trim()}
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
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">NOVA CAMPANHA</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {campaigns.length === 0 ? (
          <div className="text-center py-10 sm:py-16 relative">
            <div className="dossier-classified p-8 sm:p-12 max-w-md mx-auto relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(139,0,0,0.1)_0%,_transparent_70%)]" />
              
              <div className="relative z-10">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-[#8B0000]/10 border border-[#8B0000]/30 flex items-center justify-center">
                  <Users className="w-10 h-10 sm:w-12 sm:h-12 text-[#808080]" />
                </div>
                <h2 className="font-display text-xl sm:text-2xl tracking-wider text-[#F5F5F5] mb-2">
                  <DecryptedText text="NENHUMA CAMPANHA" speed={30} />
                </h2>
                <p className="text-sm sm:text-base text-[#808080] mb-4 sm:mb-6 max-w-sm mx-auto">
                  Você ainda não participa de nenhuma campanha. Crie uma nova ou entre com um código de convite.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
                  <Button onClick={() => setJoinDialogOpen(true)} className="w-full sm:w-auto bg-[#1A1214] border border-[#8B0000]/30 hover:bg-[#8B0000]/20 text-[#C0C0C0]">
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar com Código
                  </Button>
                  <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto bg-[#8B0000] hover:bg-[#B22222] text-white border border-[#B22222]/30">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Campanha
                  </Button>
                </div>
              </div>
              
              <div className="absolute -bottom-2 -right-2 text-[#8B0000]/10 font-display text-5xl tracking-widest rotate-[-15deg] select-none">
                VAZIO
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {campaigns.map((campaign, index) => {
              const isMaster = campaign.master_id === user?.id;
              
              return (
                <Link key={campaign.id} to={`/campaigns/${campaign.id}`} className="group">
                  <div className={cn(
                    'dossier-classified p-4 sm:p-6 h-full transition-all duration-300',
                    'hover:border-[#8B0000]/60 hover:shadow-[0_0_25px_rgba(139,0,0,0.2)]',
                    isMaster && 'border-[#8B0000]/40'
                  )}>
                    {/* Classified tag */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[#8B0000]/30 text-[8px] font-mono uppercase tracking-wider rotate-12 inline-block">
                        Liberado
                      </span>
                    </div>
                    
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isMaster && (
                            <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-[#B22222] flex-shrink-0" />
                          )}
                          <span className={cn(
                            'text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-mono tracking-wider flex-shrink-0',
                            campaign.status === 'active' 
                              ? 'bg-green-900/30 text-green-400 border border-green-600/30' 
                              : 'bg-[#1A1214] text-[#808080] border border-[#8B0000]/20'
                          )}>
                            {campaign.status === 'active' ? 'ATIVA' : 
                             campaign.status === 'paused' ? 'PAUSADA' : 
                             campaign.status === 'completed' ? 'CONCLUÍDA' : 'ARQUIVADA'}
                          </span>
                        </div>
                        <h3 className="font-display text-lg sm:text-xl tracking-wider text-[#F5F5F5] group-hover:text-[#B22222] transition-colors truncate">
                          {campaign.name}
                        </h3>
                      </div>
                    </div>

                    {campaign.description && (
                      <p className="text-xs sm:text-sm text-[#808080] mb-3 sm:mb-4 line-clamp-2">
                        {campaign.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs sm:text-sm text-[#606060]">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{campaign.member_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>S{campaign.current_session}</span>
                        </div>
                      </div>
                      {isMaster && (
                        <span className="text-[#B22222] font-display text-[10px] sm:text-xs tracking-wider">
                          MESTRE
                        </span>
                      )}
                    </div>
                    
                    {/* Bottom accent line */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#8B0000]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
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

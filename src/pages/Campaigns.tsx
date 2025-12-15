import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Users, 
  Crown, 
  Calendar, 
  ArrowLeft,
  Loader2,
  Search,
  LogIn
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

  // Form states
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDescription, setNewCampaignDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  const fetchCampaigns = async () => {
    if (!user) return;

    try {
      // Fetch campaigns where user is master or member
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

      // Get member counts
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

  // Função para entrar em campanha usando RPC seguro
  const handleJoinCampaign = async () => {
    if (!user || !inviteCode.trim()) return;

    setJoining(true);
    try {
      // Valida o código usando função RPC segura (não expõe a tabela)
      const { data: validation, error: validationError } = await supabase
        .rpc('validate_campaign_invite', { code: inviteCode.trim() });

      if (validationError) throw validationError;

      const result = validation?.[0];
      if (!result?.valid) {
        throw new Error(result?.message || 'Código de convite inválido.');
      }

      const campaignId = result.campaign_id;

      // Verifica se já é membro
      const { data: existingMember } = await supabase
        .from('campaign_members')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        throw new Error('Você já é membro desta campanha.');
      }

      // Adiciona como membro
      const { error: memberError } = await supabase
        .from('campaign_members')
        .insert({
          campaign_id: campaignId,
          user_id: user.id,
          role: 'player',
        });

      if (memberError) throw memberError;

      // Busca o nome da campanha para exibir no toast
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-display tracking-wider">CARREGANDO CAMPANHAS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      {/* Header - Responsivo */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-muted-foreground px-2 sm:px-3">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Dashboard</span>
                </Button>
              </Link>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <h1 className="font-display text-xl sm:text-2xl tracking-wider">CAMPANHAS</h1>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="font-display tracking-wider text-xs sm:text-sm px-2 sm:px-4">
                    <LogIn className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">ENTRAR</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-display text-lg sm:text-xl tracking-wider">
                      ENTRAR EM CAMPANHA
                    </DialogTitle>
                    <DialogDescription>
                      Insira o código de convite fornecido pelo Mestre.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Input
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="CÓDIGO DE CONVITE"
                      className="font-display text-center text-lg sm:text-xl tracking-widest"
                      maxLength={8}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleJoinCampaign}
                      disabled={joining || !inviteCode.trim()}
                      className="font-display tracking-wider w-full sm:w-auto"
                    >
                      {joining && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      ENTRAR
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Link to="/campaigns/create">
                <Button className="font-display tracking-wider text-xs sm:text-sm px-2 sm:px-4">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">NOVA CAMPANHA</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {campaigns.length === 0 ? (
          <div className="text-center py-10 sm:py-16">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-lg bg-muted/50 flex items-center justify-center">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl sm:text-2xl tracking-wider mb-2">NENHUMA CAMPANHA</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto px-4">
              Você ainda não participa de nenhuma campanha. Crie uma nova ou entre com um código de convite.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 px-4">
              <Button variant="outline" onClick={() => setJoinDialogOpen(true)} className="w-full sm:w-auto">
                <LogIn className="w-4 h-4 mr-2" />
                Entrar com Código
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Criar Campanha
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {campaigns.map((campaign) => {
              const isMaster = campaign.master_id === user?.id;
              
              return (
                <Link
                  key={campaign.id}
                  to={`/campaigns/${campaign.id}`}
                  className="group"
                >
                  <div className={cn(
                    'ordo-panel p-4 sm:p-6 h-full transition-all duration-300',
                    'hover:border-primary/50 hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)]',
                    isMaster && 'border-primary/30'
                  )}>
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isMaster && (
                            <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                          )}
                          <span className={cn(
                            'text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-display tracking-wider flex-shrink-0',
                            campaign.status === 'active' 
                              ? 'bg-success/20 text-success' 
                              : 'bg-muted text-muted-foreground'
                          )}>
                            {campaign.status === 'active' ? 'ATIVA' : 
                             campaign.status === 'paused' ? 'PAUSADA' : 
                             campaign.status === 'completed' ? 'CONCLUÍDA' : 'ARQUIVADA'}
                          </span>
                        </div>
                        <h3 className="font-display text-lg sm:text-xl tracking-wider group-hover:text-primary transition-colors truncate">
                          {campaign.name}
                        </h3>
                      </div>
                    </div>

                    {campaign.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
                        {campaign.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
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
                        <span className="text-primary font-display text-[10px] sm:text-xs tracking-wider">
                          MESTRE
                        </span>
                      )}
                    </div>
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

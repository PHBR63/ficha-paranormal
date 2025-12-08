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

  const handleJoinCampaign = async () => {
    if (!user || !inviteCode.trim()) return;

    setJoining(true);
    try {
      // Find invite
      const { data: invite, error: inviteError } = await supabase
        .from('campaign_invites')
        .select('*, campaigns(*)')
        .eq('invite_code', inviteCode.trim().toUpperCase())
        .single();

      if (inviteError || !invite) {
        throw new Error('Código de convite inválido.');
      }

      // Check if expired
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        throw new Error('Este convite expirou.');
      }

      // Check max uses
      if (invite.max_uses && invite.uses >= invite.max_uses) {
        throw new Error('Este convite atingiu o limite de usos.');
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('campaign_members')
        .select('id')
        .eq('campaign_id', invite.campaign_id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        throw new Error('Você já é membro desta campanha.');
      }

      // Add as member
      const { error: memberError } = await supabase
        .from('campaign_members')
        .insert({
          campaign_id: invite.campaign_id,
          user_id: user.id,
          role: 'player',
        });

      if (memberError) throw memberError;

      // Increment invite uses
      await supabase
        .from('campaign_invites')
        .update({ uses: invite.uses + 1 })
        .eq('id', invite.id);

      toast({
        title: 'Você entrou na campanha!',
        description: `Bem-vindo a "${(invite.campaigns as any).name}".`,
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
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="h-6 w-px bg-border" />
              <h1 className="font-display text-2xl tracking-wider">CAMPANHAS</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="font-display tracking-wider">
                    <LogIn className="w-4 h-4 mr-2" />
                    ENTRAR
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="font-display text-xl tracking-wider">
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
                      className="font-display text-center text-xl tracking-widest"
                      maxLength={8}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleJoinCampaign}
                      disabled={joining || !inviteCode.trim()}
                      className="font-display tracking-wider"
                    >
                      {joining && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      ENTRAR
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="font-display tracking-wider">
                    <Plus className="w-4 h-4 mr-2" />
                    NOVA CAMPANHA
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="font-display text-xl tracking-wider">
                      NOVA CAMPANHA
                    </DialogTitle>
                    <DialogDescription>
                      Crie uma nova campanha e convide jogadores.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">
                        Nome da Campanha
                      </label>
                      <Input
                        value={newCampaignName}
                        onChange={(e) => setNewCampaignName(e.target.value)}
                        placeholder="Ex: O Mistério de Silent Hill"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">
                        Descrição (opcional)
                      </label>
                      <Textarea
                        value={newCampaignDescription}
                        onChange={(e) => setNewCampaignDescription(e.target.value)}
                        placeholder="Uma breve descrição da campanha..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleCreateCampaign}
                      disabled={creating || !newCampaignName.trim()}
                      className="font-display tracking-wider"
                    >
                      {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      CRIAR CAMPANHA
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {campaigns.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-lg bg-muted/50 flex items-center justify-center">
              <Users className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="font-display text-2xl tracking-wider mb-2">NENHUMA CAMPANHA</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Você ainda não participa de nenhuma campanha. Crie uma nova ou entre com um código de convite.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setJoinDialogOpen(true)}>
                <LogIn className="w-4 h-4 mr-2" />
                Entrar com Código
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Campanha
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => {
              const isMaster = campaign.master_id === user?.id;
              
              return (
                <Link
                  key={campaign.id}
                  to={`/campaigns/${campaign.id}`}
                  className="group"
                >
                  <div className={cn(
                    'ordo-panel p-6 h-full transition-all duration-300',
                    'hover:border-primary/50 hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)]',
                    isMaster && 'border-primary/30'
                  )}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {isMaster && (
                            <Crown className="w-4 h-4 text-primary" />
                          )}
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded font-display tracking-wider',
                            campaign.status === 'active' 
                              ? 'bg-success/20 text-success' 
                              : 'bg-muted text-muted-foreground'
                          )}>
                            {campaign.status === 'active' ? 'ATIVA' : 
                             campaign.status === 'paused' ? 'PAUSADA' : 
                             campaign.status === 'completed' ? 'CONCLUÍDA' : 'ARQUIVADA'}
                          </span>
                        </div>
                        <h3 className="font-display text-xl tracking-wider group-hover:text-primary transition-colors">
                          {campaign.name}
                        </h3>
                      </div>
                    </div>

                    {campaign.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {campaign.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{campaign.member_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Sessão {campaign.current_session}</span>
                        </div>
                      </div>
                      {isMaster && (
                        <span className="text-primary font-display text-xs tracking-wider">
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

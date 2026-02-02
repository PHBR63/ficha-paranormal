import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeSelector } from '@/components/ui/theme-selector';
import { Particles } from '@/components/ui/particles';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { DecryptedText } from '@/components/ui/decrypted-text';
import { BlurText } from '@/components/ui/blur-text';
import { Plus, LogOut, User, FileText, Users, Shield, Smartphone, Package, MapPin } from 'lucide-react';
import { LogoBox } from '@/components/ui/logo';
import { useToast, useAdminCheck, useThemeColors } from '@/hooks';
import { CharacterCard } from '@/components/cards/CharacterCard';
import { CampaignCard, type CampaignCardData } from '@/components/cards/CampaignCard';
import { ParanormalElementIcon } from '@/components/ui/paranormal-element-icon';

// Interface para personagem no dashboard
interface Character {
  id: string;
  name: string;
  class: string;
  origin: string;
  nex: number;
  patent: string;
  hp_current: number;
  hp_max: number;
  pe_current: number;
  pe_max: number;
  san_current: number;
  san_max: number;
  photo_url?: string | null;
  conditions?: string[];
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { isAdmin } = useAdminCheck();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [profile, setProfile] = useState<{ display_name: string | null; } | null>(null);
  const [activeTab, setActiveTab] = useState('agents');

  // Busca dados do usuário
  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      // Busca perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();
      setProfile(profileData);

      // Busca personagens
      const { data: charactersData } = await supabase
        .from('characters')
        .select('id, name, class, origin, nex, patent, hp_current, hp_max, pe_current, pe_max, san_current, san_max, photo_url, conditions')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      const chars = (charactersData || []).map(c => ({
        ...c,
        conditions: Array.isArray(c.conditions) ? c.conditions as string[] : []
      }));
      setCharacters(chars);
      setLoading(false);
    }
    fetchData();
  }, [user]);

  // Busca campanhas (v2 com fallback v1)
  useEffect(() => {
    async function fetchCampaigns() {
      if (!user) return;
      setLoadingCampaigns(true);

      try {
        // Busca membros v2 do usuário
        const { data: membershipV2 } = await supabase
          .from('campaign_members_v2')
          .select(`
            campaign_id,
            role,
            character_id,
            characters (id, name, class, photo_url)
          `)
          .eq('user_id', user.id);

        // IDs de campanhas v2
        const campaignIdsV2 = (membershipV2 || []).map(m => m.campaign_id);

        // Busca campanhas v2
        let campaignsV2: CampaignCardData[] = [];
        if (campaignIdsV2.length > 0) {
          const { data: campaignsDataV2 } = await supabase
            .from('campaigns_v2')
            .select('*')
            .in('id', campaignIdsV2);

          // Conta jogadores por campanha v2
          const { data: memberCountsV2 } = await supabase
            .from('campaign_members_v2')
            .select('campaign_id')
            .in('campaign_id', campaignIdsV2);

          // Busca próximas sessões v2
          const { data: sessionsV2 } = await supabase
            .from('campaign_sessions_v2')
            .select('campaign_id, scheduled_at')
            .in('campaign_id', campaignIdsV2)
            .eq('status', 'scheduled')
            .gte('scheduled_at', new Date().toISOString())
            .order('scheduled_at', { ascending: true });

          // Mapeia contagens e sessões
          const countMapV2: Record<string, number> = {};
          (memberCountsV2 || []).forEach(m => {
            countMapV2[m.campaign_id] = (countMapV2[m.campaign_id] || 0) + 1;
          });

          const sessionMapV2: Record<string, string> = {};
          (sessionsV2 || []).forEach(s => {
            if (!sessionMapV2[s.campaign_id]) {
              sessionMapV2[s.campaign_id] = s.scheduled_at!;
            }
          });

          // Monta dados das campanhas v2
          campaignsV2 = (campaignsDataV2 || []).map(c => {
            const membership = membershipV2?.find(m => m.campaign_id === c.id);
            const isMaster = c.master_id === user.id;
            return {
              id: c.id,
              name: c.name,
              description: c.description,
              cover_image_url: c.cover_image_url,
              status: c.status as CampaignCardData['status'],
              current_session: c.current_session,
              master_id: c.master_id,
              player_count: countMapV2[c.id] || 0,
              next_session: sessionMapV2[c.id] || null,
              user_character: membership?.characters ? {
                id: membership.characters.id,
                name: membership.characters.name,
                class: membership.characters.class,
                photo_url: membership.characters.photo_url,
              } : null,
              is_master: isMaster,
            };
          });
        }

        // Busca membros v1 do usuário (fallback)
        const { data: membershipV1 } = await supabase
          .from('campaign_members')
          .select(`
            campaign_id,
            role,
            character_id,
            characters (id, name, class, photo_url)
          `)
          .eq('user_id', user.id);

        // IDs de campanhas v1 (excluindo as que já estão em v2)
        const campaignIdsV1 = (membershipV1 || [])
          .map(m => m.campaign_id)
          .filter(id => !campaignIdsV2.includes(id));

        // Busca campanhas v1
        let campaignsV1: CampaignCardData[] = [];
        if (campaignIdsV1.length > 0) {
          const { data: campaignsDataV1 } = await supabase
            .from('campaigns')
            .select('*')
            .in('id', campaignIdsV1);

          // Conta jogadores por campanha v1
          const { data: memberCountsV1 } = await supabase
            .from('campaign_members')
            .select('campaign_id')
            .in('campaign_id', campaignIdsV1);

          // Busca próximas sessões v1
          const { data: sessionsV1 } = await supabase
            .from('campaign_sessions')
            .select('campaign_id, scheduled_at')
            .in('campaign_id', campaignIdsV1)
            .eq('status', 'scheduled')
            .gte('scheduled_at', new Date().toISOString())
            .order('scheduled_at', { ascending: true });

          // Mapeia contagens e sessões
          const countMapV1: Record<string, number> = {};
          (memberCountsV1 || []).forEach(m => {
            countMapV1[m.campaign_id] = (countMapV1[m.campaign_id] || 0) + 1;
          });

          const sessionMapV1: Record<string, string> = {};
          (sessionsV1 || []).forEach(s => {
            if (!sessionMapV1[s.campaign_id] && s.scheduled_at) {
              sessionMapV1[s.campaign_id] = s.scheduled_at;
            }
          });

          // Monta dados das campanhas v1
          campaignsV1 = (campaignsDataV1 || []).map(c => {
            const membership = membershipV1?.find(m => m.campaign_id === c.id);
            const isMaster = c.master_id === user.id;
            return {
              id: c.id,
              name: c.name,
              description: c.description,
              cover_image_url: c.cover_image_url,
              status: c.status as CampaignCardData['status'],
              current_session: c.current_session,
              master_id: c.master_id,
              player_count: countMapV1[c.id] || 0,
              next_session: sessionMapV1[c.id] || null,
              user_character: membership?.characters ? {
                id: membership.characters.id,
                name: membership.characters.name,
                class: membership.characters.class,
                photo_url: membership.characters.photo_url,
              } : null,
              is_master: isMaster,
            };
          });
        }

        // Combina v2 e v1
        setCampaigns([...campaignsV2, ...campaignsV1]);
      } catch (error) {
        console.error('Erro ao carregar campanhas:', error);
      } finally {
        setLoadingCampaigns(false);
      }
    }
    fetchCampaigns();
  }, [user]);

  // Exclusão de personagem
  const handleDeleteCharacter = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir ${name}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    const { error } = await supabase.from('characters').delete().eq('id', id);
    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o personagem.',
        variant: 'destructive'
      });
    } else {
      setCharacters(characters.filter(c => c.id !== id));
      toast({
        title: 'Agente Removido',
        description: `O dossiê de ${name} foi arquivado permanentemente.`
      });
    }
  };

  // Exclusão de campanha
  const handleDeleteCampaign = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a campanha "${name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    // Tenta deletar v2 primeiro, depois v1
    const { error: errorV2 } = await supabase.from('campaigns_v2').delete().eq('id', id);
    const { error: errorV1 } = await supabase.from('campaigns').delete().eq('id', id);
    
    if (errorV2 && errorV1) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a campanha.',
        variant: 'destructive'
      });
    } else {
      setCampaigns(campaigns.filter(c => c.id !== id));
      toast({
        title: 'Campanha Removida',
        description: `A campanha "${name}" foi arquivada permanentemente.`
      });
    }
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Agente';

  // Verifica se algum personagem tem HP ou SAN baixos
  const hasLowStats = characters.some(c => 
    c.hp_current < c.hp_max * 0.3 || c.san_current < c.san_max * 0.3
  );

  // Cores do tema para efeitos dinâmicos
  const themeColors = useThemeColors();

  // Contagem de campanhas ativas
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects - Dynamic per theme */}
      <div className="absolute inset-0 bg-landing-gradient-theme" />
      
      {/* Flickering Grid - Dynamic color */}
      <FlickeringGrid 
        className="opacity-30"
        squareSize={4}
        gridGap={8}
        flickerChance={0.2}
        color={`rgb(${themeColors.rgb})`}
        maxOpacity={0.2}
      />
      
      {/* Noise texture */}
      <div className="absolute inset-0 landing-noise pointer-events-none" />
      
      {/* Mist effect - Dynamic color */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div 
          className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] animate-red-mist"
          style={{ backgroundColor: `${themeColors.primary}10` }}
        />
        <div 
          className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] rounded-full blur-[100px] animate-red-mist"
          style={{ backgroundColor: `${themeColors.secondary}10`, animationDelay: '3s' }}
        />
      </div>
      
      {/* Scan lines overlay */}
      <div className="absolute inset-0 scan-lines opacity-10 pointer-events-none" />
      
      {/* Particles - Dynamic color */}
      <Particles
        className="absolute inset-0 z-[1]"
        quantity={20}
        color={themeColors.primary}
        size={1.2}
        vx={0}
        vy={-0.15}
        staticity={90}
        ease={120}
      />
      
      {/* Vignette - Dynamic */}
      <div className="absolute inset-0 vignette-theme pointer-events-none opacity-50" />

      {/* Header */}
      <header className="relative z-10 border-b border-primary/20 backdrop-blur-sm sticky top-0 bg-background/80">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <LogoBox size="md" animate={hasLowStats} />
            <div>
              <h1 className="font-display text-lg sm:text-xl tracking-wide text-foreground">LET'S ROLL</h1>
              <p className="text-[9px] sm:text-[10px] text-primary tracking-[0.15em] sm:tracking-[0.2em] uppercase hidden sm:block">Painel do Agente</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeSelector />
            <Link to="/install" className="hidden sm:flex">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-primary/10">
                <Smartphone className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="text-sm hidden md:block text-muted-foreground">{displayName}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground hover:text-foreground hover:bg-primary/10">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Welcome section */}
        <section className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-primary font-mono mb-1">
                Central de Operações
              </p>
              <h2 className="font-display text-2xl sm:text-4xl tracking-wide text-foreground flex items-center gap-2 flex-wrap">
                <span>BEM-VINDO,</span>
                <span className="text-primary">
                  <DecryptedText 
                    text={displayName.toUpperCase()} 
                    speed={40}
                    className="font-display"
                  />
                </span>
              </h2>
              <span className="text-sm text-muted-foreground mt-1 hidden sm:block">
                <BlurText text="Gerencie seus agentes e missões na Ordo Realitas." delay={0.3} />
              </span>
            </div>
            <div className="flex gap-2 sm:gap-3">
              {isAdmin && (
                <Link to="/admin/import" className="flex-1 sm:flex-none">
                  <Button className="w-full sm:w-auto font-display tracking-wider text-xs sm:text-sm bg-card border border-primary/30 hover:bg-primary/20 hover:border-primary/50 text-muted-foreground">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Admin</span>
                    <span className="sm:hidden">Adm</span>
                  </Button>
                </Link>
              )}
              <Link to="/my-templates" className="flex-1 sm:flex-none">
                <Button className="w-full sm:w-auto font-display tracking-wider text-xs sm:text-sm bg-card border border-primary/30 hover:bg-primary/20 hover:border-primary/50 text-muted-foreground">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Templates</span>
                  <span className="sm:hidden">Tpl</span>
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Quick stats - Estilo Dossiê */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
          <div className="dossier-classified p-4 group hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <ParanormalElementIcon element="sangue" size="sm" variant="glow" />
              </div>
              <div>
                <p className="font-display text-2xl text-foreground">{characters.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Agentes</p>
              </div>
            </div>
          </div>
          <div className="dossier-classified p-4 group hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <ParanormalElementIcon element="conhecimento" size="sm" variant="glow" />
              </div>
              <div>
                <p className="font-display text-2xl text-foreground">{campaigns.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Mesas</p>
              </div>
            </div>
          </div>
          <div className="dossier-classified p-4 group hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <ParanormalElementIcon element="medo" size="sm" variant="glow" />
              </div>
              <div>
                <p className="font-display text-2xl text-foreground">{activeCampaigns}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Ativas</p>
              </div>
            </div>
          </div>
          <div className="dossier-classified p-4 group hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <ParanormalElementIcon element="energia" size="sm" variant="glow" />
              </div>
              <div>
                <p className="font-display text-2xl text-foreground">{campaigns.filter(c => c.is_master).length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Mestrando</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs para Agentes e Campanhas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full max-w-md mx-auto mb-6 sm:mb-8 grid grid-cols-2 bg-card border border-primary/20">
            <TabsTrigger 
              value="agents" 
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-foreground font-display tracking-wider"
            >
              <FileText className="w-4 h-4 mr-2" />
              Agentes
              <span className="ml-2 text-xs text-muted-foreground">({characters.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="campaigns" 
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-foreground font-display tracking-wider"
            >
              <Users className="w-4 h-4 mr-2" />
              Campanhas
              <span className="ml-2 text-xs text-muted-foreground">({campaigns.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Aba de Agentes */}
          <TabsContent value="agents">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <h3 className="font-display text-lg sm:text-xl tracking-wider text-primary flex items-center gap-2">
                DOSSIÊS DE AGENTES
              </h3>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            </div>

            {/* Botão criar novo agente */}
            <div className="flex justify-end mb-6">
              <Link to="/character/create">
                <Button className="font-display tracking-wider text-xs sm:text-sm bg-primary hover:bg-primary/80 text-primary-foreground border border-primary/30 shadow-[0_0_15px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_25px_hsl(var(--primary)/0.5)] transition-all">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  Novo Agente
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <LogoBox size="lg" animate />
                </div>
                <p className="text-muted-foreground mt-4 font-mono text-sm">Carregando dossiês...</p>
              </div>
            ) : characters.length === 0 ? (
              <div className="dossier-classified text-center py-12 sm:py-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_hsl(var(--primary)/0.1)_0%,_transparent_70%)]" />
                
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl text-foreground mb-2">
                    <DecryptedText text="NENHUM DOSSIÊ ENCONTRADO" speed={30} />
                  </h3>
                  <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                    Crie seu primeiro agente para começar suas missões.
                  </p>
                  <Link to="/character/create">
                    <Button className="bg-primary hover:bg-primary/80 text-primary-foreground border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] transition-all">
                      <Plus className="w-5 h-5 mr-2" />
                      Criar Primeiro Agente
                    </Button>
                  </Link>
                </div>
                
                <div className="absolute -bottom-2 -right-2 text-primary/10 font-display text-6xl tracking-widest rotate-[-15deg] select-none">
                  VAZIO
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {characters.map((character, index) => (
                  <CharacterCard 
                    key={character.id} 
                    character={{
                      id: character.id,
                      name: character.name,
                      class: character.class,
                      origin: character.origin,
                      nex: character.nex,
                      patent: character.patent,
                      hp_current: character.hp_current,
                      hp_max: character.hp_max,
                      pe_current: character.pe_current,
                      pe_max: character.pe_max,
                      san_current: character.san_current,
                      san_max: character.san_max,
                      photo_url: character.photo_url,
                      conditions: character.conditions || []
                    }} 
                    onDelete={() => handleDeleteCharacter(character.id, character.name)} 
                    index={index} 
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Aba de Campanhas */}
          <TabsContent value="campaigns">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <h3 className="font-display text-lg sm:text-xl tracking-wider text-primary flex items-center gap-2">
                MINHAS CAMPANHAS
              </h3>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            </div>

            {/* Botões de ação para campanhas */}
            <div className="flex justify-end gap-2 mb-6">
              <Link to="/campaigns">
                <Button variant="outline" className="font-display tracking-wider text-xs sm:text-sm border-primary/30 hover:bg-primary/20">
                  <Users className="w-4 h-4 mr-2" />
                  Ver Todas
                </Button>
              </Link>
              <Link to="/campaigns/create">
                <Button className="font-display tracking-wider text-xs sm:text-sm bg-primary hover:bg-primary/80 text-primary-foreground border border-primary/30 shadow-[0_0_15px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_25px_hsl(var(--primary)/0.5)] transition-all">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  Nova Campanha
                </Button>
              </Link>
            </div>

            {loadingCampaigns ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <LogoBox size="lg" animate />
                </div>
                <p className="text-muted-foreground mt-4 font-mono text-sm">Carregando campanhas...</p>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="dossier-classified text-center py-12 sm:py-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_hsl(var(--primary)/0.1)_0%,_transparent_70%)]" />
                
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <MapPin className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl text-foreground mb-2">
                    <DecryptedText text="NENHUMA CAMPANHA ENCONTRADA" speed={30} />
                  </h3>
                  <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                    Crie uma nova campanha ou entre em uma existente.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link to="/campaigns">
                      <Button variant="outline" className="border-primary/30 hover:bg-primary/20">
                        <Users className="w-5 h-5 mr-2" />
                        Explorar Campanhas
                      </Button>
                    </Link>
                    <Link to="/campaigns/create">
                      <Button className="bg-primary hover:bg-primary/80 text-primary-foreground border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] transition-all">
                        <Plus className="w-5 h-5 mr-2" />
                        Criar Campanha
                      </Button>
                    </Link>
                  </div>
                </div>
                
                <div className="absolute -bottom-2 -right-2 text-primary/10 font-display text-6xl tracking-widest rotate-[-15deg] select-none">
                  VAZIO
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {campaigns.map((campaign, index) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onDelete={campaign.is_master ? () => handleDeleteCampaign(campaign.id, campaign.name) : undefined}
                    index={index}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

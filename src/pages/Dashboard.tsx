import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ThemeSelector } from '@/components/ui/theme-selector';
import { Particles } from '@/components/ui/particles';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { DecryptedText } from '@/components/ui/decrypted-text';
import { BlurText } from '@/components/ui/blur-text';
import { Plus, LogOut, User, FileText, Users, Settings, Loader2, AlertTriangle, Skull, Shield, Smartphone } from 'lucide-react';
import { LogoBox } from '@/components/ui/logo';
import { useToast } from '@/hooks/use-toast';
import { CharacterCard } from '@/components/cards/CharacterCard';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { ParanormalElementIcon } from '@/components/ui/paranormal-element-icon';
import { useThemeColors } from '@/hooks/useThemeColors';

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
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ display_name: string | null; } | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();
      setProfile(profileData);

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

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Agente';

  // Check if any character has low HP or SAN
  const hasLowStats = characters.some(c => 
    c.hp_current < c.hp_max * 0.3 || c.san_current < c.san_max * 0.3
  );

  // Theme colors for dynamic effects
  const themeColors = useThemeColors();

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
              <p className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-[#8B0000] font-mono mb-1">
                Central de Operações
              </p>
              <h2 className="font-display text-2xl sm:text-4xl tracking-wide text-[#F5F5F5] flex items-center gap-2 flex-wrap">
                <span>BEM-VINDO,</span>
                <span className="text-[#B22222]">
                  <DecryptedText 
                    text={displayName.toUpperCase()} 
                    speed={40}
                    className="font-display"
                  />
                </span>
              </h2>
              <p className="text-sm text-[#808080] mt-1 hidden sm:block">
                <BlurText text="Gerencie seus agentes e missões na Ordo Realitas." delay={0.3} />
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              {isAdmin && (
                <Link to="/admin/import" className="flex-1 sm:flex-none">
                  <Button className="w-full sm:w-auto font-display tracking-wider text-xs sm:text-sm bg-[#1A1214] border border-[#8B0000]/30 hover:bg-[#8B0000]/20 hover:border-[#8B0000]/50 text-[#C0C0C0]">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Admin</span>
                    <span className="sm:hidden">Adm</span>
                  </Button>
                </Link>
              )}
              <Link to="/campaigns" className="flex-1 sm:flex-none">
                <Button className="w-full sm:w-auto font-display tracking-wider text-xs sm:text-sm bg-[#1A1214] border border-[#8B0000]/30 hover:bg-[#8B0000]/20 hover:border-[#8B0000]/50 text-[#C0C0C0]">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Campanhas</span>
                  <span className="sm:hidden">Mesas</span>
                </Button>
              </Link>
              <Link to="/character/create" className="flex-1 sm:flex-none">
                <Button className="w-full sm:w-auto font-display tracking-wider text-xs sm:text-sm bg-[#8B0000] hover:bg-[#B22222] text-white border border-[#B22222]/30 shadow-[0_0_15px_rgba(139,0,0,0.3)] hover:shadow-[0_0_25px_rgba(139,0,0,0.5)] transition-all">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Novo Agente</span>
                  <span className="sm:hidden">Novo</span>
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Quick stats - Estilo Dossiê */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
          <div className="dossier-classified p-4 group hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#8B0000]/10 border border-[#8B0000]/30 flex items-center justify-center">
                <ParanormalElementIcon element="sangue" size="sm" variant="glow" />
              </div>
              <div>
                <p className="font-display text-2xl text-[#F5F5F5]">{characters.length}</p>
                <p className="text-[10px] text-[#808080] uppercase tracking-wider font-mono">Agentes</p>
              </div>
            </div>
          </div>
          <div className="dossier-classified p-4 group hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#8B0000]/10 border border-[#8B0000]/30 flex items-center justify-center">
                <ParanormalElementIcon element="conhecimento" size="sm" variant="glow" />
              </div>
              <div>
                <p className="font-display text-2xl text-[#F5F5F5]">0</p>
                <p className="text-[10px] text-[#808080] uppercase tracking-wider font-mono">Mesas</p>
              </div>
            </div>
          </div>
          <div className="dossier-classified p-4 group hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#8B0000]/10 border border-[#8B0000]/30 flex items-center justify-center">
                <ParanormalElementIcon element="medo" size="sm" variant="glow" />
              </div>
              <div>
                <p className="font-display text-2xl text-[#F5F5F5]">0</p>
                <p className="text-[10px] text-[#808080] uppercase tracking-wider font-mono">Missões</p>
              </div>
            </div>
          </div>
          <div className="dossier-classified p-4 group hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#8B0000]/10 border border-[#8B0000]/30 flex items-center justify-center">
                <ParanormalElementIcon element="energia" size="sm" variant="glow" />
              </div>
              <div>
                <p className="font-display text-2xl text-[#F5F5F5]">—</p>
                <p className="text-[10px] text-[#808080] uppercase tracking-wider font-mono">Config</p>
              </div>
            </div>
          </div>
        </section>

        {/* Characters section */}
        <section>
            <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#8B0000]/40 to-transparent" />
            <h3 className="font-display text-lg sm:text-xl tracking-wider text-[#B22222] flex items-center gap-2">
              DOSSIÊS DE AGENTES
            </h3>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#8B0000]/40 to-transparent" />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <LogoBox size="lg" animate />
              </div>
              <p className="text-[#808080] mt-4 font-mono text-sm">Carregando dossiês...</p>
            </div>
          ) : characters.length === 0 ? (
            <div className="dossier-classified text-center py-12 sm:py-16 relative overflow-hidden">
              {/* Background effect */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(139,0,0,0.1)_0%,_transparent_70%)]" />
              
              <div className="relative z-10">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#8B0000]/10 border border-[#8B0000]/30 flex items-center justify-center">
                  <FileText className="w-10 h-10 text-[#808080]" />
                </div>
                <h3 className="font-display text-xl sm:text-2xl text-[#F5F5F5] mb-2">
                  <DecryptedText text="NENHUM DOSSIÊ ENCONTRADO" speed={30} />
                </h3>
                <p className="text-[#808080] mb-6 text-sm sm:text-base">
                  Crie seu primeiro agente para começar suas missões.
                </p>
                <Link to="/character/create">
                  <Button className="bg-[#8B0000] hover:bg-[#B22222] text-white border border-[#B22222]/30 shadow-[0_0_20px_rgba(139,0,0,0.3)] hover:shadow-[0_0_30px_rgba(139,0,0,0.5)] transition-all">
                    <Plus className="w-5 h-5 mr-2" />
                    Criar Primeiro Agente
                  </Button>
                </Link>
              </div>
              
              {/* Classified stamp */}
              <div className="absolute -bottom-2 -right-2 text-[#8B0000]/10 font-display text-6xl tracking-widest rotate-[-15deg] select-none">
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
        </section>
      </main>
    </div>
  );
}

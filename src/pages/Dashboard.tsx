import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ThemeSelector } from '@/components/ui/theme-selector';
import { Plus, LogOut, User, FileText, Users, Settings, Loader2, AlertTriangle, Skull, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CharacterCard } from '@/components/cards/CharacterCard';
import { useAdminCheck } from '@/hooks/useAdminCheck';
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
  const {
    user,
    signOut
  } = useAuth();
  const {
    toast
  } = useToast();
  const { isAdmin } = useAdminCheck();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{
    display_name: string | null;
  } | null>(null);
  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      // Fetch profile
      const {
        data: profileData
      } = await supabase.from('profiles').select('display_name').eq('user_id', user.id).single();
      setProfile(profileData);

      // Fetch characters
      const {
        data: charactersData
      } = await supabase.from('characters').select('id, name, class, origin, nex, patent, hp_current, hp_max, pe_current, pe_max, san_current, san_max, photo_url, conditions').eq('user_id', user.id).order('updated_at', {
        ascending: false
      });
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
    const {
      error
    } = await supabase.from('characters').delete().eq('id', id);
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
  return <div className="min-h-screen bg-background relative">
      {/* Background effects */}
      <div className="noise-overlay" />
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />

      {/* Header - Responsivo */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-sm sticky top-0 bg-background/80">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Skull className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-lg sm:text-xl tracking-wide text-foreground">LET'S ROLL</h1>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground tracking-[0.15em] sm:tracking-[0.2em] uppercase hidden sm:block">Painel do Agente</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeSelector />
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="text-sm hidden md:block">{displayName}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Welcome section - Responsivo */}
        <section className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] uppercase text-secondary-foreground">Central de Operações</p>
              <h2 className="font-display text-2xl sm:text-4xl tracking-wide text-foreground">
                BEM-VINDO, <span className="text-primary">{displayName.toUpperCase()}</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
                Gerencie seus agentes e missões na Ordo Realitas.
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              {isAdmin && (
                <Link to="/admin/import" className="flex-1 sm:flex-none">
                  <Button variant="secondary" className="w-full sm:w-auto font-display tracking-wider text-xs sm:text-sm">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Admin</span>
                    <span className="sm:hidden">Adm</span>
                  </Button>
                </Link>
              )}
              <Link to="/campaigns" className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full sm:w-auto font-display tracking-wider text-xs sm:text-sm">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Campanhas</span>
                  <span className="sm:hidden">Mesas</span>
                </Button>
              </Link>
              <Link to="/character/create" className="flex-1 sm:flex-none">
                <Button className="w-full sm:w-auto action-button font-display tracking-wider text-xs sm:text-sm">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Novo Agente</span>
                  <span className="sm:hidden">Novo</span>
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Quick stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="dossier-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-display text-2xl text-foreground">{characters.length}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Agentes</p>
              </div>
            </div>
          </div>
          <div className="dossier-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-display text-2xl text-foreground">0</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Mesas</p>
              </div>
            </div>
          </div>
          <div className="dossier-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-display text-2xl text-foreground">0</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Missões</p>
              </div>
            </div>
          </div>
          <div className="dossier-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-display text-2xl text-foreground">—</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Config</p>
              </div>
            </div>
          </div>
        </section>

        {/* Characters section */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="divider-line flex-1" />
            <h3 className="font-display text-xl tracking-wider text-primary">DOSSIÊS DE AGENTES</h3>
            <div className="divider-line flex-1" />
          </div>

          {loading ? <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div> : characters.length === 0 ? <div className="section-container text-center py-16">
              <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-display text-2xl text-foreground mb-2">
                NENHUM DOSSIÊ ENCONTRADO
              </h3>
              <p className="text-muted-foreground mb-6">
                Crie seu primeiro agente para começar suas missões.
              </p>
              <Link to="/character/create">
                <Button className="action-button">
                  <Plus className="w-5 h-5 mr-2" />
                  Criar Primeiro Agente
                </Button>
              </Link>
            </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {characters.map((character, index) => <CharacterCard key={character.id} character={{
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
          }} onDelete={() => handleDeleteCharacter(character.id, character.name)} index={index} />)}
            </div>}
        </section>
      </main>
    </div>;
}
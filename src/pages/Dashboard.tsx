import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Plus, 
  LogOut, 
  User, 
  FileText, 
  Users, 
  Settings,
  Loader2,
  AlertTriangle,
  Skull,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ display_name: string | null } | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();
      
      setProfile(profileData);

      // Fetch characters
      const { data: charactersData } = await supabase
        .from('characters')
        .select('id, name, class, origin, nex, patent, hp_current, hp_max, pe_current, pe_max, san_current, san_max')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      setCharacters(charactersData || []);
      setLoading(false);
    }

    fetchData();
  }, [user]);

  const handleDeleteCharacter = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir ${name}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o personagem.',
        variant: 'destructive',
      });
    } else {
      setCharacters(characters.filter(c => c.id !== id));
      toast({
        title: 'Agente Removido',
        description: `O dossiê de ${name} foi arquivado permanentemente.`,
      });
    }
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Agente';

  const getClassIcon = (characterClass: string) => {
    switch (characterClass) {
      case 'Combatente': return Shield;
      case 'Especialista': return User;
      case 'Ocultista': return Skull;
      default: return FileText;
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background effects */}
      <div className="noise-overlay" />
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-sm sticky top-0 bg-background/80">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Skull className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl tracking-wide text-foreground">LET'S ROLL</h1>
              <p className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase">Painel do Agente</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="text-sm hidden sm:block">{displayName}</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={signOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-6 py-8">
        {/* Welcome section */}
        <section className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-accent text-sm tracking-[0.2em] uppercase">Central de Operações</p>
              <h2 className="font-display text-4xl tracking-wide text-foreground">
                BEM-VINDO, <span className="text-primary">{displayName.toUpperCase()}</span>
              </h2>
              <p className="text-muted-foreground mt-1">
                Gerencie seus agentes e missões na Ordo Realitas.
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/campaigns">
                <Button variant="outline" className="font-display tracking-wider">
                  <Users className="w-5 h-5 mr-2" />
                  Campanhas
                </Button>
              </Link>
              <Link to="/character/create">
                <Button className="action-button font-display tracking-wider">
                  <Plus className="w-5 h-5 mr-2" />
                  Novo Agente
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

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : characters.length === 0 ? (
            <div className="section-container text-center py-16">
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
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {characters.map((character, index) => {
                const ClassIcon = getClassIcon(character.class);
                const hpPercent = (character.hp_current / character.hp_max) * 100;
                const sanPercent = (character.san_current / character.san_max) * 100;
                
                return (
                  <div
                    key={character.id}
                    className="dossier-card group animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <ClassIcon className="w-6 h-6 text-accent group-hover:text-primary transition-colors" />
                          </div>
                          <div>
                            <h4 className="font-display text-xl tracking-wide text-foreground">
                              {character.name}
                            </h4>
                            <p className="text-muted-foreground text-sm">
                              {character.class} • {character.origin}
                            </p>
                          </div>
                        </div>
                        <div className="nex-indicator">
                          {character.nex}%
                        </div>
                      </div>

                      {/* Status bars */}
                      <div className="space-y-3 mb-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground uppercase tracking-wider">PV</span>
                            <span className="text-primary">{character.hp_current}/{character.hp_max}</span>
                          </div>
                          <div className="status-bar">
                            <div 
                              className="status-bar-fill bg-primary"
                              style={{ width: `${hpPercent}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground uppercase tracking-wider">SAN</span>
                            <span className="text-paranormal">{character.san_current}/{character.san_max}</span>
                          </div>
                          <div className="status-bar">
                            <div 
                              className="status-bar-fill bg-paranormal"
                              style={{ width: `${sanPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Patent badge */}
                      <div className="mb-4">
                        <span className="patent-badge">{character.patent}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Link to={`/character/${character.id}`} className="flex-1">
                          <Button variant="secondary" className="w-full group-hover:bg-primary/20 transition-colors">
                            Abrir Dossiê
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCharacter(character.id, character.name)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Classified stamp */}
                    <div className="classified-stamp -bottom-2 -right-2 text-xl opacity-5">
                      ORDO
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

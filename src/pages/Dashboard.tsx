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
  AlertTriangle
} from 'lucide-react';

interface Character {
  id: string;
  name: string;
  class: string;
  nex: number;
  patent: string;
  hp_current: number;
  hp_max: number;
  san_current: number;
  san_max: number;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
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
        .select('id, name, class, nex, patent, hp_current, hp_max, san_current, san_max')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      setCharacters(charactersData || []);
      setLoading(false);
    }

    fetchData();
  }, [user]);

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Agente';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 border border-primary rounded-sm flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <span className="font-display text-xl tracking-wider">LET'S ROLL</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="text-sm">{displayName}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={signOut}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h1 className="font-display text-4xl tracking-wider mb-2">
            BEM-VINDO, <span className="text-primary">{displayName.toUpperCase()}</span>
          </h1>
          <p className="text-muted-foreground">
            Central de operações da Ordo Realitas. Gerencie seus agentes e missões.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="ordo-panel p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-secondary" />
              <div>
                <p className="text-2xl font-display">{characters.length}</p>
                <p className="text-xs text-muted-foreground">AGENTES</p>
              </div>
            </div>
          </div>
          <div className="ordo-panel p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-display">0</p>
                <p className="text-xs text-muted-foreground">MESAS</p>
              </div>
            </div>
          </div>
          <div className="ordo-panel p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-display">0</p>
                <p className="text-xs text-muted-foreground">MISSÕES</p>
              </div>
            </div>
          </div>
          <div className="ordo-panel p-4">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-display">-</p>
                <p className="text-xs text-muted-foreground">CONFIG</p>
              </div>
            </div>
          </div>
        </div>

        {/* Characters section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <div className="dossier-header flex-1">
              <h2 className="font-display text-2xl tracking-wider">DOSSIÊS DE AGENTES</h2>
            </div>
            <Link to="/character/create">
              <Button className="font-display tracking-wider">
                <Plus className="w-4 h-4 mr-2" />
                NOVO AGENTE
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : characters.length === 0 ? (
            <div className="ordo-panel p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl tracking-wider mb-2">NENHUM AGENTE CADASTRADO</h3>
              <p className="text-muted-foreground mb-6">
                Você ainda não possui agentes registrados no sistema.
              </p>
              <Link to="/character/create">
                <Button className="font-display tracking-wider">
                  <Plus className="w-4 h-4 mr-2" />
                  CRIAR PRIMEIRO AGENTE
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {characters.map((char, index) => (
                <Link
                  key={char.id}
                  to={`/character/${char.id}`}
                  className="ordo-panel p-4 hover:border-primary/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-display text-lg tracking-wider">{char.name}</h3>
                      <p className="text-xs text-muted-foreground">{char.class} • {char.patent}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-secondary font-display text-xl">{char.nex}%</span>
                      <p className="text-xs text-muted-foreground">NEX</p>
                    </div>
                  </div>

                  {/* HP Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">PV</span>
                      <span className="text-destructive">{char.hp_current}/{char.hp_max}</span>
                    </div>
                    <div className="status-bar status-bar-hp">
                      <div 
                        className="status-bar-fill"
                        style={{ width: `${(char.hp_current / char.hp_max) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* SAN Bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">SAN</span>
                      <span className="text-paranormal">{char.san_current}/{char.san_max}</span>
                    </div>
                    <div className="status-bar status-bar-san">
                      <div 
                        className="status-bar-fill"
                        style={{ width: `${(char.san_current / char.san_max) * 100}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

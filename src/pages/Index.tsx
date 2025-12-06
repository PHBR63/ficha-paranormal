import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  FileText, 
  Dice6, 
  Users, 
  Eye, 
  ChevronRight,
  Skull
} from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Noise overlay */}
      <div className="noise-overlay" />
      
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-primary/10 via-transparent to-transparent blur-3xl" />
      
      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Skull className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl tracking-wide text-foreground">LET'S ROLL</h1>
              <p className="text-[10px] text-muted-foreground tracking-[0.3em] uppercase">Ordem Paranormal VTT</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button variant="default" className="action-button">
                  Acessar Sistema
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                    Entrar
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button variant="default" className="action-button">
                    Criar Conta
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="container mx-auto px-6 py-24 text-center">
          <div className="animate-fade-in">
            <p className="text-accent text-sm tracking-[0.3em] uppercase mb-4">Sistema Oficial</p>
            <h2 className="font-display text-6xl md:text-8xl tracking-wider text-foreground mb-6">
              ORDO REALITAS
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
              Mesa virtual especializada para <span className="text-foreground">Ordem Paranormal RPG v1.3</span>.
              Gerencie agentes, conduza investigações e enfrente o Outro Lado.
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-4 animate-fade-in-delay-2">
            <Link to={user ? "/dashboard" : "/auth?mode=signup"}>
              <Button size="lg" className="action-button pulse-glow text-lg px-8 py-6">
                {user ? 'Acessar Dashboard' : 'Tornar-se um Agente'}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
          
          {/* Classified stamp effect */}
          <div className="relative mt-16">
            <div className="classified-stamp top-0 left-1/4 opacity-10">CLASSIFICADO</div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                title: 'Fichas de Agente',
                description: 'Crie e gerencie dossiês completos dos seus personagens com cálculos automáticos.',
                delay: 'animate-fade-in-delay-1'
              },
              {
                icon: Dice6,
                title: 'Motor de Dados',
                description: 'Sistema de rolagem integrado com pools de d20, vantagens e críticos.',
                delay: 'animate-fade-in-delay-2'
              },
              {
                icon: Users,
                title: 'Mesas Virtuais',
                description: 'Conduza sessões online com chat em tempo real e compartilhamento de fichas.',
                delay: 'animate-fade-in-delay-3'
              },
              {
                icon: Shield,
                title: 'Combate Tático',
                description: 'Tracker de iniciativa, condições e fluxo de combate automatizado.',
                delay: 'animate-fade-in-delay-4'
              },
              {
                icon: Eye,
                title: 'Rituais & Ocultismo',
                description: 'Sistema de rituais com custos de sanidade e efeitos paranormais.',
                delay: 'animate-fade-in-delay-1'
              },
              {
                icon: Skull,
                title: 'Ferramentas do Mestre',
                description: 'Biblioteca de ameaças, gerador de NPCs e mecânicas de boss.',
                delay: 'animate-fade-in-delay-2'
              },
            ].map((feature, index) => (
              <div 
                key={index} 
                className={`dossier-card p-6 ${feature.delay} hover:border-primary/30 transition-colors group`}
              >
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-accent group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-display text-xl tracking-wide text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-24">
          <div className="section-container text-center">
            <p className="text-primary text-sm tracking-[0.2em] uppercase mb-2">Pronto para começar?</p>
            <h3 className="font-display text-4xl tracking-wide text-foreground mb-4">
              JUNTE-SE À ORDO REALITAS
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Crie sua conta gratuitamente e comece a montar seu time de agentes paranormais.
            </p>
            <Link to={user ? "/dashboard" : "/auth?mode=signup"}>
              <Button size="lg" className="action-button">
                {user ? 'Ir para Dashboard' : 'Registrar-se Agora'}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-muted-foreground text-sm">
            Let's Roll VTT — Sistema não oficial para Ordem Paranormal RPG
          </p>
          <p className="text-muted-foreground/50 text-xs mt-2">
            Ordem Paranormal é uma criação de Cellbit/Rodrigo Xablau
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

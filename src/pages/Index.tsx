/**
 * Index - Landing Page Let's Roll
 * Design baseado na proposta com tema roxo vibrante
 */

import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Crown, 
  ScrollText, 
  Dices, 
  Sparkles, 
  ChevronRight,
  Skull
} from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#1A0033] relative overflow-hidden">
      {/* Background Effects - Partículas e gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#2A0033_0%,_#1A0033_70%)]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.03%22/%3E%3C/svg%3E')]" />
      
      {/* Glow effect central */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#8000FF]/20 rounded-full blur-[120px]" />
      
      {/* Header */}
      <header className="relative z-10 border-b border-[#8000FF]/20 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#8000FF]/20 border border-[#8000FF]/30 flex items-center justify-center">
              <Skull className="w-6 h-6 text-[#8000FF]" />
            </div>
            <div>
              <h1 className="font-display text-2xl tracking-wide text-white">LET'S ROLL</h1>
              <p className="text-[10px] text-[#A855F7] tracking-[0.3em] uppercase">Ordem Paranormal VTT</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button 
                  className="bg-[#8000FF] hover:bg-[#6B00D6] text-white border-0 shadow-[0_0_20px_rgba(128,0,255,0.3)] hover:shadow-[0_0_30px_rgba(128,0,255,0.5)] transition-all"
                >
                  Acessar Sistema
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" className="text-[#E0E0E0] hover:text-white hover:bg-[#8000FF]/10">
                    Entrar
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button 
                    className="bg-[#8000FF] hover:bg-[#6B00D6] text-white border-0 shadow-[0_0_20px_rgba(128,0,255,0.3)] hover:shadow-[0_0_30px_rgba(128,0,255,0.5)] transition-all"
                  >
                    Conecte-se
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
          <div className="animate-fade-in max-w-4xl mx-auto">
            {/* Título Principal */}
            <h2 className="font-display text-5xl md:text-7xl tracking-wide text-white mb-6 leading-tight">
              Sua Mesa de RPG,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8000FF] to-[#A855F7]">
                Reinventada.
              </span>
            </h2>
            
            {/* Subtítulo */}
            <p className="text-[#E0E0E0] text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
              Let's Roll é a plataforma definitiva para mestres e jogadores que buscam{' '}
              <span className="text-white font-medium">imersão total</span> e{' '}
              <span className="text-white font-medium">controle absoluto</span>.
            </p>
            
            {/* Badges */}
            <div className="flex items-center justify-center gap-6 mb-10">
              {['Gratuito', 'Ilimitado', 'Fácil de usar'].map((badge) => (
                <span 
                  key={badge}
                  className="text-[#A855F7] text-sm font-medium px-4 py-1 rounded-full border border-[#8000FF]/30 bg-[#8000FF]/10"
                >
                  {badge}
                </span>
              ))}
            </div>
            
            {/* CTAs */}
            <div className="flex items-center justify-center gap-4">
              <Link to={user ? "/dashboard" : "/auth?mode=signup"}>
                <Button 
                  size="lg" 
                  className="bg-[#8000FF] hover:bg-[#6B00D6] text-white text-lg px-8 py-6 border-0 shadow-[0_0_30px_rgba(128,0,255,0.4)] hover:shadow-[0_0_40px_rgba(128,0,255,0.6)] transition-all group"
                >
                  <Dices className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  {user ? 'Acessar Dashboard' : 'Comece a Aventura (Grátis)'}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Dados 3D decorativos (placeholder visual) */}
          <div className="relative mt-16 flex justify-center">
            <div className="w-32 h-32 relative">
              <div className="absolute inset-0 bg-[#8000FF]/30 rounded-2xl rotate-45 blur-xl animate-pulse" />
              <div className="absolute inset-4 bg-[#2A0033] border-2 border-[#8000FF]/50 rounded-2xl rotate-45 flex items-center justify-center">
                <Dices className="w-12 h-12 text-[#8000FF] -rotate-45" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid - Bento Grid Style */}
        <section className="container mx-auto px-6 py-16">
          <h3 className="font-display text-3xl md:text-4xl tracking-wide text-white text-center mb-12">
            Tudo que Você Precisa para uma{' '}
            <span className="text-[#A855F7]">Sessão Inesquecível</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Crown,
                title: 'Mestre no Comando',
                description: 'Controle total sobre sessões, NPCs, combates e narrativa. Tudo na ponta dos seus dedos.'
              },
              {
                icon: ScrollText,
                title: 'Fichas Dinâmicas',
                description: 'Fichas de personagem completas com cálculos automáticos e atualizações em tempo real.'
              },
              {
                icon: Dices,
                title: 'Dados Integrados',
                description: 'Sistema de rolagem nativo com d20, vantagens, críticos e animações imersivas.'
              },
              {
                icon: Sparkles,
                title: 'Imersão Total',
                description: 'Rituais, condições, sanidade e todos os elementos do Ordem Paranormal.'
              },
            ].map((feature, index) => (
              <div 
                key={index} 
                className="group p-6 rounded-xl bg-[#2A2A3A] border border-[#8000FF]/20 hover:border-[#8000FF]/50 hover:shadow-[0_0_30px_rgba(128,0,255,0.15)] transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-[#8000FF]/20 flex items-center justify-center mb-4 group-hover:bg-[#8000FF]/30 group-hover:scale-110 transition-all">
                  <feature.icon className="w-6 h-6 text-[#8000FF]" />
                </div>
                <h4 className="font-display text-xl tracking-wide text-white mb-2">{feature.title}</h4>
                <p className="text-[#A0A0A0] text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Final */}
        <section className="container mx-auto px-6 py-24">
          <div className="relative text-center p-12 rounded-2xl bg-gradient-to-b from-[#2A0033] to-[#1A0033] border border-[#8000FF]/30 overflow-hidden">
            {/* Glow background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#8000FF20_0%,_transparent_70%)]" />
            
            <div className="relative z-10">
              <p className="text-[#A855F7] text-sm tracking-[0.2em] uppercase mb-2">Pronto para começar?</p>
              <h3 className="font-display text-4xl tracking-wide text-white mb-4">
                Pronto para Rolar os Dados?
              </h3>
              <p className="text-[#A0A0A0] max-w-xl mx-auto mb-8">
                Crie sua conta gratuita e comece a construir sua próxima grande aventura. 
                Convide seus amigos e jogue em minutos.
              </p>
              <Link to={user ? "/dashboard" : "/auth?mode=signup"}>
                <Button 
                  size="lg" 
                  className="bg-[#8000FF] hover:bg-[#6B00D6] text-white text-lg px-10 py-6 border-0 shadow-[0_0_30px_rgba(128,0,255,0.4)] hover:shadow-[0_0_40px_rgba(128,0,255,0.6)] transition-all"
                >
                  <Dices className="w-5 h-5 mr-2" />
                  {user ? 'Ir para Dashboard' : 'Criar Minha Campanha Agora'}
                </Button>
              </Link>
              <p className="text-[#707070] text-sm mt-4">
                Sem cartão de crédito • Sem instalação
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#8000FF]/20 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-[#A0A0A0] text-sm">
            © 2024 Let's Roll — Sistema não oficial para Ordem Paranormal RPG
          </p>
          <p className="text-[#606060] text-xs mt-2">
            Desenvolvido por Muu Walkers • Ordem Paranormal é uma criação de Cellbit
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

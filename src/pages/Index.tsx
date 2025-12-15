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
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-[#8000FF]/20 rounded-full blur-[80px] sm:blur-[120px]" />
      
      {/* Header - Responsivo */}
      <header className="relative z-10 border-b border-[#8000FF]/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#8000FF]/20 border border-[#8000FF]/30 flex items-center justify-center">
              <Skull className="w-5 h-5 sm:w-6 sm:h-6 text-[#8000FF]" />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl tracking-wide text-white">LET'S ROLL</h1>
              <p className="text-[8px] sm:text-[10px] text-[#A855F7] tracking-[0.2em] sm:tracking-[0.3em] uppercase hidden sm:block">Ordem Paranormal VTT</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button 
                  className="bg-[#8000FF] hover:bg-[#6B00D6] text-white border-0 shadow-[0_0_20px_rgba(128,0,255,0.3)] hover:shadow-[0_0_30px_rgba(128,0,255,0.5)] transition-all text-xs sm:text-sm px-3 sm:px-4"
                >
                  <span className="hidden sm:inline">Acessar Sistema</span>
                  <span className="sm:hidden">Acessar</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" className="text-[#E0E0E0] hover:text-white hover:bg-[#8000FF]/10 text-xs sm:text-sm px-2 sm:px-4">
                    Entrar
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button 
                    className="bg-[#8000FF] hover:bg-[#6B00D6] text-white border-0 shadow-[0_0_20px_rgba(128,0,255,0.3)] hover:shadow-[0_0_30px_rgba(128,0,255,0.5)] transition-all text-xs sm:text-sm px-3 sm:px-4"
                  >
                    <span className="hidden sm:inline">Conecte-se</span>
                    <span className="sm:hidden">Criar</span>
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section - Responsivo */}
      <main className="relative z-10">
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-24 text-center">
          <div className="animate-fade-in max-w-4xl mx-auto">
            {/* Título Principal */}
            <h2 className="font-display text-3xl sm:text-5xl md:text-7xl tracking-wide text-white mb-4 sm:mb-6 leading-tight">
              Sua Mesa de RPG,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8000FF] to-[#A855F7]">
                Reinventada.
              </span>
            </h2>
            
            {/* Subtítulo */}
            <p className="text-[#E0E0E0] text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4">
              Let's Roll é a plataforma definitiva para mestres e jogadores que buscam{' '}
              <span className="text-white font-medium">imersão total</span> e{' '}
              <span className="text-white font-medium">controle absoluto</span>.
            </p>
            
            {/* Badges - Responsivos */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-6 mb-8 sm:mb-10 px-4">
              {['Gratuito', 'Ilimitado', 'Fácil de usar'].map((badge) => (
                <span 
                  key={badge}
                  className="text-[#A855F7] text-xs sm:text-sm font-medium px-3 sm:px-4 py-1 rounded-full border border-[#8000FF]/30 bg-[#8000FF]/10"
                >
                  {badge}
                </span>
              ))}
            </div>
            
            {/* CTAs */}
            <div className="flex items-center justify-center gap-4 px-4">
              <Link to={user ? "/dashboard" : "/auth?mode=signup"} className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-[#8000FF] hover:bg-[#6B00D6] text-white text-sm sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-0 shadow-[0_0_30px_rgba(128,0,255,0.4)] hover:shadow-[0_0_40px_rgba(128,0,255,0.6)] transition-all group"
                >
                  <Dices className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  <span className="hidden sm:inline">{user ? 'Acessar Dashboard' : 'Comece a Aventura (Grátis)'}</span>
                  <span className="sm:hidden">{user ? 'Dashboard' : 'Começar'}</span>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Dados 3D decorativos - Menor no mobile */}
          <div className="relative mt-10 sm:mt-16 flex justify-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 relative">
              <div className="absolute inset-0 bg-[#8000FF]/30 rounded-2xl rotate-45 blur-xl animate-pulse" />
              <div className="absolute inset-3 sm:inset-4 bg-[#2A0033] border-2 border-[#8000FF]/50 rounded-2xl rotate-45 flex items-center justify-center">
                <Dices className="w-10 h-10 sm:w-12 sm:h-12 text-[#8000FF] -rotate-45" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid - Bento Grid Style - Responsivo */}
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h3 className="font-display text-2xl sm:text-3xl md:text-4xl tracking-wide text-white text-center mb-8 sm:mb-12 px-4">
            Tudo que Você Precisa para uma{' '}
            <span className="text-[#A855F7]">Sessão Inesquecível</span>
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
                className="group p-4 sm:p-6 rounded-xl bg-[#2A2A3A] border border-[#8000FF]/20 hover:border-[#8000FF]/50 hover:shadow-[0_0_30px_rgba(128,0,255,0.15)] transition-all duration-300"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#8000FF]/20 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-[#8000FF]/30 group-hover:scale-110 transition-all">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#8000FF]" />
                </div>
                <h4 className="font-display text-lg sm:text-xl tracking-wide text-white mb-2">{feature.title}</h4>
                <p className="text-[#A0A0A0] text-xs sm:text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Final - Responsivo */}
        <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="relative text-center p-6 sm:p-12 rounded-2xl bg-gradient-to-b from-[#2A0033] to-[#1A0033] border border-[#8000FF]/30 overflow-hidden">
            {/* Glow background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#8000FF20_0%,_transparent_70%)]" />
            
            <div className="relative z-10">
              <p className="text-[#A855F7] text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-2">Pronto para começar?</p>
              <h3 className="font-display text-2xl sm:text-4xl tracking-wide text-white mb-3 sm:mb-4">
                Pronto para Rolar os Dados?
              </h3>
              <p className="text-[#A0A0A0] text-sm sm:text-base max-w-xl mx-auto mb-6 sm:mb-8 px-4">
                Crie sua conta gratuita e comece a construir sua próxima grande aventura. 
                Convide seus amigos e jogue em minutos.
              </p>
              <Link to={user ? "/dashboard" : "/auth?mode=signup"}>
                <Button 
                  size="lg" 
                  className="bg-[#8000FF] hover:bg-[#6B00D6] text-white text-sm sm:text-lg px-6 sm:px-10 py-5 sm:py-6 border-0 shadow-[0_0_30px_rgba(128,0,255,0.4)] hover:shadow-[0_0_40px_rgba(128,0,255,0.6)] transition-all"
                >
                  <Dices className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="hidden sm:inline">{user ? 'Ir para Dashboard' : 'Criar Minha Campanha Agora'}</span>
                  <span className="sm:hidden">{user ? 'Dashboard' : 'Criar Agora'}</span>
                </Button>
              </Link>
              <p className="text-[#707070] text-xs sm:text-sm mt-4">
                Sem cartão de crédito • Sem instalação
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Responsivo */}
      <footer className="relative z-10 border-t border-[#8000FF]/20 py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <p className="text-[#A0A0A0] text-xs sm:text-sm">
            © 2024 Let's Roll — Sistema não oficial para Ordem Paranormal RPG
          </p>
          <p className="text-[#606060] text-[10px] sm:text-xs mt-2">
            Desenvolvido por Muu Walkers • Ordem Paranormal é uma criação de Cellbit
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

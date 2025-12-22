/**
 * Index - Landing Page Let's Roll
 * Design: Horror Investigativo - Ordem Paranormal
 * Estética: Documentos classificados da Ordo Realitas
 */

import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Particles } from '@/components/ui/particles';
import { LogoBox, LogoHero } from '@/components/ui/logo';
import { 
  ChevronRight,
  Shield,
  FileText,
  Dices,
  Brain,
  Smartphone
} from 'lucide-react';
import { ParanormalElementsRow, ParanormalElementIcon } from '@/components/ui/paranormal-element-icon';

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0D0A0B] relative overflow-hidden">
      {/* Background Effects - Horror Investigativo */}
      <div className="absolute inset-0 bg-landing-gradient" />
      
      {/* Noise texture */}
      <div className="absolute inset-0 landing-noise pointer-events-none" />
      
      {/* Red mist effect */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#8B0000]/10 rounded-full blur-[150px] animate-red-mist" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#B22222]/8 rounded-full blur-[120px] animate-red-mist" style={{ animationDelay: '4s' }} />
      </div>
      
      {/* Scan lines overlay */}
      <div className="absolute inset-0 scan-lines opacity-30 pointer-events-none" />
      
      {/* Blood particles - Magic UI */}
      <Particles
        className="absolute inset-0 z-[1]"
        quantity={35}
        color="#8B0000"
        size={1.5}
        vx={0}
        vy={-0.2}
        staticity={80}
        ease={100}
      />
      
      {/* Secondary layer - smaller, slower particles */}
      <Particles
        className="absolute inset-0 z-[0]"
        quantity={20}
        color="#B22222"
        size={0.8}
        vx={0}
        vy={-0.1}
        staticity={100}
        ease={120}
      />
      
      {/* Red vignette */}
      <div className="absolute inset-0 vignette-red pointer-events-none" />
      
      {/* Header */}
      <header className="relative z-10 border-b border-[#8B0000]/20 backdrop-blur-sm bg-[#0D0A0B]/50">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <LogoBox size="md" />
            <div>
              <h1 className="font-display text-xl sm:text-2xl tracking-wide text-[#F5F5F5]">LET'S ROLL</h1>
              <p className="text-[8px] sm:text-[10px] text-[#8B0000] tracking-[0.2em] sm:tracking-[0.3em] uppercase hidden sm:block">Ordem Paranormal VTT</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button 
                  className="bg-[#8B0000] hover:bg-[#B22222] text-white border-0 shadow-[0_0_20px_rgba(139,0,0,0.4)] hover:shadow-[0_0_30px_rgba(139,0,0,0.6)] transition-all text-xs sm:text-sm px-3 sm:px-4"
                >
                  <span className="hidden sm:inline">Acessar Sistema</span>
                  <span className="sm:hidden">Acessar</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" className="text-[#C0C0C0] hover:text-white hover:bg-[#8B0000]/10 text-xs sm:text-sm px-2 sm:px-4">
                    Entrar
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button 
                    className="bg-[#8B0000] hover:bg-[#B22222] text-white border-0 shadow-[0_0_20px_rgba(139,0,0,0.4)] hover:shadow-[0_0_30px_rgba(139,0,0,0.6)] transition-all text-xs sm:text-sm px-3 sm:px-4"
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

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-28 text-center">
          <div className="animate-fade-in max-w-4xl mx-auto">
            
            {/* Classified badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#8B0000]/40 bg-[#8B0000]/10 mb-6">
              <div className="w-2 h-2 rounded-full bg-[#B22222] animate-pulse" />
              <span className="text-[#B22222] text-xs sm:text-sm font-mono tracking-wider uppercase">
                Arquivo Desclassificado
              </span>
            </div>
            
            {/* Título Principal */}
            <h2 className="font-display text-4xl sm:text-6xl md:text-8xl tracking-wide text-[#F5F5F5] mb-2 sm:mb-4 leading-tight animate-text-glitch">
              A MEMBRANA
            </h2>
            <h2 className="font-display text-3xl sm:text-5xl md:text-6xl tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#8B0000] to-[#B22222] mb-6 sm:mb-8">
              ESTÁ SE ROMPENDO.
            </h2>
            
            {/* Subtítulo */}
            <p className="text-[#A0A0A0] text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-4 font-serif italic">
              A Ordo Realitas precisa de agentes preparados.{' '}
              <span className="text-[#C0C0C0]">Rituais, investigações e o Outro Lado</span> aguardam.
            </p>
            
            {/* 5 Elementos Paranormais */}
            <div className="mb-10 sm:mb-12">
              <p className="text-[#8B0000] text-xs uppercase tracking-[0.3em] mb-4 font-mono">
                Os Cinco Elementos do Outro Lado
              </p>
              <ParanormalElementsRow size="lg" variant="animated" />
            </div>
            
            {/* Badges temáticos */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-8 sm:mb-10 px-4">
              {[
                { label: 'Acesso Liberado', icon: '🔓' },
                { label: 'Nível de Exposição: Baixo', icon: '📊' },
                { label: 'Confidencial', icon: '🔒' }
              ].map((badge) => (
                <span 
                  key={badge.label}
                  className="text-[#A0A0A0] text-xs sm:text-sm font-mono px-3 sm:px-4 py-1.5 rounded border border-[#3D1518]/60 bg-[#1A1214]/50 flex items-center gap-2"
                >
                  <span>{badge.icon}</span>
                  {badge.label}
                </span>
              ))}
            </div>
            
            {/* CTA Principal */}
            <div className="flex items-center justify-center gap-4 px-4">
              <Link to={user ? "/dashboard" : "/auth?mode=signup"} className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-[#8B0000] hover:bg-[#B22222] text-white text-sm sm:text-lg px-8 sm:px-10 py-6 sm:py-7 border border-[#B22222]/30 animate-blood-pulse transition-all group"
                >
                  <span className="hidden sm:inline">{user ? 'Acessar Dashboard' : 'Acessar a Ordem'}</span>
                  <span className="sm:hidden">{user ? 'Dashboard' : 'Acessar'}</span>
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Símbolo decorativo - Logo Hero */}
          <div className="relative mt-12 sm:mt-20 flex justify-center">
            <LogoHero size="2xl" />
          </div>
        </section>

        {/* Features Grid - Estilo Dossiê Classificado */}
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-[#8B0000] text-xs uppercase tracking-[0.3em] mb-2 font-mono">
              Recursos Disponíveis
            </p>
            <h3 className="font-display text-2xl sm:text-4xl md:text-5xl tracking-wide text-[#F5F5F5]">
              ARSENAL DO <span className="text-[#B22222]">AGENTE</span>
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                icon: Shield,
                title: 'Controle de Operações',
                description: 'Mestre no comando total sobre sessões, NPCs, combates e narrativa. O Outro Lado responde a você.',
                element: 'energia' as const
              },
              {
                icon: FileText,
                title: 'Dossiês de Agentes',
                description: 'Fichas completas com cálculos automáticos, rituais, poderes e atualizações em tempo real.',
                element: 'conhecimento' as const
              },
              {
                icon: Dices,
                title: 'Sistema de Testes',
                description: 'Rolagem nativa com d20, vantagens, desvantagens, críticos e animações imersivas.',
                element: 'sangue' as const
              },
              {
                icon: Brain,
                title: 'Sanidade & O Outro Lado',
                description: 'Rituais, condições de trauma, DT de Sanidade e todos os elementos paranormais integrados.',
                element: 'medo' as const
              },
            ].map((feature, index) => (
              <div 
                key={index} 
                className="group dossier-classified p-5 sm:p-6 hover:scale-[1.02] transition-all duration-300"
              >
                {/* Classified stamp */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[#8B0000]/30 text-[8px] font-mono uppercase tracking-wider rotate-12 inline-block">
                    Liberado
                  </span>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <ParanormalElementIcon 
                      element={feature.element} 
                      size="md" 
                      variant="glow"
                    />
                  </div>
                  <div>
                    <h4 className="font-display text-lg sm:text-xl tracking-wide text-[#F5F5F5] mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-[#808080] text-xs sm:text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
                
                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#8B0000]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </section>

        {/* CTA Final - A Ordem Precisa de Você */}
        <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="relative text-center p-8 sm:p-14 rounded-2xl bg-gradient-to-b from-[#1A0505] to-[#0D0A0B] border border-[#8B0000]/30 overflow-hidden">
            
            {/* Background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(139,0,0,0.15)_0%,_transparent_70%)]" />
            
            {/* Scan lines */}
            <div className="absolute inset-0 scan-lines opacity-20" />
            
            {/* Floating elements */}
            <div className="absolute top-6 left-6 opacity-20">
              <ParanormalElementIcon element="sangue" size="sm" variant="simple" />
            </div>
            <div className="absolute top-6 right-6 opacity-20">
              <ParanormalElementIcon element="morte" size="sm" variant="simple" />
            </div>
            <div className="absolute bottom-6 left-1/4 opacity-15">
              <ParanormalElementIcon element="conhecimento" size="sm" variant="simple" />
            </div>
            <div className="absolute bottom-6 right-1/4 opacity-15">
              <ParanormalElementIcon element="energia" size="sm" variant="simple" />
            </div>
            
            <div className="relative z-10">
              <p className="text-[#B22222] text-xs sm:text-sm tracking-[0.2em] uppercase mb-3 font-mono animate-pulse">
                ⚠ Alerta de Recrutamento ⚠
              </p>
              <h3 className="font-display text-3xl sm:text-5xl tracking-wide text-[#F5F5F5] mb-4">
                A ORDEM <span className="text-[#B22222]">PRECISA DE VOCÊ</span>
              </h3>
              <p className="text-[#A0A0A0] text-sm sm:text-base max-w-xl mx-auto mb-8 px-4 font-serif">
                Junte-se a centenas de agentes. Investigue o desconhecido.
                Enfrente o Outro Lado. <span className="text-[#C0C0C0]">Proteja a humanidade.</span>
              </p>
              
              <Link to={user ? "/dashboard" : "/auth?mode=signup"}>
                <Button 
                  size="lg" 
                  className="bg-[#8B0000] hover:bg-[#B22222] text-white text-sm sm:text-lg px-8 sm:px-12 py-6 border border-[#B22222]/30 animate-blood-pulse transition-all group"
                >
                  <ParanormalElementIcon element="sangue" size="sm" variant="simple" className="mr-2 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">{user ? 'Ir para Dashboard' : 'Iniciar Investigação'}</span>
                  <span className="sm:hidden">{user ? 'Dashboard' : 'Iniciar'}</span>
                </Button>
              </Link>
              
              <p className="text-[#606060] text-xs sm:text-sm mt-5 font-mono">
                Sem custo • Sem instalação • Confidencial
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#8B0000]/20 py-6 sm:py-8 bg-[#0D0A0B]/80">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ParanormalElementIcon element="sangue" size="sm" variant="simple" className="opacity-40" />
            <ParanormalElementIcon element="morte" size="sm" variant="simple" className="opacity-40" />
            <ParanormalElementIcon element="conhecimento" size="sm" variant="simple" className="opacity-40" />
            <ParanormalElementIcon element="energia" size="sm" variant="simple" className="opacity-40" />
            <ParanormalElementIcon element="medo" size="sm" variant="simple" className="opacity-40" />
          </div>
          
          {/* Install App Link */}
          <Link 
            to="/install" 
            className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-lg border border-[#8B0000]/30 bg-[#8B0000]/10 hover:bg-[#8B0000]/20 text-[#B22222] hover:text-[#F5F5F5] transition-all group"
          >
            <Smartphone className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-xs sm:text-sm font-medium">Instalar App no Celular</span>
          </Link>
          
          <p className="text-[#808080] text-xs sm:text-sm">
            © 2024 Let's Roll — Sistema não oficial para Ordem Paranormal RPG
          </p>
          <p className="text-[#505050] text-[10px] sm:text-xs mt-2">
            Desenvolvido por Muu Walkers • Ordem Paranormal é uma criação de Cellbit
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

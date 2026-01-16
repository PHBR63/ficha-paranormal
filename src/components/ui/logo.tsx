/**
 * Logo - Componente reutilizável do logo Let's Roll
 * D20 com órbitas coloridas representando os elementos paranormais
 */

import { cn } from '@/lib/utils';
import logoSrc from '@/assets/logo.svg';

// Tamanhos pré-definidos do logo (em pixels)
const SIZE_MAP = {
  xs: { container: 24, img: 20 },
  sm: { container: 32, img: 28 },
  md: { container: 40, img: 36 },
  lg: { container: 56, img: 48 },
  xl: { container: 80, img: 72 },
  '2xl': { container: 112, img: 100 },
} as const;

type LogoSize = keyof typeof SIZE_MAP;

interface LogoProps {
  /** Tamanho predefinido do logo */
  size?: LogoSize;
  /** Aplicar animação de pulse */
  animate?: boolean;
  /** Aplicar efeito de glow */
  glow?: boolean;
  /** Classes adicionais para o container */
  className?: string;
  /** Cor do glow (hsl ou hex) */
  glowColor?: string;
}

/**
 * Componente Logo reutilizável
 * Exibe o logo Let's Roll (d20 com órbitas) em diferentes tamanhos
 */
export function Logo({ 
  size = 'md', 
  animate = false, 
  glow = false,
  className,
  glowColor = 'hsl(0, 100%, 27%)' // #8B0000 por padrão
}: LogoProps) {
  const dimensions = SIZE_MAP[size];
  
  return (
    <div 
      className={cn(
        'relative flex items-center justify-center rounded-lg',
        animate && 'animate-pulse',
        className
      )}
      style={{ 
        width: dimensions.container, 
        height: dimensions.container 
      }}
    >
      {/* Efeito de glow (opcional) */}
      {glow && (
        <div 
          className="absolute inset-0 rounded-full blur-xl opacity-40 animate-pulse"
          style={{ backgroundColor: glowColor }}
        />
      )}
      
      {/* Logo principal */}
      <img 
        src={logoSrc} 
        alt="Let's Roll Logo" 
        className={cn(
          'relative z-10 object-contain select-none',
          animate && 'animate-pulse'
        )}
        style={{ 
          width: dimensions.img, 
          height: dimensions.img 
        }}
        draggable={false}
      />
    </div>
  );
}

/**
 * Logo com container estilizado (borda e fundo)
 * Ideal para headers e cards
 */
export function LogoBox({ 
  size = 'md', 
  animate = false,
  className 
}: Omit<LogoProps, 'glow' | 'glowColor'>) {
  const dimensions = SIZE_MAP[size];
  
  return (
    <div 
      className={cn(
        'rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center',
        'transition-all hover:border-primary/60 hover:bg-primary/30',
        className
      )}
      style={{ 
        width: dimensions.container, 
        height: dimensions.container 
      }}
    >
      <img 
        src={logoSrc} 
        alt="Let's Roll Logo" 
        className={cn(
          'object-contain select-none',
          animate && 'animate-pulse'
        )}
        style={{ 
          width: dimensions.img * 0.85, 
          height: dimensions.img * 0.85
        }}
        draggable={false}
      />
    </div>
  );
}

/**
 * Logo hero com efeitos visuais intensos
 * Ideal para seções de destaque
 */
export function LogoHero({ 
  size = 'xl',
  className 
}: Pick<LogoProps, 'size' | 'className'>) {
  const dimensions = SIZE_MAP[size];
  
  return (
    <div className={cn('relative', className)}>
      {/* Glow effect externo */}
      <div 
        className="absolute inset-0 bg-[#8B0000]/20 rounded-full blur-3xl animate-pulse scale-150" 
      />
      
      {/* Container com bordas animadas */}
      <div 
        className="relative flex items-center justify-center"
        style={{ 
          width: dimensions.container, 
          height: dimensions.container 
        }}
      >
        {/* Borda externa animada */}
        <div className="absolute inset-0 border-2 border-[#8B0000]/40 rounded-full animate-heartbeat" />
        
        {/* Borda interna */}
        <div className="absolute inset-2 border border-[#B22222]/30 rounded-full" />
        
        {/* Logo central */}
        <img 
          src={logoSrc} 
          alt="Let's Roll Logo" 
          className="relative z-10 object-contain select-none animate-pulse"
          style={{ 
            width: dimensions.img * 0.7, 
            height: dimensions.img * 0.7
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}

export default Logo;

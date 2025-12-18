/**
 * ParanormalElementIcon - Ícones SVG customizados para os 5 elementos paranormais
 * Sangue, Morte, Conhecimento, Energia, Medo
 * 
 * Baseado no universo Ordem Paranormal RPG
 */

import { cn } from '@/lib/utils';

export type ParanormalElementType = 'sangue' | 'morte' | 'conhecimento' | 'energia' | 'medo';

interface ParanormalElementIconProps {
  element: ParanormalElementType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'simple' | 'glow' | 'animated';
  className?: string;
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

const elementColors: Record<ParanormalElementType, { primary: string; glow: string }> = {
  sangue: { primary: '#B22222', glow: 'rgba(178, 34, 34, 0.6)' },
  morte: { primary: '#4A4A4A', glow: 'rgba(74, 74, 74, 0.6)' },
  conhecimento: { primary: '#FFD700', glow: 'rgba(255, 215, 0, 0.6)' },
  energia: { primary: '#8A2BE2', glow: 'rgba(138, 43, 226, 0.6)' },
  medo: { primary: '#F5F5F5', glow: 'rgba(245, 245, 245, 0.6)' },
};

// SVG paths para cada elemento
const BloodIcon = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Gota de sangue estilizada com veias internas */}
    <path
      d="M32 4C32 4 12 28 12 42C12 53.046 20.954 62 32 62C43.046 62 52 53.046 52 42C52 28 32 4 32 4Z"
      fill={color}
      stroke={color}
      strokeWidth="2"
    />
    {/* Veias internas */}
    <path
      d="M32 14L28 32L32 38L36 32L32 14Z"
      fill="rgba(0,0,0,0.3)"
    />
    <path
      d="M24 36C24 36 28 42 32 42C36 42 40 36 40 36"
      stroke="rgba(0,0,0,0.2)"
      strokeWidth="2"
      fill="none"
    />
    {/* Brilho */}
    <ellipse cx="22" cy="38" rx="4" ry="6" fill="rgba(255,255,255,0.2)" />
  </svg>
);

const DeathIcon = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Crânio estilizado */}
    <ellipse cx="32" cy="28" rx="20" ry="22" fill={color} />
    {/* Maxilar */}
    <path
      d="M18 38C18 38 20 52 32 52C44 52 46 38 46 38"
      fill={color}
    />
    {/* Olhos vazios com espiral */}
    <circle cx="24" cy="26" r="6" fill="#0D0A0B" />
    <circle cx="40" cy="26" r="6" fill="#0D0A0B" />
    {/* Espiral no olho esquerdo */}
    <path
      d="M24 26C24 26 22 24 24 22C26 20 28 22 28 24C28 26 26 28 24 28"
      stroke="rgba(255,255,255,0.3)"
      strokeWidth="1.5"
      fill="none"
    />
    {/* Nariz */}
    <path
      d="M32 32L29 38L35 38L32 32Z"
      fill="#0D0A0B"
    />
    {/* Dentes */}
    <rect x="24" y="44" width="4" height="6" fill="#0D0A0B" rx="1" />
    <rect x="30" y="44" width="4" height="6" fill="#0D0A0B" rx="1" />
    <rect x="36" y="44" width="4" height="6" fill="#0D0A0B" rx="1" />
  </svg>
);

const KnowledgeIcon = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Olho aberto */}
    <ellipse cx="32" cy="32" rx="28" ry="18" fill="none" stroke={color} strokeWidth="3" />
    {/* Íris */}
    <circle cx="32" cy="32" r="12" fill={color} />
    {/* Pupila com sigilo */}
    <circle cx="32" cy="32" r="6" fill="#0D0A0B" />
    {/* Sigilo/símbolo na pupila */}
    <path
      d="M32 28V36M28 32H36M30 30L34 34M34 30L30 34"
      stroke={color}
      strokeWidth="1"
      opacity="0.8"
    />
    {/* Brilho */}
    <circle cx="36" cy="28" r="2" fill="rgba(255,255,255,0.6)" />
    {/* Raios de conhecimento */}
    <path d="M32 8V14" stroke={color} strokeWidth="2" />
    <path d="M32 50V56" stroke={color} strokeWidth="2" />
    <path d="M8 32H14" stroke={color} strokeWidth="2" />
    <path d="M50 32H56" stroke={color} strokeWidth="2" />
  </svg>
);

const EnergyIcon = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Raio principal com efeito de glitch/fragmentação */}
    <path
      d="M38 4L22 28H32L18 60L46 32H34L38 4Z"
      fill={color}
      stroke={color}
      strokeWidth="1"
    />
    {/* Fragmentos de energia (glitch effect) */}
    <path
      d="M42 12L48 8L46 16L42 12Z"
      fill={color}
      opacity="0.6"
    />
    <path
      d="M14 36L10 40L16 42L14 36Z"
      fill={color}
      opacity="0.6"
    />
    <path
      d="M50 28L54 32L50 36L50 28Z"
      fill={color}
      opacity="0.4"
    />
    {/* Linhas de energia */}
    <path
      d="M36 20L40 18"
      stroke="rgba(255,255,255,0.4)"
      strokeWidth="2"
    />
    <path
      d="M26 38L22 42"
      stroke="rgba(255,255,255,0.4)"
      strokeWidth="2"
    />
  </svg>
);

const FearIcon = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Chama etérea/fantasmagórica */}
    <path
      d="M32 4C32 4 16 20 16 36C16 44 20 52 28 56C24 52 22 46 24 40C26 34 32 30 32 30C32 30 38 34 40 40C42 46 40 52 36 56C44 52 48 44 48 36C48 20 32 4 32 4Z"
      fill={color}
      opacity="0.9"
    />
    {/* Camada interna mais clara */}
    <path
      d="M32 16C32 16 24 26 24 36C24 42 28 48 32 48C36 48 40 42 40 36C40 26 32 16 32 16Z"
      fill="rgba(255,255,255,0.3)"
    />
    {/* Olhos na chama (rosto do medo) */}
    <ellipse cx="28" cy="38" rx="2" ry="3" fill="#0D0A0B" />
    <ellipse cx="36" cy="38" rx="2" ry="3" fill="#0D0A0B" />
    {/* Boca assustada */}
    <ellipse cx="32" cy="46" rx="3" ry="2" fill="#0D0A0B" />
    {/* Partículas flutuantes */}
    <circle cx="20" cy="20" r="2" fill={color} opacity="0.4" />
    <circle cx="44" cy="24" r="1.5" fill={color} opacity="0.3" />
    <circle cx="12" cy="40" r="1" fill={color} opacity="0.2" />
  </svg>
);

const elementIcons: Record<ParanormalElementType, React.FC<{ size: number; color: string }>> = {
  sangue: BloodIcon,
  morte: DeathIcon,
  conhecimento: KnowledgeIcon,
  energia: EnergyIcon,
  medo: FearIcon,
};

export const ParanormalElementIcon = ({
  element,
  size = 'md',
  variant = 'simple',
  className,
}: ParanormalElementIconProps) => {
  const IconComponent = elementIcons[element];
  const pixelSize = sizeMap[size];
  const colors = elementColors[element];

  const glowStyle = variant === 'glow' || variant === 'animated'
    ? { filter: `drop-shadow(0 0 8px ${colors.glow}) drop-shadow(0 0 16px ${colors.glow})` }
    : {};

  const animationClass = variant === 'animated' ? 'animate-pulse-slow' : '';

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center transition-all duration-300',
        animationClass,
        className
      )}
      style={glowStyle}
    >
      <IconComponent size={pixelSize} color={colors.primary} />
    </div>
  );
};

// Componente para exibir todos os 5 elementos em linha
export const ParanormalElementsRow = ({
  size = 'md',
  variant = 'glow',
  className,
}: Omit<ParanormalElementIconProps, 'element'>) => {
  const elements: ParanormalElementType[] = ['sangue', 'morte', 'conhecimento', 'energia', 'medo'];

  return (
    <div className={cn('flex items-center justify-center gap-4', className)}>
      {elements.map((element) => (
        <ParanormalElementIcon
          key={element}
          element={element}
          size={size}
          variant={variant}
        />
      ))}
    </div>
  );
};

// Labels em português
export const elementLabels: Record<ParanormalElementType, string> = {
  sangue: 'Sangue',
  morte: 'Morte',
  conhecimento: 'Conhecimento',
  energia: 'Energia',
  medo: 'Medo',
};

export default ParanormalElementIcon;

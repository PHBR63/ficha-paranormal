/**
 * ConditionTimer - Timer visual circular para condições temporárias
 * 
 * Exibe um indicador circular animado mostrando o tempo restante
 * da condição de forma visual e intuitiva
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ConditionTimerProps {
  turnsRemaining: number;
  maxTurns?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  showNumber?: boolean;
  animate?: boolean;
  className?: string;
}

const SIZES = {
  sm: { outer: 24, inner: 18, stroke: 3, fontSize: 'text-[10px]' },
  md: { outer: 32, inner: 24, stroke: 4, fontSize: 'text-xs' },
  lg: { outer: 44, inner: 34, stroke: 5, fontSize: 'text-sm' },
};

export function ConditionTimer({
  turnsRemaining,
  maxTurns = 5,
  size = 'md',
  color = 'hsl(var(--primary))',
  showNumber = true,
  animate = true,
  className,
}: ConditionTimerProps) {
  const { outer, inner, stroke, fontSize } = SIZES[size];
  const radius = (outer - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(turnsRemaining / maxTurns, 1);
  const strokeDashoffset = circumference * (1 - progress);
  
  // Cor baseada no tempo restante
  const getProgressColor = () => {
    if (turnsRemaining <= 1) return 'hsl(var(--destructive))';
    if (turnsRemaining <= 2) return 'hsl(var(--warning))';
    return color;
  };

  // Pulsar quando está acabando
  const isPulsing = turnsRemaining <= 1;

  return (
    <div 
      className={cn(
        'relative inline-flex items-center justify-center',
        isPulsing && animate && 'animate-pulse',
        className
      )}
      style={{ width: outer, height: outer }}
    >
      {/* SVG do círculo */}
      <svg
        width={outer}
        height={outer}
        viewBox={`0 0 ${outer} ${outer}`}
        className="transform -rotate-90"
      >
        {/* Círculo de fundo */}
        <circle
          cx={outer / 2}
          cy={outer / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
          opacity={0.3}
        />
        
        {/* Círculo de progresso */}
        <motion.circle
          cx={outer / 2}
          cy={outer / 2}
          r={radius}
          fill="none"
          stroke={getProgressColor()}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </svg>
      
      {/* Número central */}
      {showNumber && (
        <motion.span 
          key={turnsRemaining}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            'absolute font-mono font-bold',
            fontSize,
            turnsRemaining <= 1 && 'text-destructive',
            turnsRemaining === 2 && 'text-warning',
          )}
          style={{ color: turnsRemaining > 2 ? color : undefined }}
        >
          {turnsRemaining}
        </motion.span>
      )}
    </div>
  );
}

/**
 * ConditionTimerBar - Versão em barra horizontal do timer
 */
interface ConditionTimerBarProps {
  turnsRemaining: number;
  maxTurns?: number;
  showNumber?: boolean;
  className?: string;
}

export function ConditionTimerBar({
  turnsRemaining,
  maxTurns = 5,
  showNumber = true,
  className,
}: ConditionTimerBarProps) {
  const progress = Math.min(turnsRemaining / maxTurns, 1) * 100;
  
  // Cor baseada no tempo restante
  const getBarColor = () => {
    if (turnsRemaining <= 1) return 'bg-destructive';
    if (turnsRemaining <= 2) return 'bg-warning';
    return 'bg-primary';
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', getBarColor())}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
      {showNumber && (
        <span className={cn(
          'text-xs font-mono min-w-[1.5rem] text-right',
          turnsRemaining <= 1 && 'text-destructive',
          turnsRemaining === 2 && 'text-warning',
        )}>
          {turnsRemaining}
        </span>
      )}
    </div>
  );
}

/**
 * ConditionTimerSegmented - Timer com segmentos individuais
 */
interface ConditionTimerSegmentedProps {
  turnsRemaining: number;
  maxTurns?: number;
  className?: string;
}

export function ConditionTimerSegmented({
  turnsRemaining,
  maxTurns = 5,
  className,
}: ConditionTimerSegmentedProps) {
  const segments = Array.from({ length: maxTurns }, (_, i) => i < turnsRemaining);
  
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {segments.map((active, index) => {
        const isLast = index === turnsRemaining - 1;
        const isCritical = turnsRemaining <= 1 && active;
        const isWarning = turnsRemaining === 2 && index < 2;
        
        return (
          <motion.div
            key={index}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: active ? 1 : 0.8, 
              opacity: active ? 1 : 0.3,
            }}
            className={cn(
              'w-2 h-3 rounded-sm transition-colors',
              active 
                ? isCritical 
                  ? 'bg-destructive' 
                  : isWarning 
                    ? 'bg-warning'
                    : 'bg-primary'
                : 'bg-muted',
              isLast && active && 'animate-pulse'
            )}
          />
        );
      })}
    </div>
  );
}

/**
 * DyingTimer - Timer especial para condição Morrendo
 * Mostra a contagem manual; o saldo local não certifica os turnos da cena.
 */
interface DyingTimerProps {
  counter: number; // 3, 2, 1, 0
  className?: string;
}

export function DyingTimer({ counter, className }: DyingTimerProps) {
  const segments = [
    { active: counter >= 1, label: '1' },
    { active: counter >= 2, label: '2' },
    { active: counter >= 3, label: '3' },
  ];

  return (
    <div className={cn('flex items-center gap-1', className)} role="img"
      aria-label={`Contagem manual de Morrendo: ${counter} inícios de turno restantes. Confira a mesma cena com o mestre.`}
      title="Contagem manual: confira os inícios de turno na mesma cena, inclusive não consecutivos. Zero exige conferência com o mestre.">
      {segments.map((seg, index) => (
        <motion.div
          key={index}
          initial={{ scale: 0.8 }}
          animate={{ 
            scale: seg.active ? 1 : 0.8,
            opacity: seg.active ? 1 : 0.3,
          }}
          className={cn(
            'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all',
            seg.active 
              ? counter === 1 
                ? 'bg-destructive border-destructive text-destructive-foreground animate-pulse' 
                : 'bg-destructive/20 border-destructive text-destructive'
              : 'bg-muted border-muted-foreground/30 text-muted-foreground'
          )}
        >
          {seg.label}
        </motion.div>
      ))}
      
      {/* Caveira final */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ 
          scale: counter === 0 ? 1.2 : 0.8,
          opacity: counter === 0 ? 1 : 0.3,
        }}
        className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center text-xs',
          counter === 0 && 'text-destructive'
        )}
      >
        💀
      </motion.div>
    </div>
  );
}

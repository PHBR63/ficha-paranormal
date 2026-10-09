/**
 * ProgressBadge - Badge de progresso animado para criação de personagem
 * 
 * Mostra visualmente o progresso da criação do agente com animações temáticas.
 * Exibe porcentagem, barra de progresso e efeitos visuais de selo/carimbo.
 */

import { motion } from 'framer-motion';
import { FileText, Stamp } from '@/components/icons/ordem-icons';
import { cn } from '@/lib/utils';

interface ProgressBadgeProps {
  /** Porcentagem de conclusão (0-100) */
  progress: number;
  /** Total de steps */
  totalSteps: number;
  /** Steps completados */
  completedSteps: number;
  /** Classe selecionada para tema de cores */
  characterClass?: string;
  /** Exibir em modo compacto */
  compact?: boolean;
}

// Cores temáticas por classe
const CLASS_COLORS: Record<string, { primary: string; glow: string }> = {
  Combatente: { primary: 'from-red-500 to-orange-500', glow: 'shadow-red-500/30' },
  Especialista: { primary: 'from-blue-500 to-cyan-500', glow: 'shadow-blue-500/30' },
  Ocultista: { primary: 'from-purple-500 to-pink-500', glow: 'shadow-purple-500/30' },
};

export function ProgressBadge({
  progress,
  totalSteps,
  completedSteps,
  characterClass,
  compact = false,
}: ProgressBadgeProps) {
  const colors = characterClass ? CLASS_COLORS[characterClass] : null;
  const gradientClass = colors?.primary || 'from-primary to-primary/70';
  const glowClass = colors?.glow || 'shadow-primary/30';
  
  const isComplete = progress >= 100;

  if (compact) {
    return (
      <motion.div 
        className="flex items-center gap-2"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="relative">
          {/* Círculo de progresso */}
          <svg className="w-8 h-8 -rotate-90">
            <circle
              cx="16"
              cy="16"
              r="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted/30"
            />
            <motion.circle
              cx="16"
              cy="16"
              r="14"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={88}
              initial={{ strokeDashoffset: 88 }}
              animate={{ strokeDashoffset: 88 - (88 * progress) / 100 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--secondary))" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
            {Math.round(progress)}%
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {completedSteps}/{totalSteps}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-lg border bg-card/50 backdrop-blur-sm p-4',
        isComplete && 'border-primary/50'
      )}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Efeito de selo/carimbo quando completo */}
      {isComplete && (
        <motion.div
          className="absolute top-2 right-2"
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: 'spring', 
            stiffness: 500, 
            damping: 25,
            delay: 0.2 
          }}
        >
          <div className="relative">
            <Stamp className="w-8 h-8 text-primary" />
            <motion.div
              className="absolute inset-0 bg-primary/20 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          'bg-gradient-to-br',
          gradientClass,
          'shadow-lg',
          glowClass
        )}>
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-display text-sm tracking-wider text-foreground">
            DOSSIÊ {isComplete ? 'COMPLETO' : 'EM PROGRESSO'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {completedSteps} de {totalSteps} etapas concluídas
          </p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full bg-gradient-to-r',
            gradientClass
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ['-100%', '500%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        />
      </div>

      {/* Porcentagem */}
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-muted-foreground">Progresso</span>
        <motion.span
          key={progress}
          className="font-display text-lg text-primary"
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500 }}
        >
          {Math.round(progress)}%
        </motion.span>
      </div>
    </motion.div>
  );
}

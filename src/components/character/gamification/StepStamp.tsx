/**
 * StepStamp - Efeito de carimbo visual para steps completados
 * 
 * Mostra um selo de "VERIFICADO" com animação quando um step é concluído.
 */

import { motion } from 'framer-motion';
import { Check } from '@/components/icons/ordem-icons';
import { cn } from '@/lib/utils';

interface StepStampProps {
  /** Se o step está completado */
  isCompleted: boolean;
  /** Tamanho do stamp */
  size?: 'sm' | 'md' | 'lg';
  /** Mostrar texto "VERIFICADO" */
  showText?: boolean;
}

const SIZES = {
  sm: { container: 'w-6 h-6', icon: 'w-3 h-3', text: 'text-[8px]' },
  md: { container: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-[10px]' },
  lg: { container: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-xs' },
};

export function StepStamp({ 
  isCompleted, 
  size = 'md',
  showText = false 
}: StepStampProps) {
  const sizeConfig = SIZES[size];

  if (!isCompleted) return null;

  return (
    <motion.div
      className="flex flex-col items-center gap-1"
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 20,
      }}
    >
      {/* Círculo do selo */}
      <div
        className={cn(
          sizeConfig.container,
          'rounded-full',
          'bg-primary/20 border-2 border-primary',
          'flex items-center justify-center',
          'shadow-lg shadow-primary/20'
        )}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 600 }}
        >
          <Check className={cn(sizeConfig.icon, 'text-primary')} />
        </motion.div>
      </div>

      {/* Texto opcional */}
      {showText && (
        <motion.span
          className={cn(
            sizeConfig.text,
            'font-display tracking-wider text-primary uppercase'
          )}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Verificado
        </motion.span>
      )}

      {/* Efeito de pulse */}
      <motion.div
        className={cn(
          'absolute',
          sizeConfig.container,
          'rounded-full border-2 border-primary/50'
        )}
        initial={{ scale: 1, opacity: 0.5 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.5 }}
      />
    </motion.div>
  );
}

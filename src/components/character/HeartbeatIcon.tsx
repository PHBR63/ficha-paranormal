/**
 * HeartbeatIcon - Ícone de coração com animação de batimento
 * A velocidade do batimento varia com a porcentagem de HP
 */

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeartbeatIconProps {
  hpPercent: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function HeartbeatIcon({ hpPercent, className, size = 'md' }: HeartbeatIconProps) {
  // Calcular duração do batimento baseado no HP
  // HP 100% = 1.2s (batimento normal ~50 bpm)
  // HP 50% = 0.8s (batimento elevado ~75 bpm)
  // HP 25% = 0.5s (batimento acelerado ~120 bpm)
  // HP 10% = 0.3s (batimento crítico ~200 bpm)
  const getDuration = () => {
    if (hpPercent <= 10) return 0.3;
    if (hpPercent <= 25) return 0.5;
    if (hpPercent <= 50) return 0.8;
    if (hpPercent <= 75) return 1.0;
    return 1.2;
  };

  const duration = getDuration();
  const isLow = hpPercent <= 25;
  const isCritical = hpPercent <= 10;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className="relative">
      {/* Glow effect para HP baixo */}
      {isLow && (
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full blur-md",
            isCritical ? "bg-destructive" : "bg-destructive/70"
          )}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      
      {/* Ícone do coração com batimento */}
      <motion.div
        className={cn("relative", className)}
        animate={{
          scale: [1, 1.15, 1, 1.1, 1],
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.15, 0.3, 0.45, 1], // Simula batimento real (lub-dub)
        }}
      >
        <Heart 
          className={cn(
            sizeClasses[size],
            isLow ? "text-destructive" : "text-hp",
            isCritical && "drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]"
          )} 
          fill={isLow ? "currentColor" : "none"}
        />
      </motion.div>

      {/* Pulso de onda para estados críticos */}
      {isCritical && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{
            scale: [1, 2.5],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: duration * 1.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
        >
          <Heart className={cn(sizeClasses[size], "text-destructive")} />
        </motion.div>
      )}
    </div>
  );
}

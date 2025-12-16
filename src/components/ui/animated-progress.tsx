import * as React from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedProgressProps {
  value: number;
  max: number;
  variant?: 'hp' | 'pe' | 'san' | 'xp' | 'default';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showValue?: boolean;
  className?: string;
  animate?: boolean;
  glow?: boolean;
}

// Estilos de variantes para as barras de progresso
const variantStyles = {
  hp: {
    bar: 'bg-hp',
    glow: 'shadow-[0_0_10px_hsl(var(--hp)/0.5)]',
    track: 'bg-hp/20',
    label: 'PV',
  },
  pe: {
    bar: 'bg-pe',
    glow: 'shadow-[0_0_10px_hsl(var(--pe)/0.5)]',
    track: 'bg-pe/20',
    label: 'PE',
  },
  san: {
    bar: 'bg-san',
    glow: 'shadow-[0_0_10px_hsl(var(--san)/0.5)]',
    track: 'bg-san/20',
    label: 'SAN',
  },
  xp: {
    bar: 'bg-[hsl(var(--status-xp))]',
    glow: 'shadow-[0_0_10px_hsl(var(--status-xp)/0.5)]',
    track: 'bg-[hsl(var(--status-xp)/0.2)]',
    label: 'XP',
  },
  default: {
    bar: 'bg-primary',
    glow: 'shadow-[0_0_10px_hsl(var(--primary)/0.5)]',
    track: 'bg-muted',
    label: 'Progress',
  },
};

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function AnimatedProgress({
  value,
  max,
  variant = 'default',
  size = 'md',
  showLabel = false,
  showValue = false,
  className,
  animate = true,
  glow = false,
}: AnimatedProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const styles = variantStyles[variant];
  
  // Animated width
  const springConfig = { stiffness: 100, damping: 15 };
  const animatedWidth = useSpring(percentage, springConfig);
  const width = useTransform(animatedWidth, (v) => `${v}%`);

  // Low value warning
  const isLow = percentage <= 25;
  const isCritical = percentage <= 10;

  return (
    <div className={cn("w-full", className)}>
      {(showLabel || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {showLabel && (
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {styles.label}
            </span>
          )}
          {showValue && (
            <motion.span 
              className={cn(
                "text-xs font-medium text-foreground",
                isCritical && "text-[hsl(var(--status-hp))] animate-pulse",
                isLow && !isCritical && variant === 'hp' && "text-[hsl(var(--status-hp))]"
              )}
              key={value}
              initial={animate ? { scale: 1.2 } : undefined}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {value}/{max}
            </motion.span>
          )}
        </div>
      )}
      
      <div 
        className={cn(
          "relative w-full rounded-full overflow-hidden",
          styles.track,
          sizeStyles[size]
        )}
      >
        <motion.div
          className={cn(
            "h-full rounded-full transition-colors",
            styles.bar,
            glow && styles.glow,
            isCritical && "animate-pulse"
          )}
          style={{ width: animate ? width : `${percentage}%` }}
          initial={animate ? { width: 0 } : undefined}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        
        {/* Shimmer effect */}
        {animate && percentage > 0 && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "linear",
              repeatDelay: 3,
            }}
          />
        )}
      </div>
    </div>
  );
}

// Compact version for cards
export function MiniProgress({
  value,
  max,
  variant = 'default',
  className,
}: Pick<AnimatedProgressProps, 'value' | 'max' | 'variant' | 'className'>) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const styles = variantStyles[variant];
  
  return (
    <div className={cn("h-1 w-full rounded-full overflow-hidden", styles.track, className)}>
      <motion.div
        className={cn("h-full rounded-full", styles.bar)}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

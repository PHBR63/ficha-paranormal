"use client";

import { useEffect, useRef } from "react";
import { motion, useSpring, useTransform, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  duration?: number;
  delay?: number;
  formatOptions?: Intl.NumberFormatOptions;
  onAnimationComplete?: () => void;
}

export function AnimatedNumber({
  value,
  className,
  duration = 1,
  delay = 0,
  formatOptions,
  onAnimationComplete,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (current) => {
    if (formatOptions) {
      return new Intl.NumberFormat("pt-BR", formatOptions).format(Math.round(current));
    }
    return Math.round(current).toString();
  });

  useEffect(() => {
    if (isInView) {
      const timeout = setTimeout(() => {
        spring.set(value);
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [isInView, value, spring, delay]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      if (Math.abs(latest - value) < 0.5 && onAnimationComplete) {
        onAnimationComplete();
      }
    });
    return unsubscribe;
  }, [spring, value, onAnimationComplete]);

  return (
    <motion.span ref={ref} className={cn("tabular-nums", className)}>
      {display}
    </motion.span>
  );
}

// Ticker for counting up/down with effects
interface NumberTickerProps {
  value: number;
  previousValue?: number;
  className?: string;
  showChange?: boolean;
}

export function NumberTicker({
  value,
  previousValue,
  className,
  showChange = true,
}: NumberTickerProps) {
  const change = previousValue !== undefined ? value - previousValue : 0;
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className={cn("relative inline-flex items-center gap-1", className)}>
      <motion.span
        key={value}
        initial={{ y: isPositive ? 20 : isNegative ? -20 : 0, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: isPositive ? -20 : isNegative ? 20 : 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="tabular-nums"
      >
        {value}
      </motion.span>
      
      {showChange && change !== 0 && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5, x: -10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className={cn(
            "text-xs font-medium",
            isPositive && "text-success",
            isNegative && "text-destructive"
          )}
        >
          {isPositive ? `+${change}` : change}
        </motion.span>
      )}
    </div>
  );
}

// Damage/Heal popup
interface DamagePopupProps {
  value: number;
  type: 'damage' | 'heal' | 'sanity';
  onComplete?: () => void;
}

export function DamagePopup({ value, type, onComplete }: DamagePopupProps) {
  const colors = {
    damage: 'text-destructive',
    heal: 'text-success',
    sanity: 'text-paranormal',
  };

  const prefix = {
    damage: '-',
    heal: '+',
    sanity: '-',
  };

  return (
    <motion.div
      className={cn(
        "absolute text-2xl font-bold pointer-events-none z-50",
        colors[type]
      )}
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ 
        opacity: 0, 
        y: -50, 
        scale: 1.5,
      }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      onAnimationComplete={onComplete}
    >
      {prefix[type]}{value}
    </motion.div>
  );
}

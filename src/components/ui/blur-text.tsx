/**
 * BlurText - Texto com efeito de blur/sanidade
 * Simula perda de sanidade ou visão turva
 */

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, useInView } from 'framer-motion';

interface BlurTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  variant?: 'reveal' | 'sanity' | 'pulse';
  animateByWord?: boolean;
}

export function BlurText({
  text,
  className,
  delay = 0,
  duration = 0.4,
  variant = 'reveal',
  animateByWord = true,
}: BlurTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [sanityPulse, setSanityPulse] = useState(false);

  const elements = animateByWord ? text.split(' ') : text.split('');

  // Sanity pulse effect
  useEffect(() => {
    if (variant === 'sanity') {
      const interval = setInterval(() => {
        setSanityPulse(true);
        setTimeout(() => setSanityPulse(false), 300);
      }, 3000 + Math.random() * 2000);
      return () => clearInterval(interval);
    }
  }, [variant]);

  if (variant === 'sanity') {
    return (
      <span 
        className={cn(
          'transition-all duration-300',
          sanityPulse && 'blur-[2px] text-primary/80',
          className
        )}
      >
        {text}
      </span>
    );
  }

  if (variant === 'pulse') {
    return (
      <motion.span
        className={cn('inline-block', className)}
        animate={{
          filter: ['blur(0px)', 'blur(2px)', 'blur(0px)'],
          opacity: [1, 0.7, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {text}
      </motion.span>
    );
  }

  return (
    <div ref={ref} className={cn('flex flex-wrap', className)}>
      {elements.map((element, index) => (
        <motion.span
          key={index}
          initial={{ filter: 'blur(10px)', opacity: 0 }}
          animate={isInView ? { filter: 'blur(0px)', opacity: 1 } : {}}
          transition={{
            duration,
            delay: delay + index * 0.05,
            ease: 'easeOut',
          }}
          className="inline-block"
        >
          {element}
          {animateByWord && index < elements.length - 1 && '\u00A0'}
        </motion.span>
      ))}
    </div>
  );
}

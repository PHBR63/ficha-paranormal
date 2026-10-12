/**
 * CreationCelebration - Overlay de celebração ao finalizar criação
 * 
 * Exibe animação de "AGENTE REGISTRADO" com selo da Ordo Realitas,
 * confetti temático por classe e efeitos visuais de aprovação.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Shield, Stamp, Star } from '@/components/icons/ordem-icons';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface CreationCelebrationProps {
  /** Se deve mostrar a celebração */
  show: boolean;
  /** Nome do personagem criado */
  characterName: string;
  /** Classe do personagem */
  characterClass: string;
  /** Callback quando a animação terminar */
  onComplete?: () => void;
}

// Cores de confetti por classe
const CLASS_CONFETTI_COLORS: Record<string, string[]> = {
  Combatente: ['#ef4444', '#f97316', '#fbbf24', '#dc2626'],
  Especialista: ['#3b82f6', '#06b6d4', '#0ea5e9', '#2563eb'],
  Ocultista: ['#a855f7', '#ec4899', '#8b5cf6', '#d946ef'],
};

export function CreationCelebration({
  show,
  characterName,
  characterClass,
  onComplete,
}: CreationCelebrationProps) {
  const [phase, setPhase] = useState<'stamp' | 'name' | 'complete'>('stamp');

  useEffect(() => {
    if (!show) {
      setPhase('stamp');
      return;
    }

    // Disparar confetti temático
    const colors = CLASS_CONFETTI_COLORS[characterClass] || ['#a855f7', '#ec4899'];
    
    // Primeira explosão
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors,
    });

    // Segunda explosão após pequeno delay
    const confettiTimeout = setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 100,
        origin: { y: 0.5, x: 0.3 },
        colors,
      });
      confetti({
        particleCount: 50,
        spread: 100,
        origin: { y: 0.5, x: 0.7 },
        colors,
      });
    }, 300);

    // Progressão das fases
    const phaseTimeout1 = setTimeout(() => setPhase('name'), 800);
    const phaseTimeout2 = setTimeout(() => setPhase('complete'), 1600);
    const completeTimeout = setTimeout(() => onComplete?.(), 2500);

    return () => {
      clearTimeout(confettiTimeout);
      clearTimeout(phaseTimeout1);
      clearTimeout(phaseTimeout2);
      clearTimeout(completeTimeout);
    };
  }, [show, characterClass, onComplete]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop escurecido */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Conteúdo central */}
        <motion.div
          className="relative z-10 text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* Círculo de fundo com glow */}
          <motion.div
            className={cn(
              'w-40 h-40 mx-auto rounded-full',
              'bg-gradient-to-br from-primary/20 to-primary/5',
              'border-2 border-primary/50',
              'flex items-center justify-center',
              'shadow-2xl shadow-primary/30'
            )}
            animate={{
              boxShadow: [
                '0 0 30px rgba(168, 85, 247, 0.3)',
                '0 0 60px rgba(168, 85, 247, 0.5)',
                '0 0 30px rgba(168, 85, 247, 0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {/* Ícone central */}
            <AnimatePresence mode="wait">
              {phase === 'stamp' && (
                <motion.div
                  key="stamp"
                  initial={{ scale: 2, opacity: 0, rotate: -30 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <Stamp className="w-20 h-20 text-primary" />
                </motion.div>
              )}
              {phase === 'name' && (
                <motion.div
                  key="shield"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <Shield className="w-20 h-20 text-primary" />
                </motion.div>
              )}
              {phase === 'complete' && (
                <motion.div
                  key="check"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="relative"
                >
                  <Check className="w-20 h-20 text-primary" />
                  {/* Estrelas ao redor */}
                  {[0, 72, 144, 216, 288].map((angle, i) => (
                    <motion.div
                      key={angle}
                      className="absolute"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-50px)`,
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Star className="w-4 h-4 text-detail-accent fill-detail-accent" />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Texto "AGENTE REGISTRADO" */}
          <motion.div
            className="mt-8 space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.h2
              className="font-display text-3xl tracking-[0.3em] text-primary"
              animate={{
                textShadow: [
                  '0 0 10px rgba(168, 85, 247, 0.5)',
                  '0 0 20px rgba(168, 85, 247, 0.8)',
                  '0 0 10px rgba(168, 85, 247, 0.5)',
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              AGENTE REGISTRADO
            </motion.h2>

            {/* Nome do personagem com efeito de digitação */}
            <AnimatePresence>
              {(phase === 'name' || phase === 'complete') && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-display text-foreground"
                >
                  {characterName}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Classe */}
            <AnimatePresence>
              {phase === 'complete' && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-muted-foreground"
                >
                  {characterClass} da Ordo Realitas
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Selo decorativo */}
          <motion.div
            className="absolute -bottom-4 -right-4 w-24 h-24 opacity-20"
            initial={{ rotate: -30, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            <div className="w-full h-full rounded-full border-4 border-primary flex items-center justify-center">
              <span className="font-display text-xs text-primary">ORDO REALITAS</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * CharacterCreationStepper - Stepper visual gamificado para criação de personagem
 * 
 * Suporta steps dinâmicos (ex: Rituais apenas para Ocultistas).
 * Inclui efeitos visuais de progresso, carimbo de verificação e tema por classe.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, User, Dices, MapPin, Sword, BookOpen, FileCheck, 
  BarChart3, Route, Sparkles, Crosshair, Medal, Stamp
} from '@/components/icons/ordem-icons';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Mapeamento de step.id para ícone
const STEP_ICON_MAP: Record<string, React.ElementType> = {
  concept: User,
  nex: BarChart3,
  patent: Medal,
  attributes: Dices,
  origin: MapPin,
  class: Sword,
  track: Route,
  rituals: Sparkles,
  skills: BookOpen,
  abilities: Crosshair,
  review: FileCheck,
};

// Cores temáticas por classe para gradiente
const CLASS_GRADIENT_COLORS: Record<string, { from: string; to: string; glow: string }> = {
  Combatente: { from: '#ef4444', to: '#f97316', glow: 'rgba(239, 68, 68, 0.3)' },
  Especialista: { from: '#3b82f6', to: '#06b6d4', glow: 'rgba(59, 130, 246, 0.3)' },
  Ocultista: { from: '#a855f7', to: '#ec4899', glow: 'rgba(168, 85, 247, 0.3)' },
};

interface StepDefinition {
  id: string;
  title: string;
}

interface CharacterCreationStepperProps {
  steps: StepDefinition[];
  currentStep: number;
  completedSteps: number[];
  onStepClick?: (step: number) => void;
  canNavigate?: (step: number) => boolean;
  /** Classe do personagem para tema de cores */
  characterClass?: string;
}

export function CharacterCreationStepper({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  canNavigate,
  characterClass,
}: CharacterCreationStepperProps) {
  // Calcular progresso
  const progress = (completedSteps.length / steps.length) * 100;
  const classColors = characterClass ? CLASS_GRADIENT_COLORS[characterClass] : null;

  return (
    <TooltipProvider>
      <div className="w-full space-y-4">
        {/* Badge de progresso do dossiê */}
        <motion.div 
          className="flex items-center justify-center gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={cn(
            'px-4 py-2 rounded-lg border',
            'bg-card/80 backdrop-blur-sm',
            'flex items-center gap-3',
            progress >= 100 && 'border-primary/50 bg-primary/5'
          )}>
            {/* Ícone de dossiê/stamp */}
            <div className="relative">
              {progress >= 100 ? (
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                >
                  <Stamp className="w-5 h-5 text-primary" />
                </motion.div>
              ) : (
                <FileCheck className="w-5 h-5 text-muted-foreground" />
              )}
            </div>

            {/* Texto de progresso */}
            <div className="flex items-center gap-2">
              <span className="font-display text-xs tracking-wider text-muted-foreground">
                DOSSIÊ
              </span>
              <motion.span
                key={completedSteps.length}
                className={cn(
                  'font-display text-sm',
                  progress >= 100 ? 'text-primary' : 'text-foreground'
                )}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                {completedSteps.length}/{steps.length}
              </motion.span>
            </div>

            {/* Mini barra de progresso */}
            <div className="w-20 h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: classColors 
                    ? `linear-gradient(90deg, ${classColors.from}, ${classColors.to})`
                    : 'hsl(var(--primary))',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.div>

        {/* Desktop view */}
        <div className="hidden md:flex justify-between items-center">
          {steps.map((step, index) => {
            const Icon = STEP_ICON_MAP[step.id] || BookOpen;
            const isCompleted = completedSteps.includes(index);
            const isCurrent = index === currentStep;
            const canClick = canNavigate ? canNavigate(index) : index <= Math.max(...completedSteps, currentStep);

            return (
              <div
                key={step.id}
                className={cn('flex items-center', index < steps.length - 1 && 'flex-1')}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={() => canClick && onStepClick?.(index)}
                      aria-label={`Etapa ${index + 1}: ${step.title}`}
                      aria-current={isCurrent ? 'step' : undefined}
                      disabled={!canClick}
                      className={cn(
                        'relative w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300',
                        'border-2 font-display text-sm',
                        isCompleted && 'bg-primary border-primary text-primary-foreground',
                        isCurrent && !isCompleted && 'bg-primary/20 border-primary text-primary',
                        !isCurrent && !isCompleted && 'bg-muted/50 border-muted text-muted-foreground',
                        canClick && !isCurrent && 'hover:border-primary/50 hover:bg-primary/10 cursor-pointer',
                        !canClick && 'opacity-50 cursor-not-allowed'
                      )}
                      whileHover={canClick ? { scale: 1.05 } : undefined}
                      whileTap={canClick ? { scale: 0.95 } : undefined}
                    >
                      <AnimatePresence mode="wait">
                        {isCompleted ? (
                          <motion.div
                            key="check"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                          >
                            <Check className="w-5 h-5" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="icon"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <Icon className="w-5 h-5" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {/* Pulso animado no step atual */}
                      {isCurrent && (
                        <motion.div
                          className="absolute inset-0 rounded-lg border-2 border-primary"
                          animate={{ 
                            opacity: [0.3, 1, 0.3],
                            scale: [1, 1.05, 1],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}

                      {/* Efeito de stamp quando completa */}
                      {isCompleted && (
                        <motion.div
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow-lg"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: 'spring', stiffness: 500 }}
                        >
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-card border">
                    <p className="font-display tracking-wider">{step.title}</p>
                    {isCompleted && (
                      <p className="text-xs text-primary flex items-center gap-1">
                        <Check className="w-3 h-3" /> Concluído
                      </p>
                    )}
                    {isCurrent && !isCompleted && (
                      <p className="text-xs text-muted-foreground">Etapa atual</p>
                    )}
                  </TooltipContent>
                </Tooltip>

                {/* Linha de conexão com gradiente */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-1 mx-3 rounded-full overflow-hidden bg-muted/30 relative">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: classColors && isCompleted
                          ? `linear-gradient(90deg, ${classColors.from}, ${classColors.to})`
                          : 'hsl(var(--primary))',
                      }}
                      initial={{ width: '0%' }}
                      animate={{ width: isCompleted ? '100%' : '0%' }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    />
                    {/* Shimmer effect na linha */}
                    {isCompleted && (
                      <motion.div
                        className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        initial={{ x: '-100%' }}
                        animate={{ x: '400%' }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile view - melhorado */}
        <div className="md:hidden">
          <div className="flex justify-center gap-1.5 mb-3 flex-wrap">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.includes(index);
              const isCurrent = index === currentStep;

              return (
                <motion.button
                  key={step.id}
                  aria-label={`Etapa ${index + 1}: ${step.title}`}
                  aria-current={isCurrent ? 'step' : undefined}
                  disabled={canNavigate ? !canNavigate(index) : false}
                  onClick={() => canNavigate?.(index) && onStepClick?.(index)}
                  className={cn(
                    'relative rounded-md transition-all min-w-11 min-h-11 border text-xs focus-visible:ring-2 focus-visible:ring-primary',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && !isCompleted && 'bg-primary/20 border-primary',
                    !isCurrent && !isCompleted && 'bg-muted'
                  )}
                  animate={isCurrent ? { 
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7],
                  } : undefined}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  whileTap={{ scale: 0.9 }}
                >{index + 1}</motion.button>
              );
            })}
          </div>
        </div>

        {/* Step title com animação */}
        <div className="text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <p className={cn(
                'font-display text-lg tracking-wider',
                classColors ? 'text-primary' : 'text-primary'
              )}>
                {steps[currentStep]?.title.toUpperCase()}
              </p>
              <p className="text-sm text-muted-foreground">
                Passo {currentStep + 1} de {steps.length}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Componente stepper visual para criação de personagem
// Suporta steps dinâmicos (ex: Rituais apenas para Ocultistas)

import { motion } from 'framer-motion';
import { 
  Check, User, Dices, MapPin, Sword, BookOpen, FileCheck, 
  BarChart3, Route, Sparkles, Crosshair 
} from 'lucide-react';
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
  attributes: Dices,
  origin: MapPin,
  class: Sword,
  track: Route,
  rituals: Sparkles,
  skills: BookOpen,
  abilities: Crosshair,
  review: FileCheck,
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
}

export function CharacterCreationStepper({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  canNavigate,
}: CharacterCreationStepperProps) {
  return (
    <TooltipProvider>
      <div className="w-full">
        {/* Desktop view */}
        <div className="hidden md:flex justify-between items-center mb-4">
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
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        >
                          <Check className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                      
                      {isCurrent && (
                        <motion.div
                          className="absolute inset-0 rounded-lg border-2 border-primary"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="font-display tracking-wider">{step.title}</p>
                    {isCompleted && <p className="text-xs text-muted-foreground">Concluído</p>}
                    {isCurrent && <p className="text-xs text-primary">Atual</p>}
                  </TooltipContent>
                </Tooltip>

                {index < steps.length - 1 && (
                  <div className="flex-1 h-1 mx-3 rounded-full overflow-hidden bg-muted/30">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: '0%' }}
                      animate={{ width: isCompleted ? '100%' : '0%' }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile view */}
        <div className="md:hidden">
          <div className="flex justify-center gap-2 mb-4 flex-wrap">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.includes(index);
              const isCurrent = index === currentStep;

              return (
                <motion.div
                  key={step.id}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    isCompleted && 'bg-primary',
                    isCurrent && !isCompleted && 'bg-primary/50 w-6',
                    !isCurrent && !isCompleted && 'bg-muted'
                  )}
                  animate={isCurrent ? { scale: [1, 1.2, 1] } : undefined}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              );
            })}
          </div>
        </div>

        {/* Step title */}
        <div className="text-center">
          <motion.p
            key={currentStep}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-lg tracking-wider text-primary"
          >
            {steps[currentStep]?.title.toUpperCase()}
          </motion.p>
          <p className="text-sm text-muted-foreground">
            Passo {currentStep + 1} de {steps.length}
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}

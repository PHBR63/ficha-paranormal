/**
 * Indicador visual de força de senha
 * Avalia complexidade e mostra barra de progresso colorida
 */
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

// Critérios de validação da senha
interface StrengthCriteria {
  label: string;
  met: boolean;
}

// Calcular força da senha (0-4)
function calculateStrength(password: string): {
  score: number;
  criteria: StrengthCriteria[];
} {
  const criteria: StrengthCriteria[] = [
    { label: 'Mínimo 6 caracteres', met: password.length >= 6 },
    { label: 'Letra maiúscula', met: /[A-Z]/.test(password) },
    { label: 'Letra minúscula', met: /[a-z]/.test(password) },
    { label: 'Número', met: /\d/.test(password) },
    { label: 'Caractere especial', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const score = criteria.filter(c => c.met).length;
  return { score, criteria };
}

// Configuração de níveis de força
const STRENGTH_CONFIG = {
  0: { label: 'Muito fraca', color: 'bg-destructive', textColor: 'text-destructive' },
  1: { label: 'Fraca', color: 'bg-destructive', textColor: 'text-destructive' },
  2: { label: 'Razoável', color: 'bg-amber-500', textColor: 'text-amber-500' },
  3: { label: 'Boa', color: 'bg-amber-400', textColor: 'text-amber-400' },
  4: { label: 'Forte', color: 'bg-emerald-500', textColor: 'text-emerald-500' },
  5: { label: 'Excelente', color: 'bg-emerald-400', textColor: 'text-emerald-400' },
} as const;

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const { score, criteria } = useMemo(() => calculateStrength(password), [password]);
  
  // Não mostrar se a senha estiver vazia
  if (!password) return null;

  const config = STRENGTH_CONFIG[score as keyof typeof STRENGTH_CONFIG];
  const percentage = (score / 5) * 100;

  return (
    <div className={cn('space-y-2 animate-fade-in', className)}>
      {/* Barra de força */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
            Força da senha
          </span>
          <span className={cn('text-[10px] font-mono uppercase tracking-wider', config.textColor)}>
            {config.label}
          </span>
        </div>
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              config.color
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Critérios detalhados */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {criteria.map((criterion, idx) => (
          <div
            key={idx}
            className={cn(
              'flex items-center gap-1.5 text-[10px] font-mono transition-colors',
              criterion.met ? 'text-emerald-400' : 'text-muted-foreground/60'
            )}
          >
            {criterion.met ? (
              <Check className="w-3 h-3 flex-shrink-0" />
            ) : (
              <X className="w-3 h-3 flex-shrink-0" />
            )}
            <span>{criterion.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

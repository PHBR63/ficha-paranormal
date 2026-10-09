/**
 * Indicador de Status de Salvamento
 * 
 * Exibe o estado atual do salvamento (salvando, salvo, erro)
 * com animações suaves e feedback visual.
 * 
 * @module components/ui/SaveStatusIndicator
 */

import React from 'react';
import { Check, Cloud, CloudOff, Loader2, AlertCircle } from '@/components/icons/ordem-icons';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

export interface SaveStatusIndicatorProps {
  /** Estado atual do salvamento */
  status: SaveStatus;
  /** Mensagem de erro (quando status é 'error') */
  errorMessage?: string;
  /** Timestamp do último salvamento bem-sucedido */
  lastSaved?: Date | null;
  /** Mostrar texto junto ao ícone */
  showLabel?: boolean;
  /** Tamanho do indicador */
  size?: 'sm' | 'md' | 'lg';
  /** Classes CSS adicionais */
  className?: string;
}

const STATUS_CONFIG = {
  idle: {
    icon: Cloud,
    label: 'Pronto',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
  },
  saving: {
    icon: Loader2,
    label: 'Salvando...',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    animate: 'animate-spin',
  },
  saved: {
    icon: Check,
    label: 'Salvo',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  error: {
    icon: AlertCircle,
    label: 'Erro ao salvar',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  offline: {
    icon: CloudOff,
    label: 'Offline',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
};

const SIZE_CONFIG = {
  sm: {
    icon: 'h-3 w-3',
    text: 'text-xs',
    padding: 'px-1.5 py-0.5',
    gap: 'gap-1',
  },
  md: {
    icon: 'h-4 w-4',
    text: 'text-sm',
    padding: 'px-2 py-1',
    gap: 'gap-1.5',
  },
  lg: {
    icon: 'h-5 w-5',
    text: 'text-base',
    padding: 'px-3 py-1.5',
    gap: 'gap-2',
  },
};

/**
 * Formata timestamp para exibição amigável
 */
function formatLastSaved(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 5) return 'Agora mesmo';
  if (diffSecs < 60) return `Há ${diffSecs} segundos`;
  if (diffMins < 60) return `Há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  if (diffHours < 24) return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Componente de indicador de status de salvamento
 */
export const SaveStatusIndicator = React.memo(function SaveStatusIndicator({
  status,
  errorMessage,
  lastSaved,
  showLabel = true,
  size = 'md',
  className,
}: SaveStatusIndicatorProps) {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  const tooltipContent = React.useMemo(() => {
    if (status === 'error' && errorMessage) {
      return errorMessage;
    }
    if (status === 'saved' && lastSaved) {
      return `Salvo ${formatLastSaved(lastSaved)}`;
    }
    if (status === 'offline') {
      return 'Você está offline. Alterações serão sincronizadas quando reconectar.';
    }
    return config.label;
  }, [status, errorMessage, lastSaved, config.label]);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center rounded-full transition-all duration-300',
              sizeConfig.padding,
              sizeConfig.gap,
              config.bgColor,
              className
            )}
            role="status"
            aria-live="polite"
            aria-label={config.label}
          >
            <Icon
              className={cn(
                sizeConfig.icon,
                config.color,
                'animate' in config && config.animate
              )}
            />
            {showLabel && (
              <span className={cn(sizeConfig.text, config.color, 'font-medium')}>
                {config.label}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

export default SaveStatusIndicator;

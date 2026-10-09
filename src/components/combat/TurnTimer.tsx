/**
 * TurnTimer - Componente visual do timer de turno
 * Combat 8: Sistema de turnos automáticos com timer e lembretes
 * 
 * Features:
 * - Display circular animado do tempo
 * - Cores que mudam conforme urgência (verde > amarelo > vermelho)
 * - Controles de play/pause/reset
 * - Configurações de duração e auto-avanço
 * - Modo compacto para mobile
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Timer,
  Plus,
  Volume2,
  VolumeX,
  FastForward,
  Clock,
} from '@/components/icons/ordem-icons';
import type { TurnTimerConfig, TurnTimerState } from '@/hooks/combat/useTurnTimer';

interface TurnTimerProps {
  /** Estado do timer */
  timerState: TurnTimerState;
  /** Configuração do timer */
  config: TurnTimerConfig;
  /** Tempo formatado (MM:SS) */
  formattedTime: string;
  /** Se está em alerta (< 15s) */
  isWarning: boolean;
  /** Se está crítico (< 5s) */
  isCritical: boolean;
  /** Nome do combatente atual */
  combatantName?: string;
  /** Callbacks */
  onStart: () => void;
  onStop: () => void;
  onTogglePause: () => void;
  onReset: () => void;
  onAddTime: (seconds: number) => void;
  onConfigChange: (config: Partial<TurnTimerConfig>) => void;
  /** Modo compacto */
  compact?: boolean;
  /** Classes extras */
  className?: string;
}

// Presets de duração
const DURATION_PRESETS = [
  { label: '30s', value: 30 },
  { label: '1min', value: 60 },
  { label: '2min', value: 120 },
  { label: '3min', value: 180 },
];

export function TurnTimer({
  timerState,
  config,
  formattedTime,
  isWarning,
  isCritical,
  combatantName = 'Turno',
  onStart,
  onStop,
  onTogglePause,
  onReset,
  onAddTime,
  onConfigChange,
  compact = false,
  className,
}: TurnTimerProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Cores baseadas no estado
  const getColorClasses = () => {
    if (!timerState.isRunning) return 'text-muted-foreground border-muted';
    if (isCritical) return 'text-destructive border-destructive animate-pulse';
    if (isWarning) return 'text-amber-500 border-amber-500';
    return 'text-emerald-500 border-emerald-500';
  };
  
  const getProgressColor = () => {
    if (!timerState.isRunning) return 'bg-muted';
    if (isCritical) return 'bg-destructive';
    if (isWarning) return 'bg-amber-500';
    return 'bg-emerald-500';
  };
  
  // Modo compacto (para mobile/sidebar)
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <TooltipProvider>
          {/* Timer Display */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md border transition-colors",
                getColorClasses()
              )}>
                <Timer className="w-3.5 h-3.5" />
                <span className="font-mono text-sm font-medium">{formattedTime}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Timer do turno de {combatantName}
            </TooltipContent>
          </Tooltip>
          
          {/* Controles */}
          <div className="flex items-center gap-1">
            {!timerState.isRunning ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" onClick={onStart} className="h-7 w-7">
                    <Play className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Iniciar timer</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={onTogglePause}
                    className="h-7 w-7"
                  >
                    {timerState.isPaused ? (
                      <Play className="w-3.5 h-3.5" />
                    ) : (
                      <Pause className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {timerState.isPaused ? 'Retomar' : 'Pausar'}
                </TooltipContent>
              </Tooltip>
            )}
            
            {timerState.isRunning && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => onAddTime(30)}
                    className="h-7 w-7"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>+30 segundos</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      </div>
    );
  }
  
  // Modo completo
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "p-4 rounded-lg border bg-card/50 backdrop-blur",
        timerState.isRunning && !timerState.isPaused && "ring-1",
        isCritical && "ring-destructive",
        isWarning && !isCritical && "ring-amber-500",
        !isWarning && !isCritical && timerState.isRunning && "ring-emerald-500/50",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className={cn("w-4 h-4", getColorClasses().split(' ')[0])} />
          <span className="text-sm font-medium">Timer de Turno</span>
          {config.autoAdvance && (
            <Badge variant="outline" className="text-xs">
              <FastForward className="w-3 h-3 mr-1" />
              Auto
            </Badge>
          )}
        </div>
        
        {/* Settings */}
        <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7">
              <Settings className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Configurações do Timer</h4>
              
              {/* Duração */}
              <div className="space-y-2">
                <Label className="text-xs">Duração do turno</Label>
                <div className="flex gap-1">
                  {DURATION_PRESETS.map(preset => (
                    <Button
                      key={preset.value}
                      size="sm"
                      variant={config.turnDuration === preset.value ? "default" : "outline"}
                      onClick={() => onConfigChange({ turnDuration: preset.value })}
                      className="flex-1 text-xs"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <Slider
                  value={[config.turnDuration]}
                  onValueChange={([value]) => onConfigChange({ turnDuration: value })}
                  min={15}
                  max={300}
                  step={15}
                  className="mt-2"
                />
                <span className="text-xs text-muted-foreground">
                  {Math.floor(config.turnDuration / 60)}:{(config.turnDuration % 60).toString().padStart(2, '0')}
                </span>
              </div>
              
              {/* Auto-avanço */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs">Avanço automático</Label>
                  <p className="text-xs text-muted-foreground">
                    Avançar turno quando expirar
                  </p>
                </div>
                <Switch
                  checked={config.autoAdvance}
                  onCheckedChange={(checked) => onConfigChange({ autoAdvance: checked })}
                />
              </div>
              
              {/* Som */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {config.soundEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-muted-foreground" />
                  )}
                  <Label className="text-xs">Alertas sonoros</Label>
                </div>
                <Switch
                  checked={config.soundEnabled}
                  onCheckedChange={(checked) => onConfigChange({ soundEnabled: checked })}
                />
              </div>
              
              {config.soundEnabled && (
                <div className="space-y-2">
                  <Label className="text-xs">Volume</Label>
                  <Slider
                    value={[config.soundVolume * 100]}
                    onValueChange={([value]) => onConfigChange({ soundVolume: value / 100 })}
                    min={10}
                    max={100}
                    step={10}
                  />
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Timer Display */}
      <div className="relative flex flex-col items-center justify-center py-4">
        {/* Circular Progress (SVG) */}
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted/30"
            />
            {/* Progress circle */}
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className={getProgressColor().replace('bg-', 'text-')}
              strokeDasharray={2 * Math.PI * 56}
              animate={{
                strokeDashoffset: 2 * Math.PI * 56 * (timerState.progressPercent / 100)
              }}
              transition={{ duration: 0.5, ease: "linear" }}
            />
          </svg>
          
          {/* Time Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              key={formattedTime}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className={cn(
                "font-mono text-3xl font-bold transition-colors",
                getColorClasses().split(' ')[0]
              )}
            >
              {formattedTime}
            </motion.span>
            {timerState.isPaused && (
              <Badge variant="secondary" className="mt-1 text-xs">
                Pausado
              </Badge>
            )}
          </div>
        </div>
        
        {/* Combatant Name */}
        <div className="mt-2 text-center">
          <span className="text-sm text-muted-foreground">Turno de</span>
          <p className="font-medium truncate max-w-[150px]">{combatantName}</p>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {!timerState.isRunning ? (
          <Button onClick={onStart} className="gap-2">
            <Play className="w-4 h-4" />
            Iniciar Timer
          </Button>
        ) : (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon"
                    variant="outline"
                    onClick={onReset}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reiniciar</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="lg"
                    variant={timerState.isPaused ? "default" : "secondary"}
                    onClick={onTogglePause}
                    className="gap-2 min-w-[100px]"
                  >
                    {timerState.isPaused ? (
                      <>
                        <Play className="w-4 h-4" />
                        Retomar
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4" />
                        Pausar
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {timerState.isPaused ? 'Retomar timer' : 'Pausar timer'}
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon"
                    variant="outline"
                    onClick={() => onAddTime(30)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>+30 segundos</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon"
                    variant="ghost"
                    onClick={onStop}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Timer className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Parar timer</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>
      
      {/* Alert Indicators */}
      <AnimatePresence>
        {timerState.isRunning && !timerState.isPaused && (isWarning || isCritical) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "mt-4 p-2 rounded-md text-center text-sm font-medium",
              isCritical 
                ? "bg-destructive/10 text-destructive" 
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            )}
          >
            {isCritical 
              ? '⚠️ Tempo quase esgotado!' 
              : '⏳ Menos de 15 segundos!'}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Componente compacto para uso inline
 */
export function TurnTimerInline({
  formattedTime,
  isRunning,
  isPaused,
  isWarning,
  isCritical,
  onTogglePause,
  className,
}: {
  formattedTime: string;
  isRunning: boolean;
  isPaused: boolean;
  isWarning: boolean;
  isCritical: boolean;
  onTogglePause: () => void;
  className?: string;
}) {
  const getColorClass = () => {
    if (!isRunning) return 'text-muted-foreground';
    if (isCritical) return 'text-destructive';
    if (isWarning) return 'text-amber-500';
    return 'text-emerald-500';
  };
  
  return (
    <button
      onClick={isRunning ? onTogglePause : undefined}
      className={cn(
        "inline-flex items-center gap-1 font-mono text-sm transition-colors",
        isRunning && "cursor-pointer hover:opacity-80",
        getColorClass(),
        isCritical && "animate-pulse",
        className
      )}
    >
      <Timer className="w-3.5 h-3.5" />
      {formattedTime}
      {isPaused && <span className="text-xs">(P)</span>}
    </button>
  );
}

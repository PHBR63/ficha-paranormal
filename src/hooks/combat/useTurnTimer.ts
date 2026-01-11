/**
 * useTurnTimer - Hook para gerenciar timer de turno automático
 * Combat 8: Sistema de turnos automáticos com timer e lembretes
 * 
 * Funcionalidades:
 * - Timer configurável por turno (padrão: 60 segundos)
 * - Alertas em intervalos (30s, 15s, 5s)
 * - Opção de avançar turno automaticamente quando timer expira
 * - Pausar/retomar timer
 * - Callbacks para notificações
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Intervalos de alerta padrão (em segundos restantes)
const DEFAULT_ALERT_INTERVALS = [30, 15, 5];

export interface TurnTimerConfig {
  /** Duração do turno em segundos (padrão: 60) */
  turnDuration: number;
  /** Se deve avançar turno automaticamente quando expirar */
  autoAdvance: boolean;
  /** Intervalos de alerta em segundos restantes */
  alertIntervals: number[];
  /** Som de alerta ativado */
  soundEnabled: boolean;
  /** Volume do som (0-1) */
  soundVolume: number;
}

export interface TurnTimerState {
  /** Se o timer está ativo */
  isRunning: boolean;
  /** Se o timer está pausado */
  isPaused: boolean;
  /** Tempo restante em segundos */
  timeRemaining: number;
  /** Porcentagem do tempo decorrido (0-100) */
  progressPercent: number;
  /** Último alerta disparado */
  lastAlert: number | null;
}

interface UseTurnTimerProps {
  /** Se o combate está ativo */
  isActive: boolean;
  /** Índice do turno atual (muda quando turno avança) */
  currentTurnIndex: number;
  /** ID do combatente atual */
  currentCombatantId?: string;
  /** Nome do combatente atual */
  currentCombatantName?: string;
  /** Rodada atual */
  currentRound: number;
  /** Callback quando timer expira */
  onTimerExpire?: () => void;
  /** Callback quando alerta é disparado */
  onAlert?: (secondsRemaining: number, combatantName: string) => void;
  /** Configuração inicial */
  initialConfig?: Partial<TurnTimerConfig>;
}

interface UseTurnTimerReturn {
  /** Estado atual do timer */
  timerState: TurnTimerState;
  /** Configuração do timer */
  config: TurnTimerConfig;
  /** Inicia o timer */
  startTimer: () => void;
  /** Para o timer */
  stopTimer: () => void;
  /** Pausa/retoma o timer */
  togglePause: () => void;
  /** Reinicia o timer para o turno atual */
  resetTimer: () => void;
  /** Atualiza configuração */
  updateConfig: (newConfig: Partial<TurnTimerConfig>) => void;
  /** Adiciona tempo extra */
  addTime: (seconds: number) => void;
  /** String formatada do tempo (MM:SS) */
  formattedTime: string;
  /** Se está em alerta (< 15s) */
  isWarning: boolean;
  /** Se está crítico (< 5s) */
  isCritical: boolean;
}

const DEFAULT_CONFIG: TurnTimerConfig = {
  turnDuration: 60,
  autoAdvance: false,
  alertIntervals: DEFAULT_ALERT_INTERVALS,
  soundEnabled: true,
  soundVolume: 0.5,
};

/**
 * Formata segundos em MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Toca um beep de alerta usando Web Audio API
 */
function playAlertSound(volume: number, frequency: number = 440) {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;
    
    oscillator.start();
    
    // Fade out
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.warn('[TurnTimer] Erro ao tocar som:', e);
  }
}

export function useTurnTimer({
  isActive,
  currentTurnIndex,
  currentCombatantId,
  currentCombatantName = 'Combatente',
  currentRound,
  onTimerExpire,
  onAlert,
  initialConfig = {},
}: UseTurnTimerProps): UseTurnTimerReturn {
  
  const [config, setConfig] = useState<TurnTimerConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });
  
  const [timerState, setTimerState] = useState<TurnTimerState>({
    isRunning: false,
    isPaused: false,
    timeRemaining: config.turnDuration,
    progressPercent: 0,
    lastAlert: null,
  });
  
  // Refs para callbacks estáveis
  const onTimerExpireRef = useRef(onTimerExpire);
  const onAlertRef = useRef(onAlert);
  const configRef = useRef(config);
  const currentCombatantNameRef = useRef(currentCombatantName);
  
  // Atualiza refs quando mudam
  useEffect(() => { onTimerExpireRef.current = onTimerExpire; }, [onTimerExpire]);
  useEffect(() => { onAlertRef.current = onAlert; }, [onAlert]);
  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => { currentCombatantNameRef.current = currentCombatantName; }, [currentCombatantName]);
  
  // Intervalo do timer
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Limpa intervalo
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  
  // Inicia o timer
  const startTimer = useCallback(() => {
    clearTimer();
    
    setTimerState({
      isRunning: true,
      isPaused: false,
      timeRemaining: configRef.current.turnDuration,
      progressPercent: 0,
      lastAlert: null,
    });
    
    intervalRef.current = setInterval(() => {
      setTimerState(prev => {
        if (prev.isPaused || !prev.isRunning) return prev;
        
        const newTime = prev.timeRemaining - 1;
        const progress = ((configRef.current.turnDuration - newTime) / configRef.current.turnDuration) * 100;
        
        // Verifica se precisa disparar alerta
        const shouldAlert = configRef.current.alertIntervals.includes(newTime) && prev.lastAlert !== newTime;
        
        if (shouldAlert) {
          // Toca som
          if (configRef.current.soundEnabled) {
            const frequency = newTime <= 5 ? 880 : newTime <= 15 ? 660 : 440;
            playAlertSound(configRef.current.soundVolume, frequency);
          }
          
          // Callback
          onAlertRef.current?.(newTime, currentCombatantNameRef.current);
        }
        
        // Timer expirou
        if (newTime <= 0) {
          clearTimer();
          
          // Som de expiração
          if (configRef.current.soundEnabled) {
            playAlertSound(configRef.current.soundVolume * 1.5, 220);
            setTimeout(() => playAlertSound(configRef.current.soundVolume * 1.5, 220), 200);
          }
          
          // Callback de expiração
          if (configRef.current.autoAdvance) {
            onTimerExpireRef.current?.();
          }
          
          return {
            ...prev,
            isRunning: false,
            timeRemaining: 0,
            progressPercent: 100,
            lastAlert: 0,
          };
        }
        
        return {
          ...prev,
          timeRemaining: newTime,
          progressPercent: progress,
          lastAlert: shouldAlert ? newTime : prev.lastAlert,
        };
      });
    }, 1000);
  }, [clearTimer]);
  
  // Para o timer
  const stopTimer = useCallback(() => {
    clearTimer();
    setTimerState({
      isRunning: false,
      isPaused: false,
      timeRemaining: config.turnDuration,
      progressPercent: 0,
      lastAlert: null,
    });
  }, [clearTimer, config.turnDuration]);
  
  // Pausa/retoma
  const togglePause = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  }, []);
  
  // Reinicia para turno atual
  const resetTimer = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      timeRemaining: config.turnDuration,
      progressPercent: 0,
      lastAlert: null,
    }));
  }, [config.turnDuration]);
  
  // Atualiza configuração
  const updateConfig = useCallback((newConfig: Partial<TurnTimerConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      // Se mudou duração, atualiza tempo restante se não estiver rodando
      if (newConfig.turnDuration && !timerState.isRunning) {
        setTimerState(s => ({
          ...s,
          timeRemaining: updated.turnDuration,
        }));
      }
      return updated;
    });
  }, [timerState.isRunning]);
  
  // Adiciona tempo extra
  const addTime = useCallback((seconds: number) => {
    setTimerState(prev => ({
      ...prev,
      timeRemaining: prev.timeRemaining + seconds,
      progressPercent: Math.max(0, ((config.turnDuration - (prev.timeRemaining + seconds)) / config.turnDuration) * 100),
    }));
  }, [config.turnDuration]);
  
  // Reinicia timer quando turno muda
  useEffect(() => {
    if (isActive && timerState.isRunning) {
      startTimer();
    }
  }, [currentTurnIndex, currentRound]);
  
  // Para timer quando combate termina
  useEffect(() => {
    if (!isActive) {
      stopTimer();
    }
  }, [isActive, stopTimer]);
  
  // Cleanup
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);
  
  // Valores computados
  const formattedTime = formatTime(timerState.timeRemaining);
  const isWarning = timerState.timeRemaining <= 15 && timerState.timeRemaining > 5;
  const isCritical = timerState.timeRemaining <= 5;
  
  return {
    timerState,
    config,
    startTimer,
    stopTimer,
    togglePause,
    resetTimer,
    updateConfig,
    addTime,
    formattedTime,
    isWarning,
    isCritical,
  };
}

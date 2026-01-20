/**
 * useCombatFeedback - Hook para feedback sonoro e háptico em combate
 * Fornece sons e vibrações diferenciadas para acerto, erro e crítico
 */

import { useCallback, useRef, useMemo } from 'react';

// Tipos de feedback disponíveis
export type CombatFeedbackType = 'hit' | 'miss' | 'critical' | 'fumble' | 'damage' | 'roll';

// Configuração de vibração por tipo (padrões em ms)
const VIBRATION_PATTERNS: Record<CombatFeedbackType, number | number[]> = {
  hit: [50, 30, 50],           // Dois pulsos curtos - acertou!
  miss: [100],                  // Um pulso longo - errou
  critical: [30, 20, 30, 20, 80], // Padrão crescente - CRÍTICO!
  fumble: [200, 50, 200],       // Pulso duplo forte - falha crítica
  damage: [40, 20, 40],         // Similar ao hit, para dano
  roll: [15],                   // Pulso mínimo - rolagem de dados
};

// Frequências de som por tipo (Hz)
const SOUND_CONFIG: Record<CombatFeedbackType, { 
  frequency: number; 
  duration: number; 
  type: OscillatorType;
  volume: number;
  ramp?: boolean;
}> = {
  hit: { frequency: 880, duration: 100, type: 'sine', volume: 0.3 },       // A5 - som agudo positivo
  miss: { frequency: 220, duration: 200, type: 'triangle', volume: 0.2 }, // A3 - som grave negativo
  critical: { frequency: 1320, duration: 150, type: 'sine', volume: 0.4, ramp: true }, // E6 - som muito agudo
  fumble: { frequency: 110, duration: 300, type: 'sawtooth', volume: 0.25 }, // A2 - som muito grave
  damage: { frequency: 660, duration: 80, type: 'sine', volume: 0.25 },   // E5 - som médio
  roll: { frequency: 440, duration: 50, type: 'sine', volume: 0.15 },     // A4 - som curto neutro
};

interface UseCombatFeedbackOptions {
  /** Habilita/desabilita sons (default: true) */
  soundEnabled?: boolean;
  /** Habilita/desabilita vibração (default: true) */
  vibrationEnabled?: boolean;
  /** Volume geral (0-1, default: 0.3) */
  volume?: number;
}

interface CombatFeedbackResult {
  /** Dispara feedback para um tipo específico */
  trigger: (type: CombatFeedbackType) => void;
  /** Dispara feedback de acerto */
  triggerHit: () => void;
  /** Dispara feedback de erro */
  triggerMiss: () => void;
  /** Dispara feedback de crítico */
  triggerCritical: () => void;
  /** Dispara feedback de falha crítica */
  triggerFumble: () => void;
  /** Dispara feedback de dano */
  triggerDamage: () => void;
  /** Dispara feedback de rolagem */
  triggerRoll: () => void;
  /** Para todos os sons ativos */
  stopAll: () => void;
}

/**
 * Hook para fornecer feedback sonoro e háptico durante combate
 * Usa Web Audio API para sons e Vibration API para feedback tátil
 */
export function useCombatFeedback(options: UseCombatFeedbackOptions = {}): CombatFeedbackResult {
  const {
    soundEnabled = true,
    vibrationEnabled = true,
    volume = 0.3,
  } = options;

  // Contexto de áudio (lazy initialization)
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeOscillatorsRef = useRef<Set<OscillatorNode>>(new Set());

  // Inicializa contexto de áudio quando necessário
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API não suportada:', e);
        return null;
      }
    }
    
    // Resume se suspenso (necessário em alguns navegadores)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    return audioContextRef.current;
  }, []);

  // Reproduz som baseado no tipo
  const playSound = useCallback((type: CombatFeedbackType) => {
    if (!soundEnabled) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const config = SOUND_CONFIG[type];
    const now = ctx.currentTime;

    try {
      // Cria oscilador
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, now);

      // Volume com fade out suave
      const effectiveVolume = config.volume * volume;
      gainNode.gain.setValueAtTime(effectiveVolume, now);
      
      if (config.ramp) {
        // Efeito de "subida" para crítico
        oscillator.frequency.setValueAtTime(config.frequency * 0.5, now);
        oscillator.frequency.exponentialRampToValueAtTime(config.frequency * 1.5, now + config.duration / 1000);
      }
      
      // Fade out suave no final
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + config.duration / 1000);

      // Conecta e reproduz
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(now);
      oscillator.stop(now + config.duration / 1000);

      // Rastreia oscilador ativo
      activeOscillatorsRef.current.add(oscillator);
      oscillator.onended = () => {
        activeOscillatorsRef.current.delete(oscillator);
      };
    } catch (e) {
      console.warn('Erro ao reproduzir som:', e);
    }
  }, [soundEnabled, volume, getAudioContext]);

  // Dispara vibração baseada no tipo
  const vibrate = useCallback((type: CombatFeedbackType) => {
    if (!vibrationEnabled) return;
    if (!('vibrate' in navigator)) return;

    try {
      const pattern = VIBRATION_PATTERNS[type];
      navigator.vibrate(pattern);
    } catch (e) {
      // Silently fail - vibração pode não ser suportada
    }
  }, [vibrationEnabled]);

  // Função principal de trigger
  const trigger = useCallback((type: CombatFeedbackType) => {
    playSound(type);
    vibrate(type);
  }, [playSound, vibrate]);

  // Para todos os sons
  const stopAll = useCallback(() => {
    activeOscillatorsRef.current.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Pode já ter parado
      }
    });
    activeOscillatorsRef.current.clear();
    
    // Para vibração também
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  }, []);

  // Atalhos convenientes
  const shortcuts = useMemo(() => ({
    triggerHit: () => trigger('hit'),
    triggerMiss: () => trigger('miss'),
    triggerCritical: () => trigger('critical'),
    triggerFumble: () => trigger('fumble'),
    triggerDamage: () => trigger('damage'),
    triggerRoll: () => trigger('roll'),
  }), [trigger]);

  return {
    trigger,
    stopAll,
    ...shortcuts,
  };
}

export default useCombatFeedback;

/**
 * Constantes de configuração visual para o SUEDebugPanel
 * 
 * Define cores, ícones e labels para fontes e categorias de efeitos.
 * Usa cores semânticas consistentes com o design system.
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import {
  Sword,
  Shield,
  Heart,
  Target,
  User,
  Sparkles,
  AlertTriangle,
  Flame,
  BookOpen,
  Activity,
  Footprints,
  Brain,
} from '@/components/icons/ordem-icons';

import type { SourceType } from './sue-debug-types';

/**
 * Configuração visual para cada tipo de fonte de efeito
 */
export const SOURCE_CONFIG: Record<SourceType, { 
  label: string; 
  icon: React.ElementType; 
  color: string;
  bgColor: string;
}> = {
  origin: { 
    label: 'Origem', 
    icon: User, 
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
  },
  track: { 
    label: 'Trilha', 
    icon: Target, 
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
  },
  condition: { 
    label: 'Condição', 
    icon: AlertTriangle, 
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
  ritual: { 
    label: 'Ritual', 
    icon: Sparkles, 
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
  },
  paranormal_power: { 
    label: 'Poder Paranormal', 
    icon: Flame, 
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
  },
  class_power: { 
    label: 'Poder de Classe', 
    icon: Sword, 
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
};

/**
 * Configuração visual para categorias de efeitos computados
 */
export const CATEGORY_CONFIG = {
  combat: { label: 'Combate', icon: Sword, color: 'text-rose-400' },
  defense: { label: 'Defesa', icon: Shield, color: 'text-sky-400' },
  resources: { label: 'Recursos', icon: Heart, color: 'text-pink-400' },
  skills: { label: 'Perícias', icon: BookOpen, color: 'text-cyan-400' },
  movement: { label: 'Movimento', icon: Footprints, color: 'text-emerald-400' },
  special: { label: 'Especial', icon: Sparkles, color: 'text-violet-400' },
  advanced: { label: 'Avançado', icon: Activity, color: 'text-amber-400' },
  occultist: { label: 'Ocultista', icon: Brain, color: 'text-violet-400' },
} as const;

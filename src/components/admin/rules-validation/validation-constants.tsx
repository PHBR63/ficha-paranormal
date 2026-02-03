/**
 * Constantes visuais para o RulesValidationPanel
 * 
 * Define ícones e cores para cada categoria de validação.
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import {
  Sparkles,
  Shield,
  Flame,
  Zap,
  Users,
  Star,
  Swords,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';

/**
 * Ícones por categoria de validação
 * Usa cores semânticas consistentes com o design system
 */
export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Rituais': <Sparkles className="w-4 h-4" />,
  'Rituais Detalhados': <Sparkles className="w-4 h-4 text-violet-500" />,
  'Rituais - Custos PE': <Sparkles className="w-4 h-4 text-sky-500" />,
  'Rituais - Resistências': <Shield className="w-4 h-4 text-amber-500" />,
  'Rituais - Aprimoramentos': <Sparkles className="w-4 h-4 text-emerald-500" />,
  'Rituais - Custos Aprimoramentos': <Sparkles className="w-4 h-4 text-cyan-500" />,
  'Rituais - Círculos': <Sparkles className="w-4 h-4 text-rose-500" />,
  'Rituais - Elementos': <Flame className="w-4 h-4 text-amber-500" />,
  'Condições': <AlertTriangle className="w-4 h-4" />,
  'Modificadores': <Shield className="w-4 h-4" />,
  'Tipos de Dano': <Flame className="w-4 h-4" />,
  'Poderes Paranormais': <Zap className="w-4 h-4" />,
  'Origens': <Users className="w-4 h-4" />,
  'Classes': <Star className="w-4 h-4" />,
  'Trilhas': <Swords className="w-4 h-4" />,
  'Poderes de Classe': <Shield className="w-4 h-4 text-primary" />,
};

/**
 * Retorna o ícone padrão se a categoria não tiver um mapeamento
 */
export function getCategoryIcon(category: string): React.ReactNode {
  return CATEGORY_ICONS[category] || <BookOpen className="w-4 h-4" />;
}

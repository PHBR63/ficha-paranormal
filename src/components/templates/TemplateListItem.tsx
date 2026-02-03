/**
 * Item de Lista Compacta para Templates
 * Versão condensada do TemplateCard para visualização em lista
 * 
 * @module components/templates/TemplateListItem
 */

import { motion } from 'framer-motion';
import { Crown, Star, Users, Play, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CharacterTemplate, TemplateWithAuthor } from '@/types/templates';

// Mapeia classes para ícones/cores
const CLASS_CONFIG: Record<string, { color: string; label: string }> = {
  combatente: { color: 'text-red-400', label: 'Combatente' },
  especialista: { color: 'text-blue-400', label: 'Especialista' },
  ocultista: { color: 'text-purple-400', label: 'Ocultista' },
};

// Mapeia dificuldade para cores
const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

interface TemplateListItemProps {
  /** Dados do template */
  template: CharacterTemplate | TemplateWithAuthor;
  /** Callback ao visualizar detalhes */
  onView: (template: CharacterTemplate | TemplateWithAuthor) => void;
  /** Callback ao aplicar template */
  onApply: (template: CharacterTemplate | TemplateWithAuthor) => void;
  /** Se está aplicando o template */
  isApplying?: boolean;
}

export function TemplateListItem({
  template,
  onView,
  onApply,
  isApplying,
}: TemplateListItemProps) {
  const templateData = template.template_data as any;
  const characterClass = templateData?.class?.toLowerCase() || '';
  const classConfig = CLASS_CONFIG[characterClass] || { color: 'text-muted-foreground', label: characterClass };
  const difficulty = template.difficulty_level || 'intermediate';

  // Verifica se tem autor (TemplateWithAuthor)
  const hasAuthor = 'author' in template && template.author;
  const authorName = hasAuthor ? (template as TemplateWithAuthor).author?.display_name || 'Anônimo' : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={cn(
        'group flex items-center gap-4 p-3 rounded-lg border transition-all duration-200',
        'bg-card/50 border-border/50 hover:bg-card hover:border-border',
        'hover:shadow-sm'
      )}
    >
      {/* Ícone/Badge da Classe */}
      <div className={cn(
        'shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
        'bg-muted/50 border border-border/50'
      )}>
        <span className={cn('text-lg font-bold', classConfig.color)}>
          {classConfig.label.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Informações Principais */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {/* Nome */}
          <h3 className="font-medium text-sm text-foreground truncate">
            {template.name}
          </h3>
          
          {/* Badges */}
          {template.is_official && (
            <Crown className="w-3.5 h-3.5 text-primary shrink-0" />
          )}
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className={classConfig.color}>{classConfig.label}</span>
          <span>NEX {template.min_nex}–{template.max_nex}%</span>
          {template.rating && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-primary fill-primary" />
              {template.rating.toFixed(1)}
            </span>
          )}
          {template.usage_count > 0 && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {template.usage_count}
            </span>
          )}
          {authorName && (
            <span className="truncate">por {authorName}</span>
          )}
        </div>
      </div>

      {/* Dificuldade */}
      <Badge 
        variant="outline" 
        className={cn('shrink-0 text-[10px] px-2 py-0.5', DIFFICULTY_COLORS[difficulty])}
      >
        {DIFFICULTY_LABELS[difficulty] || difficulty}
      </Badge>

      {/* Ações */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(template)}
          className="h-8 w-8 p-0"
          title="Ver detalhes"
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => onApply(template)}
          disabled={isApplying}
          className="h-8 gap-1.5 px-3"
        >
          <Play className="w-3.5 h-3.5" />
          Usar
        </Button>
      </div>
    </motion.div>
  );
}

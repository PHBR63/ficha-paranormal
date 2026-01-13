/**
 * Card de Template
 * Exibe informações resumidas de um template de personagem
 * 
 * @module components/templates/TemplateCard
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Eye, Zap, Users, Crown, Swords, Brain, Skull, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TemplateRatingStars } from './TemplateRatingStars';
import type { CharacterTemplate, TemplateWithAuthor } from '@/types/templates';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/types/templates';

interface TemplateCardProps {
  /** Dados do template */
  template: CharacterTemplate | TemplateWithAuthor;
  /** Callback ao clicar em "Ver" */
  onView: (template: CharacterTemplate | TemplateWithAuthor) => void;
  /** Callback ao clicar em "Aplicar" */
  onApply: (template: CharacterTemplate | TemplateWithAuthor) => void;
  /** Se está carregando aplicação */
  isApplying?: boolean;
  /** Variante de exibição */
  variant?: 'default' | 'compact';
  /** Classes adicionais */
  className?: string;
}

// Ícones por classe
const CLASS_ICONS: Record<string, React.ElementType> = {
  combatente: Swords,
  especialista: Brain,
  ocultista: Skull,
};

// Cores por classe
const CLASS_COLORS: Record<string, string> = {
  combatente: 'text-red-500 bg-red-500/10 border-red-500/30',
  especialista: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  ocultista: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
};

export const TemplateCard = memo(function TemplateCard({
  template,
  onView,
  onApply,
  isApplying = false,
  variant = 'default',
  className,
}: TemplateCardProps) {
  const { template_data: data } = template;
  const classId = data.classId?.toLowerCase() || 'combatente';
  const ClassIcon = CLASS_ICONS[classId] || Shield;
  const classColor = CLASS_COLORS[classId] || CLASS_COLORS.combatente;

  // Autor (se disponível)
  const author = 'author' in template ? template.author : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={cn(
          'group relative overflow-hidden transition-all duration-300',
          'hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30',
          'bg-card/50 backdrop-blur-sm',
          className
        )}
      >
        {/* Badge Oficial */}
        {template.is_official && (
          <div className="absolute top-2 right-2 z-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-semibold gap-1"
                >
                  <Crown className="w-3 h-3" />
                  OFICIAL
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                Template oficial do sistema
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        <CardContent className={cn('p-4', variant === 'compact' && 'p-3')}>
          {/* Cabeçalho */}
          <div className="flex items-start gap-3 mb-3">
            {/* Ícone da classe */}
            <div className={cn(
              'p-2 rounded-lg border',
              classColor
            )}>
              <ClassIcon className="w-5 h-5" />
            </div>

            {/* Nome e classe/trilha */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {template.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {data.classId}
                {data.classTrack && ` • ${data.classTrack}`}
              </p>
            </div>
          </div>

          {/* Descrição */}
          {template.description && variant !== 'compact' && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {template.description}
            </p>
          )}

          {/* Badges de info */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {/* Dificuldade */}
            {template.difficulty_level && (
              <Badge 
                variant="outline" 
                className={cn('text-xs', DIFFICULTY_COLORS[template.difficulty_level])}
              >
                {DIFFICULTY_LABELS[template.difficulty_level]}
              </Badge>
            )}

            {/* NEX Range */}
            <Badge variant="outline" className="text-xs">
              NEX {template.min_nex}%{template.max_nex < 99 ? ` - ${template.max_nex}%` : '+'}
            </Badge>

            {/* Origem */}
            {data.origin && (
              <Badge variant="outline" className="text-xs">
                {data.origin}
              </Badge>
            )}
          </div>

          {/* Tags */}
          {template.tags && template.tags.length > 0 && variant !== 'compact' && (
            <div className="flex flex-wrap gap-1 mb-3">
              {template.tags.slice(0, 3).map(tag => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="text-xs bg-secondary/50"
                >
                  {tag}
                </Badge>
              ))}
              {template.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-secondary/50">
                  +{template.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Métricas */}
          <div className="flex items-center justify-between mb-3">
            {/* Rating */}
            <TemplateRatingStars
              rating={template.rating}
              ratingCount={template.rating_count}
              size="sm"
              showCount={true}
            />

            {/* Uso */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              {template.usage_count}
            </div>
          </div>

          {/* Autor */}
          {author && variant !== 'compact' && (
            <div className="text-xs text-muted-foreground mb-3">
              por <span className="font-medium">{author.display_name || 'Anônimo'}</span>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(template)}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-1" />
              Ver
            </Button>
            <Button
              size="sm"
              onClick={() => onApply(template)}
              disabled={isApplying}
              className="flex-1"
            >
              <Zap className="w-4 h-4 mr-1" />
              {isApplying ? 'Aplicando...' : 'Aplicar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

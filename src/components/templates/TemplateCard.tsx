/**
 * Card de Template
 * Exibe informações detalhadas de um template de personagem
 * 
 * @module components/templates/TemplateCard
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, Zap, Users, Crown, Swords, Brain, Skull, Shield,
  BookOpen, Sparkles, Backpack
} from '@/components/icons/ordem-icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { TemplateRatingStars } from './TemplateRatingStars';
import type { CharacterTemplate, TemplateWithAuthor } from '@/types/templates';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/types/templates';
import {
  getOriginDisplayName,
  getClassDisplayName,
  getTrackDisplayName,
  getSkillDisplayName,
  getAttributeAbbreviation,
  getAttributeHighlightClass,
  getElementDisplayName,
  getElementColorClass,
  formatSkillsList,
} from '@/lib/template-display-helpers';

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

// Ordem dos atributos para exibição
const ATTRIBUTE_ORDER = ['strength', 'agility', 'vigor', 'intellect', 'presence'] as const;

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

  // Extrair atributos do template
  const attributes = data.attributes || {};

  // Extrair perícias treinadas
  const trainedSkills = data.trainedSkills || [];
  const { visible: visibleSkills, remaining: remainingSkills } = formatSkillsList(trainedSkills, 5);

  // Extrair poderes de classe
  const classPowers = data.classPowers || [];

  // Afinidade elemental (para Ocultistas)
  const elementalAffinity = data.elementalAffinity;

  // Rituais iniciais (para Ocultistas)
  const rituals = data.initialRituals || [];

  // Equipamentos sugeridos
  const equipment = data.equipment;
  const hasEquipment = equipment && (equipment.weapons?.length || equipment.armor || equipment.items?.length);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="h-full"
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
              'p-2 rounded-lg border shrink-0',
              classColor
            )}>
              <ClassIcon className="w-5 h-5" />
            </div>

            {/* Nome e classe/trilha */}
            <div className="flex-1 min-w-0 pr-16">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {template.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {getClassDisplayName(data.classId || '')}
                {data.classTrack && ` • ${getTrackDisplayName(data.classTrack)}`}
              </p>
            </div>
          </div>

          {/* Descrição */}
          {template.description && variant !== 'compact' && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {template.description}
            </p>
          )}

          {/* Seção de Atributos */}
          <div className="mb-3">
            <div className="grid grid-cols-5 gap-1">
              {ATTRIBUTE_ORDER.map(attr => {
                const value = attributes[attr] ?? 1;
                return (
                  <Tooltip key={attr}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'flex flex-col items-center py-1.5 px-1 rounded border text-center',
                          getAttributeHighlightClass(attr, value, 3)
                        )}
                      >
                        <span className="text-[10px] font-medium opacity-80">
                          {getAttributeAbbreviation(attr)}
                        </span>
                        <span className="text-sm font-bold">
                          {value}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {attr === 'strength' && 'Força'}
                      {attr === 'agility' && 'Agilidade'}
                      {attr === 'vigor' && 'Vigor'}
                      {attr === 'intellect' && 'Intelecto'}
                      {attr === 'presence' && 'Presença'}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>

          {/* Perícias Treinadas */}
          {visibleSkills.length > 0 && variant !== 'compact' && (
            <div className="mb-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Perícias</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {visibleSkills.join(', ')}
                {remainingSkills > 0 && (
                  <span className="text-muted-foreground"> +{remainingSkills}</span>
                )}
              </p>
            </div>
          )}

          {/* Poderes de Classe e Afinidade */}
          {(classPowers.length > 0 || elementalAffinity) && variant !== 'compact' && (
            <div className="mb-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Poderes</span>
              </div>
              
              {/* Afinidade Elemental */}
              {elementalAffinity && (
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs text-muted-foreground">Afinidade:</span>
                  <span className={cn('text-xs font-medium', getElementColorClass(elementalAffinity))}>
                    {getElementDisplayName(elementalAffinity)}
                  </span>
                </div>
              )}
              
              {/* Poderes de Classe */}
              {classPowers.length > 0 && (
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {classPowers.slice(0, 3).map(p => p.powerId).join(', ')}
                  {classPowers.length > 3 && (
                    <span className="text-muted-foreground"> +{classPowers.length - 3}</span>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Rituais (para Ocultistas) */}
          {rituals.length > 0 && classId === 'ocultista' && variant !== 'compact' && (
            <div className="mb-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Skull className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-medium text-muted-foreground">Rituais</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {rituals.slice(0, 3).join(', ')}
                {rituals.length > 3 && (
                  <span className="text-muted-foreground"> +{rituals.length - 3}</span>
                )}
              </p>
            </div>
          )}

          {/* Equipamento Sugerido */}
          {hasEquipment && variant !== 'compact' && (
            <div className="mb-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Backpack className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Equipamento</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {equipment?.weapons?.slice(0, 2).map((w, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] py-0">
                    🗡️ {w.id}
                  </Badge>
                ))}
                {equipment?.armor && (
                  <Badge variant="outline" className="text-[10px] py-0">
                    🛡️ {equipment.armor}
                  </Badge>
                )}
              </div>
            </div>
          )}

          <Separator className="my-3" />

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
                {getOriginDisplayName(data.origin)}
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

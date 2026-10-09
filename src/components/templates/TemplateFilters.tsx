/**
 * Componente de Filtros para Templates
 * Permite filtrar templates por classe, trilha, dificuldade, tags, etc.
 * 
 * @module components/templates/TemplateFilters
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Search, ChevronDown } from '@/components/icons/ordem-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { CLASS_IDS } from '@/lib/constants/game-ids';
import {
  TemplateFilters as TemplateFiltersType,
  TemplateDifficulty,
  DIFFICULTY_LABELS,
  ALL_TEMPLATE_TAGS,
  TemplateTag,
  TemplateSortOption,
} from '@/types/templates';

interface TemplateFiltersProps {
  /** Filtros atuais */
  filters: TemplateFiltersType;
  /** Callback para atualizar um filtro */
  onFilterChange: <K extends keyof TemplateFiltersType>(
    key: K,
    value: TemplateFiltersType[K]
  ) => void;
  /** Callback para limpar todos os filtros */
  onClearFilters: () => void;
  /** Se há filtros ativos */
  hasActiveFilters: boolean;
  /** Se está colapsável (mobile) */
  collapsible?: boolean;
  /** Classes adicionais */
  className?: string;
}

// Mapeamento de classes para exibição
const CLASS_OPTIONS = Object.entries(CLASS_IDS).map(([key, value]) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

// Opções de ordenação
const SORT_OPTIONS: { value: TemplateSortOption; label: string }[] = [
  { value: 'rating', label: 'Melhor avaliados' },
  { value: 'usage_count', label: 'Mais usados' },
  { value: 'created_at', label: 'Mais recentes' },
  { value: 'name', label: 'Nome (A-Z)' },
];

export function TemplateFiltersComponent({
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  collapsible = false,
  className,
}: TemplateFiltersProps) {
  // Conta filtros ativos para badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.classId) count++;
    if (filters.difficulty) count++;
    if (filters.tags && filters.tags.length > 0) count += filters.tags.length;
    if (filters.isOfficial !== undefined) count++;
    if (filters.search) count++;
    return count;
  }, [filters]);

  // Toggle de tag
  const toggleTag = (tag: TemplateTag) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    onFilterChange('tags', newTags.length > 0 ? newTags : undefined);
  };

  // Conteúdo dos filtros
  const filterContent = (
    <div className="space-y-4">
      {/* Busca textual */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar templates..."
          value={filters.search || ''}
          onChange={(e) => onFilterChange('search', e.target.value || undefined)}
          className="pl-9"
        />
      </div>

      {/* Filtros em linha */}
      <div className="flex flex-wrap gap-2">
        {/* Classe */}
        <Select
          value={filters.classId || 'all'}
          onValueChange={(value) => 
            onFilterChange('classId', value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Classe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as classes</SelectItem>
            {CLASS_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Dificuldade */}
        <Select
          value={filters.difficulty || 'all'}
          onValueChange={(value) => 
            onFilterChange('difficulty', value === 'all' ? undefined : value as TemplateDifficulty)
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Dificuldade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as dificuldades</SelectItem>
            {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Ordenação */}
        <Select
          value={filters.sortBy || 'rating'}
          onValueChange={(value) => 
            onFilterChange('sortBy', value as TemplateSortOption)
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Toggle Apenas Oficiais */}
        <Button
          variant={filters.isOfficial ? 'default' : 'outline'}
          size="sm"
          onClick={() => 
            onFilterChange('isOfficial', filters.isOfficial ? undefined : true)
          }
          className="gap-1"
        >
          <span className="text-sm">✨</span>
          Oficiais
        </Button>

        {/* Limpar filtros */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">Tags:</span>
        <div className="flex flex-wrap gap-1.5">
          {ALL_TEMPLATE_TAGS.map(tag => (
            <Badge
              key={tag}
              variant={filters.tags?.includes(tag) ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-colors text-xs',
                filters.tags?.includes(tag) 
                  ? 'bg-primary hover:bg-primary/80' 
                  : 'hover:bg-accent'
              )}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );

  // Versão colapsável (mobile)
  if (collapsible) {
    return (
      <Collapsible className={className}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {filterContent}
            </motion.div>
          </AnimatePresence>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // Versão expandida (desktop)
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium">Filtros</span>
        {activeFilterCount > 0 && (
          <Badge variant="secondary">{activeFilterCount} ativo{activeFilterCount > 1 ? 's' : ''}</Badge>
        )}
      </div>
      {filterContent}
    </div>
  );
}

// Export com nome alternativo para evitar conflito
export { TemplateFiltersComponent as TemplateFilters };

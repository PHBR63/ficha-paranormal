/**
 * ValidationResultsList - Lista de resultados de validação
 * 
 * Renderiza todas as categorias de validação com scroll
 * e controle de expansão automática para falhas.
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import { ScrollArea } from '@/components/ui/scroll-area';
import type { ValidationResult } from '@/lib/official-rules-validator';
import { CategorySection } from './CategorySection';

interface ValidationResultsListProps {
  /** Resultados agrupados por categoria */
  groupedResults: Record<string, ValidationResult[]>;
  /** Lista de categorias expandidas */
  expandedCategories: string[];
  /** Callback para alternar expansão de categoria */
  onToggleCategory: (category: string) => void;
}

/**
 * Lista scrollável de resultados de validação por categoria
 */
export function ValidationResultsList({
  groupedResults,
  expandedCategories,
  onToggleCategory,
}: ValidationResultsListProps) {
  return (
    <ScrollArea className="h-[500px] -mx-4 px-4">
      <div className="space-y-2">
        {Object.entries(groupedResults).map(([category, results]) => (
          <CategorySection
            key={category}
            category={category}
            results={results}
            isExpanded={expandedCategories.includes(category)}
            onToggle={() => onToggleCategory(category)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

/**
 * CategorySection - Seção de categoria de validação
 * 
 * Exibe os resultados de validação de uma categoria específica
 * em formato colapsável com indicadores visuais de aprovação/falha.
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from '@/components/icons/ordem-icons';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ValidationResult } from '@/lib/official-rules-validator';
import { getCategoryIcon } from './validation-constants';

interface CategorySectionProps {
  /** Nome da categoria */
  category: string;
  /** Resultados de validação desta categoria */
  results: ValidationResult[];
  /** Se a seção está expandida */
  isExpanded: boolean;
  /** Callback para alternar expansão */
  onToggle: () => void;
}

/**
 * Seção colapsável para resultados de uma categoria de validação
 */
export function CategorySection({
  category,
  results,
  isExpanded,
  onToggle,
}: CategorySectionProps) {
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full">
        <div className={cn(
          "flex items-center justify-between p-3 rounded-lg transition-colors",
          failed > 0 
            ? "bg-destructive/10 hover:bg-destructive/20" 
            : "bg-emerald-500/10 hover:bg-emerald-500/20"
        )}>
          <div className="flex items-center gap-2">
            {getCategoryIcon(category)}
            <span className="font-medium text-sm">{category}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={failed > 0 ? "destructive" : "default"}
              className="text-[10px]"
            >
              {passed}/{results.length}
            </Badge>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 space-y-1 pl-4"
          >
            {results.map((result, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-2 rounded text-xs border-l-2",
                  result.passed 
                    ? "border-emerald-500 bg-emerald-500/5" 
                    : "border-destructive bg-destructive/5"
                )}
              >
                <div className="flex items-start gap-2">
                  {result.passed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{result.test}</div>
                    {!result.passed && (
                      <div className="mt-1 space-y-0.5 text-muted-foreground">
                        <div>
                          <span className="text-emerald-600">Esperado:</span> {result.expected}
                        </div>
                        <div>
                          <span className="text-destructive">Atual:</span> {result.actual}
                        </div>
                        {result.reference && (
                          <div className="text-[10px] italic">
                            📖 {result.reference}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  );
}

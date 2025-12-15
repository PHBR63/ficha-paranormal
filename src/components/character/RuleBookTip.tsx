/**
 * RuleBookTip - Componente de dica do livro de regras
 * 
 * Exibe informações educativas do livro de regras de forma estilizada
 * durante a criação de personagem.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronUp, Quote, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { RulebookTip as RulebookTipType, RulebookSection } from '@/lib/rulebook-content';

interface RuleBookTipProps {
  /** Conteúdo principal da dica */
  section: RulebookSection;
  /** Se deve iniciar expandido */
  defaultExpanded?: boolean;
  /** Variante visual */
  variant?: 'default' | 'compact' | 'highlight';
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Componente que exibe uma dica individual
 */
function TipCard({ tip, variant = 'default' }: { tip: RulebookTipType; variant?: 'default' | 'compact' | 'highlight' }) {
  return (
    <div className={cn(
      'space-y-3',
      variant === 'highlight' && 'p-4 rounded-lg bg-primary/5 border border-primary/20'
    )}>
      {/* Título */}
      <h4 className="font-display text-sm tracking-wider text-primary flex items-center gap-2">
        <Lightbulb className="w-4 h-4" />
        {tip.title}
      </h4>

      {/* Conteúdo principal */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {tip.content}
      </p>

      {/* Citação do livro (se houver) */}
      {tip.quote && (
        <div className="relative pl-4 border-l-2 border-paranormal/50 py-1">
          <Quote className="absolute -left-2 -top-1 w-4 h-4 text-paranormal/50" />
          <p className="text-sm italic text-paranormal/80">
            {tip.quote}
          </p>
          {tip.quoteSource && (
            <p className="text-xs text-muted-foreground mt-1">
              — {tip.quoteSource}
            </p>
          )}
        </div>
      )}

      {/* Lista de detalhes (se houver) */}
      {tip.details && tip.details.length > 0 && (
        <ul className="space-y-1.5 ml-1">
          {tip.details.map((detail, index) => (
            <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RuleBookTip({ 
  section, 
  defaultExpanded = false, 
  variant = 'default',
  className 
}: RuleBookTipProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const hasExtras = section.extras && section.extras.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'ordo-panel overflow-hidden',
        'border-paranormal/30 bg-gradient-to-br from-paranormal/5 to-transparent',
        className
      )}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-sm bg-paranormal/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-paranormal" />
          </div>
          <div>
            <p className="text-xs text-paranormal/70 uppercase tracking-wider">
              Regras do Livro
            </p>
            <h3 className="font-display text-lg tracking-wider text-foreground">
              {section.main.title}
            </h3>
          </div>
        </div>

        {/* Conteúdo principal */}
        <TipCard tip={section.main} />
      </div>

      {/* Conteúdo extra expansível */}
      {hasExtras && (
        <>
          <div className="px-4 pb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full justify-between text-xs text-muted-foreground hover:text-foreground"
            >
              <span>{isExpanded ? 'Menos detalhes' : 'Mais detalhes'}</span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-4 border-t border-paranormal/20 pt-4">
                  {section.extras?.map((extra, index) => (
                    <TipCard key={index} tip={extra} variant="highlight" />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}

/**
 * Versão compacta para uso em tooltips ou espaços menores
 */
export function RuleBookTipCompact({ tip }: { tip: RulebookTipType }) {
  return (
    <div className="p-3 space-y-2 max-w-xs">
      <div className="flex items-center gap-2 text-primary">
        <BookOpen className="w-4 h-4" />
        <span className="font-medium text-sm">{tip.title}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {tip.content}
      </p>
      {tip.quote && (
        <p className="text-xs italic text-paranormal/80 border-l-2 border-paranormal/30 pl-2">
          {tip.quote}
        </p>
      )}
    </div>
  );
}

export default RuleBookTip;

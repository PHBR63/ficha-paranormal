/**
 * QuickReferenceCard - Card de referência rápida de regras
 * Mostra limite de PE, ações de combate e resistências
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  ChevronDown, 
  Zap, 
  Target, 
  Shield, 
  Footprints,
  Brain 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPELimitByNex } from '@/lib/dice-roller';

interface QuickReferenceCardProps {
  nex: number;
  vigor: number;
  agility: number;
  presence: number;
  className?: string;
}

export function QuickReferenceCard({ 
  nex, 
  vigor, 
  agility, 
  presence,
  className 
}: QuickReferenceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const peLimit = getPELimitByNex(nex);

  return (
    <div className={cn("ordo-panel overflow-hidden", className)}>
      {/* Header sempre visível */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="font-display text-sm tracking-wider">REFERÊNCIA RÁPIDA</span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform",
          isExpanded && "rotate-180"
        )} />
      </button>

      {/* Conteúdo compacto sempre visível */}
      <div className="px-3 pb-3 grid grid-cols-2 gap-2">
        {/* Limite de PE */}
        <div className="flex items-center gap-2 p-2 bg-secondary/10 rounded-lg">
          <Zap className="w-4 h-4 text-secondary" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">PE/Turno</p>
            <p className="font-display text-lg text-secondary">{peLimit}</p>
          </div>
        </div>

        {/* Crítico */}
        <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
          <Target className="w-4 h-4 text-primary" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Crítico</p>
            <p className="font-display text-lg text-primary">20</p>
          </div>
        </div>
      </div>

      {/* Conteúdo expandido */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-3 space-y-3">
              {/* Resistências */}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase mb-2">RESISTÊNCIAS</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 bg-muted/30 rounded text-center">
                    <div className="flex items-center justify-center gap-1 text-destructive mb-1">
                      <Shield className="w-3 h-3" />
                      <span className="text-[10px] uppercase">Fort</span>
                    </div>
                    <p className="font-display text-lg">{vigor}</p>
                    <p className="text-[10px] text-muted-foreground">VIG</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded text-center">
                    <div className="flex items-center justify-center gap-1 text-primary mb-1">
                      <Footprints className="w-3 h-3" />
                      <span className="text-[10px] uppercase">Ref</span>
                    </div>
                    <p className="font-display text-lg">{agility}</p>
                    <p className="text-[10px] text-muted-foreground">AGI</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded text-center">
                    <div className="flex items-center justify-center gap-1 text-paranormal mb-1">
                      <Brain className="w-3 h-3" />
                      <span className="text-[10px] uppercase">Von</span>
                    </div>
                    <p className="font-display text-lg">{presence}</p>
                    <p className="text-[10px] text-muted-foreground">PRE</p>
                  </div>
                </div>
              </div>

              {/* Ações de combate */}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase mb-2">AÇÕES POR TURNO</p>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                    1 Padrão
                  </span>
                  <span className="px-2 py-1 bg-secondary/20 text-secondary text-xs rounded">
                    1 Movimento
                  </span>
                  <span className="px-2 py-1 bg-accent/20 text-accent-foreground text-xs rounded">
                    1 Reação
                  </span>
                  <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                    ∞ Livres
                  </span>
                </div>
              </div>

              {/* Dicas */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Ação padrão pode virar movimento extra</p>
                <p>• Movimento pode ser dividido (antes/depois)</p>
                <p>• Reação = 1x até seu próximo turno</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
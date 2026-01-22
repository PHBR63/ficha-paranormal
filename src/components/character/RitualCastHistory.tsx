/**
 * RitualCastHistory - Painel lateral com histórico de rituais conjurados na sessão
 * Mostra timestamps, custos e aprimoramentos utilizados
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CustomScroll } from '@/components/ui/custom-scroll';
import { 
  History, 
  Sparkles, 
  Clock, 
  Zap,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Ritual } from '@/lib/rituals/legacy-exports';
import { getElementConfig } from '@/lib/element-config';

// Interface para registro de conjuração
export interface RitualCastRecord {
  id: string;
  ritual: Ritual;
  peCost: number;
  enhancements: string[];
  timestamp: Date;
  peBeforeCast: number;
  peAfterCast: number;
}

interface RitualCastHistoryProps {
  history: RitualCastRecord[];
  onClear: () => void;
  characterName?: string;
}

// Formata timestamp para exibição
function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
  });
}

// Formata tempo relativo
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  return formatTime(date);
}

// Card individual de conjuração
function CastRecordCard({ record }: { record: RitualCastRecord }) {
  const elementConfig = getElementConfig(record.ritual.element);
  const ElementIcon = elementConfig?.icon || Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "p-3 rounded-lg border transition-colors",
        elementConfig?.bg || "bg-card",
        elementConfig?.border || "border-border",
        "hover:bg-accent/5"
      )}
    >
      {/* Header com nome e tempo */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn(
            "w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0",
            elementConfig?.bg || "bg-muted",
            "border",
            elementConfig?.border || "border-border"
          )}>
            <ElementIcon className={cn("w-4 h-4", elementConfig?.text)} />
          </div>
          
          <div className="min-w-0">
            <h4 className={cn(
              "font-medium text-sm truncate",
              elementConfig?.text || "text-foreground"
            )}>
              {record.ritual.name}
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatTime(record.timestamp)}</span>
              <span className="opacity-50">•</span>
              <span>{formatRelativeTime(record.timestamp)}</span>
            </div>
          </div>
        </div>

        {/* Badge de círculo */}
        <Badge 
          variant="outline" 
          className={cn("text-[10px] flex-shrink-0", elementConfig?.badgeBg)}
        >
          {record.ritual.circle}º
        </Badge>
      </div>

      {/* Detalhes de custo */}
      <div className="mt-2 pt-2 border-t border-border/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Custo</span>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-pe" />
            <span className="font-medium text-pe">-{record.peCost} PE</span>
          </div>
        </div>
        
        {/* Barra visual de PE consumido */}
        <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="flex h-full">
            <div 
              className="h-full bg-pe"
              style={{ width: `${(record.peAfterCast / record.peBeforeCast) * 100}%` }}
            />
            <div 
              className="h-full bg-destructive/50"
              style={{ width: `${(record.peCost / record.peBeforeCast) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
          <span>{record.peAfterCast} PE restante</span>
          <span>de {record.peBeforeCast}</span>
        </div>
      </div>

      {/* Aprimoramentos usados */}
      {record.enhancements.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground uppercase mb-1">
            Aprimoramentos
          </p>
          <div className="flex flex-wrap gap-1">
            {record.enhancements.map((enh, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className="text-[10px] px-1.5 py-0"
              >
                {enh}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function RitualCastHistory({ history, onClear, characterName }: RitualCastHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Calcula estatísticas da sessão
  const totalPeSpent = history.reduce((sum, r) => sum + r.peCost, 0);
  const uniqueRituals = new Set(history.map(r => r.ritual.id)).size;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 relative",
            history.length > 0 && "border-paranormal/50 text-paranormal"
          )}
        >
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">Histórico</span>
          {history.length > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-paranormal text-paranormal-foreground text-[10px]"
            >
              {history.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 font-display tracking-wider">
            <Sparkles className="w-5 h-5 text-paranormal" />
            Rituais Conjurados
          </SheetTitle>
          {characterName && (
            <p className="text-sm text-muted-foreground">
              Sessão de {characterName}
            </p>
          )}
        </SheetHeader>

        {/* Estatísticas da sessão */}
        {history.length > 0 && (
          <div className="grid grid-cols-2 gap-2 py-4 border-b border-border">
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-pe">{totalPeSpent}</p>
              <p className="text-[10px] text-muted-foreground uppercase">PE Total</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-paranormal">{history.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Conjurações</p>
            </div>
          </div>
        )}

        {/* Lista de conjurações */}
        <CustomScroll maxHeight="calc(100vh - 280px)" className="flex-1 py-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-foreground/50" />
              </div>
              <h4 className="font-medium text-foreground/70">Nenhum ritual conjurado</h4>
              <p className="text-sm text-foreground/60 mt-1 max-w-[200px]">
                Os rituais conjurados nesta sessão aparecerão aqui
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-2">
                {history.map((record) => (
                  <CastRecordCard key={record.id} record={record} />
                ))}
              </div>
            </AnimatePresence>
          )}
        </CustomScroll>

        {/* Ações do footer */}
        {history.length > 0 && (
          <div className="pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Histórico
            </Button>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              O histórico é resetado ao sair da ficha
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

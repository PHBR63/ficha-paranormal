// Log de sessão para rastrear ações durante jogo presencial
// Ordem Paranormal RPG v1.3

import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Trash2, 
  Undo2, 
  Download,
  Heart,
  Zap,
  Brain,
  Skull,
  Shield,
  Dice1,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface SessionLogEntry {
  id: string;
  timestamp: Date;
  type: 'damage' | 'heal' | 'pe' | 'san' | 'condition' | 'roll' | 'turn' | 'system' | 'death' | 'ritual' | 'attack';
  message: string;
  details?: {
    value?: number;
    previousValue?: number;
    conditionId?: string;
    rollResult?: number;
    attackResult?: any;
    skillResult?: any;
    ritualId?: string;
    cost?: number;
    enhancements?: string[];
    previousPE?: number;
  };
  canUndo?: boolean;
}

interface SessionLogProps {
  entries: SessionLogEntry[];
  onUndo?: (entryId: string) => void;
  onClear?: () => void;
  onExport?: () => void;
  maxHeight?: string;
  className?: string;
}

const TYPE_CONFIG: Record<SessionLogEntry['type'], { 
  icon: React.ReactNode; 
  color: string;
  bgColor: string;
}> = {
  damage: { 
    icon: <Heart className="w-3.5 h-3.5" />, 
    color: 'text-destructive',
    bgColor: 'bg-destructive/10'
  },
  heal: { 
    icon: <Heart className="w-3.5 h-3.5" />, 
    color: 'text-green-500',
    bgColor: 'bg-green-500/10'
  },
  pe: { 
    icon: <Zap className="w-3.5 h-3.5" />, 
    color: 'text-energy',
    bgColor: 'bg-energy/10'
  },
  san: { 
    icon: <Brain className="w-3.5 h-3.5" />, 
    color: 'text-sanity',
    bgColor: 'bg-sanity/10'
  },
  condition: { 
    icon: <AlertTriangle className="w-3.5 h-3.5" />, 
    color: 'text-warning',
    bgColor: 'bg-warning/10'
  },
  roll: { 
    icon: <Dice1 className="w-3.5 h-3.5" />, 
    color: 'text-primary',
    bgColor: 'bg-primary/10'
  },
  turn: { 
    icon: <Clock className="w-3.5 h-3.5" />, 
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50'
  },
  system: { 
    icon: <Shield className="w-3.5 h-3.5" />, 
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/30'
  },
  death: { 
    icon: <Skull className="w-3.5 h-3.5" />, 
    color: 'text-destructive',
    bgColor: 'bg-destructive/20'
  },
  ritual: { 
    icon: <Zap className="w-3.5 h-3.5" />, 
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10'
  },
  attack: { 
    icon: <Shield className="w-3.5 h-3.5" />, 
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10'
  },
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
}

export function SessionLog({
  entries,
  onUndo,
  onClear,
  onExport,
  maxHeight = '200px',
  className
}: SessionLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lastUndoId, setLastUndoId] = useState<string | null>(null);

  // Auto-scroll para o final quando novas entradas são adicionadas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  const handleUndo = (entryId: string) => {
    setLastUndoId(entryId);
    onUndo?.(entryId);
    setTimeout(() => setLastUndoId(null), 1000);
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
      return;
    }

    // Export padrão como texto
    const text = entries
      .map(e => `[${formatTime(e.timestamp)}] ${e.message}`)
      .join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sessao-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const undoableEntry = entries.find(e => e.canUndo);

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Log da Sessão ({entries.length})
        </span>
        <div className="flex gap-1">
          {undoableEntry && onUndo && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleUndo(undoableEntry.id)}
              title="Desfazer última ação"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleExport}
            title="Exportar log"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
          {onClear && entries.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={onClear}
              title="Limpar log"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Log entries */}
      <ScrollArea 
        ref={scrollRef}
        className="rounded-md border border-border/50 bg-muted/20"
        style={{ maxHeight }}
      >
        {entries.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
            Nenhuma ação registrada
          </div>
        ) : (
          <div className="p-2 space-y-1">
            <AnimatePresence mode="popLayout">
              {entries.map((entry) => {
                const config = TYPE_CONFIG[entry.type];
                const isUndoing = lastUndoId === entry.id;

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: isUndoing ? 0.5 : 1, 
                      x: 0,
                      scale: isUndoing ? 0.95 : 1
                    }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "flex items-start gap-2 px-2 py-1.5 rounded text-xs",
                      config.bgColor,
                      isUndoing && "line-through"
                    )}
                  >
                    <span className={cn("mt-0.5 shrink-0", config.color)}>
                      {config.icon}
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      [{formatTime(entry.timestamp)}]
                    </span>
                    <span className={cn("flex-1", config.color)}>
                      {entry.message}
                    </span>
                    {entry.canUndo && onUndo && !isUndoing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                        onClick={() => handleUndo(entry.id)}
                      >
                        <Undo2 className="w-3 h-3" />
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// Hook para gerenciar o log
export function useSessionLog(maxEntries = 100) {
  const [entries, setEntries] = useState<SessionLogEntry[]>([]);

  const addEntry = (
    type: SessionLogEntry['type'],
    message: string,
    details?: SessionLogEntry['details'],
    canUndo = false
  ) => {
    const newEntry: SessionLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type,
      message,
      details,
      canUndo,
    };

    setEntries(prev => {
      // Remove flag canUndo das entradas anteriores
      const updated = prev.map(e => ({ ...e, canUndo: false }));
      const newEntries = [...updated, newEntry];
      // Mantém apenas as últimas maxEntries
      return newEntries.slice(-maxEntries);
    });

    return newEntry.id;
  };

  const removeEntry = (entryId: string) => {
    setEntries(prev => prev.filter(e => e.id !== entryId));
  };

  const clearEntries = () => {
    setEntries([]);
  };

  return {
    entries,
    addEntry,
    removeEntry,
    clearEntries,
  };
}

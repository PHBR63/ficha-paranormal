/**
 * MobileRollHistory - Histórico de rolagens para mobile
 * Exibe últimos testes, ataques e conjurações em um Drawer
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerTrigger 
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, 
  Dices, 
  Sword, 
  Sparkles, 
  Shield, 
  Trash2,
  ChevronRight,
  Target,
  Zap,
  Check,
  X,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos de rolagem suportados
export type RollType = 'skill' | 'attack' | 'damage' | 'ritual' | 'resistance' | 'initiative';

// Interface para uma rolagem no histórico
export interface RollHistoryEntry {
  id: string;
  type: RollType;
  label: string;
  timestamp: Date;
  // Dados da rolagem
  diceCount: number;
  results: number[];
  bestResult: number;
  bonus: number;
  total: number;
  // Contexto adicional
  targetDT?: number;
  success?: boolean;
  critical?: boolean;
  criticalFail?: boolean;
  damage?: string;
  damageTotal?: number;
  element?: string;
  peCost?: number;
  // Metadados
  weaponName?: string;
  skillName?: string;
  ritualName?: string;
  resistanceType?: 'fortitude' | 'reflexos' | 'vontade';
}

// Ícones por tipo de rolagem
const ROLL_TYPE_CONFIG: Record<RollType, { 
  icon: typeof Dices; 
  color: string; 
  bgColor: string;
  label: string;
}> = {
  skill: { 
    icon: Dices, 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500/20',
    label: 'Perícia' 
  },
  attack: { 
    icon: Sword, 
    color: 'text-orange-400', 
    bgColor: 'bg-orange-500/20',
    label: 'Ataque' 
  },
  damage: { 
    icon: Target, 
    color: 'text-red-400', 
    bgColor: 'bg-red-500/20',
    label: 'Dano' 
  },
  ritual: { 
    icon: Sparkles, 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500/20',
    label: 'Ritual' 
  },
  resistance: { 
    icon: Shield, 
    color: 'text-green-400', 
    bgColor: 'bg-green-500/20',
    label: 'Resistência' 
  },
  initiative: { 
    icon: Zap, 
    color: 'text-yellow-400', 
    bgColor: 'bg-yellow-500/20',
    label: 'Iniciativa' 
  },
};

// Card de rolagem individual
function RollCard({ roll, onRemove }: { roll: RollHistoryEntry; onRemove?: () => void }) {
  const config = ROLL_TYPE_CONFIG[roll.type];
  const Icon = config.icon;
  const timeAgo = formatDistanceToNow(roll.timestamp, { addSuffix: true, locale: ptBR });
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        "p-3 rounded-lg border transition-colors",
        roll.critical && "border-yellow-500/50 bg-yellow-500/10",
        roll.criticalFail && "border-red-500/50 bg-red-500/10",
        !roll.critical && !roll.criticalFail && "border-border bg-card/50"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg", config.bgColor)}>
            <Icon className={cn("w-4 h-4", config.color)} />
          </div>
          <div>
            <p className="font-medium text-sm">{roll.label}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </p>
          </div>
        </div>
        
        {/* Resultado principal */}
        <div className="text-right">
          <p className={cn(
            "font-display text-2xl",
            roll.critical && "text-yellow-400",
            roll.criticalFail && "text-red-400",
            roll.success === true && !roll.critical && "text-success",
            roll.success === false && !roll.criticalFail && "text-destructive",
            roll.success === undefined && "text-foreground"
          )}>
            {roll.total}
          </p>
          {roll.targetDT && (
            <p className="text-[10px] text-muted-foreground">
              DT {roll.targetDT}
            </p>
          )}
        </div>
      </div>
      
      {/* Dados individuais */}
      <div className="flex items-center gap-1 flex-wrap mb-2">
        {roll.results.map((die, i) => (
          <span 
            key={i}
            className={cn(
              "w-7 h-7 rounded flex items-center justify-center text-xs font-medium",
              die === roll.bestResult && "bg-primary/20 text-primary ring-1 ring-primary/50",
              die === 20 && "bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/50",
              die === 1 && "bg-red-500/20 text-red-400 ring-1 ring-red-500/50",
              die !== roll.bestResult && die !== 20 && die !== 1 && "bg-muted/50 text-muted-foreground"
            )}
          >
            {die}
          </span>
        ))}
        
        {roll.bonus !== 0 && (
          <span className={cn(
            "px-2 py-1 rounded text-xs font-medium",
            roll.bonus > 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
          )}>
            {roll.bonus > 0 ? '+' : ''}{roll.bonus}
          </span>
        )}
      </div>
      
      {/* Informações adicionais */}
      <div className="flex items-center gap-2 flex-wrap">
        {roll.success !== undefined && (
          <Badge variant={roll.success ? "default" : "destructive"} className="text-[10px] h-5">
            {roll.success ? (
              <><Check className="w-3 h-3 mr-1" /> Sucesso</>
            ) : (
              <><X className="w-3 h-3 mr-1" /> Falha</>
            )}
          </Badge>
        )}
        
        {roll.critical && (
          <Badge className="text-[10px] h-5 bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
            ⭐ Crítico!
          </Badge>
        )}
        
        {roll.criticalFail && (
          <Badge className="text-[10px] h-5 bg-red-500/20 text-red-400 border-red-500/50">
            💀 Desastre!
          </Badge>
        )}
        
        {roll.damageTotal !== undefined && (
          <Badge variant="outline" className="text-[10px] h-5 text-red-400 border-red-500/30">
            🎯 {roll.damageTotal} dano
          </Badge>
        )}
        
        {roll.peCost && (
          <Badge variant="outline" className="text-[10px] h-5 text-purple-400 border-purple-500/30">
            ⚡ -{roll.peCost} PE
          </Badge>
        )}
      </div>
      
      {/* Botão de remover (opcional) */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </motion.div>
  );
}

// Props do componente principal
interface MobileRollHistoryProps {
  rolls: RollHistoryEntry[];
  onClearHistory?: () => void;
  onRemoveRoll?: (id: string) => void;
  maxVisible?: number;
}

// Componente de histórico com Drawer
export function MobileRollHistory({ 
  rolls, 
  onClearHistory,
  onRemoveRoll,
  maxVisible = 20,
}: MobileRollHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<RollType | 'all'>('all');
  
  // Filtra rolagens
  const filteredRolls = useMemo(() => {
    let result = rolls;
    if (filter !== 'all') {
      result = rolls.filter(r => r.type === filter);
    }
    return result.slice(0, maxVisible);
  }, [rolls, filter, maxVisible]);
  
  // Contadores por tipo
  const typeCounts = useMemo(() => {
    const counts: Record<RollType | 'all', number> = {
      all: rolls.length,
      skill: 0,
      attack: 0,
      damage: 0,
      ritual: 0,
      resistance: 0,
      initiative: 0,
    };
    rolls.forEach(r => counts[r.type]++);
    return counts;
  }, [rolls]);
  
  // Últimas 3 rolagens para preview
  const recentRolls = rolls.slice(0, 3);
  
  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <History className="w-4 h-4" />
          <span className="text-xs">Histórico</span>
          {rolls.length > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {rolls.length}
            </Badge>
          )}
        </Button>
      </DrawerTrigger>
      
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-border pb-3">
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Histórico de Rolagens
            </DrawerTitle>
            
            {rolls.length > 0 && onClearHistory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearHistory}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
          
          {/* Filtros */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 mt-3 scrollbar-hide">
            {(['all', 'skill', 'attack', 'damage', 'ritual', 'resistance', 'initiative'] as const).map((type) => {
              const count = typeCounts[type];
              if (type !== 'all' && count === 0) return null;
              
              const config = type === 'all' ? null : ROLL_TYPE_CONFIG[type];
              const Icon = config?.icon || History;
              
              return (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={cn(
                    "flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all flex items-center gap-1.5",
                    filter === type
                      ? config ? `${config.bgColor} ${config.color}` : "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {type === 'all' ? 'Todas' : config?.label}
                  <span className="opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </DrawerHeader>
        
        <ScrollArea className="flex-1 p-4 max-h-[60vh]">
          {filteredRolls.length === 0 ? (
            <div className="text-center py-12">
              <Dices className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground text-sm">Nenhuma rolagem registrada</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1">
                Faça testes, ataques ou conjure rituais para ver o histórico
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredRolls.map((roll) => (
                  <RollCard 
                    key={roll.id} 
                    roll={roll}
                    onRemove={onRemoveRoll ? () => onRemoveRoll(roll.id) : undefined}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}

// Componente de preview compacto para exibir na overview
export function RollHistoryPreview({ 
  rolls, 
  onViewAll,
}: { 
  rolls: RollHistoryEntry[];
  onViewAll: () => void;
}) {
  const recentRolls = rolls.slice(0, 3);
  
  if (recentRolls.length === 0) return null;
  
  return (
    <div className="ordo-panel p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
          <History className="w-3 h-3" />
          ÚLTIMAS ROLAGENS
        </p>
        <button
          onClick={onViewAll}
          className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
        >
          Ver todas
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      
      <div className="space-y-1.5">
        {recentRolls.map((roll) => {
          const config = ROLL_TYPE_CONFIG[roll.type];
          const Icon = config.icon;
          
          return (
            <div 
              key={roll.id}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-2">
                <Icon className={cn("w-4 h-4", config.color)} />
                <span className="text-xs truncate max-w-[120px]">{roll.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {roll.success !== undefined && (
                  roll.success 
                    ? <Check className="w-3.5 h-3.5 text-success" />
                    : <X className="w-3.5 h-3.5 text-destructive" />
                )}
                <span className={cn(
                  "font-display text-lg",
                  roll.critical && "text-yellow-400",
                  roll.criticalFail && "text-red-400",
                  !roll.critical && !roll.criticalFail && "text-foreground"
                )}>
                  {roll.total}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Hook para gerenciar histórico de rolagens
export function useRollHistory(maxEntries: number = 50) {
  const [rolls, setRolls] = useState<RollHistoryEntry[]>(() => {
    // Tenta carregar do localStorage
    try {
      const saved = localStorage.getItem('roll_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp),
        }));
      }
    } catch (e) {
      console.warn('Erro ao carregar histórico de rolagens:', e);
    }
    return [];
  });
  
  // Salva no localStorage quando muda
  const saveToStorage = (newRolls: RollHistoryEntry[]) => {
    try {
      localStorage.setItem('roll_history', JSON.stringify(newRolls.slice(0, maxEntries)));
    } catch (e) {
      console.warn('Erro ao salvar histórico de rolagens:', e);
    }
  };
  
  // Adiciona nova rolagem
  const addRoll = (roll: Omit<RollHistoryEntry, 'id' | 'timestamp'>) => {
    const newRoll: RollHistoryEntry = {
      ...roll,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    
    setRolls(prev => {
      const updated = [newRoll, ...prev].slice(0, maxEntries);
      saveToStorage(updated);
      return updated;
    });
    
    return newRoll;
  };
  
  // Remove uma rolagem
  const removeRoll = (id: string) => {
    setRolls(prev => {
      const updated = prev.filter(r => r.id !== id);
      saveToStorage(updated);
      return updated;
    });
  };
  
  // Limpa histórico
  const clearHistory = () => {
    setRolls([]);
    localStorage.removeItem('roll_history');
  };
  
  return {
    rolls,
    addRoll,
    removeRoll,
    clearHistory,
    hasRolls: rolls.length > 0,
  };
}

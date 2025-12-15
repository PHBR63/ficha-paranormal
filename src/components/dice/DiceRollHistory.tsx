/**
 * DiceRollHistory - Painel de histórico de rolagens
 * Exibe as últimas rolagens com detalhes e animações
 * Pode ser usado como drawer lateral ou painel fixo
 */

import { motion, AnimatePresence } from 'framer-motion';
import { History, Sparkles, AlertTriangle, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DiceRollResult } from '@/lib/dice-roller';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Interface para props
interface DiceRollHistoryProps {
  rolls: DiceRollResult[];
  maxRolls?: number;
  onClear?: () => void;
}

// Componente de entrada individual do histórico
function HistoryEntry({ roll, index }: { roll: DiceRollResult; index: number }) {
  // Formata timestamp relativo
  const timeAgo = formatDistanceToNow(roll.timestamp, { 
    addSuffix: true, 
    locale: ptBR 
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'p-3 rounded-lg border transition-colors',
        roll.isCritical 
          ? 'bg-yellow-500/10 border-yellow-500/30' 
          : roll.isDisadvantage 
            ? 'bg-destructive/10 border-destructive/30'
            : 'bg-muted/30 border-border'
      )}
    >
      {/* Cabeçalho: Nome e Timestamp */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm truncate max-w-[180px]">
          {roll.label || 'Teste'}
        </span>
        <span className="text-xs text-muted-foreground">
          {timeAgo}
        </span>
      </div>

      {/* Dados rolados */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex gap-1 flex-wrap">
          {roll.dice.map((die, i) => (
            <span
              key={i}
              className={cn(
                'w-6 h-6 rounded text-xs flex items-center justify-center font-medium',
                die === roll.keptDice
                  ? roll.isCritical
                    ? 'bg-yellow-500/30 text-yellow-500'
                    : 'bg-primary/30 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {die}
            </span>
          ))}
        </div>
        
        {roll.skillBonus > 0 && (
          <span className="text-xs text-primary">
            +{roll.skillBonus}
          </span>
        )}
      </div>

      {/* Total e Badges */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn(
            'font-display text-lg font-bold',
            roll.isCritical && 'text-yellow-500',
            roll.isDisadvantage && !roll.isCritical && 'text-destructive'
          )}>
            = {roll.total}
          </span>
        </div>
        
        <div className="flex gap-1">
          {roll.isCritical && (
            <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50 text-xs px-1.5">
              <Sparkles className="w-3 h-3 mr-0.5" />
              Crítico
            </Badge>
          )}
          {roll.isDisadvantage && (
            <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/50 text-xs px-1.5">
              <AlertTriangle className="w-3 h-3 mr-0.5" />
              Desv.
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Drawer/Sheet de histórico
export function DiceRollHistoryDrawer({ 
  rolls, 
  maxRolls = 20,
  onClear 
}: DiceRollHistoryProps) {
  // Limita quantidade de rolagens exibidas
  const displayRolls = rolls.slice(0, maxRolls);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="font-display relative"
          data-dice-history-trigger
        >
          <History className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">HISTÓRICO DE ROLAGENS</span>
          <span className="sm:hidden">Dados</span>
          {rolls.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {rolls.length > 99 ? '99+' : rolls.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[350px] sm:w-[400px]">
        <SheetHeader className="flex flex-row items-center justify-between pr-4">
          <SheetTitle className="font-display text-lg tracking-wider flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Histórico de Rolagens
          </SheetTitle>
          
          {rolls.length > 0 && onClear && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClear}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-4">
          {displayRolls.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma rolagem ainda</p>
              <p className="text-xs mt-1">Clique em uma perícia ou atributo para rolar</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {displayRolls.map((roll, index) => (
                  <HistoryEntry 
                    key={`${roll.timestamp.getTime()}-${index}`} 
                    roll={roll} 
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// Versão compacta para exibição inline (opcional)
export function DiceRollHistoryCompact({ 
  rolls, 
  maxRolls = 5 
}: DiceRollHistoryProps) {
  const displayRolls = rolls.slice(0, maxRolls);

  if (displayRolls.length === 0) return null;

  return (
    <div className="ordo-panel p-3 space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        <History className="w-3 h-3" />
        Últimas Rolagens
      </p>
      <div className="space-y-1.5">
        {displayRolls.map((roll, index) => (
          <div 
            key={`${roll.timestamp.getTime()}-${index}`}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground truncate max-w-[120px]">
              {roll.label || 'Teste'}
            </span>
            <span className={cn(
              'font-display font-bold',
              roll.isCritical && 'text-yellow-500'
            )}>
              {roll.total}
              {roll.isCritical && <Sparkles className="w-3 h-3 inline ml-1" />}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

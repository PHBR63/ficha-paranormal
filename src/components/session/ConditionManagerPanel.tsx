import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Timer, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CONDITIONS, CONDITION_CATEGORIES, Condition } from '@/lib/conditions';
import { motion, AnimatePresence } from 'framer-motion';

export interface ConditionWithDuration {
  id: string;
  turnsRemaining?: number;
  appliedAt?: number;
  source?: string;
}

interface ConditionManagerPanelProps {
  conditions: ConditionWithDuration[];
  currentRound: number;
  onAdd: (conditionId: string, duration?: number, source?: string) => void;
  onRemove: (conditionId: string) => void;
  onUpdateDuration: (conditionId: string, newDuration: number | undefined) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  combat: 'Combate',
  mental: 'Mental',
  physical: 'Físico',
  critical: 'Crítico',
  sensory: 'Sensorial',
};

const CATEGORY_COLORS: Record<string, string> = {
  combat: 'bg-red-500/10 border-red-500/30 text-red-500',
  mental: 'bg-purple-500/10 border-purple-500/30 text-purple-500',
  physical: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
  critical: 'bg-destructive/10 border-destructive/30 text-destructive',
  sensory: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
};

const getConditionCategory = (conditionId: string): string => {
  for (const [category, ids] of Object.entries(CONDITION_CATEGORIES)) {
    if (ids.includes(conditionId)) return category;
  }
  return 'combat';
};

export const ConditionManagerPanel: React.FC<ConditionManagerPanelProps> = ({
  conditions,
  currentRound,
  onAdd,
  onRemove,
  onUpdateDuration,
}) => {
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [source, setSource] = useState<string>('');

  const handleAdd = () => {
    if (!selectedCondition) return;
    
    const durationNum = duration ? parseInt(duration) : undefined;
    onAdd(selectedCondition, durationNum, source || undefined);
    setSelectedCondition('');
    setDuration('');
    setSource('');
  };

  const activeConditionIds = conditions.map(c => c.id);
  const availableConditions = Object.values(CONDITIONS).filter(
    c => !activeConditionIds.includes(c.id)
  );

  const groupedAvailable = Object.entries(CONDITION_CATEGORIES).map(([category, ids]) => ({
    category,
    conditions: availableConditions.filter(c => ids.includes(c.id)),
  })).filter(g => g.conditions.length > 0);

  const criticalConditions = conditions.filter(c => 
    CONDITION_CATEGORIES.critical?.includes(c.id)
  );

  return (
    <div className="space-y-4">
      {/* Critical Conditions Alert */}
      {criticalConditions.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium text-sm">Condições Críticas Ativas!</p>
            <p className="text-xs opacity-80">
              {criticalConditions.map(c => CONDITIONS[c.id]?.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Add Condition */}
      <div className="space-y-2 p-3 rounded-lg border bg-card/50">
        <p className="text-sm font-medium">Adicionar Condição</p>
        <div className="flex gap-2">
          <Select value={selectedCondition} onValueChange={setSelectedCondition}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecionar condição..." />
            </SelectTrigger>
            <SelectContent>
              {groupedAvailable.map(({ category, conditions: catConditions }) => (
                <div key={category}>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase">
                    {CATEGORY_LABELS[category]}
                  </div>
                  {catConditions.map(condition => (
                    <SelectItem key={condition.id} value={condition.id}>
                      <span className="flex items-center gap-2">
                        <span>{condition.icon}</span>
                        <span>{condition.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Turnos"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-20"
            min={1}
          />
          <Button onClick={handleAdd} disabled={!selectedCondition} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {selectedCondition && CONDITIONS[selectedCondition] && (
          <p className="text-xs text-muted-foreground">
            {CONDITIONS[selectedCondition].description}
          </p>
        )}
      </div>

      {/* Active Conditions */}
      <div className="space-y-2">
        <p className="text-sm font-medium">
          Condições Ativas ({conditions.length})
        </p>
        <ScrollArea className="h-[200px]">
          <AnimatePresence mode="popLayout">
            {conditions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma condição ativa
              </p>
            ) : (
              <div className="space-y-2 pr-2">
                {conditions.map((cond) => {
                  const conditionData = CONDITIONS[cond.id];
                  if (!conditionData) return null;
                  
                  const category = getConditionCategory(cond.id);
                  const categoryColor = CATEGORY_COLORS[category];
                  
                  return (
                    <motion.div
                      key={cond.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={cn(
                        "p-3 rounded-lg border",
                        categoryColor
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{conditionData.icon}</span>
                            <span className="font-medium text-sm">{conditionData.name}</span>
                            {cond.turnsRemaining !== undefined && (
                              <Badge variant="outline" className="gap-1 text-xs">
                                <Timer className="h-3 w-3" />
                                {cond.turnsRemaining} {cond.turnsRemaining === 1 ? 'turno' : 'turnos'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs opacity-80 mt-1 line-clamp-2">
                            {conditionData.effect}
                          </p>
                          {cond.source && (
                            <p className="text-xs opacity-60 mt-1">
                              Fonte: {cond.source}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {cond.turnsRemaining !== undefined && (
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => onUpdateDuration(cond.id, Math.max(0, (cond.turnsRemaining || 0) - 1))}
                              >
                                <span className="text-xs">-1</span>
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => onUpdateDuration(cond.id, (cond.turnsRemaining || 0) + 1)}
                              >
                                <span className="text-xs">+1</span>
                              </Button>
                            </div>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => onRemove(cond.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 pt-2 border-t">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <Badge
            key={key}
            variant="outline"
            className={cn("text-xs", CATEGORY_COLORS[key])}
          >
            {label}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default ConditionManagerPanel;

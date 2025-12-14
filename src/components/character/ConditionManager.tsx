/**
 * ConditionManager - Gerenciador de condições do personagem
 * 
 * Funcionalidades:
 * - Adicionar/remover condições
 * - Contador de duração em turnos
 * - Descrição e efeitos de cada condição
 * - Redução automática de turnos
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Plus,
  Minus,
  X,
  Timer,
  ChevronDown,
  ChevronUp,
  Search,
  AlertTriangle,
  Info,
  Skull,
  Eye,
  Brain,
  Activity,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CONDITIONS, CONDITION_CATEGORIES, type Condition } from '@/lib/conditions';

// Interface para condição ativa com duração
export interface ActiveCondition {
  id: string;
  name: string;
  turnsRemaining: number | null; // null = permanente até remoção manual
  addedAt: Date;
}

interface ConditionManagerProps {
  conditions: ActiveCondition[];
  onConditionsChange: (conditions: ActiveCondition[]) => void;
}

// Mapeamento de categorias para ícones
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  combat: <Zap className="w-4 h-4" />,
  sensory: <Eye className="w-4 h-4" />,
  mental: <Brain className="w-4 h-4" />,
  physical: <Activity className="w-4 h-4" />,
  critical: <Skull className="w-4 h-4" />,
};

// Mapeamento de categorias para labels
const CATEGORY_LABELS: Record<string, string> = {
  combat: 'Combate',
  sensory: 'Sensoriais',
  mental: 'Mentais',
  physical: 'Físicas',
  critical: 'Críticas',
};

export function ConditionManager({ conditions, onConditionsChange }: ConditionManagerProps) {
  // Estado para controlar abertura do modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // Estado para busca
  const [searchQuery, setSearchQuery] = useState('');
  // Estado para expansão do painel
  const [isExpanded, setIsExpanded] = useState(false);
  // Estado para categoria expandida no modal
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Adiciona uma condição
  const handleAddCondition = (conditionId: string, turns: number | null = null) => {
    const conditionData = CONDITIONS[conditionId];
    if (!conditionData) return;

    // Verifica se já existe
    if (conditions.some(c => c.id === conditionId)) {
      return;
    }

    const newCondition: ActiveCondition = {
      id: conditionId,
      name: conditionData.name,
      turnsRemaining: turns,
      addedAt: new Date(),
    };

    onConditionsChange([...conditions, newCondition]);
    setIsAddModalOpen(false);
  };

  // Remove uma condição
  const handleRemoveCondition = (conditionId: string) => {
    onConditionsChange(conditions.filter(c => c.id !== conditionId));
  };

  // Reduz turnos de uma condição
  const handleReduceTurns = (conditionId: string) => {
    onConditionsChange(
      conditions.map(c => {
        if (c.id !== conditionId || c.turnsRemaining === null) return c;
        const newTurns = c.turnsRemaining - 1;
        return newTurns <= 0 ? c : { ...c, turnsRemaining: newTurns };
      }).filter(c => c.turnsRemaining === null || c.turnsRemaining > 0)
    );
  };

  // Aumenta turnos de uma condição
  const handleIncreaseTurns = (conditionId: string) => {
    onConditionsChange(
      conditions.map(c => {
        if (c.id !== conditionId) return c;
        return { ...c, turnsRemaining: (c.turnsRemaining || 0) + 1 };
      })
    );
  };

  // Define turnos manualmente
  const handleSetTurns = (conditionId: string, turns: number | null) => {
    onConditionsChange(
      conditions.map(c => {
        if (c.id !== conditionId) return c;
        return { ...c, turnsRemaining: turns };
      })
    );
  };

  // Reduz todos os contadores (para usar no fim do turno)
  const handleReduceAllTurns = () => {
    const updatedConditions = conditions
      .map(c => {
        if (c.turnsRemaining === null) return c;
        return { ...c, turnsRemaining: c.turnsRemaining - 1 };
      })
      .filter(c => c.turnsRemaining === null || c.turnsRemaining > 0);
    
    onConditionsChange(updatedConditions);
  };

  // Filtra condições pela busca
  const filteredConditions = Object.entries(CONDITIONS).filter(([id, condition]) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      condition.name.toLowerCase().includes(query) ||
      condition.description.toLowerCase().includes(query) ||
      condition.effect.toLowerCase().includes(query)
    );
  });

  // Agrupa condições filtradas por categoria
  const groupedConditions: Record<string, [string, typeof CONDITIONS[string]][]> = {};
  for (const [id, condition] of filteredConditions) {
    for (const [category, ids] of Object.entries(CONDITION_CATEGORIES)) {
      if (ids.includes(id)) {
        if (!groupedConditions[category]) {
          groupedConditions[category] = [];
        }
        groupedConditions[category].push([id, condition]);
        break;
      }
    }
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="ordo-panel overflow-hidden">
        {/* Header colapsável */}
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span className="font-display tracking-wider text-sm">CONDIÇÕES</span>
            {conditions.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {conditions.length}
              </Badge>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-3 border-t border-border">
            {/* Lista de condições ativas */}
            {conditions.length > 0 ? (
              <div className="space-y-2">
                <AnimatePresence>
                  {conditions.map((condition) => {
                    const conditionData = CONDITIONS[condition.id];
                    if (!conditionData) return null;

                    return (
                      <motion.div
                        key={condition.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3 bg-secondary/50 rounded-lg border border-border"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{conditionData.icon}</span>
                              <span className="font-medium truncate">{conditionData.name}</span>
                              {condition.turnsRemaining !== null && (
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-xs font-mono",
                                    condition.turnsRemaining <= 1 && "text-destructive border-destructive"
                                  )}
                                >
                                  <Timer className="w-3 h-3 mr-1" />
                                  {condition.turnsRemaining}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {conditionData.effect}
                            </p>
                          </div>

                          {/* Controles */}
                          <div className="flex items-center gap-1">
                            {/* Controle de turnos */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleReduceTurns(condition.id)}
                                    disabled={condition.turnsRemaining === null}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Reduzir turno</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleIncreaseTurns(condition.id)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Aumentar turno</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {/* Remover */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => handleRemoveCondition(condition.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Remover condição</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>

                        {/* Info de remoção */}
                        {conditionData.removal && (
                          <p className="text-xs text-primary/70 mt-2 pt-2 border-t border-border/50">
                            <span className="font-medium">Remoção:</span> {conditionData.removal}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Botão para reduzir todos os turnos */}
                {conditions.some(c => c.turnsRemaining !== null) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={handleReduceAllTurns}
                  >
                    <Timer className="w-3 h-3 mr-2" />
                    Passar Turno (reduzir contadores)
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma condição ativa
              </p>
            )}

            {/* Botão para adicionar condição */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Condição
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Adicionar Condição
                  </DialogTitle>
                </DialogHeader>

                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar condição..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Lista de condições por categoria */}
                <ScrollArea className="flex-1 -mx-6 px-6">
                  <div className="space-y-3 pb-4">
                    {Object.entries(groupedConditions).map(([category, categoryConditions]) => (
                      <div key={category} className="space-y-1">
                        <button
                          onClick={() => setExpandedCategory(
                            expandedCategory === category ? null : category
                          )}
                          className="w-full flex items-center gap-2 p-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                        >
                          {CATEGORY_ICONS[category]}
                          {CATEGORY_LABELS[category]}
                          <Badge variant="outline" className="ml-auto text-xs">
                            {categoryConditions.length}
                          </Badge>
                          {expandedCategory === category ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        <AnimatePresence>
                          {(expandedCategory === category || searchQuery) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="space-y-1 pl-6"
                            >
                              {categoryConditions.map(([id, condition]) => {
                                const isActive = conditions.some(c => c.id === id);

                                return (
                                  <ConditionOption
                                    key={id}
                                    id={id}
                                    condition={condition}
                                    isActive={isActive}
                                    onAdd={handleAddCondition}
                                  />
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// Componente para cada opção de condição no modal
interface ConditionOptionProps {
  id: string;
  condition: typeof CONDITIONS[string];
  isActive: boolean;
  onAdd: (id: string, turns: number | null) => void;
}

function ConditionOption({ id, condition, isActive, onAdd }: ConditionOptionProps) {
  const [turns, setTurns] = useState<string>('');
  const [showTurnsInput, setShowTurnsInput] = useState(false);

  const handleAdd = (permanent: boolean = false) => {
    const turnsNum = permanent ? null : (parseInt(turns) || null);
    onAdd(id, turnsNum);
    setTurns('');
    setShowTurnsInput(false);
  };

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-all",
        isActive
          ? "bg-primary/10 border-primary/30 opacity-50"
          : "bg-card border-border hover:border-primary/50"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{condition.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{condition.name}</span>
            {isActive && (
              <Badge variant="secondary" className="text-xs">Ativa</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{condition.effect}</p>
        </div>
      </div>

      {!isActive && (
        <div className="mt-2 pt-2 border-t border-border/50">
          {showTurnsInput ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                value={turns}
                onChange={(e) => setTurns(e.target.value)}
                placeholder="Turnos"
                className="h-8 w-20 text-sm"
                autoFocus
              />
              <Button
                size="sm"
                className="h-8"
                onClick={() => handleAdd(false)}
              >
                Adicionar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8"
                onClick={() => handleAdd(true)}
              >
                Permanente
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8"
                onClick={() => setShowTurnsInput(false)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs flex-1"
                onClick={() => setShowTurnsInput(true)}
              >
                <Timer className="w-3 h-3 mr-1" />
                Com duração
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs flex-1"
                onClick={() => handleAdd(true)}
              >
                <Plus className="w-3 h-3 mr-1" />
                Permanente
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

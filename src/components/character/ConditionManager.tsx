/**
 * ConditionManager - Gerenciador de condições do personagem
 * 
 * Funcionalidades:
 * - Adicionar/remover condições
 * - Contador de duração em turnos
 * - Contador de morte para condição Morrendo
 * - Descrição e efeitos de cada condição
 * - Processamento de início de turno (dano, redução de contadores)
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
  Skull,
  Eye,
  Brain,
  Activity,
  Zap,
  Play,
  Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CONDITIONS, CONDITION_CATEGORIES, type Condition } from '@/lib/conditions';
import { CONDITION_EFFECTS, processStartOfTurn, type CombatantState } from '@/lib/game-engine';
import { toast } from 'sonner';
import { ConditionTimer, ConditionTimerSegmented, DyingTimer } from './ConditionTimer';

// Interface para condição ativa com duração
export interface ActiveCondition {
  id: string;
  name: string;
  turnsRemaining: number | null; // null = permanente até remoção manual
  addedAt: Date | string;
  dyingCounter?: number; // Para condição Morrendo (3, 2, 1, 0 = morte)
}

interface ConditionManagerProps {
  conditions: ActiveCondition[];
  onConditionsChange: (conditions: ActiveCondition[]) => void;
  characterName?: string; // Para mensagens de início de turno
  onDamageFromCondition?: (damage: number, isVerdadeiro: boolean) => void; // Callback para aplicar dano
  onCharacterDeath?: () => void; // Callback quando morre
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

export function ConditionManager({ 
  conditions, 
  onConditionsChange,
  characterName = 'Personagem',
  onDamageFromCondition,
  onCharacterDeath,
}: ConditionManagerProps) {
  // Estado para controlar abertura do modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // Estado para busca
  const [searchQuery, setSearchQuery] = useState('');
  // Estado para expansão do painel
  const [isExpanded, setIsExpanded] = useState(false);
  // Estado para categoria expandida no modal
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  // Estado para mostrar resultados do início de turno
  const [turnResults, setTurnResults] = useState<string[]>([]);

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
      addedAt: new Date().toISOString(),
    };

    // Se for condição Morrendo, inicia com contador 3
    if (conditionId === 'morrendo') {
      newCondition.dyingCounter = 3;
      toast.error('💀 Condição MORRENDO adicionada! 3 rodadas até a morte.', { duration: 5000 });
    }

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

  // Reduz contador de morrendo manualmente
  const handleReduceDyingCounter = (conditionId: string) => {
    const morrendoCondition = conditions.find(c => c.id === 'morrendo');
    if (!morrendoCondition || morrendoCondition.dyingCounter === undefined) return;

    const newCounter = morrendoCondition.dyingCounter - 1;
    
    if (newCounter <= 0) {
      toast.error('💀 MORTE! O contador de morrendo chegou a 0.', { duration: 10000 });
      onCharacterDeath?.();
      return;
    }

    onConditionsChange(
      conditions.map(c => {
        if (c.id !== 'morrendo') return c;
        return { ...c, dyingCounter: newCounter };
      })
    );
    
    toast.warning(`⚠️ Contador de morrendo: ${newCounter} rodadas restantes.`, { duration: 3000 });
  };

  // Processa início de turno - aplica dano de condições e reduz contadores
  const handleProcessStartOfTurn = () => {
    const conditionIds = conditions.map(c => c.id);
    const morrendoCondition = conditions.find(c => c.id === 'morrendo');
    
    // Cria um CombatantState mock para usar o processStartOfTurn
    const mockCombatant: CombatantState = {
      id: 'current',
      name: characterName,
      initiative: 0,
      initiativeRoll: [],
      hp: 1, // Não usado aqui
      hpMax: 1,
      pe: 0,
      peMax: 0,
      san: 0,
      sanMax: 0,
      defense: 10,
      baseDefense: 10,
      conditions: conditionIds,
      turnState: { peSpentThisTurn: 0, peLimit: 0, hasActed: false, hasMoved: false, hasReacted: false, actionsRemaining: 2 },
      dyingCounter: morrendoCondition?.dyingCounter,
    };

    const result = processStartOfTurn(mockCombatant);
    const messages: string[] = [];

    // Processa dano
    if (result.damage > 0) {
      messages.push(`🩸 Dano de condições: ${result.damage}`);
      onDamageFromCondition?.(result.damage, result.isDamageVerdadeiro);
    }

    // Processa contador de morrendo
    if (result.dyingResult) {
      if (result.dyingResult.isDead) {
        toast.error(result.dyingResult.message, { duration: 10000 });
        onCharacterDeath?.();
        return;
      }
      
      // Atualiza contador de morrendo
      const newConditions = conditions.map(c => {
        if (c.id === 'morrendo') {
          return { ...c, dyingCounter: result.dyingResult!.newCounter };
        }
        return c;
      });
      
      messages.push(result.dyingResult.message);
      onConditionsChange(newConditions.filter(c => !result.removedConditions.includes(c.id)));
    } else {
      // Remove condições autoRemove
      if (result.removedConditions.length > 0) {
        onConditionsChange(conditions.filter(c => !result.removedConditions.includes(c.id)));
      }
    }

    // Adiciona mensagens de remoção
    result.messages.forEach(msg => {
      if (!messages.includes(msg)) {
        messages.push(msg);
      }
    });

    setTurnResults(messages);
    
    if (messages.length > 0) {
      toast.info(`⏰ Início de Turno processado`, {
        description: messages.join('\n'),
        duration: 5000,
      });
    } else {
      toast.success('Início de turno: nenhum efeito de condição ativo.');
    }
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

  // Verifica se tem condições que causam efeito no início do turno
  const hasStartOfTurnEffects = conditions.some(c => {
    const effect = CONDITION_EFFECTS[c.id];
    return effect?.startOfTurnEffect || c.id === 'morrendo';
  });

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
                              
                              {/* Contador de Morrendo com timer visual */}
                              {condition.id === 'morrendo' && condition.dyingCounter !== undefined && (
                                <DyingTimer 
                                  counter={condition.dyingCounter} 
                                  className="ml-1"
                                />
                              )}
                              
                              {/* Timer visual para condições temporárias */}
                              {condition.turnsRemaining !== null && condition.id !== 'morrendo' && (
                                <div className="flex items-center gap-1.5 ml-1">
                                  <ConditionTimer
                                    turnsRemaining={condition.turnsRemaining}
                                    maxTurns={5}
                                    size="sm"
                                    animate={true}
                                  />
                                  {condition.turnsRemaining <= 2 && (
                                    <span className={cn(
                                      "text-[10px] font-medium",
                                      condition.turnsRemaining <= 1 ? "text-destructive" : "text-warning"
                                    )}>
                                      {condition.turnsRemaining === 1 ? 'Último!' : 'Acabando'}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-foreground/70 mt-1 line-clamp-2">
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

                {/* Botão Processar Início de Turno */}
                {hasStartOfTurnEffects && (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full text-xs bg-orange-600 hover:bg-orange-700"
                    onClick={handleProcessStartOfTurn}
                  >
                    <Play className="w-3 h-3 mr-2" />
                    Processar Início de Turno
                  </Button>
                )}

                {/* Botão para reduzir todos os turnos */}
                {conditions.some(c => c.turnsRemaining !== null) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={handleReduceAllTurns}
                  >
                    <Timer className="w-3 h-3 mr-2" />
                    Fim do Turno (reduzir contadores)
                  </Button>
                )}

                {/* Resultados do início de turno */}
                {turnResults.length > 0 && (
                  <div className="p-2 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs font-medium mb-1">Último início de turno:</p>
                    {turnResults.map((msg, i) => (
                      <p key={i} className="text-xs text-muted-foreground">{msg}</p>
                    ))}
                  </div>
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
                <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
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
            <div className="space-y-2">
              {/* Botões de duração rápida */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground mr-1">Turnos:</span>
                {[1, 2, 3, 5, 10].map((t) => (
                  <Button
                    key={t}
                    size="sm"
                    variant={turns === String(t) ? "default" : "outline"}
                    className="h-7 w-7 p-0 text-xs"
                    onClick={() => setTurns(String(t))}
                  >
                    {t}
                  </Button>
                ))}
                <Input
                  type="number"
                  min={1}
                  value={turns}
                  onChange={(e) => setTurns(e.target.value)}
                  placeholder="?"
                  className="h-7 w-12 text-xs text-center"
                />
              </div>
              
              {/* Ações */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="h-8 flex-1"
                  onClick={() => handleAdd(false)}
                  disabled={!turns || parseInt(turns) < 1}
                >
                  <Timer className="w-3 h-3 mr-1" />
                  Adicionar ({turns || '?'} turnos)
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8"
                  onClick={() => handleAdd(true)}
                >
                  ∞
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setShowTurnsInput(false);
                    setTurns('');
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
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

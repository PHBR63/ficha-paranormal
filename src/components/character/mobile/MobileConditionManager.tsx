/**
 * MobileConditionManager - Gerenciador de condições otimizado para mobile
 * Permite adicionar, remover e editar condições com swipe e contadores
 */

import { useState, useCallback, useMemo, memo } from 'react';
import { ConditionTurnResolver, type PrepareTurnApplication } from '../ConditionTurnResolver';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MobileButtonGroup } from '@/components/ui/mobile-button-group';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomScroll } from '@/components/ui/custom-scroll';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Plus,
  Minus,
  X,
  Timer,
  Skull,
  Play,
  Search,
  ChevronRight,
  Trash2,
  Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  CONDITIONS, 
  CONDITION_CATEGORIES, 
  type ConditionParams,
  DAMAGE_TYPES,
  conditionRequiresParams,
  getConditionEffectWithParams,
} from '@/lib/conditions';
import { toast } from 'sonner';
import { useConditionMutation } from '@/hooks/character/useConditionMutation';
import { getConditionPresentation } from '@/lib/conditions/condition-identity';
import { DyingTimer } from '../ConditionTimer';

// Interface para condição ativa
export interface ActiveCondition {
  id: string;
  name: string;
  turnsRemaining: number | null;
  addedAt: Date | string;
  dyingCounter?: number;
  params?: ConditionParams;
}

interface MobileConditionManagerProps {
  conditions: ActiveCondition[];
  onConditionsChange: (conditions: ActiveCondition[]) => void | Promise<void>;
  vigor?: number;
  prepareTurnApplication?: PrepareTurnApplication;
  characterName?: string;
  onDamageFromCondition?: (damage: number, isVerdadeiro: boolean) => void;
  onCharacterDeath?: () => void;
  className?: string;
}

// Labels de categoria
const CATEGORY_LABELS: Record<string, string> = {
  combat: 'Combate',
  sensory: 'Sensoriais',
  mental: 'Mentais',
  physical: 'Físicas',
  critical: 'Críticas',
};

// Card de condição ativa com swipe para remover
const ConditionCard = memo(function ConditionCard({
  condition,
  onRemove,
  onIncreaseTurns,
  onDecreaseTurns,
  onReduceDyingCounter,
}: {
  condition: ActiveCondition;
  onRemove: () => void;
  onIncreaseTurns: () => void;
  onDecreaseTurns: () => void;
  onReduceDyingCounter?: () => void;
}) {
  const [dragX, setDragX] = useState(0);
  const conditionData = getConditionPresentation(condition.id, condition.name);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -100) {
      if ('vibrate' in navigator) navigator.vibrate(30);
      onRemove();
    }
    setDragX(0);
  };

  const isMorrendo = condition.id === 'morrendo';
  const showDyingCounter = isMorrendo && condition.dyingCounter !== undefined;

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Background de deleção */}
      <div className={cn(
        "absolute inset-y-0 right-0 w-24 flex items-center justify-end pr-4",
        "bg-destructive/80 transition-opacity",
        dragX < -50 ? "opacity-100" : "opacity-0"
      )}>
        <Trash2 className="w-5 h-5 text-destructive-foreground" />
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        onDrag={(_, info) => setDragX(info.offset.x)}
        onDragEnd={handleDragEnd}
        animate={{ x: 0 }}
        className={cn(
          "relative p-3 bg-secondary/50 border border-border rounded-lg",
          isMorrendo && "border-destructive/50 bg-destructive/10"
        )}
      >
        <div className="flex items-start gap-3">
          {/* Ícone e nome */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg">{conditionData.icon}</span>
              <span className="font-medium text-sm break-words">{conditionData.name}</span>
              
              {/* Timer de morrendo */}
              {showDyingCounter && (
                <DyingTimer counter={condition.dyingCounter!} className="ml-1" />
              )}
              
              {/* Turnos restantes */}
              {condition.turnsRemaining !== null && !isMorrendo && (
                <Badge variant="outline" className="text-[10px] shrink-0">
                  <Timer className="w-3 h-3 mr-1" />
                  {condition.turnsRemaining}
                </Badge>
              )}
            </div>
            
            {/* Regras ativas precisam ser legíveis por toque, sem depender de tooltip ou corte de linhas. */}
            <p className="text-xs text-muted-foreground mt-1 break-words">
              {CONDITIONS[condition.id] ? getConditionEffectWithParams(condition.id, condition.params) : conditionData.effect}
            </p>
            {!CONDITIONS[condition.id] && condition.params?.customEffect && (
              <p className="text-xs text-muted-foreground mt-1">{condition.params.customEffect}</p>
            )}
            
            {/* Parâmetros especiais */}
            {condition.params && (
              <div className="flex items-center gap-1 mt-1 text-[10px] text-primary/70">
                {condition.id === 'fragilizado' && condition.params.damageType && (
                  <span>Vulnerável: {DAMAGE_TYPES.find(d => d.id === condition.params?.damageType)?.name}</span>
                )}
                {condition.id === 'machucado' && condition.params.weaponMaxDamage && (
                  <span>Dano: {condition.params.weaponMaxDamage}</span>
                )}
                {condition.id === 'envenenado' && condition.params.poisonDamage && (
                  <span>{condition.params.poisonDamage}/turno</span>
                )}
              </div>
            )}
          </div>

          {/* Controles */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Controle de morrendo */}
            {showDyingCounter && onReduceDyingCounter && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={onReduceDyingCounter}
                aria-label={`Reduzir contador de morte de ${condition.name}`}
              >
                <Skull className="h-4 w-4" />
              </Button>
            )}
            
            {/* Controles de turno */}
            {condition.turnsRemaining !== null && !isMorrendo && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onDecreaseTurns}
                  aria-label={`Reduzir duração de ${condition.name}`}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onIncreaseTurns}
                  aria-label={`Aumentar duração de ${condition.name}`}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </>
            )}
            
            {/* Remover */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={onRemove}
              aria-label={`Remover condição ${condition.name}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

// Modal de adicionar condição
function AddConditionSheet({
  open,
  onOpenChange,
  onAdd,
  existingConditions,
  isSaving,
  saveError,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (conditionId: string, turns: number | null, params?: ConditionParams) => Promise<boolean>;
  isSaving: boolean;
  saveError: string | null;
  existingConditions: string[];
}) {
  const [search, setSearch] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [turns, setTurns] = useState<string>('');
  const [params, setParams] = useState<ConditionParams>({});

  // Filtra condições
  const filteredConditions = useMemo(() => {
    return Object.entries(CONDITIONS).filter(([id, condition]) => {
      if (existingConditions.includes(id)) return false;
      if (!search) return true;
      const query = search.toLowerCase();
      return (
        condition.name.toLowerCase().includes(query) ||
        condition.description.toLowerCase().includes(query)
      );
    });
  }, [search, existingConditions]);

  // Agrupa por categoria
  const groupedConditions = useMemo(() => {
    const groups: Record<string, typeof filteredConditions> = {};
    for (const [id, condition] of filteredConditions) {
      for (const [category, ids] of Object.entries(CONDITION_CATEGORIES)) {
        if (ids.includes(id)) {
          if (!groups[category]) groups[category] = [];
          groups[category].push([id, condition]);
          break;
        }
      }
    }
    return groups;
  }, [filteredConditions]);

  const handleAdd = async () => {
    if (!selectedCondition) return;
    const turnsNum = turns ? parseInt(turns) : null;
    if (!await onAdd(selectedCondition, turnsNum, Object.keys(params).length > 0 ? params : undefined)) return;
    setSelectedCondition(null);
    setTurns('');
    setParams({});
    onOpenChange(false);
  };

  const needsParams = selectedCondition ? conditionRequiresParams(selectedCondition) : false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh]">
        <fieldset disabled={isSaving} className="border-0 min-w-0">
          {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
          {isSaving && <p role="status" className="text-xs">Salvando condições...</p>}
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Adicionar Condição
          </SheetTitle>
        </SheetHeader>

        {/* Busca */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar condição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {selectedCondition ? (
          // Configuração da condição selecionada
          <div className="space-y-4">
            <div className="p-4 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{CONDITIONS[selectedCondition]?.icon}</span>
                <h4 className="font-medium">{CONDITIONS[selectedCondition]?.name}</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {CONDITIONS[selectedCondition]?.effect}
              </p>
            </div>

            {/* Duração */}
            <div className="space-y-2">
              <Label>Duração (turnos)</Label>
              <Input
                type="number"
                placeholder="Deixe vazio para permanente"
                value={turns}
                onChange={(e) => setTurns(e.target.value)}
                min={1}
              />
            </div>

            {/* Parâmetros específicos */}
            {needsParams && selectedCondition === 'fragilizado' && (
              <div className="space-y-2">
                <Label>Tipo de Dano</Label>
                <Select
                  value={params.damageType || ''}
                  onValueChange={(v) => setParams({ ...params, damageType: v as ConditionParams['damageType'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAMAGE_TYPES.map(dt => (
                      <SelectItem key={dt.id} value={dt.id}>{dt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {needsParams && selectedCondition === 'machucado' && (
              <div className="space-y-2">
                <Label>Dano por Ação</Label>
                <Input
                  type="number"
                  placeholder="Ex: 6"
                  value={params.weaponMaxDamage || ''}
                  onChange={(e) => setParams({ ...params, weaponMaxDamage: parseInt(e.target.value) })}
                  min={1}
                />
              </div>
            )}

            {needsParams && selectedCondition === 'envenenado' && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Dano/turno</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 2d6"
                    value={params.poisonDamage || ''}
                    onChange={(e) => setParams({ ...params, poisonDamage: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>DT Fortitude</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 15"
                    value={params.poisonDT || ''}
                    onChange={(e) => setParams({ ...params, poisonDT: parseInt(e.target.value) })}
                    min={1}
                  />
                </div>
              </div>
            )}

            <div className="pt-4">
              <MobileButtonGroup
                buttons={[
                  {
                    id: 'back',
                    label: 'Voltar',
                    onClick: () => setSelectedCondition(null),
                    variant: 'outline',
                    type: 'secondary',
                  },
                  {
                    id: 'add',
                    label: 'Adicionar',
                    icon: <Plus />,
                    onClick: handleAdd,
                    type: 'secondary',
                  },
                ]}
              />
            </div>
          </div>
        ) : (
          // Lista de condições
          <CustomScroll maxHeight="calc(85vh - 180px)">
            <div className="space-y-4 pr-4">
              {Object.entries(groupedConditions).map(([category, conditions]) => (
                <div key={category}>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                    {CATEGORY_LABELS[category]}
                  </h4>
                  <div className="space-y-1">
                    {conditions.map(([id, condition]) => (
                      <button
                        key={id}
                        className="w-full p-3 bg-secondary/30 rounded-lg border border-border text-left hover:bg-secondary/50 active:bg-secondary/70 transition-colors flex items-center gap-3"
                        onClick={() => setSelectedCondition(id)}
                      >
                        <span className="text-lg">{condition.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm">{condition.name}</span>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{condition.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              {filteredConditions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma condição encontrada</p>
                </div>
              )}
            </div>
          </CustomScroll>
        )}
      </fieldset>
      </SheetContent>
    </Sheet>
  );
}

// Componente principal
export const MobileConditionManager = memo(function MobileConditionManager({
  conditions,
  onConditionsChange,
  characterName = 'Personagem',
  vigor,
  prepareTurnApplication,
  onCharacterDeath,
  className,
}: MobileConditionManagerProps) {
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const { saveConditions, isSaving, saveError } = useConditionMutation(onConditionsChange);

  // Adicionar condição
  const handleAddCondition = useCallback(async (conditionId: string, turns: number | null, params?: ConditionParams) => {
    const conditionData = CONDITIONS[conditionId];
    if (!conditionData) return false;

    const newCondition: ActiveCondition = {
      id: conditionId,
      name: conditionData.name,
      turnsRemaining: turns,
      addedAt: new Date().toISOString(),
      params,
    };

    if (conditionId === 'morrendo') {
      newCondition.dyingCounter = 3;

    }

    if ('vibrate' in navigator) navigator.vibrate(30);
    if (!await saveConditions([...conditions, newCondition])) return false;
    if (conditionId === 'morrendo') toast.error('Morrendo registrado. Confira os três inícios de turno cumulativos na cena com o mestre.', { duration: 5000 });
    toast.success(`${conditionData.icon} ${conditionData.name} adicionada`);
    return true;
  }, [conditions, saveConditions]);

  // Remover condição
  const handleRemoveCondition = useCallback(async (conditionId: string) => {
    const condition = CONDITIONS[conditionId];
    if (!await saveConditions(conditions.filter(c => c.id !== conditionId))) return false;
    toast.info(`${condition?.icon || '❌'} ${condition?.name || conditionId} removida`);
  }, [conditions, saveConditions]);

  // Controles de turno
  const handleIncreaseTurns = useCallback(async (conditionId: string) => {
    if (!await saveConditions(conditions.map(c =>
      c.id === conditionId ? { ...c, turnsRemaining: (c.turnsRemaining || 0) + 1 } : c
    ))) return false;
  }, [conditions, saveConditions]);

  const handleDecreaseTurns = useCallback(async (conditionId: string) => {
    if (!await saveConditions(
      conditions.map(c => {
        if (c.id !== conditionId || c.turnsRemaining === null) return c;
        const newTurns = c.turnsRemaining - 1;
        return { ...c, turnsRemaining: newTurns };
      }).filter(c => c.turnsRemaining === null || c.turnsRemaining > 0)
    )) return false;
  }, [conditions, saveConditions]);

  // Reduzir contador de morrendo
  const handleReduceDyingCounter = useCallback(async (conditionId: string) => {
    const morrendoCondition = conditions.find(c => c.id === 'morrendo');
    if (!morrendoCondition || morrendoCondition.dyingCounter === undefined) return;

    const newCounter = Math.max(0, morrendoCondition.dyingCounter - 1);
    

    if (!await saveConditions(
      conditions.map(c => c.id === 'morrendo' ? { ...c, dyingCounter: newCounter } : c)
    )) return false;
    toast.warning(newCounter === 0 ? 'Contagem registrada. Confira morte e turnos cumulativos da cena com o mestre.' : `Morrendo: ${newCounter} inícios de turno restantes na contagem manual.`);
  }, [conditions, saveConditions, onCharacterDeath]);

  const existingConditionIds = useMemo(() => conditions.map(c => c.id), [conditions]);
  const hasMorrendo = conditions.some(c => c.id === 'morrendo');
  const hasStartOfTurnEffects = conditions.some(c => 
    ['sangrando', 'envenenado', 'em-chamas', 'morrendo', 'enlouquecendo'].includes(c.id)
  );

  return (
    <fieldset disabled={isSaving} className={cn("ordo-panel min-w-0", className)}>
      {saveError && <p role="alert" className="p-3 text-sm text-destructive">{saveError}</p>}
      {isSaving && <p role="status" className="p-3 text-xs">Salvando condições...</p>}
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <span className="text-sm font-medium">Condições</span>
          {conditions.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {conditions.length}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setAddSheetOpen(true)}
            aria-label="Adicionar condição"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {hasStartOfTurnEffects && <div className="p-3"><ConditionTurnResolver conditions={conditions} vigor={vigor} prepareApplication={prepareTurnApplication} /></div>}

      {/* Lista de condições */}
      <div className="p-3 space-y-2">
        {hasStartOfTurnEffects && <p className="text-xs text-muted-foreground">Confira testes de resistência e dano com o mestre antes de processar o início de turno. O cálculo destes efeitos requer conferência manual.</p>}
        {conditions.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <Heart className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p>Nenhuma condição ativa</p>
            <p className="text-[10px]">Deslize para a esquerda para remover</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {conditions.map((condition) => (
              <motion.div
                key={condition.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100, height: 0 }}
              >
                <ConditionCard
                  condition={condition}
                  onRemove={() => handleRemoveCondition(condition.id)}
                  onIncreaseTurns={() => handleIncreaseTurns(condition.id)}
                  onDecreaseTurns={() => handleDecreaseTurns(condition.id)}
                  onReduceDyingCounter={
                    condition.id === 'morrendo' 
                      ? () => handleReduceDyingCounter(condition.id) 
                      : undefined
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Modal de adicionar */}
      <AddConditionSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        onAdd={handleAddCondition}
        existingConditions={existingConditionIds}
        isSaving={isSaving}
        saveError={saveError}
      />
    </fieldset>
  );
});

export default MobileConditionManager;

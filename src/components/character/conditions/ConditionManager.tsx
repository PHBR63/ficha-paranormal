/**
 * ConditionManager - Gerenciador completo de condições do personagem
 * 
 * Permite adicionar, remover e gerenciar condições ativas.
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertTriangle,
  Plus,
  Search,
  Trash2,
  Timer,
  Infinity,
  Clock,
  Sparkles,
  Shield,
  Skull,
  Settings,
  X,
} from '@/components/icons/ordem-icons';
import { 
  CONDITIONS_BY_CATEGORY, 
  CATEGORY_LABELS, 
  searchConditions,
  type ConditionCategory,
  type ConditionDefinition,
} from '@/lib/conditions-data';
import { ConditionBadges } from './ConditionBadges';
import type { ActiveCondition, AddConditionData } from '@/hooks/character/useConditions';

interface ConditionManagerProps {
  conditions: ActiveCondition[];
  onAdd: (data: AddConditionData) => Promise<any>;
  onRemove: (conditionId: string) => Promise<boolean>;
  onUpdate: (conditionId: string, updates: Partial<ActiveCondition>) => Promise<boolean>;
  onDecrementDuration: (conditionId: string) => Promise<boolean>;
  onClearAll?: () => Promise<boolean>;
  isMaster?: boolean;
  className?: string;
}

export function ConditionManager({
  conditions,
  onAdd,
  onRemove,
  onUpdate,
  onDecrementDuration,
  onClearAll,
  isMaster = false,
  className,
}: ConditionManagerProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ConditionCategory | 'all'>('all');

  // Filtrar condições para adicionar
  const filteredConditions = useMemo(() => {
    let results = searchQuery 
      ? searchConditions(searchQuery)
      : selectedCategory === 'all'
        ? Object.values(CONDITIONS_BY_CATEGORY).flat()
        : CONDITIONS_BY_CATEGORY[selectedCategory] || [];
    
    return results;
  }, [searchQuery, selectedCategory]);

  // Agrupar condições ativas por tipo
  const groupedConditions = useMemo(() => ({
    debuffs: conditions.filter(c => c.condition_type === 'debuff' || c.condition_type === 'condition'),
    buffs: conditions.filter(c => c.condition_type === 'buff'),
    effects: conditions.filter(c => c.condition_type === 'effect'),
  }), [conditions]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary" />
          <h3 className="font-medium">Condições</h3>
          {conditions.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {conditions.length}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Botão limpar tudo */}
          {conditions.length > 0 && onClearAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onClearAll()}
              className="text-xs text-muted-foreground"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Limpar
            </Button>
          )}

          {/* Dialog para adicionar */}
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Adicionar Condição</DialogTitle>
                <DialogDescription>
                  Selecione uma condição do sistema ou crie uma personalizada.
                </DialogDescription>
              </DialogHeader>

              <AddConditionContent
                conditions={filteredConditions}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                onAdd={async (data) => {
                  await onAdd(data);
                  setAddDialogOpen(false);
                  setSearchQuery('');
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista de condições ativas */}
      {conditions.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma condição ativa</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Condições/Debuffs */}
          {groupedConditions.debuffs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Skull className="w-3 h-3" />
                <span>Condições</span>
              </div>
              <ConditionBadges
                conditions={groupedConditions.debuffs}
                onRemove={onRemove}
              />
            </div>
          )}

          {/* Buffs */}
          {groupedConditions.buffs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3" />
                <span>Bônus</span>
              </div>
              <ConditionBadges
                conditions={groupedConditions.buffs}
                onRemove={onRemove}
              />
            </div>
          )}

          {/* Efeitos */}
          {groupedConditions.effects.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-3 h-3" />
                <span>Efeitos</span>
              </div>
              <ConditionBadges
                conditions={groupedConditions.effects}
                onRemove={onRemove}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Conteúdo do dialog de adicionar condição
 */
function AddConditionContent({
  conditions,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onAdd,
}: {
  conditions: ConditionDefinition[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: ConditionCategory | 'all';
  onCategoryChange: (category: ConditionCategory | 'all') => void;
  onAdd: (data: AddConditionData) => Promise<void>;
}) {
  const [selectedCondition, setSelectedCondition] = useState<ConditionDefinition | null>(null);
  const [durationType, setDurationType] = useState<AddConditionData['durationType']>('rounds');
  const [durationRounds, setDurationRounds] = useState(1);
  const [sourceName, setSourceName] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEffect, setCustomEffect] = useState('');
  
  // Handler estável para Select do Radix (evita loop #185)
  const handleDurationTypeChange = useCallback((value: string) => {
    setDurationType(value as AddConditionData['durationType']);
  }, []);

  const handleAdd = async () => {
    if (isCustom && !customName.trim()) return;
    if (!isCustom && !selectedCondition) return;

    await onAdd({
      conditionId: isCustom ? 'custom' : selectedCondition!.id,
      customName: isCustom ? customName : undefined,
      customEffect: isCustom ? customEffect : undefined,
      durationType,
      durationRounds: durationType === 'rounds' ? durationRounds : undefined,
      sourceName: sourceName || undefined,
      conditionType: 'condition',
    });
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col gap-4">
      <Tabs defaultValue="predefined" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="predefined" onClick={() => setIsCustom(false)}>
            Predefinidas
          </TabsTrigger>
          <TabsTrigger value="custom" onClick={() => setIsCustom(true)}>
            Personalizada
          </TabsTrigger>
        </TabsList>

        {/* Condições predefinidas */}
        <TabsContent value="predefined" className="flex-1 overflow-hidden flex flex-col">
          {/* Busca */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar condição..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filtro por categoria */}
          <div className="flex flex-wrap gap-1 mb-3">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => onCategoryChange('all')}
            >
              Todas
            </Button>
            {(Object.keys(CATEGORY_LABELS) as ConditionCategory[]).map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => onCategoryChange(cat)}
              >
                {CATEGORY_LABELS[cat]}
              </Button>
            ))}
          </div>

          {/* Lista de condições */}
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 gap-2 pr-4">
              {conditions.map((condition) => (
                <button
                  key={condition.id}
                  onClick={() => setSelectedCondition(condition)}
                  className={cn(
                    'p-2 rounded-lg border text-left transition-colors',
                    selectedCondition?.id === condition.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <p className="font-medium text-sm">{condition.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {condition.mechanicalEffect}
                  </p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Condição personalizada */}
        <TabsContent value="custom" className="space-y-3">
          <div className="space-y-2">
            <Label>Nome da Condição</Label>
            <Input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Ex: Maldição do Sangue"
            />
          </div>

          <div className="space-y-2">
            <Label>Efeito Mecânico</Label>
            <Input
              value={customEffect}
              onChange={(e) => setCustomEffect(e.target.value)}
              placeholder="Ex: -2 em todos os testes"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Configurações de duração */}
      <div className="space-y-3 pt-3 border-t border-border">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Duração</Label>
            <Select value={durationType} onValueChange={handleDurationTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rounds">
                  <div className="flex items-center gap-2">
                    <Timer className="w-3.5 h-3.5" />
                    Rodadas
                  </div>
                </SelectItem>
                <SelectItem value="scene">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Cena
                  </div>
                </SelectItem>
                <SelectItem value="permanent">
                  <div className="flex items-center gap-2">
                    <Infinity className="w-3.5 h-3.5" />
                    Permanente
                  </div>
                </SelectItem>
                <SelectItem value="until_rest">Até descanso</SelectItem>
                <SelectItem value="until_end_of_turn">Fim do turno</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {durationType === 'rounds' && (
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={1}
                max={99}
                value={durationRounds}
                onChange={(e) => setDurationRounds(parseInt(e.target.value) || 1)}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Fonte (opcional)</Label>
          <Input
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            placeholder="Ex: Ritual Medo, Poder de Classe..."
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          onClick={handleAdd}
          disabled={(!isCustom && !selectedCondition) || (isCustom && !customName.trim())}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar Condição
        </Button>
      </DialogFooter>
    </div>
  );
}

/**
 * Botão compacto para adicionar condição rápida
 */
export function QuickAddConditionButton({
  onAdd,
  className,
}: {
  onAdd: (data: AddConditionData) => Promise<any>;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn('gap-1', className)}>
          <Plus className="w-3.5 h-3.5" />
          Condição
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <QuickConditionPicker onAdd={onAdd} />
      </PopoverContent>
    </Popover>
  );
}

/**
 * Picker rápido de condições comuns
 */
function QuickConditionPicker({
  onAdd,
}: {
  onAdd: (data: AddConditionData) => Promise<any>;
}) {
  const commonConditions = [
    'abalado', 'desprevenido', 'caido', 'cego', 
    'atordoado', 'sangrando', 'envenenado', 'lento'
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Condições Comuns</p>
      <div className="grid grid-cols-2 gap-2">
        {commonConditions.map((id) => {
          const condition = CONDITIONS_BY_CATEGORY.mental.find(c => c.id === id) ||
            CONDITIONS_BY_CATEGORY.physical.find(c => c.id === id) ||
            CONDITIONS_BY_CATEGORY.movement.find(c => c.id === id) ||
            CONDITIONS_BY_CATEGORY.combat.find(c => c.id === id) ||
            CONDITIONS_BY_CATEGORY.special.find(c => c.id === id);
          
          if (!condition) return null;

          return (
            <Button
              key={id}
              variant="outline"
              size="sm"
              className="justify-start text-xs"
              onClick={() => onAdd({
                conditionId: id,
                durationType: 'permanent',
              })}
            >
              {condition.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

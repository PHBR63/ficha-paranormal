import { useState, useMemo } from 'react';
import { 
  Package, 
  Weight, 
  Plus, 
  Trash2, 
  AlertTriangle,
  Sword,
  Shield,
  FlaskConical,
  Scroll,
  Gem,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Boxes
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  InventoryItem,
  getLoadStatus,
  getPatentLimits,
  countItemsByCategory,
  PATENT_LIMITS,
  addToInventory,
  removeFromInventory,
} from '@/lib/inventory-system';

// Categorias de itens para organização visual
export type ItemType = 'weapon' | 'armor' | 'consumable' | 'ritual' | 'valuable' | 'misc';

const ITEM_TYPE_CONFIG: Record<ItemType, { label: string; icon: typeof Package; color: string }> = {
  weapon: { label: 'Armas', icon: Sword, color: 'text-destructive' },
  armor: { label: 'Proteções', icon: Shield, color: 'text-secondary' },
  consumable: { label: 'Consumíveis', icon: FlaskConical, color: 'text-green-400' },
  ritual: { label: 'Componentes Rituais', icon: Scroll, color: 'text-paranormal' },
  valuable: { label: 'Itens Valiosos', icon: Gem, color: 'text-yellow-400' },
  misc: { label: 'Diversos', icon: MoreHorizontal, color: 'text-muted-foreground' },
};

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  '0': { label: 'Sem Cat.', color: 'bg-muted text-muted-foreground' },
  'I': { label: 'Cat. I', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
  'II': { label: 'Cat. II', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
  'III': { label: 'Cat. III', color: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
  'IV': { label: 'Cat. IV', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
};

interface ExtendedInventoryItem extends InventoryItem {
  itemType?: ItemType;
}

interface InventoryPanelProps {
  inventory: ExtendedInventoryItem[];
  strength: number;
  patent: string;
  onInventoryChange?: (newInventory: ExtendedInventoryItem[]) => void;
  readOnly?: boolean;
}

export function InventoryPanel({
  inventory,
  strength,
  patent,
  onInventoryChange,
  readOnly = false,
}: InventoryPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<ItemType>>(new Set(['weapon', 'armor', 'consumable']));
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<ExtendedInventoryItem>>({
    name: '',
    category: '0',
    slots: 1,
    quantity: 1,
    itemType: 'misc',
  });

  // Calcular status de carga
  const loadStatus = useMemo(() => getLoadStatus(inventory, strength), [inventory, strength]);
  const patentLimits = useMemo(() => getPatentLimits(patent), [patent]);

  // Agrupar itens por tipo
  const groupedItems = useMemo(() => {
    const groups: Record<ItemType, ExtendedInventoryItem[]> = {
      weapon: [],
      armor: [],
      consumable: [],
      ritual: [],
      valuable: [],
      misc: [],
    };

    inventory.forEach(item => {
      const type = item.itemType || 'misc';
      groups[type].push(item);
    });

    return groups;
  }, [inventory]);

  // Contagem por categoria de patente
  const categoryCounts = useMemo(() => ({
    I: countItemsByCategory(inventory, 'I'),
    II: countItemsByCategory(inventory, 'II'),
    III: countItemsByCategory(inventory, 'III'),
    IV: countItemsByCategory(inventory, 'IV'),
  }), [inventory]);

  const toggleCategory = (type: ItemType) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAddItem = () => {
    if (!newItem.name || !onInventoryChange) return;

    const item: ExtendedInventoryItem = {
      id: crypto.randomUUID(),
      name: newItem.name,
      category: (newItem.category as InventoryItem['category']) || '0',
      slots: newItem.slots || 1,
      quantity: newItem.quantity || 1,
      itemType: newItem.itemType || 'misc',
      description: newItem.description,
    };

    const result = addToInventory(inventory, item, patent);
    
    if (result.success) {
      onInventoryChange(result.newInventory.map(i => ({
        ...i,
        itemType: (i as ExtendedInventoryItem).itemType || 'misc',
      })));
      setNewItem({ name: '', category: '0', slots: 1, quantity: 1, itemType: 'misc' });
      setAddDialogOpen(false);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    if (!onInventoryChange) return;
    const newInventory = removeFromInventory(inventory, itemId);
    onInventoryChange(newInventory.map(i => ({
      ...i,
      itemType: (i as ExtendedInventoryItem).itemType || 'misc',
    })));
  };

  const loadPercentage = (loadStatus.currentLoad / loadStatus.maxCapacity) * 100;
  const loadColor = loadStatus.isOverloaded 
    ? 'text-destructive' 
    : loadPercentage > 75 
      ? 'text-yellow-400' 
      : 'text-secondary';

  return (
    <div className="space-y-4">
      {/* Header com Peso e Limites */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm tracking-wider text-primary flex items-center gap-2">
          <Package className="w-4 h-4" />
          INVENTÁRIO
        </h3>
        {!readOnly && (
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="font-display text-xs">
                <Plus className="w-3 h-3 mr-1" />
                ADICIONAR
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">Adicionar Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-xs text-muted-foreground">Nome do Item</label>
                  <Input
                    value={newItem.name || ''}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="Ex: Espingarda Tática"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Tipo</label>
                    <Select
                      value={newItem.itemType}
                      onValueChange={(v) => setNewItem({ ...newItem, itemType: v as ItemType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ITEM_TYPE_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <config.icon className={cn("w-3 h-3", config.color)} />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Categoria</label>
                    <Select
                      value={newItem.category}
                      onValueChange={(v) => setNewItem({ ...newItem, category: v as InventoryItem['category'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Sem Categoria</SelectItem>
                        <SelectItem value="I">Categoria I</SelectItem>
                        <SelectItem value="II">Categoria II</SelectItem>
                        <SelectItem value="III">Categoria III</SelectItem>
                        <SelectItem value="IV">Categoria IV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Espaços</label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={newItem.slots || 1}
                      onChange={(e) => setNewItem({ ...newItem, slots: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Quantidade</label>
                    <Input
                      type="number"
                      min={1}
                      value={newItem.quantity || 1}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
                <Button onClick={handleAddItem} className="w-full font-display">
                  ADICIONAR AO INVENTÁRIO
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Barra de Carga */}
      <div className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Weight className={cn("w-4 h-4", loadColor)} />
            <span className="text-muted-foreground">Carga</span>
          </div>
          <span className={cn("font-display", loadColor)}>
            {loadStatus.currentLoad} / {loadStatus.maxCapacity}
          </span>
        </div>
        <Progress 
          value={Math.min(loadPercentage, 100)} 
          className={cn(
            "h-2",
            loadStatus.isOverloaded && "bg-destructive/20"
          )}
        />
        {loadStatus.isOverloaded && (
          <div className="flex items-center gap-2 text-xs text-destructive mt-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Sobrecarregado! -5 FOR/AGI/VIG, -3m deslocamento</span>
          </div>
        )}
      </div>

      {/* Limites por Categoria (Patente) */}
      <div className="grid grid-cols-4 gap-2">
        {(['I', 'II', 'III', 'IV'] as const).map((cat: 'I' | 'II' | 'III' | 'IV') => {
          const count = categoryCounts[cat];
          const limit = patentLimits[cat];
          const isAtLimit = count >= limit;
          const config = CATEGORY_LABELS[cat];

          return (
            <div 
              key={cat}
              className={cn(
                "p-2 rounded-lg border text-center",
                config.color,
                isAtLimit && limit > 0 && "border-yellow-500/50 bg-yellow-500/10"
              )}
            >
              <p className="text-[10px] opacity-70">{config.label}</p>
              <p className="font-display text-lg">
                {count}/{limit}
              </p>
            </div>
          );
        })}
      </div>

      {/* Lista de Itens Agrupados */}
      <div className="space-y-2">
        {Object.entries(ITEM_TYPE_CONFIG).map(([type, config]) => {
          const items = groupedItems[type as ItemType];
          if (items.length === 0) return null;

          const isExpanded = expandedCategories.has(type as ItemType);
          const Icon = config.icon;

          return (
            <Collapsible 
              key={type} 
              open={isExpanded} 
              onOpenChange={() => toggleCategory(type as ItemType)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/30 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-4 h-4", config.color)} />
                    <span className="font-display text-sm">{config.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {items.length}
                    </Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                {items.map((item) => (
                  <InventoryItemRow
                    key={item.id}
                    item={item}
                    onRemove={!readOnly ? handleRemoveItem : undefined}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        {inventory.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Boxes className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Inventário vazio</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface InventoryItemRowProps {
  item: ExtendedInventoryItem;
  onRemove?: (id: string) => void;
}

function InventoryItemRow({ item, onRemove }: InventoryItemRowProps) {
  const categoryConfig = CATEGORY_LABELS[item.category] || CATEGORY_LABELS['0'];

  return (
    <div className="flex items-center justify-between p-3 bg-card/50 border border-border/30 rounded-lg ml-4 group hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{item.name}</span>
            {item.quantity > 1 && (
              <Badge variant="outline" className="text-xs">
                x{item.quantity}
              </Badge>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {item.description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge 
          variant="outline" 
          className={cn("text-[10px] border", categoryConfig.color)}
        >
          {categoryConfig.label}
        </Badge>
        <span className="text-xs text-muted-foreground px-2 py-1 bg-muted/50 rounded">
          {item.slots * item.quantity} esp.
        </span>
        {onRemove && (
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

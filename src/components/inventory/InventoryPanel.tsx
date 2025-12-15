/**
 * InventoryPanel - Painel de inventário com validação por patente
 * 
 * Funcionalidades:
 * - Validação automática de limites por categoria/patente
 * - Indicador visual de slots disponíveis
 * - Bloqueio de adição quando limite atingido
 * - Sistema de carga com penalidades
 */

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
  Boxes,
  CircleCheck,
  Circle,
  Lock,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  InventoryItem,
  getLoadStatus,
  getPatentLimits,
  countItemsByCategory,
  addToInventory,
  removeFromInventory,
  canAddItem,
  PATENT_LIMITS,
} from '@/lib/inventory-system';
import { EquipmentSlots, EquipmentSlotType, EQUIPMENT_SLOTS, getAppropriateSlot } from './EquipmentSlots';
import { WeaponCatalogModal } from './WeaponCatalogModal';
import { ArmorCatalogModal } from './ArmorCatalogModal';
import { ItemCatalogModal } from './ItemCatalogModal';
import type { CatalogWeapon } from '@/lib/weapons-catalog';
import type { CatalogArmor } from '@/lib/armor-catalog';
import type { CatalogItem } from '@/lib/items-catalog';

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

export interface ExtendedInventoryItem extends InventoryItem {
  itemType?: ItemType;
  equipSlot?: EquipmentSlotType;
}

interface InventoryPanelProps {
  inventory: ExtendedInventoryItem[];
  strength: number;
  patent: string;
  onInventoryChange?: (newInventory: ExtendedInventoryItem[]) => void;
  readOnly?: boolean;
  showEquipment?: boolean;
}

export function InventoryPanel({
  inventory,
  strength,
  patent,
  onInventoryChange,
  readOnly = false,
  showEquipment = true,
}: InventoryPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<ItemType>>(new Set(['weapon', 'armor', 'consumable']));
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [weaponCatalogOpen, setWeaponCatalogOpen] = useState(false);
  const [armorCatalogOpen, setArmorCatalogOpen] = useState(false);
  const [itemCatalogOpen, setItemCatalogOpen] = useState(false);
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

  // Mapear itens equipados por slot
  const equippedItems = useMemo(() => {
    const slots: Record<EquipmentSlotType, ExtendedInventoryItem | null> = {
      primary_weapon: null,
      secondary_weapon: null,
      armor: null,
      head: null,
      accessory_1: null,
      accessory_2: null,
    };

    inventory.forEach(item => {
      if (item.isEquipped && item.equipSlot) {
        slots[item.equipSlot] = item;
      }
    });

    return slots;
  }, [inventory]);

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

  // Toast para notificações
  const { toast } = useToast();

  // Verifica se pode adicionar item da categoria selecionada
  const canAddSelectedCategory = useMemo(() => {
    if (!newItem.category || newItem.category === '0') return { allowed: true };
    
    const mockItem: InventoryItem = {
      id: 'temp',
      name: 'temp',
      category: newItem.category as InventoryItem['category'],
      slots: 1,
      quantity: 1,
    };
    
    return canAddItem(mockItem, inventory, patent);
  }, [newItem.category, inventory, patent]);

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
        equipSlot: (i as ExtendedInventoryItem).equipSlot,
      })));
      setNewItem({ name: '', category: '0', slots: 1, quantity: 1, itemType: 'misc' });
      setAddDialogOpen(false);
      toast({
        title: 'Item adicionado',
        description: `${item.name} foi adicionado ao inventário.`,
      });
    } else {
      // Mostra erro de limite atingido
      toast({
        title: 'Limite de patente atingido',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    if (!onInventoryChange) return;
    const newInventory = removeFromInventory(inventory, itemId);
    onInventoryChange(newInventory.map(i => ({
      ...i,
      itemType: (i as ExtendedInventoryItem).itemType || 'misc',
      equipSlot: (i as ExtendedInventoryItem).equipSlot,
    })));
  };

  const handleEquipItem = (itemId: string) => {
    if (!onInventoryChange) return;

    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    // Encontrar slot apropriado
    const slot = getAppropriateSlot(item, equippedItems);
    if (!slot) return;

    const newInventory = inventory.map(i => ({
      ...i,
      isEquipped: i.id === itemId ? true : i.isEquipped,
      equipSlot: i.id === itemId ? slot : i.equipSlot,
    }));

    onInventoryChange(newInventory);
  };

  const handleUnequipItem = (itemId: string) => {
    if (!onInventoryChange) return;

    const newInventory = inventory.map(i => ({
      ...i,
      isEquipped: i.id === itemId ? false : i.isEquipped,
      equipSlot: i.id === itemId ? undefined : i.equipSlot,
    }));

    onInventoryChange(newInventory);
  };

  // Handler para adicionar arma do catálogo
  const handleAddWeaponFromCatalog = (weapon: CatalogWeapon) => {
    if (!onInventoryChange) return;

    const item: ExtendedInventoryItem = {
      id: crypto.randomUUID(),
      name: weapon.name,
      category: weapon.category,
      slots: weapon.spaces,
      quantity: 1,
      itemType: 'weapon',
      description: weapon.description,
      // Dados extras para o sistema de ataque
      damage: weapon.damage,
      damageType: weapon.damageType,
      critical: weapon.critical,
      criticalMultiplier: weapon.criticalMultiplier,
      range: weapon.range,
      special: weapon.special,
      ammoType: weapon.ammoType,
    } as ExtendedInventoryItem & { 
      damage?: string; 
      damageType?: string; 
      critical?: number; 
      criticalMultiplier?: number;
      range?: string;
      special?: string;
    };

    const result = addToInventory(inventory, item, patent);
    
    if (result.success) {
      onInventoryChange(result.newInventory.map(i => ({
        ...i,
        itemType: (i as ExtendedInventoryItem).itemType || 'misc',
        equipSlot: (i as ExtendedInventoryItem).equipSlot,
      })));
      setWeaponCatalogOpen(false);
      toast({
        title: 'Arma adicionada',
        description: `${weapon.name} foi adicionada ao inventário.`,
      });
    } else {
      toast({
        title: 'Limite de patente atingido',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  // Handler para adicionar proteção do catálogo
  const handleAddArmorFromCatalog = (armor: CatalogArmor) => {
    if (!onInventoryChange) return;

    const item: ExtendedInventoryItem = {
      id: crypto.randomUUID(),
      name: armor.name,
      category: armor.category,
      slots: armor.spaces,
      quantity: 1,
      itemType: 'armor',
      description: armor.description,
      // Dados extras para o sistema de proteção
      rd: armor.rd,
      agilityPenalty: armor.agilityPenalty,
      speedPenalty: armor.speedPenalty,
      armorType: armor.type,
      special: armor.special,
    } as ExtendedInventoryItem & { 
      rd?: number; 
      agilityPenalty?: number; 
      speedPenalty?: number;
      armorType?: string;
      special?: string;
    };

    const result = addToInventory(inventory, item, patent);
    
    if (result.success) {
      onInventoryChange(result.newInventory.map(i => ({
        ...i,
        itemType: (i as ExtendedInventoryItem).itemType || 'misc',
        equipSlot: (i as ExtendedInventoryItem).equipSlot,
      })));
      setArmorCatalogOpen(false);
      toast({
        title: 'Proteção adicionada',
        description: `${armor.name} foi adicionada ao inventário.`,
      });
    } else {
      toast({
        title: 'Limite de patente atingido',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  // Handler para adicionar item do catálogo de itens gerais
  const handleAddItemFromCatalog = (catalogItem: CatalogItem) => {
    if (!onInventoryChange) return;

    const item: ExtendedInventoryItem = {
      id: crypto.randomUUID(),
      name: catalogItem.name,
      category: catalogItem.category,
      slots: catalogItem.spaces,
      quantity: 1,
      itemType: 'consumable',
      description: catalogItem.description,
      // Dados extras para itens gerais
      effect: catalogItem.effect,
      uses: catalogItem.uses,
      maxUses: catalogItem.uses,
      consumable: catalogItem.consumable,
    } as ExtendedInventoryItem & { 
      effect?: string; 
      uses?: number;
      maxUses?: number;
      consumable?: boolean;
    };

    const result = addToInventory(inventory, item, patent);
    
    if (result.success) {
      onInventoryChange(result.newInventory.map(i => ({
        ...i,
        itemType: (i as ExtendedInventoryItem).itemType || 'misc',
        equipSlot: (i as ExtendedInventoryItem).equipSlot,
      })));
      setItemCatalogOpen(false);
      toast({
        title: 'Item adicionado',
        description: `${catalogItem.name} foi adicionado ao inventário.`,
      });
    } else {
      toast({
        title: 'Limite de patente atingido',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const canEquipItem = (item: ExtendedInventoryItem): boolean => {
    if (item.isEquipped) return false;
    const slot = getAppropriateSlot(item, equippedItems);
    return slot !== null;
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
          <div className="flex gap-2">
            {/* Botão Catálogo de Armas */}
            <Button 
              size="sm" 
              variant="outline" 
              className="font-display text-xs"
              onClick={() => setWeaponCatalogOpen(true)}
            >
              <Sword className="w-3 h-3 mr-1" />
              ARMAS
            </Button>
            {/* Botão Catálogo de Proteções */}
            <Button 
              size="sm" 
              variant="outline" 
              className="font-display text-xs"
              onClick={() => setArmorCatalogOpen(true)}
            >
              <Shield className="w-3 h-3 mr-1" />
              PROTEÇÕES
            </Button>
            {/* Botão Catálogo de Itens Gerais */}
            <Button 
              size="sm" 
              variant="outline" 
              className="font-display text-xs"
              onClick={() => setItemCatalogOpen(true)}
            >
              <Package className="w-3 h-3 mr-1" />
              ITENS
            </Button>
            {/* Botão Adicionar Item Manual */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="font-display text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  ITEM
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-popover">
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
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border z-50">
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
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border z-50">
                        <SelectItem value="0">Sem Categoria</SelectItem>
                        {(['I', 'II', 'III', 'IV'] as const).map(cat => {
                          const count = categoryCounts[cat];
                          const limit = patentLimits[cat];
                          const isAtLimit = count >= limit;
                          const isDisabled = limit === 0;
                          
                          return (
                            <SelectItem 
                              key={cat} 
                              value={cat}
                              disabled={isDisabled}
                              className={cn(
                                isAtLimit && !isDisabled && "text-destructive",
                                isDisabled && "opacity-50"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                {isDisabled ? (
                                  <Lock className="w-3 h-3 text-muted-foreground" />
                                ) : isAtLimit ? (
                                  <XCircle className="w-3 h-3 text-destructive" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                                )}
                                <span>Categoria {cat}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({count}/{limit})
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Aviso de limite atingido */}
                {!canAddSelectedCategory.allowed && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{canAddSelectedCategory.reason}</span>
                  </div>
                )}

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
                <Button 
                  onClick={handleAddItem} 
                  className="w-full font-display"
                  disabled={!canAddSelectedCategory.allowed || !newItem.name}
                >
                  {!canAddSelectedCategory.allowed ? (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      LIMITE ATINGIDO
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      ADICIONAR AO INVENTÁRIO
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        )}
      </div>

      {/* Weapon Catalog Modal */}
      <WeaponCatalogModal
        open={weaponCatalogOpen}
        onOpenChange={setWeaponCatalogOpen}
        patent={patent}
        patentLimits={patentLimits}
        categoryCounts={categoryCounts}
        onAddWeapon={handleAddWeaponFromCatalog}
      />

      {/* Armor Catalog Modal */}
      <ArmorCatalogModal
        open={armorCatalogOpen}
        onOpenChange={setArmorCatalogOpen}
        patent={patent}
        currentInventory={inventory}
        onSelectArmor={handleAddArmorFromCatalog}
      />

      {/* Item Catalog Modal */}
      <ItemCatalogModal
        open={itemCatalogOpen}
        onOpenChange={setItemCatalogOpen}
        patent={patent}
        patentLimits={patentLimits}
        categoryCounts={categoryCounts}
        onAddItem={handleAddItemFromCatalog}
      />

      {showEquipment && (
        <div className="ordo-panel p-3">
          <EquipmentSlots 
            inventory={inventory} 
            onUnequip={!readOnly ? handleUnequipItem : undefined}
          />
        </div>
      )}

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
      <div className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Patente:</span>
            <span className="font-display text-primary">{patent}</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Sua patente determina quantos itens de cada categoria você pode requisitar da Ordem. 
                  Itens sem categoria não contam para esses limites.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {(['I', 'II', 'III', 'IV'] as const).map((cat: 'I' | 'II' | 'III' | 'IV') => {
            const count = categoryCounts[cat];
            const limit = patentLimits[cat];
            const isAtLimit = count >= limit && limit > 0;
            const isLocked = limit === 0;
            const hasSlots = count < limit;
            const config = CATEGORY_LABELS[cat];

            return (
              <TooltipProvider key={cat}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={cn(
                        "p-2 rounded-lg border text-center transition-all cursor-help",
                        isLocked && "opacity-40 bg-muted/50",
                        isAtLimit && "border-destructive/50 bg-destructive/10",
                        hasSlots && !isLocked && config.color,
                        !isLocked && !isAtLimit && "hover:scale-105"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1 mb-1">
                        {isLocked ? (
                          <Lock className="w-3 h-3 text-muted-foreground" />
                        ) : isAtLimit ? (
                          <XCircle className="w-3 h-3 text-destructive" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        )}
                        <p className="text-[10px] opacity-70">{config.label}</p>
                      </div>
                      <p className={cn(
                        "font-display text-lg",
                        isAtLimit && "text-destructive",
                        isLocked && "text-muted-foreground"
                      )}>
                        {count}/{limit}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isLocked ? (
                      <p>Categoria bloqueada para sua patente</p>
                    ) : isAtLimit ? (
                      <p>Limite atingido! Remova itens para adicionar novos.</p>
                    ) : (
                      <p>{limit - count} slot(s) disponível(is)</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
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
                    onEquip={!readOnly && canEquipItem(item) ? handleEquipItem : undefined}
                    onUnequip={!readOnly && item.isEquipped ? handleUnequipItem : undefined}
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
  onEquip?: (id: string) => void;
  onUnequip?: (id: string) => void;
}

function InventoryItemRow({ item, onRemove, onEquip, onUnequip }: InventoryItemRowProps) {
  const categoryConfig = CATEGORY_LABELS[item.category] || CATEGORY_LABELS['0'];

  return (
    <TooltipProvider>
      <div className={cn(
        "flex items-center justify-between p-3 border rounded-lg ml-4 group transition-colors",
        item.isEquipped 
          ? "bg-primary/10 border-primary/30" 
          : "bg-card/50 border-border/30 hover:border-primary/30"
      )}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Equip Button */}
          {(onEquip || onUnequip) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                    item.isEquipped 
                      ? "text-primary hover:text-primary/70" 
                      : "text-muted-foreground/50 hover:text-primary"
                  )}
                  onClick={() => item.isEquipped ? onUnequip?.(item.id) : onEquip?.(item.id)}
                >
                  {item.isEquipped ? (
                    <CircleCheck className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-popover border-border">
                <p className="text-xs">
                  {item.isEquipped ? 'Desequipar' : 'Equipar'}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-medium truncate",
                item.isEquipped && "text-primary"
              )}>
                {item.name}
              </span>
              {item.quantity > 1 && (
                <Badge variant="outline" className="text-xs">
                  x{item.quantity}
                </Badge>
              )}
              {item.isEquipped && (
                <Badge className="text-[10px] bg-primary/20 text-primary border-0">
                  EQUIPADO
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
    </TooltipProvider>
  );
}

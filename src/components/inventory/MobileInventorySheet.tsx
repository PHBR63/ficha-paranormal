/**
 * MobileInventorySheet - Drawer completo de inventário para mobile
 * 
 * Funcionalidades:
 * - Lista de itens com swipe gestures (MobileInventoryCard)
 * - Catálogos de armas, armaduras e itens
 * - Equipamento e uso de consumíveis
 * - Detalhes de itens
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Package,
  Sword,
  Shield,
  FlaskConical,
  Search,
  X,
  AlertTriangle,
  Weight,
  Boxes,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
} from '@/components/icons/ordem-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MobileButtonGroup } from '@/components/ui/mobile-button-group';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks';
import { MobileInventoryCard } from './MobileInventoryCard';
import { WeaponCatalogModal } from './WeaponCatalogModal';
import { ArmorCatalogModal } from './ArmorCatalogModal';
import { ItemCatalogModal } from './ItemCatalogModal';
import { InventoryItemDetailModal } from './InventoryItemDetailModal';
import {
  getPatentLimits,
  countItemsByCategory,
  addToInventory,
  removeFromInventory,
  useConsumableItem,
  canUseItem,
  calculateCurrentLoad,
  calculateCarryCapacity,
  hasInventarioOtimizado,
  type CarryCapacityOptions,
} from '@/lib/inventory-system';
import { getAppropriateSlot, EquipmentSlotType } from './EquipmentSlots';
import type { ExtendedInventoryItem, CharacterDataForInventory } from './InventoryPanel';
import type { CatalogWeapon, CatalogArmor, CatalogItem } from '@/lib/catalogs';
import { validateArmorItem, validateWeaponItem, validateGeneralItem } from '@/hooks/useEquipmentMigration';
import { useCharacterCategoryReductions, type ExtendedInventoryItemWithReduction } from '@/hooks/useCharacterCategoryReductions';

// Props do componente
interface MobileInventorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: ExtendedInventoryItem[];
  strength: number;
  patent: string;
  onInventoryChange?: (newInventory: ExtendedInventoryItem[]) => void;
  readOnly?: boolean;
  characterData?: CharacterDataForInventory;
  /** Intelecto do personagem (para Inventário Otimizado do Técnico) */
  intellect?: number;
}

// Tipo para os catálogos
type CatalogType = 'weapon' | 'armor' | 'item' | null;

// Tipos de filtro
type CategoryFilter = 'all' | '0' | 'I' | 'II' | 'III' | 'IV';
type ItemTypeFilter = 'all' | 'weapon' | 'armor' | 'consumable' | 'misc';
type SortOption = 'name' | 'category' | 'equipped' | 'type';
type SortDirection = 'asc' | 'desc';

// Configuração das opções de ordenação
const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'name', label: 'Nome' },
  { id: 'category', label: 'Categoria' },
  { id: 'equipped', label: 'Equipado' },
  { id: 'type', label: 'Tipo' },
];

// Configuração dos filtros de categoria
const CATEGORY_FILTERS: { id: CategoryFilter; label: string; color: string }[] = [
  { id: 'all', label: 'Todos', color: 'bg-primary text-primary-foreground' },
  { id: '0', label: '0', color: 'bg-muted text-muted-foreground' },
  { id: 'I', label: 'I', color: 'bg-green-500/20 text-green-400' },
  { id: 'II', label: 'II', color: 'bg-blue-500/20 text-blue-400' },
  { id: 'III', label: 'III', color: 'bg-purple-500/20 text-purple-400' },
  { id: 'IV', label: 'IV', color: 'bg-red-500/20 text-red-400' },
];

// Configuração dos filtros de tipo
const TYPE_FILTERS: { id: ItemTypeFilter; label: string; icon: typeof Sword }[] = [
  { id: 'all', label: 'Todos', icon: Package },
  { id: 'weapon', label: 'Armas', icon: Sword },
  { id: 'armor', label: 'Proteção', icon: Shield },
  { id: 'consumable', label: 'Consumíveis', icon: FlaskConical },
  { id: 'misc', label: 'Outros', icon: Boxes },
];

// Configuração dos botões de adicionar
const ADD_BUTTONS = [
  { type: 'weapon' as const, label: 'Arma', icon: Sword, color: 'text-destructive' },
  { type: 'armor' as const, label: 'Proteção', icon: Shield, color: 'text-secondary' },
  { type: 'item' as const, label: 'Item', icon: FlaskConical, color: 'text-green-400' },
];

export function MobileInventorySheet({
  open,
  onOpenChange,
  inventory,
  strength,
  patent,
  onInventoryChange,
  readOnly = false,
  characterData,
  intellect,
}: MobileInventorySheetProps) {
  // Estados dos catálogos
  const [activeCatalog, setActiveCatalog] = useState<CatalogType>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados de filtros
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [typeFilter, setTypeFilter] = useState<ItemTypeFilter>('all');
  
  // Estados de ordenação
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Estados de modais
  const [useItemConfirmOpen, setUseItemConfirmOpen] = useState(false);
  const [itemToUse, setItemToUse] = useState<ExtendedInventoryItem | null>(null);
  const [itemDetailOpen, setItemDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExtendedInventoryItem | null>(null);
  // Estado para confirmação de limpeza de itens temporários
  const [clearTempConfirmOpen, setClearTempConfirmOpen] = useState(false);

  const { toast } = useToast();

  // Detectar Inventário Otimizado (Técnico)
  const hasInvOtimizado = useMemo(() => {
    if (!characterData) return false;
    return hasInventarioOtimizado({
      classTrack: characterData.classTrack,
      abilities: characterData.abilities,
      nex: characterData.nex,
    });
  }, [characterData?.classTrack, characterData?.abilities, characterData?.nex]);

  // Opções de capacidade de carga (com suporte a Inventário Otimizado)
  const carryOptions: CarryCapacityOptions = useMemo(() => ({
    intellect: intellect || characterData?.intellect,
    hasInventarioOtimizado: hasInvOtimizado,
  }), [intellect, characterData?.intellect, hasInvOtimizado]);

  // Hook de redução de categoria (A Favorita, Ferramenta Favorita, etc.)
  const categoryReductionData = useMemo(() => ({
    origin: characterData?.origin || '',
    classId: characterData?.classId || '',
    classTrack: characterData?.classTrack,
    nex: characterData?.nex || 0,
    abilities: characterData?.abilities || [],
    powers: characterData?.powers || [],
    generalPowers: characterData?.generalPowers || [],
  }), [characterData]);

  const {
    inventoryWithEffectiveCategories,
  } = useCharacterCategoryReductions({
    characterData: categoryReductionData,
    inventory: inventory as ExtendedInventoryItemWithReduction[],
    onInventoryChange: onInventoryChange as ((inv: ExtendedInventoryItemWithReduction[]) => void) | undefined,
  });

  // Cálculos de inventário (com suporte a Inventário Otimizado)
  const currentLoad = useMemo(() => calculateCurrentLoad(inventory, hasInvOtimizado), [inventory, hasInvOtimizado]);
  const maxCapacity = useMemo(() => calculateCarryCapacity(strength, carryOptions), [strength, carryOptions]);
  const isOverloaded = currentLoad > maxCapacity;
  const patentLimits = useMemo(() => getPatentLimits(patent), [patent]);
  
  // Contagem usa inventário com categorias efetivas
  const categoryCounts = useMemo(() => ({
    I: countItemsByCategory(inventoryWithEffectiveCategories, 'I'),
    II: countItemsByCategory(inventoryWithEffectiveCategories, 'II'),
    III: countItemsByCategory(inventoryWithEffectiveCategories, 'III'),
    IV: countItemsByCategory(inventoryWithEffectiveCategories, 'IV'),
  }), [inventoryWithEffectiveCategories]);

  // Contagem de itens temporários
  const temporaryItemsCount = useMemo(() => {
    return inventory.filter(item => item.isTemporary).length;
  }, [inventory]);

  // Lista de itens temporários (para exibir no dialog de confirmação)
  const temporaryItems = useMemo(() => {
    return inventory.filter(item => item.isTemporary);
  }, [inventory]);

  // Handler para abrir confirmação de limpeza
  const handleRequestClearTemporaryItems = useCallback(() => {
    if (temporaryItems.length === 0) return;
    setClearTempConfirmOpen(true);
  }, [temporaryItems.length]);

  // Handler para confirmar remoção de todos os itens temporários (fim da cena)
  const handleConfirmClearTemporaryItems = useCallback(() => {
    if (!onInventoryChange) return;
    
    const count = temporaryItems.length;
    if (count === 0) return;

    const newInventory = inventory.filter(item => !item.isTemporary);
    onInventoryChange(newInventory);
    
    setClearTempConfirmOpen(false);
    toast({
      title: 'Itens temporários removidos',
      description: `${count} item(ns) temporário(s) removido(s) do inventário.`,
    });
  }, [inventory, temporaryItems.length, onInventoryChange, toast]);

  // Itens equipados mapeados por slot
  const equippedItems = useMemo(() => {
    const slots: Record<EquipmentSlotType, ExtendedInventoryItem | null> = {
      primary_weapon: null,
      secondary_weapon: null,
      armor: null,
      shield: null,
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

  // Verificar se a arma principal é de duas mãos
  const isPrimaryTwoHanded = useMemo(() => {
    const primaryWeapon = equippedItems.primary_weapon;
    if (!primaryWeapon) return false;
    
    const properties = (primaryWeapon as any).properties as string[] | undefined;
    if (!properties) return false;
    
    return properties.some(prop => 
      prop.toLowerCase().includes('duas mãos') || 
      prop.toLowerCase().includes('duas maos')
    );
  }, [equippedItems.primary_weapon]);

  // Filtrar itens por busca, categoria e tipo (usa inventário com categorias efetivas)
  const filteredItems = useMemo(() => {
    return (inventoryWithEffectiveCategories as ExtendedInventoryItem[]).filter(item => {
      // Filtro de busca
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = item.name.toLowerCase().includes(term) ||
          (item.description && item.description.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }
      
      // Filtro de categoria (usa categoria efetiva se disponível)
      if (categoryFilter !== 'all') {
        const effectiveCategory = item.effectiveCategory || item.category;
        if (effectiveCategory !== categoryFilter) {
          return false;
        }
      }
      
      // Filtro de tipo
      if (typeFilter !== 'all') {
        const itemType = item.itemType || 'misc';
        if (typeFilter === 'consumable') {
          if (!item.consumable && itemType !== 'consumable') return false;
        } else if (typeFilter === 'misc') {
          if (itemType !== 'misc' && itemType !== 'valuable' && itemType !== 'ritual') return false;
        } else if (itemType !== typeFilter) {
          return false;
        }
      }
      
      return true;
    });
  }, [inventoryWithEffectiveCategories, searchTerm, categoryFilter, typeFilter]);

  // Ordenar itens filtrados
  const sortedItems = useMemo(() => {
    const categoryOrder = { '0': 0, 'I': 1, 'II': 2, 'III': 3, 'IV': 4 };
    const typeOrder = { 'weapon': 0, 'armor': 1, 'consumable': 2, 'misc': 3, 'valuable': 4, 'ritual': 5 };
    
    return [...filteredItems].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'pt-BR');
          break;
        case 'category':
          comparison = (categoryOrder[a.category as keyof typeof categoryOrder] ?? 5) - 
                       (categoryOrder[b.category as keyof typeof categoryOrder] ?? 5);
          break;
        case 'equipped':
          comparison = (b.isEquipped ? 1 : 0) - (a.isEquipped ? 1 : 0);
          break;
        case 'type':
          const typeA = a.itemType || 'misc';
          const typeB = b.itemType || 'misc';
          comparison = (typeOrder[typeA as keyof typeof typeOrder] ?? 5) - 
                       (typeOrder[typeB as keyof typeof typeOrder] ?? 5);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredItems, sortBy, sortDirection]);

  // Verificar se há filtros ativos
  const hasActiveFilters = categoryFilter !== 'all' || typeFilter !== 'all';

  // Limpar todos os filtros
  const clearFilters = () => {
    setCategoryFilter('all');
    setTypeFilter('all');
    setSearchTerm('');
    setSortBy('name');
    setSortDirection('asc');
  };

  // Alternar ordenação
  const toggleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('asc');
    }
  };

  // Separar itens equipados e não equipados
  const equippedList = sortedItems.filter(i => i.isEquipped);
  const unequippedList = sortedItems.filter(i => !i.isEquipped);

  // Handlers
  const handleRemoveItem = (itemId: string) => {
    if (!onInventoryChange) return;
    const newInventory = removeFromInventory(inventory, itemId);
    onInventoryChange(newInventory.map(i => ({
      ...i,
      itemType: (i as ExtendedInventoryItem).itemType || 'misc',
      equipSlot: (i as ExtendedInventoryItem).equipSlot,
    })));
    toast({ title: 'Item removido', description: 'O item foi removido do inventário.' });
  };

  const handleEquipItem = (itemId: string) => {
    if (!onInventoryChange) return;

    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    const slot = getAppropriateSlot(item, equippedItems, isPrimaryTwoHanded);
    if (!slot) {
      toast({
        title: 'Não foi possível equipar',
        description: 'Nenhum slot disponível para este item.',
        variant: 'destructive',
      });
      return;
    }

    // Se estamos equipando uma arma de duas mãos, desequipar secundária e escudo
    const extItem = item as ExtendedInventoryItem & { properties?: string[] };
    const isTwoHanded = extItem.properties?.some(p => 
      p.toLowerCase().includes('duas mãos') || p.toLowerCase().includes('duas maos')
    );

    const newInventory = inventory.map(i => {
      if (isTwoHanded && slot === 'primary_weapon') {
        if (i.equipSlot === 'secondary_weapon' || i.equipSlot === 'shield') {
          return { ...i, isEquipped: false, equipSlot: undefined };
        }
      }
      
      return {
        ...i,
        isEquipped: i.id === itemId ? true : i.isEquipped,
        equipSlot: i.id === itemId ? slot : i.equipSlot,
      };
    });

    onInventoryChange(newInventory);
    
    if (isTwoHanded && slot === 'primary_weapon') {
      toast({
        title: 'Arma de duas mãos equipada',
        description: 'Slot secundário e escudo foram liberados.',
      });
    }
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

  const handleRequestUseItem = (itemId: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (item) {
      setItemToUse(item);
      setUseItemConfirmOpen(true);
    }
  };

  const handleConfirmUseItem = () => {
    if (!onInventoryChange || !itemToUse) return;

    const result = useConsumableItem(inventory, itemToUse.id);
    
    if (result.success) {
      onInventoryChange(result.newInventory.map(i => ({
        ...i,
        itemType: (i as ExtendedInventoryItem).itemType || 'misc',
        equipSlot: (i as ExtendedInventoryItem).equipSlot,
      })));
      toast({
        title: result.itemRemoved ? 'Item consumido' : 'Item usado',
        description: result.message,
      });
    } else {
      toast({
        title: 'Não foi possível usar',
        description: result.message,
        variant: 'destructive',
      });
    }
    
    setUseItemConfirmOpen(false);
    setItemToUse(null);
  };

  // Handlers de catálogos
  const handleAddWeaponFromCatalog = (weapon: CatalogWeapon) => {
    if (!onInventoryChange) return;

    const baseItem = {
      id: crypto.randomUUID(),
      name: weapon.name,
      category: weapon.category,
      slots: weapon.spaces,
      quantity: 1,
      itemType: 'weapon' as const,
      description: weapon.description,
      damage: weapon.damage,
      damageType: weapon.damageType,
      critical: weapon.critical,
      criticalMultiplier: weapon.criticalMultiplier,
      range: weapon.range,
      special: weapon.special,
      ammoType: weapon.ammoType,
      proficiency: weapon.proficiency,
      properties: weapon.properties,
      weaponType: weapon.type,
    };

    const validatedItem = validateWeaponItem(baseItem) as unknown as ExtendedInventoryItem;
    const result = addToInventory(inventory, validatedItem, patent);
    
    if (result.success) {
      onInventoryChange(result.newInventory.map(i => ({
        ...i,
        itemType: (i as ExtendedInventoryItem).itemType || 'misc',
        equipSlot: (i as ExtendedInventoryItem).equipSlot,
      })));
      setActiveCatalog(null);
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

  const handleAddArmorFromCatalog = (armor: CatalogArmor) => {
    if (!onInventoryChange) return;

    const baseItem = {
      id: crypto.randomUUID(),
      name: armor.name,
      category: armor.category,
      slots: armor.spaces,
      quantity: 1,
      itemType: 'armor' as const,
      description: armor.description,
      defenseBonus: armor.defenseBonus,
      rd: armor.rd ?? 0,
      agilityPenalty: armor.agilityPenalty,
      armorType: armor.type,
      special: armor.special,
    };

    const validatedItem = validateArmorItem(baseItem) as unknown as ExtendedInventoryItem;
    const result = addToInventory(inventory, validatedItem, patent);
    
    if (result.success) {
      onInventoryChange(result.newInventory.map(i => ({
        ...i,
        itemType: (i as ExtendedInventoryItem).itemType || 'misc',
        equipSlot: (i as ExtendedInventoryItem).equipSlot,
      })));
      setActiveCatalog(null);
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

  const handleAddItemFromCatalog = (item: CatalogItem) => {
    if (!onInventoryChange) return;

    const baseItem = {
      id: crypto.randomUUID(),
      name: item.name,
      category: item.category,
      slots: typeof item.spaces === 'number' ? item.spaces : 0,
      quantity: 1,
      itemType: item.consumable ? 'consumable' as const : 'misc' as const,
      description: item.description,
      consumable: item.consumable,
      uses: item.uses,
      maxUses: item.uses,
      effect: item.effect,
    };

    const validatedItem = validateGeneralItem(baseItem) as unknown as ExtendedInventoryItem;
    const result = addToInventory(inventory, validatedItem, patent);
    
    if (result.success) {
      onInventoryChange(result.newInventory.map(i => ({
        ...i,
        itemType: (i as ExtendedInventoryItem).itemType || 'misc',
        equipSlot: (i as ExtendedInventoryItem).equipSlot,
      })));
      setActiveCatalog(null);
      toast({
        title: 'Item adicionado',
        description: `${item.name} foi adicionado ao inventário.`,
      });
    } else {
      toast({
        title: 'Limite de patente atingido',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0">
          {/* Header */}
          <SheetHeader className="p-4 border-b border-border flex-shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Inventário
              <Badge variant="secondary" className="ml-2">
                {inventory.length} itens
              </Badge>
            </SheetTitle>
          </SheetHeader>

          {/* Status de carga */}
          <div className="p-4 border-b border-border space-y-3 flex-shrink-0">
            {/* Barra de carga */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Weight className="w-3.5 h-3.5" />
                  Carga
                </span>
                <span className={cn(
                  "font-medium",
                  isOverloaded && "text-destructive",
                )}>
                  {currentLoad} / {maxCapacity} espaços
                </span>
              </div>
              <Progress 
                value={Math.min((currentLoad / maxCapacity) * 100, 100)} 
                className={cn(
                  "h-2",
                  isOverloaded && "[&>div]:bg-destructive",
                )}
              />
              {isOverloaded && (
                <div className="flex items-center gap-1.5 text-[10px] text-destructive">
                  <AlertTriangle className="w-3 h-3" />
                  Sobrecarregado! -5 em FOR/AGI/VIG, -3m deslocamento
                </div>
              )}
            </div>

            {/* Indicadores de categoria + Botão limpar temporários */}
            <div className="flex gap-1.5 flex-wrap items-center">
              {(['I', 'II', 'III', 'IV'] as const).map(cat => {
                const limit = patentLimits[cat];
                const current = categoryCounts[cat];
                const isLocked = limit === 0;
                const isFull = current >= limit && limit > 0;
                
                return (
                  <Badge 
                    key={cat}
                    variant="outline" 
                    className={cn(
                      "text-[10px] px-2",
                      isLocked && "bg-muted text-muted-foreground opacity-50",
                      isFull && !isLocked && "bg-destructive/20 text-destructive border-destructive/30",
                      !isLocked && !isFull && "bg-primary/10 text-primary border-primary/30",
                    )}
                  >
                    Cat.{cat}: {current}/{limit}
                  </Badge>
                );
              })}
              
              {/* Botão limpar itens temporários */}
              {!readOnly && temporaryItemsCount > 0 && (
                <button
                  onClick={handleRequestClearTemporaryItems}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors ml-auto"
                >
                  <Clock className="w-3 h-3" />
                  Limpar Temp ({temporaryItemsCount})
                </button>
              )}
            </div>
          </div>

          {/* Busca e Filtros */}
          <div className="p-3 border-b border-border flex-shrink-0 space-y-3">
            {/* Barra de busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Filtros por tipo */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {TYPE_FILTERS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTypeFilter(id)}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all",
                    typeFilter === id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* Filtros por categoria */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase">Cat:</span>
              <div className="flex gap-1">
                {CATEGORY_FILTERS.map(({ id, label, color }) => (
                  <button
                    key={id}
                    onClick={() => setCategoryFilter(id)}
                    className={cn(
                      "px-2 py-1 rounded text-[10px] font-medium transition-all",
                      categoryFilter === id
                        ? color
                        : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              
              {/* Botão limpar filtros */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="ml-auto text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Limpar
                </button>
              )}
            </div>

            {/* Ordenação */}
            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
              <ArrowUpDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-[10px] text-muted-foreground uppercase">Ordenar:</span>
              <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                {SORT_OPTIONS.map(({ id, label }) => {
                  const isActive = sortBy === id;
                  return (
                    <button
                      key={id}
                      onClick={() => toggleSort(id)}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all flex-shrink-0",
                        isActive
                          ? "bg-secondary/20 text-secondary"
                          : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {label}
                      {isActive && (
                        sortDirection === 'asc' 
                          ? <ArrowUp className="w-2.5 h-2.5" /> 
                          : <ArrowDown className="w-2.5 h-2.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Lista de itens */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-4">
              {/* Itens equipados */}
              {equippedList.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <Boxes className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-primary uppercase tracking-wide">
                      Equipado ({equippedList.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {equippedList.map(item => (
                      <MobileInventoryCard
                        key={item.id}
                        item={item}
                        onRemove={!readOnly ? handleRemoveItem : undefined}
                        onEquip={undefined}
                        onUnequip={!readOnly ? handleUnequipItem : undefined}
                        onUse={!readOnly && canUseItem(item) ? handleRequestUseItem : undefined}
                        onViewDetails={(item) => {
                          setSelectedItem(item);
                          setItemDetailOpen(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Itens não equipados */}
              {unequippedList.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Inventário ({unequippedList.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {unequippedList.map(item => (
                      <MobileInventoryCard
                        key={item.id}
                        item={item}
                        onRemove={!readOnly ? handleRemoveItem : undefined}
                        onEquip={!readOnly ? handleEquipItem : undefined}
                        onUnequip={undefined}
                        onUse={!readOnly && canUseItem(item) ? handleRequestUseItem : undefined}
                        onViewDetails={(item) => {
                          setSelectedItem(item);
                          setItemDetailOpen(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Mensagem quando vazio */}
              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? 'Nenhum item encontrado' : 'Inventário vazio'}
                  </p>
                  {!searchTerm && !readOnly && (
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Use os botões abaixo para adicionar itens
                    </p>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Botões de adicionar (footer fixo com safe area) */}
          {!readOnly && (
            <div className="p-3 border-t border-border bg-card flex-shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
              <MobileButtonGroup
                buttons={ADD_BUTTONS.map(({ type, label, icon: Icon, color }) => ({
                  id: type,
                  label,
                  icon: <Icon className={cn("w-4 h-4", color)} />,
                  onClick: () => setActiveCatalog(type),
                  variant: 'outline' as const,
                  type: 'secondary' as const,
                }))}
                layout="row"
                gap="sm"
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Catálogos */}
      <WeaponCatalogModal
        open={activeCatalog === 'weapon'}
        onOpenChange={(open) => !open && setActiveCatalog(null)}
        patent={patent}
        patentLimits={patentLimits}
        categoryCounts={categoryCounts}
        onAddWeapon={handleAddWeaponFromCatalog}
      />

      <ArmorCatalogModal
        open={activeCatalog === 'armor'}
        onOpenChange={(open) => !open && setActiveCatalog(null)}
        patent={patent}
        currentInventory={inventory}
        onSelectArmor={handleAddArmorFromCatalog}
      />

      <ItemCatalogModal
        open={activeCatalog === 'item'}
        onOpenChange={(open) => !open && setActiveCatalog(null)}
        patent={patent}
        patentLimits={patentLimits}
        categoryCounts={categoryCounts}
        onAddItem={handleAddItemFromCatalog}
      />

      {/* Modal de confirmação de uso */}
      <Dialog open={useItemConfirmOpen} onOpenChange={setUseItemConfirmOpen}>
        <DialogContent className="w-[90vw] max-w-sm">
          <DialogHeader>
            <DialogTitle>Usar {itemToUse?.name}?</DialogTitle>
            <DialogDescription>
              {itemToUse?.consumable 
                ? 'Este item será consumido após o uso.' 
                : 'Confirmar uso deste item?'}
            </DialogDescription>
          </DialogHeader>
          {itemToUse && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">{itemToUse.description}</p>
              {(itemToUse as any).effect && (
                <p className="text-sm text-primary mt-2">{(itemToUse as any).effect}</p>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <MobileButtonGroup
              buttons={[
                {
                  id: 'cancel',
                  label: 'Cancelar',
                  onClick: () => setUseItemConfirmOpen(false),
                  variant: 'outline',
                  type: 'secondary',
                },
                {
                  id: 'use',
                  label: 'Usar',
                  onClick: handleConfirmUseItem,
                  type: 'primary',
                },
              ]}
              layout="row"
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação - Limpar Itens Temporários */}
      <Dialog open={clearTempConfirmOpen} onOpenChange={setClearTempConfirmOpen}>
        <DialogContent className="w-[90vw] max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Limpar Itens Temporários
            </DialogTitle>
            <DialogDescription>
              Confirme a remoção dos itens temporários abaixo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {/* Lista de itens temporários */}
            <div className="max-h-[150px] overflow-y-auto space-y-2">
              {temporaryItems.map(item => (
                <div 
                  key={item.id}
                  className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border/50"
                >
                  <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-[9px] text-muted-foreground truncate">
                      {item.temporarySource || 'Item temporário'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Aviso */}
            <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-[11px] text-amber-400">
                {temporaryItems.length} item(ns) será(ão) removido(s).
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <MobileButtonGroup
              buttons={[
                {
                  id: 'cancel',
                  label: 'Cancelar',
                  onClick: () => setClearTempConfirmOpen(false),
                  variant: 'outline',
                  type: 'secondary',
                },
                {
                  id: 'confirm',
                  label: 'Remover',
                  onClick: handleConfirmClearTemporaryItems,
                  type: 'primary',
                  className: 'bg-amber-600 hover:bg-amber-700',
                },
              ]}
              layout="row"
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de detalhes do item */}
      <InventoryItemDetailModal
        open={itemDetailOpen}
        onOpenChange={setItemDetailOpen}
        item={selectedItem}
        onEquip={!readOnly && selectedItem && !selectedItem.isEquipped ? (id) => {
          handleEquipItem(id);
          setItemDetailOpen(false);
        } : undefined}
        onUnequip={!readOnly && selectedItem?.isEquipped ? (id) => {
          handleUnequipItem(id);
          setItemDetailOpen(false);
        } : undefined}
        onUse={!readOnly && selectedItem && canUseItem(selectedItem) ? (id) => {
          setItemToUse(selectedItem);
          setItemDetailOpen(false);
          setUseItemConfirmOpen(true);
        } : undefined}
        onRemove={!readOnly ? (id) => {
          handleRemoveItem(id);
          setItemDetailOpen(false);
        } : undefined}
      />
    </>
  );
}

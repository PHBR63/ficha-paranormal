/**
 * InventoryPanel - Painel de inventário com validação por patente
 * 
 * Funcionalidades:
 * - Validação automática de limites por categoria/patente
 * - Indicador visual de slots disponíveis
 * - Bloqueio de adição quando limite atingido
 * - Sistema de carga com penalidades
 * - Sistema de modificações para armas
 */

import { useState, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileInventoryCard } from './MobileInventoryCard';
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
  Zap,
  Wrench,
  Star,
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
  useConsumableItem,
  canUseItem,
} from '@/lib/inventory-system';
import { EquipmentSlots, EquipmentSlotType, EQUIPMENT_SLOTS, getAppropriateSlot, isTwoHandedWeapon } from './EquipmentSlots';
import { WeaponCatalogModal } from './WeaponCatalogModal';
import { ArmorCatalogModal } from './ArmorCatalogModal';
import { ItemCatalogModal } from './ItemCatalogModal';
import { WeaponModificationModal } from './WeaponModificationModal';
import type { CatalogWeapon, WeaponModification } from '@/lib/weapons-catalog';
import { 
  calculateModifiedWeaponStats, 
  getModifiedCategory, 
  MODIFICATION_LABELS,
  getWeaponModificationById,
} from '@/lib/weapons-catalog';
import type { CatalogArmor } from '@/lib/armor-catalog';
import type { CatalogItem } from '@/lib/items-catalog';
import { ProtectionWidget } from './ProtectionWidget';
import { InventoryItemDetailModal } from './InventoryItemDetailModal';
import { validateArmorItem, validateWeaponItem, validateGeneralItem } from '@/hooks/useEquipmentMigration';
import { inferWeaponType } from '@/lib/weapon-type-inference';
import { 
  getEffectiveCategory, 
  getCategoryReductionAbility,
  type CategoryReductionConfig,
} from '@/lib/category-reduction';

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
  // Campos para redução de categoria (A Favorita, Ferramenta Favorita, etc.)
  favoriteAbilityId?: string;  // ID da habilidade que está sendo aplicada
  effectiveCategory?: InventoryItem['category'];  // Categoria efetiva após redução
}

// Props para dados do personagem (para detecção automática de reduções de categoria)
export interface CharacterDataForInventory {
  origin: string;
  classId: string;
  classTrack?: string;
  nex: number;
  abilities?: string[];
  powers?: string[];
  generalPowers?: Array<{ id: string; name: string }>;
}

interface InventoryPanelProps {
  inventory: ExtendedInventoryItem[];
  strength: number;
  patent: string;
  onInventoryChange?: (newInventory: ExtendedInventoryItem[]) => void;
  readOnly?: boolean;
  showEquipment?: boolean;
  /** Dados do personagem para detecção automática de habilidades de redução de categoria */
  characterData?: CharacterDataForInventory;
}

export function InventoryPanel({
  inventory,
  strength,
  patent,
  onInventoryChange,
  readOnly = false,
  showEquipment = true,
  characterData,
}: InventoryPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<ItemType>>(new Set(['weapon', 'armor', 'consumable']));
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [weaponCatalogOpen, setWeaponCatalogOpen] = useState(false);
  const [armorCatalogOpen, setArmorCatalogOpen] = useState(false);
  const [itemCatalogOpen, setItemCatalogOpen] = useState(false);
  const [useItemConfirmOpen, setUseItemConfirmOpen] = useState(false);
  const [itemToUse, setItemToUse] = useState<ExtendedInventoryItem | null>(null);
  // Estado para modal de modificação de armas
  const [weaponModModalOpen, setWeaponModModalOpen] = useState(false);
  const [weaponToModify, setWeaponToModify] = useState<ExtendedInventoryItem | null>(null);
  // Estado para modal de detalhes do item
  const [itemDetailOpen, setItemDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExtendedInventoryItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<ExtendedInventoryItem>>({
    name: '',
    category: '0',
    slots: 1,
    quantity: 1,
    itemType: 'misc',
  });

  const isMobile = useIsMobile();

  // Calcular status de carga
  const loadStatus = useMemo(() => getLoadStatus(inventory, strength), [inventory, strength]);
  const patentLimits = useMemo(() => getPatentLimits(patent), [patent]);

  // Mapear itens equipados por slot (atualizado com shield, removido head)
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
        // Migrar itens do slot 'head' antigo para 'armor' ou 'shield'
        if ((item.equipSlot as string) === 'head') {
          // Não fazer nada - item será desequipado
          return;
        }
        slots[item.equipSlot] = item;
      }
    });

    return slots;
  }, [inventory]);

  // Verificar se a arma principal é de duas mãos
  const isPrimaryTwoHanded = useMemo(() => {
    const primaryWeapon = equippedItems.primary_weapon;
    if (!primaryWeapon) return false;
    
    // Verificar propriedade "Duas mãos"
    const properties = (primaryWeapon as any).properties as string[] | undefined;
    if (!properties) return false;
    
    return properties.some(prop => 
      prop.toLowerCase().includes('duas mãos') || 
      prop.toLowerCase().includes('duas maos')
    );
  }, [equippedItems.primary_weapon]);

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

    // Encontrar slot apropriado (passando flag de duas mãos)
    const slot = getAppropriateSlot(item, equippedItems, isPrimaryTwoHanded);
    if (!slot) {
      // Mostrar toast explicando por que não pode equipar
      const extItem = item as ExtendedInventoryItem & { properties?: string[] };
      if (extItem.properties?.some(p => p.toLowerCase().includes('duas mãos'))) {
        toast({
          title: 'Não foi possível equipar',
          description: 'Desequipe a arma secundária e escudo primeiro para usar uma arma de duas mãos.',
          variant: 'destructive',
        });
      } else if (isPrimaryTwoHanded && (item.itemType === 'weapon' || (item as any).armorType === 'escudo')) {
        toast({
          title: 'Não foi possível equipar',
          description: 'A arma principal ocupa as duas mãos.',
          variant: 'destructive',
        });
      }
      return;
    }

    // Se estamos equipando uma arma de duas mãos, desequipar secundária e escudo
    const extItem = item as ExtendedInventoryItem & { properties?: string[] };
    const isTwoHanded = extItem.properties?.some(p => 
      p.toLowerCase().includes('duas mãos') || p.toLowerCase().includes('duas maos')
    );

    let newInventory = inventory.map(i => {
      // Desequipar arma secundária e escudo se nova arma é de duas mãos
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
    
    // Toast de sucesso se arma de duas mãos
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

  // Handler para abrir modal de confirmação de uso
  const handleRequestUseItem = (itemId: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (item) {
      setItemToUse(item);
      setUseItemConfirmOpen(true);
    }
  };

  // Handler para confirmar uso do item
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
        variant: result.itemRemoved ? 'default' : 'default',
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

  // Handler para adicionar arma do catálogo
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
      // Dados extras para o sistema de ataque
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

    // Valida e normaliza o item antes de adicionar
    const validatedItem = validateWeaponItem(baseItem) as unknown as ExtendedInventoryItem & { 
      damage: string; 
      damageType: string; 
      critical: number; 
      criticalMultiplier: number;
      range?: string;
      special?: string;
    };

    const result = addToInventory(inventory, validatedItem, patent);
    
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

    // Cria o item base com todos os campos obrigatórios
    const baseItem = {
      id: crypto.randomUUID(),
      name: armor.name,
      category: armor.category,
      slots: armor.spaces,
      quantity: 1,
      itemType: 'armor' as const,
      description: armor.description,
      // Dados extras para o sistema de proteção - OBRIGATÓRIOS
      defenseBonus: armor.defenseBonus,
      rd: armor.rd ?? 0, // Garante que rd nunca seja undefined
      agilityPenalty: armor.agilityPenalty,
      armorType: armor.type,
      special: armor.special,
    };

    // Valida e normaliza o item antes de adicionar
    const validatedItem = validateArmorItem(baseItem) as unknown as ExtendedInventoryItem & { 
      defenseBonus: number;
      rd: number; 
      agilityPenalty?: number; 
      armorType?: string;
      special?: string;
    };

    const result = addToInventory(inventory, validatedItem, patent);
    
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

    const baseItem = {
      id: crypto.randomUUID(),
      name: catalogItem.name,
      category: catalogItem.category,
      slots: catalogItem.spaces,
      quantity: 1,
      itemType: 'item' as const,
      description: catalogItem.description,
      // Dados extras para itens gerais
      effect: catalogItem.effect,
      uses: catalogItem.uses,
      maxUses: catalogItem.uses,
      consumable: catalogItem.consumable,
      spaces: typeof catalogItem.spaces === 'number' ? catalogItem.spaces : 1,
    };

    // Valida e normaliza o item antes de adicionar
    const validatedItem = validateGeneralItem(baseItem) as unknown as ExtendedInventoryItem & { 
      effect?: string; 
      uses?: number;
      maxUses?: number;
      consumable?: boolean;
    };

    const result = addToInventory(inventory, validatedItem, patent);
    
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
    const slot = getAppropriateSlot(item, equippedItems, isPrimaryTwoHanded);
    return slot !== null;
  };

  // Handler para abrir modal de modificação de arma
  const handleOpenWeaponMod = (item: ExtendedInventoryItem) => {
    setWeaponToModify(item);
    setWeaponModModalOpen(true);
  };

  // Handler para aplicar modificações em arma
  const handleApplyWeaponModifications = (modifications: WeaponModification[]) => {
    if (!weaponToModify || !onInventoryChange) return;

    // Criar objeto CatalogWeapon a partir do item
    const baseWeapon: CatalogWeapon = {
      id: weaponToModify.id,
      name: weaponToModify.name.replace(/\s*\(Mod\.\)$/, ''), // Remove indicador anterior
      category: (weaponToModify as any).baseCategory || weaponToModify.category,
      type: inferWeaponType(weaponToModify as any), // Usar inferência de tipo correta
      damage: (weaponToModify as any).baseDamage || (weaponToModify as any).damage || '1d6',
      damageType: (weaponToModify as any).damageType || 'Corte',
      critical: (weaponToModify as any).baseCritical || (weaponToModify as any).critical || 20,
      criticalMultiplier: (weaponToModify as any).criticalMultiplier || 2,
      range: (weaponToModify as any).range,
      spaces: weaponToModify.slots,
      proficiency: (weaponToModify as any).proficiency || 'simples',
      properties: (weaponToModify as any).properties,
      special: (weaponToModify as any).special,
      ammoType: (weaponToModify as any).ammoType,
    };

    // Calcular estatísticas modificadas
    const modifiedStats = calculateModifiedWeaponStats(baseWeapon, modifications);
    const hasModifications = modifications.length > 0;

    // Converter categoria "especial" para "0" (o sistema de inventário não suporta "especial")
    const inventoryCategory = modifiedStats.finalCategory === 'especial' 
      ? '0' as const
      : modifiedStats.finalCategory;

    // Atualizar item no inventário
    const updatedInventory = inventory.map(item => {
      if (item.id === weaponToModify.id) {
        return {
          ...item,
          name: hasModifications 
            ? `${baseWeapon.name} (Mod.)` 
            : baseWeapon.name,
          category: inventoryCategory,
          appliedModifications: modifications,
          // Preservar dados base para recálculo futuro
          baseCategory: baseWeapon.category,
          baseDamage: baseWeapon.damage,
          baseCritical: baseWeapon.critical,
          // Aplicar estatísticas modificadas
          damage: modifiedStats.damage,
          critical: modifiedStats.criticalMargin,
          attackBonus: modifiedStats.attackBonus,
          modifiedRange: modifiedStats.range,
          addedProperties: modifiedStats.addedProperties,
          specialEffects: modifiedStats.specialEffects,
        } as ExtendedInventoryItem;
      }
      return item;
    });

    onInventoryChange(updatedInventory);
    setWeaponModModalOpen(false);
    setWeaponToModify(null);

    toast({
      title: hasModifications ? 'Modificações aplicadas' : 'Modificações removidas',
      description: hasModifications 
        ? `${modifications.length} modificação(ões) aplicada(s) em ${baseWeapon.name}.`
        : `Todas as modificações foram removidas de ${baseWeapon.name}.`,
    });
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="font-display text-sm tracking-wider text-primary flex items-center gap-2">
          <Package className="w-4 h-4" />
          INVENTÁRIO
        </h3>
        {!readOnly && (
          <div className="grid grid-cols-4 sm:flex gap-1.5 sm:gap-2">
            {/* Botão Catálogo de Armas */}
            <Button 
              size="sm" 
              variant="outline" 
              className="font-display text-[10px] sm:text-xs h-8 px-2 sm:px-3 touch-manipulation"
              onClick={() => setWeaponCatalogOpen(true)}
            >
              <Sword className="w-3.5 h-3.5 sm:w-3 sm:h-3 sm:mr-1" />
              <span className="hidden sm:inline">ARMAS</span>
            </Button>
            {/* Botão Catálogo de Proteções */}
            <Button 
              size="sm" 
              variant="outline" 
              className="font-display text-[10px] sm:text-xs h-8 px-2 sm:px-3 touch-manipulation"
              onClick={() => setArmorCatalogOpen(true)}
            >
              <Shield className="w-3.5 h-3.5 sm:w-3 sm:h-3 sm:mr-1" />
              <span className="hidden sm:inline">PROTEÇÕES</span>
            </Button>
            {/* Botão Catálogo de Itens Gerais */}
            <Button 
              size="sm" 
              variant="outline" 
              className="font-display text-[10px] sm:text-xs h-8 px-2 sm:px-3 touch-manipulation"
              onClick={() => setItemCatalogOpen(true)}
            >
              <Package className="w-3.5 h-3.5 sm:w-3 sm:h-3 sm:mr-1" />
              <span className="hidden sm:inline">ITENS</span>
            </Button>
            {/* Botão Adicionar Item Manual */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="font-display text-[10px] sm:text-xs h-8 px-2 sm:px-3 touch-manipulation">
                  <Plus className="w-3.5 h-3.5 sm:w-3 sm:h-3 sm:mr-1" />
                  <span className="hidden sm:inline">ITEM</span>
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

      {/* Weapon Modification Modal */}
      {weaponToModify && (
        <WeaponModificationModal
          open={weaponModModalOpen}
          onOpenChange={setWeaponModModalOpen}
          weapon={{
            id: weaponToModify.id,
            name: weaponToModify.name.replace(/\s*\(Mod\.\)$/, ''),
            category: ((weaponToModify as any).baseCategory || weaponToModify.category) as CatalogWeapon['category'],
            type: inferWeaponType(weaponToModify as any), // Usar inferência de tipo correta
            damage: (weaponToModify as any).baseDamage || (weaponToModify as any).damage || '1d6',
            damageType: (weaponToModify as any).damageType || 'Corte',
            critical: (weaponToModify as any).baseCritical || (weaponToModify as any).critical || 20,
            criticalMultiplier: (weaponToModify as any).criticalMultiplier || 2,
            range: (weaponToModify as any).range,
            spaces: weaponToModify.slots,
            proficiency: (weaponToModify as any).proficiency || 'simples',
            properties: (weaponToModify as any).properties,
            special: (weaponToModify as any).special,
            ammoType: (weaponToModify as any).ammoType,
          }}
          currentModifications={(weaponToModify as any).appliedModifications || []}
          onApplyModifications={handleApplyWeaponModifications}
        />
      )}
      <Dialog open={useItemConfirmOpen} onOpenChange={setUseItemConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-popover">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <Zap className="w-5 h-5 text-green-400" />
              Usar Item
            </DialogTitle>
            <DialogDescription>
              Confirme o uso do item abaixo.
            </DialogDescription>
          </DialogHeader>
          
          {itemToUse && (
            <div className="space-y-4 py-2">
              {/* Nome e info do item */}
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <FlaskConical className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{itemToUse.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {itemToUse.uses}/{itemToUse.maxUses ?? itemToUse.uses} usos restantes
                  </p>
                </div>
              </div>

              {/* Descrição */}
              {itemToUse.description && (
                <p className="text-sm text-muted-foreground">
                  {itemToUse.description}
                </p>
              )}

              {/* Efeito */}
              {itemToUse.effect && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400 text-sm font-medium mb-1">
                    <Zap className="w-4 h-4" />
                    Efeito
                  </div>
                  <p className="text-sm">{itemToUse.effect}</p>
                </div>
              )}

              {/* Aviso se for último uso */}
              {itemToUse.uses === 1 && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Este é o último uso. O item será removido do inventário.</span>
                  </div>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setUseItemConfirmOpen(false);
                    setItemToUse(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleConfirmUseItem}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Confirmar Uso
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Item */}
      <InventoryItemDetailModal
        item={selectedItem}
        open={itemDetailOpen}
        onOpenChange={setItemDetailOpen}
        onEquip={!readOnly ? handleEquipItem : undefined}
        onUnequip={!readOnly ? handleUnequipItem : undefined}
        onUse={!readOnly ? handleRequestUseItem : undefined}
        onRemove={!readOnly ? handleRemoveItem : undefined}
      />

      {showEquipment && (
        <div className="ordo-panel p-3 space-y-3">
          <EquipmentSlots 
            inventory={inventory} 
            onUnequip={!readOnly ? handleUnequipItem : undefined}
            isPrimaryTwoHanded={isPrimaryTwoHanded}
          />
          
          {/* Widget de Proteção Total */}
          <ProtectionWidget inventory={inventory} />
        </div>
      )}

      {/* Barra de Carga */}
      <div className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Weight className={cn("w-4 h-4", loadColor)} />
            <span className="text-muted-foreground">Carga</span>
          </div>
          <span className={cn("font-display font-bold text-base", loadColor)}>
            <span className="text-primary">{loadStatus.currentLoad}</span>
            <span className="text-muted-foreground/60 mx-0.5">/</span>
            <span className="text-foreground">{loadStatus.maxCapacity}</span>
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
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                        "font-display text-lg font-bold",
                        isAtLimit && "text-destructive",
                        isLocked && "text-muted-foreground",
                        !isAtLimit && !isLocked && "text-foreground"
                      )}>
                        <span className="text-primary">{count}</span>
                        <span className="text-muted-foreground/70">/</span>
                        <span className="text-foreground/80">{limit}</span>
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
                  isMobile ? (
                    <MobileInventoryCard
                      key={item.id}
                      item={item}
                      onRemove={!readOnly ? handleRemoveItem : undefined}
                      onEquip={!readOnly && canEquipItem(item) ? handleEquipItem : undefined}
                      onUnequip={!readOnly && item.isEquipped ? handleUnequipItem : undefined}
                      onUse={!readOnly && canUseItem(item) ? handleRequestUseItem : undefined}
                      onModify={!readOnly && item.itemType === 'weapon' ? handleOpenWeaponMod : undefined}
                      onViewDetails={(item) => {
                        setSelectedItem(item);
                        setItemDetailOpen(true);
                      }}
                    />
                  ) : (
                    <InventoryItemRow
                      key={item.id}
                      item={item}
                      onRemove={!readOnly ? handleRemoveItem : undefined}
                      onEquip={!readOnly && canEquipItem(item) ? handleEquipItem : undefined}
                      onUnequip={!readOnly && item.isEquipped ? handleUnequipItem : undefined}
                      onUse={!readOnly && canUseItem(item) ? handleRequestUseItem : undefined}
                      onModify={!readOnly && item.itemType === 'weapon' ? handleOpenWeaponMod : undefined}
                      onViewDetails={(item) => {
                        setSelectedItem(item);
                        setItemDetailOpen(true);
                      }}
                    />
                  )
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        {inventory.length === 0 && (
          <div className="text-center py-8 text-foreground/70">
            <Boxes className="w-12 h-12 mx-auto mb-2 text-foreground/40" />
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
  onUse?: (id: string) => void;
  onModify?: (item: ExtendedInventoryItem) => void;
  onViewDetails?: (item: ExtendedInventoryItem) => void;
  onToggleFavorite?: (item: ExtendedInventoryItem) => void;
  availableAbilities?: CategoryReductionConfig[];
}

function InventoryItemRow({ item, onRemove, onEquip, onUnequip, onUse, onModify, onViewDetails, onToggleFavorite, availableAbilities }: InventoryItemRowProps) {
  // Usa a categoria efetiva se disponível
  const displayCategory = item.effectiveCategory || item.category;
  const hasReduction = item.effectiveCategory && item.effectiveCategory !== item.category;
  const categoryConfig = CATEGORY_LABELS[displayCategory] || CATEGORY_LABELS['0'];
  // Verifica se é consumível e tem usos
  const isConsumable = item.consumable && (item.uses ?? 0) > 0;
  const usesDisplay = item.consumable ? `${item.uses ?? 0}/${item.maxUses ?? item.uses ?? 0}` : null;
  // Verificar se arma tem modificações aplicadas
  const appliedMods = (item as any).appliedModifications as WeaponModification[] | undefined;
  const hasModifications = appliedMods && appliedMods.length > 0;
  // Obter nome da habilidade de redução
  const reductionAbility = item.favoriteAbilityId 
    ? getCategoryReductionAbility(item.favoriteAbilityId) 
    : undefined;

  return (
    <TooltipProvider>
      <div 
        className={cn(
          "flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg ml-2 sm:ml-4 group transition-colors cursor-pointer gap-2 sm:gap-0",
          item.isEquipped 
            ? "bg-primary/10 border-primary/30" 
            : "bg-card/50 border-border/30 hover:border-primary/30 hover:bg-card/80"
        )}
        onClick={() => onViewDetails?.(item)}
      >
        <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {/* Equip Button */}
          {(onEquip || onUnequip) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    "w-8 h-8 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-colors flex-shrink-0 touch-manipulation",
                    item.isEquipped 
                      ? "text-primary hover:text-primary/70" 
                      : "text-foreground/60 hover:text-primary"
                  )}
                  onClick={(e) => { e.stopPropagation(); item.isEquipped ? onUnequip?.(item.id) : onEquip?.(item.id); }}
                >
                  {item.isEquipped ? (
                    <CircleCheck className="w-6 h-6 sm:w-5 sm:h-5" />
                  ) : (
                    <Circle className="w-6 h-6 sm:w-5 sm:h-5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-popover border-border hidden sm:block">
                <p className="text-xs">
                  {item.isEquipped ? 'Desequipar' : 'Equipar'}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <span className={cn(
                "font-medium text-sm sm:text-base break-words",
                item.isEquipped && "text-primary"
              )}>
                {item.name}
              </span>
              {item.quantity > 1 && (
                <Badge variant="outline" className="text-[10px] sm:text-xs flex-shrink-0">
                  x{item.quantity}
                </Badge>
              )}
              {/* Badge de usos para consumíveis */}
              {usesDisplay && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[10px] flex-shrink-0",
                    (item.uses ?? 0) > 0 
                      ? "bg-green-500/20 text-green-400 border-green-500/50" 
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {usesDisplay}
                </Badge>
              )}
              {item.isEquipped && (
                <Badge className="text-[10px] bg-primary/20 text-primary border-0 flex-shrink-0">
                  EQUIPADO
                </Badge>
              )}
            </div>
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 sm:truncate mt-0.5">
                {item.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap justify-end sm:justify-start">
          {/* Botão Modificar (para armas) */}
          {onModify && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 sm:h-7 px-2 text-xs touch-manipulation",
                    hasModifications 
                      ? "bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20" 
                      : "bg-muted/50 border-border hover:bg-muted"
                  )}
                  onClick={(e) => { e.stopPropagation(); onModify(item); }}
                >
                  <Wrench className="w-3.5 h-3.5 sm:w-3 sm:h-3 mr-1" />
                  {hasModifications ? `${appliedMods!.length}` : 'Mod'}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-popover border-border max-w-xs hidden sm:block">
                <p className="text-xs font-medium mb-1">Modificar Arma</p>
                {hasModifications && (
                  <div className="flex flex-wrap gap-1">
                    {appliedMods!.map(mod => (
                      <Badge key={mod} variant="secondary" className="text-[10px]">
                        {MODIFICATION_LABELS[mod]?.label || mod}
                      </Badge>
                    ))}
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          )}
          {/* Botão Usar (para consumíveis) */}
          {onUse && isConsumable && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 sm:h-7 px-2 text-xs bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 hover:text-green-300 touch-manipulation"
                  onClick={(e) => { e.stopPropagation(); onUse(item.id); }}
                >
                  <Zap className="w-3.5 h-3.5 sm:w-3 sm:h-3 mr-1" />
                  Usar
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-popover border-border max-w-xs hidden sm:block">
                <p className="text-xs font-medium mb-1">Usar {item.name}</p>
                {item.effect && (
                  <p className="text-xs text-muted-foreground">{item.effect}</p>
                )}
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px] border flex-shrink-0",
                  categoryConfig.color,
                  hasReduction && "ring-1 ring-yellow-500/50"
                )}
              >
                {hasReduction && <Star className="w-2.5 h-2.5 mr-0.5 text-yellow-400 fill-yellow-400" />}
                {categoryConfig.label}
              </Badge>
            </TooltipTrigger>
            {hasReduction && (
              <TooltipContent className="bg-popover border-border hidden sm:block">
                <p className="text-xs">
                  <span className="text-yellow-400">{reductionAbility?.abilityName}</span>: Cat. {item.category} → {displayCategory}
                </p>
              </TooltipContent>
            )}
          </Tooltip>
          <span className="text-[10px] sm:text-xs text-muted-foreground px-1.5 sm:px-2 py-1 bg-muted/50 rounded flex-shrink-0">
            {item.slots * item.quantity} esp.
          </span>
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 sm:h-7 sm:w-7 p-0 touch-manipulation"
              onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
            >
              <Trash2 className="w-4 h-4 sm:w-3 sm:h-3" />
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

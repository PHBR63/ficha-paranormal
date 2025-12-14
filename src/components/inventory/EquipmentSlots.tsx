import { useMemo } from 'react';
import { 
  Sword, 
  Shield, 
  Shirt, 
  HardHat, 
  Watch,
  Crosshair,
  CircleDot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InventoryItem } from '@/lib/inventory-system';
import { ItemType } from './InventoryPanel';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type EquipmentSlotType = 
  | 'primary_weapon' 
  | 'secondary_weapon' 
  | 'armor' 
  | 'head' 
  | 'accessory_1' 
  | 'accessory_2';

interface ExtendedInventoryItem extends InventoryItem {
  itemType?: ItemType;
  equipSlot?: EquipmentSlotType;
}

interface EquipmentSlotConfig {
  label: string;
  icon: typeof Sword;
  acceptTypes: ItemType[];
}

const EQUIPMENT_SLOTS: Record<EquipmentSlotType, EquipmentSlotConfig> = {
  primary_weapon: { 
    label: 'Arma Principal', 
    icon: Sword, 
    acceptTypes: ['weapon'] 
  },
  secondary_weapon: { 
    label: 'Arma Secundária', 
    icon: Crosshair, 
    acceptTypes: ['weapon'] 
  },
  armor: { 
    label: 'Proteção Corporal', 
    icon: Shirt, 
    acceptTypes: ['armor'] 
  },
  head: { 
    label: 'Proteção de Cabeça', 
    icon: HardHat, 
    acceptTypes: ['armor'] 
  },
  accessory_1: { 
    label: 'Acessório 1', 
    icon: Watch, 
    acceptTypes: ['valuable', 'misc', 'ritual'] 
  },
  accessory_2: { 
    label: 'Acessório 2', 
    icon: CircleDot, 
    acceptTypes: ['valuable', 'misc', 'ritual'] 
  },
};

interface EquipmentSlotsProps {
  inventory: ExtendedInventoryItem[];
  onUnequip?: (itemId: string) => void;
  compact?: boolean;
}

export function EquipmentSlots({ 
  inventory, 
  onUnequip,
  compact = false 
}: EquipmentSlotsProps) {
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

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-1">
          {Object.entries(EQUIPMENT_SLOTS).map(([slotKey, config]) => {
            const slot = slotKey as EquipmentSlotType;
            const item = equippedItems[slot];
            const Icon = config.icon;

            return (
              <Tooltip key={slot}>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      "w-8 h-8 rounded-lg border flex items-center justify-center transition-all",
                      item 
                        ? "bg-primary/20 border-primary/50 text-primary" 
                        : "bg-muted/30 border-border/50 text-muted-foreground/50"
                    )}
                    onClick={() => item && onUnequip?.(item.id)}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-popover border-border">
                  <p className="font-display text-xs">{config.label}</p>
                  {item && (
                    <p className="text-xs text-muted-foreground">{item.name}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <h4 className="font-display text-xs tracking-wider text-muted-foreground uppercase">
          Equipamento
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(EQUIPMENT_SLOTS).map(([slotKey, config]) => {
            const slot = slotKey as EquipmentSlotType;
            const item = equippedItems[slot];
            const Icon = config.icon;

            return (
              <Tooltip key={slot}>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      "p-3 rounded-lg border flex items-center gap-3 transition-all text-left w-full",
                      item 
                        ? "bg-primary/10 border-primary/30 hover:border-primary/50" 
                        : "bg-muted/20 border-border/30 hover:border-border/50"
                    )}
                    onClick={() => item && onUnequip?.(item.id)}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      item 
                        ? "bg-primary/20 text-primary" 
                        : "bg-muted/30 text-muted-foreground/50"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase">
                        {config.label}
                      </p>
                      {item ? (
                        <p className="font-medium text-sm truncate">{item.name}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground/50 italic">Vazio</p>
                      )}
                    </div>
                  </button>
                </TooltipTrigger>
                {item && (
                  <TooltipContent side="right" className="bg-popover border-border">
                    <p className="text-xs text-muted-foreground">
                      Clique para desequipar
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}

// Função auxiliar para determinar o slot apropriado
export function getAppropriateSlot(
  item: ExtendedInventoryItem, 
  equippedItems: Record<EquipmentSlotType, ExtendedInventoryItem | null>
): EquipmentSlotType | null {
  const itemType = item.itemType || 'misc';

  for (const [slotKey, config] of Object.entries(EQUIPMENT_SLOTS)) {
    const slot = slotKey as EquipmentSlotType;
    if (config.acceptTypes.includes(itemType) && !equippedItems[slot]) {
      return slot;
    }
  }

  return null;
}

export { EQUIPMENT_SLOTS };
export type { ExtendedInventoryItem as EquippableItem };

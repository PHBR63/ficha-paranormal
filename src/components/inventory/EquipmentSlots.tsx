/**
 * EquipmentSlots - Sistema de slots de equipamento corrigido
 * 
 * Slots disponíveis (conforme regras do livro):
 * - Arma Principal (permite armas de uma ou duas mãos)
 * - Arma Secundária (bloqueada se arma principal for duas mãos)
 * - Proteção Corporal (armaduras leves/pesadas)
 * - Escudo (dá bônus de defesa, ocupa uma mão)
 * - Acessório 1 e 2 (itens diversos)
 */

import { useMemo } from 'react';
import { 
  Sword, 
  Shield, 
  Shirt, 
  Watch,
  Crosshair,
  CircleDot,
  Lock
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

// Tipos de slot de equipamento (removido 'head', adicionado 'shield')
export type EquipmentSlotType = 
  | 'primary_weapon' 
  | 'secondary_weapon' 
  | 'armor' 
  | 'shield'
  | 'accessory_1' 
  | 'accessory_2';

// Interface estendida para itens com dados de combate
interface ExtendedInventoryItem extends InventoryItem {
  itemType?: ItemType;
  equipSlot?: EquipmentSlotType;
  // Dados de armas
  properties?: string[];
  damage?: string;
  damageType?: string;
  critical?: number;
  criticalMultiplier?: number;
  range?: string;
  special?: string;
  ammoType?: string;
  // Dados de armaduras
  rd?: number;
  agilityPenalty?: number;
  speedPenalty?: number;
  armorType?: 'leve' | 'pesada' | 'escudo';
}

// Configuração dos slots de equipamento
interface EquipmentSlotConfig {
  label: string;
  icon: typeof Sword;
  acceptTypes: ItemType[];
  // Tipos de armadura aceitos (para diferenciar armor de shield)
  acceptArmorTypes?: ('leve' | 'pesada' | 'escudo')[];
}

// Slots de equipamento com configuração corrigida
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
    acceptTypes: ['armor'],
    acceptArmorTypes: ['leve', 'pesada'] // Apenas armaduras, não escudos
  },
  shield: { 
    label: 'Escudo', 
    icon: Shield, 
    acceptTypes: ['armor'],
    acceptArmorTypes: ['escudo'] // Apenas escudos
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
  // Callback para verificar se arma primária bloqueia secundária
  isPrimaryTwoHanded?: boolean;
}

/**
 * Verifica se uma arma tem a propriedade "Duas mãos"
 */
export function isTwoHandedWeapon(item: ExtendedInventoryItem): boolean {
  if (!item.properties) return false;
  return item.properties.some(prop => 
    prop.toLowerCase().includes('duas mãos') || 
    prop.toLowerCase().includes('duas maos')
  );
}

/**
 * Componente de visualização dos slots de equipamento
 */
export function EquipmentSlots({ 
  inventory, 
  onUnequip,
  compact = false,
  isPrimaryTwoHanded = false
}: EquipmentSlotsProps) {
  // Mapear itens equipados por slot
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
  const primaryWeapon = equippedItems.primary_weapon;
  const primaryIsTwoHanded = primaryWeapon ? isTwoHandedWeapon(primaryWeapon) : isPrimaryTwoHanded;

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-1">
          {Object.entries(EQUIPMENT_SLOTS).map(([slotKey, config]) => {
            const slot = slotKey as EquipmentSlotType;
            const item = equippedItems[slot];
            const Icon = config.icon;
            
            // Verificar se slot secundário está bloqueado por arma de duas mãos
            const isBlocked = slot === 'secondary_weapon' && primaryIsTwoHanded;
            // Escudo também é bloqueado se arma primária for duas mãos
            const isShieldBlocked = slot === 'shield' && primaryIsTwoHanded;

            return (
              <Tooltip key={slot}>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      "w-8 h-8 rounded-lg border flex items-center justify-center transition-all",
                      (isBlocked || isShieldBlocked)
                        ? "bg-muted/10 border-muted/30 text-muted-foreground/30 cursor-not-allowed"
                        : item 
                          ? "bg-primary/20 border-primary/50 text-primary" 
                          : "bg-muted/30 border-border/50 text-muted-foreground/50"
                    )}
                    onClick={() => item && !isBlocked && !isShieldBlocked && onUnequip?.(item.id)}
                    disabled={isBlocked || isShieldBlocked}
                  >
                    {(isBlocked || isShieldBlocked) ? (
                      <Lock className="w-3 h-3" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-popover border-border">
                  <p className="font-display text-xs">{config.label}</p>
                  {(isBlocked || isShieldBlocked) && (
                    <p className="text-xs text-destructive">Bloqueado (arma de duas mãos)</p>
                  )}
                  {item && !isBlocked && !isShieldBlocked && (
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
            
            // Verificar se slot secundário está bloqueado por arma de duas mãos
            const isBlocked = slot === 'secondary_weapon' && primaryIsTwoHanded;
            // Escudo também é bloqueado se arma primária for duas mãos
            const isShieldBlocked = slot === 'shield' && primaryIsTwoHanded;

            return (
              <Tooltip key={slot}>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      "p-3 rounded-lg border flex items-center gap-3 transition-all text-left w-full",
                      (isBlocked || isShieldBlocked)
                        ? "bg-muted/10 border-muted/20 cursor-not-allowed opacity-50"
                        : item 
                          ? "bg-primary/10 border-primary/30 hover:border-primary/50" 
                          : "bg-muted/20 border-border/30 hover:border-border/50"
                    )}
                    onClick={() => item && !isBlocked && !isShieldBlocked && onUnequip?.(item.id)}
                    disabled={isBlocked || isShieldBlocked}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      (isBlocked || isShieldBlocked)
                        ? "bg-muted/20 text-muted-foreground/30"
                        : item 
                          ? "bg-primary/20 text-primary" 
                          : "bg-muted/30 text-muted-foreground/50"
                    )}>
                      {(isBlocked || isShieldBlocked) ? (
                        <Lock className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase">
                        {config.label}
                      </p>
                      {(isBlocked || isShieldBlocked) ? (
                        <p className="text-xs text-destructive/70 italic">Duas mãos</p>
                      ) : item ? (
                        <p className="font-medium text-sm truncate">{item.name}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground/50 italic">Vazio</p>
                      )}
                    </div>
                  </button>
                </TooltipTrigger>
                {item && !isBlocked && !isShieldBlocked && (
                  <TooltipContent side="right" className="bg-popover border-border">
                    <p className="text-xs text-muted-foreground">
                      Clique para desequipar
                    </p>
                  </TooltipContent>
                )}
                {(isBlocked || isShieldBlocked) && (
                  <TooltipContent side="right" className="bg-popover border-border">
                    <p className="text-xs text-destructive">
                      Arma principal ocupa as duas mãos
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

/**
 * Função auxiliar para determinar o slot apropriado
 * Corrigida para diferenciar escudos de armaduras
 */
export function getAppropriateSlot(
  item: ExtendedInventoryItem, 
  equippedItems: Record<EquipmentSlotType, ExtendedInventoryItem | null>,
  isPrimaryTwoHanded: boolean = false
): EquipmentSlotType | null {
  const itemType = item.itemType || 'misc';
  
  // Verificar se a arma primária é de duas mãos
  const primaryWeapon = equippedItems.primary_weapon;
  const actualPrimaryTwoHanded = isPrimaryTwoHanded || (primaryWeapon ? isTwoHandedWeapon(primaryWeapon) : false);

  // Para armaduras, verificar se é escudo
  if (itemType === 'armor') {
    const armorType = item.armorType;
    
    if (armorType === 'escudo') {
      // Escudo vai para slot de escudo, se não estiver bloqueado
      if (!actualPrimaryTwoHanded && !equippedItems.shield) {
        return 'shield';
      }
      return null;
    } else {
      // Armaduras leves/pesadas vão para slot de armor
      if (!equippedItems.armor) {
        return 'armor';
      }
      return null;
    }
  }

  // Para armas
  if (itemType === 'weapon') {
    // Se a arma sendo equipada é de duas mãos
    if (isTwoHandedWeapon(item)) {
      // Só pode equipar se slot primário estiver vazio E secundário estiver vazio
      if (!equippedItems.primary_weapon) {
        return 'primary_weapon';
      }
      return null;
    }
    
    // Arma de uma mão - tentar primário primeiro, depois secundário
    if (!equippedItems.primary_weapon) {
      return 'primary_weapon';
    }
    
    // Verificar se pode usar secundário
    if (!actualPrimaryTwoHanded && !equippedItems.secondary_weapon) {
      return 'secondary_weapon';
    }
    
    return null;
  }

  // Para outros tipos de item (acessórios)
  for (const [slotKey, config] of Object.entries(EQUIPMENT_SLOTS)) {
    const slot = slotKey as EquipmentSlotType;
    if (config.acceptTypes.includes(itemType) && !equippedItems[slot]) {
      // Pular slots bloqueados
      if ((slot === 'secondary_weapon' || slot === 'shield') && actualPrimaryTwoHanded) {
        continue;
      }
      return slot;
    }
  }

  return null;
}

/**
 * Calcula o bônus de defesa total dos escudos equipados
 */
export function getShieldDefenseBonus(inventory: ExtendedInventoryItem[]): number {
  let bonus = 0;
  
  inventory.forEach(item => {
    if (item.isEquipped && item.equipSlot === 'shield' && item.armorType === 'escudo') {
      // Escudos dão bônus de defesa baseado no special (ex: "Defesa +2")
      if (item.special) {
        const match = item.special.match(/Defesa \+(\d+)/i);
        if (match) {
          bonus += parseInt(match[1]);
        }
      }
    }
  });
  
  return bonus;
}

export { EQUIPMENT_SLOTS };
export type { ExtendedInventoryItem as EquippableItem };

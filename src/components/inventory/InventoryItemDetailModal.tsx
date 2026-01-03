/**
 * Modal de Detalhes do Item de Inventário
 * Exibe informações completas de qualquer item do inventário
 */

import { motion } from 'framer-motion';
import {
  MobileModal,
  MobileModalContent,
  MobileModalBody,
  MobileModalFooter,
} from '@/components/ui/mobile-modal';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sword,
  Shield,
  FlaskConical,
  Scroll,
  Gem,
  Package,
  Flame,
  Zap,
  Target,
  Info,
  Sparkles,
  CheckCircle2,
  Circle,
  Wrench,
  AlertTriangle,
  Recycle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExtendedInventoryItem, ItemType } from './InventoryPanel';
import { MODIFICATION_LABELS, type WeaponModification } from '@/lib/catalogs';

interface InventoryItemDetailModalProps {
  item: ExtendedInventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEquip?: (id: string) => void;
  onUnequip?: (id: string) => void;
  onUse?: (id: string) => void;
  onRemove?: (id: string) => void;
}

// Configuração de ícones e cores por tipo
const TYPE_CONFIG: Record<ItemType, { icon: typeof Package; color: string; label: string }> = {
  weapon: { icon: Sword, color: 'text-destructive bg-destructive/10', label: 'Arma' },
  armor: { icon: Shield, color: 'text-blue-400 bg-blue-500/10', label: 'Proteção' },
  consumable: { icon: FlaskConical, color: 'text-green-400 bg-green-500/10', label: 'Consumível' },
  ritual: { icon: Scroll, color: 'text-paranormal bg-paranormal/10', label: 'Componente Ritual' },
  valuable: { icon: Gem, color: 'text-yellow-400 bg-yellow-500/10', label: 'Item Valioso' },
  misc: { icon: Package, color: 'text-muted-foreground bg-muted/30', label: 'Diversos' },
};

const CATEGORY_COLORS: Record<string, string> = {
  '0': 'bg-muted text-muted-foreground',
  'I': 'bg-green-500/20 text-green-400 border-green-500/50',
  'II': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  'III': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  'IV': 'bg-red-500/20 text-red-400 border-red-500/50',
};

export function InventoryItemDetailModal({
  item,
  open,
  onOpenChange,
  onEquip,
  onUnequip,
  onUse,
  onRemove,
}: InventoryItemDetailModalProps) {
  if (!item) return null;

  const itemType = item.itemType || 'misc';
  const typeConfig = TYPE_CONFIG[itemType];
  const TypeIcon = typeConfig.icon;
  const categoryConfig = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['0'];

  // Dados extras do item (armas, armaduras, etc.)
  const extendedItem = item as ExtendedInventoryItem & {
    damage?: string;
    damageType?: string;
    critical?: number;
    criticalMultiplier?: number;
    range?: string;
    special?: string;
    properties?: string[];
    ammoType?: string;
    defenseBonus?: number;
    rd?: number;
    agilityPenalty?: number;
    armorType?: string;
    effect?: string;
    uses?: number;
    maxUses?: number;
    appliedModifications?: WeaponModification[];
  };

  const isWeapon = itemType === 'weapon';
  const isArmor = itemType === 'armor';
  const isConsumable = item.consumable;
  const hasModifications = extendedItem.appliedModifications && extendedItem.appliedModifications.length > 0;

  return (
    <MobileModal open={open} onOpenChange={onOpenChange}>
      <MobileModalContent size="sm" className="p-0 gap-0 overflow-hidden">
        {/* Header com gradiente */}
        <div className={cn(
          "p-4 sm:p-6",
          typeConfig.color.split(' ')[1] // usa só o bg-
        )}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  typeConfig.color
                )}
              >
                <TypeIcon className="w-6 h-6" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-lg truncate">{item.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={cn("text-xs", categoryConfig)}>
                    Cat. {item.category === '0' ? '-' : item.category}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {typeConfig.label}
                  </Badge>
                  {item.isEquipped && (
                    <Badge className="text-xs bg-primary/20 text-primary border-0">
                      EQUIPADO
                    </Badge>
                  )}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Conteúdo scrollável */}
        <MobileModalBody>
          <div className="space-y-4">
            {/* Info básica */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Package className="w-4 h-4" />
                {item.slots * item.quantity} espaço(s)
              </span>
              {item.quantity > 1 && (
                <span>Quantidade: {item.quantity}</span>
              )}
              {isConsumable && (
                <span className="flex items-center gap-1 text-green-400">
                  <Recycle className="w-4 h-4" />
                  {extendedItem.uses ?? 0}/{extendedItem.maxUses ?? extendedItem.uses ?? 0} usos
                </span>
              )}
            </div>

            {/* Descrição */}
            {item.description && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Descrição
                </h4>
                <p className="text-sm whitespace-pre-wrap break-words">
                  {item.description}
                </p>
              </div>
            )}

            {/* Stats de Arma */}
            {isWeapon && extendedItem.damage && (
              <>
                <Separator />
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Estatísticas de Combate
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.div 
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="p-3 bg-destructive/10 rounded-lg text-center"
                    >
                      <Flame className="w-5 h-5 mx-auto mb-1 text-destructive" />
                      <p className="font-display text-xl text-destructive">{extendedItem.damage}</p>
                      <p className="text-xs text-muted-foreground">{extendedItem.damageType}</p>
                    </motion.div>
                    <motion.div 
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.15 }}
                      className="p-3 bg-yellow-500/10 rounded-lg text-center"
                    >
                      <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                      <p className="font-display text-xl text-yellow-500">
                        {extendedItem.critical === 20 ? '20' : `${extendedItem.critical}-20`}
                      </p>
                      <p className="text-xs text-muted-foreground">x{extendedItem.criticalMultiplier}</p>
                    </motion.div>
                  </div>

                  {extendedItem.range && (
                    <div className="flex items-center gap-2 mt-3 text-sm">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span>Alcance: {extendedItem.range}</span>
                    </div>
                  )}

                  {extendedItem.ammoType && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Info className="w-4 h-4" />
                      <span>Munição: {extendedItem.ammoType}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Stats de Armadura */}
            {isArmor && (
              <>
                <Separator />
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Proteção
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {extendedItem.defenseBonus !== undefined && (
                      <motion.div 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="p-3 bg-primary/10 rounded-lg text-center"
                      >
                        <Shield className="w-5 h-5 mx-auto mb-1 text-primary" />
                        <p className="font-display text-xl text-primary">+{extendedItem.defenseBonus}</p>
                        <p className="text-xs text-muted-foreground">Defesa</p>
                      </motion.div>
                    )}
                    {extendedItem.rd !== undefined && extendedItem.rd > 0 && (
                      <motion.div 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="p-3 bg-blue-500/10 rounded-lg text-center"
                      >
                        <Shield className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                        <p className="font-display text-xl text-blue-400">{extendedItem.rd}</p>
                        <p className="text-xs text-muted-foreground">RD</p>
                      </motion.div>
                    )}
                  </div>

                  {extendedItem.agilityPenalty !== undefined && extendedItem.agilityPenalty !== 0 && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-destructive">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Penalidade: {extendedItem.agilityPenalty} em testes de AGI</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Propriedades */}
            {extendedItem.properties && extendedItem.properties.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Propriedades
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {extendedItem.properties.map(prop => (
                      <Badge key={prop} variant="secondary" className="text-xs">
                        {prop}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Modificações de Arma */}
            {hasModifications && (
              <>
                <Separator />
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-purple-400" />
                    Modificações Aplicadas
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {extendedItem.appliedModifications!.map(mod => (
                      <Badge key={mod} variant="outline" className="text-xs bg-purple-500/10 border-purple-500/30 text-purple-400">
                        {MODIFICATION_LABELS[mod]?.label || mod}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Especial / Efeito */}
            {(extendedItem.special || extendedItem.effect) && (
              <>
                <Separator />
                <motion.div 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-3 bg-primary/10 border border-primary/30 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
                    <Sparkles className="w-4 h-4" />
                    {extendedItem.effect ? 'Efeito' : 'Especial'}
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {extendedItem.effect || extendedItem.special}
                  </p>
                </motion.div>
              </>
            )}
          </div>
        </MobileModalBody>

        {/* Botões de ação */}
        <MobileModalFooter bordered>
          <div className="flex gap-2 w-full">
            {/* Botão Equipar/Desequipar */}
            {(onEquip || onUnequip) && (
              <Button
                variant={item.isEquipped ? "outline" : "default"}
                className="flex-1"
                onClick={() => {
                  if (item.isEquipped && onUnequip) {
                    onUnequip(item.id);
                  } else if (!item.isEquipped && onEquip) {
                    onEquip(item.id);
                  }
                  onOpenChange(false);
                }}
              >
                {item.isEquipped ? (
                  <>
                    <Circle className="w-4 h-4 mr-2" />
                    Desequipar
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Equipar
                  </>
                )}
              </Button>
            )}

            {/* Botão Usar (consumíveis) */}
            {onUse && isConsumable && (extendedItem.uses ?? 0) > 0 && (
              <Button
                variant="default"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => {
                  onUse(item.id);
                  onOpenChange(false);
                }}
              >
                <Zap className="w-4 h-4 mr-2" />
                Usar
              </Button>
            )}

            {/* Botão Fechar */}
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
        </MobileModalFooter>
      </MobileModalContent>
    </MobileModal>
  );
}

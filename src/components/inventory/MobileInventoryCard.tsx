/**
 * MobileInventoryCard - Card compacto com swipe gestures para inventário mobile
 * Inclui MobileActionSheet como alternativa ao swipe para acessibilidade
 */

import { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { 
  CircleCheck, 
  Circle, 
  Trash2, 
  Zap, 
  Wrench,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Star,
  Clock,
} from '@/components/icons/ordem-icons';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MobileActionSheet, useActionSheet } from '@/components/ui/mobile-action-sheet';
import type { ExtendedInventoryItem } from './InventoryPanel';
import type { WeaponModification } from '@/lib/catalogs';
import type { CategoryReductionConfig } from '@/lib/category-reduction';

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  '0': { label: 'Sem Cat.', color: 'bg-muted text-muted-foreground' },
  'I': { label: 'I', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
  'II': { label: 'II', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
  'III': { label: 'III', color: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
  'IV': { label: 'IV', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
};

const SWIPE_THRESHOLD = 80;

/**
 * Dispara haptic feedback (vibração) em dispositivos que suportam
 * @param pattern - duração em ms ou padrão de vibração
 */
function triggerHaptic(pattern: number | number[] = 50) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

interface MobileInventoryCardProps {
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

export function MobileInventoryCard({ 
  item, 
  onRemove, 
  onEquip, 
  onUnequip, 
  onUse, 
  onModify, 
  onViewDetails,
  onToggleFavorite,
  availableAbilities,
}: MobileInventoryCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const actionSheet = useActionSheet();
  
  // Categoria efetiva (após redução se aplicável)
  const displayCategory = (item as any).effectiveCategory || item.category;
  const hasReduction = (item as any).effectiveCategory && (item as any).effectiveCategory !== item.category;
  const categoryConfig = CATEGORY_LABELS[displayCategory] || CATEGORY_LABELS['0'];
  const originalCategoryConfig = CATEGORY_LABELS[item.category] || CATEGORY_LABELS['0'];
  
  const isConsumable = item.consumable && (item.uses ?? 0) > 0;
  const usesDisplay = item.consumable ? `${item.uses ?? 0}/${item.maxUses ?? item.uses ?? 0}` : null;
  const appliedMods = (item as any).appliedModifications as WeaponModification[] | undefined;
  const hasModifications = appliedMods && appliedMods.length > 0;
  const isFavorite = !!(item as any).favoriteAbilityId;
  const isTemporary = (item as any).isTemporary === true;

  // Monta ações para o ActionSheet
  const actions = [
    ...(onViewDetails ? [{
      id: 'view',
      label: 'Ver Detalhes',
      icon: Eye,
      onPress: () => onViewDetails(item),
    }] : []),
    ...(onToggleFavorite && item.itemType === 'weapon' && availableAbilities?.length ? [{
      id: 'favorite',
      label: item.favoriteAbilityId ? 'Remover Favorita' : 'Marcar Favorita',
      icon: Star,
      description: availableAbilities[0]?.description,
      onPress: () => onToggleFavorite(item),
    }] : []),
    ...(onEquip && !item.isEquipped ? [{
      id: 'equip',
      label: 'Equipar',
      icon: CircleCheck,
      onPress: () => onEquip(item.id),
    }] : []),
    ...(onUnequip && item.isEquipped ? [{
      id: 'unequip',
      label: 'Desequipar',
      icon: Circle,
      onPress: () => onUnequip(item.id),
    }] : []),
    ...(onUse && isConsumable ? [{
      id: 'use',
      label: 'Usar',
      icon: Zap,
      onPress: () => onUse(item.id),
    }] : []),
    ...(onModify ? [{
      id: 'modify',
      label: 'Modificar',
      icon: Wrench,
      onPress: () => onModify(item),
    }] : []),
    ...(onRemove ? [{
      id: 'remove',
      label: 'Remover',
      icon: Trash2,
      destructive: true,
      onPress: () => onRemove(item.id),
    }] : []),
  ];

  // Transforms para as ações de swipe
  const leftActionOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const rightActionOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const leftActionScale = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0.8]);
  const rightActionScale = useTransform(x, [0, SWIPE_THRESHOLD], [0.8, 1]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    const { offset } = info;
    
    // Swipe para esquerda = ação primária (equipar/desequipar)
    if (offset.x < -SWIPE_THRESHOLD) {
      if (item.isEquipped && onUnequip) {
        triggerHaptic(30); // Vibração curta para desequipar
        onUnequip(item.id);
      } else if (!item.isEquipped && onEquip) {
        triggerHaptic([20, 30, 20]); // Padrão de vibração para equipar
        onEquip(item.id);
      }
    }
    // Swipe para direita = remover
    else if (offset.x > SWIPE_THRESHOLD && onRemove) {
      triggerHaptic([50, 50, 100]); // Vibração mais longa para remover
      onRemove(item.id);
    }
  };

  const canSwipeLeft = (onEquip && !item.isEquipped) || (onUnequip && item.isEquipped);
  const canSwipeRight = !!onRemove;

  return (
    <div className="relative overflow-hidden rounded-lg ml-2">
      {/* Ação esquerda (Equipar/Desequipar) */}
      {canSwipeLeft && (
        <motion.div 
          className={cn(
            "absolute inset-y-0 left-0 flex items-center justify-center px-4 w-20",
            item.isEquipped 
              ? "bg-amber-500/20" 
              : "bg-primary/20"
          )}
          style={{ opacity: leftActionOpacity, scale: leftActionScale }}
        >
          <div className="flex flex-col items-center gap-1 text-center">
            {item.isEquipped ? (
              <>
                <Circle className="w-5 h-5 text-amber-400" />
                <span className="text-[10px] text-amber-400 font-medium">Desequipar</span>
              </>
            ) : (
              <>
                <CircleCheck className="w-5 h-5 text-primary" />
                <span className="text-[10px] text-primary font-medium">Equipar</span>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Ação direita (Remover) */}
      {canSwipeRight && (
        <motion.div 
          className="absolute inset-y-0 right-0 flex items-center justify-center px-4 w-20 bg-destructive/20"
          style={{ opacity: rightActionOpacity, scale: rightActionScale }}
        >
          <div className="flex flex-col items-center gap-1 text-center">
            <Trash2 className="w-5 h-5 text-destructive" />
            <span className="text-[10px] text-destructive font-medium">Remover</span>
          </div>
        </motion.div>
      )}

      {/* Card principal */}
      <motion.div
        className={cn(
          "relative p-3 border rounded-lg transition-colors",
          item.isEquipped 
            ? "bg-primary/10 border-primary/30" 
            : "bg-card border-border/30",
          isDragging && "shadow-lg"
        )}
        style={{ x }}
        drag="x"
        dragConstraints={{ left: canSwipeLeft ? -120 : 0, right: canSwipeRight ? 120 : 0 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        onClick={() => !isDragging && onViewDetails?.(item)}
      >
        {/* Indicadores de swipe */}
        <div className="absolute inset-y-0 left-1 flex items-center pointer-events-none opacity-30">
          {canSwipeLeft && <ChevronLeft className="w-4 h-4 text-muted-foreground" />}
        </div>
        <div className="absolute inset-y-0 right-1 flex items-center pointer-events-none opacity-30">
          {canSwipeRight && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>

        {/* Conteúdo do card */}
        <div className="flex items-center gap-3">
          {/* Indicador de equipado */}
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
            item.isEquipped 
              ? "bg-primary/20 text-primary" 
              : "bg-muted/50 text-foreground/60"
          )}>
            {item.isEquipped ? (
              <CircleCheck className="w-5 h-5" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </div>

          {/* Info principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "font-medium text-sm truncate max-w-[140px]",
                item.isEquipped && "text-primary"
              )}>
                {item.name}
              </span>
              {item.quantity > 1 && (
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  x{item.quantity}
                </Badge>
              )}
              {hasModifications && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 bg-purple-500/10 border-purple-500/30 text-purple-400">
                  <Wrench className="w-2.5 h-2.5 mr-0.5" />
                  {appliedMods!.length}
                </Badge>
              )}
            </div>
            
            {/* Segunda linha: badges */}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {/* Indicador Arma Favorita com redução de categoria */}
              {isFavorite && (
                <Badge 
                  variant="outline" 
                  className="text-[9px] px-1.5 py-0 bg-yellow-500/15 text-yellow-400 border-yellow-500/40"
                >
                  <Star className="w-2.5 h-2.5 mr-0.5 fill-yellow-400" />
                  FAVORITA
                </Badge>
              )}
              {/* Categoria com indicador de redução */}
              {hasReduction ? (
                <div className="flex items-center gap-0.5">
                  <Badge 
                    variant="outline" 
                    className={cn("text-[9px] px-1 py-0 border line-through opacity-60", originalCategoryConfig.color)}
                  >
                    {originalCategoryConfig.label}
                  </Badge>
                  <span className="text-[8px] text-yellow-400">→</span>
                  <Badge 
                    variant="outline" 
                    className={cn("text-[9px] px-1.5 py-0 border", categoryConfig.color)}
                  >
                    {categoryConfig.label}
                  </Badge>
                </div>
              ) : (
                <Badge 
                  variant="outline" 
                  className={cn("text-[9px] px-1.5 py-0 border", categoryConfig.color)}
                >
                  {categoryConfig.label}
                </Badge>
              )}
              <span className="text-[9px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                {item.slots * item.quantity} esp.
              </span>
              {usesDisplay && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[9px] px-1.5 py-0",
                    (item.uses ?? 0) > 0 
                      ? "bg-green-500/20 text-green-400 border-green-500/50" 
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {usesDisplay}
                </Badge>
              )}
              {item.isEquipped && (
                <Badge className="text-[9px] px-1.5 py-0 bg-primary/20 text-primary border-0">
                  EQUIPADO
                </Badge>
              )}
              {isTemporary && (
                <Badge 
                  variant="outline" 
                  className="text-[9px] px-1.5 py-0 bg-amber-500/10 text-amber-400 border-amber-500/30"
                  title={(item as any).temporarySource || 'Item temporário'}
                >
                  <Clock className="w-2.5 h-2.5 mr-0.5" />
                  TEMP
                </Badge>
              )}
            </div>
          </div>

          {/* Botões de ação rápida */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {onUse && isConsumable && (
              <button
                className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 active:bg-green-500/20"
                onClick={(e) => { e.stopPropagation(); onUse(item.id); }}
              >
                <Zap className="w-4 h-4" />
              </button>
            )}
            {onModify && (
              <button
                className={cn(
                  "w-8 h-8 rounded-lg border flex items-center justify-center active:opacity-70",
                  hasModifications 
                    ? "bg-purple-500/10 border-purple-500/30 text-purple-400" 
                    : "bg-muted/50 border-border text-muted-foreground"
                )}
                onClick={(e) => { e.stopPropagation(); onModify(item); }}
              >
                <Wrench className="w-4 h-4" />
              </button>
            )}
            {/* Botão de menu alternativo ao swipe */}
            {actions.length > 0 && (
              <button
                className="w-8 h-8 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-muted-foreground active:bg-muted"
                onClick={(e) => { e.stopPropagation(); actionSheet.open(); }}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Dica de swipe (apenas se puder fazer swipe) */}
        {(canSwipeLeft || canSwipeRight) && (
          <div className="flex justify-center mt-2 gap-4 text-[9px] text-foreground/60">
            {canSwipeLeft && (
              <span>← {item.isEquipped ? 'Desequipar' : 'Equipar'}</span>
            )}
            {canSwipeRight && (
              <span>Remover →</span>
            )}
          </div>
        )}
      </motion.div>

      {/* MobileActionSheet como alternativa ao swipe */}
      <MobileActionSheet
        open={actionSheet.isOpen}
        onOpenChange={actionSheet.setIsOpen}
        title={item.name}
        description={`${categoryConfig.label} • ${item.slots * item.quantity} esp.`}
        actions={actions}
      />
    </div>
  );
}

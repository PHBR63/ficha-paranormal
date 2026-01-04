/**
 * VirtualizedInventoryList - Lista virtualizada de itens do inventário
 * 
 * Usa @tanstack/react-virtual para renderizar apenas itens visíveis,
 * melhorando a performance em inventários com muitos itens.
 */

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MobileInventoryCard } from './MobileInventoryCard';
import { ExtendedInventoryItem } from './InventoryPanel';

// Altura estimada de cada item (usada para cálculo inicial)
const ITEM_HEIGHT_MOBILE = 120; // MobileInventoryCard é mais alto
const ITEM_HEIGHT_DESKTOP = 64; // InventoryItemRow é mais compacto

interface VirtualizedInventoryListProps {
  items: ExtendedInventoryItem[];
  isMobile: boolean;
  readOnly?: boolean;
  onRemove?: (id: string) => void;
  onEquip?: (id: string) => void;
  onUnequip?: (id: string) => void;
  onUse?: (id: string) => void;
  onModify?: (item: ExtendedInventoryItem) => void;
  onViewDetails?: (item: ExtendedInventoryItem) => void;
  renderItem: (item: ExtendedInventoryItem, index: number) => React.ReactNode;
  /** Altura máxima do container virtualizado */
  maxHeight?: number;
}

export function VirtualizedInventoryList({
  items,
  isMobile,
  maxHeight = 400,
  renderItem,
}: VirtualizedInventoryListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const estimateSize = isMobile ? ITEM_HEIGHT_MOBILE : ITEM_HEIGHT_DESKTOP;

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 5, // Renderiza 5 itens extras acima e abaixo para scroll suave
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="overflow-auto ml-2 sm:ml-4"
      style={{
        maxHeight: `${maxHeight}px`,
        contain: 'strict',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          return (
            <div
              key={item.id}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Threshold para ativar virtualização (só virtualiza se tiver muitos itens)
export const VIRTUALIZATION_THRESHOLD = 10;

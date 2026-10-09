/**
 * MobileVirtualizedPowersList - Lista virtualizada de poderes
 * Otimiza performance para listas longas de poderes e rituais
 */

import { memo, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronRight, Scroll } from '@/components/icons/ordem-icons';
import { cn } from '@/lib/utils';
import { getElementIcon, getElementColor } from './utils';

// Altura estimada por tipo de item
const POWER_ITEM_HEIGHT = 72;
const RITUAL_ITEM_HEIGHT = 56;

// Tipos de poder suportados
export type PowerItemType = 'ability' | 'paranormal' | 'general' | 'origin' | 'ritual';

// Interface para item de poder genérico
export interface PowerItem {
  id: string;
  name: string;
  description?: string;
  type: PowerItemType;
  element?: string;
  category?: string;
  circle?: number;
}

interface MobileVirtualizedPowersListProps {
  items: PowerItem[];
  onItemClick: (item: PowerItem) => void;
  maxHeight?: number;
  emptyMessage?: string;
}

// Componente de item de poder memoizado
const PowerListItem = memo(function PowerListItem({
  item,
  onClick,
  style,
}: {
  item: PowerItem;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  // Estilo base por tipo
  const getTypeStyles = () => {
    switch (item.type) {
      case 'ability':
        return 'bg-primary/10 border-primary/20 active:bg-primary/20';
      case 'paranormal':
        return cn(getElementColor(item.element || 'generic'), 'active:opacity-80');
      case 'general':
        return 'bg-success/10 border-success/20 active:bg-success/20';
      case 'origin':
        return 'bg-secondary/10 border-secondary/20 active:bg-secondary/20';
      case 'ritual':
        return 'bg-paranormal/10 border-paranormal/20 active:bg-paranormal/20';
      default:
        return 'bg-muted/10 border-border active:bg-muted/20';
    }
  };

  // Cor do texto/ícone por tipo
  const getAccentColor = () => {
    switch (item.type) {
      case 'ability':
        return 'text-primary';
      case 'paranormal':
        return 'text-paranormal';
      case 'general':
        return 'text-success';
      case 'origin':
        return 'text-secondary';
      case 'ritual':
        return 'text-paranormal';
      default:
        return 'text-foreground';
    }
  };

  // Renderização específica para rituais
  if (item.type === 'ritual') {
    return (
      <div style={style} className="px-0.5 py-1">
        <button
          onClick={onClick}
          className={cn(
            "w-full p-2.5 rounded-lg border flex items-center gap-3 transition-colors text-left",
            getTypeStyles()
          )}
        >
          <div className="w-8 h-8 rounded-full bg-paranormal/20 flex items-center justify-center flex-shrink-0">
            {item.circle ? (
              <span className="text-sm font-display text-paranormal">{item.circle}º</span>
            ) : (
              <Scroll className="w-4 h-4 text-paranormal" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm text-paranormal font-medium">{item.name}</span>
            {item.element && (
              <p className="text-[10px] text-muted-foreground capitalize">{item.element}</p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-paranormal/50 flex-shrink-0" />
        </button>
      </div>
    );
  }

  // Renderização padrão para outros poderes
  return (
    <div style={style} className="px-0.5 py-1">
      <button
        onClick={onClick}
        className={cn(
          "w-full p-3 rounded-lg border text-left transition-colors",
          getTypeStyles()
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {item.type === 'paranormal' && item.element && (
                <span className="text-lg">{getElementIcon(item.element)}</span>
              )}
              <span className={cn("font-medium text-sm", getAccentColor())}>
                {item.name}
              </span>
              {item.category && (
                <span className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded capitalize",
                  item.type === 'general' ? "bg-success/30 text-success" : "bg-muted text-muted-foreground"
                )}>
                  {item.category}
                </span>
              )}
            </div>
            {item.description && (
              <p className="text-[11px] text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
          <ChevronRight className={cn("w-4 h-4 flex-shrink-0 ml-2 opacity-50", getAccentColor())} />
        </div>
      </button>
    </div>
  );
});

// Componente principal da lista virtualizada
export const MobileVirtualizedPowersList = memo(function MobileVirtualizedPowersList({
  items,
  onItemClick,
  maxHeight = 400,
  emptyMessage = 'Nenhum poder encontrado.',
}: MobileVirtualizedPowersListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Calcula altura estimada com base no tipo
  const estimateSize = useCallback((index: number) => {
    const item = items[index];
    return item.type === 'ritual' ? RITUAL_ITEM_HEIGHT : POWER_ITEM_HEIGHT;
  }, [items]);

  // Configuração do virtualizador
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 3,
  });

  // Handler com feedback háptico
  const handleItemClick = useCallback((item: PowerItem) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onItemClick(item);
  }, [onItemClick]);

  if (items.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div 
      ref={parentRef}
      className="overflow-auto scrollbar-hide"
      style={{ maxHeight }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index];
          return (
            <PowerListItem
              key={item.id}
              item={item}
              onClick={() => handleItemClick(item)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
});

export default MobileVirtualizedPowersList;

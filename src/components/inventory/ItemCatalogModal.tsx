/**
 * ItemCatalogModal - Modal para selecionar itens gerais do catálogo
 * 
 * Funcionalidades:
 * - Lista todos os itens gerais do catálogo
 * - Filtro por tipo e categoria
 * - Busca por nome
 * - Exibe detalhes completos do item
 * - Adiciona ao inventário
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search,
  Plus,
  Lock,
  CheckCircle2,
  XCircle,
  Package,
  Briefcase,
  Bomb,
  Wrench,
  Eye,
  Zap,
  Recycle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ALL_ITEMS,
  ACCESSORIES,
  EXPLOSIVES,
  OPERATIONAL_ITEMS,
  PARANORMAL_ITEMS,
  type CatalogItem,
  type ItemType,
  ITEM_TYPE_LABELS,
} from '@/lib/items-catalog';
import type { PatentLimits } from '@/lib/inventory-system';

// Props do componente
interface ItemCatalogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patent: string;
  patentLimits: PatentLimits;
  categoryCounts: Record<'I' | 'II' | 'III' | 'IV', number>;
  onAddItem: (item: CatalogItem) => void;
}

// Mapeamento de categorias para cores
const CATEGORY_COLORS: Record<string, string> = {
  '0': 'bg-muted text-muted-foreground',
  'I': 'bg-green-500/20 text-green-400 border-green-500/50',
  'II': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  'III': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  'IV': 'bg-red-500/20 text-red-400 border-red-500/50',
};

// Ícones por tipo de item
const TYPE_ICONS: Record<ItemType, React.ElementType> = {
  acessorio: Briefcase,
  explosivo: Bomb,
  operacional: Wrench,
  paranormal: Eye,
};

export function ItemCatalogModal({
  open,
  onOpenChange,
  patent,
  patentLimits,
  categoryCounts,
  onAddItem,
}: ItemCatalogModalProps) {
  // Estado para busca
  const [searchQuery, setSearchQuery] = useState('');
  // Estado para item selecionado (detalhes)
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  // Estado para tab ativa
  const [activeTab, setActiveTab] = useState<ItemType>('acessorio');

  // Verifica se pode adicionar item de uma categoria
  const canAddCategory = (category: '0' | 'I' | 'II' | 'III' | 'IV'): boolean => {
    if (category === '0') return true;
    return categoryCounts[category] < patentLimits[category];
  };

  // Verifica se categoria está bloqueada (limite 0)
  const isCategoryLocked = (category: '0' | 'I' | 'II' | 'III' | 'IV'): boolean => {
    if (category === '0') return false;
    return patentLimits[category] === 0;
  };

  // Filtra itens pela busca
  const filterItems = (items: CatalogItem[]): CatalogItem[] => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.effect?.toLowerCase().includes(query)
    );
  };

  // Itens filtrados por tab
  const itemsByTab = useMemo(() => ({
    acessorio: filterItems(ACCESSORIES),
    explosivo: filterItems(EXPLOSIVES),
    operacional: filterItems(OPERATIONAL_ITEMS),
    paranormal: filterItems(PARANORMAL_ITEMS),
  }), [searchQuery]);

  // Handler para adicionar item
  const handleAddItem = (item: CatalogItem) => {
    onAddItem(item);
    setSelectedItem(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 
        Mobile: fullscreen com padding seguro
        Desktop: max-w-2xl centralizado
      */}
      <DialogContent className="w-full max-w-[100vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col p-3 sm:p-6 gap-3 sm:gap-4">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <span className="truncate">Catálogo de Itens Gerais</span>
            <Badge variant="outline" className="ml-auto text-xs">
              {patent}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Barra de busca - touch friendly */}
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11 sm:h-10 text-base sm:text-sm"
          />
        </div>

        {/* Slots disponíveis - scroll horizontal em mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap flex-shrink-0 scrollbar-hide">
          {(['I', 'II', 'III', 'IV'] as const).map(cat => {
            const count = categoryCounts[cat];
            const limit = patentLimits[cat];
            const isLocked = limit === 0;
            const isFull = count >= limit && !isLocked;

            return (
              <Tooltip key={cat}>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs whitespace-nowrap flex-shrink-0 h-7 sm:h-6 px-2 cursor-default",
                      isLocked && "opacity-50",
                      isFull && "border-destructive text-destructive",
                      !isLocked && !isFull && CATEGORY_COLORS[cat]
                    )}
                  >
                    {isLocked ? (
                      <Lock className="w-3 h-3 mr-1" />
                    ) : isFull ? (
                      <XCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    )}
                    Cat. {cat}: {count}/{limit}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {isLocked 
                    ? 'Categoria bloqueada para sua patente'
                    : isFull 
                      ? 'Limite atingido'
                      : `${limit - count} slot(s) disponível(is)`
                  }
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Tabs de categorias - scroll horizontal otimizado para mobile */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ItemType)} className="flex-1 flex flex-col min-h-0">
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 flex-shrink-0 scrollbar-hide">
            <TabsList className="w-max sm:w-full inline-flex sm:flex justify-start gap-1 p-1 h-auto">
              {(Object.keys(ITEM_TYPE_LABELS) as ItemType[]).map(type => {
                const Icon = TYPE_ICONS[type];
                const count = itemsByTab[type].length;
                return (
                  <TabsTrigger 
                    key={type} 
                    value={type} 
                    className="gap-1.5 text-xs px-3 py-2 sm:px-2 sm:py-1.5 whitespace-nowrap min-h-[44px] sm:min-h-0"
                  >
                    <Icon className="w-4 h-4 sm:w-3 sm:h-3" />
                    <span className="hidden xs:inline sm:inline">{ITEM_TYPE_LABELS[type].label}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 ml-0.5">
                      {count}
                    </Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Lista de itens com scroll isolado (overscroll-contain evita conflitos) */}
          <ScrollArea className="flex-1 -mx-3 px-3 sm:-mx-6 sm:px-6 mt-2 overscroll-contain">
            {(Object.keys(ITEM_TYPE_LABELS) as ItemType[]).map(type => (
              <TabsContent key={type} value={type} className="mt-0 focus-visible:outline-none">
                <ItemList 
                  items={itemsByTab[type]}
                  canAddCategory={canAddCategory}
                  isCategoryLocked={isCategoryLocked}
                  onSelect={setSelectedItem}
                  onAdd={handleAddItem}
                />
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>

        {/* Modal de detalhes do item */}
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          canAdd={selectedItem ? canAddCategory(selectedItem.category) : false}
          isLocked={selectedItem ? isCategoryLocked(selectedItem.category) : false}
          onAdd={() => selectedItem && handleAddItem(selectedItem)}
        />
      </DialogContent>
    </Dialog>
  );
}

// Componente de lista de itens
interface ItemListProps {
  items: CatalogItem[];
  canAddCategory: (cat: '0' | 'I' | 'II' | 'III' | 'IV') => boolean;
  isCategoryLocked: (cat: '0' | 'I' | 'II' | 'III' | 'IV') => boolean;
  onSelect: (item: CatalogItem) => void;
  onAdd: (item: CatalogItem) => void;
}

function ItemList({ items, canAddCategory, isCategoryLocked, onSelect, onAdd }: ItemListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p>Nenhum item encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 pb-4">
      <AnimatePresence mode="popLayout">
        {items.map(item => {
          const canAdd = canAddCategory(item.category);
          const isLocked = isCategoryLocked(item.category);
          const TypeIcon = TYPE_ICONS[item.type];

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              layout
              className={cn(
                "p-3 sm:p-3 rounded-lg border transition-colors cursor-pointer active:bg-muted/30",
                isLocked && "opacity-40",
                !canAdd && !isLocked && "opacity-60",
                canAdd && "hover:border-primary/50 hover:bg-primary/5"
              )}
              onClick={() => onSelect(item)}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                {/* Ícone - touch target adequado */}
                <div className={cn(
                  "w-10 h-10 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  CATEGORY_COLORS[item.category]
                )}>
                  <TypeIcon className="w-5 h-5" />
                </div>

                {/* Info - texto responsivo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="font-medium text-sm sm:text-base leading-tight">{item.name}</span>
                    <Badge variant="outline" className={cn("text-[10px] sm:text-xs px-1.5", CATEGORY_COLORS[item.category])}>
                      Cat. {item.category === '0' ? '-' : item.category}
                    </Badge>
                    {item.consumable && (
                      <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 hidden xs:flex">
                        <Recycle className="w-3 h-3 mr-0.5" />
                        Consumível
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2 sm:line-clamp-1">
                    {item.description}
                  </p>

                  {item.effect && (
                    <p className="text-xs text-primary/70 mt-0.5 sm:mt-1 truncate hidden sm:block">
                      <Zap className="w-3 h-3 inline mr-1" />
                      {item.effect}
                    </p>
                  )}
                </div>

                {/* Botão adicionar - touch friendly (min 44px) */}
                <Button
                  size="icon"
                  variant={canAdd ? "default" : "outline"}
                  disabled={isLocked || !canAdd}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd(item);
                  }}
                  className="flex-shrink-0 w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-2"
                >
                  {isLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : canAdd ? (
                    <>
                      <Plus className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">A</span>
                    </>
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Modal de detalhes do item
interface ItemDetailModalProps {
  item: CatalogItem | null;
  onClose: () => void;
  canAdd: boolean;
  isLocked: boolean;
  onAdd: () => void;
}

function ItemDetailModal({ item, onClose, canAdd, isLocked, onAdd }: ItemDetailModalProps) {
  if (!item) return null;

  const TypeIcon = TYPE_ICONS[item.type];

  return (
    <Dialog open={!!item} onOpenChange={() => onClose()}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-md max-h-[85vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              CATEGORY_COLORS[item.category]
            )}>
              <TypeIcon className="w-4 h-4" />
            </div>
            <span className="truncate">{item.name}</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-4 px-4 sm:-mx-6 sm:px-6 overflow-y-auto">
          <div className="space-y-3 sm:space-y-4 pb-2">
            {/* Badges - scroll horizontal em mobile */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <Badge variant="outline" className={cn("text-xs", CATEGORY_COLORS[item.category])}>
                Cat. {item.category === '0' ? 'Livre' : item.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {ITEM_TYPE_LABELS[item.type].label}
              </Badge>
              <Badge variant="outline" className="text-xs">{item.spaces} espaço(s)</Badge>
              {item.consumable && (
                <Badge variant="secondary" className="text-xs">
                  <Recycle className="w-3 h-3 mr-1" />
                  Consumível
                </Badge>
              )}
            </div>

            {/* Descrição */}
            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{item.description}</p>

            {/* Efeito */}
            {item.effect && (
              <div className="p-2.5 sm:p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <div className="flex items-center gap-2 text-primary text-sm font-medium mb-1">
                  <Zap className="w-4 h-4 flex-shrink-0" />
                  Efeito
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">{item.effect}</p>
              </div>
            )}

            {/* Usos */}
            {item.uses && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Recycle className="w-4 h-4 flex-shrink-0" />
                {item.uses} uso(s)
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Botão de adicionar - touch friendly */}
        <div className="flex-shrink-0 pt-2">
          <Button
            className="w-full h-12 sm:h-10 text-base sm:text-sm"
            disabled={isLocked || !canAdd}
            onClick={onAdd}
          >
            {isLocked ? (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Categoria Bloqueada
              </>
            ) : canAdd ? (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar ao Inventário
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Limite de Categoria Atingido
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * ItemCatalogModal - Modal para selecionar itens gerais do catálogo
 * 
 * Layout com cards expansíveis similar ao ArmorCatalogModal
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MobileModal,
  MobileModalContent,
  MobileModalHeader,
  MobileModalBody,
  MobileModalTitle,
  MobileModalDescription,
} from '@/components/ui/mobile-modal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  Target,
  Zap,
  Recycle,
  ChevronDown,
  ChevronUp,
  X,
} from '@/components/icons/ordem-icons';
import { cn } from '@/lib/utils';
import {
  ALL_ITEMS,
  ACCESSORIES,
  EXPLOSIVES,
  OPERATIONAL_ITEMS,
  PARANORMAL_ITEMS,
  AMMUNITION,
  type CatalogItem,
  type ItemType,
  ITEM_TYPE_LABELS,
  ELEMENT_COLORS,
  type ItemParanormalElement as ParanormalElement,
} from '@/lib/catalogs';
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
  municao: Target,
};

// Card expansível de item (igual ao ArmorCard)
function ItemCard({
  item,
  onSelect,
  canAdd,
  reason,
}: {
  item: CatalogItem;
  onSelect: () => void;
  canAdd: boolean;
  reason?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const TypeIcon = TYPE_ICONS[item.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "border rounded-lg p-3 transition-all",
        canAdd
          ? "border-border hover:border-primary/50 bg-card"
          : "border-destructive/30 bg-destructive/5 opacity-60"
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        {/* Cabeçalho do card */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-foreground truncate">{item.name}</h4>
              <Badge variant="outline" className={cn("text-xs shrink-0", CATEGORY_COLORS[item.category])}>
                Cat. {item.category === '0' ? '-' : item.category}
              </Badge>
              <Badge variant="secondary" className="text-xs shrink-0">
                {ITEM_TYPE_LABELS[item.type].label}
              </Badge>
            </div>

            {/* Stats principais */}
            <div className="flex items-center gap-3 mt-2 text-sm flex-wrap">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Package className="w-3.5 h-3.5" />
                      {item.spaces === '*' ? 'Especial' : `${item.spaces} espaço(s)`}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.spaces === '*' ? 'Não ocupa espaço ou regra especial' : `Ocupa ${item.spaces} espaço(s) no inventário`}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {item.consumable && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1 text-amber-400">
                        <Recycle className="w-3.5 h-3.5" />
                        Consumível
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Item é gasto ao usar</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {item.uses && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  {item.uses} uso(s)
                </span>
              )}

              {item.element && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className={cn("flex items-center gap-1 font-medium", ELEMENT_COLORS[item.element])}>
                        {item.element}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Elemento paranormal: {item.element}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex items-center gap-1 shrink-0">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      size="icon"
                      className="h-8 w-8"
                      onClick={onSelect}
                      disabled={!canAdd}
                    >
                      {canAdd ? (
                        <Plus className="w-4 h-4" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{canAdd ? 'Adicionar ao inventário' : reason}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Detalhes expandidos */}
        <CollapsibleContent>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 pt-3 border-t border-border space-y-2"
          >
            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
              {item.description}
            </p>

            {item.effect && (
              <div className="flex items-start gap-2 p-2 rounded bg-primary/10 text-sm">
                <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-foreground whitespace-pre-wrap break-words">{item.effect}</span>
              </div>
            )}
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

export function ItemCatalogModal({
  open,
  onOpenChange,
  patent,
  patentLimits,
  categoryCounts,
  onAddItem,
}: ItemCatalogModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<ItemType>('acessorio');

  // Verifica se pode adicionar item de uma categoria
  const canAddCategory = (category: '0' | 'I' | 'II' | 'III' | 'IV'): { allowed: boolean; reason?: string } => {
    if (category === '0') return { allowed: true };
    
    const limit = patentLimits[category];
    const current = categoryCounts[category];

    if (limit === 0) {
      return { allowed: false, reason: `Categoria ${category} não disponível para ${patent}` };
    }

    if (current >= limit) {
      return { allowed: false, reason: `Limite de itens Cat. ${category} atingido (${current}/${limit})` };
    }

    return { allowed: true };
  };

  // Filtra itens baseado na busca
  const filterItems = (items: CatalogItem[]) => {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(item =>
      item.name.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      (item.effect && item.effect.toLowerCase().includes(term))
    );
  };

  // Itens filtrados por tipo
  const filteredItems = useMemo(() => ({
    acessorio: filterItems(ACCESSORIES),
    explosivo: filterItems(EXPLOSIVES),
    operacional: filterItems(OPERATIONAL_ITEMS),
    paranormal: filterItems(PARANORMAL_ITEMS),
    municao: filterItems(AMMUNITION),
  }), [searchTerm]);

  // Status das categorias para indicadores visuais
  const categoryStatus = useMemo(() => {
    return (['I', 'II', 'III', 'IV'] as const).map(cat => {
      const limit = patentLimits[cat];
      const current = categoryCounts[cat];
      return {
        category: cat,
        limit,
        current,
        isLocked: limit === 0,
        isFull: current >= limit && limit > 0
      };
    });
  }, [patentLimits, categoryCounts]);

  return (
    <MobileModal open={open} onOpenChange={onOpenChange}>
      <MobileModalContent size="lg" className="h-[90vh] max-h-[90vh] flex flex-col p-0">
        <MobileModalHeader bordered className="p-4 sm:p-6 shrink-0">
          <MobileModalTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Catálogo de Itens Gerais
          </MobileModalTitle>
          <MobileModalDescription className="text-sm">
            Selecione itens para adicionar ao inventário
          </MobileModalDescription>
        </MobileModalHeader>

        {/* Indicadores de categoria - fixos */}
        <div className="flex items-center gap-2 flex-wrap px-4 sm:px-6 pb-2 border-b border-border shrink-0">
          {categoryStatus.map(({ category, limit, current, isLocked, isFull }) => (
            <TooltipProvider key={category}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                    isLocked && "bg-muted text-muted-foreground",
                    isFull && !isLocked && "bg-destructive/20 text-destructive",
                    !isLocked && !isFull && "bg-primary/20 text-primary"
                  )}>
                    {isLocked ? (
                      <Lock className="w-3 h-3" />
                    ) : isFull ? (
                      <XCircle className="w-3 h-3" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    <span>Cat. {category}: {current}/{limit}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {isLocked
                    ? `Categoria ${category} bloqueada para ${patent}`
                    : isFull
                    ? `Limite atingido para Categoria ${category}`
                    : `${limit - current} slots disponíveis na Categoria ${category}`
                  }
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        {/* Busca - fixa */}
        <div className="relative px-4 sm:px-6 py-2 shrink-0">
          <Search className="absolute left-7 sm:left-9 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-5 sm:right-7 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchTerm('')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Tabs de tipo com scroll interno */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ItemType)} className="flex-1 flex flex-col min-h-0 px-4 sm:px-6 pb-4">
          <TabsList className="grid grid-cols-5 w-full shrink-0">
            {(Object.keys(ITEM_TYPE_LABELS) as ItemType[]).map(type => {
              const Icon = TYPE_ICONS[type];
              return (
                <TabsTrigger key={type} value={type} className="text-xs sm:text-sm gap-1 px-1 sm:px-2">
                  <Icon className="w-3.5 h-3.5 hidden sm:block" />
                  <span className="truncate">{ITEM_TYPE_LABELS[type].label.replace('Itens ', '')}</span>
                  <Badge variant="secondary" className="text-[10px] px-1 hidden md:inline-flex">
                    {filteredItems[type].length}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <MobileModalBody className="mt-4">
            {(Object.keys(ITEM_TYPE_LABELS) as ItemType[]).map(type => (
              <TabsContent key={type} value={type} className="mt-0 space-y-2">
                <AnimatePresence mode="popLayout">
                  {filteredItems[type].length > 0 ? (
                    filteredItems[type].map(item => {
                      const status = canAddCategory(item.category);
                      return (
                        <ItemCard
                          key={item.id}
                          item={item}
                          onSelect={() => onAddItem(item)}
                          canAdd={status.allowed}
                          reason={status.reason}
                        />
                      );
                    })
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum item encontrado
                    </p>
                  )}
                </AnimatePresence>
              </TabsContent>
            ))}
          </MobileModalBody>
        </Tabs>
      </MobileModalContent>
    </MobileModal>
  );
}

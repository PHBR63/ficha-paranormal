/**
 * ImprovisarItemSelector - Seletor de Item para Improvisar (NEX 65%)
 * 
 * Permite ao Técnico selecionar um item específico do catálogo de equipamentos gerais
 * para improvisar, calculando o custo em PE baseado na categoria do item.
 * 
 * Custo: 2 PE base + 2 PE por categoria do item
 * 
 * @module tracks/especialista/ImprovisarItemSelector
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Lightbulb,
  Package,
  Bomb,
  Wrench,
  Eye,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  ALL_ITEMS,
  type CatalogItem, 
  type ItemType,
  ITEM_TYPE_LABELS 
} from '@/lib/catalogs';

// =====================================================
// Tipos e Helpers
// =====================================================

/** Converte categoria string para número */
export function categoryToNumber(category: string): number {
  switch (category) {
    case '0': return 0;
    case 'I': return 1;
    case 'II': return 2;
    case 'III': return 3;
    case 'IV': return 4;
    default: return 0;
  }
}

/** Calcula custo de PE para improvisar item: 2 base + 2 por categoria */
export function calculateImprovisarCost(item: CatalogItem): number {
  return 2 + (2 * categoryToNumber(item.category));
}

/** Ícone por tipo de item */
const TYPE_ICONS: Record<ItemType, React.ReactNode> = {
  acessorio: <Package className="w-4 h-4" />,
  explosivo: <Bomb className="w-4 h-4" />,
  operacional: <Wrench className="w-4 h-4" />,
  paranormal: <Eye className="w-4 h-4" />,
  municao: <Target className="w-4 h-4" />,
};

// =====================================================
// Props
// =====================================================

export interface ImprovisarItemSelectorProps {
  /** PE atual do personagem */
  peCurrent: number;
  /** Callback ao confirmar item */
  onSelectItem: (item: CatalogItem, cost: number) => void;
  /** Se está em modo mobile */
  isMobile?: boolean;
}

// =====================================================
// Componente Principal
// =====================================================

export function ImprovisarItemSelector({
  peCurrent,
  onSelectItem,
  isMobile = false,
}: ImprovisarItemSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['0']);

  // Filtra itens do catálogo (exclui munições para improvisar)
  const filteredItems = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return ALL_ITEMS
      .filter(item => item.type !== 'municao') // Munição não pode ser improvisada
      .filter(item => 
        searchTerm === '' ||
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower)
      );
  }, [searchTerm]);

  // Agrupa por categoria
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, CatalogItem[]> = {
      '0': [],
      'I': [],
      'II': [],
      'III': [],
      'IV': [],
    };
    
    filteredItems.forEach(item => {
      if (grouped[item.category]) {
        grouped[item.category].push(item);
      }
    });
    
    return grouped;
  }, [filteredItems]);

  // Toggle categoria expandida
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Custo do item selecionado
  const selectedCost = selectedItem ? calculateImprovisarCost(selectedItem) : 0;
  const canAfford = peCurrent >= selectedCost;

  // Handler de confirmação
  const handleConfirm = () => {
    if (selectedItem && canAfford) {
      onSelectItem(selectedItem, selectedCost);
      setSelectedItem(null);
    }
  };

  // Categorias ordenadas
  const categories = ['0', 'I', 'II', 'III', 'IV'];

  return (
    <div className="space-y-3">
      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar equipamento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista de Itens por Categoria */}
      <ScrollArea className={cn("pr-3", isMobile ? "h-[40vh]" : "h-[300px]")}>
        <div className="space-y-2">
          {categories.map(category => {
            const items = itemsByCategory[category];
            if (items.length === 0) return null;

            const isExpanded = expandedCategories.includes(category);
            const catCost = 2 + (2 * categoryToNumber(category));

            return (
              <Collapsible
                key={category}
                open={isExpanded}
                onOpenChange={() => toggleCategory(category)}
              >
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted/50 transition-colors text-left">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span className="font-medium">
                      Categoria {category}
                    </span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {catCost} PE
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {items.length}
                    </Badge>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pl-6 space-y-1 mt-1">
                    {items.map(item => {
                      const itemCost = calculateImprovisarCost(item);
                      const isSelected = selectedItem?.id === item.id;
                      const affordable = peCurrent >= itemCost;

                      return (
                        <button
                          key={item.id}
                          onClick={() => setSelectedItem(isSelected ? null : item)}
                          disabled={!affordable}
                          className={cn(
                            "flex items-center gap-2 w-full p-2 rounded-md text-left transition-colors",
                            isSelected 
                              ? "bg-primary/20 border border-primary/50" 
                              : "hover:bg-muted/50",
                            !affordable && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {TYPE_ICONS[item.type]}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {item.spaces === '*' ? '0' : item.spaces} espaço{item.spaces !== 1 ? 's' : ''}
                              {item.consumable && ' • Consumível'}
                            </p>
                          </div>
                          <Badge 
                            variant={affordable ? "outline" : "secondary"} 
                            className="text-[10px] shrink-0"
                          >
                            {itemCost} PE
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>

      {/* Item Selecionado */}
      {selectedItem && (
        <div className="p-3 rounded-md border bg-muted/30 space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <span className="font-medium text-sm">{selectedItem.name}</span>
            <Badge variant="outline" className="ml-auto">
              Cat. {selectedItem.category}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {selectedItem.description}
          </p>
          {selectedItem.effect && (
            <p className="text-xs text-primary">
              {selectedItem.effect}
            </p>
          )}
        </div>
      )}

      {/* Aviso */}
      <p className="text-xs text-muted-foreground text-center italic">
        ⚠️ O equipamento improvisado se torna inútil ao final da cena.
      </p>

      {/* Botão de Confirmação */}
      <Button
        onClick={handleConfirm}
        disabled={!selectedItem || !canAfford}
        className="w-full"
      >
        <Lightbulb className="w-4 h-4 mr-2" />
        {selectedItem ? (
          <>
            Improvisar ({selectedCost} PE)
            {!canAfford && ' - PE insuficiente'}
          </>
        ) : (
          'Selecione um item'
        )}
      </Button>
    </div>
  );
}

export default ImprovisarItemSelector;

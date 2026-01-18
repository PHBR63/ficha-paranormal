/**
 * RemendaoItemSelector - Seletor de Equipamento para Remendão (NEX 40%)
 * 
 * Permite ao Técnico selecionar um equipamento do inventário do personagem
 * para reparar (remover condição Quebrado).
 * 
 * Custo: 1 PE + ação completa
 * 
 * @module tracks/especialista/RemendaoItemSelector
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Hammer,
  Package,
  Shield,
  Sword,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InventoryItem } from '@/lib/inventory-system';

// =====================================================
// Props
// =====================================================

export interface RemendaoItemSelectorProps {
  /** Inventário do personagem */
  inventory: InventoryItem[];
  /** PE atual do personagem */
  peCurrent: number;
  /** Callback ao confirmar reparação */
  onSelectItem: (item: InventoryItem) => void;
  /** Se está em modo mobile */
  isMobile?: boolean;
}

// =====================================================
// Helper para ícone de tipo de item
// =====================================================

function getItemIcon(item: InventoryItem) {
  const nameLower = item.name.toLowerCase();
  
  // Proteções
  if (nameLower.includes('colete') || 
      nameLower.includes('armadura') || 
      nameLower.includes('escudo') ||
      nameLower.includes('proteção')) {
    return <Shield className="w-4 h-4 text-blue-500" />;
  }
  
  // Armas
  if (nameLower.includes('arma') || 
      nameLower.includes('pistola') || 
      nameLower.includes('rifle') ||
      nameLower.includes('espada') ||
      nameLower.includes('faca')) {
    return <Sword className="w-4 h-4 text-red-500" />;
  }
  
  // Padrão
  return <Package className="w-4 h-4 text-muted-foreground" />;
}

// =====================================================
// Componente Principal
// =====================================================

export function RemendaoItemSelector({
  inventory,
  peCurrent,
  onSelectItem,
  isMobile = false,
}: RemendaoItemSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const PE_COST = 1;
  const canAfford = peCurrent >= PE_COST;

  // Filtra itens do inventário (apenas equipamentos, não consumíveis)
  const repairableItems = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    
    return inventory.filter(item => {
      // Exclui consumíveis (não podem ser quebrados/reparados da mesma forma)
      if (item.consumable) return false;
      
      // Filtro de busca
      if (searchTerm !== '' && !item.name.toLowerCase().includes(searchLower)) {
        return false;
      }
      
      return true;
    });
  }, [inventory, searchTerm]);

  // Handler de confirmação
  const handleConfirm = () => {
    if (selectedItem && canAfford) {
      onSelectItem(selectedItem);
      setSelectedItem(null);
    }
  };

  // Sem itens no inventário
  if (inventory.length === 0) {
    return (
      <div className="text-center py-8 space-y-3">
        <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Nenhum equipamento no inventário para reparar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Descrição */}
      <div className="p-3 rounded-md bg-muted/30 border">
        <p className="text-xs text-muted-foreground">
          <strong>Remendão (1 PE):</strong> Gaste uma ação completa para remover a 
          condição <em>Quebrado</em> de um equipamento adjacente até o final da cena.
        </p>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar no inventário..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista de Itens */}
      <ScrollArea className={cn("pr-3", isMobile ? "h-[40vh]" : "h-[250px]")}>
        {repairableItems.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              {searchTerm 
                ? 'Nenhum item encontrado.' 
                : 'Nenhum equipamento reparável no inventário.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {repairableItems.map(item => {
              const isSelected = selectedItem?.id === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(isSelected ? null : item)}
                  className={cn(
                    "flex items-center gap-2 w-full p-2 rounded-md text-left transition-colors",
                    isSelected 
                      ? "bg-primary/20 border border-primary/50" 
                      : "hover:bg-muted/50"
                  )}
                >
                  {getItemIcon(item)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {item.slots} espaço{item.slots !== 1 ? 's' : ''}
                      {item.isEquipped && ' • Equipado'}
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className="text-[10px] shrink-0"
                  >
                    Cat. {item.category}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Item Selecionado */}
      {selectedItem && (
        <div className="p-3 rounded-md border bg-orange-500/10 space-y-2">
          <div className="flex items-center gap-2">
            <Hammer className="w-4 h-4 text-orange-500" />
            <span className="font-medium text-sm">{selectedItem.name}</span>
          </div>
          {selectedItem.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {selectedItem.description}
            </p>
          )}
          <p className="text-xs text-orange-600 dark:text-orange-400">
            A condição Quebrado será removida até o final da cena.
          </p>
        </div>
      )}

      {/* PE insuficiente */}
      {!canAfford && (
        <div className="p-2 rounded-md bg-destructive/10 text-destructive text-xs text-center">
          PE insuficiente (necessário: {PE_COST} PE)
        </div>
      )}

      {/* Botão de Confirmação */}
      <Button
        onClick={handleConfirm}
        disabled={!selectedItem || !canAfford}
        variant="outline"
        className="w-full"
      >
        <Hammer className="w-4 h-4 mr-2" />
        {selectedItem ? (
          <>Remendar "{selectedItem.name}" (1 PE)</>
        ) : (
          'Selecione um equipamento'
        )}
      </Button>
    </div>
  );
}

export default RemendaoItemSelector;

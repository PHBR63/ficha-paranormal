/**
 * Modal de Catálogo de Proteções
 * Permite selecionar armaduras, coletes e escudos do catálogo oficial
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Search, Plus, X, Lock, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, AlertTriangle, Info
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CustomScroll } from '@/components/ui/custom-scroll';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  type CatalogArmor, 
  BASE_ARMORS,
  MODIFIED_ARMORS,
  ALL_ARMORS,
  getArmorTypeName,
  formatPenalties
} from '@/lib/catalogs';
import { getPatentLimits, countItemsByCategory } from '@/lib/inventory-system';
import { cn } from '@/lib/utils';

// Interface das props do componente
interface ArmorCatalogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectArmor: (armor: CatalogArmor) => void;
  patent: string;
  currentInventory: Array<{ category?: string }>;
}

// Componente de card de proteção
function ArmorCard({ 
  armor, 
  onSelect,
  canAdd,
  reason
}: { 
  armor: CatalogArmor;
  onSelect: () => void;
  canAdd: boolean;
  reason?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

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
              <h4 className="font-semibold text-foreground truncate">{armor.name}</h4>
              <Badge variant="outline" className="text-xs shrink-0">
                Cat. {armor.category}
              </Badge>
              <Badge variant="secondary" className="text-xs shrink-0">
                {getArmorTypeName(armor.type)}
              </Badge>
            </div>
            
            {/* Stats principais */}
            <div className="flex items-center gap-3 mt-2 text-sm flex-wrap">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 text-primary font-medium">
                      <Shield className="w-3.5 h-3.5" />
                      +{armor.defenseBonus} Def
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Bônus de Defesa: +{armor.defenseBonus}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {armor.rd && armor.rd > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1 text-blue-400 font-medium">
                        RD {armor.rd}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Resistência a Dano: reduz {armor.rd} de dano recebido</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {armor.agilityPenalty !== 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1 text-destructive">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {formatPenalties(armor)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Penalidades por usar esta proteção</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <span className="text-muted-foreground">
                {armor.spaces} {armor.spaces === 1 ? 'espaço' : 'espaços'}
              </span>
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
            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{armor.description}</p>
            
            {armor.special && (
              <div className="flex items-start gap-2 p-2 rounded bg-primary/10 text-sm">
                <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-foreground whitespace-pre-wrap break-words">{armor.special}</span>
              </div>
            )}
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

// Componente principal
export function ArmorCatalogModal({
  open,
  onOpenChange,
  onSelectArmor,
  patent,
  currentInventory
}: ArmorCatalogModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'leve' | 'pesada' | 'escudo'>('leve');

  // Limites por patente
  const limits = getPatentLimits(patent);

  // Contagem atual por categoria
  const categoryCounts = useMemo(() => ({
    'I': countItemsByCategory(currentInventory as any, 'I'),
    'II': countItemsByCategory(currentInventory as any, 'II'),
    'III': countItemsByCategory(currentInventory as any, 'III'),
    'IV': countItemsByCategory(currentInventory as any, 'IV'),
  }), [currentInventory]);

  // Verifica se pode adicionar item de uma categoria
  const canAddCategory = (category: 'I' | 'II' | 'III' | 'IV'): { allowed: boolean; reason?: string } => {
    const limit = limits[`cat${category}` as keyof typeof limits];
    const current = categoryCounts[category];
    
    if (limit === 0) {
      return { allowed: false, reason: `Categoria ${category} não disponível para ${patent}` };
    }
    
    if (current >= limit) {
      return { allowed: false, reason: `Limite de itens Cat. ${category} atingido (${current}/${limit})` };
    }
    
    return { allowed: true };
  };

  // Filtra proteções baseado na busca
  const filterArmors = (armors: CatalogArmor[]) => {
    if (!searchTerm) return armors;
    const term = searchTerm.toLowerCase();
    return armors.filter(armor => 
      armor.name.toLowerCase().includes(term) ||
      armor.description.toLowerCase().includes(term) ||
      (armor.special && armor.special.toLowerCase().includes(term))
    );
  };

  // Proteções filtradas por tipo - APENAS as 3 proteções base (sem pré-modificadas)
  const filteredLight = filterArmors(BASE_ARMORS.filter(a => a.type === 'leve'));
  const filteredHeavy = filterArmors(BASE_ARMORS.filter(a => a.type === 'pesada'));
  const filteredShields = filterArmors(BASE_ARMORS.filter(a => a.type === 'escudo'));

  // Status das categorias para indicadores visuais
  const categoryStatus = useMemo(() => {
    return (['I', 'II', 'III', 'IV'] as const).map(cat => {
      const limit = limits[`cat${cat}` as keyof typeof limits];
      const current = categoryCounts[cat];
      return {
        category: cat,
        limit,
        current,
        isLocked: limit === 0,
        isFull: current >= limit && limit > 0
      };
    });
  }, [limits, categoryCounts]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl h-[90vh] max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Catálogo de Proteções
          </DialogTitle>
          <DialogDescription className="text-sm">
            Selecione armaduras, coletes e escudos para adicionar ao inventário
          </DialogDescription>
        </DialogHeader>

        {/* Indicadores de categoria */}
        <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-border flex-shrink-0">
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

        {/* Busca */}
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proteção..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchTerm('')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Tabs de tipo */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="leve" className="text-xs sm:text-sm">
              Leves ({filteredLight.length})
            </TabsTrigger>
            <TabsTrigger value="pesada" className="text-xs sm:text-sm">
              Pesadas ({filteredHeavy.length})
            </TabsTrigger>
            <TabsTrigger value="escudo" className="text-xs sm:text-sm">
              Escudos ({filteredShields.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 mt-4 -mx-4 sm:-mx-6">
            <CustomScroll maxHeight="calc(70vh - 220px)" className="px-4 sm:px-6">
              <div className="pr-2">
                <TabsContent value="leve" className="mt-0 space-y-2">
                  <AnimatePresence mode="popLayout">
                    {filteredLight.length > 0 ? (
                      filteredLight.map(armor => {
                        const status = canAddCategory(armor.category);
                        return (
                          <ArmorCard
                            key={armor.id}
                            armor={armor}
                            onSelect={() => onSelectArmor(armor)}
                            canAdd={status.allowed}
                            reason={status.reason}
                          />
                        );
                      })
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma proteção leve encontrada
                      </p>
                    )}
                  </AnimatePresence>
                </TabsContent>

                <TabsContent value="pesada" className="mt-0 space-y-2">
                  <AnimatePresence mode="popLayout">
                    {filteredHeavy.length > 0 ? (
                      filteredHeavy.map(armor => {
                        const status = canAddCategory(armor.category);
                        return (
                          <ArmorCard
                            key={armor.id}
                            armor={armor}
                            onSelect={() => onSelectArmor(armor)}
                            canAdd={status.allowed}
                            reason={status.reason}
                          />
                        );
                      })
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma proteção pesada encontrada
                      </p>
                    )}
                  </AnimatePresence>
                </TabsContent>

                <TabsContent value="escudo" className="mt-0 space-y-2">
                  <AnimatePresence mode="popLayout">
                    {filteredShields.length > 0 ? (
                      filteredShields.map(armor => {
                        const status = canAddCategory(armor.category);
                        return (
                          <ArmorCard
                            key={armor.id}
                            armor={armor}
                            onSelect={() => onSelectArmor(armor)}
                            canAdd={status.allowed}
                            reason={status.reason}
                          />
                        );
                      })
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum escudo encontrado
                      </p>
                    )}
                  </AnimatePresence>
                </TabsContent>
              </div>
            </CustomScroll>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

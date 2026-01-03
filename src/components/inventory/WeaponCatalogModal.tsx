/**
 * WeaponCatalogModal - Modal para selecionar armas do catálogo
 * 
 * Funcionalidades:
 * - Lista todas as armas do catálogo
 * - Filtro por tipo, categoria e proficiência
 * - Busca por nome
 * - Exibe detalhes completos da arma
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sword,
  Crosshair,
  Target,
  Sparkles,
  Search,
  Plus,
  Info,
  Flame,
  Shield,
  Zap,
  Lock,
  CheckCircle2,
  XCircle,
  Book,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ALL_WEAPONS,
  MELEE_WEAPONS,
  RANGED_WEAPONS,
  FIREARMS,
  THROWN_WEAPONS,
  SPECIAL_WEAPONS,
  type CatalogWeapon,
  PROFICIENCY_LABELS,
} from '@/lib/catalogs';
import type { PatentLimits } from '@/lib/inventory-system';

interface WeaponCatalogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patent: string;
  patentLimits: PatentLimits;
  categoryCounts: Record<'I' | 'II' | 'III' | 'IV', number>;
  onAddWeapon: (weapon: CatalogWeapon) => void;
}

// Mapeamento de categorias para cores
const CATEGORY_COLORS: Record<string, string> = {
  '0': 'bg-muted text-muted-foreground',
  'I': 'bg-green-500/20 text-green-400 border-green-500/50',
  'II': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  'III': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  'IV': 'bg-red-500/20 text-red-400 border-red-500/50',
  'especial': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
};

// Ícones por tipo
const TYPE_ICONS: Record<string, typeof Sword> = {
  melee: Sword,
  ranged: Crosshair,
  firearm: Zap,
  thrown: Target,
};

export function WeaponCatalogModal({
  open,
  onOpenChange,
  patent,
  patentLimits,
  categoryCounts,
  onAddWeapon,
}: WeaponCatalogModalProps) {
  // Estado para busca
  const [searchQuery, setSearchQuery] = useState('');
  // Estado para arma selecionada (detalhes)
  const [selectedWeapon, setSelectedWeapon] = useState<CatalogWeapon | null>(null);
  // Estado para tab ativa
  const [activeTab, setActiveTab] = useState('melee');

  // Tipo de categoria de arma
  type WeaponCategory = 'I' | 'II' | 'III' | 'IV' | '0' | 'especial';

  // Verifica se pode adicionar arma de uma categoria
  const canAddCategory = (category: WeaponCategory): boolean => {
    if (category === '0' || category === 'especial') return true;
    return categoryCounts[category] < patentLimits[category];
  };

  // Verifica se categoria está bloqueada (limite 0)
  const isCategoryLocked = (category: WeaponCategory): boolean => {
    if (category === '0' || category === 'especial') return false;
    return patentLimits[category] === 0;
  };

  // Filtra armas pela busca
  const filterWeapons = (weapons: CatalogWeapon[]): CatalogWeapon[] => {
    if (!searchQuery) return weapons;
    const query = searchQuery.toLowerCase();
    return weapons.filter(w =>
      w.name.toLowerCase().includes(query) ||
      w.damageType.toLowerCase().includes(query) ||
      w.description?.toLowerCase().includes(query) ||
      w.special?.toLowerCase().includes(query)
    );
  };

  // Armas filtradas por tab
  const weaponsByTab = useMemo(() => ({
    melee: filterWeapons(MELEE_WEAPONS),
    ranged: filterWeapons(RANGED_WEAPONS),
    firearm: filterWeapons(FIREARMS),
    thrown: filterWeapons(THROWN_WEAPONS),
    special: filterWeapons(SPECIAL_WEAPONS),
  }), [searchQuery]);

  // Handler para adicionar arma
  const handleAddWeapon = (weapon: CatalogWeapon) => {
    onAddWeapon(weapon);
    setSelectedWeapon(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl h-[90vh] max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Book className="w-5 h-5 text-primary" />
            Catálogo de Armas
            <Badge variant="outline" className="ml-2">
              {patent}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Barra de busca */}
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar arma..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Slots disponíveis */}
        <div className="flex gap-2 flex-wrap flex-shrink-0">
          {(['I', 'II', 'III', 'IV'] as const).map(cat => {
            const count = categoryCounts[cat];
            const limit = patentLimits[cat];
            const isLocked = limit === 0;
            const isFull = count >= limit && !isLocked;

            return (
              <TooltipProvider key={cat}>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
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
              </TooltipProvider>
            );
          })}
        </div>

        {/* Tabs de categorias - com scroll horizontal em mobile */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-shrink-0 overflow-x-auto pb-1 -mx-1 px-1">
            <TabsList className="w-max min-w-full justify-start">
              <TabsTrigger value="melee" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
                <Sword className="w-4 h-4" />
                <span className="hidden sm:inline">Corpo a Corpo</span>
                <span className="sm:hidden">Corpo</span>
                <Badge variant="secondary" className="text-xs ml-1">
                  {weaponsByTab.melee.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="ranged" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
                <Crosshair className="w-4 h-4" />
                <span className="hidden sm:inline">À Distância</span>
                <span className="sm:hidden">Dist.</span>
                <Badge variant="secondary" className="text-xs ml-1">
                  {weaponsByTab.ranged.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="firearm" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Armas de Fogo</span>
                <span className="sm:hidden">Fogo</span>
                <Badge variant="secondary" className="text-xs ml-1">
                  {weaponsByTab.firearm.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="thrown" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Explosivos</span>
                <span className="sm:hidden">Expl.</span>
                <Badge variant="secondary" className="text-xs ml-1">
                  {weaponsByTab.thrown.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="special" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
                <Sparkles className="w-4 h-4" />
                <span>Especiais</span>
                <Badge variant="secondary" className="text-xs ml-1">
                  {weaponsByTab.special.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 min-h-0 -mx-4 sm:-mx-6 px-4 sm:px-6">
            <TabsContent value="melee" className="mt-2">
              <WeaponList 
                weapons={weaponsByTab.melee}
                canAddCategory={canAddCategory}
                isCategoryLocked={isCategoryLocked}
                onSelect={setSelectedWeapon}
                onAdd={handleAddWeapon}
              />
            </TabsContent>
            <TabsContent value="ranged" className="mt-2">
              <WeaponList 
                weapons={weaponsByTab.ranged}
                canAddCategory={canAddCategory}
                isCategoryLocked={isCategoryLocked}
                onSelect={setSelectedWeapon}
                onAdd={handleAddWeapon}
              />
            </TabsContent>
            <TabsContent value="firearm" className="mt-2">
              <WeaponList 
                weapons={weaponsByTab.firearm}
                canAddCategory={canAddCategory}
                isCategoryLocked={isCategoryLocked}
                onSelect={setSelectedWeapon}
                onAdd={handleAddWeapon}
              />
            </TabsContent>
            <TabsContent value="thrown" className="mt-2">
              <WeaponList 
                weapons={weaponsByTab.thrown}
                canAddCategory={canAddCategory}
                isCategoryLocked={isCategoryLocked}
                onSelect={setSelectedWeapon}
                onAdd={handleAddWeapon}
              />
            </TabsContent>
            <TabsContent value="special" className="mt-2">
              <WeaponList 
                weapons={weaponsByTab.special}
                canAddCategory={canAddCategory}
                isCategoryLocked={isCategoryLocked}
                onSelect={setSelectedWeapon}
                onAdd={handleAddWeapon}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Modal de detalhes da arma */}
        <WeaponDetailModal
          weapon={selectedWeapon}
          onClose={() => setSelectedWeapon(null)}
          canAdd={selectedWeapon ? canAddCategory(selectedWeapon.category) : false}
          isLocked={selectedWeapon ? isCategoryLocked(selectedWeapon.category) : false}
          onAdd={() => selectedWeapon && handleAddWeapon(selectedWeapon)}
        />
      </DialogContent>
    </Dialog>
  );
}

// Tipo de categoria de arma para WeaponList
type WeaponCategoryType = 'I' | 'II' | 'III' | 'IV' | '0' | 'especial';

// Componente de lista de armas
interface WeaponListProps {
  weapons: CatalogWeapon[];
  canAddCategory: (cat: WeaponCategoryType) => boolean;
  isCategoryLocked: (cat: WeaponCategoryType) => boolean;
  onSelect: (weapon: CatalogWeapon) => void;
  onAdd: (weapon: CatalogWeapon) => void;
}

function WeaponList({ weapons, canAddCategory, isCategoryLocked, onSelect, onAdd }: WeaponListProps) {
  if (weapons.length === 0) {
    return (
      <div className="text-center py-8 text-foreground/70">
        <Search className="w-10 h-10 mx-auto mb-2 text-foreground/40" />
        <p>Nenhuma arma encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 pb-4">
      {weapons.map(weapon => {
        const canAdd = canAddCategory(weapon.category);
        const isLocked = isCategoryLocked(weapon.category);
        const TypeIcon = TYPE_ICONS[weapon.type] || Sword;
        const profConfig = PROFICIENCY_LABELS[weapon.proficiency];

        return (
          <motion.div
            key={weapon.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-3 rounded-lg border transition-all cursor-pointer",
              isLocked && "opacity-40",
              !canAdd && !isLocked && "opacity-60",
              canAdd && "hover:border-primary/50 hover:bg-primary/5"
            )}
            onClick={() => onSelect(weapon)}
          >
            <div className="flex items-start gap-3">
              {/* Ícone */}
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                CATEGORY_COLORS[weapon.category]
              )}>
                <TypeIcon className="w-5 h-5" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{weapon.name}</span>
                  <Badge variant="outline" className={cn("text-xs", CATEGORY_COLORS[weapon.category])}>
                    Cat. {weapon.category === '0' ? '-' : weapon.category}
                  </Badge>
                  <span className={cn("text-xs", profConfig.color)}>
                    {profConfig.label}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-destructive" />
                    {weapon.damage} {weapon.damageType}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    Crit {weapon.critical === 20 ? '20' : `${weapon.critical}-20`} (x{weapon.criticalMultiplier})
                  </span>
                  {weapon.range && (
                    <span>{weapon.range}</span>
                  )}
                </div>

                {weapon.special && (
                  <p className="text-xs text-primary/70 mt-1 truncate">
                    ✨ {weapon.special}
                  </p>
                )}
              </div>

              {/* Botão adicionar */}
              <Button
                size="sm"
                variant={canAdd ? "default" : "outline"}
                disabled={isLocked || !canAdd}
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd(weapon);
                }}
                className="flex-shrink-0"
              >
                {isLocked ? (
                  <Lock className="w-4 h-4" />
                ) : canAdd ? (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </>
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
              </Button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// Modal de detalhes da arma
interface WeaponDetailModalProps {
  weapon: CatalogWeapon | null;
  onClose: () => void;
  canAdd: boolean;
  isLocked: boolean;
  onAdd: () => void;
}

function WeaponDetailModal({ weapon, onClose, canAdd, isLocked, onAdd }: WeaponDetailModalProps) {
  if (!weapon) return null;

  const TypeIcon = TYPE_ICONS[weapon.type] || Sword;
  const profConfig = PROFICIENCY_LABELS[weapon.proficiency];

  return (
    <Dialog open={!!weapon} onOpenChange={() => onClose()}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-md max-h-[85vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              CATEGORY_COLORS[weapon.category]
            )}>
              <TypeIcon className="w-4 h-4" />
            </div>
            <span className="truncate">{weapon.name}</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 -mx-4 px-4 sm:-mx-6 sm:px-6 overflow-y-auto">
          <div className="space-y-4 pb-2">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={CATEGORY_COLORS[weapon.category]}>
                Categoria {weapon.category === '0' ? 'Livre' : weapon.category}
              </Badge>
              <Badge variant="outline" className={profConfig.color}>
                {profConfig.label}
              </Badge>
              {weapon.range && (
                <Badge variant="outline">{weapon.range}</Badge>
              )}
              <Badge variant="outline">{weapon.spaces} espaço(s)</Badge>
            </div>

            {/* Descrição */}
            {weapon.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{weapon.description}</p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-destructive/10 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Dano</p>
                <p className="font-display text-xl text-destructive">{weapon.damage}</p>
                <p className="text-xs text-muted-foreground">{weapon.damageType}</p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Crítico</p>
                <p className="font-display text-xl text-yellow-500">
                  {weapon.critical === 20 ? '20' : `${weapon.critical}-20`}
                </p>
                <p className="text-xs text-muted-foreground">x{weapon.criticalMultiplier}</p>
              </div>
            </div>

            {/* Propriedades */}
            {weapon.properties && weapon.properties.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Propriedades:</p>
                <div className="flex flex-wrap gap-1">
                  {weapon.properties.map(prop => (
                    <Badge key={prop} variant="secondary" className="text-xs">
                      {prop}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Especial */}
            {weapon.special && (
              <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <div className="flex items-center gap-2 text-primary text-sm font-medium mb-1">
                  <Sparkles className="w-4 h-4" />
                  Especial
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">{weapon.special}</p>
              </div>
            )}

            {/* Munição */}
            {weapon.ammoType && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="w-4 h-4 flex-shrink-0" />
                Usa munição: {weapon.ammoType}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Botões */}
        <div className="flex gap-2 flex-shrink-0 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Fechar
          </Button>
          <Button
            onClick={onAdd}
            disabled={isLocked || !canAdd}
            className="flex-1"
          >
            {isLocked ? (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Bloqueado
              </>
            ) : canAdd ? (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Limite Atingido
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

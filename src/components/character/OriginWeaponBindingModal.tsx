/**
 * OriginWeaponBindingModal - Modal para selecionar arma vinculada à origem
 * 
 * Usado para origens que concedem bônus para uma arma específica escolhida:
 * - Operário (Ferramenta de Trabalho): arma simples ou tática +1 ataque/dano/margem
 * 
 * Segue o padrão do Aniquilador (A Favorita) mas para origens
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Wrench, Sword, Check, AlertCircle, Crosshair, Package } from 'lucide-react';

// Tipo de arma compatível com o binding
export interface BindableWeapon {
  id: string;
  name: string;
  category: '0' | 'I' | 'II' | string; // 0=Simples, I=Tática, II=Pesada
  damage: string;
  damageType?: string;
  type?: string; // Corpo a Corpo, Disparo, etc.
  isEquipped?: boolean;
}

// Configuração da origem que requer binding de arma
export interface OriginWeaponBindingConfig {
  originId: string;
  originName: string;
  powerName: string;
  description: string;
  allowedCategories: string[]; // ['0', 'I'] para simples ou tática
  bonuses: {
    attackBonus?: number;
    damageBonus?: number;
    criticalMarginBonus?: number;
  };
}

// Configurações de origens que requerem binding
export const ORIGIN_WEAPON_BINDING_CONFIGS: Record<string, OriginWeaponBindingConfig> = {
  'operario': {
    originId: 'operario',
    originName: 'Operário',
    powerName: 'Ferramenta de Trabalho',
    description: 'Escolha uma arma simples ou tática que poderia ser usada como ferramenta em sua profissão. Você recebe +1 em testes de ataque, rolagens de dano e margem de ameaça com ela.',
    allowedCategories: ['0', 'I', 'simples', 'tatica', 'Simples', 'Tática'],
    bonuses: {
      attackBonus: 1,
      damageBonus: 1,
      criticalMarginBonus: 1,
    },
  },
};

interface OriginWeaponBindingModalProps {
  open: boolean;
  onClose: () => void;
  originId: string;
  weapons: BindableWeapon[];
  currentBoundWeaponId?: string | null;
  onSelectWeapon: (weaponId: string) => Promise<void>;
}

export function OriginWeaponBindingModal({
  open,
  onClose,
  originId,
  weapons,
  currentBoundWeaponId,
  onSelectWeapon,
}: OriginWeaponBindingModalProps) {
  const [selectedWeaponId, setSelectedWeaponId] = useState<string | null>(currentBoundWeaponId || null);
  const [isLoading, setIsLoading] = useState(false);

  // Obtém configuração da origem
  const config = ORIGIN_WEAPON_BINDING_CONFIGS[originId];
  
  // Filtra armas por categoria permitida
  const eligibleWeapons = useMemo(() => {
    if (!config) return [];
    
    return weapons.filter(weapon => {
      const normalizedCategory = weapon.category?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return config.allowedCategories.some(allowed => 
        allowed.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normalizedCategory ||
        allowed === weapon.category
      );
    });
  }, [weapons, config]);

  // Handler de confirmação
  const handleConfirm = async () => {
    if (!selectedWeaponId) return;
    
    setIsLoading(true);
    try {
      await onSelectWeapon(selectedWeaponId);
      onClose();
    } catch (error) {
      console.error('[OriginWeaponBindingModal] Erro ao salvar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!config) {
    return null;
  }

  const getCategoryBadge = (category: string) => {
    const normalized = category?.toLowerCase();
    if (normalized === '0' || normalized === 'simples') {
      return <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs">Simples</Badge>;
    }
    if (normalized === 'i' || normalized === 'tatica' || normalized === 'tática') {
      return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs">Tática</Badge>;
    }
    if (normalized === 'ii' || normalized === 'pesada') {
      return <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 text-xs">Pesada</Badge>;
    }
    return <Badge variant="outline" className="text-xs">{category}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b border-border/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Wrench className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <DialogTitle className="text-lg">{config.powerName}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Origem: {config.originName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Descrição do poder */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-sm text-muted-foreground">
            {config.description}
          </div>

          {/* Bônus que serão aplicados */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Bônus:</span>
            {config.bonuses.attackBonus && (
              <Badge className="bg-green-500/20 text-green-400 text-xs gap-1">
                <Crosshair className="h-3 w-3" />
                +{config.bonuses.attackBonus} Ataque
              </Badge>
            )}
            {config.bonuses.damageBonus && (
              <Badge className="bg-red-500/20 text-red-400 text-xs gap-1">
                <Sword className="h-3 w-3" />
                +{config.bonuses.damageBonus} Dano
              </Badge>
            )}
            {config.bonuses.criticalMarginBonus && (
              <Badge className="bg-amber-500/20 text-amber-400 text-xs gap-1">
                -{config.bonuses.criticalMarginBonus} Margem Crítica
              </Badge>
            )}
          </div>

          {/* Lista de armas elegíveis */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Armas Disponíveis ({eligibleWeapons.length})
            </h4>
            
            {eligibleWeapons.length === 0 ? (
              <div className="p-4 rounded-lg bg-muted/20 border border-dashed border-border text-center">
                <AlertCircle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma arma simples ou tática no inventário.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Adicione uma arma ao inventário primeiro.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[200px] pr-2">
                <div className="space-y-2">
                  {eligibleWeapons.map((weapon) => (
                    <motion.button
                      key={weapon.id}
                      onClick={() => setSelectedWeaponId(weapon.id)}
                      className={cn(
                        "w-full p-3 rounded-lg text-left transition-all",
                        "border",
                        selectedWeaponId === weapon.id
                          ? "bg-amber-500/20 border-amber-500/50 shadow-lg shadow-amber-500/10"
                          : "bg-muted/20 border-border/50 hover:bg-muted/40"
                      )}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{weapon.name}</span>
                            {getCategoryBadge(weapon.category)}
                            {weapon.isEquipped && (
                              <Badge variant="outline" className="text-[10px] px-1">Equipada</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{weapon.damage}</span>
                            {weapon.damageType && (
                              <span className="text-muted-foreground/70">({weapon.damageType})</span>
                            )}
                          </div>
                        </div>
                        
                        {selectedWeaponId === weapon.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="p-1 rounded-full bg-amber-500 text-white"
                          >
                            <Check className="h-3 w-3" />
                          </motion.div>
                        )}
                        
                        {currentBoundWeaponId === weapon.id && selectedWeaponId !== weapon.id && (
                          <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-400">
                            Atual
                          </Badge>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Footer com botões */}
        <div className="flex gap-2 p-4 pt-2 border-t border-border/50">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
            disabled={!selectedWeaponId || isLoading}
          >
            {isLoading ? 'Salvando...' : 'Confirmar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Verifica se uma origem requer binding de arma
 */
export function originRequiresWeaponBinding(originId: string): boolean {
  const normalizedId = originId.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
  return normalizedId in ORIGIN_WEAPON_BINDING_CONFIGS || Object.keys(ORIGIN_WEAPON_BINDING_CONFIGS).some(key => 
    normalizedId.includes(key) || key.includes(normalizedId)
  );
}

/**
 * Obtém a configuração de binding de arma para uma origem
 */
export function getOriginWeaponBindingConfig(originId: string): OriginWeaponBindingConfig | null {
  const normalizedId = originId.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
  
  if (ORIGIN_WEAPON_BINDING_CONFIGS[normalizedId]) {
    return ORIGIN_WEAPON_BINDING_CONFIGS[normalizedId];
  }
  
  // Busca parcial
  for (const [key, config] of Object.entries(ORIGIN_WEAPON_BINDING_CONFIGS)) {
    if (normalizedId.includes(key) || key.includes(normalizedId)) {
      return config;
    }
  }
  
  return null;
}

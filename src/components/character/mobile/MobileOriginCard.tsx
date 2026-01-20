/**
 * MobileOriginCard - Card de exibição da origem com ações especiais
 * 
 * Funcionalidades:
 * - Exibe nome e descrição da origem
 * - Exibe poderes da origem
 * - Para Operário: botão de seleção de "Ferramenta de Trabalho"
 * - Mostra bônus ativos da origem via SUE
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Compass, 
  Wrench, 
  Crosshair, 
  Sword, 
  Check,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  originRequiresWeaponBinding, 
  getOriginWeaponBindingConfig 
} from '../OriginWeaponBindingModal';

interface OriginPower {
  name: string;
  description: string;
}

interface BoundWeaponInfo {
  id: string;
  name: string;
  damage?: string;
  category?: string;
}

interface MobileOriginCardProps {
  /** ID normalizado da origem (ex: 'operario', 'militar') */
  originId: string;
  /** Nome de exibição da origem */
  originName: string;
  /** Descrição da origem */
  originDescription?: string;
  /** Poderes da origem */
  originPowers?: OriginPower[];
  /** Arma vinculada (para origens como Operário) */
  boundWeapon?: BoundWeaponInfo | null;
  /** Se o personagem pode selecionar arma (tem armas no inventário) */
  hasWeaponsAvailable?: boolean;
  /** Callback para abrir modal de seleção de arma */
  onSelectWeapon?: () => void;
  /** Bônus ativos da origem (do SUE) */
  originBonuses?: {
    attackBonus?: number;
    damageBonus?: number;
    criticalMarginBonus?: number;
    rangedDamageBonus?: number;
    healingBonus?: number;
  };
  /** Versão compacta do card */
  compact?: boolean;
}

export const MobileOriginCard = memo(function MobileOriginCard({
  originId,
  originName,
  originDescription,
  originPowers = [],
  boundWeapon,
  hasWeaponsAvailable = false,
  onSelectWeapon,
  originBonuses,
  compact = false,
}: MobileOriginCardProps) {
  // Verifica se a origem requer seleção de arma
  const requiresWeaponBinding = useMemo(() => 
    originRequiresWeaponBinding(originId), 
    [originId]
  );
  
  // Obtém configuração de binding de arma
  const bindingConfig = useMemo(() => 
    getOriginWeaponBindingConfig(originId),
    [originId]
  );

  // Determina se deve mostrar seção de seleção de arma
  const showWeaponSection = requiresWeaponBinding && onSelectWeapon;

  // Renderização compacta (apenas nome e ação)
  if (compact) {
    return (
      <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg border border-border/50">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium">{originName}</span>
        </div>
        
        {showWeaponSection && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectWeapon}
            className={cn(
              "text-xs h-7 px-2",
              boundWeapon 
                ? "text-amber-400 hover:text-amber-300" 
                : "text-muted-foreground hover:text-amber-400"
            )}
          >
            <Wrench className="w-3 h-3 mr-1" />
            {boundWeapon ? boundWeapon.name : 'Selecionar'}
          </Button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="ordo-panel p-3 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-amber-500/20">
          <Compass className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-medium">Origem</h3>
          <p className="text-xs text-muted-foreground">{originName}</p>
        </div>
      </div>

      {/* Descrição */}
      {originDescription && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {originDescription}
        </p>
      )}

      {/* Poderes da origem */}
      {originPowers.length > 0 && (
        <div className="space-y-1.5">
          {originPowers.map((power, index) => (
            <div 
              key={index}
              className="p-2 rounded-lg bg-muted/20 border border-border/30"
            >
              <p className="text-xs font-medium text-foreground">{power.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {power.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Seção de arma vinculada (Operário) */}
      {showWeaponSection && (
        <div className="pt-2 border-t border-border/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-medium">
                {bindingConfig?.powerName || 'Ferramenta de Trabalho'}
              </span>
            </div>
          </div>

          {boundWeapon ? (
            // Arma selecionada
            <motion.button
              onClick={onSelectWeapon}
              className={cn(
                "w-full p-2.5 rounded-lg text-left",
                "bg-amber-500/10 border border-amber-500/30",
                "hover:bg-amber-500/20 transition-colors"
              )}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-amber-500/20">
                    <Check className="w-3 h-3 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{boundWeapon.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {boundWeapon.damage && (
                        <span className="text-[10px] text-muted-foreground">
                          {boundWeapon.damage}
                        </span>
                      )}
                      {bindingConfig?.bonuses && (
                        <div className="flex items-center gap-1">
                          {bindingConfig.bonuses.attackBonus && (
                            <Badge className="h-4 px-1 text-[9px] bg-green-500/20 text-green-400">
                              <Crosshair className="w-2.5 h-2.5 mr-0.5" />
                              +{bindingConfig.bonuses.attackBonus}
                            </Badge>
                          )}
                          {bindingConfig.bonuses.damageBonus && (
                            <Badge className="h-4 px-1 text-[9px] bg-red-500/20 text-red-400">
                              <Sword className="w-2.5 h-2.5 mr-0.5" />
                              +{bindingConfig.bonuses.damageBonus}
                            </Badge>
                          )}
                          {bindingConfig.bonuses.criticalMarginBonus && (
                            <Badge className="h-4 px-1 text-[9px] bg-amber-500/20 text-amber-400">
                              -{bindingConfig.bonuses.criticalMarginBonus} Crit
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </motion.button>
          ) : (
            // Nenhuma arma selecionada
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectWeapon}
              disabled={!hasWeaponsAvailable}
              className="w-full text-xs border-dashed border-amber-500/30 hover:bg-amber-500/10"
            >
              <Wrench className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              {hasWeaponsAvailable 
                ? 'Selecionar Arma' 
                : 'Adicione uma arma ao inventário'
              }
            </Button>
          )}
        </div>
      )}

      {/* Bônus ativos da origem (do SUE) */}
      {originBonuses && Object.values(originBonuses).some(v => v && v > 0) && (
        <div className="pt-2 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground mb-1.5">Bônus Ativos:</p>
          <div className="flex flex-wrap gap-1">
            {originBonuses.attackBonus && originBonuses.attackBonus > 0 && (
              <Badge className="h-5 text-[10px] bg-green-500/20 text-green-400">
                <Crosshair className="w-3 h-3 mr-1" />
                +{originBonuses.attackBonus} Ataque
              </Badge>
            )}
            {originBonuses.damageBonus && originBonuses.damageBonus > 0 && (
              <Badge className="h-5 text-[10px] bg-red-500/20 text-red-400">
                <Sword className="w-3 h-3 mr-1" />
                +{originBonuses.damageBonus} Dano
              </Badge>
            )}
            {originBonuses.rangedDamageBonus && originBonuses.rangedDamageBonus > 0 && (
              <Badge className="h-5 text-[10px] bg-blue-500/20 text-blue-400">
                +{originBonuses.rangedDamageBonus} Dano (Fogo)
              </Badge>
            )}
            {originBonuses.criticalMarginBonus && originBonuses.criticalMarginBonus > 0 && (
              <Badge className="h-5 text-[10px] bg-amber-500/20 text-amber-400">
                -{originBonuses.criticalMarginBonus} Margem Crítica
              </Badge>
            )}
            {originBonuses.healingBonus && originBonuses.healingBonus > 0 && (
              <Badge className="h-5 text-[10px] bg-emerald-500/20 text-emerald-400">
                +{originBonuses.healingBonus} Cura
              </Badge>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
});

/**
 * ProtectionWidget - Widget visual de proteção total
 * 
 * Exibe:
 * - RD total (das armaduras equipadas)
 * - Bônus de defesa do escudo
 * - Penalidades de agilidade e deslocamento
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Shirt, 
  Footprints, 
  TrendingDown,
  Sparkles,
  Info
} from '@/components/icons/ordem-icons';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Interface para item de inventário com dados de proteção
interface ProtectionItem {
  name: string;
  isEquipped?: boolean;
  itemType?: string;
  rd?: number;
  agilityPenalty?: number;
  speedPenalty?: number;
  armorType?: 'leve' | 'pesada' | 'escudo';
  special?: string;
}

interface ProtectionWidgetProps {
  inventory: ProtectionItem[];
  compact?: boolean;
}

/**
 * Extrai bônus de defesa do campo special do escudo
 */
function extractShieldDefenseBonus(special?: string): number {
  if (!special) return 0;
  const match = special.match(/Defesa \+(\d+)/i);
  return match ? parseInt(match[1]) : 0;
}

export function ProtectionWidget({ inventory, compact = false }: ProtectionWidgetProps) {
  // Calcular estatísticas de proteção
  const protectionStats = useMemo(() => {
    // Armaduras equipadas (não escudos)
    const armors = inventory.filter(item => 
      item.isEquipped && 
      item.itemType === 'armor' && 
      item.armorType !== 'escudo'
    );

    // Escudo equipado
    const shield = inventory.find(item => 
      item.isEquipped && 
      item.itemType === 'armor' && 
      item.armorType === 'escudo'
    );

    // RD total (apenas armaduras)
    const totalRD = armors.reduce((sum, armor) => sum + (armor.rd || 0), 0);

    // Bônus de defesa do escudo
    const shieldDefenseBonus = shield ? extractShieldDefenseBonus(shield.special) : 0;

    // Penalidades totais (armadura + escudo)
    const totalAgilityPenalty = 
      armors.reduce((sum, armor) => sum + (armor.agilityPenalty || 0), 0) +
      (shield?.agilityPenalty || 0);

    const totalSpeedPenalty = 
      armors.reduce((sum, armor) => sum + (armor.speedPenalty || 0), 0) +
      (shield?.speedPenalty || 0);

    return {
      totalRD,
      shieldDefenseBonus,
      totalAgilityPenalty,
      totalSpeedPenalty,
      hasArmor: armors.length > 0,
      hasShield: shield !== null,
      armorName: armors[0]?.name,
      shieldName: shield?.name,
    };
  }, [inventory]);

  const hasProtection = protectionStats.hasArmor || protectionStats.hasShield;

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-2">
          {/* RD Badge */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-display",
                protectionStats.totalRD > 0 
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-muted/30 text-muted-foreground border border-border/30"
              )}>
                <Shirt className="w-3 h-3" />
                <span>RD {protectionStats.totalRD}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {protectionStats.hasArmor 
                  ? `Resistência a Dano: ${protectionStats.armorName}` 
                  : 'Sem proteção equipada'}
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Shield Badge */}
          {protectionStats.hasShield && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-display bg-primary/20 text-primary border border-primary/30">
                  <Shield className="w-3 h-3" />
                  <span>+{protectionStats.shieldDefenseBonus} Def</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Escudo: {protectionStats.shieldName}</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Penalties Badge */}
          {(protectionStats.totalAgilityPenalty !== 0 || protectionStats.totalSpeedPenalty !== 0) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-display bg-destructive/20 text-destructive border border-destructive/30">
                  <TrendingDown className="w-3 h-3" />
                  <span>Penalidades</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs space-y-1">
                  {protectionStats.totalAgilityPenalty !== 0 && (
                    <p>Agilidade: {protectionStats.totalAgilityPenalty}</p>
                  )}
                  {protectionStats.totalSpeedPenalty !== 0 && (
                    <p>Deslocamento: {protectionStats.totalSpeedPenalty}m</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <motion.div 
        className="p-3 bg-gradient-to-br from-muted/40 to-muted/20 rounded-lg border border-border/50 space-y-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className="font-display text-xs tracking-wider text-muted-foreground uppercase flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-primary" />
            Proteção Total
          </h4>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">
                RD reduz dano recebido. Bônus de defesa aumenta sua Defesa contra ataques.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* RD (Resistência a Dano) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div 
                className={cn(
                  "relative p-3 rounded-lg border transition-all cursor-help",
                  protectionStats.totalRD > 0
                    ? "bg-blue-500/10 border-blue-500/30"
                    : "bg-muted/20 border-border/30"
                )}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    protectionStats.totalRD > 0 
                      ? "bg-blue-500/20" 
                      : "bg-muted/30"
                  )}>
                    <Shirt className={cn(
                      "w-4 h-4",
                      protectionStats.totalRD > 0 ? "text-blue-400" : "text-muted-foreground"
                    )} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">RD</p>
                    <AnimatePresence mode="wait">
                      <motion.p 
                        key={protectionStats.totalRD}
                        className={cn(
                          "font-display text-lg leading-none",
                          protectionStats.totalRD > 0 ? "text-blue-400" : "text-muted-foreground"
                        )}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                      >
                        {protectionStats.totalRD}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
                {protectionStats.hasArmor && (
                  <p className="text-[10px] text-muted-foreground truncate">
                    {protectionStats.armorName}
                  </p>
                )}
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-medium">Resistência a Dano</p>
              <p className="text-xs text-muted-foreground">
                Reduz o dano físico recebido em {protectionStats.totalRD} pontos
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Bônus de Defesa (Escudo) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div 
                className={cn(
                  "relative p-3 rounded-lg border transition-all cursor-help",
                  protectionStats.hasShield
                    ? "bg-primary/10 border-primary/30"
                    : "bg-muted/20 border-border/30"
                )}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    protectionStats.hasShield 
                      ? "bg-primary/20" 
                      : "bg-muted/30"
                  )}>
                    <Shield className={cn(
                      "w-4 h-4",
                      protectionStats.hasShield ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Escudo</p>
                    <AnimatePresence mode="wait">
                      <motion.p 
                        key={protectionStats.shieldDefenseBonus}
                        className={cn(
                          "font-display text-lg leading-none",
                          protectionStats.hasShield ? "text-primary" : "text-muted-foreground"
                        )}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                      >
                        +{protectionStats.shieldDefenseBonus}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
                {protectionStats.hasShield && (
                  <p className="text-[10px] text-muted-foreground truncate">
                    {protectionStats.shieldName}
                  </p>
                )}
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-medium">Bônus de Defesa</p>
              <p className="text-xs text-muted-foreground">
                {protectionStats.hasShield 
                  ? `Aumenta Defesa em +${protectionStats.shieldDefenseBonus} contra ataques frontais`
                  : 'Equipe um escudo para bônus de defesa'}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Penalidades */}
        {(protectionStats.totalAgilityPenalty !== 0 || protectionStats.totalSpeedPenalty !== 0) && (
          <motion.div 
            className="flex items-center gap-3 p-2 rounded-lg bg-destructive/10 border border-destructive/20"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <TrendingDown className="w-4 h-4 text-destructive flex-shrink-0" />
            <div className="flex items-center gap-4 text-xs">
              {protectionStats.totalAgilityPenalty !== 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-destructive cursor-help">
                      <span className="text-muted-foreground">AGI:</span>
                      <span className="font-display">{protectionStats.totalAgilityPenalty}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Penalidade em testes de Agilidade e na Defesa</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {protectionStats.totalSpeedPenalty !== 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-destructive cursor-help">
                      <Footprints className="w-3 h-3" />
                      <span className="text-muted-foreground">Desl:</span>
                      <span className="font-display">{protectionStats.totalSpeedPenalty}m</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Redução no deslocamento por turno</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </motion.div>
        )}

        {/* Sem proteção */}
        {!hasProtection && (
          <p className="text-xs text-muted-foreground text-center py-1">
            Nenhuma proteção equipada
          </p>
        )}
      </motion.div>
    </TooltipProvider>
  );
}

export default ProtectionWidget;

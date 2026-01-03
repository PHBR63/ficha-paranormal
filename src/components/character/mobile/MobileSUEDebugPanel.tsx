/**
 * MobileSUEDebugPanel - Painel de Debug compacto do SUE para dispositivos móveis
 * 
 * Versão otimizada para mobile com drawer deslizante e resumo de efeitos ativos.
 * Acessível via modo desenvolvedor.
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import { useState, useMemo } from 'react';
import {
  Bug,
  Copy,
  Download,
  Search,
  Sword,
  Shield,
  Target,
  User,
  Sparkles,
  AlertTriangle,
  Flame,
  Activity,
  X,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  MobileDrawer, 
  MobileDrawerClose,
  MobileDrawerContent,
  MobileDrawerHeader,
  MobileDrawerBody,
  MobileDrawerFooter,
  MobileDrawerTitle,
  MobileDrawerDescription,
} from '@/components/ui/mobile-drawer';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { UnifiedEffectsResult } from '@/hooks/useUnifiedEffects';
import { MobileCollapsibleSection } from './MobileCollapsibleSection';

// =====================================================
// Tipos
// =====================================================

interface MobileSUEDebugPanelProps {
  /** Resultado do hook useUnifiedEffects */
  effectsResult: UnifiedEffectsResult;
  /** Nome do personagem (para export) */
  characterName?: string;
  /** Classe CSS adicional */
  className?: string;
}

type SourceType = 'origin' | 'track' | 'condition' | 'ritual' | 'paranormal_power' | 'class_power';

// =====================================================
// Constantes
// =====================================================

const SOURCE_CONFIG: Record<SourceType, { 
  label: string; 
  icon: React.ElementType; 
  color: string;
}> = {
  origin: { label: 'Origem', icon: User, color: 'text-blue-400' },
  track: { label: 'Trilha', icon: Target, color: 'text-purple-400' },
  condition: { label: 'Condição', icon: AlertTriangle, color: 'text-yellow-400' },
  ritual: { label: 'Ritual', icon: Sparkles, color: 'text-red-400' },
  paranormal_power: { label: 'P. Paranormal', icon: Flame, color: 'text-pink-400' },
  class_power: { label: 'P. Classe', icon: Sword, color: 'text-green-400' },
};

// =====================================================
// Componente Principal
// =====================================================

export function MobileSUEDebugPanel({
  effectsResult,
  characterName = 'Personagem',
  className,
}: MobileSUEDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const { allEffects, computed, bySource } = effectsResult;

  // Estatísticas gerais
  const stats = useMemo(() => {
    const activeEffects = allEffects.filter(e => e.isActive);
    const inactiveEffects = allEffects.filter(e => !e.isActive);
    
    return {
      total: allEffects.length,
      active: activeEffects.length,
      inactive: inactiveEffects.length,
      bySource: {
        origin: bySource.origin.length,
        track: bySource.track.length,
        condition: bySource.condition.length,
        ritual: bySource.ritual.length,
        paranormal_power: bySource.paranormal_power.length,
        class_power: bySource.class_power.length,
      },
    };
  }, [allEffects, bySource]);

  // Efeitos filtrados
  const filteredEffects = useMemo(() => {
    let effects = allEffects;
    
    if (!showInactive) {
      effects = effects.filter(e => e.isActive);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      effects = effects.filter(e => 
        e.name.toLowerCase().includes(term) ||
        e.sourceId?.toLowerCase().includes(term) ||
        e.sourceName?.toLowerCase().includes(term)
      );
    }
    
    return effects;
  }, [allEffects, showInactive, searchTerm]);

  // Export para JSON
  const handleExportJSON = () => {
    const exportData = {
      characterName,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      stats,
      allEffects: allEffects.map(e => ({
        id: e.id,
        name: e.name,
        source: e.source,
        sourceId: e.sourceId,
        sourceName: e.sourceName,
        isActive: e.isActive,
        mechanics: e.mechanics,
        conditions: e.conditions,
      })),
      computed,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sue-debug-${characterName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('JSON exportado com sucesso!');
  };

  // Copia para clipboard
  const handleCopyToClipboard = () => {
    const summary = {
      stats,
      combat: {
        attack: computed.attack.general,
        damage: computed.damage.general,
        criticalMargin: computed.critical.marginBonus,
      },
      defense: {
        general: computed.defense.general,
        dr: computed.damageReduction.physical,
      },
      resistances: computed.resistances,
    };
    
    navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
    toast.success('Copiado para a área de transferência!');
  };

  return (
    <>
      {/* Botão flutuante compacto */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-20 right-4 z-40",
          "bg-background/80 backdrop-blur-sm border-primary/30",
          "hover:bg-primary/10 hover:border-primary",
          "h-8 px-2",
          className
        )}
      >
        <Bug className="h-3 w-3 mr-1" />
        <span className="text-xs">SUE</span>
        <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
          {stats.active}
        </Badge>
      </Button>

      {/* Drawer de Debug */}
      <MobileDrawer open={isOpen} onOpenChange={setIsOpen}>
        <MobileDrawerContent maxHeight="xl">
          <MobileDrawerHeader bordered>
            <MobileDrawerTitle className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-primary" />
              SUE Debug Panel
            </MobileDrawerTitle>
            <MobileDrawerDescription>
              {stats.total} efeitos ({stats.active} ativos)
            </MobileDrawerDescription>
          </MobileDrawerHeader>
          
          <MobileDrawerBody>
            <div className="space-y-4">
              {/* Stats Bar Compacta */}
              <div className="flex items-center gap-1 flex-wrap">
                {Object.entries(stats.bySource).map(([source, count]) => {
                  const config = SOURCE_CONFIG[source as SourceType];
                  if (!config || count === 0) return null;
                  const Icon = config.icon;
                  return (
                    <Badge
                      key={source}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0.5"
                    >
                      <Icon className={cn("h-2.5 w-2.5 mr-0.5", config.color)} />
                      {count}
                    </Badge>
                  );
                })}
                {stats.inactive > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                    {stats.inactive} inat
                  </Badge>
                )}
              </div>

              {/* Busca e Filtros */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 h-8 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Switch
                    id="show-inactive-mobile"
                    checked={showInactive}
                    onCheckedChange={setShowInactive}
                    className="scale-75"
                  />
                  <label htmlFor="show-inactive-mobile" className="text-[10px] text-muted-foreground">
                    Inativos
                  </label>
                </div>
              </div>

              {/* Resumo de Combate */}
              <MobileCollapsibleSection
                title="Combate"
                icon={<Sword className="w-3 h-3 text-red-400" />}
                defaultOpen={true}
              >
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ataque:</span>
                    <span className="font-medium">+{computed.attack.general}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dano:</span>
                    <span className="font-medium">+{computed.damage.general}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Margem Crit:</span>
                    <span className="font-medium">+{computed.critical.marginBonus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mult. Crit:</span>
                    <span className="font-medium">+{computed.critical.multiplierBonus}</span>
                  </div>
                </div>
              </MobileCollapsibleSection>

              {/* Resumo de Defesa */}
              <MobileCollapsibleSection
                title="Defesa"
                icon={<Shield className="w-3 h-3 text-blue-400" />}
                defaultOpen={true}
              >
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Defesa:</span>
                    <span className="font-medium">+{computed.defense.general}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">RD Física:</span>
                    <span className="font-medium">{computed.damageReduction.physical}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fortitude:</span>
                    <span className="font-medium">+{computed.resistances.fortitude}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reflexos:</span>
                    <span className="font-medium">+{computed.resistances.reflexos}</span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span className="text-muted-foreground">Vontade:</span>
                    <span className="font-medium">+{computed.resistances.vontade}</span>
                  </div>
                </div>
              </MobileCollapsibleSection>

              {/* Lista de Efeitos */}
              <MobileCollapsibleSection
                title={`Efeitos (${filteredEffects.length})`}
                icon={<Activity className="w-3 h-3 text-primary" />}
                defaultOpen={false}
              >
                <div className="space-y-1.5">
                  {filteredEffects.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Nenhum efeito encontrado
                    </p>
                  ) : (
                    filteredEffects.slice(0, 20).map((effect) => {
                      const config = SOURCE_CONFIG[effect.source as SourceType];
                      const Icon = config?.icon || Activity;
                      return (
                        <div
                          key={effect.id}
                          className={cn(
                            "p-1.5 rounded text-xs border",
                            effect.isActive 
                              ? "bg-muted/30 border-border/50" 
                              : "bg-muted/10 border-border/20 opacity-50"
                          )}
                        >
                          <div className="flex items-center gap-1">
                            <Icon className={cn("h-3 w-3 shrink-0", config?.color || "text-muted-foreground")} />
                            <span className="font-medium truncate flex-1">{effect.name}</span>
                            {effect.isActive ? (
                              <Check className="h-2.5 w-2.5 text-green-500 shrink-0" />
                            ) : (
                              <X className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            {effect.sourceName || effect.sourceId}
                          </p>
                        </div>
                      );
                    })
                  )}
                  {filteredEffects.length > 20 && (
                    <p className="text-[10px] text-muted-foreground text-center">
                      +{filteredEffects.length - 20} mais efeitos
                    </p>
                  )}
                </div>
              </MobileCollapsibleSection>

              {/* Dados Avançados - Ataque Furtivo */}
              {computed.sneakAttack && (computed.sneakAttack.baseDice || 0) > 0 && (
                <MobileCollapsibleSection
                  title="Ataque Furtivo"
                  icon={<Target className="w-3 h-3 text-purple-400" />}
                  defaultOpen={false}
                >
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dados:</span>
                      <span className="font-medium">
                        {computed.sneakAttack.totalDice || computed.sneakAttack.baseDice}d{computed.sneakAttack.dieType?.replace('d', '') || '6'}
                      </span>
                    </div>
                    {(computed.sneakAttack.multiplier ?? 1) > 1 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mult:</span>
                        <span className="font-medium text-red-400">x{computed.sneakAttack.multiplier}</span>
                      </div>
                    )}
                  </div>
                </MobileCollapsibleSection>
              )}
            </div>
          </MobileDrawerBody>

          <MobileDrawerFooter bordered>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyToClipboard}
                className="flex-1 h-8 text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copiar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJSON}
                className="flex-1 h-8 text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                Exportar
              </Button>
              <MobileDrawerClose asChild>
                <Button variant="secondary" size="sm" className="h-8 text-xs">
                  Fechar
                </Button>
              </MobileDrawerClose>
            </div>
          </MobileDrawerFooter>
        </MobileDrawerContent>
      </MobileDrawer>
    </>
  );
}

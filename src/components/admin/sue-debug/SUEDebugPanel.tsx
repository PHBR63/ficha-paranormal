/**
 * SUEDebugPanel - Painel de Debug do Sistema Unificado de Efeitos
 * 
 * Visualização em tempo real de todos os ComputedEffects com:
 * - Breakdown por fonte (Origin, Track, Power, Ritual, Condition)
 * - Export de estado do SUE para JSON
 * - Acessível via modo desenvolvedor ou admin
 * 
 * Este é o componente principal que orquestra as visualizações.
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import { useState, useMemo, useId } from 'react';
import { motion } from 'framer-motion';
import {
  Bug,
  Copy,
  Download,
  Search,
  X,
} from '@/components/icons/ordem-icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { SOURCE_CONFIG } from './sue-debug-constants';
import type { SUEDebugPanelProps, SourceType } from './sue-debug-types';
import { ComputedEffectsView } from './ComputedEffectsView';
import { RawEffectsView } from './RawEffectsView';
import { BreakdownView } from './BreakdownView';

/**
 * Painel de debug para o Sistema Unificado de Efeitos (SUE)
 * 
 * Permite visualizar todos os efeitos ativos e inativos,
 * filtrar por fonte, buscar por nome e exportar dados.
 */
export function SUEDebugPanel({
  effectsResult,
  characterName = 'Personagem',
  compact = false,
  className,
}: SUEDebugPanelProps) {
  // ID único para acessibilidade (evita colisões no DOM)
  const showInactiveId = useId();
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedSources, setSelectedSources] = useState<SourceType[]>([
    'origin', 'track', 'condition', 'ritual', 'paranormal_power', 'class_power'
  ]);
  const [activeTab, setActiveTab] = useState('computed');

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
    
    // Filtra por fonte selecionada
    effects = effects.filter(e => selectedSources.includes(e.source as SourceType));
    
    // Filtra inativos
    if (!showInactive) {
      effects = effects.filter(e => e.isActive);
    }
    
    // Filtra por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      effects = effects.filter(e => 
        e.name.toLowerCase().includes(term) ||
        e.sourceId?.toLowerCase().includes(term) ||
        e.sourceName?.toLowerCase().includes(term)
      );
    }
    
    return effects;
  }, [allEffects, selectedSources, showInactive, searchTerm]);

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
    const exportData = {
      stats,
      computed,
      effectsCount: stats.total,
    };
    
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    toast.success('Copiado para a área de transferência!');
  };

  // Toggle fonte
  const toggleSource = (source: SourceType) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  // Botão flutuante quando fechado
  if (!isOpen) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(true)}
              className={cn(
                "fixed bottom-4 right-4 z-50",
                "bg-background/80 backdrop-blur-sm border-primary/30",
                "hover:bg-primary/10 hover:border-primary",
                className
              )}
            >
              <Bug className="h-4 w-4 mr-2" />
              SUE Debug
              <Badge variant="secondary" className="ml-2">
                {stats.active}
              </Badge>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Abrir Painel de Debug do SUE</p>
            <p className="text-xs text-muted-foreground">
              {stats.total} efeitos ({stats.active} ativos)
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn(
        "fixed bottom-4 right-4 z-50",
        "w-[600px] max-w-[calc(100vw-2rem)]",
        compact && "w-[400px]",
        className
      )}
    >
      <Card className="border-primary/30 bg-background/95 backdrop-blur-md shadow-xl">
        {/* Header */}
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">SUE Debug Panel</CardTitle>
              <Badge variant="outline" className="text-xs">
                v1.0
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleCopyToClipboard}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copiar resumo</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleExportJSON}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Exportar JSON</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {Object.entries(stats.bySource).map(([source, count]) => {
              const config = SOURCE_CONFIG[source as SourceType];
              if (!config || count === 0) return null;
              const Icon = config.icon;
              return (
                <Badge
                  key={source}
                  variant="secondary"
                  className={cn(
                    "cursor-pointer transition-opacity",
                    config.bgColor,
                    !selectedSources.includes(source as SourceType) && "opacity-40"
                  )}
                  onClick={() => toggleSource(source as SourceType)}
                >
                  <Icon className={cn("h-3 w-3 mr-1", config.color)} />
                  {count}
                </Badge>
              );
            })}
            <Separator orientation="vertical" className="h-4" />
            <Badge variant={stats.inactive > 0 ? "destructive" : "secondary"}>
              {stats.inactive} inativos
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {/* Search & Filters */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar efeitos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id={showInactiveId}
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <label htmlFor={showInactiveId} className="text-xs text-muted-foreground">
                Inativos
              </label>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 h-8">
              <TabsTrigger value="computed" className="text-xs">
                Computed
              </TabsTrigger>
              <TabsTrigger value="effects" className="text-xs">
                Efeitos ({filteredEffects.length})
              </TabsTrigger>
              <TabsTrigger value="breakdown" className="text-xs">
                Breakdown
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px] mt-3">
              {/* Tab: Computed Effects */}
              <TabsContent value="computed" className="mt-0">
                <ComputedEffectsView computed={computed} compact={compact} />
              </TabsContent>

              {/* Tab: Raw Effects */}
              <TabsContent value="effects" className="mt-0">
                <RawEffectsView effects={filteredEffects} compact={compact} />
              </TabsContent>

              {/* Tab: Breakdown by Source */}
              <TabsContent value="breakdown" className="mt-0">
                <BreakdownView bySource={bySource} compact={compact} />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}

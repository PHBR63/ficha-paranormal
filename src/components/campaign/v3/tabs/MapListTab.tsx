/**
 * MapListTab - Aba de listagem de mapas táticos
 * 
 * Mostra uma lista de mapas como cards clicáveis.
 * Clicar em um mapa abre a rota fullscreen (/map/:campaignId) em nova guia.
 * O mestre pode criar novos mapas e definir qual está ativo.
 * 
 * @module components/campaign/v3/tabs/MapListTab
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Map as MapIcon,
  Plus,
  ExternalLink,
  Eye,
  ImageIcon,
  Grid3X3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CreateMapDialog } from './CreateMapDialog';
import type { TacticalMap } from '@/hooks/campaign/useTacticalBoard';

interface MapListTabProps {
  /** ID da campanha */
  campaignId: string;
  /** Lista de mapas disponíveis */
  maps: TacticalMap[];
  /** Mapa atualmente ativo */
  activeMap: TacticalMap | null;
  /** Se é mestre */
  isMaster: boolean;
  /** Callbacks de criação (mestre) */
  onCreateMap?: (data: Partial<TacticalMap>) => Promise<TacticalMap | null>;
  onUploadMapImage?: (mapId: string, file: File) => Promise<string | null>;
  onSetActiveMap?: (mapId: string) => Promise<boolean>;
  /** Classe CSS adicional */
  className?: string;
}

export const MapListTab = memo(function MapListTab({
  campaignId,
  maps,
  activeMap,
  isMaster,
  onCreateMap,
  onUploadMapImage,
  onSetActiveMap,
  className,
}: MapListTabProps) {

  /** Abre o mapa em nova aba fullscreen */
  const handleOpenMap = (mapId: string) => {
    // Define como ativo antes de abrir (se for mestre)
    if (isMaster && onSetActiveMap) {
      onSetActiveMap(mapId);
    }
    window.open(`/map/${campaignId}`, '_blank');
  };

  // Estado vazio — sem mapas
  if (maps.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full relative overflow-hidden', className)}>
        {/* Fundo atmosférico */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(hsl(var(--muted-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--muted-foreground)) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent opacity-50" />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex flex-col items-center gap-6 max-w-sm text-center px-4"
        >
          <div className="relative">
            <div className="absolute inset-0 blur-xl bg-primary/10 rounded-full scale-150" />
            <div className="relative p-5 rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm">
              <MapIcon className="h-10 w-10 text-muted-foreground/60" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold text-foreground/80 font-display tracking-wide">
              Nenhum mapa criado
            </h3>
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              {isMaster 
                ? 'Crie um mapa tático para usar durante as sessões. Cada mapa abre em tela cheia numa nova aba.'
                : 'Aguarde o mestre criar um mapa tático para esta campanha.'}
            </p>
          </div>

          {isMaster && onCreateMap && onUploadMapImage && onSetActiveMap && (
            <CreateMapDialog
              onCreateMap={onCreateMap}
              onUploadMapImage={onUploadMapImage}
              onSetActiveMap={onSetActiveMap}
              trigger={
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Mapa
                </Button>
              }
            />
          )}
        </motion.div>
      </div>
    );
  }

  // Lista de mapas
  return (
    <div className={cn('flex flex-col h-full overflow-hidden', className)}>
      {/* Header da lista */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 shrink-0">
        <div className="flex items-center gap-2">
          <MapIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground/80">
            Mapas Táticos
          </span>
          <Badge variant="secondary" className="text-[10px] px-1.5">
            {maps.length}
          </Badge>
        </div>

        {isMaster && onCreateMap && onUploadMapImage && onSetActiveMap && (
          <CreateMapDialog
            onCreateMap={onCreateMap}
            onUploadMapImage={onUploadMapImage}
            onSetActiveMap={onSetActiveMap}
            trigger={
              <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Novo Mapa
              </Button>
            }
          />
        )}
      </div>

      {/* Lista de mapas */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {maps.map((mapItem, index) => {
          const isActive = activeMap?.id === mapItem.id;

          return (
            <motion.div
              key={mapItem.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <button
                onClick={() => handleOpenMap(mapItem.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                  'hover:bg-accent/50 hover:border-accent active:scale-[0.99]',
                  isActive
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border/30 bg-card/30'
                )}
              >
                {/* Thumbnail / ícone */}
                <div className={cn(
                  'shrink-0 w-14 h-14 rounded-md border overflow-hidden flex items-center justify-center',
                  isActive ? 'border-primary/30 bg-primary/10' : 'border-border/30 bg-muted/20'
                )}>
                  {mapItem.image_url ? (
                    <img 
                      src={mapItem.image_url} 
                      alt={mapItem.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Grid3X3 className="h-5 w-5 text-muted-foreground/40" />
                  )}
                </div>

                {/* Info do mapa */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground/90 truncate">
                      {mapItem.name}
                    </span>
                    {isActive && (
                      <Badge variant="default" className="text-[9px] px-1.5 py-0 h-4 shrink-0">
                        <Eye className="h-2.5 w-2.5 mr-0.5" />
                        Ativo
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
                    <span className="flex items-center gap-1">
                      <Grid3X3 className="h-3 w-3" />
                      {mapItem.width_cells || '?'}×{mapItem.height_cells || '?'} cells
                    </span>
                    {mapItem.image_url && (
                      <span className="flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        Com imagem
                      </span>
                    )}
                  </div>
                </div>

                {/* Ação — abrir em nova aba */}
                <div className="shrink-0">
                  <ExternalLink className="h-4 w-4 text-muted-foreground/40" />
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});

export default MapListTab;

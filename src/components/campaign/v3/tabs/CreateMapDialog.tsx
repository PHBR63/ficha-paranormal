/**
 * CreateMapDialog - Dialog para criação de novo mapa tático
 * 
 * Auto-ajusta dimensões do grid com base na imagem enviada.
 * Exibe aviso se a imagem for muito pequena para mapas táticos.
 */

import { useState, useCallback, useEffect } from 'react';
import { Loader2, Plus, AlertTriangle, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapImageUploader, type MapImageData } from '@/components/campaign/tactical/MapImageUploader';
import { toast } from 'sonner';
import type { TacticalMap } from '@/hooks/campaign/useTacticalBoard';

/** Limites para cálculo automático de cells */
const MIN_CELLS = 10;
const MAX_CELLS = 200;
/** Resolução mínima recomendada */
const MIN_RECOMMENDED_WIDTH = 800;
const MIN_RECOMMENDED_HEIGHT = 600;

/** Calcula quantidade de cells com limites */
function calcCells(imagePx: number, gridSize: number): number {
  return Math.min(MAX_CELLS, Math.max(MIN_CELLS, Math.ceil(imagePx / gridSize)));
}

interface CreateMapDialogProps {
  /** Callback para criar o mapa no banco */
  onCreateMap: (data: Partial<TacticalMap>) => Promise<TacticalMap | null>;
  /** Callback para upload de imagem do mapa */
  onUploadMapImage: (mapId: string, file: File) => Promise<string | null>;
  /** Callback para ativar o mapa criado */
  onSetActiveMap: (mapId: string) => Promise<boolean>;
  /** Trigger customizado (opcional) */
  trigger?: React.ReactNode;
}

export function CreateMapDialog({
  onCreateMap,
  onUploadMapImage,
  onSetActiveMap,
  trigger,
}: CreateMapDialogProps) {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [mapName, setMapName] = useState('');
  const [gridSize, setGridSize] = useState(40);
  const [widthCells, setWidthCells] = useState(30);
  const [heightCells, setHeightCells] = useState(20);
  const [imageData, setImageData] = useState<MapImageData | null>(null);
  /** Dimensões naturais da imagem para recalcular ao mudar gridSize */
  const [imageDimensions, setImageDimensions] = useState<{ w: number; h: number } | null>(null);

  /** Reseta estado ao fechar */
  const resetForm = useCallback(() => {
    setMapName('');
    setGridSize(40);
    setWidthCells(30);
    setHeightCells(20);
    setImageData(null);
    setImageDimensions(null);
    setIsCreating(false);
  }, []);

  /** Quando a imagem é selecionada, auto-ajusta cells */
  const handleImageSelect = useCallback((data: MapImageData) => {
    setImageData(data);
    if (data.imageWidth && data.imageHeight) {
      setImageDimensions({ w: data.imageWidth, h: data.imageHeight });
      setWidthCells(calcCells(data.imageWidth, gridSize));
      setHeightCells(calcCells(data.imageHeight, gridSize));
    }
  }, [gridSize]);

  /** Recalcula cells ao mudar gridSize se temos dimensões da imagem */
  useEffect(() => {
    if (imageDimensions) {
      setWidthCells(calcCells(imageDimensions.w, gridSize));
      setHeightCells(calcCells(imageDimensions.h, gridSize));
    }
  }, [gridSize, imageDimensions]);

  /** Verifica se a imagem é pequena demais */
  const isSmallImage = imageDimensions && (
    imageDimensions.w < MIN_RECOMMENDED_WIDTH || imageDimensions.h < MIN_RECOMMENDED_HEIGHT
  );

  /** Cria o mapa e faz upload da imagem se necessário */
  const handleCreate = useCallback(async () => {
    if (!mapName.trim()) {
      toast.error('Digite um nome para o mapa');
      return;
    }

    setIsCreating(true);

    try {
      const newMap = await onCreateMap({
        name: mapName.trim(),
        grid_size: gridSize,
        width_cells: widthCells,
        height_cells: heightCells,
        image_url: imageData?.url || '',
      });

      if (!newMap) {
        setIsCreating(false);
        return;
      }

      if (imageData?.file) {
        const uploadedUrl = await onUploadMapImage(newMap.id, imageData.file);
        if (!uploadedUrl) {
          toast.warning('Mapa criado, mas houve erro no upload da imagem');
        }
      }

      await onSetActiveMap(newMap.id);

      toast.success(`Mapa "${mapName.trim()}" criado!`);
      setOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error('Erro ao criar mapa: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsCreating(false);
    }
  }, [mapName, gridSize, widthCells, heightCells, imageData, onCreateMap, onUploadMapImage, onSetActiveMap, resetForm]);

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Mapa
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Mapa Tático</DialogTitle>
          <DialogDescription>
            Configure o nome, grid e imagem de fundo do mapa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Nome do mapa */}
          <div className="space-y-2">
            <Label htmlFor="map-name">Nome do Mapa *</Label>
            <Input
              id="map-name"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              placeholder="Ex: Sala do Ritual, Floresta Sombria..."
              disabled={isCreating}
              autoFocus
            />
          </div>

          {/* Upload de imagem — antes do grid para auto-ajustar */}
          <div className="space-y-2">
            <Label>Imagem de Fundo (opcional)</Label>
            <MapImageUploader
              onImageSelect={handleImageSelect}
              isLoading={isCreating}
            />

            {/* Resolução da imagem */}
            {imageDimensions && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 shrink-0" />
                <span>Resolução: {imageDimensions.w} × {imageDimensions.h} px</span>
              </div>
            )}

            {/* Aviso de imagem pequena */}
            {isSmallImage && (
              <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-200">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-yellow-400" />
                <span>
                  Imagem pequena — recomenda-se uma resolução maior para mapas táticos (mínimo 1920×1080).
                  Mapas muito pequenos ficam pixelados ao ampliar.
                </span>
              </div>
            )}
          </div>

          {/* Dimensões do grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="grid-size">Grid (px)</Label>
              <Input
                id="grid-size"
                type="number"
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value) || 40)}
                min={20}
                max={100}
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="width-cells">Largura (cells)</Label>
              <Input
                id="width-cells"
                type="number"
                value={widthCells}
                onChange={(e) => setWidthCells(Number(e.target.value) || 10)}
                min={5}
                max={MAX_CELLS}
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height-cells">Altura (cells)</Label>
              <Input
                id="height-cells"
                type="number"
                value={heightCells}
                onChange={(e) => setHeightCells(Number(e.target.value) || 10)}
                min={5}
                max={MAX_CELLS}
                disabled={isCreating}
              />
            </div>
          </div>

          {/* Info: dimensões resultantes */}
          {imageDimensions && (
            <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2">
              Tamanho resultante: {widthCells * gridSize} × {heightCells * gridSize} px
              ({widthCells} × {heightCells} cells de {gridSize}px)
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => { setOpen(false); resetForm(); }}
            disabled={isCreating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !mapName.trim()}
            className="gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Criar Mapa
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

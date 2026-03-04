/**
 * CreateMapDialog - Dialog para criação de novo mapa tático
 * 
 * Permite definir nome, dimensões do grid e upload de imagem.
 * Integra com useTacticalBoard.createMap e uploadMapImage.
 */

import { useState, useCallback } from 'react';
import { Loader2, Plus } from 'lucide-react';
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
import { MapImageUploader } from '@/components/campaign/tactical/MapImageUploader';
import { toast } from 'sonner';
import type { TacticalMap } from '@/hooks/campaign/useTacticalBoard';

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
  const [imageData, setImageData] = useState<{ file?: File; url?: string; previewUrl: string } | null>(null);

  /** Reseta estado ao fechar */
  const resetForm = useCallback(() => {
    setMapName('');
    setGridSize(40);
    setWidthCells(30);
    setHeightCells(20);
    setImageData(null);
    setIsCreating(false);
  }, []);

  /** Cria o mapa e faz upload da imagem se necessário */
  const handleCreate = useCallback(async () => {
    if (!mapName.trim()) {
      toast.error('Digite um nome para o mapa');
      return;
    }

    setIsCreating(true);

    try {
      // 1. Cria o mapa no banco
      const newMap = await onCreateMap({
        name: mapName.trim(),
        grid_size: gridSize,
        width_cells: widthCells,
        height_cells: heightCells,
        image_url: imageData?.url || '', // URL externa ou vazio
      });

      if (!newMap) {
        setIsCreating(false);
        return;
      }

      // 2. Se tem arquivo local, faz upload
      if (imageData?.file) {
        const uploadedUrl = await onUploadMapImage(newMap.id, imageData.file);
        if (!uploadedUrl) {
          toast.warning('Mapa criado, mas houve erro no upload da imagem');
        }
      }

      // 3. Ativa o mapa
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

          {/* Dimensões do grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="grid-size">Tamanho do Grid (px)</Label>
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
                max={100}
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
                max={100}
                disabled={isCreating}
              />
            </div>
          </div>

          {/* Upload de imagem */}
          <div className="space-y-2">
            <Label>Imagem de Fundo (opcional)</Label>
            <MapImageUploader
              onImageSelect={setImageData}
              isLoading={isCreating}
            />
          </div>
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

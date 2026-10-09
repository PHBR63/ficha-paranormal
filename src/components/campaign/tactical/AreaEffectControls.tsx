/**
 * AreaEffectControls - Painel de criação e gerenciamento de áreas de efeito (Fase D)
 * 
 * Permite criar cone, círculo, linha e quadrado com configuração visual.
 * Integrado ao MapSidePanel.
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Circle, Triangle, Minus, Square, Trash2, Eye, EyeOff, Target } from '@/components/icons/ordem-icons';
import type { CreateAreaEffectData } from '@/hooks/campaign/useAreaEffects';
import type { MapAreaEffect } from '@/components/campaign/tactical/layers/AreaEffectLayer';

// Mapeamento de elementos para cores
const ELEMENT_COLORS: Record<string, { color: string; border: string }> = {
  'Sangue': { color: '#dc2626', border: '#ef4444' },
  'Morte': { color: '#1e1b4b', border: '#4c1d95' },
  'Conhecimento': { color: '#f59e0b', border: '#fbbf24' },
  'Energia': { color: '#3b82f6', border: '#60a5fa' },
  'Medo': { color: '#6b21a8', border: '#a855f7' },
  'Nenhum': { color: '#6b7280', border: '#9ca3af' },
};

interface AreaEffectControlsProps {
  /** Áreas existentes */
  areas: MapAreaEffect[];
  /** Área selecionada */
  selectedAreaId: string | null;
  /** Se é mestre */
  isMaster: boolean;
  /** Callback para criar área */
  onCreateArea: (data: CreateAreaEffectData) => Promise<any>;
  /** Callback para atualizar área */
  onUpdateArea: (areaId: string, data: Partial<CreateAreaEffectData>) => Promise<boolean>;
  /** Callback para deletar área */
  onDeleteArea: (areaId: string) => Promise<boolean>;
  /** Callback para limpar todas */
  onClearAll: () => Promise<boolean>;
  /** Callback para selecionar área */
  onSelectArea: (areaId: string | null) => void;
}

// Ícone por tipo de forma
const SHAPE_ICONS = {
  circle: Circle,
  cone: Triangle,
  line: Minus,
  square: Square,
};

export function AreaEffectControls({
  areas,
  selectedAreaId,
  isMaster,
  onCreateArea,
  onUpdateArea,
  onDeleteArea,
  onClearAll,
  onSelectArea,
}: AreaEffectControlsProps) {
  // Estado do formulário de criação
  const [shapeType, setShapeType] = useState<'circle' | 'cone' | 'line' | 'square'>('circle');
  const [radius, setRadius] = useState(3);
  const [angle, setAngle] = useState(90);
  const [rotation, setRotation] = useState(0);
  const [sideLength, setSideLength] = useState(3);
  const [lineLength, setLineLength] = useState(6);
  const [element, setElement] = useState('Nenhum');
  const [label, setLabel] = useState('');
  const [visibility, setVisibility] = useState<'all' | 'master'>('all');
  const [opacity, setOpacity] = useState(0.35);

  // Cor baseada no elemento
  const colors = ELEMENT_COLORS[element] || ELEMENT_COLORS['Nenhum'];

  // Cria área no centro do mapa (posição 10,10 como default)
  const handleCreate = useCallback(async () => {
    const data: CreateAreaEffectData = {
      shape_type: shapeType,
      origin_x: 10,
      origin_y: 10,
      radius,
      angle,
      rotation,
      side_length: sideLength,
      line_length: lineLength,
      color: colors.color,
      border_color: colors.border,
      opacity,
      label: label || null,
      element: element !== 'Nenhum' ? element : null,
      visibility,
    };
    await onCreateArea(data);
  }, [shapeType, radius, angle, rotation, sideLength, lineLength, element, label, visibility, opacity, colors, onCreateArea]);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-1">
        {/* Seleção de forma */}
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            Forma da Área
          </Label>
          <div className="grid grid-cols-4 gap-1">
            {(['circle', 'cone', 'line', 'square'] as const).map(shape => {
              const Icon = SHAPE_ICONS[shape];
              const labels = { circle: 'Esfera', cone: 'Cone', line: 'Linha', square: 'Cubo' };
              return (
                <Button
                  key={shape}
                  variant={shapeType === shape ? 'default' : 'outline'}
                  size="sm"
                  className="flex flex-col h-14 gap-1 text-xs"
                  onClick={() => setShapeType(shape)}
                >
                  <Icon className="h-4 w-4" />
                  {labels[shape]}
                </Button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Parâmetros por forma */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Dimensões
          </Label>

          {/* Raio (circle e cone) */}
          {(shapeType === 'circle' || shapeType === 'cone') && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Raio</span>
                <span className="text-muted-foreground">{radius}m ({Math.round(radius / 1.5)} quadrados)</span>
              </div>
              <Slider
                value={[radius]}
                onValueChange={([v]) => setRadius(v)}
                min={1.5}
                max={30}
                step={1.5}
              />
            </div>
          )}

          {/* Ângulo (cone) */}
          {shapeType === 'cone' && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Abertura</span>
                <span className="text-muted-foreground">{angle}°</span>
              </div>
              <Slider
                value={[angle]}
                onValueChange={([v]) => setAngle(v)}
                min={15}
                max={360}
                step={15}
              />
            </div>
          )}

          {/* Comprimento (linha) */}
          {shapeType === 'line' && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Comprimento</span>
                <span className="text-muted-foreground">{lineLength}m ({Math.round(lineLength / 1.5)} quadrados)</span>
              </div>
              <Slider
                value={[lineLength]}
                onValueChange={([v]) => setLineLength(v)}
                min={1.5}
                max={30}
                step={1.5}
              />
            </div>
          )}

          {/* Lado (quadrado) */}
          {shapeType === 'square' && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Lado</span>
                <span className="text-muted-foreground">{sideLength}m ({Math.round(sideLength / 1.5)} quadrados)</span>
              </div>
              <Slider
                value={[sideLength]}
                onValueChange={([v]) => setSideLength(v)}
                min={1.5}
                max={30}
                step={1.5}
              />
            </div>
          )}

          {/* Rotação (cone, linha, quadrado) */}
          {shapeType !== 'circle' && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Direção</span>
                <span className="text-muted-foreground">{rotation}°</span>
              </div>
              <Slider
                value={[rotation]}
                onValueChange={([v]) => setRotation(v)}
                min={0}
                max={359}
                step={15}
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Elemento e aparência */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Aparência
          </Label>

          <div>
            <Label className="text-xs mb-1 block">Elemento</Label>
            <Select value={element} onValueChange={setElement}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(ELEMENT_COLORS).map(el => (
                  <SelectItem key={el} value={el}>{el}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs mb-1 block">Rótulo (opcional)</Label>
            <Input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Ex: Bola de Fogo"
              className="h-8 text-xs"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Opacidade</span>
              <span className="text-muted-foreground">{Math.round(opacity * 100)}%</span>
            </div>
            <Slider
              value={[opacity]}
              onValueChange={([v]) => setOpacity(v)}
              min={0.1}
              max={0.8}
              step={0.05}
            />
          </div>

          {/* Visibilidade */}
          <div className="flex items-center justify-between">
            <Label className="text-xs">Visível para jogadores</Label>
            <Switch
              checked={visibility === 'all'}
              onCheckedChange={(checked) => setVisibility(checked ? 'all' : 'master')}
            />
          </div>
        </div>

        <Separator />

        {/* Preview de cor */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-muted/50">
          <div 
            className="w-6 h-6 rounded border" 
            style={{ backgroundColor: colors.color, borderColor: colors.border, opacity }}
          />
          <span className="text-xs text-muted-foreground">
            {element} • {visibility === 'all' ? 'Pública' : 'Só Mestre'}
          </span>
        </div>

        {/* Botão criar */}
        <Button onClick={handleCreate} className="w-full" size="sm">
          <Target className="h-4 w-4 mr-2" />
          Posicionar Área
        </Button>

        <Separator />

        {/* Lista de áreas ativas */}
        {areas.length > 0 && (
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Áreas Ativas ({areas.length})
            </Label>
            <div className="space-y-1">
              {areas.map(area => {
                const Icon = SHAPE_ICONS[area.shape_type];
                return (
                  <div
                    key={area.id}
                    className={`flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer transition-colors
                      ${selectedAreaId === area.id ? 'bg-primary/20 border border-primary/30' : 'bg-muted/30 hover:bg-muted/50'}`}
                    onClick={() => onSelectArea(selectedAreaId === area.id ? null : area.id)}
                  >
                    <div 
                      className="w-4 h-4 rounded-sm flex items-center justify-center"
                      style={{ backgroundColor: area.color, opacity: area.opacity }}
                    >
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                    <span className="flex-1 truncate">
                      {area.label || area.shape_type}
                    </span>
                    {area.visibility === 'master' && (
                      <EyeOff className="h-3 w-3 text-muted-foreground" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteArea(area.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
            
            {isMaster && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 text-xs text-destructive"
                onClick={onClearAll}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Limpar Todas
              </Button>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

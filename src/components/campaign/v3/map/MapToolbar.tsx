/**
 * MapToolbar - Toolbar lateral completa do mapa tático
 * 
 * Inclui:
 * - Ferramentas principais (Selecionar, Mover, Medir, Ping, Desenhar, Texto, Névoa)
 * - Sub-ferramentas de desenho (Caneta, Linha, Retângulo, Círculo, Borracha)
 * - Paleta de cores e espessura do traço
 * - Sub-ferramentas de texto (cor, tamanho)
 * - Toggle de grid
 * - Undo/Redo de desenhos
 * - Atalhos de teclado
 * 
 * @module components/campaign/v3/map/MapToolbar
 */

import { memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MousePointer2,
  Move,
  Ruler,
  CloudFog,
  Radio,
  Pencil,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Minus,
  Square,
  Circle,
  Grid3X3,
} from '@/components/icons/ordem-icons';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Tipos exportados
export type ToolType = 'select' | 'move' | 'measure' | 'fog' | 'ping' | 'draw' | 'text';
export type DrawToolType = 'pen' | 'line' | 'rect' | 'circle' | 'eraser';

// Cores predefinidas para desenho/texto
const DRAW_COLORS = [
  '#ffffff', '#ff0000', '#00ff00', '#0088ff',
  '#ffff00', '#ff8800', '#ff00ff', '#00ffff',
];

// Configuração das ferramentas principais
const MAIN_TOOLS: { id: ToolType; icon: typeof MousePointer2; label: string; shortcut: string; masterOnly: boolean }[] = [
  { id: 'select', icon: MousePointer2, label: 'Selecionar', shortcut: 'V', masterOnly: false },
  { id: 'move', icon: Move, label: 'Mover câmera', shortcut: 'H', masterOnly: false },
  { id: 'measure', icon: Ruler, label: 'Medir distância', shortcut: 'M', masterOnly: false },
  { id: 'ping', icon: Radio, label: 'Ping', shortcut: 'P', masterOnly: false },
  { id: 'draw', icon: Pencil, label: 'Desenhar', shortcut: 'D', masterOnly: false },
  { id: 'text', icon: Type, label: 'Texto', shortcut: 'T', masterOnly: false },
  { id: 'fog', icon: CloudFog, label: 'Névoa de Guerra', shortcut: 'F', masterOnly: true },
];

// Sub-ferramentas de desenho
const DRAW_SUB_TOOLS: { id: DrawToolType; icon: typeof Pencil; label: string }[] = [
  { id: 'pen', icon: Pencil, label: 'Caneta livre' },
  { id: 'line', icon: Minus, label: 'Linha reta' },
  { id: 'rect', icon: Square, label: 'Retângulo' },
  { id: 'circle', icon: Circle, label: 'Círculo' },
  { id: 'eraser', icon: Eraser, label: 'Borracha' },
];

interface MapToolbarProps {
  /** Ferramenta principal ativa */
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  /** Sub-ferramenta de desenho */
  drawTool: DrawToolType;
  onDrawToolChange: (tool: DrawToolType) => void;
  /** Cor de desenho */
  drawColor: string;
  onDrawColorChange: (color: string) => void;
  /** Espessura do traço */
  drawStrokeWidth: number;
  onDrawStrokeWidthChange: (width: number) => void;
  /** Cor do texto */
  textColor: string;
  onTextColorChange: (color: string) => void;
  /** Tamanho da fonte */
  textFontSize: number;
  onTextFontSizeChange: (size: number) => void;
  /** Se é mestre */
  isMaster: boolean;
  /** Grid visível */
  gridVisible?: boolean;
  onToggleGrid?: () => void;
  /** Undo/Redo de desenho */
  canUndoDrawing?: boolean;
  canRedoDrawing?: boolean;
  onDrawingUndo?: () => void;
  onDrawingRedo?: () => void;
  /** Limpar todos os desenhos */
  onDrawingClearAll?: () => void;
}

export const MapToolbar = memo(function MapToolbar({
  activeTool,
  onToolChange,
  drawTool,
  onDrawToolChange,
  drawColor,
  onDrawColorChange,
  drawStrokeWidth,
  onDrawStrokeWidthChange,
  textColor,
  onTextColorChange,
  textFontSize,
  onTextFontSizeChange,
  isMaster,
  gridVisible = true,
  onToggleGrid,
  canUndoDrawing = false,
  canRedoDrawing = false,
  onDrawingUndo,
  onDrawingRedo,
  onDrawingClearAll,
}: MapToolbarProps) {
  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se está digitando em input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.ctrlKey || e.metaKey || e.altKey
      ) {
        // Permite Ctrl+Z/Y para undo/redo de desenho
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && activeTool === 'draw') {
          e.preventDefault();
          onDrawingUndo?.();
          return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'y' && activeTool === 'draw') {
          e.preventDefault();
          onDrawingRedo?.();
          return;
        }
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        return;
      }

      const key = e.key.toUpperCase();
      const tool = MAIN_TOOLS.find(t => t.shortcut === key);
      if (tool && (!tool.masterOnly || isMaster)) {
        e.preventDefault();
        onToolChange(tool.id);
        return;
      }

      // Toggle grid com G
      if (key === 'G' && onToggleGrid) {
        e.preventDefault();
        onToggleGrid();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, isMaster, onToolChange, onToggleGrid, onDrawingUndo, onDrawingRedo]);

  // Ferramentas visíveis (filtra master-only)
  const visibleTools = MAIN_TOOLS.filter(t => !t.masterOnly || isMaster);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-3 left-3 z-10 pointer-events-auto"
    >
      <div className="flex flex-col gap-0.5 p-1.5 rounded-xl bg-card/90 backdrop-blur-md border border-border/50 shadow-xl">
        {/* === Ferramentas Principais === */}
        {visibleTools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="icon"
                  className={cn(
                    'h-9 w-9 transition-all',
                    isActive && 'shadow-md shadow-primary/20',
                  )}
                  onClick={() => onToolChange(tool.id)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-2">
                {tool.label}
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground">
                  {tool.shortcut}
                </kbd>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* === Separador + Toggle Grid === */}
        <div className="h-px bg-border/40 my-1" />
        
        {onToggleGrid && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={gridVisible ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9"
                onClick={onToggleGrid}
              >
                <Grid3X3 className={cn('h-4 w-4', !gridVisible && 'opacity-40')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              {gridVisible ? 'Ocultar grid' : 'Mostrar grid'}
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground">G</kbd>
            </TooltipContent>
          </Tooltip>
        )}

        {/* === Sub-ferramentas de Desenho === */}
        <AnimatePresence>
          {activeTool === 'draw' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="h-px bg-border/40 my-1" />

              {/* Formas de desenho */}
              <div className="flex flex-col gap-0.5">
                {DRAW_SUB_TOOLS.map((sub) => {
                  const SubIcon = sub.icon;
                  const isActive = drawTool === sub.id;
                  return (
                    <Tooltip key={sub.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'}
                          size="icon"
                          className={cn(
                            'h-8 w-8',
                            isActive && 'ring-1 ring-primary/40',
                          )}
                          onClick={() => onDrawToolChange(sub.id)}
                        >
                          <SubIcon className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">{sub.label}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

              <div className="h-px bg-border/40 my-1" />

              {/* Paleta de cores */}
              <div className="grid grid-cols-4 gap-0.5 px-0.5">
                {DRAW_COLORS.map(color => (
                  <button
                    key={color}
                    className={cn(
                      'w-5 h-5 rounded-md border transition-all',
                      drawColor === color
                        ? 'border-primary ring-1 ring-primary/50 scale-110'
                        : 'border-border/40 hover:scale-105'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => onDrawColorChange(color)}
                    title={color}
                  />
                ))}
              </div>

              <div className="h-px bg-border/40 my-1" />

              {/* Espessura do traço */}
              <div className="flex items-center gap-0.5 px-0.5">
                {[2, 4, 8].map(w => (
                  <button
                    key={w}
                    className={cn(
                      'flex-1 h-7 rounded-md flex items-center justify-center text-[10px] font-medium transition-colors',
                      drawStrokeWidth === w
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    )}
                    onClick={() => onDrawStrokeWidthChange(w)}
                  >
                    {w}px
                  </button>
                ))}
              </div>

              <div className="h-px bg-border/40 my-1" />

              {/* Undo / Redo */}
              <div className="flex gap-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-1"
                      disabled={!canUndoDrawing}
                      onClick={onDrawingUndo}
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Desfazer (Ctrl+Z)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-1"
                      disabled={!canRedoDrawing}
                      onClick={onDrawingRedo}
                    >
                      <Redo2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Refazer (Ctrl+Y)</TooltipContent>
                </Tooltip>
              </div>

              {/* Limpar tudo (mestre) */}
              {isMaster && onDrawingClearAll && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={onDrawingClearAll}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Limpar todos os desenhos</TooltipContent>
                </Tooltip>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* === Sub-ferramentas de Texto === */}
        <AnimatePresence>
          {activeTool === 'text' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="h-px bg-border/40 my-1" />

              {/* Paleta de cores do texto */}
              <div className="grid grid-cols-4 gap-0.5 px-0.5">
                {DRAW_COLORS.map(color => (
                  <button
                    key={color}
                    className={cn(
                      'w-5 h-5 rounded-md border transition-all',
                      textColor === color
                        ? 'border-primary ring-1 ring-primary/50 scale-110'
                        : 'border-border/40 hover:scale-105'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => onTextColorChange(color)}
                    title={color}
                  />
                ))}
              </div>

              <div className="h-px bg-border/40 my-1" />

              {/* Tamanho da fonte */}
              <div className="flex items-center gap-0.5 px-0.5">
                {[12, 16, 24, 36].map(s => (
                  <button
                    key={s}
                    className={cn(
                      'flex-1 h-7 rounded-md flex items-center justify-center text-[10px] font-medium transition-colors',
                      textFontSize === s
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    )}
                    onClick={() => onTextFontSizeChange(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

export default MapToolbar;

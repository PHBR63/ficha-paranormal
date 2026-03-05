/**
 * MapSidePanel - Sidebar lateral direita do mapa tático
 * 
 * Inspirado na referência Lich VTT, organiza funcionalidades em seções
 * colapsáveis: jogadores, tokens, desenho, transformar, fog e controles.
 * 
 * @module components/campaign/v3/map/MapSidePanel
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Pencil,
  Eraser,
  Undo2,
  Trash2,
  Lock,
  Unlock,
  RotateCw,
  FlipHorizontal,
  CloudFog,
  Maximize2,
  Type,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  Circle,
  Minus,
  Square,
  UserCircle,
  Layers,
  ZoomIn,
  ZoomOut,
  Copy,
  Check,
  MousePointer2,
  Move,
  Ruler,
  Radio,
  Grid3X3,
  Wrench,
  AlertTriangle,
  Eye,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { TacticalMap, MapToken } from '@/hooks/campaign/useTacticalBoard';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';
import type { DrawToolType } from '@/components/campaign/v3/map/MapToolbar';
import type { MapAreaEffect } from '@/components/campaign/tactical/layers/AreaEffectLayer';
import type { CreateAreaEffectData } from '@/hooks/campaign/useAreaEffects';
import { AreaEffectControls } from '@/components/campaign/tactical/AreaEffectControls';
import { Target } from 'lucide-react';
import type { PingType } from '@/hooks/campaign/useAdvancedPings';

// =====================================================
// CONSTANTES
// =====================================================

/** Cores predefinidas para desenho/texto */
const DRAW_COLORS = [
  '#ffffff', '#ff0000', '#00ff00', '#0088ff',
  '#ffff00', '#ff8800', '#ff00ff', '#00ffff',
];

/** Cores para tokens rápidos */
const TOKEN_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
];

// =====================================================
// TIPOS
// =====================================================

interface MapSidePanelProps {
  /** Se o painel está aberto */
  open: boolean;
  /** Toggle abrir/fechar */
  onToggle: () => void;
  /** Mapa ativo */
  map: TacticalMap | null;
  /** Tokens no mapa */
  tokens: MapToken[];
  /** Token selecionado */
  selectedTokenId: string | null;
  /** Membros da campanha */
  members: CampaignMemberV2[];
  /** Se é mestre */
  isMaster: boolean;
  /** ID da campanha (para código da sala) */
  campaignId: string;
  /** Zoom atual */
  zoom: number;

  // Callbacks de token
  onTokenSelect: (tokenId: string | null) => void;
  onTokenCreate?: (data: Partial<MapToken>) => Promise<MapToken | null>;
  onTokenUpdate?: (tokenId: string, data: Partial<MapToken>) => Promise<boolean>;
  onTokenDelete?: (tokenId: string) => Promise<boolean>;

  // Callbacks de desenho
  activeTool: string;
  drawTool: DrawToolType;
  drawColor: string;
  drawStrokeWidth: number;
  onToolChange: (tool: string) => void;
  onDrawToolChange: (tool: DrawToolType) => void;
  onDrawColorChange: (color: string) => void;
  onDrawStrokeWidthChange: (width: number) => void;
  canUndoDrawing?: boolean;
  canRedoDrawing?: boolean;
  onDrawingUndo?: () => void;
  onDrawingRedo?: () => void;
  onDrawingClearAll?: () => void;

  // Callbacks de texto
  textColor: string;
  textFontSize: number;
  onTextColorChange: (color: string) => void;
  onTextFontSizeChange: (size: number) => void;

  // Callbacks de zoom/view
  onZoomChange: (zoom: number) => void;
  onResetView: () => void;

  // Grid
  gridVisible?: boolean;
  onToggleGrid?: () => void;

  // Áreas de efeito (Fase D)
  areas?: MapAreaEffect[];
  selectedAreaId?: string | null;
  onCreateArea?: (data: CreateAreaEffectData) => Promise<any>;
  onUpdateArea?: (areaId: string, data: Partial<CreateAreaEffectData>) => Promise<boolean>;
  onDeleteArea?: (areaId: string) => Promise<boolean>;
  onClearAllAreas?: () => Promise<boolean>;
  onSelectArea?: (areaId: string | null) => void;

  // Fog of war
  onFogReveal?: (cells: Array<{ x: number; y: number }>) => Promise<boolean>;
  onFogHide?: (cells: Array<{ x: number; y: number }>) => Promise<boolean>;

  // Pings avançados (Fase E)
  pingType?: PingType;
  pingMessage?: string;
  onPingTypeChange?: (type: PingType) => void;
  onPingMessageChange?: (msg: string) => void;
}

// =====================================================
// SEÇÃO COLAPSÁVEL
// =====================================================

/** Seção colapsável com título dourado/âmbar */
const SideSection = memo(function SideSection({
  title,
  icon: Icon,
  defaultOpen = true,
  badge,
  children,
}: {
  title: string;
  icon: typeof Users;
  defaultOpen?: boolean;
  badge?: string | number;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border/20">
      {/* Cabeçalho da seção — estilo âmbar como na referência */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-accent/30 transition-colors"
      >
        <Icon className="h-3.5 w-3.5 text-amber-500" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-500/90 flex-1">
          {title}
        </span>
        {badge !== undefined && (
          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-amber-500/10 text-amber-400 border-amber-500/20">
            {badge}
          </Badge>
        )}
        {isOpen ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        )}
      </button>

      {/* Conteúdo */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// =====================================================
// DIALOG CRIAR TOKEN RÁPIDO
// =====================================================

const CreateTokenDialog = memo(function CreateTokenDialog({
  onCreateToken,
  mapId,
}: {
  onCreateToken: (data: Partial<MapToken>) => Promise<MapToken | null>;
  mapId: string;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(TOKEN_COLORS[0]);
  const [creating, setCreating] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) return;
    setCreating(true);
    await onCreateToken({
      map_id: mapId,
      name: name.trim(),
      token_type: 'npc',
      x: 5,
      y: 5,
      size: 1,
      rotation: 0,
      layer: 'token',
      conditions: [],
      light_radius: 0,
      light_color: color,
      locked: false,
    });
    setName('');
    setCreating(false);
  }, [name, color, onCreateToken, mapId]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="flex-1 gap-1.5 h-8 text-xs bg-amber-600/80 hover:bg-amber-600 text-white border-0">
          <Plus className="h-3.5 w-3.5" />
          Criar Token
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">Criar Token Rápido</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Nome do token..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          {/* Paleta de cores */}
          <div className="flex gap-1.5 flex-wrap">
            {TOKEN_COLORS.map(c => (
              <button
                key={c}
                className={cn(
                  'w-6 h-6 rounded-full border-2 transition-all',
                  color === c ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                )}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <DialogClose asChild>
            <Button
              size="sm"
              className="w-full h-8 bg-amber-600 hover:bg-amber-700 text-white"
              disabled={!name.trim() || creating}
              onClick={handleCreate}
            >
              Criar
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
});

// =====================================================
// COMPONENTE PRINCIPAL — MapSidePanel
// =====================================================

export const MapSidePanel = memo(function MapSidePanel({
  open,
  onToggle,
  map,
  tokens,
  selectedTokenId,
  members,
  isMaster,
  campaignId,
  zoom,
  onTokenSelect,
  onTokenCreate,
  onTokenUpdate,
  onTokenDelete,
  activeTool,
  drawTool,
  drawColor,
  drawStrokeWidth,
  onToolChange,
  onDrawToolChange,
  onDrawColorChange,
  onDrawStrokeWidthChange,
  canUndoDrawing,
  canRedoDrawing,
  onDrawingUndo,
  onDrawingRedo,
  onDrawingClearAll,
  textColor,
  textFontSize,
  onTextColorChange,
  onTextFontSizeChange,
  onZoomChange,
  onResetView,
  onFogReveal,
  onFogHide,
  gridVisible,
  onToggleGrid,
  areas = [],
  selectedAreaId,
  onCreateArea,
  onUpdateArea,
  onDeleteArea,
  onClearAllAreas,
  onSelectArea,
  pingType = 'normal',
  pingMessage = '',
  onPingTypeChange,
  onPingMessageChange,
}: MapSidePanelProps) {
  const [codeCopied, setCodeCopied] = useState(false);

  // Token selecionado
  const selectedToken = tokens.find(t => t.id === selectedTokenId) || null;

  // Jogadores com personagem
  const playersWithChar = members.filter(m => m.characters && m.role !== 'master');

  // Copiar código da sala
  const handleCopyCode = useCallback(() => {
    const shortCode = campaignId.slice(0, 8).toUpperCase();
    navigator.clipboard.writeText(shortCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }, [campaignId]);

  // Ações de transformação
  const handleRotate90 = useCallback(async () => {
    if (!selectedToken || !onTokenUpdate) return;
    await onTokenUpdate(selectedToken.id, { rotation: (selectedToken.rotation + 90) % 360 });
  }, [selectedToken, onTokenUpdate]);

  const handleToggleLock = useCallback(async () => {
    if (!selectedToken || !onTokenUpdate) return;
    await onTokenUpdate(selectedToken.id, { locked: !selectedToken.locked });
  }, [selectedToken, onTokenUpdate]);

  if (!open) return null;

  return (
    <motion.aside
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 350 }}
      className={cn(
        'fixed top-10 right-0 bottom-0 z-20',
        'w-[280px] max-w-[85vw]',
        'bg-card/95 backdrop-blur-md',
        'border-l border-amber-500/20',
        'flex flex-col',
        'shadow-2xl shadow-black/30',
      )}
    >
      {/* ===== CABEÇALHO ===== */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-amber-500/20 shrink-0 bg-gradient-to-r from-amber-500/5 to-transparent">
        <div className="flex-1 min-w-0">
          <h2 className="text-xs font-bold text-foreground truncate">
            {map?.name || 'Mapa Tático'}
          </h2>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-amber-400 transition-colors mt-0.5"
          >
            {codeCopied ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
            <span className="font-mono">{campaignId.slice(0, 8).toUpperCase()}</span>
          </button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onToggle}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* ===== CONTEÚDO COM SCROLL ===== */}
      <ScrollArea className="flex-1">
        <div className="py-1">

          {/* ——— FERRAMENTAS (modos) ——— */}
          <SideSection title="Ferramentas" icon={Wrench} defaultOpen={true}>
            <div className="space-y-2">
              {/* Botões de modo principal */}
              <div className="grid grid-cols-5 gap-1">
                {([
                  { id: 'select' as const, icon: MousePointer2, label: 'Selecionar (V)' },
                  { id: 'move' as const, icon: Move, label: 'Mover câmera (H)' },
                  { id: 'measure' as const, icon: Ruler, label: 'Medir distância (M)' },
                  { id: 'ping' as const, icon: Radio, label: 'Ping (P)' },
                ] as const).map(tool => {
                  const ToolIcon = tool.icon;
                  const isActive = activeTool === tool.id;
                  return (
                    <Tooltip key={tool.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isActive ? 'default' : 'ghost'}
                          size="icon"
                          className={cn('h-8 w-8', isActive && 'shadow-sm')}
                          onClick={() => onToolChange(tool.id)}
                        >
                          <ToolIcon className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{tool.label}</TooltipContent>
                    </Tooltip>
                  );
                })}
                {/* Toggle grid */}
                {onToggleGrid && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={gridVisible ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={onToggleGrid}
                      >
                        <Grid3X3 className={cn('h-3.5 w-3.5', !gridVisible && 'opacity-40')} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{gridVisible ? 'Ocultar grid (G)' : 'Mostrar grid (G)'}</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </SideSection>

          {/* ——— JOGADORES ——— */}
          <SideSection title="Jogadores" icon={Users} badge={playersWithChar.length} defaultOpen={true}>
            <div className="space-y-1">
              {playersWithChar.map(m => (
                <div key={m.id} className="flex items-center gap-2 py-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                  <span className="text-xs text-foreground truncate flex-1">
                    {m.characters?.name || 'Sem nome'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    NEX {m.characters?.nex || 0}%
                  </span>
                </div>
              ))}
              {playersWithChar.length === 0 && (
                <p className="text-[10px] text-muted-foreground italic">Nenhum jogador online</p>
              )}
            </div>
          </SideSection>

          {/* ——— TOKENS ——— */}
          {isMaster && map && (
            <SideSection title="Tokens" icon={Layers} badge={tokens.length} defaultOpen={true}>
              <div className="space-y-2">
                {/* Botões de criação */}
                <div className="flex gap-1.5">
                  {onTokenCreate && (
                    <CreateTokenDialog onCreateToken={onTokenCreate} mapId={map.id} />
                  )}
                </div>

                {/* Lista de tokens */}
                {tokens.length > 0 && (
                  <div className="space-y-0.5 max-h-40 overflow-y-auto">
                    {tokens.map(t => (
                      <div
                        key={t.id}
                        onClick={() => onTokenSelect(t.id === selectedTokenId ? null : t.id)}
                        className={cn(
                          'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-xs',
                          t.id === selectedTokenId
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'hover:bg-accent/30 text-foreground/80'
                        )}
                      >
                        <div
                          className="w-3 h-3 rounded-full shrink-0 border border-border/40"
                          style={{ backgroundColor: t.light_color || '#6b7280' }}
                        />
                        <span className="truncate flex-1">{t.name}</span>
                        {t.locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                        {onTokenDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTokenDelete(t.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SideSection>
          )}

          {/* ——— TRANSFORMAR (token selecionado) ——— */}
          {selectedToken && isMaster && (
            <SideSection title="Transformar" icon={RotateCw} defaultOpen={true}>
              <div className="flex gap-1.5 flex-wrap">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={selectedToken.locked ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleToggleLock}
                    >
                      {selectedToken.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{selectedToken.locked ? 'Destravar' : 'Travar'}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleRotate90}
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Girar 90°</TooltipContent>
                </Tooltip>

                {onTokenDelete && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onTokenDelete(selectedToken.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Deletar token</TooltipContent>
                  </Tooltip>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Selecionado: <span className="text-foreground">{selectedToken.name}</span>
              </p>
            </SideSection>
          )}

          {/* ——— DESENHO ——— */}
          <SideSection title="Desenho" icon={Pencil} defaultOpen={activeTool === 'draw'}>
            <div className="space-y-2">
              {/* Sub-ferramentas de desenho */}
              <div className="grid grid-cols-5 gap-1">
                {([
                  { id: 'pen' as const, icon: Pencil, label: 'Caneta' },
                  { id: 'line' as const, icon: Minus, label: 'Linha' },
                  { id: 'rect' as const, icon: Square, label: 'Retângulo' },
                  { id: 'circle' as const, icon: Circle, label: 'Círculo' },
                  { id: 'eraser' as const, icon: Eraser, label: 'Borracha' },
                ]).map(sub => {
                  const SubIcon = sub.icon;
                  const isActive = activeTool === 'draw' && drawTool === sub.id;
                  return (
                    <Tooltip key={sub.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isActive ? 'default' : 'ghost'}
                          size="icon"
                          className={cn('h-8 w-8', isActive && 'shadow-sm')}
                          onClick={() => {
                            onToolChange('draw');
                            onDrawToolChange(sub.id);
                          }}
                        >
                          <SubIcon className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{sub.label}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

              {/* Paleta de cores */}
              <div className="flex gap-1 flex-wrap">
                {DRAW_COLORS.map(c => (
                  <button
                    key={c}
                    className={cn(
                      'w-5 h-5 rounded-md border transition-all',
                      drawColor === c
                        ? 'border-foreground ring-1 ring-primary/50 scale-110'
                        : 'border-border/40 hover:scale-105'
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => onDrawColorChange(c)}
                  />
                ))}
              </div>

              {/* Espessura */}
              <div className="flex items-center gap-1">
                {[2, 4, 8].map(w => (
                  <button
                    key={w}
                    className={cn(
                      'flex-1 h-6 rounded text-[10px] font-medium transition-colors',
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

              {/* Undo / Redo / Limpar */}
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 flex-1" disabled={!canUndoDrawing} onClick={onDrawingUndo}>
                  <Undo2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 flex-1" disabled={!canRedoDrawing} onClick={onDrawingRedo}>
                  <Undo2 className="h-3.5 w-3.5 scale-x-[-1]" />
                </Button>
                {isMaster && onDrawingClearAll && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={onDrawingClearAll}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </SideSection>

          {/* ——— TEXTO ——— */}
          <SideSection title="Texto" icon={Type} defaultOpen={activeTool === 'text'}>
            <div className="space-y-2">
              <Button
                variant={activeTool === 'text' ? 'default' : 'outline'}
                size="sm"
                className="w-full h-8 text-xs gap-1.5"
                onClick={() => onToolChange('text')}
              >
                <Type className="h-3.5 w-3.5" />
                {activeTool === 'text' ? 'Modo texto ativo' : 'Ativar modo texto'}
              </Button>

              {/* Cores de texto */}
              <div className="flex gap-1 flex-wrap">
                {DRAW_COLORS.map(c => (
                  <button
                    key={c}
                    className={cn(
                      'w-5 h-5 rounded-md border transition-all',
                      textColor === c
                        ? 'border-foreground ring-1 ring-primary/50 scale-110'
                        : 'border-border/40 hover:scale-105'
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => onTextColorChange(c)}
                  />
                ))}
              </div>

              {/* Tamanho da fonte */}
              <div className="flex items-center gap-1">
                {[12, 16, 24, 36].map(s => (
                  <button
                    key={s}
                    className={cn(
                      'flex-1 h-6 rounded text-[10px] font-medium transition-colors',
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
            </div>
          </SideSection>

          {/* ——— ÁREAS DE EFEITO (Fase D) ——— */}
          {onCreateArea && (
            <SideSection title="Áreas de Efeito" icon={Target} defaultOpen={false} badge={areas.length > 0 ? areas.length : undefined}>
              <AreaEffectControls
                areas={areas}
                selectedAreaId={selectedAreaId || null}
                isMaster={isMaster}
                onCreateArea={onCreateArea}
                onUpdateArea={onUpdateArea || (async () => false)}
                onDeleteArea={onDeleteArea || (async () => false)}
                onClearAll={onClearAllAreas || (async () => false)}
                onSelectArea={onSelectArea || (() => {})}
              />
            </SideSection>
          )}

          {/* ——— NÉVOA DE GUERRA ——— */}
          {isMaster && (
            <SideSection title="Névoa de Guerra" icon={CloudFog} defaultOpen={false}>
              <div className="space-y-2">
                <Button
                  variant={activeTool === 'fog' ? 'default' : 'outline'}
                  size="sm"
                  className="w-full h-8 text-xs gap-1.5"
                  onClick={() => onToolChange(activeTool === 'fog' ? 'select' : 'fog')}
                >
                  <CloudFog className="h-3.5 w-3.5" />
                  {activeTool === 'fog' ? 'Névoa ativa' : 'Ativar névoa'}
                </Button>
                <p className="text-[10px] text-muted-foreground">
                  Clique nas células do mapa para revelar ou ocultar áreas.
                </p>
              </div>
            </SideSection>
          )}

          {/* ——— CONTROLES (zoom / reset) ——— */}
          <SideSection title="Controles" icon={Maximize2} defaultOpen={false}>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))}>
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <Badge variant="secondary" className="flex-1 justify-center text-xs h-7">
                  {Math.round(zoom * 100)}%
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onZoomChange(Math.min(5, zoom + 0.1))}>
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs gap-1.5"
                onClick={onResetView}
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Resetar Visualização
              </Button>
            </div>
          </SideSection>

        </div>
      </ScrollArea>
    </motion.aside>
  );
});

export default MapSidePanel;

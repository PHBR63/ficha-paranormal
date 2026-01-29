/**
 * TacticalBoard - Tabuleiro tático interativo para combate
 * 
 * Canvas 2D com suporte a:
 * - Mapas com grid (quadrado/hex)
 * - Tokens arrastáveis
 * - Régua de distância
 * - Fog of War (mestre)
 * - Ping e marcadores
 * - Zoom e pan
 * 
 * SEGURANÇA: URLs de imagem são validadas contra domínios permitidos
 * para prevenir pixel tracking e data exfiltration.
 */

import { useRef, useEffect, useState, useCallback, useMemo, MouseEvent as ReactMouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTacticalBoard, MapToken, TacticalMap } from '@/hooks/campaign/useTacticalBoard';
import { TacticalBoardKonva } from './TacticalBoardKonva';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
// ScrollArea removido - usando overflow nativo para evitar bug #185 com React 19
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { validateImageUrl } from '@/lib/security/urlValidator';
import { MapImageUploader } from './MapImageUploader';
import { toast } from 'sonner';
import {
  MousePointer2,
  Move,
  Ruler,
  Cloud,
  Target,
  Pencil,
  ZoomIn,
  ZoomOut,
  Maximize,
  Plus,
  Trash2,
  Map,
  Users,
  Skull,
  Box,
  Flag,
  Loader2,
  Upload,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  RotateCw,
  Image,
  X,
  AlertTriangle,
} from 'lucide-react';

interface TacticalBoardProps {
  campaignId: string;
  isMaster: boolean;
  members?: Array<{
    character_id: string | null;
    characters?: {
      id: string;
      name: string;
      photo_url: string | null;
    } | null;
  }>;
  // Board externo opcional para compartilhamento com combate
  externalBoard?: ReturnType<typeof useTacticalBoard>;
  // Props de integração com combate (Fase 7.2)
  combatMode?: boolean;
  currentTurnCombatantId?: string;
  movementRemaining?: number; // Movimento restante em metros
  onMovementPreview?: (fromCell: { x: number; y: number }, toCell: { x: number; y: number }, distance: number, isValid: boolean) => void;
  onMovementConfirm?: (tokenId: string, toX: number, toY: number, distance: number) => Promise<boolean>;
}

// Ícones por tipo de token
const TOKEN_ICONS: Record<string, typeof Users> = {
  pc: Users,
  npc: Users,
  creature: Skull,
  object: Box,
  marker: Flag,
};

export function TacticalBoard({ 
  campaignId, 
  isMaster, 
  members = [], 
  externalBoard,
  combatMode = false,
  currentTurnCombatantId,
  movementRemaining = 9,
  onMovementPreview,
  onMovementConfirm,
}: TacticalBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Usa board externo se fornecido, senão cria um novo
  // IMPORTANTE: enabled: !externalBoard evita dupla subscrição ao Realtime (bug #185)
  const internalBoard = useTacticalBoard({ campaignId, isMaster, enabled: !externalBoard });
  const board = externalBoard || internalBoard;
  
  // =====================================================
  // ESTABILIZAÇÃO DE CALLBACKS (Prevenção de loop #185)
  // =====================================================
  // Refs para callbacks do board (proteção adicional contra loops em componentes Radix)
  const setActiveMapRef = useRef(board.setActiveMap);
  const setActiveToolRef = useRef(board.setActiveTool);
  const setZoomRef = useRef(board.setZoom);
  const clearMeasureRef = useRef(board.clearMeasure);
  const fitToScreenRef = useRef(board.fitToScreen);
  
  // Atualiza refs quando callbacks mudam
  useEffect(() => { setActiveMapRef.current = board.setActiveMap; }, [board.setActiveMap]);
  useEffect(() => { setActiveToolRef.current = board.setActiveTool; }, [board.setActiveTool]);
  useEffect(() => { setZoomRef.current = board.setZoom; }, [board.setZoom]);
  useEffect(() => { clearMeasureRef.current = board.clearMeasure; }, [board.clearMeasure]);
  useEffect(() => { fitToScreenRef.current = board.fitToScreen; }, [board.fitToScreen]);
  
  // Handlers estáveis para componentes Radix (deps vazias = referência nunca muda)
  const handleSetActiveMap = useCallback((id: string) => {
    setActiveMapRef.current?.(id);
  }, []);
  
  const handleSetActiveTool = useCallback((tool: string) => {
    setActiveToolRef.current?.(tool as 'select' | 'move' | 'measure' | 'fog' | 'ping' | 'draw');
  }, []);
  
  const handleZoomIn = useCallback(() => {
    setZoomRef.current?.(Math.min(3, board.zoom + 0.25));
  }, [board.zoom]);
  
  const handleZoomOut = useCallback(() => {
    setZoomRef.current?.(Math.max(0.25, board.zoom - 0.25));
  }, [board.zoom]);
  
  const handleFitToScreen = useCallback(() => {
    fitToScreenRef.current?.();
  }, []);
  
  const handleToolClick = useCallback((toolId: string) => {
    handleSetActiveTool(toolId);
    if (toolId !== 'measure') clearMeasureRef.current?.();
  }, [handleSetActiveTool]);
  // Estados locais
  const [isDragging, setIsDragging] = useState(false);
  const [dragToken, setDragToken] = useState<MapToken | null>(null);
  const [dragStartCell, setDragStartCell] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [newMapName, setNewMapName] = useState('');
  const [newMapImageData, setNewMapImageData] = useState<{ file?: File; url?: string; previewUrl: string } | null>(null);
  const [isCreatingMap, setIsCreatingMap] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenType, setNewTokenType] = useState<'pc' | 'npc' | 'creature' | 'object' | 'marker'>('npc');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  
  // Handler estável para Select do Radix (evita loop #185)
  const handleNewTokenTypeChange = useCallback((value: string) => {
    setNewTokenType(value as 'pc' | 'npc' | 'creature' | 'object' | 'marker');
  }, []);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para preview de movimento (Fase 7.2)
  const [movementPreview, setMovementPreview] = useState<{
    distance: number;
    isValid: boolean;
    targetCell: { x: number; y: number };
  } | null>(null);

  // =====================================================
  // CARREGAR IMAGEM DE FUNDO
  // =====================================================

  useEffect(() => {
    if (!board.activeMap?.image_url) {
      setBackgroundImage(null);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setBackgroundImage(img);
    img.onerror = () => setBackgroundImage(null);
    img.src = board.activeMap.image_url;
  }, [board.activeMap?.image_url]);

  // =====================================================
  // RENDERING DO CANVAS
  // =====================================================

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !board.activeMap) return;

    // Limpa canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Aplica transformações de zoom/pan
    ctx.save();
    ctx.translate(board.panOffset.x, board.panOffset.y);
    ctx.scale(board.zoom, board.zoom);

    const map = board.activeMap;
    const gridSize = map.grid_size;
    const cols = map.width_cells || Math.ceil(canvas.width / board.zoom / gridSize);
    const rows = map.height_cells || Math.ceil(canvas.height / board.zoom / gridSize);
    const mapWidth = cols * gridSize;
    const mapHeight = rows * gridSize;

    // Desenha imagem de fundo (cobre todo o canvas do mapa)
    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, mapWidth, mapHeight);
    } else {
      // Fundo escuro padrão quando não há imagem
      ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
      ctx.fillRect(0, 0, mapWidth, mapHeight);
    }

    // Desenha grid sobre a imagem
    if (map.grid_visible) {
      ctx.strokeStyle = map.grid_color;
      ctx.lineWidth = 1;
      
      for (let x = 0; x <= cols; x++) {
        ctx.beginPath();
        ctx.moveTo(x * gridSize, 0);
        ctx.lineTo(x * gridSize, rows * gridSize);
        ctx.stroke();
      }
      
      for (let y = 0; y <= rows; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * gridSize);
        ctx.lineTo(cols * gridSize, y * gridSize);
        ctx.stroke();
      }
    }

    // Desenha Fog of War (células reveladas são claras, resto é escuro)
    if (isMaster && map.fog_of_war.length > 0) {
      ctx.fillStyle = 'rgba(0, 200, 100, 0.1)';
      map.fog_of_war.forEach(cell => {
        ctx.fillRect(cell.x * gridSize, cell.y * gridSize, gridSize, gridSize);
      });
    }

    // Desenha células destacadas (movimento, alcance)
    if (board.highlightedCells.length > 0) {
      board.highlightedCells.forEach(cell => {
        // Cores por tipo de highlight
        let fillColor = 'rgba(34, 197, 94, 0.25)'; // Verde para alcançável
        let borderColor = 'rgba(34, 197, 94, 0.6)';
        
        if (cell.type === 'unreachable') {
          fillColor = 'rgba(239, 68, 68, 0.15)'; // Vermelho translúcido
          borderColor = 'rgba(239, 68, 68, 0.4)';
        } else if (cell.type === 'target') {
          fillColor = 'rgba(251, 191, 36, 0.3)'; // Amarelo para alvo
          borderColor = 'rgba(251, 191, 36, 0.7)';
        } else if (cell.type === 'path') {
          fillColor = 'rgba(59, 130, 246, 0.3)'; // Azul para caminho
          borderColor = 'rgba(59, 130, 246, 0.7)';
        }
        
        // Preenche a célula
        ctx.fillStyle = fillColor;
        ctx.fillRect(cell.x * gridSize + 1, cell.y * gridSize + 1, gridSize - 2, gridSize - 2);
        
        // Borda da célula
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cell.x * gridSize + 1, cell.y * gridSize + 1, gridSize - 2, gridSize - 2);
      });
    }

    // Desenha tokens
    board.tokens.forEach(token => {
      const x = token.x * gridSize;
      const y = token.y * gridSize;
      const size = token.size * gridSize;
      
      // Cor base por tipo
      const colors: Record<string, string> = {
        pc: '#3b82f6',
        npc: '#22c55e',
        creature: '#ef4444',
        object: '#a855f7',
        marker: '#f59e0b',
      };
      
      // Círculo do token
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2 - 2, 0, Math.PI * 2);
      ctx.fillStyle = colors[token.token_type] || '#666';
      ctx.fill();
      
      // Borda
      ctx.strokeStyle = token.id === board.selectedTokenId ? '#fff' : 'rgba(0,0,0,0.5)';
      ctx.lineWidth = token.id === board.selectedTokenId ? 3 : 2;
      ctx.stroke();
      
      // Ícone de locked
      if (token.locked && isMaster) {
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.fillText('🔒', x + 2, y + 14);
      }
      
      // Condições
      if (token.conditions.length > 0) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(x + size - 6, y + 6, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(token.conditions.length.toString(), x + size - 6, y + 10);
      }
      
      // Raio de luz
      if (token.light_radius > 0) {
        const lightSize = token.light_radius * gridSize;
        const gradient = ctx.createRadialGradient(
          x + size / 2, y + size / 2, size / 2,
          x + size / 2, y + size / 2, lightSize
        );
        gradient.addColorStop(0, token.light_color + '40');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, lightSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Nome do token
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 3;
      ctx.fillText(token.name.substring(0, 8), x + size / 2, y + size + 12);
      ctx.shadowBlur = 0;
    });

    // Desenha régua de medição
    if (board.measureStart && board.measureEnd) {
      const start = board.cellToPixel(board.measureStart.x, board.measureStart.y);
      const end = board.cellToPixel(board.measureEnd.x, board.measureEnd.y);
      
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(start.x + gridSize / 2, start.y + gridSize / 2);
      ctx.lineTo(end.x + gridSize / 2, end.y + gridSize / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Distância
      const distance = board.calculateDistance(
        board.measureStart.x, board.measureStart.y,
        board.measureEnd.x, board.measureEnd.y
      );
      
      const midX = (start.x + end.x) / 2 + gridSize / 2;
      const midY = (start.y + end.y) / 2 + gridSize / 2;
      
      ctx.fillStyle = '#000';
      ctx.fillRect(midX - 25, midY - 12, 50, 20);
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${distance}m`, midX, midY + 4);
    }

    // Desenha preview de movimento (Fase 7.2 - Arrastar com validação)
    if (isDragging && dragToken && dragStartCell && combatMode) {
      const startPos = board.cellToPixel(dragStartCell.x, dragStartCell.y);
      const endPos = board.cellToPixel(dragToken.x, dragToken.y);
      
      const startCenterX = startPos.x + gridSize / 2;
      const startCenterY = startPos.y + gridSize / 2;
      const endCenterX = endPos.x + gridSize / 2;
      const endCenterY = endPos.y + gridSize / 2;
      
      // Calcula distância
      const distance = board.calculateDistance(
        dragStartCell.x, dragStartCell.y, 
        dragToken.x, dragToken.y
      );
      const isValid = distance <= movementRemaining;
      
      // Linha de trajetória
      ctx.beginPath();
      ctx.moveTo(startCenterX, startCenterY);
      ctx.lineTo(endCenterX, endCenterY);
      ctx.strokeStyle = isValid ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Círculo no destino
      ctx.beginPath();
      ctx.arc(endCenterX, endCenterY, gridSize / 2 - 4, 0, Math.PI * 2);
      ctx.strokeStyle = isValid ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Badge de distância
      if (distance > 0) {
        const midX = (startCenterX + endCenterX) / 2;
        const midY = (startCenterY + endCenterY) / 2;
        
        // Background do badge
        const badgeWidth = 60;
        const badgeHeight = 24;
        ctx.fillStyle = isValid ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)';
        ctx.beginPath();
        ctx.roundRect(midX - badgeWidth / 2, midY - badgeHeight / 2, badgeWidth, badgeHeight, 6);
        ctx.fill();
        
        // Texto
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${distance.toFixed(1)}m`, midX, midY);
      }
    }

    // Desenha pings
    board.pings.forEach(ping => {
      const pos = board.cellToPixel(ping.x, ping.y);
      const age = Date.now() - ping.createdAt;
      const scale = 1 + Math.sin(age / 100) * 0.2;
      const opacity = Math.max(0, 1 - age / 3000);
      
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(pos.x + gridSize / 2, pos.y + gridSize / 2);
      ctx.scale(scale, scale);
      
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.strokeStyle = ping.color;
      ctx.lineWidth = 3;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = ping.color;
      ctx.fill();
      
      ctx.restore();
    });

    ctx.restore();
  }, [board, isMaster, backgroundImage, isDragging, dragToken, dragStartCell, combatMode, movementRemaining]);

  // Re-render quando dados mudam
  // NOTA: Usamos refs para valores estáveis e evitamos objetos nas deps
  // para prevenir loops de re-render (bug #185)
  useEffect(() => {
    drawCanvas();
    // Deps simplificadas: apenas valores primitivos ou arrays/objects que realmente mudam
  }, [
    drawCanvas,
    board.tokens.length, // Primitivo: só re-renderiza quando quantidade muda
    board.activeMap?.id, // Primitivo: só re-renderiza quando mapa muda
    board.zoom,
    board.panOffset.x,
    board.panOffset.y,
    board.pings.length,
    board.measureStart?.x,
    board.measureStart?.y,
    board.measureEnd?.x,
    board.measureEnd?.y,
    board.selectedTokenId,
    board.highlightedCells.length,
    backgroundImage,
    isDragging,
    dragToken?.id,
    movementPreview?.distance,
  ]);

  // Ajusta tamanho do canvas
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const updateSize = () => {
      setCanvasSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // =====================================================
  // EVENT HANDLERS
  // =====================================================

  const getCanvasCoords = (e: ReactMouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - board.panOffset.x) / board.zoom,
      y: (e.clientY - rect.top - board.panOffset.y) / board.zoom,
    };
  };

  const handleMouseDown = (e: ReactMouseEvent) => {
    const coords = getCanvasCoords(e);
    const cell = board.pixelToCell(coords.x, coords.y);
    
    // Middle click ou Ctrl+click para pan
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - board.panOffset.x, y: e.clientY - board.panOffset.y });
      return;
    }
    
    // Ferramenta ativa
    switch (board.activeTool) {
      case 'select':
      case 'move':
        // Verifica se clicou em um token
        const clickedToken = board.tokens.find(t => {
          const tokenCell = { x: t.x, y: t.y };
          return cell.x >= tokenCell.x && cell.x < tokenCell.x + t.size &&
                 cell.y >= tokenCell.y && cell.y < tokenCell.y + t.size;
        });
        
        if (clickedToken) {
          board.selectToken(clickedToken.id);
          
          // Inicia drag se não estiver locked (ou se for mestre)
          if (!clickedToken.locked || isMaster) {
            setIsDragging(true);
            setDragToken(clickedToken);
            setDragStartCell({ x: clickedToken.x, y: clickedToken.y }); // Salva posição inicial
            setDragOffset({
              x: coords.x - clickedToken.x * (board.activeMap?.grid_size || 40),
              y: coords.y - clickedToken.y * (board.activeMap?.grid_size || 40),
            });
          }
        } else {
          board.selectToken(null);
        }
        break;
        
      case 'measure':
        board.startMeasure(cell.x, cell.y);
        break;
        
      case 'ping':
        board.sendPing(cell.x, cell.y, '#ff0000');
        break;
        
      case 'fog':
        if (isMaster) {
          // Toggle fog na célula
          const isRevealed = board.activeMap?.fog_of_war.some(
            f => f.x === cell.x && f.y === cell.y
          );
          if (isRevealed) {
            board.hideFog([cell]);
          } else {
            board.revealFog([cell]);
          }
        }
        break;
    }
  };

  const handleMouseMove = (e: ReactMouseEvent) => {
    if (isPanning) {
      board.setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }
    
    if (isDragging && dragToken) {
      const coords = getCanvasCoords(e);
      const gridSize = board.activeMap?.grid_size || 40;
      const newX = Math.round((coords.x - dragOffset.x) / gridSize);
      const newY = Math.round((coords.y - dragOffset.y) / gridSize);
      
      // Atualização visual imediata
      setDragToken(prev => prev ? { ...prev, x: newX, y: newY } : null);
      
      // Callback de preview para modo combate (Fase 7.2)
      if (combatMode && dragStartCell && onMovementPreview) {
        const distance = board.calculateDistance(dragStartCell.x, dragStartCell.y, newX, newY);
        const isValid = distance <= movementRemaining;
        onMovementPreview(dragStartCell, { x: newX, y: newY }, distance, isValid);
        setMovementPreview({ distance, isValid, targetCell: { x: newX, y: newY } });
      }
    }
    
    if (board.activeTool === 'measure' && board.measureStart) {
      const coords = getCanvasCoords(e);
      const cell = board.pixelToCell(coords.x, coords.y);
      board.endMeasure(cell.x, cell.y);
    }
  };

  const handleMouseUp = async () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    
    if (isDragging && dragToken) {
      // Modo combate: usa callback de confirmação com validação (Fase 7.2)
      if (combatMode && dragStartCell && onMovementConfirm) {
        const distance = board.calculateDistance(
          dragStartCell.x, dragStartCell.y, 
          dragToken.x, dragToken.y
        );
        const isValid = distance <= movementRemaining;
        
        if (isValid) {
          // Confirma movimento via callback
          const success = await onMovementConfirm(dragToken.id, dragToken.x, dragToken.y, distance);
          if (!success) {
            // Se falhou, reverte para posição original
            setDragToken(prev => prev ? { ...prev, x: dragStartCell.x, y: dragStartCell.y } : null);
          }
        } else {
          // Movimento inválido - reverte para posição original
          setDragToken(prev => prev ? { ...prev, x: dragStartCell.x, y: dragStartCell.y } : null);
        }
      } else {
        // Modo normal: move diretamente
        await board.moveToken(dragToken.id, dragToken.x, dragToken.y);
      }
      
      setIsDragging(false);
      setDragToken(null);
      setDragStartCell(null);
      setMovementPreview(null);
    }
    
    if (board.activeTool === 'measure') {
      // Mantém a medição visível
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.25, Math.min(3, board.zoom + delta));
    board.setZoom(newZoom);
  };

  // =====================================================
  // AÇÕES DA TOOLBAR
  // =====================================================

  const handleCreateMap = async () => {
    if (!newMapName || !newMapImageData) return;
    
    setIsCreatingMap(true);
    
    try {
      // Se for upload de arquivo, primeiro cria o mapa, depois faz upload
      if (newMapImageData.file) {
        // Cria mapa com URL temporária (será atualizada após upload)
        const newMap = await board.createMap({
          name: newMapName,
          image_url: '', // Temporário
          grid_size: 40,
        });
        
        if (newMap) {
          // Faz upload da imagem para o Storage
          const imageUrl = await board.uploadMapImage(newMap.id, newMapImageData.file);
          
          if (imageUrl) {
            // Ativa o mapa
            await board.setActiveMap(newMap.id);
          }
        }
      } else if (newMapImageData.url) {
        // Se for URL externa (já validada pelo MapImageUploader)
        const newMap = await board.createMap({
          name: newMapName,
          image_url: newMapImageData.url,
          grid_size: 40,
        });
        
        if (newMap) {
          await board.setActiveMap(newMap.id);
        }
      }
      
      // Limpa estados
      setShowMapDialog(false);
      setNewMapName('');
      setNewMapImageData(null);
      
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar mapa');
    } finally {
      setIsCreatingMap(false);
    }
  };

  const handleCreateToken = async () => {
    if (!newTokenName) return;
    
    // Posição no centro do viewport
    const centerX = Math.floor((canvasSize.width / 2 - board.panOffset.x) / board.zoom / (board.activeMap?.grid_size || 40));
    const centerY = Math.floor((canvasSize.height / 2 - board.panOffset.y) / board.zoom / (board.activeMap?.grid_size || 40));
    
    const member = members.find(m => m.character_id === selectedCharacterId);
    
    await board.createToken({
      name: newTokenName,
      token_type: newTokenType,
      character_id: selectedCharacterId,
      x: centerX,
      y: centerY,
      image_url: member?.characters?.photo_url || undefined,
    });
    
    setShowTokenDialog(false);
    setNewTokenName('');
    setNewTokenType('npc');
    setSelectedCharacterId(null);
  };

  // =====================================================
  // RENDER
  // =====================================================

  if (board.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se não há mapa ativo
  if (!board.activeMap) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 ordo-panel">
          <Map className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="font-display text-xl tracking-wider mb-2">TABULEIRO TÁTICO</h3>
          <p className="text-muted-foreground mb-6">
            {isMaster 
              ? 'Crie um mapa para começar a usar o tabuleiro tático.'
              : 'O mestre ainda não ativou nenhum mapa.'}
          </p>
          
          {isMaster && (
            <Button onClick={() => setShowMapDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Mapa
            </Button>
          )}
        </div>
        
        {/* Lista de mapas existentes (mestre) */}
        {isMaster && board.maps.length > 0 && (
          <div className="ordo-panel p-4">
            <h4 className="font-display text-sm tracking-wider text-primary mb-3">MAPAS DISPONÍVEIS</h4>
            <div className="space-y-2">
              {board.maps.map(map => (
                <div 
                  key={map.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Map className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{map.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Grid: {map.grid_size}px • {map.grid_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => board.setActiveMap(map.id)}
                    >
                      Ativar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => board.deleteMap(map.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Dialog criar mapa */}
        <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Mapa</DialogTitle>
            </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Nome do Mapa</label>
              <Input
                value={newMapName}
                onChange={(e) => setNewMapName(e.target.value)}
                placeholder="Ex: Sala do Ritual"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Imagem do Mapa</label>
              <MapImageUploader 
                onImageSelect={setNewMapImageData}
                isLoading={isCreatingMap}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMapDialog(false)} disabled={isCreatingMap}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateMap} 
              disabled={!newMapName || !newMapImageData || isCreatingMap}
            >
              {isCreatingMap ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Mapa'
              )}
            </Button>
          </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Seletor de mapa - usa handler estável para evitar loop #185 */}
          {isMaster && board.activeMap && board.maps.length > 0 && (
            <Select 
              value={board.activeMap?.id || ''} 
              onValueChange={handleSetActiveMap}
            >
              <SelectTrigger className="w-40">
                <Map className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {board.maps.map(map => (
                  <SelectItem key={map.id} value={map.id}>
                    {map.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* Ferramentas - usa handler estável para evitar loops */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            {[
              { id: 'select', icon: MousePointer2, label: 'Selecionar' },
              { id: 'move', icon: Move, label: 'Mover' },
              { id: 'measure', icon: Ruler, label: 'Medir' },
              { id: 'ping', icon: Target, label: 'Ping' },
              ...(isMaster ? [{ id: 'fog', icon: Cloud, label: 'Fog of War' }] : []),
            ].map(tool => (
              <Button
                key={tool.id}
                variant={board.activeTool === tool.id ? 'secondary' : 'ghost'}
                size="icon"
                className="w-8 h-8"
                onClick={() => handleToolClick(tool.id)}
                title={tool.label}
              >
                <tool.icon className="w-4 h-4" />
              </Button>
            ))}
          </div>
          
          {/* Zoom - usa handlers estáveis */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={handleZoomOut}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs font-medium w-12 text-center">
              {Math.round(board.zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={handleZoomIn}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={handleFitToScreen}
              title="Ajustar à tela"
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Ações do mestre */}
        {isMaster && (
          <div className="flex items-center gap-2">
            {/* Botão para upload de imagem de fundo */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              title="Adicionar imagem de fundo"
            >
              {isUploadingImage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Image className="w-4 h-4" />
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !board.activeMap) return;
                
                setIsUploadingImage(true);
                await board.uploadMapImage(board.activeMap.id, file);
                setIsUploadingImage(false);
                e.target.value = '';
              }}
            />
            {board.activeMap.image_url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => board.activeMap && board.removeMapImage(board.activeMap.id)}
                title="Remover imagem de fundo"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTokenDialog(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Token
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMapDialog(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Mapa
            </Button>
          </div>
        )}
      </div>
      
      {/* Canvas Konva - Nova implementação */}
      <div 
        ref={containerRef}
        className="relative ordo-panel overflow-hidden"
        style={{ height: '500px' }}
      >
        <TacticalBoardKonva
          map={board.activeMap}
          tokens={isDragging && dragToken 
            ? board.tokens.map(t => t.id === dragToken.id ? dragToken : t) 
            : board.tokens
          }
          pings={board.pings}
          highlightedCells={board.highlightedCells}
          selectedTokenId={board.selectedTokenId}
          measureStart={board.measureStart}
          measureEnd={board.measureEnd}
          calculateDistance={board.calculateDistance}
          activeTool={board.activeTool}
          isMaster={isMaster}
          width={canvasSize.width}
          height={canvasSize.height}
          onTokenSelect={board.selectToken}
          onTokenMove={async (tokenId, x, y) => {
            // Modo combate: usa callback de confirmação com validação
            if (combatMode && dragStartCell && onMovementConfirm) {
              const distance = board.calculateDistance(dragStartCell.x, dragStartCell.y, x, y);
              const isValid = distance <= movementRemaining;
              
              if (isValid) {
                const success = await onMovementConfirm(tokenId, x, y, distance);
                return success;
              }
              return false;
            }
            
            // Modo normal: move diretamente
            return await board.moveToken(tokenId, x, y);
          }}
          onTokenDoubleClick={(token) => {
            // Poderia abrir um modal de edição do token
            console.log('Double click on token:', token.name);
          }}
          onMeasureStart={(x, y) => board.startMeasure(x, y)}
          onMeasureEnd={(x, y) => board.endMeasure(x, y)}
          onPing={(x, y) => board.sendPing(x, y, '#ff0000')}
          onFogToggle={(cells) => {
            if (!isMaster || !board.activeMap) return;
            // Toggle fog na célula
            const cell = cells[0];
            const isRevealed = board.activeMap.fog_of_war.some(
              f => f.x === cell.x && f.y === cell.y
            );
            if (isRevealed) {
              board.hideFog([cell]);
            } else {
              board.revealFog([cell]);
            }
          }}
          combatMode={combatMode}
          movementRemaining={movementRemaining}
          onMovementPreview={onMovementPreview}
        />
        
        {/* Info do token selecionado */}
        <AnimatePresence>
          {board.selectedTokenId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-4 right-4 bg-card/95 border border-border rounded-lg p-3"
            >
              {(() => {
                const token = board.tokens.find(t => t.id === board.selectedTokenId);
                if (!token) return null;
                const TokenIcon = TOKEN_ICONS[token.token_type] || Users;
                
                return (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        {token.image_url ? (
                          <img src={token.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <TokenIcon className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{token.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {token.token_type} • Posição: ({token.x}, {token.y})
                        </p>
                      </div>
                      {token.conditions.length > 0 && (
                        <div className="flex gap-1">
                          {token.conditions.map((cond, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{cond}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {isMaster && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => board.updateToken(token.id, { locked: !token.locked })}
                          title={token.locked ? 'Desbloquear' : 'Bloquear'}
                        >
                          {token.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => board.updateToken(token.id, { 
                            layer: token.layer === 'hidden' ? 'token' : 'hidden' 
                          })}
                          title={token.layer === 'hidden' ? 'Mostrar' : 'Esconder'}
                        >
                          {token.layer === 'hidden' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => board.deleteToken(token.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Instruções da ferramenta */}
        <div className="absolute top-2 left-2 bg-card/80 rounded px-2 py-1">
          <p className="text-xs text-muted-foreground">
            {board.activeTool === 'select' && 'Clique para selecionar tokens'}
            {board.activeTool === 'move' && 'Arraste tokens para mover'}
            {board.activeTool === 'measure' && 'Clique e arraste para medir distância'}
            {board.activeTool === 'ping' && 'Clique para enviar ping'}
            {board.activeTool === 'fog' && 'Clique para revelar/esconder células'}
            {' • Ctrl+Arraste para pan • Scroll para zoom'}
          </p>
        </div>
      </div>
      
      {/* Dialog criar token */}
      <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Token</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={newTokenName}
                onChange={(e) => setNewTokenName(e.target.value)}
                placeholder="Nome do token"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select value={newTokenType} onValueChange={handleNewTokenTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pc">Jogador (PC)</SelectItem>
                  <SelectItem value="npc">NPC</SelectItem>
                  <SelectItem value="creature">Criatura</SelectItem>
                  <SelectItem value="object">Objeto</SelectItem>
                  <SelectItem value="marker">Marcador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Vincular a personagem (para PCs) */}
            {newTokenType === 'pc' && members.length > 0 && (
              <div>
                <label className="text-sm font-medium">Vincular a Personagem</label>
                <Select value={selectedCharacterId || ''} onValueChange={setSelectedCharacterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {members.filter(m => m.characters).map(m => (
                      <SelectItem key={m.character_id} value={m.character_id || ''}>
                        {m.characters?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTokenDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateToken} disabled={!newTokenName}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog criar mapa */}
      <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar Novo Mapa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Nome do Mapa</label>
              <Input
                value={newMapName}
                onChange={(e) => setNewMapName(e.target.value)}
                placeholder="Ex: Sala do Ritual"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Imagem do Mapa</label>
              <MapImageUploader 
                onImageSelect={setNewMapImageData}
                isLoading={isCreatingMap}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMapDialog(false)} disabled={isCreatingMap}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateMap} 
              disabled={!newMapName || !newMapImageData || isCreatingMap}
            >
              {isCreatingMap ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Mapa'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

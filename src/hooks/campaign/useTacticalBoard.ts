/**
 * useTacticalBoard - Hook para gerenciamento do tabuleiro tático
 * 
 * Controla mapas, tokens, movimento, grid e sincronização em tempo real.
 * 
 * IMPORTANTE: Todas as funções usam toastRef para evitar re-criação
 * de callbacks quando useToast retorna nova referência (bug #185).
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { MapDrawing } from '@/components/campaign/tactical/layers/DrawingLayer';
import type { MapText } from '@/components/campaign/tactical/layers/TextLayer';

// Tipos de token
export type TokenType = 'pc' | 'npc' | 'creature' | 'object' | 'marker';
export type TokenLayer = 'token' | 'gm' | 'hidden';
export type GridType = 'square' | 'hex' | 'none';

// Interface para mapa
export interface TacticalMap {
  id: string;
  campaign_id: string;
  name: string;
  image_url: string;
  grid_size: number;
  grid_type: GridType;
  width_cells: number | null;
  height_cells: number | null;
  is_active: boolean;
  fog_of_war: { x: number; y: number }[];
  grid_color: string;
  grid_visible: boolean;
  created_at: string;
}

// Interface para token
export interface MapToken {
  id: string;
  map_id: string;
  character_id: string | null;
  name: string;
  token_type: TokenType;
  image_url: string | null;
  x: number;
  y: number;
  size: number;
  rotation: number;
  layer: TokenLayer;
  conditions: string[];
  light_radius: number;
  light_color: string;
  visible_to: string[] | null;
  locked: boolean;
  notes: string | null;
}

// Interface para ping/marcador temporário
export interface BoardPing {
  id: string;
  x: number;
  y: number;
  color: string;
  createdAt: number;
}

// Props do hook
export interface UseTacticalBoardProps {
  campaignId: string;
  isMaster: boolean;
  enabled?: boolean; // Flag para desativar subscrições (evita dupla instância #185)
}

// Célula destacada para visualização de movimento
export interface HighlightedCell {
  x: number;
  y: number;
  type: 'reachable' | 'unreachable' | 'target' | 'path';
}

// Retorno do hook
export interface TacticalBoardReturn {
  // Estado
  maps: TacticalMap[];
  activeMap: TacticalMap | null;
  tokens: MapToken[];
  selectedTokenId: string | null;
  isLoading: boolean;
  pings: BoardPing[];
  highlightedCells: HighlightedCell[];
  
  // Configurações do viewport
  zoom: number;
  panOffset: { x: number; y: number };
  
  // Tool state
  activeTool: 'select' | 'move' | 'measure' | 'fog' | 'ping' | 'draw' | 'text';
  measureStart: { x: number; y: number } | null;
  measureEnd: { x: number; y: number } | null;
  
  // Ações de mapa
  loadMaps: () => Promise<void>;
  createMap: (data: Partial<TacticalMap>) => Promise<TacticalMap | null>;
  updateMap: (mapId: string, data: Partial<TacticalMap>) => Promise<boolean>;
  deleteMap: (mapId: string) => Promise<boolean>;
  setActiveMap: (mapId: string) => Promise<boolean>;
  uploadMapImage: (mapId: string, file: File) => Promise<string | null>;
  removeMapImage: (mapId: string) => Promise<boolean>;
  
  // Ações de token
  createToken: (data: Partial<MapToken>) => Promise<MapToken | null>;
  updateToken: (tokenId: string, data: Partial<MapToken>) => Promise<boolean>;
  moveToken: (tokenId: string, x: number, y: number) => Promise<boolean>;
  deleteToken: (tokenId: string) => Promise<boolean>;
  selectToken: (tokenId: string | null) => void;
  
  // Ações de viewport
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  fitToScreen: () => void;
  
  // Ações de ferramentas
  setActiveTool: (tool: 'select' | 'move' | 'measure' | 'fog' | 'ping' | 'draw' | 'text') => void;
  startMeasure: (x: number, y: number) => void;
  endMeasure: (x: number, y: number) => void;
  clearMeasure: () => void;
  sendPing: (x: number, y: number, color?: string) => void;
  
  // Fog of War
  revealFog: (cells: { x: number; y: number }[]) => Promise<boolean>;
  hideFog: (cells: { x: number; y: number }[]) => Promise<boolean>;
  
  // Highlight de células (movimento, alcance, etc.)
  setHighlightedCells: (cells: HighlightedCell[]) => void;
  clearHighlightedCells: () => void;
  
  // Desenhos e textos
  drawings: MapDrawing[];
  texts: MapText[];
  createDrawing: (data: Omit<MapDrawing, 'id' | 'map_id' | 'created_by' | 'created_at'>) => Promise<void>;
  deleteDrawing: (drawingId: string) => Promise<void>;
  clearAllDrawings: () => Promise<void>;
  undoDrawing: () => Promise<void>;
  redoDrawing: () => Promise<void>;
  canUndoDrawing: boolean;
  canRedoDrawing: boolean;
  createText: (data: Omit<MapText, 'id' | 'map_id' | 'created_by' | 'created_at'>) => Promise<void>;
  updateText: (textId: string, data: Partial<MapText>) => Promise<void>;
  deleteText: (textId: string) => Promise<void>;
  
  // Utilidades
  pixelToCell: (px: number, py: number) => { x: number; y: number };
  cellToPixel: (cx: number, cy: number) => { x: number; y: number };
  calculateDistance: (x1: number, y1: number, x2: number, y2: number) => number;
}

export function useTacticalBoard({
  campaignId,
  isMaster,
  enabled = true,
}: UseTacticalBoardProps): TacticalBoardReturn {
  const { toast } = useToast();
  
  // CRÍTICO: Estabiliza toast via ref para não recriar callbacks
  // Isso evita loops de render (bug #185)
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);
  
  // Refs para valores usados em callbacks (evita dependências instáveis)
  const isMasterRef = useRef(isMaster);
  useEffect(() => {
    isMasterRef.current = isMaster;
  }, [isMaster]);
  
  // Estado principal
  const [maps, setMaps] = useState<TacticalMap[]>([]);
  const [activeMap, setActiveMapState] = useState<TacticalMap | null>(null);
  const [tokens, setTokens] = useState<MapToken[]>([]);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pings, setPings] = useState<BoardPing[]>([]);
  
  // Viewport
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  
  // Ferramentas
  const [activeTool, setActiveTool] = useState<'select' | 'move' | 'measure' | 'fog' | 'ping' | 'draw' | 'text'>('select');
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measureEnd, setMeasureEnd] = useState<{ x: number; y: number } | null>(null);
  
  // Células destacadas (movimento, alcance)
  const [highlightedCells, setHighlightedCellsState] = useState<HighlightedCell[]>([]);
  
  // Desenhos e textos no mapa
  const [drawings, setDrawings] = useState<MapDrawing[]>([]);
  const [texts, setTexts] = useState<MapText[]>([]);
  
  // Pilha de Undo/Redo para desenhos
  const [drawingUndoStack, setDrawingUndoStack] = useState<MapDrawing[]>([]);
  const [drawingRedoStack, setDrawingRedoStack] = useState<MapDrawing[]>([]);
  
  // Ref para cleanup de pings
  const pingTimeoutRef = useRef<NodeJS.Timeout[]>([]);

  // =====================================================
  // CARREGAMENTO E REALTIME
  // =====================================================

  // loadTokens deve ser definido primeiro pois loadMaps depende dele
  const loadTokens = useCallback(async (mapId: string) => {
    if (!mapId) return;
    try {
      const { data, error } = await supabase
        .from('map_tokens')
        .select('*')
        .eq('map_id', mapId);
      
      if (error) throw error;
      
      const typedTokens = (data || []).map(t => ({
        ...t,
        conditions: Array.isArray(t.conditions) ? t.conditions : [],
        token_type: t.token_type as TokenType,
        layer: t.layer as TokenLayer,
      })) as MapToken[];
      
      setTokens(typedTokens);
    } catch (error: any) {
      console.error('Erro ao carregar tokens:', error);
    }
  }, []);

  const loadMaps = useCallback(async () => {
    if (!campaignId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('campaign_maps')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const typedMaps = (data || []).map(m => ({
        ...m,
        fog_of_war: (Array.isArray(m.fog_of_war) ? m.fog_of_war : []) as { x: number; y: number }[],
        grid_type: m.grid_type as GridType,
      }));
      
      setMaps(typedMaps as TacticalMap[]);
      
      // Define mapa ativo
      const active = typedMaps.find(m => m.is_active);
      if (active) {
        setActiveMapState(active as TacticalMap);
        loadTokens(active.id);
      } else {
        setActiveMapState(null);
        setTokens([]);
      }
    } catch (error: any) {
      toastRef.current?.({
        title: 'Erro ao carregar mapas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, loadTokens]);

  // Subscribe para updates em tempo real (só se enabled)
  useEffect(() => {
    if (!campaignId || !enabled) return;
    
    // Carrega mapas iniciais
    loadMaps();
    
    // Subscribe para mapas - nome estável para evitar re-subscriptions
    const mapsChannel = supabase
      .channel(`tactical-maps-${campaignId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'campaign_maps',
        filter: `campaign_id=eq.${campaignId}`,
      }, () => {
        loadMaps();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(mapsChannel);
    };
  }, [campaignId, enabled, loadMaps]);

  // Subscribe para tokens do mapa ativo (só se enabled)
  useEffect(() => {
    if (!activeMap?.id || !enabled) return;
    
    const mapId = activeMap.id;
    
    const tokensChannel = supabase
      .channel(`tactical-tokens-${mapId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'map_tokens',
        filter: `map_id=eq.${mapId}`,
      }, () => {
        loadTokens(mapId);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(tokensChannel);
    };
  }, [activeMap?.id, enabled, loadTokens]);

  // Cleanup pings
  useEffect(() => {
    return () => {
      pingTimeoutRef.current.forEach(clearTimeout);
    };
  }, []);

  // =====================================================
  // CARREGAMENTO DE DESENHOS E TEXTOS
  // =====================================================

  const loadDrawings = useCallback(async (mapId: string) => {
    if (!mapId) return;
    try {
      const { data, error } = await supabase
        .from('map_drawings')
        .select('*')
        .eq('map_id', mapId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setDrawings((data || []) as MapDrawing[]);
    } catch (err: any) {
      console.error('Erro ao carregar desenhos:', err);
    }
  }, []);

  const loadTexts = useCallback(async (mapId: string) => {
    if (!mapId) return;
    try {
      const { data, error } = await supabase
        .from('map_texts')
        .select('*')
        .eq('map_id', mapId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setTexts((data || []) as MapText[]);
    } catch (err: any) {
      console.error('Erro ao carregar textos:', err);
    }
  }, []);

  // Carrega desenhos/textos quando mapa ativo muda e reseta undo/redo
  useEffect(() => {
    if (!activeMap?.id || !enabled) return;
    loadDrawings(activeMap.id);
    loadTexts(activeMap.id);
    setDrawingUndoStack([]);
    setDrawingRedoStack([]);
  }, [activeMap?.id, enabled, loadDrawings, loadTexts]);

  // Realtime otimista para desenhos e textos
  // Em vez de recarregar tudo do banco, aplica mudanças localmente
  useEffect(() => {
    if (!activeMap?.id || !enabled) return;
    const mapId = activeMap.id;

    const drawingsChannel = supabase
      .channel(`tactical-drawings-${mapId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'map_drawings',
        filter: `map_id=eq.${mapId}`,
      }, (payload) => {
        // Adiciona localmente se não existir (evita duplicatas do otimismo)
        const newDrawing = payload.new as MapDrawing;
        setDrawings(prev => {
          if (prev.some(d => d.id === newDrawing.id)) return prev;
          return [...prev, newDrawing];
        });
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'map_drawings',
        filter: `map_id=eq.${mapId}`,
      }, (payload) => {
        const oldId = (payload.old as any).id;
        setDrawings(prev => prev.filter(d => d.id !== oldId));
      })
      .subscribe();

    const textsChannel = supabase
      .channel(`tactical-texts-${mapId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'map_texts',
        filter: `map_id=eq.${mapId}`,
      }, (payload) => {
        const newText = payload.new as MapText;
        setTexts(prev => {
          if (prev.some(t => t.id === newText.id)) return prev;
          return [...prev, newText];
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'map_texts',
        filter: `map_id=eq.${mapId}`,
      }, (payload) => {
        const updated = payload.new as MapText;
        setTexts(prev => prev.map(t => t.id === updated.id ? updated : t));
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'map_texts',
        filter: `map_id=eq.${mapId}`,
      }, (payload) => {
        const oldId = (payload.old as any).id;
        setTexts(prev => prev.filter(t => t.id !== oldId));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(drawingsChannel);
      supabase.removeChannel(textsChannel);
    };
  }, [activeMap?.id, enabled]);

  // =====================================================
  // AÇÕES DE MAPA (todas usam refs para estabilidade)
  // =====================================================

  const createMap = useCallback(async (data: Partial<TacticalMap>): Promise<TacticalMap | null> => {
    if (!isMasterRef.current) return null;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      
      const { data: newMap, error } = await supabase
        .from('campaign_maps')
        .insert({
          campaign_id: campaignId,
          name: data.name || 'Novo Mapa',
          image_url: data.image_url || '',
          grid_size: data.grid_size || 40,
          grid_type: data.grid_type || 'square',
          width_cells: data.width_cells,
          height_cells: data.height_cells,
          grid_color: data.grid_color || 'rgba(255,255,255,0.2)',
          grid_visible: data.grid_visible ?? true,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toastRef.current?.({ title: 'Mapa criado', description: data.name });
      return {
        ...newMap,
        fog_of_war: [],
        grid_type: newMap.grid_type as GridType,
      } as TacticalMap;
    } catch (error: any) {
      toastRef.current?.({
        title: 'Erro ao criar mapa',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  }, [campaignId]);

  const updateMap = useCallback(async (mapId: string, data: Partial<TacticalMap>): Promise<boolean> => {
    if (!isMasterRef.current) return false;
    
    try {
      const { error } = await supabase
        .from('campaign_maps')
        .update(data)
        .eq('id', mapId);
      
      if (error) throw error;
      return true;
    } catch (error: any) {
      toastRef.current?.({
        title: 'Erro ao atualizar mapa',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, []);

  const deleteMap = useCallback(async (mapId: string): Promise<boolean> => {
    if (!isMasterRef.current) return false;
    
    try {
      const { error } = await supabase
        .from('campaign_maps')
        .delete()
        .eq('id', mapId);
      
      if (error) throw error;
      
      toastRef.current?.({ title: 'Mapa excluído' });
      return true;
    } catch (error: any) {
      toastRef.current?.({
        title: 'Erro ao excluir mapa',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, []);

  const setActiveMap = useCallback(async (mapId: string): Promise<boolean> => {
    if (!isMasterRef.current) return false;
    
    try {
      // Desativa todos os mapas
      await supabase
        .from('campaign_maps')
        .update({ is_active: false })
        .eq('campaign_id', campaignId);
      
      // Ativa o mapa selecionado
      const { error } = await supabase
        .from('campaign_maps')
        .update({ is_active: true })
        .eq('id', mapId);
      
      if (error) throw error;
      
      // O Realtime vai atualizar o estado automaticamente
      toastRef.current?.({ title: 'Mapa ativado' });
      return true;
    } catch (error: any) {
      toastRef.current?.({
        title: 'Erro ao ativar mapa',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [campaignId]);

  // =====================================================
  // UPLOAD DE IMAGEM DO MAPA
  // =====================================================

  const uploadMapImage = useCallback(async (mapId: string, file: File): Promise<string | null> => {
    if (!isMasterRef.current) return null;
    
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filePath = `${campaignId}/${mapId}.${fileExt}`;
      
      // Remove arquivo antigo se existir
      await supabase.storage
        .from('campaign-maps')
        .remove([filePath]);
      
      // Upload do novo arquivo
      const { error: uploadError } = await supabase.storage
        .from('campaign-maps')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });
      
      if (uploadError) throw uploadError;
      
      // Obtém URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('campaign-maps')
        .getPublicUrl(filePath);
      
      // Atualiza o mapa com a nova URL
      const success = await updateMap(mapId, { image_url: publicUrl });
      if (!success) throw new Error('Falha ao atualizar mapa');
      
      toastRef.current?.({ title: 'Imagem carregada', description: 'O fundo do mapa foi atualizado.' });
      return publicUrl;
    } catch (error: any) {
      toastRef.current?.({
        title: 'Erro ao carregar imagem',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  }, [campaignId, updateMap]);

  const removeMapImage = useCallback(async (mapId: string): Promise<boolean> => {
    if (!isMasterRef.current) return false;
    
    try {
      // Busca o mapa atual para obter a URL
      const map = maps.find(m => m.id === mapId);
      if (map?.image_url) {
        const urlParts = map.image_url.split('/campaign-maps/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage.from('campaign-maps').remove([filePath]);
        }
      }
      
      const success = await updateMap(mapId, { image_url: '' });
      if (success) {
        toastRef.current?.({ title: 'Imagem removida' });
      }
      return success;
    } catch (error: any) {
      toastRef.current?.({
        title: 'Erro ao remover imagem',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [maps, updateMap]);

  // =====================================================
  // AÇÕES DE TOKEN
  // =====================================================

  const createToken = useCallback(async (data: Partial<MapToken>): Promise<MapToken | null> => {
    if (!isMasterRef.current || !activeMap) return null;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      
      const { data: newToken, error } = await supabase
        .from('map_tokens')
        .insert({
          map_id: activeMap.id,
          character_id: data.character_id || null,
          name: data.name || 'Token',
          token_type: data.token_type || 'npc',
          image_url: data.image_url,
          x: data.x || 0,
          y: data.y || 0,
          size: data.size || 1,
          rotation: data.rotation || 0,
          layer: data.layer || 'token',
          conditions: data.conditions || [],
          light_radius: data.light_radius || 0,
          light_color: data.light_color || '#ffff00',
          visible_to: data.visible_to,
          locked: data.locked || false,
          notes: data.notes,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return newToken as MapToken;
    } catch (error: any) {
      toastRef.current?.({
        title: 'Erro ao criar token',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  }, [activeMap]);

  const updateToken = useCallback(async (tokenId: string, data: Partial<MapToken>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('map_tokens')
        .update(data)
        .eq('id', tokenId);
      
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar token:', error);
      return false;
    }
  }, []);

  const moveToken = useCallback(async (tokenId: string, x: number, y: number): Promise<boolean> => {
    // Atualização otimista
    setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, x, y } : t));
    
    const success = await updateToken(tokenId, { x, y });
    if (!success && activeMap) {
      // Reverte se falhar
      loadTokens(activeMap.id);
    }
    return success;
  }, [activeMap, updateToken, loadTokens]);

  const deleteToken = useCallback(async (tokenId: string): Promise<boolean> => {
    if (!isMasterRef.current) return false;
    
    try {
      const { error } = await supabase
        .from('map_tokens')
        .delete()
        .eq('id', tokenId);
      
      if (error) throw error;
      
      setSelectedTokenId(null);
      return true;
    } catch (error: any) {
      toastRef.current?.({
        title: 'Erro ao excluir token',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, []);

  const selectToken = useCallback((tokenId: string | null) => {
    setSelectedTokenId(tokenId);
  }, []);

  // =====================================================
  // AÇÕES DE VIEWPORT
  // =====================================================

  const fitToScreen = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // =====================================================
  // AÇÕES DE FERRAMENTAS
  // =====================================================

  const startMeasure = useCallback((x: number, y: number) => {
    setMeasureStart({ x, y });
    setMeasureEnd(null);
  }, []);

  const endMeasure = useCallback((x: number, y: number) => {
    setMeasureEnd({ x, y });
  }, []);

  const clearMeasure = useCallback(() => {
    setMeasureStart(null);
    setMeasureEnd(null);
  }, []);

  const sendPing = useCallback((x: number, y: number, color: string = '#ff0000') => {
    const pingId = `ping-${Date.now()}`;
    const ping: BoardPing = { id: pingId, x, y, color, createdAt: Date.now() };
    
    setPings(prev => [...prev, ping]);
    
    // Remove ping após 3 segundos
    const timeout = setTimeout(() => {
      setPings(prev => prev.filter(p => p.id !== pingId));
    }, 3000);
    
    pingTimeoutRef.current.push(timeout);
  }, []);

  // =====================================================
  // FOG OF WAR
  // =====================================================

  const revealFog = useCallback(async (cells: { x: number; y: number }[]): Promise<boolean> => {
    if (!isMasterRef.current || !activeMap) return false;
    
    const currentFog = activeMap.fog_of_war || [];
    const newFog = [...currentFog];
    
    cells.forEach(cell => {
      if (!newFog.some(f => f.x === cell.x && f.y === cell.y)) {
        newFog.push(cell);
      }
    });
    
    return updateMap(activeMap.id, { fog_of_war: newFog } as any);
  }, [activeMap, updateMap]);

  const hideFog = useCallback(async (cells: { x: number; y: number }[]): Promise<boolean> => {
    if (!isMasterRef.current || !activeMap) return false;
    
    const currentFog = activeMap.fog_of_war || [];
    const newFog = currentFog.filter(f => 
      !cells.some(c => c.x === f.x && c.y === f.y)
    );
    
    return updateMap(activeMap.id, { fog_of_war: newFog } as any);
  }, [activeMap, updateMap]);

  // =====================================================
  // UTILIDADES
  // =====================================================

  const pixelToCell = useCallback((px: number, py: number): { x: number; y: number } => {
    const gridSize = activeMap?.grid_size || 40;
    return {
      x: Math.floor(px / gridSize),
      y: Math.floor(py / gridSize),
    };
  }, [activeMap?.grid_size]);

  const cellToPixel = useCallback((cx: number, cy: number): { x: number; y: number } => {
    const gridSize = activeMap?.grid_size || 40;
    return {
      x: cx * gridSize,
      y: cy * gridSize,
    };
  }, [activeMap?.grid_size]);

  const calculateDistance = useCallback((x1: number, y1: number, x2: number, y2: number): number => {
    // Distância em células, convertida para metros (1.5m por célula)
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    
    // Diagonal: usa a maior distância + metade da menor (aproximação D&D 5e)
    const distance = Math.max(dx, dy) + Math.floor(Math.min(dx, dy) / 2);
    return distance * 1.5; // metros
  }, []);

  // =====================================================
  // CRUD DE DESENHOS E TEXTOS
  // =====================================================

  const createDrawing = useCallback(async (data: Omit<MapDrawing, 'id' | 'map_id' | 'created_by' | 'created_at'>) => {
    if (!activeMap?.id) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Insert otimista: gera ID temporário para preview imediato
      const { data: inserted, error } = await supabase.from('map_drawings').insert({
        map_id: activeMap.id,
        created_by: user.id,
        tool: data.tool,
        points: data.points as any,
        color: data.color,
        stroke_width: data.stroke_width,
        opacity: data.opacity,
      }).select().single();
      if (error) throw error;
      
      // Adiciona à pilha de undo e limpa redo
      if (inserted) {
        const drawing = inserted as MapDrawing;
        // O Realtime otimista já adiciona ao estado, mas garantimos aqui
        setDrawings(prev => {
          if (prev.some(d => d.id === drawing.id)) return prev;
          return [...prev, drawing];
        });
        setDrawingUndoStack(prev => [...prev, drawing]);
        setDrawingRedoStack([]); // Limpa redo ao criar novo desenho
      }
    } catch (err: any) {
      console.error('Erro ao criar desenho:', err);
    }
  }, [activeMap?.id]);

  /** Desfaz o último desenho criado pelo usuário */
  const undoDrawing = useCallback(async () => {
    if (drawingUndoStack.length === 0) return;
    const lastDrawing = drawingUndoStack[drawingUndoStack.length - 1];
    
    // Remove otimisticamente do estado local
    setDrawings(prev => prev.filter(d => d.id !== lastDrawing.id));
    setDrawingUndoStack(prev => prev.slice(0, -1));
    setDrawingRedoStack(prev => [...prev, lastDrawing]);
    
    // Remove do banco
    try {
      const { error } = await supabase.from('map_drawings').delete().eq('id', lastDrawing.id);
      if (error) throw error;
    } catch (err: any) {
      // Reverte se falhar
      console.error('Erro ao desfazer desenho:', err);
      setDrawings(prev => [...prev, lastDrawing]);
      setDrawingUndoStack(prev => [...prev, lastDrawing]);
      setDrawingRedoStack(prev => prev.filter(d => d.id !== lastDrawing.id));
    }
  }, [drawingUndoStack]);

  /** Refaz o último desenho desfeito */
  const redoDrawing = useCallback(async () => {
    if (drawingRedoStack.length === 0 || !activeMap?.id) return;
    const drawing = drawingRedoStack[drawingRedoStack.length - 1];
    
    // Adiciona otimisticamente ao estado local
    setDrawings(prev => [...prev, drawing]);
    setDrawingRedoStack(prev => prev.slice(0, -1));
    setDrawingUndoStack(prev => [...prev, drawing]);
    
    // Re-insere no banco
    try {
      const { error } = await supabase.from('map_drawings').insert({
        map_id: drawing.map_id,
        created_by: drawing.created_by,
        tool: drawing.tool,
        points: drawing.points as any,
        color: drawing.color,
        stroke_width: drawing.stroke_width,
        opacity: drawing.opacity,
      });
      if (error) throw error;
    } catch (err: any) {
      // Reverte se falhar
      console.error('Erro ao refazer desenho:', err);
      setDrawings(prev => prev.filter(d => d.id !== drawing.id));
      setDrawingUndoStack(prev => prev.slice(0, -1));
      setDrawingRedoStack(prev => [...prev, drawing]);
    }
  }, [drawingRedoStack, activeMap?.id]);

  const deleteDrawing = useCallback(async (drawingId: string) => {
    // Remove otimisticamente
    setDrawings(prev => prev.filter(d => d.id !== drawingId));
    try {
      const { error } = await supabase.from('map_drawings').delete().eq('id', drawingId);
      if (error) throw error;
    } catch (err: any) {
      console.error('Erro ao deletar desenho:', err);
      // Recarrega em caso de falha
      if (activeMap?.id) loadDrawings(activeMap.id);
    }
  }, [activeMap?.id, loadDrawings]);

  const clearAllDrawings = useCallback(async () => {
    if (!activeMap?.id || !isMasterRef.current) return;
    // Remove otimisticamente
    const previousDrawings = [...drawings];
    setDrawings([]);
    setDrawingUndoStack([]);
    setDrawingRedoStack([]);
    try {
      const { error } = await supabase.from('map_drawings').delete().eq('map_id', activeMap.id);
      if (error) throw error;
      toastRef.current?.({ title: 'Desenhos limpos' });
    } catch (err: any) {
      console.error('Erro ao limpar desenhos:', err);
      setDrawings(previousDrawings); // Reverte
    }
  }, [activeMap?.id, drawings]);

  const createText = useCallback(async (data: Omit<MapText, 'id' | 'map_id' | 'created_by' | 'created_at'>) => {
    if (!activeMap?.id) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('map_texts').insert({
        map_id: activeMap.id,
        created_by: user.id,
        text: data.text,
        x: data.x,
        y: data.y,
        font_size: data.font_size,
        color: data.color,
        rotation: data.rotation,
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Erro ao criar texto:', err);
    }
  }, [activeMap?.id]);

  const updateText = useCallback(async (textId: string, data: Partial<MapText>) => {
    try {
      const { error } = await supabase.from('map_texts').update(data).eq('id', textId);
      if (error) throw error;
    } catch (err: any) {
      console.error('Erro ao atualizar texto:', err);
    }
  }, []);

  const deleteText = useCallback(async (textId: string) => {
    try {
      const { error } = await supabase.from('map_texts').delete().eq('id', textId);
      if (error) throw error;
    } catch (err: any) {
      console.error('Erro ao deletar texto:', err);
    }
  }, []);

  // =====================================================
  // MEMOIZAÇÃO DO RETORNO (CRÍTICO para evitar loop #185)
  // =====================================================
  
  return useMemo(() => ({
    maps,
    activeMap,
    tokens,
    selectedTokenId,
    isLoading,
    pings,
    zoom,
    panOffset,
    activeTool,
    measureStart,
    measureEnd,
    highlightedCells,
    drawings,
    texts,
    loadMaps,
    createMap,
    updateMap,
    deleteMap,
    setActiveMap,
    uploadMapImage,
    removeMapImage,
    createToken,
    updateToken,
    moveToken,
    deleteToken,
    selectToken,
    setZoom,
    setPanOffset,
    fitToScreen,
    setActiveTool,
    startMeasure,
    endMeasure,
    clearMeasure,
    sendPing,
    revealFog,
    hideFog,
    setHighlightedCells: setHighlightedCellsState,
    clearHighlightedCells: () => setHighlightedCellsState([]),
    createDrawing,
    deleteDrawing,
    clearAllDrawings,
    undoDrawing,
    redoDrawing,
    canUndoDrawing: drawingUndoStack.length > 0,
    canRedoDrawing: drawingRedoStack.length > 0,
    createText,
    updateText,
    deleteText,
    pixelToCell,
    cellToPixel,
    calculateDistance,
  }), [
    maps, activeMap, tokens, selectedTokenId, isLoading, pings,
    zoom, panOffset, activeTool, measureStart, measureEnd, highlightedCells,
    drawings, texts, drawingUndoStack.length, drawingRedoStack.length,
    loadMaps, createMap, updateMap, deleteMap, setActiveMap, uploadMapImage, removeMapImage,
    createToken, updateToken, moveToken, deleteToken, selectToken,
    setZoom, setPanOffset, fitToScreen, setActiveTool,
    startMeasure, endMeasure, clearMeasure, sendPing,
    revealFog, hideFog, setHighlightedCellsState,
    createDrawing, deleteDrawing, clearAllDrawings, undoDrawing, redoDrawing,
    createText, updateText, deleteText,
    pixelToCell, cellToPixel, calculateDistance,
  ]);
}

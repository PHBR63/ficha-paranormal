/**
 * useTacticalBoard - Hook para gerenciamento do tabuleiro tático
 * 
 * Controla mapas, tokens, movimento, grid e sincronização em tempo real.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  activeTool: 'select' | 'move' | 'measure' | 'fog' | 'ping' | 'draw';
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
  setActiveTool: (tool: 'select' | 'move' | 'measure' | 'fog' | 'ping' | 'draw') => void;
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
  
  // Utilidades
  pixelToCell: (px: number, py: number) => { x: number; y: number };
  cellToPixel: (cx: number, cy: number) => { x: number; y: number };
  calculateDistance: (x1: number, y1: number, x2: number, y2: number) => number;
}

export function useTacticalBoard({
  campaignId,
  isMaster,
  enabled = true, // Por padrão ativo; quando externalBoard existe, passa false
}: UseTacticalBoardProps): TacticalBoardReturn {
  const { toast } = useToast();
  
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
  const [activeTool, setActiveTool] = useState<'select' | 'move' | 'measure' | 'fog' | 'ping' | 'draw'>('select');
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measureEnd, setMeasureEnd] = useState<{ x: number; y: number } | null>(null);
  
  // Células destacadas (movimento, alcance)
  const [highlightedCells, setHighlightedCellsState] = useState<HighlightedCell[]>([]);
  
  // Ref para cleanup de pings
  const pingTimeoutRef = useRef<NodeJS.Timeout[]>([]);

  // =====================================================
  // CARREGAMENTO E REALTIME
  // =====================================================

  const loadMaps = useCallback(async () => {
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
        await loadTokens(active.id);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar mapas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, toast]);

  const loadTokens = useCallback(async (mapId: string) => {
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

  // Subscribe para updates em tempo real (só se enabled)
  useEffect(() => {
    if (!campaignId || !enabled) return;
    
    loadMaps();
    
    // Subscribe para mapas
    const mapsChannel = supabase
      .channel(`maps-${campaignId}-${Date.now()}`)
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
  }, [campaignId, loadMaps, enabled]);

  // Subscribe para tokens do mapa ativo (só se enabled)
  useEffect(() => {
    if (!activeMap || !enabled) return;
    
    const tokensChannel = supabase
      .channel(`tokens-${activeMap.id}-${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'map_tokens',
        filter: `map_id=eq.${activeMap.id}`,
      }, () => {
        loadTokens(activeMap.id);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(tokensChannel);
    };
  }, [activeMap, loadTokens, enabled]);

  // Cleanup pings
  useEffect(() => {
    return () => {
      pingTimeoutRef.current.forEach(clearTimeout);
    };
  }, []);

  // =====================================================
  // AÇÕES DE MAPA
  // =====================================================

  const createMap = useCallback(async (data: Partial<TacticalMap>): Promise<TacticalMap | null> => {
    if (!isMaster) return null;
    
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
      
      toast({ title: 'Mapa criado', description: data.name });
      return {
        ...newMap,
        fog_of_war: [],
        grid_type: newMap.grid_type as GridType,
      } as TacticalMap;
    } catch (error: any) {
      toast({
        title: 'Erro ao criar mapa',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  }, [campaignId, isMaster, toast]);

  const updateMap = useCallback(async (mapId: string, data: Partial<TacticalMap>): Promise<boolean> => {
    if (!isMaster) return false;
    
    try {
      const { error } = await supabase
        .from('campaign_maps')
        .update(data)
        .eq('id', mapId);
      
      if (error) throw error;
      return true;
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar mapa',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [isMaster, toast]);

  const deleteMap = useCallback(async (mapId: string): Promise<boolean> => {
    if (!isMaster) return false;
    
    try {
      const { error } = await supabase
        .from('campaign_maps')
        .delete()
        .eq('id', mapId);
      
      if (error) throw error;
      
      toast({ title: 'Mapa excluído' });
      return true;
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir mapa',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [isMaster, toast]);

  const setActiveMap = useCallback(async (mapId: string): Promise<boolean> => {
    if (!isMaster) return false;
    
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
      
      const map = maps.find(m => m.id === mapId);
      if (map) {
        setActiveMapState({ ...map, is_active: true } as TacticalMap);
        await loadTokens(mapId);
      }
      
      toast({ title: 'Mapa ativado' });
      return true;
    } catch (error: any) {
      toast({
        title: 'Erro ao ativar mapa',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [campaignId, isMaster, maps, loadTokens, toast]);

  // =====================================================
  // UPLOAD DE IMAGEM DO MAPA
  // =====================================================

  const uploadMapImage = useCallback(async (mapId: string, file: File): Promise<string | null> => {
    if (!isMaster) return null;
    
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
      
      toast({ title: 'Imagem carregada', description: 'O fundo do mapa foi atualizado.' });
      return publicUrl;
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar imagem',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  }, [campaignId, isMaster, updateMap, toast]);

  const removeMapImage = useCallback(async (mapId: string): Promise<boolean> => {
    if (!isMaster) return false;
    
    try {
      const map = maps.find(m => m.id === mapId);
      if (map?.image_url) {
        // Extrai o path do arquivo da URL
        const urlParts = map.image_url.split('/campaign-maps/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage.from('campaign-maps').remove([filePath]);
        }
      }
      
      // Limpa a URL no banco
      const success = await updateMap(mapId, { image_url: '' });
      if (success) {
        toast({ title: 'Imagem removida' });
      }
      return success;
    } catch (error: any) {
      toast({
        title: 'Erro ao remover imagem',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [isMaster, maps, updateMap, toast]);

  // =====================================================
  // AÇÕES DE TOKEN
  // =====================================================

  const createToken = useCallback(async (data: Partial<MapToken>): Promise<MapToken | null> => {
    if (!isMaster || !activeMap) return null;
    
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
      toast({
        title: 'Erro ao criar token',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  }, [activeMap, isMaster, toast]);

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
    if (!success) {
      // Reverte se falhar
      loadTokens(activeMap?.id || '');
    }
    return success;
  }, [activeMap, updateToken, loadTokens]);

  const deleteToken = useCallback(async (tokenId: string): Promise<boolean> => {
    if (!isMaster) return false;
    
    try {
      const { error } = await supabase
        .from('map_tokens')
        .delete()
        .eq('id', tokenId);
      
      if (error) throw error;
      
      setSelectedTokenId(null);
      return true;
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir token',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [isMaster, toast]);

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
    if (!isMaster || !activeMap) return false;
    
    const currentFog = activeMap.fog_of_war || [];
    const newFog = [...currentFog];
    
    cells.forEach(cell => {
      if (!newFog.some(f => f.x === cell.x && f.y === cell.y)) {
        newFog.push(cell);
      }
    });
    
    return updateMap(activeMap.id, { fog_of_war: newFog } as any);
  }, [activeMap, isMaster, updateMap]);

  const hideFog = useCallback(async (cells: { x: number; y: number }[]): Promise<boolean> => {
    if (!isMaster || !activeMap) return false;
    
    const currentFog = activeMap.fog_of_war || [];
    const newFog = currentFog.filter(f => 
      !cells.some(c => c.x === f.x && c.y === f.y)
    );
    
    return updateMap(activeMap.id, { fog_of_war: newFog } as any);
  }, [activeMap, isMaster, updateMap]);

  // =====================================================
  // UTILIDADES
  // =====================================================

  const pixelToCell = useCallback((px: number, py: number): { x: number; y: number } => {
    const gridSize = activeMap?.grid_size || 40;
    return {
      x: Math.floor(px / gridSize),
      y: Math.floor(py / gridSize),
    };
  }, [activeMap]);

  const cellToPixel = useCallback((cx: number, cy: number): { x: number; y: number } => {
    const gridSize = activeMap?.grid_size || 40;
    return {
      x: cx * gridSize,
      y: cy * gridSize,
    };
  }, [activeMap]);

  const calculateDistance = useCallback((x1: number, y1: number, x2: number, y2: number): number => {
    // Distância em células, convertida para metros (1.5m por célula)
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    
    // Diagonal: usa a maior distância + metade da menor (aproximação D&D 5e)
    const distance = Math.max(dx, dy) + Math.floor(Math.min(dx, dy) / 2);
    return distance * 1.5; // metros
  }, []);

  return {
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
    pixelToCell,
    cellToPixel,
    calculateDistance,
  };
}

/**
 * useMapPins - Hook para notas e handouts ancorados no mapa (Fase F)
 * 
 * Gerencia CRUD de pins com realtime otimista via Supabase.
 * Suporta dois tipos: 'note' (texto livre) e 'handout' (referência a handout).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Tipo do pin no mapa
export interface MapPin {
  id: string;
  map_id: string;
  created_by: string;
  x: number;
  y: number;
  pin_type: 'note' | 'handout';
  title: string;
  content: string | null;
  handout_id: string | null;
  icon: string;
  color: string;
  visibility: 'all' | 'master';
  created_at: string;
  updated_at: string;
}

// Dados para criar um pin
export interface CreateMapPinData {
  x: number;
  y: number;
  pin_type?: 'note' | 'handout';
  title: string;
  content?: string;
  handout_id?: string;
  icon?: string;
  color?: string;
  visibility?: 'all' | 'master';
}

interface UseMapPinsProps {
  mapId: string | null;
  enabled?: boolean;
}

interface UseMapPinsReturn {
  /** Lista de pins no mapa */
  pins: MapPin[];
  /** Carregando */
  loading: boolean;
  /** Pin selecionado para visualização */
  selectedPinId: string | null;
  /** Seleciona um pin */
  selectPin: (pinId: string | null) => void;
  /** Cria um novo pin */
  createPin: (data: CreateMapPinData) => Promise<MapPin | null>;
  /** Atualiza um pin */
  updatePin: (pinId: string, data: Partial<CreateMapPinData>) => Promise<boolean>;
  /** Deleta um pin */
  deletePin: (pinId: string) => Promise<boolean>;
  /** Move um pin para nova posição */
  movePin: (pinId: string, newX: number, newY: number) => Promise<boolean>;
}

export function useMapPins({
  mapId,
  enabled = true,
}: UseMapPinsProps): UseMapPinsReturn {
  const [pins, setPins] = useState<MapPin[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const mapIdRef = useRef(mapId);

  useEffect(() => { mapIdRef.current = mapId; }, [mapId]);

  // Carrega pins do banco
  useEffect(() => {
    if (!mapId || !enabled) {
      setPins([]);
      return;
    }

    setLoading(true);

    const fetchPins = async () => {
      const { data, error } = await supabase
        .from('map_pins')
        .select('*')
        .eq('map_id', mapId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setPins(data as unknown as MapPin[]);
      }
      setLoading(false);
    };

    fetchPins();
  }, [mapId, enabled]);

  // Realtime - escuta mudanças
  useEffect(() => {
    if (!mapId || !enabled) return;

    const channel = supabase
      .channel(`map-pins-${mapId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'map_pins',
        filter: `map_id=eq.${mapId}`,
      }, (payload) => {
        const newPin = payload.new as unknown as MapPin;
        setPins(prev => {
          if (prev.some(p => p.id === newPin.id)) return prev;
          return [...prev, newPin];
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'map_pins',
        filter: `map_id=eq.${mapId}`,
      }, (payload) => {
        const updated = payload.new as unknown as MapPin;
        setPins(prev => prev.map(p => p.id === updated.id ? updated : p));
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'map_pins',
        filter: `map_id=eq.${mapId}`,
      }, (payload) => {
        const deleted = payload.old as { id: string };
        setPins(prev => prev.filter(p => p.id !== deleted.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mapId, enabled]);

  // Cria um pin
  const createPin = useCallback(async (data: CreateMapPinData): Promise<MapPin | null> => {
    if (!mapIdRef.current) return null;

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    const insertData = {
      map_id: mapIdRef.current,
      created_by: user.user.id,
      x: data.x,
      y: data.y,
      pin_type: data.pin_type || 'note',
      title: data.title,
      content: data.content || null,
      handout_id: data.handout_id || null,
      icon: data.icon || '📌',
      color: data.color || '#fbbf24',
      visibility: data.visibility || 'all',
    };

    const { data: result, error } = await supabase
      .from('map_pins')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[useMapPins] Erro ao criar pin:', error);
      return null;
    }

    return result as unknown as MapPin;
  }, []);

  // Atualiza um pin
  const updatePin = useCallback(async (pinId: string, data: Partial<CreateMapPinData>): Promise<boolean> => {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.x !== undefined) updateData.x = data.x;
    if (data.y !== undefined) updateData.y = data.y;

    // Otimista
    setPins(prev => prev.map(p => p.id === pinId ? { ...p, ...updateData } as MapPin : p));

    const { error } = await supabase
      .from('map_pins')
      .update(updateData)
      .eq('id', pinId);

    if (error) {
      console.error('[useMapPins] Erro ao atualizar pin:', error);
      return false;
    }

    return true;
  }, []);

  // Deleta um pin
  const deletePin = useCallback(async (pinId: string): Promise<boolean> => {
    // Otimista
    setPins(prev => prev.filter(p => p.id !== pinId));
    if (selectedPinId === pinId) setSelectedPinId(null);

    const { error } = await supabase
      .from('map_pins')
      .delete()
      .eq('id', pinId);

    if (error) {
      console.error('[useMapPins] Erro ao deletar pin:', error);
      return false;
    }

    return true;
  }, [selectedPinId]);

  // Move um pin
  const movePin = useCallback(async (pinId: string, newX: number, newY: number): Promise<boolean> => {
    return updatePin(pinId, { x: newX, y: newY });
  }, [updatePin]);

  const selectPin = useCallback((pinId: string | null) => {
    setSelectedPinId(pinId);
  }, []);

  return {
    pins,
    loading,
    selectedPinId,
    selectPin,
    createPin,
    updatePin,
    deletePin,
    movePin,
  };
}

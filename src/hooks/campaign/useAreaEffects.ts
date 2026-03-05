/**
 * useAreaEffects - Hook para gerenciar áreas de efeito no mapa tático (Fase D)
 * 
 * CRUD + Realtime otimista para templates de área (cone, círculo, linha, quadrado).
 * Segue o padrão Ref-First para estabilidade de callbacks.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { MapAreaEffect } from '@/components/campaign/tactical/layers/AreaEffectLayer';

// Dados para criar uma área
export interface CreateAreaEffectData {
  shape_type: MapAreaEffect['shape_type'];
  origin_x: number;
  origin_y: number;
  radius?: number;
  angle?: number;
  rotation?: number;
  side_length?: number;
  line_length?: number;
  color?: string;
  border_color?: string;
  opacity?: number;
  label?: string | null;
  element?: string | null;
  visibility?: 'all' | 'master';
}

interface UseAreaEffectsProps {
  mapId: string | null;
  enabled?: boolean;
}

interface UseAreaEffectsReturn {
  /** Lista de áreas de efeito */
  areas: MapAreaEffect[];
  /** Área selecionada */
  selectedAreaId: string | null;
  /** Cria nova área */
  createArea: (data: CreateAreaEffectData) => Promise<MapAreaEffect | null>;
  /** Atualiza área existente */
  updateArea: (areaId: string, data: Partial<CreateAreaEffectData>) => Promise<boolean>;
  /** Move área para nova posição (em células) */
  moveArea: (areaId: string, newX: number, newY: number) => Promise<boolean>;
  /** Remove área */
  deleteArea: (areaId: string) => Promise<boolean>;
  /** Remove todas as áreas do mapa */
  clearAllAreas: () => Promise<boolean>;
  /** Seleciona/deseleciona área */
  selectArea: (areaId: string | null) => void;
}

export function useAreaEffects({ mapId, enabled = true }: UseAreaEffectsProps): UseAreaEffectsReturn {
  const { toast } = useToast();
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  const [areas, setAreas] = useState<MapAreaEffect[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  // Carrega áreas do mapa
  const loadAreas = useCallback(async () => {
    if (!mapId) return;
    try {
      const { data, error } = await supabase
        .from('map_area_effects')
        .select('*')
        .eq('map_id', mapId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setAreas((data || []) as MapAreaEffect[]);
    } catch (err: any) {
      console.error('Erro ao carregar áreas de efeito:', err);
    }
  }, [mapId]);

  // Carregamento inicial + realtime otimista
  useEffect(() => {
    if (!mapId || !enabled) return;
    loadAreas();

    const channel = supabase
      .channel(`area-effects-${mapId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'map_area_effects',
        filter: `map_id=eq.${mapId}`,
      }, (payload) => {
        const newArea = payload.new as MapAreaEffect;
        setAreas(prev => {
          if (prev.some(a => a.id === newArea.id)) return prev;
          return [...prev, newArea];
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'map_area_effects',
        filter: `map_id=eq.${mapId}`,
      }, (payload) => {
        const updated = payload.new as MapAreaEffect;
        setAreas(prev => prev.map(a => a.id === updated.id ? updated : a));
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'map_area_effects',
        filter: `map_id=eq.${mapId}`,
      }, (payload) => {
        const oldId = (payload.old as any).id;
        setAreas(prev => prev.filter(a => a.id !== oldId));
        // Deseleciona se era a selecionada
        setSelectedAreaId(prev => prev === oldId ? null : prev);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mapId, enabled, loadAreas]);

  // Cria nova área de efeito
  const createArea = useCallback(async (data: CreateAreaEffectData): Promise<MapAreaEffect | null> => {
    if (!mapId) return null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data: newArea, error } = await supabase
        .from('map_area_effects')
        .insert({
          map_id: mapId,
          created_by: user.id,
          shape_type: data.shape_type,
          origin_x: data.origin_x,
          origin_y: data.origin_y,
          radius: data.radius ?? 3,
          angle: data.angle ?? 90,
          rotation: data.rotation ?? 0,
          side_length: data.side_length ?? 3,
          line_length: data.line_length ?? 6,
          color: data.color ?? '#ff000080',
          border_color: data.border_color ?? '#ff0000',
          opacity: data.opacity ?? 0.35,
          label: data.label ?? null,
          element: data.element ?? null,
          visibility: data.visibility ?? 'all',
        })
        .select()
        .single();

      if (error) throw error;

      toastRef.current?.({ title: 'Área de efeito criada' });
      return newArea as MapAreaEffect;
    } catch (err: any) {
      console.error('Erro ao criar área de efeito:', err);
      toastRef.current?.({
        title: 'Erro ao criar área',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }
  }, [mapId]);

  // Atualiza área
  const updateArea = useCallback(async (areaId: string, data: Partial<CreateAreaEffectData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('map_area_effects')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', areaId);
      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Erro ao atualizar área:', err);
      return false;
    }
  }, []);

  // Move área para nova posição
  const moveArea = useCallback(async (areaId: string, newX: number, newY: number): Promise<boolean> => {
    // Otimismo local
    setAreas(prev => prev.map(a => a.id === areaId ? { ...a, origin_x: newX, origin_y: newY } : a));
    try {
      const { error } = await supabase
        .from('map_area_effects')
        .update({ origin_x: newX, origin_y: newY, updated_at: new Date().toISOString() })
        .eq('id', areaId);
      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Erro ao mover área:', err);
      loadAreas(); // Rollback
      return false;
    }
  }, [loadAreas]);

  // Remove área
  const deleteArea = useCallback(async (areaId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('map_area_effects')
        .delete()
        .eq('id', areaId);
      if (error) throw error;
      toastRef.current?.({ title: 'Área removida' });
      return true;
    } catch (err: any) {
      console.error('Erro ao remover área:', err);
      toastRef.current?.({
        title: 'Erro ao remover área',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    }
  }, []);

  // Limpa todas as áreas do mapa
  const clearAllAreas = useCallback(async (): Promise<boolean> => {
    if (!mapId) return false;
    try {
      const { error } = await supabase
        .from('map_area_effects')
        .delete()
        .eq('map_id', mapId);
      if (error) throw error;
      toastRef.current?.({ title: 'Todas as áreas removidas' });
      return true;
    } catch (err: any) {
      console.error('Erro ao limpar áreas:', err);
      return false;
    }
  }, [mapId]);

  const selectArea = useCallback((areaId: string | null) => {
    setSelectedAreaId(areaId);
  }, []);

  return {
    areas,
    selectedAreaId,
    createArea,
    updateArea,
    moveArea,
    deleteArea,
    clearAllAreas,
    selectArea,
  };
}

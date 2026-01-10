/**
 * Hook para gerenciar o sistema de áudio da campanha
 * Controla playlists, SFX, cenas sonoras e sincronização em tempo real
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Tipos para o sistema de áudio
export interface CampaignAudio {
  id: string;
  campaign_id: string;
  name: string;
  audio_url: string;
  audio_type: 'ambient' | 'music' | 'sfx';
  duration_seconds: number | null;
  tags: string[];
  is_looping: boolean;
  volume: number;
  created_by: string;
  created_at: string;
}

export interface SoundScene {
  id: string;
  campaign_id: string;
  name: string;
  description: string | null;
  icon: string;
  tracks: TrackConfig[];
  master_volume: number;
  created_by: string;
}

export interface TrackConfig {
  audio_id: string;
  volume: number;
  fade_in_seconds: number;
}

export interface PlayingTrack {
  audio_id: string;
  volume: number;
  position: number;
  is_playing: boolean;
}

export interface AudioState {
  id: string;
  campaign_id: string;
  current_scene_id: string | null;
  playing_tracks: PlayingTrack[];
  master_volume: number;
  is_muted: boolean;
  updated_at: string;
  updated_by: string;
}

// SFX predefinidos (locais, não precisam de upload)
export const PRESET_SFX = [
  { id: 'door', name: 'Porta', icon: '🚪', url: '/sfx/door.mp3' },
  { id: 'footsteps', name: 'Passos', icon: '👣', url: '/sfx/footsteps.mp3' },
  { id: 'static', name: 'Estática', icon: '📻', url: '/sfx/static.mp3' },
  { id: 'whisper', name: 'Sussurro', icon: '💀', url: '/sfx/whisper.mp3' },
  { id: 'gunshot', name: 'Tiro', icon: '🔫', url: '/sfx/gunshot.mp3' },
  { id: 'thunder', name: 'Trovão', icon: '⚡', url: '/sfx/thunder.mp3' },
  { id: 'dog', name: 'Latido', icon: '🐕', url: '/sfx/dog.mp3' },
  { id: 'engine', name: 'Motor', icon: '🚗', url: '/sfx/engine.mp3' },
];

export function useCampaignAudio(campaignId: string, isMaster: boolean) {
  const { user } = useAuth();
  
  // Estado local
  const [audioLibrary, setAudioLibrary] = useState<CampaignAudio[]>([]);
  const [soundScenes, setSoundScenes] = useState<SoundScene[]>([]);
  const [audioState, setAudioState] = useState<AudioState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Referências para os elementos de áudio
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const masterVolumeRef = useRef(1.0);

  // Carregar biblioteca de áudio
  const loadAudioLibrary = useCallback(async () => {
    const { data, error } = await supabase
      .from('campaign_audio')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('audio_type', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao carregar biblioteca de áudio:', error);
      return;
    }

    setAudioLibrary((data || []).map(audio => ({
      ...audio,
      audio_type: audio.audio_type as 'ambient' | 'music' | 'sfx',
      tags: audio.tags || [],
      volume: Number(audio.volume) || 1.0
    })));
  }, [campaignId]);

  // Carregar cenas sonoras
  const loadSoundScenes = useCallback(async () => {
    const { data, error } = await supabase
      .from('campaign_sound_scenes')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao carregar cenas sonoras:', error);
      return;
    }

    setSoundScenes((data || []).map(scene => ({
      ...scene,
      tracks: (scene.tracks as unknown as TrackConfig[]) || [],
      master_volume: Number(scene.master_volume) || 1.0
    })));
  }, [campaignId]);

  // Carregar estado atual do áudio
  const loadAudioState = useCallback(async () => {
    const { data, error } = await supabase
      .from('campaign_audio_state')
      .select('*')
      .eq('campaign_id', campaignId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao carregar estado do áudio:', error);
      return;
    }

    if (data) {
      setAudioState({
        ...data,
        playing_tracks: (data.playing_tracks as unknown as PlayingTrack[]) || [],
        master_volume: Number(data.master_volume) || 1.0
      });
    }
  }, [campaignId]);

  // Atualizar estado do áudio no banco
  const updateAudioState = useCallback(async (newState: Partial<Omit<AudioState, 'playing_tracks'> & { playing_tracks?: PlayingTrack[] }>) => {
    if (!isMaster || !user) return;

    const stateToSave: any = {
      campaign_id: campaignId,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };

    // Copiar campos do newState
    if (newState.current_scene_id !== undefined) stateToSave.current_scene_id = newState.current_scene_id;
    if (newState.master_volume !== undefined) stateToSave.master_volume = newState.master_volume;
    if (newState.is_muted !== undefined) stateToSave.is_muted = newState.is_muted;
    if (newState.playing_tracks !== undefined) stateToSave.playing_tracks = newState.playing_tracks;

    const { error } = await supabase
      .from('campaign_audio_state')
      .upsert(stateToSave, { onConflict: 'campaign_id' });

    if (error) {
      console.error('Erro ao atualizar estado do áudio:', error);
      toast.error('Erro ao sincronizar áudio');
    }
  }, [campaignId, isMaster, user]);

  // Reproduzir um áudio
  const playAudio = useCallback(async (audioId: string, volume = 1.0) => {
    const audio = audioLibrary.find(a => a.id === audioId);
    if (!audio) return;

    // Criar ou obter elemento de áudio
    let audioElement = audioRefs.current.get(audioId);
    if (!audioElement) {
      audioElement = new Audio(audio.audio_url);
      audioElement.loop = audio.is_looping;
      audioRefs.current.set(audioId, audioElement);
    }

    audioElement.volume = volume * masterVolumeRef.current;
    
    try {
      await audioElement.play();
      
      if (isMaster) {
        const currentTracks = audioState?.playing_tracks || [];
        const newTracks = [
          ...currentTracks.filter(t => t.audio_id !== audioId),
          { audio_id: audioId, volume, position: 0, is_playing: true }
        ];
        await updateAudioState({ playing_tracks: newTracks });
      }
    } catch (err) {
      console.error('Erro ao reproduzir áudio:', err);
    }
  }, [audioLibrary, audioState, isMaster, updateAudioState]);

  // Pausar um áudio
  const pauseAudio = useCallback(async (audioId: string) => {
    const audioElement = audioRefs.current.get(audioId);
    if (audioElement) {
      audioElement.pause();
    }

    if (isMaster) {
      const currentTracks = audioState?.playing_tracks || [];
      const newTracks = currentTracks.map(t => 
        t.audio_id === audioId ? { ...t, is_playing: false, position: audioElement?.currentTime || 0 } : t
      );
      await updateAudioState({ playing_tracks: newTracks });
    }
  }, [audioState, isMaster, updateAudioState]);

  // Parar um áudio
  const stopAudio = useCallback(async (audioId: string) => {
    const audioElement = audioRefs.current.get(audioId);
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    if (isMaster) {
      const currentTracks = audioState?.playing_tracks || [];
      const newTracks = currentTracks.filter(t => t.audio_id !== audioId);
      await updateAudioState({ playing_tracks: newTracks });
    }
  }, [audioState, isMaster, updateAudioState]);

  // Parar todos os áudios
  const stopAllAudio = useCallback(async () => {
    audioRefs.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });

    if (isMaster) {
      await updateAudioState({ playing_tracks: [], current_scene_id: null });
    }
  }, [isMaster, updateAudioState]);

  // Ajustar volume master
  const setMasterVolume = useCallback(async (volume: number) => {
    masterVolumeRef.current = volume;
    
    // Atualizar volume de todos os áudios tocando
    audioRefs.current.forEach((audio) => {
      const trackState = audioState?.playing_tracks.find(t => 
        audioLibrary.find(a => a.id === t.audio_id)?.audio_url === audio.src
      );
      if (trackState) {
        audio.volume = trackState.volume * volume;
      }
    });

    if (isMaster) {
      await updateAudioState({ master_volume: volume });
    }
  }, [audioLibrary, audioState, isMaster, updateAudioState]);

  // Mutar/desmutar
  const toggleMute = useCallback(async () => {
    const newMuted = !audioState?.is_muted;
    
    audioRefs.current.forEach((audio) => {
      audio.muted = newMuted;
    });

    if (isMaster) {
      await updateAudioState({ is_muted: newMuted });
    }
  }, [audioState, isMaster, updateAudioState]);

  // Ativar uma cena sonora
  const activateScene = useCallback(async (sceneId: string) => {
    const scene = soundScenes.find(s => s.id === sceneId);
    if (!scene) return;

    // Parar todos os áudios atuais
    await stopAllAudio();

    // Iniciar as tracks da cena
    for (const track of scene.tracks) {
      await playAudio(track.audio_id, track.volume);
    }

    if (isMaster) {
      await updateAudioState({ 
        current_scene_id: sceneId,
        master_volume: scene.master_volume
      });
    }

    toast.success(`Cena "${scene.name}" ativada`);
  }, [soundScenes, stopAllAudio, playAudio, isMaster, updateAudioState]);

  // Reproduzir SFX rápido (não sincronizado)
  const playSFX = useCallback((sfxUrl: string) => {
    const audio = new Audio(sfxUrl);
    audio.volume = masterVolumeRef.current;
    audio.play().catch(console.error);
  }, []);

  // Upload de áudio
  const uploadAudio = useCallback(async (
    file: File, 
    name: string, 
    audioType: 'ambient' | 'music' | 'sfx',
    tags: string[] = []
  ) => {
    if (!isMaster || !user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${campaignId}/${audioType}/${Date.now()}.${fileExt}`;

    // Upload para storage
    const { error: uploadError } = await supabase.storage
      .from('campaign-audio')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      toast.error('Erro ao fazer upload do áudio');
      return null;
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('campaign-audio')
      .getPublicUrl(fileName);

    // Salvar no banco
    const { data, error } = await supabase
      .from('campaign_audio')
      .insert({
        campaign_id: campaignId,
        name,
        audio_url: urlData.publicUrl,
        audio_type: audioType,
        tags,
        is_looping: audioType !== 'sfx',
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar áudio:', error);
      toast.error('Erro ao salvar áudio');
      return null;
    }

    await loadAudioLibrary();
    toast.success(`Áudio "${name}" adicionado!`);
    return data;
  }, [campaignId, isMaster, user, loadAudioLibrary]);

  // Deletar áudio
  const deleteAudio = useCallback(async (audioId: string) => {
    if (!isMaster) return;

    const audio = audioLibrary.find(a => a.id === audioId);
    if (!audio) return;

    // Parar se estiver tocando
    await stopAudio(audioId);

    // Deletar do storage
    const path = audio.audio_url.split('/campaign-audio/')[1];
    if (path) {
      await supabase.storage.from('campaign-audio').remove([path]);
    }

    // Deletar do banco
    const { error } = await supabase
      .from('campaign_audio')
      .delete()
      .eq('id', audioId);

    if (error) {
      toast.error('Erro ao deletar áudio');
      return;
    }

    await loadAudioLibrary();
    toast.success('Áudio removido');
  }, [audioLibrary, isMaster, stopAudio, loadAudioLibrary]);

  // Criar cena sonora
  const createSoundScene = useCallback(async (
    name: string,
    icon: string,
    tracks: TrackConfig[],
    description?: string
  ) => {
    if (!isMaster || !user) return null;

    const { data, error } = await supabase
      .from('campaign_sound_scenes')
      .insert({
        campaign_id: campaignId,
        name,
        icon,
        description,
        tracks: tracks as unknown as any,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      toast.error('Erro ao criar cena sonora');
      return null;
    }

    await loadSoundScenes();
    toast.success(`Cena "${name}" criada!`);
    return data;
  }, [campaignId, isMaster, user, loadSoundScenes]);

  // Deletar cena sonora
  const deleteSoundScene = useCallback(async (sceneId: string) => {
    if (!isMaster) return;

    const { error } = await supabase
      .from('campaign_sound_scenes')
      .delete()
      .eq('id', sceneId);

    if (error) {
      toast.error('Erro ao deletar cena');
      return;
    }

    await loadSoundScenes();
    toast.success('Cena removida');
  }, [isMaster, loadSoundScenes]);

  // Carregar dados iniciais
  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await Promise.all([
        loadAudioLibrary(),
        loadSoundScenes(),
        loadAudioState()
      ]);
      setIsLoading(false);
    };

    loadAll();
  }, [loadAudioLibrary, loadSoundScenes, loadAudioState]);

  // Sincronização em tempo real (para jogadores)
  useEffect(() => {
    if (isMaster) return; // Mestre não precisa ouvir mudanças

    const channel = supabase
      .channel(`audio-state-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_audio_state',
          filter: `campaign_id=eq.${campaignId}`
        },
        async (payload) => {
          console.log('Estado do áudio atualizado:', payload);
          
          if (payload.new) {
            const newState = payload.new as AudioState;
            setAudioState({
              ...newState,
              playing_tracks: (newState.playing_tracks as unknown as PlayingTrack[]) || [],
              master_volume: Number(newState.master_volume) || 1.0
            });

            // Sincronizar reprodução
            masterVolumeRef.current = Number(newState.master_volume) || 1.0;

            // Parar áudios que não estão mais tocando
            audioRefs.current.forEach((audio, id) => {
              const track = (newState.playing_tracks as unknown as PlayingTrack[])?.find(t => t.audio_id === id);
              if (!track || !track.is_playing) {
                audio.pause();
              }
            });

            // Iniciar áudios novos
            for (const track of (newState.playing_tracks as unknown as PlayingTrack[]) || []) {
              if (track.is_playing) {
                const audioData = audioLibrary.find(a => a.id === track.audio_id);
                if (audioData) {
                  let audioElement = audioRefs.current.get(track.audio_id);
                  if (!audioElement) {
                    audioElement = new Audio(audioData.audio_url);
                    audioElement.loop = audioData.is_looping;
                    audioRefs.current.set(track.audio_id, audioElement);
                  }
                  audioElement.volume = track.volume * masterVolumeRef.current;
                  audioElement.muted = newState.is_muted;
                  audioElement.play().catch(console.error);
                }
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, isMaster, audioLibrary]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      audioRefs.current.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      audioRefs.current.clear();
    };
  }, []);

  return {
    // Dados
    audioLibrary,
    soundScenes,
    audioState,
    isLoading,
    presetSFX: PRESET_SFX,
    
    // Ações de reprodução
    playAudio,
    pauseAudio,
    stopAudio,
    stopAllAudio,
    setMasterVolume,
    toggleMute,
    playSFX,
    
    // Cenas sonoras
    activateScene,
    createSoundScene,
    deleteSoundScene,
    
    // Upload
    uploadAudio,
    deleteAudio,
    
    // Refresh
    refreshLibrary: loadAudioLibrary,
    refreshScenes: loadSoundScenes
  };
}

/**
 * AudioControlPanel - Painel de controle de áudio do mestre
 * 
 * Funcionalidades:
 * - Player minimalista com controles
 * - Lista de cenas sonoras (cards clicáveis)
 * - SFX rápidos (grid de botões)
 * - Volume master + mute global
 * 
 * @module components/campaign/v3/master/AudioControlPanel
 */

import { memo, useState, useCallback } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Square, 
  Music,
  Sparkles,
  Plus
} from '@/components/icons/ordem-icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SoundScene, CampaignAudio, AudioState } from '@/hooks/campaign/useCampaignAudio';

// Presets de SFX rápidos (ícones e labels)
const QUICK_SFX = [
  { id: 'door', label: 'Porta', icon: '🚪' },
  { id: 'footsteps', label: 'Passos', icon: '👣' },
  { id: 'gunshot', label: 'Tiro', icon: '🔫' },
  { id: 'thunder', label: 'Trovão', icon: '⚡' },
  { id: 'static', label: 'Estática', icon: '📻' },
  { id: 'whisper', label: 'Sussurro', icon: '💀' },
  { id: 'dog', label: 'Latido', icon: '🐕' },
  { id: 'engine', label: 'Motor', icon: '🚗' },
];

interface AudioControlPanelProps {
  /** Biblioteca de áudios */
  audioLibrary: CampaignAudio[];
  /** Cenas sonoras configuradas */
  soundScenes: SoundScene[];
  /** Estado atual de reprodução */
  audioState: AudioState | null;
  /** Se está carregando */
  isLoading?: boolean;
  /** Callback para ativar cena */
  onActivateScene?: (sceneId: string) => Promise<void>;
  /** Callback para reproduzir SFX */
  onPlaySFX?: (sfxId: string) => void;
  /** Callback para parar tudo */
  onStopAll?: () => void;
  /** Callback para alterar volume master */
  onSetMasterVolume?: (volume: number) => void;
  /** Callback para toggle mute */
  onToggleMute?: () => void;
  /** Classe CSS adicional */
  className?: string;
}

// Card de cena sonora
const SceneCard = memo(function SceneCard({
  scene,
  isActive,
  onClick,
}: {
  scene: SoundScene;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all',
        'hover:bg-muted/50 hover:border-primary/30',
        isActive 
          ? 'bg-primary/10 border-primary ring-1 ring-primary/30' 
          : 'bg-card border-border/50'
      )}
    >
      <span className="text-2xl">{scene.icon || '🎵'}</span>
      <span className="text-xs font-medium truncate max-w-full">
        {scene.name}
      </span>
      {isActive && (
        <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
          Ativa
        </Badge>
      )}
    </button>
  );
});

// Botão de SFX rápido
const SFXButton = memo(function SFXButton({
  sfx,
  onClick,
}: {
  sfx: typeof QUICK_SFX[0];
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 h-8"
      onClick={onClick}
    >
      <span>{sfx.icon}</span>
      <span className="text-xs">{sfx.label}</span>
    </Button>
  );
});

export const AudioControlPanel = memo(function AudioControlPanel({
  audioLibrary,
  soundScenes,
  audioState,
  isLoading,
  onActivateScene,
  onPlaySFX,
  onStopAll,
  onSetMasterVolume,
  onToggleMute,
  className,
}: AudioControlPanelProps) {
  const [localVolume, setLocalVolume] = useState(audioState?.master_volume ?? 1.0);
  
  const isMuted = audioState?.is_muted ?? false;
  const currentSceneId = audioState?.current_scene_id;
  const hasPlayingTracks = (audioState?.playing_tracks?.length ?? 0) > 0;

  // Handler para volume
  const handleVolumeChange = useCallback((value: number[]) => {
    const vol = value[0];
    setLocalVolume(vol);
    onSetMasterVolume?.(vol);
  }, [onSetMasterVolume]);

  // Handler para ativar cena
  const handleSceneClick = useCallback((sceneId: string) => {
    onActivateScene?.(sceneId);
  }, [onActivateScene]);

  // Handler para SFX
  const handleSFXClick = useCallback((sfxId: string) => {
    onPlaySFX?.(sfxId);
  }, [onPlaySFX]);

  if (isLoading) {
    return (
      <div className={cn('p-4', className)}>
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <div className="animate-pulse flex items-center gap-2">
            <Music className="h-5 w-5" />
            <span className="text-sm">Carregando áudio...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Controles principais */}
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-primary" />
              Controle de Áudio
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Mute */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggleMute}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4 text-destructive" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              
              {/* Stop All */}
              {hasPlayingTracks && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={onStopAll}
                >
                  <Square className="h-3.5 w-3.5" />
                  Parar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {/* Volume slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-12">Volume</span>
            <Slider
              value={[localVolume]}
              onValueChange={handleVolumeChange}
              min={0}
              max={1}
              step={0.05}
              className="flex-1"
              disabled={isMuted}
            />
            <span className="text-xs text-muted-foreground w-10 text-right">
              {Math.round(localVolume * 100)}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Cenas sonoras */}
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Cenas Sonoras
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
              <Plus className="h-3 w-3" />
              Nova
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {soundScenes.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {soundScenes.map((scene) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  isActive={currentSceneId === scene.id}
                  onClick={() => handleSceneClick(scene.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma cena sonora configurada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SFX rápidos */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-primary" />
            Efeitos Sonoros Rápidos
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <div className="flex flex-wrap gap-2">
            {QUICK_SFX.map((sfx) => (
              <SFXButton
                key={sfx.id}
                sfx={sfx}
                onClick={() => handleSFXClick(sfx.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Biblioteca de áudios (resumo) */}
      {audioLibrary.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Biblioteca ({audioLibrary.length} áudios)
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                <Plus className="h-3 w-3" />
                Upload
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <ScrollArea className="max-h-32">
              <div className="space-y-1">
                {audioLibrary.slice(0, 5).map((audio) => (
                  <div 
                    key={audio.id}
                    className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Music className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{audio.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {audio.audio_type}
                    </Badge>
                  </div>
                ))}
                {audioLibrary.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{audioLibrary.length - 5} mais
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

export default AudioControlPanel;

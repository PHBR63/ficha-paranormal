/**
 * Painel de controle de áudio para o Mestre
 * Gerencia playlists, SFX, cenas sonoras e uploads
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Plus,
  Trash2,
  Upload,
  Search,
  Folder,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
// ScrollArea removido - usando overflow nativo para evitar bug #185 com React 19
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useCampaignAudio, CampaignAudio, SoundScene, PRESET_SFX } from '@/hooks/campaign/useCampaignAudio';
import { cn } from '@/lib/utils';

interface AudioMasterPanelProps {
  campaignId: string;
  isMaster: boolean;
}

export function AudioMasterPanel({ campaignId, isMaster }: AudioMasterPanelProps) {
  const {
    audioLibrary,
    soundScenes,
    audioState,
    isLoading,
    presetSFX,
    playAudio,
    pauseAudio,
    stopAudio,
    stopAllAudio,
    setMasterVolume,
    toggleMute,
    playSFX,
    activateScene,
    createSoundScene,
    deleteSoundScene,
    uploadAudio,
    deleteAudio
  } = useCampaignAudio(campaignId, isMaster);

  // Estado local
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showSceneDialog, setShowSceneDialog] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['ambient', 'music', 'sfx']));
  
  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState<'ambient' | 'music' | 'sfx'>('ambient');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scene creation state
  const [sceneName, setSceneName] = useState('');
  const [sceneIcon, setSceneIcon] = useState('🎵');
  const [sceneDescription, setSceneDescription] = useState('');
  const [selectedTracks, setSelectedTracks] = useState<{audio_id: string, volume: number}[]>([]);

  // Handler estável para slider de volume master (evita loop #185)
  const handleMasterVolumeChange = useCallback(([v]: number[]) => {
    setMasterVolume(v);
  }, [setMasterVolume]);

  // Verificar se um áudio está tocando
  const isPlaying = (audioId: string) => {
    return audioState?.playing_tracks.some(t => t.audio_id === audioId && t.is_playing);
  };

  // Filtrar áudios pela busca
  const filteredAudios = audioLibrary.filter(audio =>
    audio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    audio.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Agrupar por tipo
  const groupedAudios = {
    ambient: filteredAudios.filter(a => a.audio_type === 'ambient'),
    music: filteredAudios.filter(a => a.audio_type === 'music'),
    sfx: filteredAudios.filter(a => a.audio_type === 'sfx')
  };

  // Toggle categoria expandida
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Handler de upload
  const handleUpload = async () => {
    if (!uploadFile || !uploadName) return;
    
    setIsUploading(true);
    await uploadAudio(uploadFile, uploadName, uploadType);
    setIsUploading(false);
    setShowUploadDialog(false);
    setUploadFile(null);
    setUploadName('');
  };

  // Handler de criação de cena
  const handleCreateScene = async () => {
    if (!sceneName || selectedTracks.length === 0) return;
    
    await createSoundScene(
      sceneName,
      sceneIcon,
      selectedTracks.map(t => ({ ...t, fade_in_seconds: 2 })),
      sceneDescription
    );
    
    setShowSceneDialog(false);
    setSceneName('');
    setSceneIcon('🎵');
    setSceneDescription('');
    setSelectedTracks([]);
  };

  const categoryLabels = {
    ambient: { label: 'Ambiente', icon: '🌙' },
    music: { label: 'Música', icon: '🎵' },
    sfx: { label: 'Efeitos', icon: '💥' }
  };

  const sceneIcons = ['🎵', '🌙', '⚔️', '😱', '🏚️', '🌲', '🏙️', '🔥', '❄️', '⛈️', '🎭', '💀'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Carregando áudios...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card/50 rounded-lg border border-border/50">
      {/* Header com controle de volume master */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">Atmosfera</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={toggleMute}
          >
            {audioState?.is_muted ? (
              <VolumeX className="w-4 h-4 text-destructive" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          
          <div className="flex items-center gap-2 w-28">
            <Slider
              value={[audioState?.master_volume ?? 1]}
              min={0}
              max={1}
              step={0.05}
              onValueChange={handleMasterVolumeChange}
              className="cursor-pointer flex-1"
            />
            <span className="text-xs text-muted-foreground w-8 text-right">
              {Math.round((audioState?.master_volume ?? 1) * 100)}%
            </span>
          </div>
          
          {audioState?.playing_tracks.length > 0 && (
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs"
              onClick={stopAllAudio}
            >
              <Square className="w-3 h-3 mr-1" />
              Parar
            </Button>
          )}
        </div>
      </div>

      {/* Usando overflow nativo para evitar bug #185 */}
      <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <div className="p-3 space-y-4">
          {/* Cenas Rápidas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase">Cenas Rápidas</span>
              {isMaster && (
                <Dialog open={showSceneDialog} onOpenChange={setShowSceneDialog}>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-6 w-6">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Cena Sonora</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Select value={sceneIcon} onValueChange={setSceneIcon}>
                          <SelectTrigger className="w-16">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {sceneIcons.map(icon => (
                              <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Nome da cena"
                          value={sceneName}
                          onChange={e => setSceneName(e.target.value)}
                        />
                      </div>
                      <Input
                        placeholder="Descrição (opcional)"
                        value={sceneDescription}
                        onChange={e => setSceneDescription(e.target.value)}
                      />
                      <div>
                        <span className="text-sm text-muted-foreground">Selecione as tracks:</span>
                        <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                          {audioLibrary.filter(a => a.audio_type !== 'sfx').map(audio => (
                            <label key={audio.id} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedTracks.some(t => t.audio_id === audio.id)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedTracks([...selectedTracks, { audio_id: audio.id, volume: 0.8 }]);
                                  } else {
                                    setSelectedTracks(selectedTracks.filter(t => t.audio_id !== audio.id));
                                  }
                                }}
                                className="rounded"
                              />
                              <span className="text-sm">{audio.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <Button 
                        onClick={handleCreateScene} 
                        disabled={!sceneName || selectedTracks.length === 0}
                        className="w-full"
                      >
                        Criar Cena
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {soundScenes.map(scene => (
                <motion.button
                  key={scene.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => activateScene(scene.id)}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-lg border transition-colors min-w-[60px]",
                    audioState?.current_scene_id === scene.id
                      ? "bg-primary/20 border-primary"
                      : "bg-muted/30 border-border/50 hover:bg-muted/50"
                  )}
                >
                  <span className="text-xl">{scene.icon}</span>
                  <span className="text-[10px] mt-1 truncate max-w-[50px]">{scene.name}</span>
                </motion.button>
              ))}
              
              {/* Botão Mute rápido */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopAllAudio}
                className="flex flex-col items-center p-2 rounded-lg border bg-muted/30 border-border/50 hover:bg-destructive/20 min-w-[60px]"
              >
                <span className="text-xl">🔇</span>
                <span className="text-[10px] mt-1">Silêncio</span>
              </motion.button>
            </div>
          </div>

          {/* SFX Rápidos */}
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase mb-2 block">SFX Rápidos</span>
            <div className="grid grid-cols-4 gap-1">
              {presetSFX.map(sfx => (
                <Button
                  key={sfx.id}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs px-2"
                  onClick={() => playSFX(sfx.url)}
                >
                  <span className="mr-1">{sfx.icon}</span>
                  <span className="truncate">{sfx.name}</span>
                </Button>
              ))}
            </div>
            {/* SFX da biblioteca */}
            {groupedAudios.sfx.length > 0 && (
              <div className="grid grid-cols-4 gap-1 mt-1">
                {groupedAudios.sfx.map(sfx => (
                  <Button
                    key={sfx.id}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs px-2"
                    onClick={() => playAudio(sfx.id, sfx.volume)}
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    <span className="truncate">{sfx.name}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Biblioteca */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase">Biblioteca</span>
              {isMaster && (
                <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-6 text-xs">
                      <Upload className="w-3 h-3 mr-1" />
                      Upload
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload de Áudio</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center cursor-pointer hover:bg-muted/20 transition-colors"
                      >
                        {uploadFile ? (
                          <div>
                            <Music className="w-8 h-8 mx-auto text-primary mb-2" />
                            <p className="text-sm font-medium">{uploadFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        ) : (
                          <div>
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Clique para selecionar ou arraste um arquivo
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              MP3, OGG, WAV (máx. 50MB)
                            </p>
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadFile(file);
                              if (!uploadName) {
                                setUploadName(file.name.replace(/\.[^/.]+$/, ''));
                              }
                            }
                          }}
                        />
                      </div>
                      
                      <Input
                        placeholder="Nome do áudio"
                        value={uploadName}
                        onChange={e => setUploadName(e.target.value)}
                      />
                      
                      <Select value={uploadType} onValueChange={(v: any) => setUploadType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ambient">🌙 Ambiente</SelectItem>
                          <SelectItem value="music">🎵 Música</SelectItem>
                          <SelectItem value="sfx">💥 Efeito Sonoro</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        onClick={handleUpload} 
                        disabled={!uploadFile || !uploadName || isUploading}
                        className="w-full"
                      >
                        {isUploading ? 'Enviando...' : 'Enviar Áudio'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Busca */}
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-7 text-xs pl-7"
              />
            </div>

            {/* Categorias */}
            <div className="space-y-1">
              {(['ambient', 'music'] as const).map(category => (
                <Collapsible
                  key={category}
                  open={expandedCategories.has(category)}
                  onOpenChange={() => toggleCategory(category)}
                >
                  <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted/30 rounded text-sm">
                    {expandedCategories.has(category) ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    <span>{categoryLabels[category].icon}</span>
                    <span>{categoryLabels[category].label}</span>
                    <Badge variant="secondary" className="ml-auto text-[10px] h-4">
                      {groupedAudios[category].length}
                    </Badge>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="pl-4 space-y-1">
                      {groupedAudios[category].map(audio => (
                        <AudioTrackItem
                          key={audio.id}
                          audio={audio}
                          isPlaying={isPlaying(audio.id)}
                          isMaster={isMaster}
                          onPlay={() => playAudio(audio.id, audio.volume)}
                          onPause={() => pauseAudio(audio.id)}
                          onStop={() => stopAudio(audio.id)}
                          onDelete={() => deleteAudio(audio.id)}
                        />
                      ))}
                      {groupedAudios[category].length === 0 && (
                        <p className="text-xs text-muted-foreground p-2">Nenhum áudio</p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status atual */}
      {audioState?.playing_tracks.length > 0 && (
        <div className="p-2 border-t border-border/50 bg-muted/20">
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="w-3 h-3 text-primary animate-pulse" />
            <span className="text-muted-foreground">
              {audioState.playing_tracks.length} faixa(s) tocando
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para item de track individual
interface AudioTrackItemProps {
  audio: CampaignAudio;
  isPlaying: boolean;
  isMaster: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onDelete: () => void;
}

function AudioTrackItem({ audio, isPlaying, isMaster, onPlay, onPause, onStop, onDelete }: AudioTrackItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-center gap-2 p-2 rounded hover:bg-muted/30 group",
        isPlaying && "bg-primary/10"
      )}
    >
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 shrink-0"
        onClick={isPlaying ? onPause : onPlay}
      >
        {isPlaying ? (
          <Pause className="w-3 h-3" />
        ) : (
          <Play className="w-3 h-3" />
        )}
      </Button>
      
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{audio.name}</p>
        {audio.duration_seconds && (
          <p className="text-[10px] text-muted-foreground">
            {Math.floor(audio.duration_seconds / 60)}:{(audio.duration_seconds % 60).toString().padStart(2, '0')}
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isPlaying && (
          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={onStop}>
            <Square className="w-3 h-3" />
          </Button>
        )}
        {isMaster && (
          <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive" onClick={onDelete}>
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default AudioMasterPanel;

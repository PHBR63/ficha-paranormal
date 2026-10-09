/**
 * SoundSceneManager - Gerenciador de Cenas de Som
 * 
 * Permite ao mestre criar e gerenciar cenas sonoras pré-configuradas
 * para ambientação da campanha.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area'; // Mantido apenas para dialogs com conteúdo estático
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Music,
  Play,
  Pause,
  Square,
  Plus,
  Trash2,
  Edit2,
  MoreVertical,
  Volume2,
  VolumeX,
  Search,
  Sparkles,
  Copy,
  Check,
  Loader2,
  Layers,
} from '@/components/icons/ordem-icons';
import { useToast } from '@/hooks/use-toast';
import { useCampaignAudio, SoundScene, CampaignAudio } from '@/hooks/campaign/useCampaignAudio';

// Ícones pré-definidos para cenas
const SCENE_ICONS = [
  { icon: '🎵', label: 'Música' },
  { icon: '⚔️', label: 'Combate' },
  { icon: '🔍', label: 'Investigação' },
  { icon: '👻', label: 'Terror' },
  { icon: '🏙️', label: 'Cidade' },
  { icon: '🌲', label: 'Floresta' },
  { icon: '🏰', label: 'Calabouço' },
  { icon: '🌊', label: 'Água' },
  { icon: '🔥', label: 'Fogo' },
  { icon: '❄️', label: 'Gelo' },
  { icon: '⛈️', label: 'Tempestade' },
  { icon: '🌙', label: 'Noturno' },
  { icon: '☀️', label: 'Diurno' },
  { icon: '💀', label: 'Morte' },
  { icon: '✨', label: 'Mágico' },
  { icon: '🎭', label: 'Social' },
];

interface SoundSceneManagerProps {
  campaignId: string;
  isMaster: boolean;
}

export function SoundSceneManager({ campaignId, isMaster }: SoundSceneManagerProps) {
  const { toast } = useToast();
  
  // Hook de áudio da campanha
  const {
    audioLibrary,
    soundScenes,
    audioState,
    isLoading,
    activateScene,
    createSoundScene,
    deleteSoundScene,
    stopAllAudio,
  } = useCampaignAudio(campaignId, isMaster);

  // Estados locais
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingScene, setEditingScene] = useState<SoundScene | null>(null);
  const [deletingScene, setDeletingScene] = useState<string | null>(null);
  
  // Estados do formulário
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('🎵');
  const [formTracks, setFormTracks] = useState<{ audio_id: string; volume: number; fade_in_seconds: number }[]>([]);
  const [formMasterVolume, setFormMasterVolume] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Cena ativa
  const activeSceneId = audioState?.current_scene_id;

  // Cenas filtradas
  const filteredScenes = useMemo(() => {
    if (!searchQuery.trim()) return soundScenes;
    const query = searchQuery.toLowerCase();
    return soundScenes.filter(scene =>
      scene.name.toLowerCase().includes(query) ||
      scene.description?.toLowerCase().includes(query)
    );
  }, [soundScenes, searchQuery]);

  // Resetar formulário
  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormIcon('🎵');
    setFormTracks([]);
    setFormMasterVolume(1);
    setEditingScene(null);
  };

  // Abrir criação
  const handleOpenCreate = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  // Abrir edição
  const handleOpenEdit = (scene: SoundScene) => {
    setFormName(scene.name);
    setFormDescription(scene.description || '');
    setFormIcon(scene.icon || '🎵');
    setFormTracks(scene.tracks || []);
    setFormMasterVolume(scene.master_volume || 1);
    setEditingScene(scene);
    setShowCreateDialog(true);
  };

  // Salvar cena
  const handleSaveScene = async () => {
    if (!formName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe um nome para a cena.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Parâmetros: name, icon, tracks, description
      await createSoundScene(formName, formIcon, formTracks, formDescription || undefined);
      toast({
        title: editingScene ? 'Cena atualizada' : 'Cena criada',
        description: `A cena "${formName}" foi salva.`,
      });
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a cena.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Deletar cena
  const handleDeleteScene = async (sceneId: string) => {
    try {
      await deleteSoundScene(sceneId);
      toast({
        title: 'Cena removida',
        description: 'A cena foi removida com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover a cena.',
        variant: 'destructive',
      });
    }
    setDeletingScene(null);
  };

  // Ativar cena
  const handleActivateScene = async (scene: SoundScene) => {
    try {
      await activateScene(scene.id);
      toast({
        title: 'Cena ativada',
        description: `Reproduzindo: ${scene.name}`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível ativar a cena.',
        variant: 'destructive',
      });
    }
  };

  // Toggle de track no formulário
  const toggleTrackInForm = (audio: CampaignAudio) => {
    const exists = formTracks.find(t => t.audio_id === audio.id);
    if (exists) {
      setFormTracks(formTracks.filter(t => t.audio_id !== audio.id));
    } else {
      setFormTracks([...formTracks, { audio_id: audio.id, volume: audio.volume || 1, fade_in_seconds: 0 }]);
    }
  };

  // Atualizar volume de track
  const updateTrackVolume = (audioId: string, volume: number) => {
    setFormTracks(formTracks.map(t =>
      t.audio_id === audioId ? { ...t, volume } : t
    ));
  };

  // Obter nome do áudio pelo ID
  const getAudioName = (audioId: string) => {
    return audioLibrary.find(a => a.id === audioId)?.name || 'Áudio desconhecido';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <h3 className="font-display text-lg tracking-wider text-primary">
              CENAS DE SOM
            </h3>
            <Badge variant="secondary" className="ml-2">
              {soundScenes.length}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {activeSceneId && (
              <Button
                variant="outline"
                size="sm"
                onClick={stopAllAudio}
                className="text-destructive hover:text-destructive"
              >
                <Square className="w-4 h-4 mr-1" />
                Parar
              </Button>
            )}
            
            {isMaster && (
              <Button size="sm" onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-1" />
                Nova Cena
              </Button>
            )}
          </div>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar cenas..."
            className="pl-9"
          />
        </div>

        {/* Lista de Cenas - usando overflow nativo para evitar bug #185 */}
        <div className="h-[400px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <AnimatePresence mode="popLayout">
            {filteredScenes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-muted-foreground"
              >
                <Music className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">Nenhuma cena criada</p>
                {isMaster && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleOpenCreate}
                    className="mt-2"
                  >
                    Criar primeira cena
                  </Button>
                )}
              </motion.div>
            ) : (
              <div className="grid gap-3">
                {filteredScenes.map((scene, index) => {
                  const isActive = activeSceneId === scene.id;
                  
                  return (
                    <motion.div
                      key={scene.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        'ordo-panel p-4 transition-all',
                        isActive && 'ring-2 ring-primary bg-primary/5'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Ícone */}
                        <div className={cn(
                          'text-2xl p-2 rounded-lg bg-accent/50',
                          isActive && 'bg-primary/20'
                        )}>
                          {scene.icon || '🎵'}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className={cn(
                              'font-display text-sm tracking-wider truncate',
                              isActive && 'text-primary'
                            )}>
                              {scene.name}
                            </h4>
                            {isActive && (
                              <Badge variant="default" className="shrink-0">
                                <Play className="w-3 h-3 mr-1" />
                                Ativo
                              </Badge>
                            )}
                          </div>
                          
                          {scene.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {scene.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              <Volume2 className="w-3 h-3 mr-1" />
                              {scene.tracks?.length || 0} faixas
                            </Badge>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={isActive ? 'destructive' : 'default'}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => isActive ? stopAllAudio() : handleActivateScene(scene)}
                              >
                                {isActive ? (
                                  <Square className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isActive ? 'Parar' : 'Reproduzir'}
                            </TooltipContent>
                          </Tooltip>

                          {isMaster && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenEdit(scene)}>
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    navigator.clipboard.writeText(scene.id);
                                    toast({ title: 'ID copiado!' });
                                  }}
                                >
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copiar ID
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeletingScene(scene.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Dialog de Criação/Edição */}
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          if (!open) resetForm();
          setShowCreateDialog(open);
        }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display tracking-wider">
                {editingScene ? 'EDITAR CENA' : 'NOVA CENA DE SOM'}
              </DialogTitle>
              <DialogDescription>
                Configure os detalhes e faixas de áudio da cena.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Nome e Ícone */}
              <div className="grid grid-cols-[1fr,auto] gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome da Cena</label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Combate Intenso"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ícone</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-14 h-10 text-xl">
                        {formIcon}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="grid grid-cols-4 gap-1 p-2">
                      {SCENE_ICONS.map(({ icon, label }) => (
                        <Tooltip key={icon}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={formIcon === icon ? 'default' : 'ghost'}
                              size="icon"
                              className="text-xl"
                              onClick={() => setFormIcon(icon)}
                            >
                              {icon}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{label}</TooltipContent>
                        </Tooltip>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição (opcional)</label>
                <Input
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Breve descrição da cena..."
                />
              </div>

              <Separator />

              {/* Volume Master */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Volume Geral: {Math.round(formMasterVolume * 100)}%
                </label>
                <Slider
                  value={[formMasterVolume]}
                  onValueChange={([v]) => setFormMasterVolume(v)}
                  max={1}
                  step={0.05}
                  className="w-full"
                />
              </div>

              <Separator />

              {/* Seleção de Faixas */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Faixas de Áudio</label>
                
                {audioLibrary.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nenhum áudio disponível. Faça upload na aba de áudio primeiro.
                  </p>
                ) : (
                  <ScrollArea className="h-[200px] border rounded-lg p-2">
                    <div className="space-y-2">
                      {audioLibrary.map(audio => {
                        const isSelected = formTracks.some(t => t.audio_id === audio.id);
                        const track = formTracks.find(t => t.audio_id === audio.id);
                        
                        return (
                          <div
                            key={audio.id}
                            className={cn(
                              'flex items-center gap-3 p-2 rounded-lg transition-colors',
                              isSelected ? 'bg-primary/10' : 'hover:bg-accent/50'
                            )}
                          >
                            <Button
                              variant={isSelected ? 'default' : 'outline'}
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => toggleTrackInForm(audio)}
                            >
                              {isSelected ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Plus className="w-4 h-4" />
                              )}
                            </Button>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{audio.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {audio.audio_type}
                              </p>
                            </div>

                            {isSelected && (
                              <div className="flex items-center gap-2 w-32">
                                <Volume2 className="w-3 h-3 text-muted-foreground shrink-0" />
                                <Slider
                                  value={[track?.volume || 1]}
                                  onValueChange={([v]) => updateTrackVolume(audio.id, v)}
                                  max={1}
                                  step={0.05}
                                  className="flex-1"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}

                {formTracks.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {formTracks.length} faixa(s) selecionada(s)
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveScene} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingScene ? 'Salvar Alterações' : 'Criar Cena'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <Dialog open={!!deletingScene} onOpenChange={() => setDeletingScene(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display tracking-wider text-destructive">
                EXCLUIR CENA
              </DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir esta cena? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingScene(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => deletingScene && handleDeleteScene(deletingScene)}
              >
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

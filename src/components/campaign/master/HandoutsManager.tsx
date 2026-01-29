/**
 * Gerenciador de Handouts para o Mestre
 * Permite criar, editar, revelar e compartilhar documentos/pistas com jogadores
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Image,
  Search,
  Plus,
  Eye,
  EyeOff,
  Users,
  Trash2,
  Edit,
  Share2,
  ChevronRight,
  Sparkles,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
// ScrollArea removido - usando overflow nativo para evitar bug #185 com React 19
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useHandouts, Handout } from '@/hooks/campaign/useHandouts';
import { cn } from '@/lib/utils';

interface CampaignMember {
  id: string;
  user_id: string;
  profiles?: { display_name: string | null };
  characters?: { name: string } | null;
}

interface HandoutsManagerProps {
  campaignId: string;
  members: CampaignMember[];
}

const handoutTypeIcons = {
  document: FileText,
  image: Image,
  clue: Search,
  npc: Users,
};

const handoutTypeLabels = {
  document: 'Documento',
  image: 'Imagem',
  clue: 'Pista',
  npc: 'NPC',
};

export function HandoutsManager({ campaignId, members }: HandoutsManagerProps) {
  const {
    handouts,
    isLoading,
    createHandout,
    updateHandout,
    revealHandout,
    shareHandoutWith,
    hideHandout,
    deleteHandout,
  } = useHandouts(campaignId, true);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedHandout, setSelectedHandout] = useState<Handout | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<Handout['handout_type']>('document');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Filtrar handouts
  const filteredHandouts = handouts.filter(h =>
    h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Agrupar por visibilidade
  const groupedHandouts = {
    hidden: filteredHandouts.filter(h => h.visibility === 'hidden'),
    shared: filteredHandouts.filter(h => h.visibility === 'shared_with'),
    visible: filteredHandouts.filter(h => h.visibility === 'visible'),
  };

  // Handlers
  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    
    await createHandout(newTitle, newContent, newType, newImageUrl || undefined);
    
    setNewTitle('');
    setNewContent('');
    setNewType('document');
    setNewImageUrl('');
    setShowCreateDialog(false);
  };

  const handleEdit = async () => {
    if (!selectedHandout || !newTitle.trim()) return;
    
    await updateHandout(selectedHandout.id, {
      title: newTitle,
      content: newContent,
      handout_type: newType,
      image_url: newImageUrl || undefined,
    });
    
    setShowEditDialog(false);
    setSelectedHandout(null);
  };

  const handleShare = async () => {
    if (!selectedHandout || selectedMembers.length === 0) return;
    
    await shareHandoutWith(selectedHandout.id, selectedMembers);
    
    setShowShareDialog(false);
    setSelectedHandout(null);
    setSelectedMembers([]);
  };

  const openEditDialog = (handout: Handout) => {
    setSelectedHandout(handout);
    setNewTitle(handout.title);
    setNewContent(handout.content || '');
    setNewType(handout.handout_type);
    setNewImageUrl(handout.image_url || '');
    setShowEditDialog(true);
  };

  const openShareDialog = (handout: Handout) => {
    setSelectedHandout(handout);
    setSelectedMembers(handout.shared_with || []);
    setShowShareDialog(true);
  };

  // Players apenas (sem o mestre)
  const playerMembers = members.filter(m => m.user_id !== members.find(m2 => m2.id === m.id)?.user_id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Carregando handouts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg tracking-wider">HANDOUTS</h3>
          <Badge variant="secondary">{handouts.length}</Badge>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Novo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Handout</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">📄 Documento</SelectItem>
                    <SelectItem value="image">🖼️ Imagem</SelectItem>
                    <SelectItem value="clue">🔍 Pista</SelectItem>
                    <SelectItem value="npc">👤 NPC</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Título do handout"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="flex-1"
                />
              </div>

              <Textarea
                placeholder="Conteúdo do handout (suporta markdown)..."
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                rows={8}
              />

              {(newType === 'image' || newType === 'npc') && (
                <Input
                  placeholder="URL da imagem (opcional)"
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                />
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={!newTitle.trim()}>
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar handouts..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista de Handouts */}
      <div className="h-[400px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <div className="space-y-4">
          {/* Ocultos */}
          {groupedHandouts.hidden.length > 0 && (
            <HandoutGroup
              title="Ocultos"
              icon={<EyeOff className="w-4 h-4" />}
              handouts={groupedHandouts.hidden}
              members={members}
              onEdit={openEditDialog}
              onShare={openShareDialog}
              onReveal={revealHandout}
              onHide={hideHandout}
              onDelete={deleteHandout}
            />
          )}

          {/* Compartilhados */}
          {groupedHandouts.shared.length > 0 && (
            <HandoutGroup
              title="Compartilhados"
              icon={<Share2 className="w-4 h-4" />}
              handouts={groupedHandouts.shared}
              members={members}
              onEdit={openEditDialog}
              onShare={openShareDialog}
              onReveal={revealHandout}
              onHide={hideHandout}
              onDelete={deleteHandout}
            />
          )}

          {/* Visíveis para todos */}
          {groupedHandouts.visible.length > 0 && (
            <HandoutGroup
              title="Revelados"
              icon={<Eye className="w-4 h-4" />}
              handouts={groupedHandouts.visible}
              members={members}
              onEdit={openEditDialog}
              onShare={openShareDialog}
              onReveal={revealHandout}
              onHide={hideHandout}
              onDelete={deleteHandout}
            />
          )}

          {filteredHandouts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum handout encontrado</p>
              <p className="text-sm">Crie documentos, pistas e imagens para revelar aos jogadores</p>
            </div>
          )}
        </div>
      </div>

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Handout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">📄 Documento</SelectItem>
                  <SelectItem value="image">🖼️ Imagem</SelectItem>
                  <SelectItem value="clue">🔍 Pista</SelectItem>
                  <SelectItem value="npc">👤 NPC</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Título"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="flex-1"
              />
            </div>
            <Textarea
              placeholder="Conteúdo..."
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              rows={8}
            />
            {(newType === 'image' || newType === 'npc') && (
              <Input
                placeholder="URL da imagem"
                value={newImageUrl}
                onChange={e => setNewImageUrl(e.target.value)}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Compartilhamento */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartilhar com...</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {members.map(member => (
              <label
                key={member.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
              >
                <Checkbox
                  checked={selectedMembers.includes(member.user_id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedMembers([...selectedMembers, member.user_id]);
                    } else {
                      setSelectedMembers(selectedMembers.filter(id => id !== member.user_id));
                    }
                  }}
                />
                <span>
                  {member.characters?.name || member.profiles?.display_name || 'Jogador'}
                </span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleShare} disabled={selectedMembers.length === 0}>
              Compartilhar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente para grupo de handouts
interface HandoutGroupProps {
  title: string;
  icon: React.ReactNode;
  handouts: Handout[];
  members: CampaignMember[];
  onEdit: (h: Handout) => void;
  onShare: (h: Handout) => void;
  onReveal: (id: string) => void;
  onHide: (id: string) => void;
  onDelete: (id: string) => void;
}

function HandoutGroup({ title, icon, handouts, members, onEdit, onShare, onReveal, onHide, onDelete }: HandoutGroupProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground w-full"
      >
        <ChevronRight className={cn("w-4 h-4 transition-transform", expanded && "rotate-90")} />
        {icon}
        <span>{title}</span>
        <Badge variant="outline" className="ml-auto">{handouts.length}</Badge>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 pl-6"
          >
            {handouts.map(handout => {
              const Icon = handoutTypeIcons[handout.handout_type];
              
              return (
                <motion.div
                  key={handout.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50 hover:bg-card/80 group"
                >
                  <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{handout.title}</p>
                    {handout.content && (
                      <p className="text-xs text-muted-foreground truncate">
                        {handout.content.substring(0, 60)}...
                      </p>
                    )}
                    {handout.visibility === 'shared_with' && handout.shared_with && (
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          {handout.shared_with.length} jogador(es)
                        </span>
                      </div>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(handout)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      
                      {handout.visibility === 'hidden' && (
                        <>
                          <DropdownMenuItem onClick={() => onReveal(handout.id)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Revelar para Todos
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onShare(handout)}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Compartilhar com...
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {handout.visibility !== 'hidden' && (
                        <DropdownMenuItem onClick={() => onHide(handout.id)}>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Ocultar
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem 
                        onClick={() => onDelete(handout.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HandoutsManager;

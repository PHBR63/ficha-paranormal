/**
 * ResourcesTab - Aba de recursos da campanha v3
 * 
 * Sub-abas funcionais:
 * - Notas: CRUD com backend (campaign_notes)
 * - Handouts: Integração com useHandouts
 * - Timeline: Eventos da campanha (campaign_timeline_events)
 * 
 * @module components/campaign/v3/tabs/ResourcesTab
 */

import { memo, useState, useCallback, useEffect } from 'react';
import { 
  FileText, 
  Image, 
  Clock, 
  Plus,
  Search,
  Eye,
  EyeOff,
  Lock,
  Trash2,
  Edit,
} from '@/components/icons/ordem-icons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useHandouts, type Handout } from '@/hooks/campaign/useHandouts';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ResourceSubTab = 'notes' | 'handouts' | 'timeline';

interface ResourcesTabProps {
  campaignId: string;
  isMaster: boolean;
  className?: string;
}

// =====================================================
// TIPOS INTERNOS
// =====================================================

interface CampaignNote {
  id: string;
  campaign_id: string;
  user_id: string;
  title: string | null;
  content: string;
  note_type: string;
  is_private: boolean;
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

interface TimelineEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  event_date: string;
  importance: number;
  session_id: string | null;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export const ResourcesTab = memo(function ResourcesTab({
  campaignId,
  isMaster,
  className,
}: ResourcesTabProps) {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<ResourceSubTab>('notes');
  const [searchQuery, setSearchQuery] = useState('');

  // ---- NOTAS ----
  const [notes, setNotes] = useState<CampaignNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CampaignNote | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [notePrivate, setNotePrivate] = useState(true);

  // Carregar notas
  const loadNotes = useCallback(async () => {
    setNotesLoading(true);
    const { data, error } = await supabase
      .from('campaign_notes')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setNotes(data as CampaignNote[]);
    }
    setNotesLoading(false);
  }, [campaignId]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  // Criar/editar nota
  const handleSaveNote = useCallback(async () => {
    if (!user || !noteContent.trim()) return;

    if (editingNote) {
      const { error } = await supabase
        .from('campaign_notes')
        .update({
          title: noteTitle.trim() || null,
          content: noteContent.trim(),
          is_private: notePrivate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingNote.id);

      if (error) { toast.error('Erro ao atualizar nota'); return; }
      toast.success('Nota atualizada!');
    } else {
      const { error } = await supabase
        .from('campaign_notes')
        .insert({
          campaign_id: campaignId,
          user_id: user.id,
          title: noteTitle.trim() || null,
          content: noteContent.trim(),
          is_private: notePrivate,
          note_type: 'personal',
        });

      if (error) { toast.error('Erro ao criar nota'); return; }
      toast.success('Nota criada!');
    }

    setNoteDialogOpen(false);
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
    setNotePrivate(true);
    loadNotes();
  }, [user, campaignId, noteTitle, noteContent, notePrivate, editingNote, loadNotes]);

  // Deletar nota
  const handleDeleteNote = useCallback(async (noteId: string) => {
    const { error } = await supabase
      .from('campaign_notes')
      .delete()
      .eq('id', noteId);

    if (error) { toast.error('Erro ao deletar nota'); return; }
    toast.success('Nota removida');
    loadNotes();
  }, [loadNotes]);

  // Abrir edição
  const openEditNote = useCallback((note: CampaignNote) => {
    setEditingNote(note);
    setNoteTitle(note.title || '');
    setNoteContent(note.content);
    setNotePrivate(note.is_private);
    setNoteDialogOpen(true);
  }, []);

  // Abrir criação
  const openCreateNote = useCallback(() => {
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
    setNotePrivate(true);
    setNoteDialogOpen(true);
  }, []);

  // ---- HANDOUTS ----
  const { handouts, isLoading: handoutsLoading } = useHandouts(campaignId, isMaster, user?.id);

  // ---- TIMELINE ----
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);

  const loadTimeline = useCallback(async () => {
    setTimelineLoading(true);
    const { data, error } = await supabase
      .from('campaign_timeline_events')
      .select('id, title, description, event_type, event_date, importance, session_id')
      .eq('campaign_id', campaignId)
      .order('event_date', { ascending: false });

    if (!error && data) {
      setTimelineEvents(data as TimelineEvent[]);
    }
    setTimelineLoading(false);
  }, [campaignId]);

  useEffect(() => { loadTimeline(); }, [loadTimeline]);

  // Filtros de busca
  const filteredNotes = notes.filter(n =>
    !searchQuery || 
    (n.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHandouts = handouts.filter(h =>
    !searchQuery ||
    h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (h.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTimeline = timelineEvents.filter(e =>
    !searchQuery ||
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Ícone de tipo de evento
  const eventTypeIcon: Record<string, string> = {
    milestone: '🏆',
    combat: '⚔️',
    discovery: '🔍',
    death: '💀',
    npc_encounter: '🗣️',
    location: '📍',
    default: '📅',
  };

  // Ícone de visibilidade
  const visibilityIcon = (v: Handout['visibility']) => {
    if (v === 'visible') return <Eye className="h-3 w-3 text-green-500" />;
    if (v === 'shared_with') return <Lock className="h-3 w-3 text-yellow-500" />;
    return <EyeOff className="h-3 w-3 text-muted-foreground" />;
  };

  // Handout type badge
  const handoutTypeBadge: Record<string, string> = {
    document: 'Documento',
    image: 'Imagem',
    clue: 'Pista',
    npc: 'NPC',
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Tabs 
        value={activeSubTab} 
        onValueChange={(v) => setActiveSubTab(v as ResourceSubTab)}
        className="flex flex-col h-full"
      >
        <div className="shrink-0 px-4 pt-3 pb-2 border-b border-border/30 flex items-center justify-between gap-4">
          <TabsList className="bg-transparent h-9">
            <TabsTrigger value="notes" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" />
              Notas
            </TabsTrigger>
            <TabsTrigger value="handouts" className="gap-1.5 text-xs">
              <Image className="h-3.5 w-3.5" />
              Handouts
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1.5 text-xs">
              <Clock className="h-3.5 w-3.5" />
              Timeline
            </TabsTrigger>
          </TabsList>

          {/* Busca */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>

          {/* Botão criar */}
          {activeSubTab === 'notes' && (
            <Button size="sm" className="gap-1.5" onClick={openCreateNote}>
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Nova Nota</span>
            </Button>
          )}
        </div>

        {/* === NOTAS === */}
        <TabsContent value="notes" className="flex-1 m-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {notesLoading && (
                <p className="text-sm text-muted-foreground text-center py-8">Carregando notas...</p>
              )}

              {!notesLoading && filteredNotes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhuma nota encontrada</p>
                  <p className="text-xs mt-1">Crie sua primeira nota clicando no botão acima</p>
                </div>
              )}

              {filteredNotes.map((note) => (
                <Card 
                  key={note.id} 
                  className="hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => openEditNote(note)}
                >
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium truncate">
                          {note.title || 'Sem título'}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {note.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {note.is_private && (
                          <Badge variant="outline" className="text-[10px]">
                            <Lock className="h-2.5 w-2.5 mr-1" />
                            Privada
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                          onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(note.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* === HANDOUTS === */}
        <TabsContent value="handouts" className="flex-1 m-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {handoutsLoading && (
                <p className="text-sm text-muted-foreground text-center py-8">Carregando handouts...</p>
              )}

              {!handoutsLoading && filteredHandouts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Image className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhum handout disponível</p>
                  <p className="text-xs mt-1">
                    {isMaster ? 'Crie handouts na aba do Mestre' : 'O mestre ainda não compartilhou documentos'}
                  </p>
                </div>
              )}

              {filteredHandouts.map((handout) => (
                <Card key={handout.id} className="hover:bg-muted/50 transition-colors">
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-start gap-3">
                      {/* Thumbnail se tiver imagem */}
                      {handout.image_url && (
                        <img
                          src={handout.image_url}
                          alt={handout.title}
                          className="h-16 w-16 rounded object-cover shrink-0"
                        />
                      )}

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm font-medium truncate">
                            {handout.title}
                          </CardTitle>
                          {isMaster && visibilityIcon(handout.visibility)}
                        </div>

                        {handout.content && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {handout.content}
                          </p>
                        )}

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {handoutTypeBadge[handout.handout_type] || handout.handout_type}
                          </Badge>
                          {handout.revealed_at && (
                            <span className="text-[10px] text-muted-foreground">
                              Revelado em {format(new Date(handout.revealed_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* === TIMELINE === */}
        <TabsContent value="timeline" className="flex-1 m-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              {timelineLoading && (
                <p className="text-sm text-muted-foreground text-center py-8">Carregando timeline...</p>
              )}

              {!timelineLoading && filteredTimeline.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhum evento na timeline</p>
                  <p className="text-xs mt-1">
                    {isMaster ? 'Eventos serão adicionados conforme a campanha avança' : 'A timeline da campanha está vazia'}
                  </p>
                </div>
              )}

              {/* Lista cronológica */}
              <div className="relative">
                {/* Linha vertical */}
                {filteredTimeline.length > 1 && (
                  <div className="absolute left-4 top-6 bottom-6 w-px bg-border" />
                )}

                <div className="space-y-4">
                  {filteredTimeline.map((event) => (
                    <div key={event.id} className="flex gap-4 relative">
                      {/* Ícone do evento */}
                      <div className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm z-10">
                        {eventTypeIcon[event.event_type] || eventTypeIcon.default}
                      </div>

                      <div className="flex-1 min-w-0 pb-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{event.title}</p>
                          {event.importance >= 3 && (
                            <Badge variant="secondary" className="text-[10px]">Importante</Badge>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {format(new Date(event.event_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Dialog de criação/edição de nota */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              {editingNote ? 'Editar Nota' : 'Nova Nota'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="note-title">Título (opcional)</Label>
              <Input
                id="note-title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Título da nota..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note-content">Conteúdo</Label>
              <Textarea
                id="note-content"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Escreva sua nota..."
                rows={6}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={notePrivate ? 'secondary' : 'outline'}
                size="sm"
                className="gap-1.5"
                onClick={() => setNotePrivate(true)}
              >
                <Lock className="h-3.5 w-3.5" />
                Privada
              </Button>
              <Button
                variant={!notePrivate ? 'secondary' : 'outline'}
                size="sm"
                className="gap-1.5"
                onClick={() => setNotePrivate(false)}
              >
                <Eye className="h-3.5 w-3.5" />
                Compartilhada
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveNote} disabled={!noteContent.trim()}>
              {editingNote ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default ResourcesTab;

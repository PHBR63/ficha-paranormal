/**
 * NotesPanel - Painel de notas persistentes da campanha
 * Lista notas do usuário e compartilhadas, com filtros
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// ScrollArea removido - usando overflow nativo para evitar bug #185 com React 19
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NoteEditor } from './NoteEditor';
import {
  Plus,
  Loader2,
  FileText,
  Users,
  Lock,
  Search,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipo para nota
interface CampaignNote {
  id: string;
  campaign_id: string;
  user_id: string;
  session_id: string | null;
  title: string | null;
  content: string;
  note_type: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

interface NotesPanelProps {
  campaignId: string;
  isMaster: boolean;
}

export function NotesPanel({ campaignId, isMaster }: NotesPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [notes, setNotes] = useState<CampaignNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<CampaignNote | null>(null);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Busca notas ao montar
  useEffect(() => {
    fetchNotes();
    subscribeToNotes();
  }, [campaignId]);

  // Busca notas do banco
  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_notes')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar notas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as notas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Subscribe para atualizações em tempo real
  const subscribeToNotes = () => {
    const channel = supabase
      .channel(`notes-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_notes',
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          fetchNotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Cria nova nota
  const createNote = async () => {
    if (!user) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('campaign_notes')
        .insert({
          campaign_id: campaignId,
          user_id: user.id,
          title: 'Nova Nota',
          content: '',
          note_type: 'personal',
          is_private: true,
        })
        .select()
        .single();

      if (error) throw error;

      setNotes(prev => [data, ...prev]);
      setSelectedNote(data);
      toast({ title: 'Nota criada!' });
    } catch (error: any) {
      toast({
        title: 'Erro ao criar nota',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  // Atualiza uma nota
  const updateNote = async (noteId: string, updates: Partial<CampaignNote>) => {
    try {
      const { error } = await supabase
        .from('campaign_notes')
        .update(updates)
        .eq('id', noteId);

      if (error) throw error;

      setNotes(prev => prev.map(n => 
        n.id === noteId ? { ...n, ...updates } : n
      ));
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar nota',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Deleta uma nota
  const deleteNote = async (noteId: string) => {
    if (!confirm('Deletar esta nota?')) return;

    try {
      const { error } = await supabase
        .from('campaign_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(prev => prev.filter(n => n.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
      toast({ title: 'Nota deletada' });
    } catch (error: any) {
      toast({
        title: 'Erro ao deletar nota',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Filtra notas
  const myNotes = notes.filter(n => n.user_id === user?.id);
  const sharedNotes = notes.filter(n => !n.is_private && n.user_id !== user?.id);

  // Filtra por busca
  const filterBySearch = (noteList: CampaignNote[]) => {
    if (!searchQuery) return noteList;
    const query = searchQuery.toLowerCase();
    return noteList.filter(n => 
      n.title?.toLowerCase().includes(query) || 
      n.content.toLowerCase().includes(query)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-h-0 gap-4">
      {/* Lista de notas */}
      <div className="w-80 flex flex-col min-h-0 border-r border-border pr-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg tracking-wider text-primary">
            NOTAS
          </h3>
          <Button size="sm" onClick={createNote} disabled={creating}>
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Busca */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar notas..."
            className="pl-9"
          />
        </div>

        {/* Tabs de filtro */}
        <Tabs defaultValue="my" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full">
            <TabsTrigger value="my" className="flex-1 text-xs">
              <Lock className="w-3 h-3 mr-1" />
              Minhas ({myNotes.length})
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex-1 text-xs">
              <Users className="w-3 h-3 mr-1" />
              Compartilhadas ({sharedNotes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my" className="flex-1 flex flex-col min-h-0 mt-2">
            <div className="flex-1 min-h-[150px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              <div className="space-y-2">
                {filterBySearch(myNotes).map((note) => (
                  <NoteListItem
                    key={note.id}
                    note={note}
                    isSelected={selectedNote?.id === note.id}
                    onSelect={() => setSelectedNote(note)}
                    onDelete={() => deleteNote(note.id)}
                    isOwner
                  />
                ))}
                {myNotes.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    Nenhuma nota pessoal
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="shared" className="flex-1 flex flex-col min-h-0 mt-2">
            <div className="flex-1 min-h-[150px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              <div className="space-y-2">
                {filterBySearch(sharedNotes).map((note) => (
                  <NoteListItem
                    key={note.id}
                    note={note}
                    isSelected={selectedNote?.id === note.id}
                    onSelect={() => setSelectedNote(note)}
                  />
                ))}
                {sharedNotes.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    Nenhuma nota compartilhada
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Editor de nota */}
      <div className="flex-1">
        {selectedNote ? (
          <NoteEditor
            note={selectedNote}
            isOwner={selectedNote.user_id === user?.id}
            onUpdate={updateNote}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-foreground/70">
            <FileText className="w-12 h-12 mb-4 text-foreground/40" />
            <p>Selecione uma nota ou crie uma nova</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente de item da lista de notas
interface NoteListItemProps {
  note: CampaignNote;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  isOwner?: boolean;
}

function NoteListItem({ note, isSelected, onSelect, onDelete, isOwner }: NoteListItemProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'p-3 rounded-lg cursor-pointer transition-all group',
        'border border-transparent hover:border-border',
        isSelected && 'bg-primary/10 border-primary/30'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {note.is_private ? (
              <Lock className="w-3 h-3 text-muted-foreground" />
            ) : (
              <Users className="w-3 h-3 text-primary" />
            )}
            <span className="font-medium text-sm truncate">
              {note.title || 'Sem título'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {note.content.slice(0, 50) || 'Nota vazia...'}
          </p>
          <p className="text-xs text-muted-foreground/50 mt-1">
            {new Date(note.updated_at).toLocaleDateString('pt-BR')}
          </p>
        </div>

        {isOwner && onDelete && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

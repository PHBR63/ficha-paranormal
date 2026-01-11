/**
 * SessionDiary - Diário de Campanha
 * Exibe cronologicamente todas as sessões com resumos e notas
 */
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SessionDiaryEntry } from './SessionDiaryEntry';
import {
  BookOpen,
  Search,
  Filter,
  Loader2,
  Calendar,
  ListOrdered,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Tipos
interface CampaignSession {
  id: string;
  campaign_id: string;
  session_number: number;
  title: string | null;
  summary: string | null;
  status: string;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  notes: any;
  created_at: string;
}

interface SessionNote {
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

interface SessionDiaryProps {
  campaignId: string;
  isMaster: boolean;
}

type SortOrder = 'newest' | 'oldest';
type FilterStatus = 'all' | 'completed' | 'scheduled';

export function SessionDiary({ campaignId, isMaster }: SessionDiaryProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [sessions, setSessions] = useState<CampaignSession[]>([]);
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  // Busca dados ao montar
  useEffect(() => {
    fetchData();
    subscribeToChanges();
  }, [campaignId]);

  // Busca sessões e notas
  const fetchData = async () => {
    try {
      // Busca sessões
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('campaign_sessions')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('session_number', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Busca notas com session_id ou do tipo session_recap
      const { data: notesData, error: notesError } = await supabase
        .from('campaign_notes')
        .select('*')
        .eq('campaign_id', campaignId)
        .or('session_id.not.is.null,note_type.eq.session_recap');

      if (notesError) throw notesError;

      setSessions(sessionsData || []);
      setNotes(notesData || []);
    } catch (error: any) {
      console.error('Erro ao buscar dados do diário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o diário.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Subscribe para atualizações em tempo real
  const subscribeToChanges = () => {
    // Canal para sessões
    const sessionsChannel = supabase
      .channel(`diary-sessions-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_sessions',
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => fetchData()
      )
      .subscribe();

    // Canal para notas
    const notesChannel = supabase
      .channel(`diary-notes-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_notes',
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionsChannel);
      supabase.removeChannel(notesChannel);
    };
  };

  // Salva resumo de uma sessão
  const saveSummary = async (sessionId: string, summary: string) => {
    try {
      const { error } = await supabase
        .from('campaign_sessions')
        .update({ summary })
        .eq('id', sessionId);

      if (error) throw error;

      // Atualiza localmente
      setSessions(prev =>
        prev.map(s =>
          s.id === sessionId ? { ...s, summary } : s
        )
      );

      toast({ title: 'Resumo salvo!' });
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar resumo',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Filtra e ordena sessões
  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    // Filtra por status
    if (filterStatus !== 'all') {
      result = result.filter(s => s.status === filterStatus);
    }

    // Filtra por busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.title?.toLowerCase().includes(query) ||
        s.summary?.toLowerCase().includes(query) ||
        `sessão ${s.session_number}`.includes(query)
      );
    }

    // Ordena
    result.sort((a, b) => {
      const comparison = a.session_number - b.session_number;
      return sortOrder === 'newest' ? -comparison : comparison;
    });

    return result;
  }, [sessions, filterStatus, searchQuery, sortOrder]);

  // Agrupa notas por sessão
  const notesBySession = useMemo(() => {
    const grouped: Record<string, SessionNote[]> = {};
    notes.forEach(note => {
      if (note.session_id) {
        if (!grouped[note.session_id]) {
          grouped[note.session_id] = [];
        }
        grouped[note.session_id].push(note);
      }
    });
    return grouped;
  }, [notes]);

  // Estatísticas
  const stats = useMemo(() => {
    const completed = sessions.filter(s => s.status === 'completed').length;
    const totalDuration = sessions
      .filter(s => s.started_at && s.ended_at)
      .reduce((acc, s) => {
        const start = new Date(s.started_at!);
        const end = new Date(s.ended_at!);
        return acc + (end.getTime() - start.getTime());
      }, 0);
    const avgDuration = completed > 0 ? totalDuration / completed : 0;
    const hours = Math.floor(avgDuration / (1000 * 60 * 60));
    const minutes = Math.floor((avgDuration % (1000 * 60 * 60)) / (1000 * 60));

    return {
      total: sessions.length,
      completed,
      scheduled: sessions.filter(s => s.status === 'scheduled').length,
      avgDuration: `${hours}h ${minutes}min`,
    };
  }, [sessions]);

  // Toggle sessão expandida
  const toggleSession = (sessionId: string) => {
    setExpandedSession(prev => prev === sessionId ? null : sessionId);
  };

  // Expande/colapsa todas
  const expandAll = () => {
    if (expandedSession) {
      setExpandedSession(null);
    } else if (filteredSessions.length > 0) {
      setExpandedSession(filteredSessions[0].id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg tracking-wider text-primary">
            DIÁRIO DA CAMPANHA
          </h3>
        </div>

        {/* Estatísticas rápidas */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{stats.completed} sessões jogadas</span>
          {stats.avgDuration !== '0h 0min' && (
            <span>• Média: {stats.avgDuration}</span>
          )}
        </div>
      </div>

      {/* Barra de ferramentas */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Busca */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar sessões..."
            className="pl-9"
          />
        </div>

        {/* Filtro de status */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              {filterStatus === 'all' && 'Todas'}
              {filterStatus === 'completed' && 'Concluídas'}
              {filterStatus === 'scheduled' && 'Agendadas'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterStatus('all')}>
              Todas as sessões
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('completed')}>
              Apenas concluídas
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('scheduled')}>
              Apenas agendadas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Ordenação */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
        >
          {sortOrder === 'newest' ? (
            <>
              <ChevronDown className="w-4 h-4 mr-2" />
              Mais recentes
            </>
          ) : (
            <>
              <ChevronUp className="w-4 h-4 mr-2" />
              Mais antigas
            </>
          )}
        </Button>
      </div>

      {/* Tabs de visualização */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="w-full max-w-[300px]">
          <TabsTrigger value="timeline" className="flex-1">
            <Calendar className="w-4 h-4 mr-2" />
            Cronológico
          </TabsTrigger>
          <TabsTrigger value="list" className="flex-1">
            <ListOrdered className="w-4 h-4 mr-2" />
            Lista
          </TabsTrigger>
        </TabsList>

        {/* Timeline View */}
        <TabsContent value="timeline" className="mt-4">
          <ScrollArea className="h-[500px] pr-4">
            <div className="relative">
              {/* Linha do tempo vertical */}
              <div className="absolute left-[31px] top-6 bottom-6 w-0.5 bg-border" />

              <div className="space-y-4">
                {filteredSessions.map((session) => (
                  <SessionDiaryEntry
                    key={session.id}
                    session={session}
                    sessionNotes={notesBySession[session.id] || []}
                    isMaster={isMaster}
                    isExpanded={expandedSession === session.id}
                    onToggle={() => toggleSession(session.id)}
                    onSaveSummary={saveSummary}
                  />
                ))}

                {filteredSessions.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma sessão encontrada</p>
                    {searchQuery && (
                      <p className="text-sm mt-2">Tente buscar por outro termo</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* List View - Simplificada */}
        <TabsContent value="list" className="mt-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="ordo-panel p-4 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => toggleSession(session.id)}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-display text-lg text-primary w-8">
                      {session.session_number}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {session.title || `Sessão ${session.session_number}`}
                      </h4>
                      {session.started_at && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.started_at).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      session.status === 'completed' 
                        ? 'bg-green-500/20 text-green-400' 
                        : session.status === 'active'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {session.status === 'completed' && 'Concluída'}
                      {session.status === 'active' && 'Em Andamento'}
                      {session.status === 'scheduled' && 'Agendada'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * SessionManager - Componente para gerenciar sessões da campanha (painel do mestre)
 * Permite criar, iniciar, pausar e encerrar sessões
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { normalizeCampaignSession } from '@/lib/campaign-realtime-compat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
// ScrollArea removido - usando overflow nativo para evitar bug #185 com React 19
import { SessionCard } from './SessionCard';
import { sendPushNotification } from '@/hooks';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Loader2,
  CalendarDays,
  History,
} from 'lucide-react';

// Tipo para sessão da campanha
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

interface SessionManagerProps {
  campaignId: string;
  campaignName?: string;
  currentSession: number;
  isMaster: boolean;
  onSessionUpdate?: () => void;
}

export function SessionManager({ 
  campaignId, 
  campaignName = 'Campanha',
  currentSession, 
  isMaster,
  onSessionUpdate 
}: SessionManagerProps) {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<CampaignSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state para nova sessão
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionSchedule, setNewSessionSchedule] = useState('');

  // Refs para estabilização (Padrão Ref-First - evita loops #185)
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  const onSessionUpdateRef = useRef(onSessionUpdate);
  useEffect(() => { onSessionUpdateRef.current = onSessionUpdate; }, [onSessionUpdate]);

  // Busca todas as sessões da campanha (memoizado com useCallback)
  const fetchSessions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_sessions')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('session_number', { ascending: false });

      if (error) throw error;
      setSessions((data || []).map(normalizeCampaignSession));
    } catch (error: any) {
      console.error('Erro ao buscar sessões:', error);
      toastRef.current({
        title: 'Erro',
        description: 'Não foi possível carregar as sessões.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  // Subscribe para atualizações em tempo real (memoizado com useCallback)
  const subscribeToSessions = useCallback(() => {
    const channel = supabase
      .channel(`sessions-manager-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_sessions',
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          // Recarrega sessões quando houver mudança
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, fetchSessions]);

  // Busca sessões ao montar
  useEffect(() => {
    fetchSessions();
    const cleanup = subscribeToSessions();
    
    return cleanup;
  }, [fetchSessions, subscribeToSessions]);

  // Cria nova sessão
  const createSession = async () => {
    if (!isMaster) return;

    setCreating(true);
    try {
      const nextNumber = sessions.length > 0 
        ? Math.max(...sessions.map(s => s.session_number)) + 1 
        : 1;

      const sessionTitle = newSessionTitle || `Sessão ${nextNumber}`;
      const scheduledAt = newSessionSchedule || null;

      const { data: newSession, error } = await supabase
        .from('campaign_sessions')
        .insert({
          campaign_id: campaignId,
          session_number: nextNumber,
          title: sessionTitle,
          scheduled_at: scheduledAt,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;

      // Busca membros da campanha para notificação
      const { data: members } = await supabase
        .from('campaign_members')
        .select('user_id')
        .eq('campaign_id', campaignId);

      const userIds = members?.map(m => m.user_id) || [];

      // Envia notificação push para todos os membros
      if (userIds.length > 0) {
        const scheduleText = scheduledAt 
          ? ` agendada para ${new Date(scheduledAt).toLocaleDateString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}`
          : '';
        
        try {
          await sendPushNotification({
            type: 'session_scheduled',
            campaignId,
            sessionId: newSession.id,
            title: `📅 ${campaignName}`,
            body: `Nova sessão "${sessionTitle}"${scheduleText}`,
            userIds
          });
        } catch (pushError) {
          console.error('Error sending push notification:', pushError);
          // Não falha a criação se a notificação falhar
        }
      }

      toastRef.current({ title: 'Sessão criada!', description: `Sessão ${nextNumber} agendada.` });
      setDialogOpen(false);
      setNewSessionTitle('');
      setNewSessionSchedule('');
      fetchSessions();
      onSessionUpdateRef.current?.();
    } catch (error: any) {
      toastRef.current({
        title: 'Erro ao criar sessão',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  // Grava o status aceito pelo schema v1; a leitura o apresenta como active.
  const startSession = async (sessionId: string) => {
    if (!isMaster) return;

    try {
      const { error } = await supabase
        .from('campaign_sessions')
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString() 
        })
        .eq('id', sessionId);

      if (error) throw error;

      toastRef.current({ title: 'Sessão iniciada!' });
      fetchSessions();
      onSessionUpdateRef.current?.();
    } catch (error: any) {
      toastRef.current({
        title: 'Erro ao iniciar sessão',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Encerra uma sessão
  const endSession = async (sessionId: string, summary?: string) => {
    if (!isMaster) return;

    try {
      const session = sessions.find(s => s.id === sessionId);
      
      const { error } = await supabase
        .from('campaign_sessions')
        .update({ 
          status: 'completed', 
          ended_at: new Date().toISOString(),
          summary: summary || null,
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Atualiza current_session da campanha
      if (session) {
        await supabase
          .from('campaigns')
          .update({ current_session: session.session_number })
          .eq('id', campaignId);
      }

      toastRef.current({ title: 'Sessão encerrada!' });
      fetchSessions();
      onSessionUpdateRef.current?.();
    } catch (error: any) {
      toastRef.current({
        title: 'Erro ao encerrar sessão',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Deleta uma sessão
  const deleteSession = async (sessionId: string) => {
    if (!isMaster) return;
    if (!confirm('Deletar esta sessão? Esta ação não pode ser desfeita.')) return;

    try {
      const { error } = await supabase
        .from('campaign_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      toastRef.current({ title: 'Sessão deletada' });
      fetchSessions();
    } catch (error: any) {
      toastRef.current({
        title: 'Erro ao deletar sessão',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Sessão ativa (se houver)
  const activeSession = sessions.find(s => s.status === 'active');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-6">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg tracking-wider text-primary">
            GERENCIAR SESSÕES
          </h3>
        </div>

        {isMaster && (
          <Button 
            onClick={() => setDialogOpen(true)}
            className="font-display"
          >
            <Plus className="w-4 h-4 mr-2" />
            NOVA SESSÃO
          </Button>
        )}
      </div>

      {/* Sessão ativa em destaque */}
      {activeSession && (
        <div className="ordo-panel p-4 border-primary/50 bg-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-display text-sm text-primary">SESSÃO ATIVA</span>
          </div>
          <SessionCard
            session={activeSession}
            isMaster={isMaster}
            isActive
            onStart={startSession}
            onEnd={endSession}
            onDelete={deleteSession}
          />
        </div>
      )}

      {/* Lista de sessões - usando flex-1 e overflow para evitar bug #185 */}
      <div className="flex-1 min-h-[200px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <div className="space-y-3">
          {sessions.filter(s => s.status !== 'active').map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              isMaster={isMaster}
              onStart={startSession}
              onEnd={endSession}
              onDelete={deleteSession}
            />
          ))}

          {sessions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma sessão agendada</p>
              {isMaster && (
                <p className="text-sm mt-2">Clique em "Nova Sessão" para começar</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dialog para criar sessão */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl tracking-wider">
              NOVA SESSÃO
            </DialogTitle>
            <DialogDescription>
              Agende uma nova sessão para sua campanha.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Título (opcional)
              </label>
              <Input
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                placeholder="Ex: A Invasão do Culto"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Data e Hora (opcional)
              </label>
              <Input
                type="datetime-local"
                value={newSessionSchedule}
                onChange={(e) => setNewSessionSchedule(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={createSession} disabled={creating}>
              {creating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              CRIAR SESSÃO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

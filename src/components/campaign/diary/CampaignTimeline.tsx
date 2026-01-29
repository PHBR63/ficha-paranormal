/**
 * CampaignTimeline - Linha do tempo visual da campanha
 * 
 * Exibe eventos importantes cronologicamente.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// ScrollArea removido - usando overflow nativo para evitar bug #185 com React 19
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Calendar,
  Swords,
  Search,
  Skull,
  Star,
  Package,
  Lightbulb,
  MoreVertical,
  Edit2,
  Trash2,
  Loader2,
  Save,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos de evento
type EventType = 'combat' | 'discovery' | 'death' | 'milestone' | 'item';

// Interface do evento
interface TimelineEvent {
  id: string;
  campaign_id: string;
  session_id: string | null;
  event_type: EventType;
  title: string;
  description: string | null;
  event_date: string;
  importance: number;
  metadata: Record<string, any>;
  created_at: string;
}

// Configuração de tipos
const EVENT_CONFIG: Record<EventType, { icon: typeof Swords; label: string; color: string; bgColor: string }> = {
  combat: { icon: Swords, label: 'Combate', color: 'text-red-500', bgColor: 'bg-red-500' },
  discovery: { icon: Lightbulb, label: 'Descoberta', color: 'text-blue-500', bgColor: 'bg-blue-500' },
  death: { icon: Skull, label: 'Morte', color: 'text-gray-500', bgColor: 'bg-gray-500' },
  milestone: { icon: Star, label: 'Marco', color: 'text-yellow-500', bgColor: 'bg-yellow-500' },
  item: { icon: Package, label: 'Item', color: 'text-green-500', bgColor: 'bg-green-500' },
};

interface CampaignTimelineProps {
  campaignId: string;
  isMaster: boolean;
}

export function CampaignTimeline({ campaignId, isMaster }: CampaignTimelineProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Estados
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');
  
  // Handler estável para Select do Radix (evita loop #185)
  const handleFilterTypeChange = useCallback((value: string) => {
    setFilterType(value as EventType | 'all');
  }, []);

  // Dialog
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);

  // Carrega eventos
  useEffect(() => {
    fetchEvents();
  }, [campaignId]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_timeline_events')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('event_date', { ascending: false });

      if (error) throw error;

      setEvents((data || []).map(e => ({
        ...e,
        event_type: e.event_type as EventType,
        metadata: e.metadata as Record<string, any>,
      })));
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast({ title: 'Erro', description: 'Falha ao carregar linha do tempo', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtra eventos
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || e.event_type === filterType;
      return matchesSearch && matchesType;
    });
  }, [events, searchQuery, filterType]);

  // Agrupa eventos por mês
  const groupedEvents = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    
    filteredEvents.forEach(event => {
      const monthKey = format(new Date(event.event_date), 'MMMM yyyy', { locale: ptBR });
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(event);
    });

    return groups;
  }, [filteredEvents]);

  // Handlers
  const handleCreate = () => {
    setEditingEvent(null);
    setEditorOpen(true);
  };

  const handleEdit = (event: TimelineEvent) => {
    setEditingEvent(event);
    setEditorOpen(true);
  };

  const handleDelete = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('campaign_timeline_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setEvents(prev => prev.filter(e => e.id !== eventId));
      toast({ title: 'Evento excluído' });
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      toast({ title: 'Erro', description: 'Falha ao excluir evento', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg tracking-wider">LINHA DO TEMPO</h3>
          <Badge variant="secondary">{events.length}</Badge>
        </div>

        {isMaster && (
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Evento
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar eventos..."
            className="pl-9"
          />
        </div>

        <Select value={filterType} onValueChange={handleFilterTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {(Object.keys(EVENT_CONFIG) as EventType[]).map((type) => {
              const config = EVENT_CONFIG[type];
              const Icon = config.icon;
              return (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <Icon className={cn('w-4 h-4', config.color)} />
                    {config.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      {Object.keys(groupedEvents).length > 0 ? (
        <div className="relative">
          {/* Linha vertical */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([month, monthEvents]) => (
              <div key={month} className="space-y-3">
                {/* Cabeçalho do mês */}
                <div className="flex items-center gap-3 pl-8">
                  <Badge variant="outline" className="font-display capitalize">
                    {month}
                  </Badge>
                </div>

                {/* Eventos do mês */}
                <AnimatePresence mode="popLayout">
                  {monthEvents.map((event) => (
                    <TimelineEventCard
                      key={event.id}
                      event={event}
                      isMaster={isMaster}
                      onEdit={() => handleEdit(event)}
                      onDelete={() => handleDelete(event.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum evento na linha do tempo</p>
          {isMaster && (
            <Button variant="link" size="sm" onClick={handleCreate} className="mt-2">
              Registrar primeiro evento
            </Button>
          )}
        </div>
      )}

      {/* Editor Dialog */}
      <TimelineEventEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        event={editingEvent}
        campaignId={campaignId}
        userId={user?.id || ''}
        onSave={(savedEvent) => {
          if (editingEvent) {
            setEvents(prev => prev.map(e => e.id === savedEvent.id ? savedEvent : e));
          } else {
            setEvents(prev => [savedEvent, ...prev]);
          }
        }}
      />
    </div>
  );
}

// Card de evento
interface TimelineEventCardProps {
  event: TimelineEvent;
  isMaster: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function TimelineEventCard({ event, isMaster, onEdit, onDelete }: TimelineEventCardProps) {
  const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.milestone;
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="relative flex gap-4 pl-1"
    >
      {/* Indicador */}
      <div className={cn(
        'relative z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0',
        config.bgColor
      )}>
        <Icon className="w-4 h-4 text-white" />
      </div>

      {/* Conteúdo */}
      <div className={cn(
        'flex-1 ordo-panel p-4',
        event.importance >= 3 && 'ring-2 ring-primary/30'
      )}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{event.title}</h4>
              {event.importance >= 2 && (
                <Badge variant={event.importance >= 3 ? 'default' : 'secondary'} className="text-xs">
                  {event.importance >= 3 ? 'Importante' : 'Destaque'}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(event.event_date), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>

          {isMaster && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {event.description && (
          <p className="text-sm text-muted-foreground mt-2">
            {event.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// Editor de evento
interface TimelineEventEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: TimelineEvent | null;
  campaignId: string;
  userId: string;
  onSave: (event: TimelineEvent) => void;
}

function TimelineEventEditor({ open, onOpenChange, event, campaignId, userId, onSave }: TimelineEventEditorProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('milestone');
  const [importance, setImportance] = useState(1);
  const [eventDate, setEventDate] = useState('');

  // Reset form
  useEffect(() => {
    if (open) {
      if (event) {
        setTitle(event.title);
        setDescription(event.description || '');
        setEventType(event.event_type);
        setImportance(event.importance);
        setEventDate(event.event_date.slice(0, 16)); // formato datetime-local
      } else {
        setTitle('');
        setDescription('');
        setEventType('milestone');
        setImportance(1);
        setEventDate(new Date().toISOString().slice(0, 16));
      }
    }
  }, [open, event]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Erro', description: 'Título é obrigatório', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const eventData = {
        campaign_id: campaignId,
        title: title.trim(),
        description: description.trim() || null,
        event_type: eventType,
        importance,
        event_date: new Date(eventDate).toISOString(),
        metadata: {},
        created_by: userId,
      };

      if (event) {
        const { data, error } = await supabase
          .from('campaign_timeline_events')
          .update(eventData)
          .eq('id', event.id)
          .select()
          .single();

        if (error) throw error;

        onSave({
          ...data,
          event_type: data.event_type as EventType,
          metadata: data.metadata as Record<string, any>,
        });
        toast({ title: 'Evento atualizado' });
      } else {
        const { data, error } = await supabase
          .from('campaign_timeline_events')
          .insert(eventData)
          .select()
          .single();

        if (error) throw error;

        onSave({
          ...data,
          event_type: data.event_type as EventType,
          metadata: data.metadata as Record<string, any>,
        });
        toast({ title: 'Evento criado' });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast({ title: 'Erro', description: 'Falha ao salvar evento', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {event ? 'Editar Evento' : 'Novo Evento'}
          </DialogTitle>
          <DialogDescription>
            Registre um evento importante da campanha.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="event-title">Título *</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Batalha contra o Cultista"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(EVENT_CONFIG) as EventType[]).map((type) => {
                    const config = EVENT_CONFIG[type];
                    const Icon = config.icon;
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn('w-4 h-4', config.color)} />
                          {config.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Importância</Label>
              <Select value={importance.toString()} onValueChange={(v) => setImportance(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Normal</SelectItem>
                  <SelectItem value="2">Destaque</SelectItem>
                  <SelectItem value="3">Importante</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-date">Data e Hora</Label>
            <Input
              id="event-date"
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-description">Descrição</Label>
            <Textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes do evento..."
              className="h-24 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CampaignTimeline;

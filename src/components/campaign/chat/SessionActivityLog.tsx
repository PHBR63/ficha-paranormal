/**
 * SessionActivityLog - Log de atividades da sessão
 * Mostra histórico de rolagens, eventos e ações importantes
 */
import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ScrollText, 
  Dices, 
  Sparkles, 
  Skull, 
  Heart, 
  Shield, 
  AlertTriangle,
  Filter,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Tipos de atividade
type ActivityType = 'dice_roll' | 'event_ritual' | 'event_damage' | 'event_heal' | 'event_condition' | 'event_attack';

interface ActivityEntry {
  id: string;
  type: ActivityType;
  characterName: string;
  content: string;
  metadata: any;
  timestamp: Date;
}

interface SessionActivityLogProps {
  messages: Array<{
    id: string;
    message_type: string;
    content: string;
    metadata: any;
    created_at: string;
    characters?: { name: string } | null;
    profiles?: { display_name: string | null };
  }>;
  className?: string;
}

// Configuração de tipos de atividade
const ACTIVITY_CONFIG: Record<ActivityType, { 
  icon: React.ReactNode; 
  label: string; 
  color: string;
}> = {
  dice_roll: {
    icon: <Dices className="w-3.5 h-3.5" />,
    label: 'Rolagens',
    color: 'text-accent',
  },
  event_ritual: {
    icon: <Sparkles className="w-3.5 h-3.5" />,
    label: 'Rituais',
    color: 'text-purple-400',
  },
  event_damage: {
    icon: <Skull className="w-3.5 h-3.5" />,
    label: 'Dano',
    color: 'text-destructive',
  },
  event_heal: {
    icon: <Heart className="w-3.5 h-3.5" />,
    label: 'Cura',
    color: 'text-green-400',
  },
  event_condition: {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    label: 'Condições',
    color: 'text-yellow-400',
  },
  event_attack: {
    icon: <Shield className="w-3.5 h-3.5" />,
    label: 'Ataques',
    color: 'text-orange-400',
  },
};

// Componente de entrada no log
function ActivityEntry({ entry }: { entry: ActivityEntry }) {
  const config = ACTIVITY_CONFIG[entry.type];
  
  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      {/* Ícone */}
      <div className={cn('mt-0.5', config.color)}>
        {config.icon}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-medium text-foreground truncate">
            {entry.characterName}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(entry.timestamp, { addSuffix: true, locale: ptBR })}
          </span>
        </div>

        {/* Conteúdo resumido */}
        <p className="text-xs text-muted-foreground line-clamp-1">
          {entry.content.replace(/\*\*/g, '').replace(/🎲\s*/g, '')}
        </p>

        {/* Detalhes de rolagem */}
        {entry.type === 'dice_roll' && entry.metadata?.dice && (
          <div className="flex items-center gap-1 mt-1">
            {entry.metadata.dice.map((die: number, i: number) => (
              <span
                key={i}
                className={cn(
                  'w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded',
                  die === entry.metadata.keptDice
                    ? entry.metadata.isCritical
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {die}
              </span>
            ))}
            <span className="text-[10px] text-muted-foreground mx-1">→</span>
            <span className={cn(
              'text-xs font-bold',
              entry.metadata.isCritical && 'text-primary'
            )}>
              {entry.metadata.total || entry.metadata.keptDice}
            </span>
            {entry.metadata.isCritical && (
              <span className="text-[10px] text-primary">★</span>
            )}
          </div>
        )}

        {/* Detalhes de dano/cura */}
        {(entry.type === 'event_damage' || entry.type === 'event_heal') && entry.metadata?.amount && (
          <span className={cn(
            'text-xs font-bold mt-1 inline-block',
            entry.type === 'event_heal' ? 'text-green-400' : 'text-destructive'
          )}>
            {entry.type === 'event_heal' ? '+' : '-'}{entry.metadata.amount}
          </span>
        )}
      </div>
    </div>
  );
}

export function SessionActivityLog({ messages, className }: SessionActivityLogProps) {
  const [open, setOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<ActivityType>>(new Set());

  // Filtra e transforma mensagens em atividades
  const activities = useMemo(() => {
    const validTypes = Object.keys(ACTIVITY_CONFIG) as ActivityType[];
    
    return messages
      .filter(msg => validTypes.includes(msg.message_type as ActivityType))
      .map(msg => ({
        id: msg.id,
        type: msg.message_type as ActivityType,
        characterName: msg.characters?.name || msg.profiles?.display_name || 'Anônimo',
        content: msg.content,
        metadata: msg.metadata,
        timestamp: new Date(msg.created_at),
      }))
      .reverse(); // Mais recentes primeiro
  }, [messages]);

  // Aplica filtros
  const filteredActivities = useMemo(() => {
    if (activeFilters.size === 0) return activities;
    return activities.filter(a => activeFilters.has(a.type));
  }, [activities, activeFilters]);

  // Toggle filtro
  const toggleFilter = (type: ActivityType) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(type)) {
      newFilters.delete(type);
    } else {
      newFilters.add(type);
    }
    setActiveFilters(newFilters);
  };

  // Estatísticas
  const stats = useMemo(() => {
    const counts: Record<ActivityType, number> = {} as Record<ActivityType, number>;
    activities.forEach(a => {
      counts[a.type] = (counts[a.type] || 0) + 1;
    });
    return counts;
  }, [activities]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          title="Log de Atividades"
          className={cn("w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 relative", className)}
        >
          <ScrollText className="w-4 h-4" />
          {activities.length > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center text-[10px]"
            >
              {activities.length > 99 ? '99+' : activities.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        className="w-80 p-0 max-h-[70vh]" 
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-primary" />
            <span className="font-display text-sm tracking-wider">LOG DA SESSÃO</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {filteredActivities.length} atividades
          </span>
        </div>

        {/* Filtros */}
        <div className="p-2 border-b border-border">
          <div className="flex flex-wrap gap-1">
            {(Object.entries(ACTIVITY_CONFIG) as [ActivityType, typeof ACTIVITY_CONFIG[ActivityType]][]).map(([type, config]) => (
              <Button
                key={type}
                variant={activeFilters.has(type) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleFilter(type)}
                className={cn(
                  'h-6 px-2 text-[10px] gap-1',
                  !activeFilters.has(type) && config.color
                )}
              >
                {config.icon}
                {config.label}
                {stats[type] > 0 && (
                  <span className="text-[9px] opacity-70">({stats[type]})</span>
                )}
              </Button>
            ))}
            
            {activeFilters.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFilters(new Set())}
                className="h-6 px-2 text-[10px]"
              >
                <X className="w-3 h-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Lista de atividades */}
        <ScrollArea className="h-[400px]">
          <div className="p-2 space-y-1">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma atividade ainda</p>
                <p className="text-xs">Rolagens e eventos aparecerão aqui</p>
              </div>
            ) : (
              filteredActivities.map(entry => (
                <ActivityEntry key={entry.id} entry={entry} />
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

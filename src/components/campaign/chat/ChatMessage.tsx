/**
 * ChatMessage - Componente de mensagem com renderização rica
 * Suporta texto, rolagens, eventos do sistema e formatação markdown básica
 */
import { useMemo } from 'react';
import { Crown, Dices, AlertTriangle, Sparkles, Skull, Heart, Shield, Zap, ScrollText, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos de mensagem suportados
export type MessageType = 
  | 'chat' 
  | 'dice_roll' 
  | 'system' 
  | 'whisper' 
  | 'event_ritual' 
  | 'event_damage'
  | 'event_heal'
  | 'event_condition'
  | 'event_attack'
  | 'event_defense';

export interface ChatMessageData {
  id: string;
  user_id: string;
  character_id: string | null;
  message_type: string;
  content: string;
  metadata: any;
  created_at: string;
  profiles?: {
    display_name: string | null;
  };
  characters?: {
    name: string;
  } | null;
}

interface ChatMessageProps {
  message: ChatMessageData;
  currentUserId: string;
  masterId: string;
  className?: string;
}

// Ícone baseado no tipo de mensagem
const getMessageIcon = (type: string) => {
  switch (type) {
    case 'dice_roll':
      return <Dices className="w-3.5 h-3.5 text-accent" />;
    case 'event_ritual':
      return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
    case 'event_damage':
      return <Skull className="w-3.5 h-3.5 text-destructive" />;
    case 'event_heal':
      return <Heart className="w-3.5 h-3.5 text-green-400" />;
    case 'event_condition':
      return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />;
    case 'event_attack':
      return <Target className="w-3.5 h-3.5 text-orange-400" />;
    case 'event_defense':
      return <Shield className="w-3.5 h-3.5 text-blue-400" />;
    case 'system':
      return <Zap className="w-3.5 h-3.5 text-muted-foreground" />;
    default:
      return null;
  }
};

// Parseia formatação markdown básica
const parseContent = (content: string): React.ReactNode => {
  // Suporta **bold** e *italic*
  const parts = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\])/g);
  
  return parts.map((part, index) => {
    // Bold
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    // Italic
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="italic text-muted-foreground">
          {part.slice(1, -1)}
        </em>
      );
    }
    // Dados [1, 15, 8]
    if (part.startsWith('[') && part.endsWith(']')) {
      return (
        <span key={index} className="font-mono text-accent bg-accent/10 px-1 rounded">
          {part}
        </span>
      );
    }
    return part;
  });
};

// Renderiza dados de rolagem visual
const DiceRollDisplay = ({ metadata }: { metadata: any }) => {
  if (!metadata?.dice) return null;

  const { dice, keptDice, isCritical, skillBonus, total } = metadata;

  return (
    <div className="flex items-center gap-2 mt-2 flex-wrap">
      {/* Dados individuais */}
      <div className="flex gap-1">
        {dice.map((die: number, i: number) => (
          <span
            key={i}
            className={cn(
              'w-7 h-7 flex items-center justify-center text-xs font-bold rounded border',
              die === keptDice
                ? isCritical
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-accent text-accent-foreground border-accent'
                : 'bg-muted text-muted-foreground border-border'
            )}
          >
            {die}
          </span>
        ))}
      </div>

      {/* Bônus de perícia */}
      {skillBonus > 0 && (
        <span className="text-xs text-accent font-medium">+{skillBonus}</span>
      )}

      {/* Resultado */}
      <span className="text-muted-foreground">=</span>
      <span className={cn(
        'font-display text-lg font-bold',
        isCritical ? 'text-primary' : 'text-foreground'
      )}>
        {total || keptDice}
      </span>

      {/* Indicadores */}
      {isCritical && (
        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded font-bold animate-pulse">
          ★ CRÍTICO!
        </span>
      )}
    </div>
  );
};

// Renderiza evento de ritual
const RitualEventDisplay = ({ metadata }: { metadata: any }) => {
  if (!metadata) return null;

  const { ritualName, element, circle, peCost, enhancements } = metadata;

  const elementColors: Record<string, string> = {
    'Conhecimento': 'text-yellow-400',
    'Energia': 'text-purple-400',
    'Morte': 'text-gray-400',
    'Sangue': 'text-red-400',
    'Medo': 'text-slate-400',
  };

  return (
    <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
      <span className={cn('font-medium', elementColors[element] || 'text-purple-400')}>
        {element} {circle}º Círculo
      </span>
      <span className="text-muted-foreground">•</span>
      <span className="text-accent">{peCost} PE</span>
      {enhancements?.length > 0 && (
        <>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{enhancements.length} aprimoramentos</span>
        </>
      )}
    </div>
  );
};

// Renderiza evento de dano/cura
const DamageEventDisplay = ({ metadata, isHeal }: { metadata: any; isHeal?: boolean }) => {
  if (!metadata) return null;

  const { amount, damageType, targetName } = metadata;

  return (
    <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
      <span className={cn(
        'font-bold text-base',
        isHeal ? 'text-green-400' : 'text-destructive'
      )}>
        {isHeal ? '+' : '-'}{amount}
      </span>
      {damageType && (
        <span className="text-muted-foreground capitalize">{damageType}</span>
      )}
      {targetName && (
        <>
          <span className="text-muted-foreground">→</span>
          <span className="text-foreground">{targetName}</span>
        </>
      )}
    </div>
  );
};

export function ChatMessage({ message, currentUserId, masterId, className }: ChatMessageProps) {
  const isOwn = message.user_id === currentUserId;
  const isMasterMsg = message.user_id === masterId;
  const messageType = message.message_type as MessageType;

  // Determina estilo baseado no tipo
  const messageStyles = useMemo(() => {
    switch (messageType) {
      case 'system':
        return 'mx-auto text-center bg-muted/30 text-muted-foreground text-sm max-w-[90%]';
      case 'dice_roll':
        return cn(
          'bg-accent/5 border border-accent/20',
          isOwn ? 'ml-auto' : ''
        );
      case 'whisper':
        return cn(
          'bg-primary/5 border border-primary/30 border-dashed',
          isOwn ? 'ml-auto' : ''
        );
      case 'event_ritual':
        return 'bg-purple-500/10 border border-purple-500/20';
      case 'event_damage':
        return 'bg-destructive/10 border border-destructive/20';
      case 'event_heal':
        return 'bg-green-500/10 border border-green-500/20';
      case 'event_condition':
        return 'bg-yellow-500/10 border border-yellow-500/20';
      case 'event_attack':
        return 'bg-orange-500/10 border border-orange-500/20';
      case 'event_defense':
        return 'bg-blue-500/10 border border-blue-500/20';
      default:
        return isOwn
          ? 'ml-auto bg-primary/10 border border-primary/20'
          : 'bg-card border border-border';
    }
  }, [messageType, isOwn]);

  // Eventos não mostram como mensagem própria
  const isEvent = messageType.startsWith('event_');

  return (
    <div
      className={cn(
        'max-w-[80%] rounded-lg p-3 animate-fade-in',
        messageStyles,
        className
      )}
    >
      {/* Header */}
      {messageType !== 'system' && (
        <div className="flex items-center gap-2 mb-1">
          {/* Ícone do tipo */}
          {getMessageIcon(messageType)}
          
          {/* Coroa do mestre */}
          {isMasterMsg && !isEvent && <Crown className="w-3 h-3 text-primary" />}
          
          {/* Nome */}
          <span className="text-xs font-medium text-muted-foreground">
            {message.characters?.name || message.profiles?.display_name || 'Anônimo'}
          </span>
          
          {/* Timestamp */}
          <span className="text-xs text-foreground/50 ml-auto">
            {new Date(message.created_at).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      )}

      {/* Conteúdo */}
      <p className={cn(
        'text-sm',
        messageType === 'dice_roll' && 'font-medium',
        isEvent && 'text-muted-foreground'
      )}>
        {parseContent(message.content)}
      </p>

      {/* Displays especiais baseados no tipo */}
      {messageType === 'dice_roll' && message.metadata?.dice && (
        <DiceRollDisplay metadata={message.metadata} />
      )}
      
      {messageType === 'event_ritual' && (
        <RitualEventDisplay metadata={message.metadata} />
      )}
      
      {(messageType === 'event_damage' || messageType === 'event_heal') && (
        <DamageEventDisplay 
          metadata={message.metadata} 
          isHeal={messageType === 'event_heal'} 
        />
      )}
    </div>
  );
}

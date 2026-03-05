/**
 * ChatTab - Aba de chat da campanha v3
 * 
 * Sistema de chat completo com:
 * - Lista virtualizada de mensagens
 * - Input de mensagem com controles
 * - Suporte a dados integrado
 * 
 * Layout com altura explícita para evitar bugs de scroll
 * 
 * @module components/campaign/v3/tabs/ChatTab
 */

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Dice6, ArrowDown, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CampaignMessage } from '@/hooks/campaign/useCampaignRealtime';

interface ChatTabProps {
  /** Array de mensagens */
  messages: CampaignMessage[];
  /** ID do usuário atual */
  currentUserId: string;
  /** ID do mestre */
  masterId: string;
  /** Se o usuário é o mestre da campanha */
  isMaster?: boolean;
  /** Callback para enviar mensagem */
  onSendMessage: (content: string, type?: CampaignMessage['message_type'], metadata?: Record<string, unknown>) => Promise<boolean>;
  /** Callback para aplicar dano a um personagem (Fase C) */
  onApplyDamage?: (characterId: string, amount: number, characterName: string) => Promise<boolean>;
  /** Callback para marcar como lidas */
  onMarkAsRead?: () => void;
  /** Classe CSS adicional */
  className?: string;
}

// Altura estimada de mensagem para virtualização
const ESTIMATED_MESSAGE_HEIGHT = 72;
const SCROLL_THRESHOLD = 100;

// Componente de mensagem individual
const ChatMessageItem = memo(function ChatMessageItem({
  message,
  currentUserId,
  masterId,
  isMaster,
  onApplyDamage,
}: {
  message: CampaignMessage;
  currentUserId: string;
  masterId: string;
  isMaster?: boolean;
  onApplyDamage?: (characterId: string, amount: number, characterName: string) => Promise<boolean>;
}) {
  const [applying, setApplying] = useState(false);
  const isOwn = message.user_id === currentUserId;
  const isMasterMsg = message.user_id === masterId;
  const isSystem = message.message_type === 'system';
  const isDiceRoll = message.message_type === 'dice_roll';
  const isDamageEvent = message.message_type === 'event_damage';
  const isHealEvent = message.message_type === 'event_heal';
  
  // Nome do remetente
  const senderName = message.characters?.name 
    || message.profiles?.display_name 
    || 'Anônimo';
  
  // Formata hora
  const time = new Date(message.created_at).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Mensagem de sistema
  if (isSystem) {
    return (
      <div className="flex justify-center py-1">
        <span className="text-xs text-muted-foreground italic px-3 py-1 bg-muted/50 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  // Rolagem de dados
  if (isDiceRoll && message.metadata) {
    const metadata = message.metadata as {
      rolls?: number[];
      total?: number;
      expression?: string;
    };
    
    return (
      <div className={cn(
        'flex gap-2 px-3 py-1.5',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}>
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback className="text-[10px]">
            {senderName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className={cn(
          'max-w-[75%] rounded-lg px-3 py-2',
          'bg-primary/10 border border-primary/20'
        )}>
          <div className="flex items-center gap-2 mb-1">
            <Dice6 className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">
              {metadata.expression}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              [{metadata.rolls?.join(', ')}]
            </span>
            <span className="text-sm font-bold text-primary">
              = {metadata.total}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">
            {senderName} • {time}
          </span>
        </div>
      </div>
    );
  }

  // Mensagem normal
  return (
    <div className={cn(
      'flex gap-2 px-3 py-1.5',
      isOwn ? 'flex-row-reverse' : 'flex-row'
    )}>
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarFallback className="text-[10px]">
          {senderName.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn(
        'max-w-[75%] rounded-lg px-3 py-2',
        isOwn 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted'
      )}>
        {/* Header com nome (apenas para outros) */}
        {!isOwn && (
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-medium">
              {senderName}
            </span>
            {isMaster && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                Mestre
              </Badge>
            )}
          </div>
        )}
        
        <p className="text-sm break-words whitespace-pre-wrap">
          {message.content}
        </p>
        
        <span className={cn(
          'text-[10px] mt-1 block',
          isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
        )}>
          {time}
        </span>
      </div>
    </div>
  );
});

export const ChatTab = memo(function ChatTab({
  messages,
  currentUserId,
  masterId,
  onSendMessage,
  onMarkAsRead,
  className,
}: ChatTabProps) {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const parentRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);
  
  // Virtualizer
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_MESSAGE_HEIGHT,
    overscan: 5,
  });

  // Handler de scroll
  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    const atBottom = distanceFromBottom < SCROLL_THRESHOLD;
    setIsAtBottom(atBottom);
    setShowScrollButton(!atBottom && messages.length > 10);
    
    if (atBottom) {
      onMarkAsRead?.();
    }
  }, [messages.length, onMarkAsRead]);

  // Auto-scroll para novas mensagens
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current && isAtBottom) {
      virtualizer.scrollToIndex(messages.length - 1, { 
        align: 'end',
        behavior: 'smooth',
      });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, isAtBottom, virtualizer]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    virtualizer.scrollToIndex(messages.length - 1, { 
      align: 'end',
      behavior: 'smooth',
    });
  }, [virtualizer, messages.length]);

  // Enviar mensagem
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isSending) return;
    
    setIsSending(true);
    const success = await onSendMessage(inputValue.trim());
    
    if (success) {
      setInputValue('');
    }
    setIsSending(false);
  }, [inputValue, isSending, onSendMessage]);

  // Enter para enviar
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Lista de mensagens (altura explícita) */}
      <div className="flex-1 min-h-0 relative">
        {messages.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma mensagem ainda. Seja o primeiro!
            </p>
          </div>
        ) : (
          <>
            <div 
              ref={parentRef}
              onScroll={handleScroll}
              className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
            >
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const message = messages[virtualRow.index];
                  return (
                    <div
                      key={virtualRow.key}
                      data-index={virtualRow.index}
                      ref={virtualizer.measureElement}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <ChatMessageItem
                        message={message}
                        currentUserId={currentUserId}
                        masterId={masterId}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Botão scroll to bottom */}
            <AnimatePresence>
              {showScrollButton && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2"
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={scrollToBottom}
                    className="shadow-lg bg-card/90 backdrop-blur-sm"
                  >
                    <ArrowDown className="w-4 h-4 mr-1.5" />
                    Novas mensagens
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Input de mensagem */}
      <div className="shrink-0 p-3 border-t border-border/50 bg-card/30">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem..."
            disabled={isSending}
            className="flex-1"
          />
          <Button 
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});

export default ChatTab;

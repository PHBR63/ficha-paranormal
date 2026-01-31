/**
 * VirtualizedChatList - Lista de mensagens virtualizada
 * 
 * Usa @tanstack/react-virtual para renderizar apenas mensagens visíveis,
 * suportando milhares de mensagens sem perda de performance.
 * 
 * Recursos:
 * - Auto-scroll para novas mensagens
 * - Estimativa dinâmica de altura
 * - Overscan para scroll suave
 * - Scroll-to-bottom button
 * 
 * @module components/campaign/chat/VirtualizedChatList
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from './ChatMessage';
import type { CampaignMessage } from '@/hooks/campaign/useCampaignRealtime';
import { cn } from '@/lib/utils';

interface VirtualizedChatListProps {
  /** Array de mensagens da campanha */
  messages: CampaignMessage[];
  /** ID do usuário atual */
  currentUserId: string;
  /** ID do mestre da campanha */
  masterId: string;
  /** Classe CSS adicional */
  className?: string;
}

// Altura estimada base para mensagens (será ajustada dinamicamente)
const ESTIMATED_MESSAGE_HEIGHT = 80;
// Número de itens a renderizar além da área visível
const OVERSCAN_COUNT = 5;
// Distância do fundo para considerar "scrolled to bottom"
const SCROLL_THRESHOLD = 100;

export function VirtualizedChatList({ 
  messages, 
  currentUserId, 
  masterId,
  className,
}: VirtualizedChatListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const prevMessagesLengthRef = useRef(messages.length);

  // Virtualizer configuration
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_MESSAGE_HEIGHT,
    overscan: OVERSCAN_COUNT,
    // Mede itens para altura dinâmica
    measureElement: (element) => {
      return element.getBoundingClientRect().height;
    },
  });

  // Handler para scroll
  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    const atBottom = distanceFromBottom < SCROLL_THRESHOLD;
    setIsAtBottom(atBottom);
    setShowScrollButton(!atBottom && messages.length > 10);
  }, [messages.length]);

  // Auto-scroll para novas mensagens
  useEffect(() => {
    // Se estamos no fundo e chegaram novas mensagens, scroll automático
    if (messages.length > prevMessagesLengthRef.current && isAtBottom) {
      virtualizer.scrollToIndex(messages.length - 1, { 
        align: 'end',
        behavior: 'smooth',
      });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, isAtBottom, virtualizer]);

  // Scroll to bottom handler
  const scrollToBottom = useCallback(() => {
    virtualizer.scrollToIndex(messages.length - 1, { 
      align: 'end',
      behavior: 'smooth',
    });
  }, [virtualizer, messages.length]);

  // Se não há mensagens, mostra placeholder
  if (messages.length === 0) {
    return (
      <div className={cn('flex-1 flex items-center justify-center', className)}>
        <p className="text-muted-foreground text-sm">
          Nenhuma mensagem ainda. Seja o primeiro a falar!
        </p>
      </div>
    );
  }

  return (
    <div className={cn('relative flex-1 min-h-0', className)}>
      {/* Container com scroll */}
      <div 
        ref={parentRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      >
        {/* Container virtual com altura total calculada */}
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {/* Renderiza apenas itens visíveis */}
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
                <div className="px-4 sm:px-6 py-2">
                  <ChatMessage
                    message={message}
                    currentUserId={currentUserId}
                    masterId={masterId}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Botão scroll-to-bottom */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2"
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={scrollToBottom}
              className="shadow-lg bg-card/90 backdrop-blur-sm border-border hover:bg-primary/10"
            >
              <ArrowDown className="w-4 h-4 mr-1.5" />
              Novas mensagens
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

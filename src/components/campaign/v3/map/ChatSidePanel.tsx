/**
 * ChatSidePanel - Painel lateral de chat para o mapa tático fullscreen
 * 
 * Wrapper fino que reutiliza o ChatTab (v3) em modo compacto,
 * posicionado à esquerda do canvas com animação slide-in/out.
 * 
 * @module components/campaign/v3/map/ChatSidePanel
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatTab } from '@/components/campaign/v3/tabs/ChatTab';
import type { CampaignMessage } from '@/hooks/campaign/useCampaignRealtime';

// =====================================================
// TIPOS
// =====================================================

interface ChatSidePanelProps {
  /** Se o painel está aberto */
  open: boolean;
  /** Toggle abrir/fechar */
  onToggle: () => void;
  /** Mensagens da campanha */
  messages: CampaignMessage[];
  /** ID do usuário atual */
  currentUserId: string;
  /** ID do mestre */
  masterId: string;
  /** Callback para enviar mensagem */
  onSendMessage: (
    content: string,
    type?: CampaignMessage['message_type'],
    metadata?: Record<string, unknown>
  ) => Promise<boolean>;
}

// =====================================================
// CONSTANTES DE ANIMAÇÃO
// =====================================================

/** Variantes de animação do painel (espelhado do MapSidePanel) */
const panelVariants = {
  open: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
  closed: {
    x: -320,
    opacity: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
};

// =====================================================
// COMPONENTE
// =====================================================

export const ChatSidePanel = memo(function ChatSidePanel({
  open,
  onToggle,
  messages,
  currentUserId,
  masterId,
  onSendMessage,
}: ChatSidePanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="chat-side-panel"
          initial="closed"
          animate="open"
          exit="closed"
          variants={panelVariants}
          className="absolute top-0 left-0 bottom-0 w-[300px] z-30 flex flex-col bg-card/95 backdrop-blur-md border-r border-border/40 shadow-2xl"
        >
          {/* Header compacto */}
          <div className="h-10 flex items-center justify-between px-3 border-b border-border/30 shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold tracking-wide text-foreground">
                CHAT
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onToggle}
              title="Fechar chat"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Corpo — ChatTab ocupa o restante */}
          <div className="flex-1 min-h-0">
            <ChatTab
              messages={messages}
              currentUserId={currentUserId}
              masterId={masterId}
              onSendMessage={onSendMessage}
            />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
});

export default ChatSidePanel;

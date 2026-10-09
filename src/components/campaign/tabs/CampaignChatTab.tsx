/**
 * CampaignChatTab - Aba de chat stateless para CampaignView
 * 
 * Recebe mensagens e função de envio via props (Singleton Pattern)
 * Usa VirtualizedChatList para performance com milhares de mensagens
 * 
 * @module components/campaign/tabs/CampaignChatTab
 */

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from '@/components/icons/ordem-icons';
import { VirtualizedChatList } from '@/components/campaign/chat/VirtualizedChatList';
import { IntegratedDiceRoller, SessionActivityLog, parseDiceCommand, WhisperDialog } from '@/components/campaign/chat';
import type { CampaignMessage } from '@/hooks/campaign/useCampaignRealtime';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';

interface CampaignChatTabProps {
  campaignId: string;
  messages: CampaignMessage[];
  sendMessage: (content: string, type?: CampaignMessage['message_type'], metadata?: Record<string, unknown>, characterId?: string | null) => Promise<boolean>;
  currentUserId: string;
  masterId: string;
  currentMember?: CampaignMemberV2;
  members: CampaignMemberV2[];
}

export function CampaignChatTab({
  campaignId,
  messages,
  sendMessage,
  currentUserId,
  masterId,
  currentMember,
  members,
}: CampaignChatTabProps) {
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  
  /**
   * Handler para envio de mensagem de chat
   */
  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || sending) return;
    
    // Verifica se é comando de dados
    const diceCommand = parseDiceCommand(messageInput);
    if (diceCommand.isCommand) {
      // Processa comando de dados através do handler de rolagem
      const { rollSkillTest, rollDamage } = await import('@/lib/dice-roller');
      
      let rollContent: string;
      let rollMetadata: Record<string, unknown>;
      
      if (diceCommand.damageType) {
        const { count, sides, bonus } = diceCommand.damageType;
        const result = rollDamage({
          diceCount: count,
          diceType: sides,
          bonusDamage: bonus,
        });
        
        const bonusText = bonus > 0 ? `+${bonus}` : '';
        rollContent = `🎲 ${diceCommand.label}: ${count}d${sides}${bonusText} [${result.dice.join(', ')}] → **${result.total}**`;
        rollMetadata = {
          dice: result.dice,
          total: result.total,
          bonusDamage: result.bonusDamage,
          damageType: diceCommand.label,
          isDamage: true,
        };
      } else {
        const result = rollSkillTest({
          attributeValue: diceCommand.diceCount || 1,
          skillBonus: diceCommand.bonus || 0,
          label: diceCommand.label || 'Teste',
        });
        
        const bonusText = result.skillBonus > 0 ? ` +${result.skillBonus}` : '';
        const critText = result.isCritical ? ' ★ CRÍTICO!' : '';
        rollContent = `🎲 ${result.label}: [${result.dice.join(', ')}]${bonusText} → **${result.total}**${critText}`;
        rollMetadata = {
          dice: result.dice,
          keptDice: result.keptDice,
          skillBonus: result.skillBonus,
          total: result.total,
          isCritical: result.isCritical,
          isDisadvantage: result.isDisadvantage,
          label: result.label,
        };
      }
      
      await handleDiceRoll(rollContent, 'dice_roll', rollMetadata);
      setMessageInput('');
      return;
    }
    
    setSending(true);
    try {
      await sendMessage(messageInput, 'chat', undefined, currentMember?.character_id);
      setMessageInput('');
    } finally {
      setSending(false);
    }
  }, [messageInput, sending, sendMessage, currentMember?.character_id]);
  
  /**
   * Handler para rolagens de dados
   */
  const handleDiceRoll = useCallback(async (
    content: string,
    type: 'dice_roll',
    metadata: Record<string, unknown>
  ) => {
    setSending(true);
    try {
      await sendMessage(content, type, metadata, currentMember?.character_id);
    } finally {
      setSending(false);
    }
  }, [sendMessage, currentMember?.character_id]);
  
  // Mensagens são passadas diretamente - VirtualizedChatList usa CampaignMessage
  
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Área de mensagens virtualizadas */}
      <VirtualizedChatList
        messages={messages}
        currentUserId={currentUserId}
        masterId={masterId}
        className="flex-1"
      />
      
      {/* Input de mensagem - Responsivo em telas grandes */}
      <div className="shrink-0 p-4 sm:p-6 border-t border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Rolador de Dados Integrado */}
            <IntegratedDiceRoller
              onRoll={handleDiceRoll}
              characterName={currentMember?.characters?.name}
              disabled={sending}
            />
            
            {/* Log de Atividades */}
            <SessionActivityLog messages={messages as any} />
            
            {/* Botão de Sussurros */}
            <WhisperDialog
              campaignId={campaignId}
              members={members as any}
              currentCharacterId={currentMember?.character_id}
            />
            
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              disabled={sending}
              className="text-sm sm:text-base h-11 sm:h-12"
            />
            <Button
              onClick={handleSendMessage}
              disabled={sending || !messageInput.trim()}
              size="lg"
              className="h-11 sm:h-12 px-4 sm:px-6"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

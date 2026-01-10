/**
 * Dialog para enviar sussurros (mensagens privadas) na campanha
 */

import React, { useState } from 'react';
import { MessageSquare, Send, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWhispers, Whisper } from '@/hooks/campaign/useWhispers';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface CampaignMember {
  id: string;
  user_id: string;
  character_id: string | null;
  profiles?: { display_name: string | null };
  characters?: { name: string } | null;
}

interface WhisperDialogProps {
  campaignId: string;
  members: CampaignMember[];
  currentCharacterId?: string | null;
}

export function WhisperDialog({ campaignId, members, currentCharacterId }: WhisperDialogProps) {
  const { user } = useAuth();
  const { whispers, sendWhisper } = useWhispers(campaignId);
  
  const [open, setOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Filtrar membros para não mostrar o próprio usuário
  const otherMembers = members.filter(m => m.user_id !== user?.id);

  // Filtrar sussurros pela conversa selecionada
  const filteredWhispers = whispers.filter(w =>
    (w.user_id === user?.id && w.recipient_id === selectedRecipient) ||
    (w.recipient_id === user?.id && w.user_id === selectedRecipient)
  );

  // Agrupar sussurros por conversa para mostrar lista de conversas
  const conversations = otherMembers.map(member => {
    const memberWhispers = whispers.filter(w =>
      (w.user_id === user?.id && w.recipient_id === member.user_id) ||
      (w.recipient_id === user?.id && w.user_id === member.user_id)
    );
    const lastWhisper = memberWhispers[memberWhispers.length - 1];
    return {
      member,
      lastWhisper,
      count: memberWhispers.length,
    };
  }).filter(c => c.count > 0 || selectedRecipient === c.member.user_id);

  const handleSend = async () => {
    if (!selectedRecipient || !messageContent.trim()) return;
    
    setIsSending(true);
    await sendWhisper(selectedRecipient, messageContent.trim(), currentCharacterId || undefined);
    setMessageContent('');
    setIsSending(false);
  };

  const getMemberName = (member: CampaignMember) => {
    return member.characters?.name || member.profiles?.display_name || 'Jogador';
  };

  // Contar mensagens não lidas (simples - todas recebidas quando o dialog estava fechado)
  const unreadCount = whispers.filter(w => w.recipient_id === user?.id).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Lock className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Sussurros
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[400px]">
          {/* Seletor de destinatário */}
          <div className="mb-3">
            <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um destinatário..." />
              </SelectTrigger>
              <SelectContent>
                {otherMembers.map(member => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {getMemberName(member)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de mensagens */}
          <ScrollArea className="flex-1 border rounded-lg p-3 bg-muted/20">
            {!selectedRecipient ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                <p>Selecione alguém para conversar</p>
              </div>
            ) : filteredWhispers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                <Lock className="w-8 h-8 mb-2 opacity-50" />
                <p>Nenhuma mensagem ainda</p>
                <p className="text-xs">Envie um sussurro secreto!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredWhispers.map(whisper => {
                  const isOwn = whisper.user_id === user?.id;
                  
                  return (
                    <div
                      key={whisper.id}
                      className={cn(
                        "max-w-[85%] p-2 rounded-lg",
                        isOwn 
                          ? "ml-auto bg-primary/20 border border-primary/30"
                          : "bg-card border border-border"
                      )}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <Lock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          {isOwn ? 'Você' : whisper.sender_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {new Date(whisper.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm">{whisper.content}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Input de mensagem */}
          {selectedRecipient && (
            <div className="flex gap-2 mt-3">
              <Input
                value={messageContent}
                onChange={e => setMessageContent(e.target.value)}
                placeholder="Digite seu sussurro..."
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                disabled={isSending}
              />
              <Button 
                onClick={handleSend} 
                disabled={!messageContent.trim() || isSending}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default WhisperDialog;

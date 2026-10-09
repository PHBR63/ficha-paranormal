/**
 * QuickNotesModal - Modal de notas rápidas com persistência local
 * 
 * Usa localStorage por campanha para salvar rascunhos rápidos.
 * Acessível a todos os jogadores via StatusBar.
 * 
 * @module components/campaign/v3/modals/QuickNotesModal
 */

import { memo, useState, useEffect, useCallback } from 'react';
import { FileText, Trash2, Save } from '@/components/icons/ordem-icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface QuickNotesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
}

/** Chave no localStorage para notas rápidas */
const getStorageKey = (campaignId: string) => `op-quick-notes-${campaignId}`;

export const QuickNotesModal = memo(function QuickNotesModal({
  open,
  onOpenChange,
  campaignId,
}: QuickNotesModalProps) {
  const [notes, setNotes] = useState('');

  // Carregar notas salvas ao abrir
  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem(getStorageKey(campaignId));
      setNotes(saved || '');
    }
  }, [open, campaignId]);

  // Salvar automaticamente ao fechar
  const handleClose = useCallback((isOpen: boolean) => {
    if (!isOpen && notes.trim()) {
      localStorage.setItem(getStorageKey(campaignId), notes);
    }
    onOpenChange(isOpen);
  }, [notes, campaignId, onOpenChange]);

  // Salvar manualmente
  const handleSave = useCallback(() => {
    localStorage.setItem(getStorageKey(campaignId), notes);
    toast.success('Notas salvas!');
  }, [notes, campaignId]);

  // Limpar notas
  const handleClear = useCallback(() => {
    setNotes('');
    localStorage.removeItem(getStorageKey(campaignId));
    toast.success('Notas limpas');
  }, [campaignId]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Notas Rápidas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anote informações importantes da sessão..."
            rows={10}
            className="resize-none"
          />

          <div className="flex items-center gap-2">
            <Button onClick={handleSave} className="flex-1 gap-1.5">
              <Save className="h-4 w-4" />
              Salvar
            </Button>
            <Button variant="outline" size="icon" onClick={handleClear}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Salvo localmente no navegador. Não é compartilhado com outros jogadores.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
});

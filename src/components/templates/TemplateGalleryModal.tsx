/**
 * Modal da Galeria de Templates
 * Exibe a galeria de templates em um dialog modal
 * 
 * @module components/templates/TemplateGalleryModal
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TemplateGallery } from './TemplateGallery';
import type { CharacterTemplate, TemplateWithAuthor } from '@/types/templates';
import { Package } from 'lucide-react';

interface TemplateGalleryModalProps {
  /** Se o modal está aberto */
  open: boolean;
  /** Callback para fechar o modal */
  onOpenChange: (open: boolean) => void;
  /** Callback quando um template é aplicado */
  onApply: (template: CharacterTemplate | TemplateWithAuthor) => void;
}

export function TemplateGalleryModal({
  open,
  onOpenChange,
  onApply,
}: TemplateGalleryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-3 font-display text-xl tracking-wider">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-foreground">GALERIA DE TEMPLATES</span>
              <p className="text-sm font-normal text-muted-foreground mt-0.5">
                Escolha um template para começar rapidamente
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <TemplateGallery
            onApply={onApply}
            closeOnApply={true}
            onClose={() => onOpenChange(false)}
            className="h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Modal de Ajuda de Atalhos de Teclado
 * 
 * Exibe a lista de atalhos disponíveis na ficha de personagem
 * em um modal acessível e bem formatado.
 * 
 * @module components/ui/KeyboardShortcutsHelp
 */

import React from 'react';
import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DEFAULT_SHORTCUTS } from '@/hooks/useSheetKeyboardShortcuts';
import { cn } from '@/lib/utils';

export interface KeyboardShortcutsHelpProps {
  /** Controle externo de visibilidade */
  open?: boolean;
  /** Callback ao mudar visibilidade */
  onOpenChange?: (open: boolean) => void;
  /** Atalhos adicionais para exibir */
  additionalShortcuts?: Array<{ key: string; description: string }>;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Componente de tecla estilizada
 */
function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-medium bg-muted border border-border rounded shadow-sm">
      {children}
    </kbd>
  );
}

/**
 * Parseia string de atalho em componentes de tecla
 */
function renderKeyCombo(keyString: string) {
  const parts = keyString.split(/\s*\+\s*|\s+ou\s+/i);
  
  return (
    <span className="inline-flex items-center gap-1">
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {index > 0 && keyString.includes('ou') && index === parts.length - 1 ? (
            <span className="text-muted-foreground text-xs mx-1">ou</span>
          ) : index > 0 ? (
            <span className="text-muted-foreground">+</span>
          ) : null}
          <KeyBadge>{part.trim()}</KeyBadge>
        </React.Fragment>
      ))}
    </span>
  );
}

/**
 * Modal de ajuda de atalhos de teclado
 */
export const KeyboardShortcutsHelp = React.memo(function KeyboardShortcutsHelp({
  open,
  onOpenChange,
  additionalShortcuts = [],
  className,
}: KeyboardShortcutsHelpProps) {
  const allShortcuts = [...DEFAULT_SHORTCUTS, ...additionalShortcuts];

  // Agrupar atalhos por categoria
  const rollingShortcuts = allShortcuts.filter(s => 
    s.description.toLowerCase().includes('rolar') || 
    s.description.toLowerCase().includes('rolagem')
  );
  const navigationShortcuts = allShortcuts.filter(s => 
    s.description.toLowerCase().includes('abrir') || 
    s.description.toLowerCase().includes('painel')
  );
  const otherShortcuts = allShortcuts.filter(s => 
    !rollingShortcuts.includes(s) && !navigationShortcuts.includes(s)
  );

  const renderGroup = (title: string, shortcuts: typeof allShortcuts) => (
    shortcuts.length > 0 && (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground">{title}</h4>
        <div className="space-y-1.5">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm">{shortcut.description}</span>
              {renderKeyCombo(shortcut.key)}
            </div>
          ))}
        </div>
      </div>
    )
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', className)}
          title="Atalhos de teclado (F1)"
          aria-label="Atalhos de teclado"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Atalhos de Teclado
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {renderGroup('Rolagens', rollingShortcuts)}
            {renderGroup('Navegação', navigationShortcuts)}
            {renderGroup('Outros', otherShortcuts)}
          </div>
        </ScrollArea>
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Pressione <KeyBadge>F1</KeyBadge> ou <KeyBadge>?</KeyBadge> para abrir esta ajuda
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default KeyboardShortcutsHelp;

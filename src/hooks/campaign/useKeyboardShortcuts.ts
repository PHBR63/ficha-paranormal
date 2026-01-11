/**
 * useKeyboardShortcuts - Hook para atalhos de teclado no combate
 * 
 * Gerencia atalhos globais e contextuais para ações de combate.
 */

import { useEffect, useCallback, useRef, useState } from 'react';

// Interface para atalho
export interface KeyboardShortcut {
  key: string;
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };
  action: () => void;
  description: string;
  category: 'combat' | 'navigation' | 'dice' | 'general';
  enabled?: boolean;
}

// Props do hook
export interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  preventDefault?: boolean;
}

// Retorno do hook
export interface UseKeyboardShortcutsReturn {
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  activeShortcuts: KeyboardShortcut[];
  getShortcutLabel: (shortcut: KeyboardShortcut) => string;
}

/**
 * Formata label do atalho para exibição
 */
export function formatShortcutLabel(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  
  if (shortcut.modifiers?.ctrl) parts.push('Ctrl');
  if (shortcut.modifiers?.shift) parts.push('Shift');
  if (shortcut.modifiers?.alt) parts.push('Alt');
  if (shortcut.modifiers?.meta) parts.push('⌘');
  
  // Formata tecla especial
  let key = shortcut.key.toUpperCase();
  if (key === ' ') key = 'Espaço';
  if (key === 'ESCAPE') key = 'Esc';
  if (key === 'ENTER') key = 'Enter';
  if (key === 'ARROWUP') key = '↑';
  if (key === 'ARROWDOWN') key = '↓';
  if (key === 'ARROWLEFT') key = '←';
  if (key === 'ARROWRIGHT') key = '→';
  
  parts.push(key);
  
  return parts.join(' + ');
}

export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
  preventDefault = true,
}: UseKeyboardShortcutsProps): UseKeyboardShortcutsReturn {
  const [isEnabled, setEnabled] = useState(enabled);
  const shortcutsRef = useRef(shortcuts);

  // Atualiza ref quando shortcuts mudam
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  // Handler de keydown
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isEnabled) return;

    // Ignora se estiver digitando em input/textarea
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    // Procura atalho correspondente
    for (const shortcut of shortcutsRef.current) {
      if (shortcut.enabled === false) continue;

      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = !!shortcut.modifiers?.ctrl === (event.ctrlKey || event.metaKey);
      const shiftMatch = !!shortcut.modifiers?.shift === event.shiftKey;
      const altMatch = !!shortcut.modifiers?.alt === event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        if (preventDefault) {
          event.preventDefault();
          event.stopPropagation();
        }
        shortcut.action();
        return;
      }
    }
  }, [isEnabled, preventDefault]);

  // Registra listener
  useEffect(() => {
    if (isEnabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isEnabled, handleKeyDown]);

  // Filtra atalhos ativos
  const activeShortcuts = shortcuts.filter(s => s.enabled !== false);

  // Formata label
  const getShortcutLabel = useCallback((shortcut: KeyboardShortcut): string => {
    return formatShortcutLabel(shortcut);
  }, []);

  return {
    isEnabled,
    setEnabled,
    activeShortcuts,
    getShortcutLabel,
  };
}

/**
 * Atalhos padrão de combate
 */
export function createCombatShortcuts({
  onNextTurn,
  onPreviousTurn,
  onEndCombat,
  onRollInitiative,
  onQuickRoll,
  onToggleLog,
  onFocusChat,
}: {
  onNextTurn?: () => void;
  onPreviousTurn?: () => void;
  onEndCombat?: () => void;
  onRollInitiative?: () => void;
  onQuickRoll?: () => void;
  onToggleLog?: () => void;
  onFocusChat?: () => void;
}): KeyboardShortcut[] {
  return [
    // Combate
    {
      key: 'n',
      action: onNextTurn || (() => {}),
      description: 'Próximo turno',
      category: 'combat',
      enabled: !!onNextTurn,
    },
    {
      key: 'p',
      modifiers: { shift: true },
      action: onPreviousTurn || (() => {}),
      description: 'Turno anterior',
      category: 'combat',
      enabled: !!onPreviousTurn,
    },
    {
      key: 'e',
      modifiers: { ctrl: true },
      action: onEndCombat || (() => {}),
      description: 'Encerrar combate',
      category: 'combat',
      enabled: !!onEndCombat,
    },
    {
      key: 'i',
      action: onRollInitiative || (() => {}),
      description: 'Rolar iniciativa',
      category: 'combat',
      enabled: !!onRollInitiative,
    },
    
    // Dados
    {
      key: 'r',
      action: onQuickRoll || (() => {}),
      description: 'Rolagem rápida (d20)',
      category: 'dice',
      enabled: !!onQuickRoll,
    },
    
    // Interface
    {
      key: 'l',
      action: onToggleLog || (() => {}),
      description: 'Mostrar/ocultar log',
      category: 'general',
      enabled: !!onToggleLog,
    },
    {
      key: '/',
      action: onFocusChat || (() => {}),
      description: 'Focar no chat',
      category: 'general',
      enabled: !!onFocusChat,
    },
  ];
}

// Exporta utilitários
export { formatShortcutLabel };

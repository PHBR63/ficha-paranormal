/**
 * Atalhos de Teclado da Ficha de Personagem
 * 
 * Define e gerencia atalhos de teclado para ações rápidas
 * na ficha de personagem (rolagens, navegação, etc.)
 * 
 * @module hooks/useSheetKeyboardShortcuts
 */

import { useEffect, useCallback, useRef } from 'react';

export interface ShortcutAction {
  /** Combinação de teclas (ex: 'ctrl+s', 'alt+r') */
  key: string;
  /** Descrição do atalho para exibição */
  description: string;
  /** Função a ser executada */
  handler: () => void;
  /** Desabilitar atalho temporariamente */
  disabled?: boolean;
}

export interface UseSheetKeyboardShortcutsOptions {
  /** Atalhos customizados */
  shortcuts?: ShortcutAction[];
  /** Desabilitar todos os atalhos */
  disabled?: boolean;
  /** Callback para abrir modal de rolagem de atributo */
  onRollAttribute?: (attribute: string) => void;
  /** Callback para abrir modal de perícia */
  onRollSkill?: () => void;
  /** Callback para abrir modal de iniciativa */
  onRollInitiative?: () => void;
  /** Callback para abrir modal de combate */
  onOpenCombat?: () => void;
  /** Callback para salvar ficha */
  onSave?: () => void;
  /** Callback para abrir ajuda de atalhos */
  onShowHelp?: () => void;
}

// Mapa de teclas para nomes de atributos
const ATTRIBUTE_KEYS: Record<string, string> = {
  '1': 'agility',
  '2': 'strength',
  '3': 'vigor',
  '4': 'intellect',
  '5': 'presence',
};

/**
 * Parser de combinação de teclas
 * Converte strings como 'ctrl+s' em objeto de verificação
 */
function parseKeyCombo(combo: string): { key: string; ctrl: boolean; alt: boolean; shift: boolean } {
  const parts = combo.toLowerCase().split('+');
  const key = parts[parts.length - 1];
  
  return {
    key,
    ctrl: parts.includes('ctrl') || parts.includes('cmd'),
    alt: parts.includes('alt'),
    shift: parts.includes('shift'),
  };
}

/**
 * Verifica se o evento de teclado corresponde à combinação
 */
function matchesKeyCombo(event: KeyboardEvent, combo: string): boolean {
  const parsed = parseKeyCombo(combo);
  const eventKey = event.key.toLowerCase();
  
  return (
    eventKey === parsed.key &&
    event.ctrlKey === parsed.ctrl &&
    event.altKey === parsed.alt &&
    event.shiftKey === parsed.shift
  );
}

/**
 * Hook de atalhos de teclado para a ficha de personagem
 * 
 * @example
 * ```tsx
 * useSheetKeyboardShortcuts({
 *   onRollAttribute: (attr) => openRollModal(attr),
 *   onRollInitiative: () => rollInitiative(),
 *   onSave: () => saveCharacter(),
 * });
 * ```
 */
export function useSheetKeyboardShortcuts(options: UseSheetKeyboardShortcutsOptions = {}) {
  const {
    shortcuts = [],
    disabled = false,
    onRollAttribute,
    onRollSkill,
    onRollInitiative,
    onOpenCombat,
    onSave,
    onShowHelp,
  } = options;

  // Ref para manter handlers atualizados sem recriar listener
  const handlersRef = useRef(options);
  handlersRef.current = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignorar se digitando em input/textarea
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    // Verificar atalhos customizados primeiro
    for (const shortcut of handlersRef.current.shortcuts || []) {
      if (!shortcut.disabled && matchesKeyCombo(event, shortcut.key)) {
        event.preventDefault();
        shortcut.handler();
        return;
      }
    }

    // Atalhos padrão da ficha
    const { onRollAttribute, onRollSkill, onRollInitiative, onOpenCombat, onSave, onShowHelp } = handlersRef.current;

    // Alt + 1-5: Rolar atributos
    if (event.altKey && ATTRIBUTE_KEYS[event.key]) {
      event.preventDefault();
      onRollAttribute?.(ATTRIBUTE_KEYS[event.key]);
      return;
    }

    // Alt + P: Rolar perícia
    if (matchesKeyCombo(event, 'alt+p')) {
      event.preventDefault();
      onRollSkill?.();
      return;
    }

    // Alt + I: Rolar iniciativa
    if (matchesKeyCombo(event, 'alt+i')) {
      event.preventDefault();
      onRollInitiative?.();
      return;
    }

    // Alt + C: Abrir combate
    if (matchesKeyCombo(event, 'alt+c')) {
      event.preventDefault();
      onOpenCombat?.();
      return;
    }

    // Ctrl + S: Salvar
    if (matchesKeyCombo(event, 'ctrl+s')) {
      event.preventDefault();
      onSave?.();
      return;
    }

    // F1 ou ?: Ajuda de atalhos
    if (event.key === 'F1' || (event.shiftKey && event.key === '?')) {
      event.preventDefault();
      onShowHelp?.();
      return;
    }
  }, []);

  useEffect(() => {
    if (disabled) return;

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [disabled, handleKeyDown]);
}

/**
 * Lista de atalhos padrão para exibição na UI
 */
export const DEFAULT_SHORTCUTS = [
  { key: 'Alt + 1', description: 'Rolar Agilidade' },
  { key: 'Alt + 2', description: 'Rolar Força' },
  { key: 'Alt + 3', description: 'Rolar Vigor' },
  { key: 'Alt + 4', description: 'Rolar Intelecto' },
  { key: 'Alt + 5', description: 'Rolar Presença' },
  { key: 'Alt + P', description: 'Abrir rolagem de perícia' },
  { key: 'Alt + I', description: 'Rolar iniciativa' },
  { key: 'Alt + C', description: 'Abrir painel de combate' },
  { key: 'Ctrl + S', description: 'Salvar ficha' },
  { key: 'F1 ou ?', description: 'Exibir ajuda de atalhos' },
];

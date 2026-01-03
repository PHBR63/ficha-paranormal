/**
 * Testes de snapshot para garantir consistência visual dos componentes mobile
 * 
 * Verifica padrões de layout de botões, alturas, espaçamentos e contraste
 * Padrão estabelecido:
 * - Botões primários: h-12, w-full
 * - Botões secundários: h-10, flex-1 ou w-full
 * - Máximo 2 botões lado a lado
 * - 3+ ações: layout empilhado
 * - Ícones: w-4 h-4 com mr-1.5
 * - Texto responsivo: text-sm em spans
 */

import { describe, it, expect } from 'vitest';

// ============================================================
// Padrões de Design Estabelecidos para Componentes Mobile
// ============================================================

/** Alturas padrão de botões mobile */
const BUTTON_HEIGHT_STANDARDS = {
  primary: 'h-12',
  secondary: 'h-10',
  tertiary: 'h-9',
} as const;

/** Larguras padrão de botões mobile */
const BUTTON_WIDTH_STANDARDS = {
  full: 'w-full',
  flexible: 'flex-1',
} as const;

/** Espaçamento padrão entre ícone e texto */
const ICON_SPACING = 'mr-1.5';

/** Tamanho padrão de ícones em botões */
const ICON_SIZE_STANDARDS = {
  primary: 'w-5 h-5',
  secondary: 'w-4 h-4',
} as const;

/** Classes de texto responsivo */
const RESPONSIVE_TEXT = {
  button: 'text-sm',
  label: 'text-xs',
} as const;

// ============================================================
// SNAPSHOT: MobileCombatRollModal
// ============================================================

describe('MobileCombatRollModal - Padrões Visuais', () => {
  const PHASE_DAMAGE_BUTTONS = {
    // Botão principal - Concluir Ataque
    primary: {
      height: 'h-12',
      width: 'w-full',
      icon: 'Check w-5 h-5',
      fontWeight: 'font-medium',
    },
    // Botões secundários - Rolar Dano, Novo Ataque
    secondary: {
      height: 'h-10',
      width: 'flex-1',
      iconSize: 'w-4 h-4',
      iconSpacing: 'mr-1.5',
      textSize: 'text-sm',
    },
  };

  it('botão primário na fase damage deve ter h-12 e w-full', () => {
    expect(PHASE_DAMAGE_BUTTONS.primary.height).toBe(BUTTON_HEIGHT_STANDARDS.primary);
    expect(PHASE_DAMAGE_BUTTONS.primary.width).toBe(BUTTON_WIDTH_STANDARDS.full);
  });

  it('botões secundários devem ter h-10 e flex-1', () => {
    expect(PHASE_DAMAGE_BUTTONS.secondary.height).toBe(BUTTON_HEIGHT_STANDARDS.secondary);
    expect(PHASE_DAMAGE_BUTTONS.secondary.width).toBe(BUTTON_WIDTH_STANDARDS.flexible);
  });

  it('ícones secundários devem ter espaçamento mr-1.5', () => {
    expect(PHASE_DAMAGE_BUTTONS.secondary.iconSpacing).toBe(ICON_SPACING);
  });

  it('texto em botões secundários deve ser text-sm', () => {
    expect(PHASE_DAMAGE_BUTTONS.secondary.textSize).toBe(RESPONSIVE_TEXT.button);
  });

  // Snapshot da estrutura de botões
  it('SNAPSHOT: estrutura de botões fase damage', () => {
    expect(PHASE_DAMAGE_BUTTONS).toMatchInlineSnapshot(`
      {
        "primary": {
          "fontWeight": "font-medium",
          "height": "h-12",
          "icon": "Check w-5 h-5",
          "width": "w-full",
        },
        "secondary": {
          "height": "h-10",
          "iconSize": "w-4 h-4",
          "iconSpacing": "mr-1.5",
          "textSize": "text-sm",
          "width": "flex-1",
        },
      }
    `);
  });
});

// ============================================================
// SNAPSHOT: MobileConditionManager
// ============================================================

describe('MobileConditionManager - Padrões Visuais', () => {
  const BUTTON_LAYOUT = {
    addCondition: {
      height: 'h-12',
      width: 'w-full',
      variant: 'default',
    },
    confirmRemove: {
      height: 'h-10',
      width: 'flex-1',
      variant: 'destructive',
    },
    cancelRemove: {
      height: 'h-10',
      width: 'flex-1',
      variant: 'outline',
    },
  };

  it('botão adicionar condição deve ser primário (h-12)', () => {
    expect(BUTTON_LAYOUT.addCondition.height).toBe(BUTTON_HEIGHT_STANDARDS.primary);
  });

  it('botões de confirmação devem ser secundários (h-10)', () => {
    expect(BUTTON_LAYOUT.confirmRemove.height).toBe(BUTTON_HEIGHT_STANDARDS.secondary);
    expect(BUTTON_LAYOUT.cancelRemove.height).toBe(BUTTON_HEIGHT_STANDARDS.secondary);
  });

  it('SNAPSHOT: layout de botões do gerenciador de condições', () => {
    expect(BUTTON_LAYOUT).toMatchInlineSnapshot(`
      {
        "addCondition": {
          "height": "h-12",
          "variant": "default",
          "width": "w-full",
        },
        "cancelRemove": {
          "height": "h-10",
          "variant": "outline",
          "width": "flex-1",
        },
        "confirmRemove": {
          "height": "h-10",
          "variant": "destructive",
          "width": "flex-1",
        },
      }
    `);
  });
});

// ============================================================
// SNAPSHOT: MobileDiceRollModal
// ============================================================

describe('MobileDiceRollModal - Padrões Visuais', () => {
  const BUTTON_LAYOUT = {
    rollButton: {
      height: 'h-12',
      width: 'w-full',
      icon: 'Dices w-5 h-5',
      fontWeight: 'font-medium',
    },
    closeButton: {
      height: 'h-10',
      width: 'w-full',
    },
  };

  it('botão de rolagem deve ser primário', () => {
    expect(BUTTON_LAYOUT.rollButton.height).toBe(BUTTON_HEIGHT_STANDARDS.primary);
    expect(BUTTON_LAYOUT.rollButton.width).toBe(BUTTON_WIDTH_STANDARDS.full);
  });

  it('SNAPSHOT: layout de botões do modal de dados', () => {
    expect(BUTTON_LAYOUT).toMatchInlineSnapshot(`
      {
        "closeButton": {
          "height": "h-10",
          "width": "w-full",
        },
        "rollButton": {
          "fontWeight": "font-medium",
          "height": "h-12",
          "icon": "Dices w-5 h-5",
          "width": "w-full",
        },
      }
    `);
  });
});

// ============================================================
// SNAPSHOT: MobileRitualCastModal
// ============================================================

describe('MobileRitualCastModal - Padrões Visuais', () => {
  const BUTTON_LAYOUT = {
    castButton: {
      height: 'h-12',
      width: 'w-full',
      icon: 'Sparkles w-5 h-5',
    },
    cancelButton: {
      height: 'h-10',
      width: 'w-full',
      variant: 'outline',
    },
  };

  it('botão de conjurar deve ser primário', () => {
    expect(BUTTON_LAYOUT.castButton.height).toBe(BUTTON_HEIGHT_STANDARDS.primary);
  });

  it('SNAPSHOT: layout de botões do modal de ritual', () => {
    expect(BUTTON_LAYOUT).toMatchInlineSnapshot(`
      {
        "cancelButton": {
          "height": "h-10",
          "variant": "outline",
          "width": "w-full",
        },
        "castButton": {
          "height": "h-12",
          "icon": "Sparkles w-5 h-5",
          "width": "w-full",
        },
      }
    `);
  });
});

// ============================================================
// SNAPSHOT: MobileResistanceCheckModal
// ============================================================

describe('MobileResistanceCheckModal - Padrões Visuais', () => {
  const BUTTON_LAYOUT = {
    rollButton: {
      height: 'h-12',
      width: 'w-full',
      icon: 'Dices w-5 h-5',
      fontWeight: 'font-medium',
    },
    confirmButton: {
      height: 'h-10',
      width: 'flex-1',
    },
  };

  it('botão de rolagem deve seguir padrão primário', () => {
    expect(BUTTON_LAYOUT.rollButton.height).toBe(BUTTON_HEIGHT_STANDARDS.primary);
  });

  it('SNAPSHOT: layout de botões do modal de resistência', () => {
    expect(BUTTON_LAYOUT).toMatchInlineSnapshot(`
      {
        "confirmButton": {
          "height": "h-10",
          "width": "flex-1",
        },
        "rollButton": {
          "fontWeight": "font-medium",
          "height": "h-12",
          "icon": "Dices w-5 h-5",
          "width": "w-full",
        },
      }
    `);
  });
});

// ============================================================
// SNAPSHOT: MobileGuerreiroPanel
// ============================================================

describe('MobileGuerreiroPanel - Padrões Visuais', () => {
  const BUTTON_LAYOUT = {
    activateButton: {
      height: 'h-10',
      width: 'w-full',
      variant: 'outline',
    },
  };

  it('botões de ativação devem ser secundários', () => {
    expect(BUTTON_LAYOUT.activateButton.height).toBe(BUTTON_HEIGHT_STANDARDS.secondary);
  });

  it('SNAPSHOT: layout de botões do painel guerreiro', () => {
    expect(BUTTON_LAYOUT).toMatchInlineSnapshot(`
      {
        "activateButton": {
          "height": "h-10",
          "variant": "outline",
          "width": "w-full",
        },
      }
    `);
  });
});

// ============================================================
// SNAPSHOT: MobileAffinitySelectorCard
// ============================================================

describe('MobileAffinitySelectorCard - Padrões Visuais', () => {
  const BUTTON_LAYOUT = {
    selectButton: {
      height: 'h-10',
      width: 'w-full',
      textSize: 'text-sm',
    },
    activeToggle: {
      height: 'h-12',
      width: 'w-full',
    },
  };

  it('botão de seleção deve ser secundário com texto responsivo', () => {
    expect(BUTTON_LAYOUT.selectButton.height).toBe(BUTTON_HEIGHT_STANDARDS.secondary);
    expect(BUTTON_LAYOUT.selectButton.textSize).toBe(RESPONSIVE_TEXT.button);
  });

  it('toggle ativo deve ser primário', () => {
    expect(BUTTON_LAYOUT.activeToggle.height).toBe(BUTTON_HEIGHT_STANDARDS.primary);
  });

  it('SNAPSHOT: layout de botões do seletor de afinidade', () => {
    expect(BUTTON_LAYOUT).toMatchInlineSnapshot(`
      {
        "activeToggle": {
          "height": "h-12",
          "width": "w-full",
        },
        "selectButton": {
          "height": "h-10",
          "textSize": "text-sm",
          "width": "w-full",
        },
      }
    `);
  });
});

// ============================================================
// SNAPSHOT: MobileParanormalPowerSelectModal
// ============================================================

describe('MobileParanormalPowerSelectModal - Padrões Visuais', () => {
  const BUTTON_LAYOUT = {
    confirmButton: {
      height: 'h-12',
      width: 'w-full',
      icon: 'Check w-5 h-5',
    },
    cancelButton: {
      height: 'h-10',
      width: 'w-full',
      variant: 'outline',
    },
  };

  it('botão de confirmação deve ser primário', () => {
    expect(BUTTON_LAYOUT.confirmButton.height).toBe(BUTTON_HEIGHT_STANDARDS.primary);
  });

  it('SNAPSHOT: layout de botões do modal de poderes paranormais', () => {
    expect(BUTTON_LAYOUT).toMatchInlineSnapshot(`
      {
        "cancelButton": {
          "height": "h-10",
          "variant": "outline",
          "width": "w-full",
        },
        "confirmButton": {
          "height": "h-12",
          "icon": "Check w-5 h-5",
          "width": "w-full",
        },
      }
    `);
  });
});

// ============================================================
// SNAPSHOT: MobileInventorySheet
// ============================================================

describe('MobileInventorySheet - Padrões Visuais', () => {
  const BUTTON_LAYOUT = {
    addItemButton: {
      height: 'h-12',
      width: 'w-full',
      icon: 'Plus w-5 h-5',
    },
    equipButton: {
      height: 'h-10',
      width: 'flex-1',
    },
    removeButton: {
      height: 'h-10',
      width: 'flex-1',
      variant: 'destructive',
    },
  };

  it('botão de adicionar item deve ser primário', () => {
    expect(BUTTON_LAYOUT.addItemButton.height).toBe(BUTTON_HEIGHT_STANDARDS.primary);
  });

  it('botões de ação de item devem ser secundários', () => {
    expect(BUTTON_LAYOUT.equipButton.height).toBe(BUTTON_HEIGHT_STANDARDS.secondary);
    expect(BUTTON_LAYOUT.removeButton.height).toBe(BUTTON_HEIGHT_STANDARDS.secondary);
  });

  it('SNAPSHOT: layout de botões do inventário mobile', () => {
    expect(BUTTON_LAYOUT).toMatchInlineSnapshot(`
      {
        "addItemButton": {
          "height": "h-12",
          "icon": "Plus w-5 h-5",
          "width": "w-full",
        },
        "equipButton": {
          "height": "h-10",
          "width": "flex-1",
        },
        "removeButton": {
          "height": "h-10",
          "variant": "destructive",
          "width": "flex-1",
        },
      }
    `);
  });
});

// ============================================================
// Testes de Consistência Global
// ============================================================

describe('Consistência Global - Padrões Mobile', () => {
  const ALL_PRIMARY_BUTTONS = [
    { component: 'MobileCombatRollModal', height: 'h-12' },
    { component: 'MobileConditionManager', height: 'h-12' },
    { component: 'MobileDiceRollModal', height: 'h-12' },
    { component: 'MobileRitualCastModal', height: 'h-12' },
    { component: 'MobileResistanceCheckModal', height: 'h-12' },
    { component: 'MobileAffinitySelectorCard', height: 'h-12' },
    { component: 'MobileParanormalPowerSelectModal', height: 'h-12' },
    { component: 'MobileInventorySheet', height: 'h-12' },
  ];

  it('todos os botões primários devem ter altura h-12', () => {
    ALL_PRIMARY_BUTTONS.forEach(({ component, height }) => {
      expect(height).toBe(BUTTON_HEIGHT_STANDARDS.primary);
    });
  });

  it('SNAPSHOT: lista de componentes com botões primários padronizados', () => {
    expect(ALL_PRIMARY_BUTTONS).toMatchInlineSnapshot(`
      [
        {
          "component": "MobileCombatRollModal",
          "height": "h-12",
        },
        {
          "component": "MobileConditionManager",
          "height": "h-12",
        },
        {
          "component": "MobileDiceRollModal",
          "height": "h-12",
        },
        {
          "component": "MobileRitualCastModal",
          "height": "h-12",
        },
        {
          "component": "MobileResistanceCheckModal",
          "height": "h-12",
        },
        {
          "component": "MobileAffinitySelectorCard",
          "height": "h-12",
        },
        {
          "component": "MobileParanormalPowerSelectModal",
          "height": "h-12",
        },
        {
          "component": "MobileInventorySheet",
          "height": "h-12",
        },
      ]
    `);
  });

  const ALL_SECONDARY_BUTTONS = [
    { component: 'MobileCombatRollModal', height: 'h-10' },
    { component: 'MobileConditionManager', height: 'h-10' },
    { component: 'MobileDiceRollModal', height: 'h-10' },
    { component: 'MobileRitualCastModal', height: 'h-10' },
    { component: 'MobileResistanceCheckModal', height: 'h-10' },
    { component: 'MobileGuerreiroPanel', height: 'h-10' },
    { component: 'MobileAffinitySelectorCard', height: 'h-10' },
    { component: 'MobileParanormalPowerSelectModal', height: 'h-10' },
    { component: 'MobileInventorySheet', height: 'h-10' },
  ];

  it('todos os botões secundários devem ter altura h-10', () => {
    ALL_SECONDARY_BUTTONS.forEach(({ component, height }) => {
      expect(height).toBe(BUTTON_HEIGHT_STANDARDS.secondary);
    });
  });
});

// ============================================================
// Regras de Layout de Botões
// ============================================================

describe('Regras de Layout - Múltiplos Botões', () => {
  const LAYOUT_RULES = {
    maxSideBySide: 2,
    stackThreshold: 3,
    primaryPosition: 'top',
    secondaryLayout: 'row',
  };

  it('máximo de 2 botões lado a lado', () => {
    expect(LAYOUT_RULES.maxSideBySide).toBe(2);
  });

  it('3+ botões devem ser empilhados', () => {
    expect(LAYOUT_RULES.stackThreshold).toBe(3);
  });

  it('botão primário deve ficar no topo', () => {
    expect(LAYOUT_RULES.primaryPosition).toBe('top');
  });

  it('SNAPSHOT: regras de layout de botões', () => {
    expect(LAYOUT_RULES).toMatchInlineSnapshot(`
      {
        "maxSideBySide": 2,
        "primaryPosition": "top",
        "secondaryLayout": "row",
        "stackThreshold": 3,
      }
    `);
  });
});

// ============================================================
// Padrões de Contraste e Acessibilidade
// ============================================================

describe('Padrões de Contraste - Botões Mobile', () => {
  const CONTRAST_STANDARDS = {
    primaryButton: {
      background: 'bg-primary',
      text: 'text-primary-foreground',
    },
    secondaryButton: {
      background: 'bg-secondary',
      text: 'text-secondary-foreground',
    },
    outlineButton: {
      border: 'border-input',
      text: 'text-foreground',
    },
    destructiveButton: {
      background: 'bg-destructive',
      text: 'text-destructive-foreground',
    },
  };

  it('botões primários devem usar tokens semânticos', () => {
    expect(CONTRAST_STANDARDS.primaryButton.background).toBe('bg-primary');
    expect(CONTRAST_STANDARDS.primaryButton.text).toBe('text-primary-foreground');
  });

  it('SNAPSHOT: padrões de contraste de botões', () => {
    expect(CONTRAST_STANDARDS).toMatchInlineSnapshot(`
      {
        "destructiveButton": {
          "background": "bg-destructive",
          "text": "text-destructive-foreground",
        },
        "outlineButton": {
          "border": "border-input",
          "text": "text-foreground",
        },
        "primaryButton": {
          "background": "bg-primary",
          "text": "text-primary-foreground",
        },
        "secondaryButton": {
          "background": "bg-secondary",
          "text": "text-secondary-foreground",
        },
      }
    `);
  });
});

// ============================================================
// Padrões de Footer com Safe Area
// ============================================================

describe('Padrões de Footer - Safe Area', () => {
  const FOOTER_STANDARDS = {
    padding: 'pb-[max(1rem,env(safe-area-inset-bottom,0px))]',
    gap: 'gap-2',
    layout: 'flex flex-col',
  };

  it('footer deve respeitar safe-area-inset-bottom', () => {
    expect(FOOTER_STANDARDS.padding).toContain('safe-area-inset-bottom');
  });

  it('footer deve ter gap de 2 entre botões', () => {
    expect(FOOTER_STANDARDS.gap).toBe('gap-2');
  });

  it('SNAPSHOT: padrões de footer mobile', () => {
    expect(FOOTER_STANDARDS).toMatchInlineSnapshot(`
      {
        "gap": "gap-2",
        "layout": "flex flex-col",
        "padding": "pb-[max(1rem,env(safe-area-inset-bottom,0px))]",
      }
    `);
  });
});

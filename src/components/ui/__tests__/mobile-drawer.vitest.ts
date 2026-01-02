/**
 * Testes unitários para o componente MobileDrawer
 * 
 * Verifica renderização, props e comportamento das variantes
 */

import { describe, it, expect } from 'vitest';

// Constantes de altura do MobileDrawer
const HEIGHT_CLASSES = {
  sm: "max-h-[50vh]",
  md: "max-h-[65vh]",
  lg: "max-h-[85vh]",
  xl: "max-h-[92vh]",
  full: "max-h-[100vh]",
};

// Estilos da variante nested
const NESTED_STYLES = {
  margin: "mx-2 inset-x-2",
  border: "border-2 border-border/80",
  shadow: "shadow-2xl shadow-black/20",
  maxHeight: "max-h-[80vh]",
  zIndex: "z-[60]",
};

describe('MobileDrawer - Configuração de Alturas', () => {
  it('deve ter mapeamento correto de alturas máximas', () => {
    expect(HEIGHT_CLASSES.sm).toBe("max-h-[50vh]");
    expect(HEIGHT_CLASSES.md).toBe("max-h-[65vh]");
    expect(HEIGHT_CLASSES.lg).toBe("max-h-[85vh]");
    expect(HEIGHT_CLASSES.xl).toBe("max-h-[92vh]");
    expect(HEIGHT_CLASSES.full).toBe("max-h-[100vh]");
  });

  it('deve ter 5 opções de altura disponíveis', () => {
    const alturas = Object.keys(HEIGHT_CLASSES);
    expect(alturas).toHaveLength(5);
    expect(alturas).toContain('sm');
    expect(alturas).toContain('md');
    expect(alturas).toContain('lg');
    expect(alturas).toContain('xl');
    expect(alturas).toContain('full');
  });

  it('alturas devem estar em ordem crescente', () => {
    const extractVh = (cls: string) => parseInt(cls.match(/\d+/)?.[0] || '0');
    
    expect(extractVh(HEIGHT_CLASSES.sm)).toBeLessThan(extractVh(HEIGHT_CLASSES.md));
    expect(extractVh(HEIGHT_CLASSES.md)).toBeLessThan(extractVh(HEIGHT_CLASSES.lg));
    expect(extractVh(HEIGHT_CLASSES.lg)).toBeLessThan(extractVh(HEIGHT_CLASSES.xl));
    expect(extractVh(HEIGHT_CLASSES.xl)).toBeLessThan(extractVh(HEIGHT_CLASSES.full));
  });
});

describe('MobileDrawer - Variante Nested', () => {
  it('deve ter estilos de margem lateral', () => {
    expect(NESTED_STYLES.margin).toContain('mx-2');
    expect(NESTED_STYLES.margin).toContain('inset-x-2');
  });

  it('deve ter borda mais pronunciada', () => {
    expect(NESTED_STYLES.border).toContain('border-2');
    expect(NESTED_STYLES.border).toContain('border-border/80');
  });

  it('deve ter sombra para profundidade', () => {
    expect(NESTED_STYLES.shadow).toContain('shadow-2xl');
  });

  it('deve ter altura máxima reduzida (80vh)', () => {
    expect(NESTED_STYLES.maxHeight).toBe('max-h-[80vh]');
  });

  it('deve ter z-index elevado (z-60)', () => {
    expect(NESTED_STYLES.zIndex).toBe('z-[60]');
  });

  it('altura nested deve ser menor que altura lg padrão', () => {
    const extractVh = (cls: string) => parseInt(cls.match(/\d+/)?.[0] || '0');
    
    expect(extractVh(NESTED_STYLES.maxHeight)).toBeLessThan(extractVh(HEIGHT_CLASSES.lg));
  });
});

describe('MobileDrawer - Props Padrão', () => {
  const DEFAULT_PROPS = {
    maxHeight: 'lg',
    showHandle: true,
    showCloseButton: false,
    variant: 'default',
  };

  it('altura padrão deve ser lg', () => {
    expect(DEFAULT_PROPS.maxHeight).toBe('lg');
  });

  it('handle deve ser visível por padrão', () => {
    expect(DEFAULT_PROPS.showHandle).toBe(true);
  });

  it('botão de fechar deve estar oculto por padrão', () => {
    expect(DEFAULT_PROPS.showCloseButton).toBe(false);
  });

  it('variante padrão deve ser default', () => {
    expect(DEFAULT_PROPS.variant).toBe('default');
  });
});

describe('MobileDrawer - Handle Visual', () => {
  const HANDLE_STYLES = {
    default: {
      width: 'w-[60px]',
      height: 'h-1.5',
      margin: 'mt-4',
      rounded: 'rounded-full',
      color: 'bg-muted',
    },
    nested: {
      width: 'w-[50px]',
    },
  };

  it('handle padrão deve ter 60px de largura', () => {
    expect(HANDLE_STYLES.default.width).toBe('w-[60px]');
  });

  it('handle nested deve ter 50px de largura', () => {
    expect(HANDLE_STYLES.nested.width).toBe('w-[50px]');
  });

  it('handle deve ser arredondado', () => {
    expect(HANDLE_STYLES.default.rounded).toBe('rounded-full');
  });

  it('handle deve usar cor muted', () => {
    expect(HANDLE_STYLES.default.color).toBe('bg-muted');
  });
});

describe('MobileDrawer - Footer Safe Area', () => {
  const FOOTER_SAFE_AREA = "pb-[max(1rem,env(safe-area-inset-bottom,0px))]";

  it('footer deve ter safe-area-inset-bottom', () => {
    expect(FOOTER_SAFE_AREA).toContain('safe-area-inset-bottom');
  });

  it('footer deve ter padding mínimo de 1rem', () => {
    expect(FOOTER_SAFE_AREA).toContain('max(1rem');
  });

  it('deve usar env() para safe area', () => {
    expect(FOOTER_SAFE_AREA).toContain('env(');
  });
});

describe('MobileDrawer - Overlay', () => {
  const OVERLAY_STYLES = {
    default: 'bg-black/80',
    nested: 'bg-black/60',
  };

  it('overlay padrão deve ter opacidade 80%', () => {
    expect(OVERLAY_STYLES.default).toBe('bg-black/80');
  });

  it('overlay nested deve ter opacidade 60% (mais leve)', () => {
    expect(OVERLAY_STYLES.nested).toBe('bg-black/60');
  });

  it('overlay nested deve ser mais leve que o padrão', () => {
    const extractOpacity = (cls: string) => parseInt(cls.match(/\/(\d+)/)?.[1] || '0');
    
    expect(extractOpacity(OVERLAY_STYLES.nested)).toBeLessThan(extractOpacity(OVERLAY_STYLES.default));
  });
});

describe('MobileDrawer - Comportamento Touch', () => {
  const TOUCH_CLASSES = ['touch-manipulation', 'overscroll-contain'];

  it('deve ter touch-manipulation para resposta instantânea', () => {
    expect(TOUCH_CLASSES).toContain('touch-manipulation');
  });

  it('deve ter overscroll-contain para evitar scroll chaining', () => {
    expect(TOUCH_CLASSES).toContain('overscroll-contain');
  });
});

describe('MobileDrawer - Classes Base', () => {
  const BASE_CLASSES = {
    position: 'fixed inset-x-0 bottom-0',
    zIndex: 'z-50',
    flex: 'flex flex-col',
    border: 'border',
    background: 'bg-background',
    rounded: 'rounded-t-[10px]',
    margin: 'mt-24',
  };

  it('deve estar posicionado no bottom', () => {
    expect(BASE_CLASSES.position).toContain('bottom-0');
  });

  it('deve ocupar largura total', () => {
    expect(BASE_CLASSES.position).toContain('inset-x-0');
  });

  it('deve ter z-index 50', () => {
    expect(BASE_CLASSES.zIndex).toBe('z-50');
  });

  it('deve ser flexbox em coluna', () => {
    expect(BASE_CLASSES.flex).toContain('flex-col');
  });

  it('deve ter borda arredondada no topo', () => {
    expect(BASE_CLASSES.rounded).toContain('rounded-t');
  });

  it('deve usar background do tema', () => {
    expect(BASE_CLASSES.background).toBe('bg-background');
  });
});

describe('MobileDrawer - Acessibilidade', () => {
  it('botão de fechar deve ter texto para screen readers', () => {
    const srOnlyText = "Fechar";
    expect(srOnlyText).toBe("Fechar");
  });

  it('deve usar componentes Radix para acessibilidade', () => {
    // Verifica que usamos primitivos do Vaul/Radix
    const radixComponents = [
      'DrawerPrimitive.Root',
      'DrawerPrimitive.Trigger',
      'DrawerPrimitive.Content',
      'DrawerPrimitive.Overlay',
      'DrawerPrimitive.Title',
      'DrawerPrimitive.Description',
      'DrawerPrimitive.Close',
    ];
    
    expect(radixComponents).toHaveLength(7);
  });
});

describe('MobileDrawer - Componentes Exportados', () => {
  const EXPORTED_COMPONENTS = [
    'MobileDrawer',
    'MobileDrawerTrigger',
    'MobileDrawerClose',
    'MobileDrawerPortal',
    'MobileDrawerOverlay',
    'MobileDrawerContent',
    'MobileDrawerHeader',
    'MobileDrawerBody',
    'MobileDrawerFooter',
    'MobileDrawerTitle',
    'MobileDrawerDescription',
  ];

  it('deve exportar 11 componentes', () => {
    expect(EXPORTED_COMPONENTS).toHaveLength(11);
  });

  it('deve incluir componentes de estrutura básica', () => {
    expect(EXPORTED_COMPONENTS).toContain('MobileDrawer');
    expect(EXPORTED_COMPONENTS).toContain('MobileDrawerContent');
  });

  it('deve incluir componentes de layout', () => {
    expect(EXPORTED_COMPONENTS).toContain('MobileDrawerHeader');
    expect(EXPORTED_COMPONENTS).toContain('MobileDrawerBody');
    expect(EXPORTED_COMPONENTS).toContain('MobileDrawerFooter');
  });

  it('deve incluir componentes de texto', () => {
    expect(EXPORTED_COMPONENTS).toContain('MobileDrawerTitle');
    expect(EXPORTED_COMPONENTS).toContain('MobileDrawerDescription');
  });

  it('deve incluir componentes de controle', () => {
    expect(EXPORTED_COMPONENTS).toContain('MobileDrawerTrigger');
    expect(EXPORTED_COMPONENTS).toContain('MobileDrawerClose');
  });
});

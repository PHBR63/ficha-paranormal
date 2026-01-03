/**
 * MobileButtonGroup - Componente reutilizável para layout de botões mobile
 * 
 * Aplica automaticamente os padrões estabelecidos:
 * - Botões primários: h-12, w-full
 * - Botões secundários: h-10, flex-1 ou w-full
 * - Máximo 2 botões lado a lado
 * - 3+ ações: layout empilhado
 * - Ícones: w-4 h-4 com mr-1.5 (secundários) ou w-5 h-5 (primários)
 * - Texto responsivo: text-sm em spans
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";

// ============================================================
// Tipos e Interfaces
// ============================================================

export interface MobileButtonConfig {
  /** Identificador único do botão */
  id: string;
  /** Texto do botão */
  label: string;
  /** Ícone do botão (componente React) */
  icon?: React.ReactNode;
  /** Callback de clique */
  onClick: () => void;
  /** Variante do botão (default, outline, destructive, ghost, secondary) */
  variant?: ButtonProps["variant"];
  /** Tipo do botão: primary (h-12), secondary (h-10), tertiary (h-9) */
  type?: "primary" | "secondary" | "tertiary";
  /** Desabilitar botão */
  disabled?: boolean;
  /** Classes adicionais */
  className?: string;
  /** Estado de loading */
  loading?: boolean;
}

export interface MobileButtonGroupProps {
  /** Lista de configurações de botões */
  buttons: MobileButtonConfig[];
  /** Layout forçado: 'stacked' sempre empilha, 'row' sempre lado a lado, 'auto' decide automaticamente */
  layout?: "auto" | "stacked" | "row";
  /** Gap entre botões */
  gap?: "sm" | "md" | "lg";
  /** Classes adicionais para o container */
  className?: string;
  /** Aplicar safe-area-inset-bottom (para footers) */
  safeArea?: boolean;
}

// ============================================================
// Constantes de Design
// ============================================================

const HEIGHT_CLASSES = {
  primary: "h-12",
  secondary: "h-10",
  tertiary: "h-9",
} as const;

const ICON_SIZE_CLASSES = {
  primary: "w-5 h-5",
  secondary: "w-4 h-4",
  tertiary: "w-4 h-4",
} as const;

const GAP_CLASSES = {
  sm: "gap-1.5",
  md: "gap-2",
  lg: "gap-3",
} as const;

const SAFE_AREA_CLASS = "pb-[max(1rem,env(safe-area-inset-bottom,0px))]";

// ============================================================
// Componente Interno: MobileButton
// ============================================================

interface MobileButtonProps extends MobileButtonConfig {
  /** Se o botão deve ocupar largura total */
  fullWidth?: boolean;
  /** Se o botão deve usar flex-1 */
  flexible?: boolean;
}

const MobileButton = React.forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ 
    label, 
    icon, 
    onClick, 
    variant = "default", 
    type = "secondary",
    disabled = false,
    className,
    loading = false,
    fullWidth = false,
    flexible = false,
  }, ref) => {
    const heightClass = HEIGHT_CLASSES[type];
    const iconSizeClass = ICON_SIZE_CLASSES[type];
    
    // Aplica classes de largura baseado nas props
    const widthClass = fullWidth ? "w-full" : flexible ? "flex-1" : "";
    
    // Font weight para botões primários
    const fontClass = type === "primary" ? "font-medium" : "";

    return (
      <Button
        ref={ref}
        variant={variant}
        onClick={onClick}
        disabled={disabled || loading}
        className={cn(
          heightClass,
          widthClass,
          fontClass,
          "touch-manipulation",
          className
        )}
      >
        {icon && (
          <span className={cn(iconSizeClass, label ? "mr-1.5" : "", "flex items-center justify-center")}>
            {icon}
          </span>
        )}
        {label && (
          <span className={type !== "primary" ? "text-sm" : ""}>
            {label}
          </span>
        )}
      </Button>
    );
  }
);

MobileButton.displayName = "MobileButton";

// ============================================================
// Componente Principal: MobileButtonGroup
// ============================================================

export const MobileButtonGroup = React.forwardRef<HTMLDivElement, MobileButtonGroupProps>(
  ({ 
    buttons, 
    layout = "auto", 
    gap = "md",
    className,
    safeArea = false,
  }, ref) => {
    // Determina o layout baseado no número de botões
    const effectiveLayout = React.useMemo(() => {
      if (layout !== "auto") return layout;
      
      // Regra: 3+ botões = empilhado, senão lado a lado
      return buttons.length >= 3 ? "stacked" : "row";
    }, [layout, buttons.length]);

    // Separa botões primários dos secundários
    const primaryButtons = buttons.filter(b => b.type === "primary");
    const otherButtons = buttons.filter(b => b.type !== "primary");

    // Se temos botões primários e outros, renderiza em layout especial
    const hasMixedTypes = primaryButtons.length > 0 && otherButtons.length > 0;

    if (hasMixedTypes) {
      // Layout especial: primário em cima, secundários embaixo
      return (
        <div
          ref={ref}
          className={cn(
            "flex flex-col",
            GAP_CLASSES[gap],
            safeArea && SAFE_AREA_CLASS,
            className
          )}
        >
          {/* Botões primários - sempre w-full */}
          {primaryButtons.map((button) => (
            <MobileButton
              key={button.id}
              {...button}
              fullWidth
            />
          ))}
          
          {/* Botões secundários - lado a lado se <= 2, senão empilhados */}
          {otherButtons.length <= 2 ? (
            <div className={cn("flex", GAP_CLASSES[gap])}>
              {otherButtons.map((button) => (
                <MobileButton
                  key={button.id}
                  {...button}
                  flexible
                />
              ))}
            </div>
          ) : (
            otherButtons.map((button) => (
              <MobileButton
                key={button.id}
                {...button}
                fullWidth
              />
            ))
          )}
        </div>
      );
    }

    // Layout simples: todos do mesmo tipo
    if (effectiveLayout === "stacked") {
      return (
        <div
          ref={ref}
          className={cn(
            "flex flex-col",
            GAP_CLASSES[gap],
            safeArea && SAFE_AREA_CLASS,
            className
          )}
        >
          {buttons.map((button) => (
            <MobileButton
              key={button.id}
              {...button}
              fullWidth
            />
          ))}
        </div>
      );
    }

    // Layout em linha
    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          GAP_CLASSES[gap],
          safeArea && SAFE_AREA_CLASS,
          className
        )}
      >
        {buttons.map((button) => (
          <MobileButton
            key={button.id}
            {...button}
            flexible={buttons.length > 1}
            fullWidth={buttons.length === 1}
          />
        ))}
      </div>
    );
  }
);

MobileButtonGroup.displayName = "MobileButtonGroup";

// ============================================================
// Exports
// ============================================================

export { MobileButton };
export type { MobileButtonProps };

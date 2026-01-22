import * as React from "react";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomScroll } from "@/components/ui/custom-scroll";

/**
 * MobileModal - Componente de modal otimizado para dispositivos móveis
 * 
 * Características:
 * - Safe-area-inset automático para dispositivos com notch
 * - Overscroll-contain para evitar scroll chaining
 * - Estrutura flexível: header fixo, conteúdo scrollável, footer fixo
 * - Touch-manipulation para resposta instantânea
 * - Alturas responsivas baseadas em viewport
 */

// Re-exporta componentes base do Dialog
const MobileModal = Dialog;
const MobileModalTrigger = DialogTrigger;
const MobileModalClose = DialogClose;
const MobileModalPortal = DialogPortal;
const MobileModalOverlay = DialogOverlay;

// Tipos para o conteúdo do modal
interface MobileModalContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Tamanho máximo do modal */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Se deve mostrar o botão de fechar */
  showCloseButton?: boolean;
}

/**
 * Container principal do modal com responsividade mobile
 */
const MobileModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  MobileModalContentProps
>(({ className, children, size = "md", showCloseButton = true, ...props }, ref) => {
  // Mapeamento de tamanhos para classes
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)]",
  };

  return (
    <MobileModalPortal>
      <MobileModalOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          // Posicionamento centralizado
          "fixed left-[50%] top-[50%] z-50",
          "translate-x-[-50%] translate-y-[-50%]",
          
          // Largura responsiva
          "w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)]",
          sizeClasses[size],
          
          // Altura máxima responsiva
          "max-h-[85vh] sm:max-h-[90vh]",
          
          // Layout flexível para header/content/footer fixos
          "flex flex-col gap-0",
          
          // Estilo visual
          "border bg-background shadow-lg rounded-lg",
          
          // Comportamento de scroll
          "overscroll-contain",
          
          // Animações
          "duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          
          className
        )}
        {...props}
      >
        {children}
        
        {showCloseButton && (
          <DialogPrimitive.Close 
            className={cn(
              "absolute right-3 top-3 sm:right-4 sm:top-4",
              "rounded-sm opacity-70 ring-offset-background",
              "transition-opacity hover:opacity-100",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:pointer-events-none",
              "data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
              "touch-manipulation"
            )}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </MobileModalPortal>
  );
});
MobileModalContent.displayName = "MobileModalContent";

/**
 * Header do modal - fica fixo no topo
 */
interface MobileModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Se deve mostrar borda inferior */
  bordered?: boolean;
}

const MobileModalHeader = React.forwardRef<HTMLDivElement, MobileModalHeaderProps>(
  ({ className, bordered = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "p-4 sm:p-6 pb-3 sm:pb-4",
        "shrink-0", // Não encolhe
        "flex flex-col space-y-1.5 text-center sm:text-left",
        bordered && "border-b border-border/50",
        className
      )}
      {...props}
    />
  )
);
MobileModalHeader.displayName = "MobileModalHeader";

/**
 * Área de conteúdo scrollável do modal
 * 
 * IMPORTANTE: Para garantir scroll correto em mobile:
 * - O container usa height definida (não apenas maxHeight)
 * - O viewport interno do ScrollArea ocupa 100% da altura
 * - O conteúdo tem min-h-0 para permitir encolhimento
 */
interface MobileModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Se deve usar ScrollArea do Radix (recomendado para listas longas) */
  useScrollArea?: boolean;
  /** Altura máxima customizada (ex: "50vh", "400px") */
  maxHeight?: string;
}

const MobileModalBody = React.forwardRef<HTMLDivElement, MobileModalBodyProps>(
  ({ className, children, useScrollArea = true, maxHeight, ...props }, ref) => {
    // Calcula a altura efetiva - usa o valor passado ou um padrão robusto.
    // IMPORTANTE: usamos apenas maxHeight (e NÃO height fixa) para evitar cenários
    // onde `calc(...)` possa resultar em altura muito pequena/negativa em viewports
    // com pouca altura (ex.: mobile em landscape), o que “mata” o scroll.
    const effectiveMaxHeight = maxHeight || 'calc(85vh - 180px)';

    if (useScrollArea) {
      return (
        <div
          ref={ref}
          className="flex-1 min-h-0 overflow-hidden"
          style={{ maxHeight: effectiveMaxHeight }}
        >
          <CustomScroll 
            maxHeight="100%" 
            className="h-full w-full"
            contentClassName={cn(
              "p-4 sm:p-6 pt-3 sm:pt-4 pr-2 sm:pr-4", // pr menor para scrollbar
              className
            )}
          >
            <div {...props}>
              {children}
            </div>
          </CustomScroll>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex-1 min-h-0",
          "overflow-y-auto overscroll-contain",
          "p-4 sm:p-6 pt-3 sm:pt-4",
          className
        )}
        style={{ maxHeight: effectiveMaxHeight }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
MobileModalBody.displayName = "MobileModalBody";

/**
 * Footer do modal - fica fixo no fundo com safe-area
 */
interface MobileModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Se deve mostrar borda superior */
  bordered?: boolean;
}

const MobileModalFooter = React.forwardRef<HTMLDivElement, MobileModalFooterProps>(
  ({ className, bordered = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "p-4 sm:p-6 pt-3 sm:pt-4",
        "shrink-0", // Não encolhe
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        bordered && "border-t border-border/50",
        // Safe area para dispositivos com home indicator
        "pb-[max(1rem,env(safe-area-inset-bottom,0px))]",
        "sm:pb-6",
        className
      )}
      {...props}
    />
  )
);
MobileModalFooter.displayName = "MobileModalFooter";

/**
 * Título do modal
 */
const MobileModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      "pr-8", // Espaço para o botão de fechar
      className
    )}
    {...props}
  />
));
MobileModalTitle.displayName = "MobileModalTitle";

/**
 * Descrição/subtítulo do modal
 */
const MobileModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
MobileModalDescription.displayName = "MobileModalDescription";

export {
  MobileModal,
  MobileModalTrigger,
  MobileModalClose,
  MobileModalPortal,
  MobileModalOverlay,
  MobileModalContent,
  MobileModalHeader,
  MobileModalBody,
  MobileModalFooter,
  MobileModalTitle,
  MobileModalDescription,
};

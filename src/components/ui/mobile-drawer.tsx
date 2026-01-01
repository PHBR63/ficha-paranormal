import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * MobileDrawer - Componente de bottom-sheet otimizado para mobile
 * 
 * Características:
 * - Bottom-sheet nativo do Vaul com swipe-to-dismiss
 * - Safe-area-inset automático para dispositivos com home indicator
 * - Overscroll-contain para evitar scroll chaining
 * - Estrutura flexível: header fixo, conteúdo scrollável, footer fixo
 * - Touch-manipulation para resposta instantânea
 * - Alturas responsivas baseadas em viewport
 */

// Re-exporta componentes base do Drawer
const MobileDrawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
);
MobileDrawer.displayName = "MobileDrawer";

const MobileDrawerTrigger = DrawerPrimitive.Trigger;

const MobileDrawerPortal = DrawerPrimitive.Portal;

const MobileDrawerClose = DrawerPrimitive.Close;

/**
 * Overlay do drawer com fade animation
 */
const MobileDrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
));
MobileDrawerOverlay.displayName = "MobileDrawerOverlay";

// Tipos para o conteúdo do drawer
interface MobileDrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> {
  /** Altura máxima do drawer (porcentagem da viewport) */
  maxHeight?: "sm" | "md" | "lg" | "xl" | "full";
  /** Se deve mostrar o handle de arrastar */
  showHandle?: boolean;
  /** Se deve mostrar o botão de fechar */
  showCloseButton?: boolean;
}

/**
 * Container principal do drawer com responsividade mobile
 */
const MobileDrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  MobileDrawerContentProps
>(({ className, children, maxHeight = "lg", showHandle = true, showCloseButton = false, ...props }, ref) => {
  // Mapeamento de alturas máximas
  const heightClasses = {
    sm: "max-h-[50vh]",
    md: "max-h-[65vh]",
    lg: "max-h-[85vh]",
    xl: "max-h-[92vh]",
    full: "max-h-[100vh]",
  };

  return (
    <MobileDrawerPortal>
      <MobileDrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(
          // Posicionamento bottom-sheet
          "fixed inset-x-0 bottom-0 z-50",
          
          // Altura máxima responsiva
          heightClasses[maxHeight],
          
          // Layout flexível para header/content/footer fixos
          "flex flex-col",
          
          // Estilo visual
          "mt-24 rounded-t-[10px] border bg-background",
          
          // Comportamento de scroll
          "overscroll-contain",
          
          // Touch para resposta instantânea
          "touch-manipulation",
          
          className
        )}
        {...props}
      >
        {/* Handle de arrastar */}
        {showHandle && (
          <div className="mx-auto mt-4 h-1.5 w-[60px] shrink-0 rounded-full bg-muted" />
        )}
        
        {children}
        
        {/* Botão de fechar opcional */}
        {showCloseButton && (
          <DrawerPrimitive.Close 
            className={cn(
              "absolute right-3 top-3",
              "rounded-sm opacity-70 ring-offset-background",
              "transition-opacity hover:opacity-100",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:pointer-events-none",
              "touch-manipulation"
            )}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </DrawerPrimitive.Close>
        )}
      </DrawerPrimitive.Content>
    </MobileDrawerPortal>
  );
});
MobileDrawerContent.displayName = "MobileDrawerContent";

/**
 * Header do drawer - fica fixo no topo
 */
interface MobileDrawerHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Se deve mostrar borda inferior */
  bordered?: boolean;
}

const MobileDrawerHeader = React.forwardRef<HTMLDivElement, MobileDrawerHeaderProps>(
  ({ className, bordered = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "px-4 pt-3 pb-2",
        "shrink-0", // Não encolhe
        "grid gap-1.5 text-center sm:text-left",
        bordered && "border-b border-border/50",
        className
      )}
      {...props}
    />
  )
);
MobileDrawerHeader.displayName = "MobileDrawerHeader";

/**
 * Área de conteúdo scrollável do drawer
 */
interface MobileDrawerBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Se deve usar ScrollArea do Radix (recomendado para listas longas) */
  useScrollArea?: boolean;
  /** Altura máxima customizada */
  maxHeight?: string;
}

const MobileDrawerBody = React.forwardRef<HTMLDivElement, MobileDrawerBodyProps>(
  ({ className, children, useScrollArea = true, maxHeight, ...props }, ref) => {
    const content = (
      <div
        className={cn(
          "px-4 py-3",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );

    if (useScrollArea) {
      return (
        <ScrollArea
          ref={ref}
          className={cn(
            "flex-1 min-h-0", // Ocupa espaço restante
            "overscroll-contain"
          )}
          style={maxHeight ? { maxHeight } : undefined}
        >
          {content}
        </ScrollArea>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex-1 min-h-0",
          "overflow-y-auto overscroll-contain",
          "scrollbar-hide"
        )}
        style={maxHeight ? { maxHeight } : undefined}
      >
        {content}
      </div>
    );
  }
);
MobileDrawerBody.displayName = "MobileDrawerBody";

/**
 * Footer do drawer - fica fixo no fundo com safe-area
 */
interface MobileDrawerFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Se deve mostrar borda superior */
  bordered?: boolean;
}

const MobileDrawerFooter = React.forwardRef<HTMLDivElement, MobileDrawerFooterProps>(
  ({ className, bordered = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "px-4 pt-2",
        "shrink-0", // Não encolhe
        "flex flex-col gap-2",
        bordered && "border-t border-border/50",
        // Safe area para dispositivos com home indicator
        "pb-[max(1rem,env(safe-area-inset-bottom,0px))]",
        className
      )}
      {...props}
    />
  )
);
MobileDrawerFooter.displayName = "MobileDrawerFooter";

/**
 * Título do drawer
 */
const MobileDrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
MobileDrawerTitle.displayName = "MobileDrawerTitle";

/**
 * Descrição/subtítulo do drawer
 */
const MobileDrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
MobileDrawerDescription.displayName = "MobileDrawerDescription";

export {
  MobileDrawer,
  MobileDrawerTrigger,
  MobileDrawerClose,
  MobileDrawerPortal,
  MobileDrawerOverlay,
  MobileDrawerContent,
  MobileDrawerHeader,
  MobileDrawerBody,
  MobileDrawerFooter,
  MobileDrawerTitle,
  MobileDrawerDescription,
};

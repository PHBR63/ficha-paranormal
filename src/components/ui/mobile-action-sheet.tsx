import * as React from "react";
import { LucideIcon } from '@/components/icons/ordem-icons';
import { cn } from "@/lib/utils";
import {
  MobileDrawer,
  MobileDrawerContent,
  MobileDrawerHeader,
  MobileDrawerTitle,
  MobileDrawerDescription,
  MobileDrawerBody,
  MobileDrawerFooter,
} from "@/components/ui/mobile-drawer";
import { Button } from "@/components/ui/button";

/**
 * MobileActionSheet - Componente de ações rápidas estilo iOS
 * 
 * Características:
 * - Lista de ações com ícones opcionais
 * - Suporte a ações destrutivas (vermelho)
 * - Botão de cancelar automático
 * - Separadores visuais entre grupos
 * - Animação suave de entrada/saída via MobileDrawer
 */

// Tipos para as ações do ActionSheet
export interface ActionSheetAction {
  /** ID único da ação */
  id: string;
  /** Texto da ação */
  label: string;
  /** Ícone opcional (componente Lucide) */
  icon?: LucideIcon;
  /** Callback ao clicar */
  onPress: () => void;
  /** Se é uma ação destrutiva (exibida em vermelho) */
  destructive?: boolean;
  /** Se a ação está desabilitada */
  disabled?: boolean;
  /** Descrição opcional abaixo do label */
  description?: string;
}

// Grupo de ações (para separadores visuais)
export interface ActionSheetGroup {
  /** Título opcional do grupo */
  title?: string;
  /** Lista de ações do grupo */
  actions: ActionSheetAction[];
}

// Props do componente
export interface MobileActionSheetProps {
  /** Controla se o sheet está aberto */
  open: boolean;
  /** Callback quando o estado muda */
  onOpenChange: (open: boolean) => void;
  /** Título do ActionSheet */
  title?: string;
  /** Descrição/subtítulo opcional */
  description?: string;
  /** Lista de ações (modo simples) */
  actions?: ActionSheetAction[];
  /** Lista de grupos de ações (modo agrupado) */
  groups?: ActionSheetGroup[];
  /** Texto do botão cancelar (default: "Cancelar") */
  cancelLabel?: string;
  /** Se deve mostrar o botão cancelar */
  showCancel?: boolean;
  /** Callback ao cancelar */
  onCancel?: () => void;
  /** Se deve fechar ao clicar em uma ação */
  closeOnAction?: boolean;
}

/**
 * Item individual de ação
 */
const ActionItem = React.memo(({
  action,
  onPress,
}: {
  action: ActionSheetAction;
  onPress: () => void;
}) => {
  const Icon = action.icon;

  return (
    <button
      type="button"
      onClick={onPress}
      disabled={action.disabled}
      className={cn(
        // Layout
        "w-full flex items-center gap-3 px-4 py-3",
        // Interação
        "touch-manipulation",
        "transition-colors duration-150",
        "hover:bg-muted/50 active:bg-muted",
        // Estados
        action.disabled && "opacity-50 cursor-not-allowed",
        // Cor destrutiva
        action.destructive && "text-destructive hover:bg-destructive/10 active:bg-destructive/20",
        // Cor normal
        !action.destructive && !action.disabled && "text-foreground"
      )}
    >
      {/* Ícone */}
      {Icon && (
        <Icon 
          className={cn(
            "h-5 w-5 shrink-0",
            action.destructive ? "text-destructive" : "text-muted-foreground"
          )} 
        />
      )}
      
      {/* Texto */}
      <div className="flex-1 text-left">
        <span className={cn(
          "text-base font-medium",
          action.destructive && "text-destructive"
        )}>
          {action.label}
        </span>
        
        {action.description && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {action.description}
          </p>
        )}
      </div>
    </button>
  );
});
ActionItem.displayName = "ActionItem";

/**
 * Separador entre grupos
 */
const GroupSeparator = ({ title }: { title?: string }) => (
  <div className="pt-2">
    {title ? (
      <div className="px-4 py-2 border-t border-border/50">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </span>
      </div>
    ) : (
      <div className="h-2 bg-muted/30 border-y border-border/30" />
    )}
  </div>
);

/**
 * Componente principal MobileActionSheet
 */
export function MobileActionSheet({
  open,
  onOpenChange,
  title,
  description,
  actions = [],
  groups,
  cancelLabel = "Cancelar",
  showCancel = true,
  onCancel,
  closeOnAction = true,
}: MobileActionSheetProps) {
  
  // Função para feedback háptico
  const triggerHaptic = React.useCallback((intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    // Vibration API - suportada na maioria dos dispositivos móveis
    if ('vibrate' in navigator) {
      const duration = intensity === 'light' ? 10 : intensity === 'medium' ? 20 : 30;
      navigator.vibrate(duration);
    }
  }, []);

  // Handler para ação
  const handleAction = React.useCallback((action: ActionSheetAction) => {
    if (action.disabled) return;
    
    // Feedback háptico ao selecionar ação
    triggerHaptic(action.destructive ? 'medium' : 'light');
    
    action.onPress();
    
    if (closeOnAction) {
      onOpenChange(false);
    }
  }, [closeOnAction, onOpenChange, triggerHaptic]);

  // Handler para cancelar
  const handleCancel = React.useCallback(() => {
    onCancel?.();
    onOpenChange(false);
  }, [onCancel, onOpenChange]);

  // Renderiza lista de ações
  const renderActions = (actionList: ActionSheetAction[]) => (
    <div className="divide-y divide-border/30">
      {actionList.map((action) => (
        <ActionItem
          key={action.id}
          action={action}
          onPress={() => handleAction(action)}
        />
      ))}
    </div>
  );

  // Calcula altura baseada no número de itens
  const totalActions = groups 
    ? groups.reduce((acc, g) => acc + g.actions.length, 0)
    : actions.length;
  
  const maxHeight = totalActions > 6 ? "lg" : totalActions > 3 ? "md" : "sm";

  return (
    <MobileDrawer open={open} onOpenChange={onOpenChange}>
      <MobileDrawerContent maxHeight={maxHeight} showHandle>
        {/* Header opcional */}
        {(title || description) && (
          <MobileDrawerHeader className="text-center pb-2">
            {title && (
              <MobileDrawerTitle className="text-base">
                {title}
              </MobileDrawerTitle>
            )}
            {description && (
              <MobileDrawerDescription>
                {description}
              </MobileDrawerDescription>
            )}
          </MobileDrawerHeader>
        )}

        {/* Lista de ações */}
        <MobileDrawerBody useScrollArea={totalActions > 5} className="px-0 py-0">
          {/* Modo agrupado */}
          {groups && groups.length > 0 && (
            <div>
              {groups.map((group, index) => (
                <React.Fragment key={group.title || index}>
                  {index > 0 && <GroupSeparator title={group.title} />}
                  {index === 0 && group.title && (
                    <div className="px-4 py-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {group.title}
                      </span>
                    </div>
                  )}
                  {renderActions(group.actions)}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Modo simples */}
          {!groups && actions.length > 0 && renderActions(actions)}
        </MobileDrawerBody>

        {/* Botão Cancelar */}
        {showCancel && (
          <MobileDrawerFooter className="pt-2">
            <Button
              variant="outline"
              className="w-full h-12 text-base font-medium"
              onClick={handleCancel}
            >
              {cancelLabel}
            </Button>
          </MobileDrawerFooter>
        )}
      </MobileDrawerContent>
    </MobileDrawer>
  );
}

/**
 * Hook utilitário para gerenciar estado do ActionSheet
 */
export function useActionSheet() {
  const [isOpen, setIsOpen] = React.useState(false);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    setIsOpen,
    open,
    close,
    toggle,
  };
}

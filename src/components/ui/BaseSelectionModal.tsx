/**
 * BaseSelectionModal - Template Base para Modais de Seleção
 * 
 * Este arquivo documenta o PADRÃO OFICIAL para modais de seleção no projeto.
 * Use este template como referência ao criar novos modais ou ao refatorar existentes.
 * 
 * ## REGRAS FUNDAMENTAIS:
 * 
 * 1. **SEMPRE usar MobileModalBody com scroll por padrão**
 *    - useScrollArea={true} (padrão, pode omitir)
 *    - NÃO usar maxHeight fixa em pixels (ex: "300px") - use calc() ou omitir
 *    - O MobileModalBody já tem fallback robusto: 'calc(85vh - 180px)'
 * 
 * 2. **NUNCA usar `sticky` dentro do scroll**
 *    - SimpleBar/CustomScroll não suportam sticky corretamente
 *    - Elementos fixos (contadores, filtros) devem ficar FORA do MobileModalBody
 * 
 * 3. **Estrutura padrão:**
 *    - MobileModalHeader: Título e descrição
 *    - Área fixa (opcional): Contadores, filtros, tabs - FORA do scroll
 *    - MobileModalBody: Apenas conteúdo dinâmico/scrollável
 *    - MobileModalFooter: Botões de ação
 * 
 * 4. **Padding para scrollbar**
 *    - O MobileModalBody já adiciona pr-2/pr-4 automaticamente
 *    - Se usar CustomScroll direto, adicione pr-3 no conteúdo
 * 
 * ## EXEMPLO DE USO:
 * 
 * ```tsx
 * <MobileModal open={isOpen} onOpenChange={onClose}>
 *   <MobileModalContent size="md">
 *     <MobileModalHeader>
 *       <MobileModalTitle>Título do Modal</MobileModalTitle>
 *       <MobileModalDescription>Descrição breve</MobileModalDescription>
 *     </MobileModalHeader>
 *     
 *     {// Área fixa - contadores, filtros (FORA do scroll)}
 *     <div className="flex items-center justify-between px-4 sm:px-6 py-2 bg-muted/50 rounded-lg mx-4 sm:mx-6">
 *       <span className="text-sm text-muted-foreground">Selecionados</span>
 *       <Badge>{count}/{max}</Badge>
 *     </div>
 *     
 *     {// Body scrollável - apenas conteúdo dinâmico}
 *     <MobileModalBody useScrollArea={true}>
 *       <div className="space-y-3">
 *         {items.map(item => (
 *           <ItemCard key={item.id} {...item} />
 *         ))}
 *       </div>
 *     </MobileModalBody>
 *     
 *     <MobileModalFooter bordered>
 *       <Button variant="outline" onClick={onClose}>Cancelar</Button>
 *       <Button onClick={onConfirm}>Confirmar</Button>
 *     </MobileModalFooter>
 *   </MobileModalContent>
 * </MobileModal>
 * ```
 * 
 * ## PADRÃO ALTERNATIVO (CustomScroll direto):
 * 
 * Use quando precisar de controle mais fino sobre o scroll:
 * 
 * ```tsx
 * <div className="flex-1 min-h-0 px-4 sm:px-6">
 *   <CustomScroll maxHeight="calc(60vh - 100px)" className="w-full rounded-md">
 *     <div className="space-y-3 pr-3 pb-2">
 *       {// Conteúdo com padding direito para scrollbar}
 *     </div>
 *   </CustomScroll>
 * </div>
 * ```
 * 
 * @module BaseSelectionModal
 * @see MobileModal
 * @see MobileModalBody
 * @see CustomScroll
 */

import * as React from 'react';
import {
  MobileModal,
  MobileModalContent,
  MobileModalHeader,
  MobileModalBody,
  MobileModalFooter,
  MobileModalTitle,
  MobileModalDescription,
} from '@/components/ui/mobile-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============================================================================
// TIPOS BASE PARA MODAIS DE SELEÇÃO
// ============================================================================

export interface BaseSelectionModalProps {
  /** Se o modal está aberto */
  open: boolean;
  /** Handler para mudança de estado (fechar) */
  onOpenChange: (open: boolean) => void;
  /** Título do modal */
  title: string;
  /** Descrição opcional */
  description?: string;
  /** Tamanho do modal */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface SelectionCounterProps {
  /** Número atual de itens selecionados */
  current: number;
  /** Número máximo/esperado de itens */
  max: number;
  /** Label opcional para o contador */
  label?: string;
  /** Se a seleção está válida/completa */
  isValid?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

// ============================================================================
// COMPONENTES AUXILIARES REUTILIZÁVEIS
// ============================================================================

/**
 * Contador de seleção padronizado - SEMPRE usar FORA do MobileModalBody
 * 
 * @example
 * ```tsx
 * <SelectionCounter current={2} max={5} label="Perícias selecionadas" />
 * ```
 */
export function SelectionCounter({
  current,
  max,
  label = 'Selecionados',
  isValid,
  className,
}: SelectionCounterProps) {
  const valid = isValid ?? current === max;
  
  return (
    <div 
      className={cn(
        "flex items-center justify-between px-4 sm:px-6 py-2 bg-muted/50 rounded-lg mx-4 sm:mx-6",
        className
      )}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge 
        variant={valid ? 'default' : 'outline'} 
        className={cn(valid && 'bg-success/20 text-success border-success/30')}
      >
        {current}/{max}
      </Badge>
    </div>
  );
}

/**
 * Container para área fixa (filtros, tabs, contadores)
 * Use FORA do MobileModalBody para elementos que não devem scrollar
 */
export function ModalFixedArea({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn("shrink-0", className)}>
      {children}
    </div>
  );
}

// ============================================================================
// TEMPLATE COMPLETO (para referência/cópia)
// ============================================================================

/**
 * Template de modal de seleção completo.
 * Este componente serve como EXEMPLO e pode ser copiado para criar novos modais.
 * 
 * NÃO use diretamente em produção - copie e adapte para sua necessidade específica.
 */
export function ExampleSelectionModal({
  open,
  onOpenChange,
  title,
  description,
  size = 'md',
}: BaseSelectionModalProps) {
  // Estado de exemplo
  const [selectedItems, setSelectedItems] = React.useState<string[]>([]);
  const maxItems = 3;
  const isValid = selectedItems.length === maxItems;
  
  // Dados de exemplo
  const items = [
    { id: '1', name: 'Item 1', description: 'Descrição do item 1' },
    { id: '2', name: 'Item 2', description: 'Descrição do item 2' },
    { id: '3', name: 'Item 3', description: 'Descrição do item 3' },
    { id: '4', name: 'Item 4', description: 'Descrição do item 4' },
    { id: '5', name: 'Item 5', description: 'Descrição do item 5' },
  ];

  const toggleItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : prev.length < maxItems ? [...prev, id] : prev
    );
  };

  const handleConfirm = () => {
    if (!isValid) return;
    console.log('Selecionados:', selectedItems);
    onOpenChange(false);
  };

  return (
    <MobileModal open={open} onOpenChange={onOpenChange}>
      <MobileModalContent size={size}>
        {/* 1. HEADER - Sempre presente */}
        <MobileModalHeader>
          <MobileModalTitle>{title}</MobileModalTitle>
          {description && (
            <MobileModalDescription>{description}</MobileModalDescription>
          )}
        </MobileModalHeader>
        
        {/* 2. ÁREA FIXA - Contadores, filtros (FORA do scroll) */}
        <SelectionCounter 
          current={selectedItems.length} 
          max={maxItems} 
          label="Itens selecionados"
          isValid={isValid}
        />
        
        {/* 3. BODY SCROLLÁVEL - Apenas conteúdo dinâmico */}
        <MobileModalBody useScrollArea={true}>
          <div className="space-y-3">
            {items.map(item => {
              const isSelected = selectedItems.includes(item.id);
              const canSelect = isSelected || selectedItems.length < maxItems;
              
              return (
                <div
                  key={item.id}
                  onClick={() => canSelect && toggleItem(item.id)}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all",
                    isSelected 
                      ? "bg-primary/10 border-primary/30" 
                      : canSelect 
                        ? "bg-card hover:bg-muted/50 border-border" 
                        : "bg-muted/30 border-border/50 opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center",
                      isSelected ? "bg-primary border-primary" : "border-muted-foreground/50"
                    )}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </MobileModalBody>
        
        {/* 4. FOOTER - Botões de ação */}
        <MobileModalFooter bordered>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            Confirmar ({selectedItems.length}/{maxItems})
          </Button>
        </MobileModalFooter>
      </MobileModalContent>
    </MobileModal>
  );
}

export default ExampleSelectionModal;

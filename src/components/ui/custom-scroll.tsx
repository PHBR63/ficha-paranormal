/**
 * CustomScroll - Wrapper para SimpleBar React
 * 
 * Fornece scrollbar visível e consistente em todos os dispositivos e navegadores.
 * Usa scroll nativo para performance, apenas customiza o visual.
 */
import * as React from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { cn } from '@/lib/utils';

export interface CustomScrollProps {
  children: React.ReactNode;
  /** Classes CSS adicionais para o container */
  className?: string;
  /** Altura máxima do container (ex: "50vh", "400px", "100%") */
  maxHeight?: string | number;
  /** Se deve esconder a scrollbar automaticamente quando não está em uso */
  autoHide?: boolean;
  /** Classes CSS para o conteúdo interno */
  contentClassName?: string;
}

/**
 * Container de scroll customizado com scrollbar visível
 * 
 * @example
 * ```tsx
 * <CustomScroll maxHeight="60vh">
 *   <div>Conteúdo longo aqui...</div>
 * </CustomScroll>
 * ```
 */
export const CustomScroll = React.forwardRef<HTMLDivElement, CustomScrollProps>(
  ({ children, className, maxHeight = '100%', autoHide = false, contentClassName }, ref) => {
    return (
      <SimpleBar
        className={cn('custom-scroll', className)}
        style={{ maxHeight }}
        autoHide={autoHide}
        scrollableNodeProps={{ ref }}
      >
        <div className={contentClassName}>
          {children}
        </div>
      </SimpleBar>
    );
  }
);

CustomScroll.displayName = 'CustomScroll';

export default CustomScroll;

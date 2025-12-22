/**
 * DataErrorBoundary - Tratativa de erro para componentes de dados
 * 
 * Diferente do ErrorBoundary geral, este:
 * - Mostra uma UI compacta que não quebra o layout
 * - Permite tentar novamente sem recarregar a página
 * - Logga erros para debugging
 * 
 * Uso: Envolver componentes que processam dados dinâmicos
 * para capturar erros de runtime e permitir recuperação.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  /** Mensagem amigável para exibir ao usuário */
  fallbackMessage?: string;
  /** Callback opcional para logging externo de erros */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class DataErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Atualiza o estado para renderizar a UI de fallback
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log do erro para debugging
    console.error('[DataErrorBoundary] Erro capturado:', error);
    console.error('[DataErrorBoundary] Stack do componente:', errorInfo.componentStack);
    
    // Callback opcional para logging externo
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    // Reseta o estado para tentar renderizar novamente
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-destructive/30 rounded-lg bg-destructive/5">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {this.props.fallbackMessage || 'Erro ao carregar dados'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {this.state.error?.message || 'Um erro inesperado ocorreu'}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={this.handleRetry}
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Tentar novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#0D0A0B] flex items-center justify-center p-4">
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1A0505] to-[#0D0A0B]" />
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#8B0000]/20 rounded-full blur-[120px]" />
          </div>
          
          <div className="relative z-10 max-w-md w-full">
            <div className="bg-gradient-to-b from-[#1A0808] to-[#0D0A0B] border border-[#8B0000]/40 rounded-xl p-8 shadow-[0_0_40px_rgba(139,0,0,0.2)]">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-[#8B0000]/20 border border-[#8B0000]/40 flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-[#B22222] animate-pulse" />
                </div>
              </div>

              {/* Title */}
              <h1 className="font-display text-2xl text-center text-[#F5F5F5] mb-2">
                ANOMALIA DETECTADA
              </h1>
              <p className="text-[#8B0000] text-xs text-center uppercase tracking-[0.2em] mb-4 font-mono">
                Erro do Outro Lado
              </p>

              {/* Message */}
              <p className="text-[#A0A0A0] text-sm text-center mb-6 leading-relaxed">
                Algo inesperado aconteceu. A Ordem está trabalhando para resolver o problema.
              </p>

              {/* Error details (collapsed) */}
              {this.state.error && (
                <details className="mb-6">
                  <summary className="text-[#808080] text-xs cursor-pointer hover:text-[#B22222] transition-colors font-mono">
                    Detalhes técnicos
                  </summary>
                  <div className="mt-2 p-3 bg-[#0D0A0B] border border-[#3D1518]/40 rounded-lg overflow-auto max-h-32">
                    <code className="text-[#B22222] text-xs break-all">
                      {this.state.error.message}
                    </code>
                  </div>
                </details>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={this.handleRetry}
                  className="w-full bg-[#8B0000] hover:bg-[#B22222] text-white border-0"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full border-[#8B0000]/40 text-[#C0C0C0] hover:bg-[#8B0000]/10 hover:text-white"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Voltar ao Início
                </Button>

                <button
                  onClick={this.handleReload}
                  className="text-[#808080] hover:text-[#B22222] text-xs text-center transition-colors font-mono"
                >
                  Recarregar página
                </button>
              </div>

              {/* Decorative line */}
              <div className="mt-6 h-px bg-gradient-to-r from-transparent via-[#8B0000]/40 to-transparent" />
              
              <p className="text-[#505050] text-[10px] text-center mt-4 font-mono">
                Se o problema persistir, entre em contato com o suporte
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

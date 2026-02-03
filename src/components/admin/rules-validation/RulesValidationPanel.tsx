/**
 * RulesValidationPanel - Painel de validação de regras oficiais
 * 
 * Executa validações contra as regras oficiais do Ordem Paranormal RPG v1.3
 * e exibe resultados com opções de exportação em PDF e JSON.
 * 
 * Este é o componente principal que orquestra a validação e exportação.
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MobileActionSheet, useActionSheet } from '@/components/ui/mobile-action-sheet';
import { useIsMobile } from '@/hooks';
import {
  Play,
  FileCheck,
  Download,
  FileJson,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  runFullValidation, 
  type ValidationReport, 
  type ValidationResult 
} from '@/lib/official-rules-validator';
import { toast } from 'sonner';

import { ValidationResultsList } from './ValidationResultsList';
import { generateJsonReport, generatePdfReport } from './validation-report-templates';

/**
 * Painel principal de validação de regras oficiais
 */
export function RulesValidationPanel() {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const isMobile = useIsMobile();
  const exportSheet = useActionSheet();

  // Agrupa resultados por categoria
  const groupedResults = useMemo(() => {
    if (!report) return {};
    
    const grouped: Record<string, ValidationResult[]> = {};
    for (const result of report.results) {
      if (!grouped[result.category]) {
        grouped[result.category] = [];
      }
      grouped[result.category].push(result);
    }
    return grouped;
  }, [report]);

  // Executa validação completa
  const handleRunValidation = () => {
    setIsRunning(true);
    
    // Pequeno delay para UX
    setTimeout(() => {
      const result = runFullValidation();
      setReport(result);
      setIsRunning(false);
      
      // Agrupa resultados para encontrar categorias com falhas
      const grouped: Record<string, ValidationResult[]> = {};
      for (const r of result.results) {
        if (!grouped[r.category]) {
          grouped[r.category] = [];
        }
        grouped[r.category].push(r);
      }
      
      // Calcula sumário por categoria para o histórico
      const categorySummary: Record<string, { passed: number; failed: number; total: number }> = {};
      for (const [category, results] of Object.entries(grouped)) {
        categorySummary[category] = {
          passed: results.filter(r => r.passed).length,
          failed: results.filter(r => !r.passed).length,
          total: results.length,
        };
      }
      
      // Salva no histórico (via evento customizado para o dashboard capturar)
      const historyEntry = {
        timestamp: result.timestamp.toISOString(),
        totalTests: result.totalTests,
        passed: result.passed,
        failed: result.failed,
        successRate: Math.round((result.passed / result.totalTests) * 100),
        categorySummary,
      };
      
      // Dispara evento para salvar no histórico
      window.dispatchEvent(new CustomEvent('validation-completed', { detail: historyEntry }));
      
      // Expande categorias com falhas
      const failedCategories = Object.entries(grouped)
        .filter(([_, results]) => results.some(r => !r.passed))
        .map(([category]) => category);
      setExpandedCategories(failedCategories);
      
      if (result.failed === 0) {
        toast.success('✅ Todas as validações passaram!', {
          description: `${result.totalTests} testes executados com sucesso.`,
        });
      } else {
        toast.warning(`⚠️ ${result.failed} falha(s) encontrada(s)`, {
          description: `${result.passed}/${result.totalTests} testes passaram.`,
        });
      }
    }, 500);
  };

  // Toggle categoria
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Exportar JSON
  const handleExportJson = () => {
    if (!report) return;
    
    const jsonContent = generateJsonReport(report, groupedResults);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validacao-regras-${report.timestamp.toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Relatório JSON exportado!');
  };

  // Exportar PDF (abre em nova janela para impressão)
  const handleExportPdf = () => {
    if (!report) return;
    
    const htmlContent = generatePdfReport(report, groupedResults);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Aguarda carregar e abre diálogo de impressão
      printWindow.onload = () => {
        printWindow.print();
      };
      
      toast.success('Relatório PDF aberto para impressão!');
    } else {
      toast.error('Não foi possível abrir a janela de impressão');
    }
  };

  const successRate = report 
    ? Math.round((report.passed / report.totalTests) * 100) 
    : 0;

  return (
    <Card className="ordo-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileCheck className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Validador de Regras Oficiais</CardTitle>
              <CardDescription className="text-xs">
                Ordem Paranormal RPG v1.3
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {report && (
              <>
                {/* Desktop: DropdownMenu */}
                {!isMobile ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleExportJson}>
                        <FileJson className="w-4 h-4 mr-2" />
                        Exportar JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportPdf}>
                        <FileText className="w-4 h-4 mr-2" />
                        Exportar PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={exportSheet.open}>
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                    <MobileActionSheet
                      open={exportSheet.isOpen}
                      onOpenChange={exportSheet.setIsOpen}
                      title="Exportar Relatório"
                      actions={[
                        {
                          id: 'json',
                          label: 'Exportar JSON',
                          icon: FileJson,
                          onPress: handleExportJson,
                        },
                        {
                          id: 'pdf',
                          label: 'Exportar PDF',
                          icon: FileText,
                          onPress: handleExportPdf,
                        },
                      ]}
                    />
                  </>
                )}
              </>
            )}
            <Button 
              onClick={handleRunValidation} 
              disabled={isRunning}
              size="sm"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Validando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Executar Validação
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Resumo */}
        {report && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Barra de progresso */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taxa de sucesso</span>
                <span className={cn(
                  "font-medium",
                  successRate === 100 ? "text-emerald-500" : 
                  successRate >= 90 ? "text-amber-500" : "text-destructive"
                )}>
                  {successRate}%
                </span>
              </div>
              <Progress 
                value={successRate} 
                className={cn(
                  "h-2",
                  successRate === 100 ? "[&>div]:bg-emerald-500" : 
                  successRate >= 90 ? "[&>div]:bg-amber-500" : "[&>div]:bg-destructive"
                )}
              />
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-secondary/50 rounded-lg text-center">
                <div className="text-lg font-bold">{report.totalTests}</div>
                <div className="text-[10px] text-muted-foreground">Total</div>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-lg text-center">
                <div className="text-lg font-bold text-emerald-500">{report.passed}</div>
                <div className="text-[10px] text-muted-foreground">Passou</div>
              </div>
              <div className="p-2 bg-destructive/10 rounded-lg text-center">
                <div className="text-lg font-bold text-destructive">{report.failed}</div>
                <div className="text-[10px] text-muted-foreground">Falhou</div>
              </div>
            </div>

            {/* Timestamp */}
            <div className="text-[10px] text-muted-foreground text-center">
              Última execução: {report.timestamp.toLocaleString('pt-BR')}
            </div>
          </motion.div>
        )}

        {/* Resultados por categoria */}
        {report && (
          <ValidationResultsList
            groupedResults={groupedResults}
            expandedCategories={expandedCategories}
            onToggleCategory={toggleCategory}
          />
        )}

        {/* Estado inicial */}
        {!report && !isRunning && (
          <div className="text-center py-8 text-muted-foreground">
            <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              Clique em "Executar Validação" para verificar
              <br />
              a conformidade com as regras oficiais.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

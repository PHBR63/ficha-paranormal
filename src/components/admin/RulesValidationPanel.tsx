/**
 * RulesValidationPanel - Painel de validação de regras oficiais
 * 
 * Exibe os resultados dos testes de validação do sistema
 * contra as regras oficiais do Ordem Paranormal RPG v1.3
 * Inclui exportação em PDF e JSON
 */

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MobileActionSheet, useActionSheet } from '@/components/ui/mobile-action-sheet';
import { useIsMobile } from '@/hooks';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  ChevronDown,
  ChevronUp,
  FileCheck,
  BookOpen,
  Sparkles,
  Shield,
  Swords,
  Flame,
  Users,
  Star,
  Zap,
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

// Ícones por categoria - usando cores semânticas
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Rituais': <Sparkles className="w-4 h-4" />,
  'Rituais Detalhados': <Sparkles className="w-4 h-4 text-violet-500" />,
  'Rituais - Custos PE': <Sparkles className="w-4 h-4 text-sky-500" />,
  'Rituais - Resistências': <Shield className="w-4 h-4 text-amber-500" />,
  'Rituais - Aprimoramentos': <Sparkles className="w-4 h-4 text-emerald-500" />,
  'Rituais - Custos Aprimoramentos': <Sparkles className="w-4 h-4 text-cyan-500" />,
  'Rituais - Círculos': <Sparkles className="w-4 h-4 text-rose-500" />,
  'Rituais - Elementos': <Flame className="w-4 h-4 text-amber-500" />,
  'Condições': <AlertTriangle className="w-4 h-4" />,
  'Modificadores': <Shield className="w-4 h-4" />,
  'Tipos de Dano': <Flame className="w-4 h-4" />,
  'Poderes Paranormais': <Zap className="w-4 h-4" />,
  'Origens': <Users className="w-4 h-4" />,
  'Classes': <Star className="w-4 h-4" />,
  'Trilhas': <Swords className="w-4 h-4" />,
  'Poderes de Classe': <Shield className="w-4 h-4 text-primary" />,
};

// Função para gerar relatório JSON
function generateJsonReport(report: ValidationReport, groupedResults: Record<string, ValidationResult[]>) {
  const exportData = {
    metadata: {
      sistema: 'Ordem Paranormal RPG',
      versao: 'v1.3',
      dataGeracao: report.timestamp.toISOString(),
      dataFormatada: report.timestamp.toLocaleString('pt-BR'),
    },
    resumo: {
      totalTestes: report.totalTests,
      aprovados: report.passed,
      reprovados: report.failed,
      taxaSucesso: Math.round((report.passed / report.totalTests) * 100),
    },
    categorias: Object.entries(groupedResults).map(([categoria, resultados]) => ({
      nome: categoria,
      totalTestes: resultados.length,
      aprovados: resultados.filter(r => r.passed).length,
      reprovados: resultados.filter(r => !r.passed).length,
      testes: resultados.map(r => ({
        nome: r.test,
        aprovado: r.passed,
        esperado: r.expected,
        atual: r.actual,
        referencia: r.reference || null,
      })),
    })),
    testesReprovados: report.results
      .filter(r => !r.passed)
      .map(r => ({
        categoria: r.category,
        teste: r.test,
        esperado: r.expected,
        atual: r.actual,
        referencia: r.reference || null,
      })),
  };

  return JSON.stringify(exportData, null, 2);
}

// Função para gerar relatório PDF (via HTML printable)
function generatePdfReport(report: ValidationReport, groupedResults: Record<string, ValidationResult[]>) {
  const successRate = Math.round((report.passed / report.totalTests) * 100);
  
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório de Validação - Ordem Paranormal RPG</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      padding: 20px; 
      color: #1a1a2e;
      line-height: 1.5;
    }
    .header { 
      text-align: center; 
      margin-bottom: 30px; 
      padding-bottom: 20px;
      border-bottom: 2px solid #4a0e4e;
    }
    .header h1 { 
      color: #4a0e4e; 
      font-size: 24px; 
      margin-bottom: 5px;
    }
    .header .subtitle { 
      color: #666; 
      font-size: 14px; 
    }
    .summary { 
      display: flex; 
      justify-content: center; 
      gap: 30px; 
      margin: 20px 0; 
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .stat { text-align: center; }
    .stat-value { font-size: 28px; font-weight: bold; }
    .stat-label { font-size: 12px; color: #666; }
    .stat-passed .stat-value { color: #10b981; }
    .stat-failed .stat-value { color: #ef4444; }
    .stat-rate .stat-value { color: ${successRate === 100 ? '#10b981' : successRate >= 90 ? '#f59e0b' : '#ef4444'}; }
    .category { 
      margin: 20px 0; 
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    .category-header { 
      background: #f3f4f6;
      padding: 12px 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .category-name { font-weight: 600; font-size: 14px; }
    .category-stats { font-size: 12px; color: #666; }
    .tests { padding: 10px 15px; }
    .test { 
      padding: 8px 10px;
      margin: 5px 0;
      border-left: 3px solid;
      border-radius: 0 4px 4px 0;
      font-size: 12px;
    }
    .test-passed { 
      border-color: #10b981; 
      background: #ecfdf5; 
    }
    .test-failed { 
      border-color: #ef4444; 
      background: #fef2f2; 
    }
    .test-name { font-weight: 500; margin-bottom: 3px; }
    .test-detail { color: #666; font-size: 11px; }
    .test-detail span { display: inline-block; margin-right: 15px; }
    .expected { color: #10b981; }
    .actual { color: #ef4444; }
    .reference { font-style: italic; color: #6b7280; }
    .footer { 
      margin-top: 30px; 
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
    }
    .failed-summary {
      margin-top: 30px;
      padding: 15px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
    }
    .failed-summary h3 {
      color: #ef4444;
      margin-bottom: 10px;
      font-size: 14px;
    }
    @media print {
      body { padding: 10px; }
      .category { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📋 Relatório de Validação de Regras</h1>
    <div class="subtitle">Ordem Paranormal RPG v1.3</div>
    <div class="subtitle">Gerado em: ${report.timestamp.toLocaleString('pt-BR')}</div>
  </div>

  <div class="summary">
    <div class="stat">
      <div class="stat-value">${report.totalTests}</div>
      <div class="stat-label">Total de Testes</div>
    </div>
    <div class="stat stat-passed">
      <div class="stat-value">${report.passed}</div>
      <div class="stat-label">Aprovados</div>
    </div>
    <div class="stat stat-failed">
      <div class="stat-value">${report.failed}</div>
      <div class="stat-label">Reprovados</div>
    </div>
    <div class="stat stat-rate">
      <div class="stat-value">${successRate}%</div>
      <div class="stat-label">Taxa de Sucesso</div>
    </div>
  </div>

  ${Object.entries(groupedResults).map(([category, results]) => {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    return `
    <div class="category">
      <div class="category-header">
        <span class="category-name">${category}</span>
        <span class="category-stats">${passed}/${results.length} aprovados${failed > 0 ? ` • ${failed} reprovado(s)` : ''}</span>
      </div>
      <div class="tests">
        ${results.map(r => `
          <div class="test ${r.passed ? 'test-passed' : 'test-failed'}">
            <div class="test-name">${r.passed ? '✓' : '✗'} ${r.test}</div>
            ${!r.passed ? `
              <div class="test-detail">
                <span class="expected">Esperado: ${r.expected}</span>
                <span class="actual">Atual: ${r.actual}</span>
                ${r.reference ? `<span class="reference">📖 ${r.reference}</span>` : ''}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    `;
  }).join('')}

  ${report.failed > 0 ? `
  <div class="failed-summary">
    <h3>⚠️ Resumo de Falhas (${report.failed})</h3>
    ${report.results.filter(r => !r.passed).map(r => `
      <div class="test test-failed">
        <div class="test-name">[${r.category}] ${r.test}</div>
        <div class="test-detail">
          <span class="expected">Esperado: ${r.expected}</span>
          <span class="actual">Atual: ${r.actual}</span>
        </div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="footer">
    Sistema de Validação de Regras Oficiais • Ordem Paranormal RPG
  </div>
</body>
</html>
  `;

  return html;
}

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

  const handleRunValidation = () => {
    setIsRunning(true);
    
    // Simula um pequeno delay para UX
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
                  successRate === 100 ? "text-green-500" : 
                  successRate >= 90 ? "text-yellow-500" : "text-destructive"
                )}>
                  {successRate}%
                </span>
              </div>
              <Progress 
                value={successRate} 
                className={cn(
                  "h-2",
                  successRate === 100 ? "[&>div]:bg-green-500" : 
                  successRate >= 90 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-destructive"
                )}
              />
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-secondary/50 rounded-lg text-center">
                <div className="text-lg font-bold">{report.totalTests}</div>
                <div className="text-[10px] text-muted-foreground">Total</div>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg text-center">
                <div className="text-lg font-bold text-green-500">{report.passed}</div>
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
          <ScrollArea className="h-[500px] -mx-4 px-4">
            <div className="space-y-2">
              {Object.entries(groupedResults).map(([category, results]) => {
                const passed = results.filter(r => r.passed).length;
                const failed = results.filter(r => !r.passed).length;
                const isExpanded = expandedCategories.includes(category);

                return (
                  <Collapsible
                    key={category}
                    open={isExpanded}
                    onOpenChange={() => toggleCategory(category)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className={cn(
                        "flex items-center justify-between p-3 rounded-lg transition-colors",
                        failed > 0 
                          ? "bg-destructive/10 hover:bg-destructive/20" 
                          : "bg-green-500/10 hover:bg-green-500/20"
                      )}>
                        <div className="flex items-center gap-2">
                          {CATEGORY_ICONS[category] || <BookOpen className="w-4 h-4" />}
                          <span className="font-medium text-sm">{category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={failed > 0 ? "destructive" : "default"}
                            className="text-[10px]"
                          >
                            {passed}/{results.length}
                          </Badge>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <AnimatePresence>
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-1 space-y-1 pl-4"
                        >
                          {results.map((result, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "p-2 rounded text-xs border-l-2",
                                result.passed 
                                  ? "border-green-500 bg-green-500/5" 
                                  : "border-destructive bg-destructive/5"
                              )}
                            >
                              <div className="flex items-start gap-2">
                                {result.passed ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium">{result.test}</div>
                                  {!result.passed && (
                                    <div className="mt-1 space-y-0.5 text-muted-foreground">
                                      <div>
                                        <span className="text-green-600">Esperado:</span> {result.expected}
                                      </div>
                                      <div>
                                        <span className="text-destructive">Atual:</span> {result.actual}
                                      </div>
                                      {result.reference && (
                                        <div className="text-[10px] italic">
                                          📖 {result.reference}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      </AnimatePresence>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
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

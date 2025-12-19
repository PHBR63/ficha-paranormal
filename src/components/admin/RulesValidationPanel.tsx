/**
 * RulesValidationPanel - Painel de validação de regras oficiais
 * 
 * Exibe os resultados dos testes de validação do sistema
 * contra as regras oficiais do Ordem Paranormal RPG v1.3
 */

import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  runFullValidation, 
  type ValidationReport, 
  type ValidationResult 
} from '@/lib/official-rules-validator';
import { toast } from 'sonner';

// Ícones por categoria
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Rituais': <Sparkles className="w-4 h-4" />,
  'Condições': <AlertTriangle className="w-4 h-4" />,
  'Modificadores': <Shield className="w-4 h-4" />,
  'Tipos de Dano': <Flame className="w-4 h-4" />,
  'Poderes Paranormais': <Zap className="w-4 h-4" />,
  'Origens': <Users className="w-4 h-4" />,
  'Classes': <Star className="w-4 h-4" />,
  'Trilhas': <Swords className="w-4 h-4" />,
};

export function RulesValidationPanel() {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

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
          <ScrollArea className="h-[400px] -mx-4 px-4">
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

/**
 * Painel de Testes do Sistema Unificado de Efeitos (SUE)
 * Ordem Paranormal RPG v1.3
 * 
 * Exibe os resultados dos testes automatizados do SUE
 * para validação do sistema de bônus consolidados.
 * 
 * @module SUETestPanel
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, Play, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { runAllSUETests, TestSuiteResult } from '@/lib/__tests__/unified-effects-engine.test';

/**
 * Componente que exibe resultados de testes do SUE
 */
export function SUETestPanel() {
  // Estado dos resultados dos testes
  const [testResults, setTestResults] = useState<TestSuiteResult[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());

  /**
   * Executa todos os testes do SUE
   */
  const handleRunTests = () => {
    setIsRunning(true);
    
    // Pequeno delay para mostrar estado de loading
    setTimeout(() => {
      const results = runAllSUETests();
      setTestResults(results);
      setIsRunning(false);
      
      // Expande suites com falhas automaticamente
      const suitesWithFailures = results
        .filter(s => s.failed > 0)
        .map(s => s.suiteName);
      setExpandedSuites(new Set(suitesWithFailures));
      
      // Log no console também
      console.log('\n========================================');
      console.log('  TESTES DO SISTEMA UNIFICADO DE EFEITOS (SUE)');
      console.log('========================================');
      results.forEach(suite => {
        console.log(`\n📦 ${suite.suiteName}: ✅ ${suite.passed} | ❌ ${suite.failed}`);
        suite.results.forEach(r => {
          console.log(`   ${r.passed ? '✅' : '❌'} ${r.name}`);
          if (!r.passed) console.log(`      → ${r.message}`);
        });
      });
    }, 100);
  };

  /**
   * Toggle de expansão de uma suite
   */
  const toggleSuite = (suiteName: string) => {
    setExpandedSuites(prev => {
      const next = new Set(prev);
      if (next.has(suiteName)) {
        next.delete(suiteName);
      } else {
        next.add(suiteName);
      }
      return next;
    });
  };

  /**
   * Calcula totais
   */
  const totals = useMemo(() => {
    if (!testResults) return { passed: 0, failed: 0, total: 0 };
    return {
      passed: testResults.reduce((acc, s) => acc + s.passed, 0),
      failed: testResults.reduce((acc, s) => acc + s.failed, 0),
      total: testResults.reduce((acc, s) => acc + s.results.length, 0),
    };
  }, [testResults]);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            🧪 Testes do SUE
          </CardTitle>
          <Button 
            onClick={handleRunTests} 
            disabled={isRunning}
            size="sm"
            variant="outline"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Executar Testes
              </>
            )}
          </Button>
        </div>
        
        {/* Resumo dos resultados */}
        {testResults && (
          <div className="flex items-center gap-4 mt-3">
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              {totals.passed} passaram
            </Badge>
            <Badge variant="secondary" className={`${totals.failed > 0 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-muted text-muted-foreground'}`}>
              <XCircle className="h-3 w-3 mr-1" />
              {totals.failed} falharam
            </Badge>
            <span className="text-sm text-muted-foreground">
              Total: {totals.total} testes
            </span>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {!testResults ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Clique em "Executar Testes" para validar o SUE</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {testResults.map((suite) => (
                <Collapsible 
                  key={suite.suiteName}
                  open={expandedSuites.has(suite.suiteName)}
                  onOpenChange={() => toggleSuite(suite.suiteName)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                      <div className="flex items-center gap-2">
                        {expandedSuites.has(suite.suiteName) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-medium">{suite.suiteName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                          ✅ {suite.passed}
                        </Badge>
                        {suite.failed > 0 && (
                          <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                            ❌ {suite.failed}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="ml-6 mt-2 space-y-1">
                      {suite.results.map((result, idx) => (
                        <div 
                          key={idx}
                          className={`flex items-start gap-2 p-2 rounded text-sm ${
                            result.passed 
                              ? 'text-green-400' 
                              : 'text-red-400 bg-red-500/10'
                          }`}
                        >
                          {result.passed ? (
                            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          )}
                          <div>
                            <span>{result.name}</span>
                            {!result.passed && (
                              <p className="text-xs text-red-300 mt-1">
                                → {result.message}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

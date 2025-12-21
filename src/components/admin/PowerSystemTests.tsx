/**
 * Painel de Testes do Sistema de Poderes - Admin
 * 
 * Permite executar e visualizar resultados dos testes automatizados
 * do sistema de poderes e trilhas.
 */

import { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, XCircle, PlayCircle, AlertTriangle, BookOpen, Loader2 } from 'lucide-react';
import { 
  runAllPowerSystemTests, 
  getPowerSystemStats,
  type TestSuiteResult 
} from '@/lib/class-powers/__tests__/power-system.test';

/**
 * Componente para exibir resultado de um teste individual
 */
function TestResultItem({ result }: { result: { name: string; passed: boolean; message: string; details?: string[] } }) {
  const Icon = result.passed ? CheckCircle2 : XCircle;
  const iconColor = result.passed ? 'text-green-500' : 'text-red-500';
  
  return (
    <div className="flex flex-col gap-1 p-2 rounded-md bg-muted/30">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <span className="font-medium text-sm">{result.name}</span>
      </div>
      <p className="text-xs text-muted-foreground ml-6">{result.message}</p>
      {result.details && result.details.length > 0 && (
        <ul className="ml-6 mt-1 space-y-0.5">
          {result.details.slice(0, 5).map((detail, idx) => (
            <li key={idx} className="text-xs text-muted-foreground/80 flex items-start gap-1">
              <span className="text-yellow-500">•</span>
              <span>{detail}</span>
            </li>
          ))}
          {result.details.length > 5 && (
            <li className="text-xs text-muted-foreground/60 italic">
              ... e mais {result.details.length - 5} itens
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

/**
 * Componente para exibir um suite de testes
 */
function TestSuiteCard({ suite }: { suite: TestSuiteResult }) {
  const passRate = Math.round((suite.passed / (suite.passed + suite.failed)) * 100);
  const isFullPass = suite.failed === 0;
  
  return (
    <AccordionItem value={suite.suiteName}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-2">
            {isFullPass ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            )}
            <span className="font-semibold">{suite.suiteName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isFullPass ? 'default' : 'secondary'} className={isFullPass ? 'bg-green-500' : ''}>
              {passRate}%
            </Badge>
            <span className="text-sm text-muted-foreground">
              {suite.passed}/{suite.passed + suite.failed}
            </span>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-2 pt-2">
          {suite.results.map((result, idx) => (
            <TestResultItem key={idx} result={result} />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

/**
 * Painel principal de testes do sistema de poderes
 */
export function PowerSystemTests() {
  const [testResults, setTestResults] = useState<TestSuiteResult[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  
  const runTests = useCallback(() => {
    setIsRunning(true);
    
    // Simula um pequeno delay para feedback visual
    setTimeout(() => {
      try {
        const results = runAllPowerSystemTests();
        const systemStats = getPowerSystemStats();
        setTestResults(results);
        setStats(systemStats);
      } catch (error) {
        console.error('Erro ao executar testes:', error);
      } finally {
        setIsRunning(false);
      }
    }, 100);
  }, []);
  
  const totalPassed = testResults?.reduce((acc, s) => acc + s.passed, 0) || 0;
  const totalFailed = testResults?.reduce((acc, s) => acc + s.failed, 0) || 0;
  const totalTests = totalPassed + totalFailed;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Testes do Sistema de Poderes
            </CardTitle>
            <CardDescription>
              Validação automatizada de poderes e trilhas contra o Livro Base v1.3
            </CardDescription>
          </div>
          <Button onClick={runTests} disabled={isRunning}>
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Executar Testes
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl font-bold">{stats.totalPowers as number}</div>
              <div className="text-xs text-muted-foreground">Poderes Totais</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl font-bold">{stats.totalTracks as number}</div>
              <div className="text-xs text-muted-foreground">Trilhas</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl font-bold">{stats.totalTrackAbilities as number}</div>
              <div className="text-xs text-muted-foreground">Habilidades de Trilha</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl font-bold text-green-500">
                {totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0}%
              </div>
              <div className="text-xs text-muted-foreground">Taxa de Sucesso</div>
            </div>
          </div>
        )}
        
        {testResults && (
          <>
            <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">{totalPassed} passou</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="font-semibold">{totalFailed} falhou</span>
                </div>
              </div>
              <Badge 
                variant={totalFailed === 0 ? 'default' : 'destructive'}
                className={totalFailed === 0 ? 'bg-green-500' : ''}
              >
                {totalFailed === 0 ? 'APROVADO' : 'FALHAS DETECTADAS'}
              </Badge>
            </div>
            
            <ScrollArea className="h-[400px] pr-4">
              <Accordion type="multiple" className="w-full">
                {testResults.map((suite, idx) => (
                  <TestSuiteCard key={idx} suite={suite} />
                ))}
              </Accordion>
            </ScrollArea>
          </>
        )}
        
        {!testResults && !isRunning && (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Clique em "Executar Testes" para validar o sistema de poderes</p>
            <p className="text-sm mt-1">
              Verifica poderes, trilhas e cálculos contra as regras oficiais
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

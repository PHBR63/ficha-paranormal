/**
 * Componente de Testes do Sistema de Rituais
 * Exibe resultados dos testes automatizados na interface admin
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  FlaskConical,
  ChevronDown,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { runAllTests, getRitualStats, formatTestResults } from '@/lib/rituals/__tests__/ritual-system.test';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: string[];
}

interface TestSuiteResult {
  suiteName: string;
  passed: number;
  failed: number;
  results: TestResult[];
}

/**
 * Componente para exibir um resultado de teste individual
 */
function TestResultCard({ result }: { result: TestResult }) {
  const [isOpen, setIsOpen] = useState(!result.passed);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors">
          <div className="flex items-center gap-3">
            {result.passed ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <p className="font-medium">{result.name}</p>
              <p className="text-sm text-muted-foreground">{result.message}</p>
            </div>
          </div>
          {result.details && result.details.length > 0 && (
            isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          )}
        </div>
      </CollapsibleTrigger>
      {result.details && result.details.length > 0 && (
        <CollapsibleContent>
          <div className="mt-2 ml-8 p-3 bg-muted/50 rounded-lg">
            <ul className="space-y-1 text-sm">
              {result.details.map((detail, i) => (
                <li key={i} className="text-muted-foreground">• {detail}</li>
              ))}
            </ul>
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

/**
 * Componente para exibir estatísticas do sistema
 */
function RitualStatsCard({ stats }: { stats: Record<string, unknown> }) {
  const byCircle = stats.byCircle as Record<number, number>;
  const byElement = stats.byElement as Record<string, number>;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Estatísticas do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total de rituais */}
        <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
          <span className="font-medium">Total de Rituais</span>
          <Badge variant="default" className="text-lg px-3 py-1">
            {stats.total as number}
          </Badge>
        </div>
        
        {/* Por círculo */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Por Círculo</p>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(byCircle).map(([circle, count]) => (
              <div key={circle} className="text-center p-2 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">{circle}º Círculo</p>
                <p className="text-lg font-bold">{count}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Por elemento */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Por Elemento</p>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(byElement).map(([element, count]) => (
              <div key={element} className="text-center p-2 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground capitalize">{element}</p>
                <p className="text-lg font-bold">{count}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Características especiais */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Características</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{stats.withWeaponBuff as number} com Weapon Buff</Badge>
            <Badge variant="outline">{stats.withSustainable as number} Sustentáveis</Badge>
            <Badge variant="outline">{stats.withHooks as number} com Hooks</Badge>
            <Badge variant="outline">{stats.withModes as number} com Modos</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Componente principal de testes do sistema de rituais
 */
export function RitualSystemTests() {
  const [testResults, setTestResults] = useState<TestSuiteResult | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  
  // Executa testes automaticamente ao montar
  useEffect(() => {
    runTests();
  }, []);
  
  const runTests = () => {
    setIsRunning(true);
    // Pequeno delay para mostrar loading
    setTimeout(() => {
      const results = runAllTests();
      const ritualStats = getRitualStats();
      setTestResults(results);
      setStats(ritualStats);
      setIsRunning(false);
      
      // Log para console também
      console.log(formatTestResults(results));
    }, 100);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="h-6 w-6" />
            Testes do Sistema de Rituais
          </h2>
          <p className="text-muted-foreground">
            Validação automatizada do sistema unificado de rituais
          </p>
        </div>
        <Button onClick={runTests} disabled={isRunning}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Executando...' : 'Executar Testes'}
        </Button>
      </div>
      
      {/* Estatísticas */}
      {stats && <RitualStatsCard stats={stats} />}
      
      {/* Resultados dos testes */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resultados dos Testes</span>
              <div className="flex gap-2">
                <Badge variant="default" className="bg-green-600">
                  ✅ {testResults.passed} passou
                </Badge>
                {testResults.failed > 0 && (
                  <Badge variant="destructive">
                    ❌ {testResults.failed} falhou
                  </Badge>
                )}
              </div>
            </CardTitle>
            <CardDescription>
              {testResults.passed + testResults.failed} testes executados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {testResults.results.map((result, i) => (
                  <TestResultCard key={i} result={result} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

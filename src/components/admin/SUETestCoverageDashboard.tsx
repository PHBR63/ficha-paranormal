/**
 * Dashboard visual de cobertura de testes do Sistema Unificado de Efeitos (SUE)
 * Exibe estatísticas, status de cada adaptador e progresso geral
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  FileCode2, 
  Layers,
  Target,
  Zap,
  Shield,
  BookOpen,
  FlaskConical,
  Activity,
  Sparkles
} from '@/components/icons/ordem-icons';

// Dados de cobertura de testes baseados no SUE_TEST_COVERAGE.md
const testData = {
  totalTests: 366,
  adapters: [
    {
      id: 'condition',
      name: 'Condições',
      icon: Shield,
      tests: 25,
      coverage: 100,
      features: ['30+ condições oficiais', 'Contexto melee/ranged', 'Modificadores automáticos'],
      status: 'complete' as const
    },
    {
      id: 'ritual',
      name: 'Rituais',
      icon: Sparkles,
      tests: 26,
      coverage: 100,
      features: ['Rituais sustentados', 'Cálculo de bônus', 'getSustainableRituals'],
      status: 'complete' as const
    },
    {
      id: 'class-power',
      name: 'Poderes de Classe',
      icon: Zap,
      tests: 25,
      coverage: 100,
      features: ['Combatente', 'Especialista', 'Ocultista', 'Escolhas de poder'],
      status: 'complete' as const
    },
    {
      id: 'origin',
      name: 'Origens',
      icon: BookOpen,
      tests: 40,
      coverage: 100,
      features: ['8 origens base', 'Suplementos', 'Proficiências', 'Poderes togglable'],
      status: 'complete' as const
    },
    {
      id: 'track',
      name: 'Trilhas',
      icon: Layers,
      tests: 100,
      coverage: 100,
      features: ['5 Combatente', '5 Especialista', '5 Ocultista', 'Escalamento NEX'],
      status: 'complete' as const
    },
    {
      id: 'paranormal-power',
      name: 'Poderes Paranormais',
      icon: Activity,
      tests: 35,
      coverage: 100,
      features: ['Todos os elementos', 'Afinidades', 'Bônus passivos/ativos'],
      status: 'complete' as const
    }
  ],
  hooks: [
    { name: 'useUnifiedEffects', tests: 15, coverage: 100 },
    { name: 'useBonusSummaryFromSUE', tests: 20, coverage: 100 },
    { name: 'useRitualModifiersFromSUE', tests: 15, coverage: 100 }
  ],
  integration: [
    { name: 'Performance', tests: 10, coverage: 100 },
    { name: 'Integração básica', tests: 20, coverage: 100 },
    { name: 'E2E completo', tests: 25, coverage: 100 },
    { name: 'Snapshot', tests: 10, coverage: 100 }
  ],
  functions: [
    { name: 'getConditionEffects', covered: true },
    { name: 'getRitualEffects', covered: true },
    { name: 'getClassPowerEffects', covered: true },
    { name: 'getOriginEffects', covered: true },
    { name: 'getTrackEffects', covered: true },
    { name: 'getParanormalPowerEffects', covered: true },
    { name: 'consolidateEffects', covered: true },
    { name: 'getSustainableRituals', covered: true },
    { name: 'getTrackCombatBonuses', covered: true },
    { name: 'checkEffectConditions', covered: false }
  ]
};

// Calcula o total de testes dos adaptadores
const adapterTestsTotal = testData.adapters.reduce((sum, a) => sum + a.tests, 0);
const hookTestsTotal = testData.hooks.reduce((sum, h) => sum + h.tests, 0);
const integrationTestsTotal = testData.integration.reduce((sum, i) => sum + i.tests, 0);

export function SUETestCoverageDashboard() {
  const coveredFunctions = testData.functions.filter(f => f.covered).length;
  const totalFunctions = testData.functions.length;
  const functionCoverage = Math.round((coveredFunctions / totalFunctions) * 100);

  return (
    <div className="space-y-6">
      {/* Header com estatísticas gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <FlaskConical className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Testes</p>
                <p className="text-3xl font-bold text-primary">{testData.totalTests}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <Target className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Adaptadores</p>
                <p className="text-3xl font-bold">{testData.adapters.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <FileCode2 className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Funções Cobertas</p>
                <p className="text-3xl font-bold">{coveredFunctions}/{totalFunctions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10">
                <CheckCircle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cobertura Geral</p>
                <p className="text-3xl font-bold">{functionCoverage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de adaptadores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Adaptadores do SUE
          </CardTitle>
          <CardDescription>
            Status de cobertura de testes para cada adaptador de efeitos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testData.adapters.map((adapter) => {
              const Icon = adapter.icon;
              return (
                <Card key={adapter.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{adapter.name}</h4>
                          <p className="text-xs text-muted-foreground">~{adapter.tests} testes</p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="bg-green-500/10 text-green-600 border-green-500/30"
                      >
                        {adapter.coverage}%
                      </Badge>
                    </div>
                    
                    <Progress value={adapter.coverage} className="h-1.5 mb-3" />
                    
                    <div className="flex flex-wrap gap-1">
                      {adapter.features.map((feature, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs font-normal">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Hooks e Integração lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hooks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hooks do SUE</CardTitle>
            <CardDescription>~{hookTestsTotal} testes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testData.hooks.map((hook) => (
              <div key={hook.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                    {hook.name}
                  </code>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">~{hook.tests}</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                </div>
                <Progress value={hook.coverage} className="h-1" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Testes de Integração */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Testes de Integração</CardTitle>
            <CardDescription>~{integrationTestsTotal} testes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testData.integration.map((test) => (
              <div key={test.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{test.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">~{test.tests}</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                </div>
                <Progress value={test.coverage} className="h-1" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Funções principais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cobertura de Funções Principais</CardTitle>
          <CardDescription>
            Status de cobertura para as funções críticas do motor de efeitos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {testData.functions.map((func) => (
              <div 
                key={func.name}
                className={`p-3 rounded-lg border ${
                  func.covered 
                    ? 'bg-green-500/5 border-green-500/20' 
                    : 'bg-amber-500/5 border-amber-500/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {func.covered ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  ) : (
                    <Activity className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  )}
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      func.covered 
                        ? 'text-green-600 border-green-500/30' 
                        : 'text-amber-600 border-amber-500/30'
                    }`}
                  >
                    {func.covered ? '100%' : 'Parcial'}
                  </Badge>
                </div>
                <code className="text-xs font-mono text-muted-foreground truncate block">
                  {func.name}
                </code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Nota informativa */}
      <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
        <p>💡 Dados baseados em <code className="bg-background px-1 py-0.5 rounded">docs/SUE_TEST_COVERAGE.md</code>.</p>
        <p className="mt-1">
          Execute <code className="bg-background px-1 py-0.5 rounded">npm run test -- --grep "SUE|effects-adapter"</code> para rodar todos os testes do SUE.
        </p>
      </div>
    </div>
  );
}

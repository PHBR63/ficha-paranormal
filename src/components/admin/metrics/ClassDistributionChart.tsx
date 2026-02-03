/**
 * ClassDistributionChart - Gráfico de distribuição de classes
 * Exibe pizza/donut com percentual de cada classe
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { ClassDistribution } from './AdminMetricsDashboard';

// Cores para cada classe (usando tons do design system)
const CLASS_COLORS: Record<string, string> = {
  'Combatente': 'hsl(0, 84%, 60%)',      // Vermelho
  'Especialista': 'hsl(200, 98%, 48%)',   // Azul
  'Ocultista': 'hsl(270, 76%, 60%)'       // Roxo
};

// Cor padrão para classes não mapeadas
const DEFAULT_COLOR = 'hsl(220, 13%, 46%)';

interface ClassDistributionChartProps {
  data: ClassDistribution[];
}

/**
 * Componente de tooltip customizado
 */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
      <p className="font-medium">{data.class}</p>
      <p className="text-sm text-muted-foreground">
        {data.count} personagen{data.count !== 1 ? 's' : ''} ({data.percentage}%)
      </p>
    </div>
  );
}

/**
 * Gráfico de distribuição de classes
 */
export function ClassDistributionChart({ data }: ClassDistributionChartProps) {
  // Calcular total e percentuais
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const chartData = data.map((item) => ({
    ...item,
    percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : '0'
  }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribuição por Classe</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Distribuição por Classe</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="count"
              nameKey="class"
              label={({ class: className, percentage }) => `${className} (${percentage}%)`}
              labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={CLASS_COLORS[entry.class] || DEFAULT_COLOR}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Legenda com contagens */}
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {chartData.map((item) => (
            <div key={item.class} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: CLASS_COLORS[item.class] || DEFAULT_COLOR }}
              />
              <span className="text-sm">
                {item.class}: <span className="font-medium">{item.count}</span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ClassDistributionChart;

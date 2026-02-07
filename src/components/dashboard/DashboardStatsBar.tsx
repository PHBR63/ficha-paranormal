/**
 * DashboardStatsBar - Barra de estatísticas estilo dossiê classificado
 */
import { ParanormalElementIcon } from '@/components/ui/paranormal-element-icon';
import { motion } from 'framer-motion';

interface DashboardStatsBarProps {
  agentCount: number;
  campaignCount: number;
  activeCampaigns: number;
  masteringCount: number;
}

export function DashboardStatsBar({ agentCount, campaignCount, activeCampaigns, masteringCount }: DashboardStatsBarProps) {
  const stats = [
    { label: 'Agentes', value: agentCount, element: 'sangue' as const },
    { label: 'Mesas', value: campaignCount, element: 'conhecimento' as const },
    { label: 'Ativas', value: activeCampaigns, element: 'medo' as const },
    { label: 'Mestrando', value: masteringCount, element: 'energia' as const },
  ];

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.08 }}
          className="dossier-classified p-4 group hover:scale-[1.02] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <ParanormalElementIcon element={stat.element} size="sm" variant="glow" />
            </div>
            <div>
              <p className="font-display text-2xl text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">{stat.label}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </section>
  );
}

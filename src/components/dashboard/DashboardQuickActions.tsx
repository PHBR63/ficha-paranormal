/**
 * DashboardQuickActions - Barra de ações rápidas com estilo dossiê
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserPlus, Crosshair, Folder } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

export function DashboardQuickActions() {
  const actions = [
    {
      label: 'Novo Agente',
      icon: UserPlus,
      href: '/character/create',
      variant: 'default' as const,
      description: 'Criar dossiê',
    },
    {
      label: 'Nova Campanha',
      icon: Crosshair,
      href: '/campaigns/create',
      variant: 'outline' as const,
      description: 'Abrir operação',
    },
    {
      label: 'Regras e Mecânicas',
      icon: Folder,
      href: '/rules',
      variant: 'outline' as const,
      description: 'Conferir cobertura',
    },
    {
      label: 'Campanhas',
      icon: Folder,
      href: '/campaigns',
      variant: 'outline' as const,
      description: 'Ver todas',
    },
  ];

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-5 bg-primary rounded-full" />
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Ações Rápidas
        </h3>
        <div className="flex-1 h-px bg-primary/10" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((action, i) => (
          <motion.div
            key={action.href}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link to={action.href}>
              <Button
                variant={action.variant}
                className={`w-full h-auto py-4 flex flex-col items-center gap-2 font-display tracking-wider text-xs
                  ${action.variant === 'default' 
                    ? 'bg-primary hover:bg-primary/80 text-primary-foreground border border-primary/30 shadow-[0_0_15px_hsl(var(--primary)/0.2)]' 
                    : 'border-primary/20 hover:bg-primary/10 hover:border-primary/40'
                  }`}
              >
                <action.icon className="w-5 h-5" weight="duotone" />
                <span>{action.label}</span>
                <span className="text-[10px] font-mono text-muted-foreground opacity-70">{action.description}</span>
              </Button>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

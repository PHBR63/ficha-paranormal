/**
 * DashboardCampaignsSection - Seção de campanhas do dashboard
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from '@/components/icons/ordem-icons';
import { Binoculars, UsersThree, Crosshair } from '@phosphor-icons/react';
import { LogoBox } from '@/components/ui/logo';
import { DecryptedText } from '@/components/ui/decrypted-text';
import { CampaignCard, type CampaignCardData } from '@/components/cards/CampaignCard';
import { motion } from 'framer-motion';

interface DashboardCampaignsSectionProps {
  campaigns: CampaignCardData[];
  loading: boolean;
  onDelete: (id: string, name: string) => void;
}

export function DashboardCampaignsSection({ campaigns, loading, onDelete }: DashboardCampaignsSectionProps) {
  return (
    <section className="mb-10">
      {/* Cabeçalho da seção */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-primary rounded-full" />
          <h3 className="font-display text-lg sm:text-xl tracking-wider text-foreground">
            OPERAÇÕES EM CAMPO
          </h3>
          <span className="text-xs font-mono text-muted-foreground bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
            {campaigns.length}
          </span>
        </div>
        <div className="flex gap-2">
          <Link to="/campaigns">
            <Button variant="outline" size="sm" className="font-display tracking-wider text-xs border-primary/20 hover:bg-primary/10">
              <UsersThree className="w-4 h-4 mr-1" weight="duotone" />
              <span className="hidden sm:inline">Ver Todas</span>
            </Button>
          </Link>
          <Link to="/campaigns/create">
            <Button size="sm" className="font-display tracking-wider text-xs bg-primary hover:bg-primary/80 text-primary-foreground border border-primary/30 shadow-[0_0_12px_hsl(var(--primary)/0.2)]">
              <Plus className="w-4 h-4 mr-1" />
              Nova
            </Button>
          </Link>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-primary/40 via-primary/20 to-transparent mb-5" />

      {/* Conteúdo */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <LogoBox size="lg" animate />
          <p className="text-muted-foreground mt-4 font-mono text-sm">Carregando campanhas...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="dossier-classified text-center py-12 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_hsl(var(--primary)/0.08)_0%,_transparent_70%)]" />
          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Crosshair className="w-8 h-8 text-muted-foreground" weight="duotone" />
            </div>
            <h4 className="font-display text-lg text-foreground mb-2">
              <DecryptedText text="NENHUMA OPERAÇÃO EM ANDAMENTO" speed={30} />
            </h4>
            <p className="text-muted-foreground mb-5 text-sm">
              Crie uma nova campanha ou entre em uma existente.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/campaigns">
                <Button variant="outline" className="border-primary/30 hover:bg-primary/20">
                  <Binoculars className="w-5 h-5 mr-2" weight="duotone" />
                  Explorar
                </Button>
              </Link>
              <Link to="/campaigns/create">
                <Button className="bg-primary hover:bg-primary/80 text-primary-foreground border border-primary/30">
                  <Plus className="w-5 h-5 mr-2" />
                  Criar Campanha
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign, index) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onDelete={campaign.is_master ? () => onDelete(campaign.id, campaign.name) : undefined}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  );
}

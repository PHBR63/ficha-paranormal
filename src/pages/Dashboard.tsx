/**
 * Dashboard - Painel do Agente estilo dossiê narrativo
 * Layout contínuo sem tabs: Welcome → Stats → Ações Rápidas → Agentes → Campanhas → Atividade
 */
import { Particles } from '@/components/ui/particles';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { DecryptedText } from '@/components/ui/decrypted-text';
import { BlurText } from '@/components/ui/blur-text';
import { useThemeColors } from '@/hooks';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  DashboardHeader,
  DashboardQuickActions,
  DashboardStatsBar,
  DashboardAgentsSection,
  DashboardCampaignsSection,
  DashboardActivityFeed,
} from '@/components/dashboard';

export default function Dashboard() {
  const {
    characters,
    campaigns,
    loading,
    loadingCampaigns,
    displayName,
    hasLowStats,
    activeCampaigns,
    masteringCount,
    recentActivity,
    handleDeleteCharacter,
    handleDeleteCampaign,
  } = useDashboardData();

  const themeColors = useThemeColors();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* === Background Effects === */}
      <div className="absolute inset-0 bg-landing-gradient-theme" />
      
      <FlickeringGrid
        className="opacity-30"
        squareSize={4}
        gridGap={8}
        flickerChance={0.2}
        color={`rgb(${themeColors.rgb})`}
        maxOpacity={0.2}
      />
      
      <div className="absolute inset-0 landing-noise pointer-events-none" />
      
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div
          className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] animate-red-mist"
          style={{ backgroundColor: `${themeColors.primary}10` }}
        />
        <div
          className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] rounded-full blur-[100px] animate-red-mist"
          style={{ backgroundColor: `${themeColors.secondary}10`, animationDelay: '3s' }}
        />
      </div>
      
      <div className="absolute inset-0 scan-lines opacity-10 pointer-events-none" />
      
      <Particles
        className="absolute inset-0 z-[1]"
        quantity={20}
        color={themeColors.primary}
        size={1.2}
        vx={0}
        vy={-0.15}
        staticity={90}
        ease={120}
      />
      
      <div className="absolute inset-0 vignette-theme pointer-events-none opacity-50" />

      {/* === Header === */}
      <DashboardHeader displayName={displayName} hasLowStats={hasLowStats} />

      {/* === Conteúdo Principal - Layout Narrativo Contínuo === */}
      <main className="relative z-10 container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Saudação do Agente */}
        <section className="mb-8">
          <p className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-primary font-mono mb-1">
            Relatório de Situação
          </p>
          <h2 className="font-display text-2xl sm:text-4xl tracking-wide text-foreground flex items-center gap-2 flex-wrap">
            <span>BEM-VINDO,</span>
            <span className="text-primary">
              <DecryptedText
                text={displayName.toUpperCase()}
                speed={40}
                className="font-display"
              />
            </span>
          </h2>
          <span className="text-sm text-muted-foreground mt-1 hidden sm:block">
            <BlurText text="Gerencie seus agentes e operações na Ordo Realitas." delay={0.3} />
          </span>
        </section>

        {/* Estatísticas */}
        <DashboardStatsBar
          agentCount={characters.length}
          campaignCount={campaigns.length}
          activeCampaigns={activeCampaigns}
          masteringCount={masteringCount}
        />

        {/* Ações Rápidas */}
        <DashboardQuickActions />

        {/* Seção de Agentes */}
        <DashboardAgentsSection
          characters={characters}
          loading={loading}
          onDelete={handleDeleteCharacter}
        />

        {/* Seção de Campanhas */}
        <DashboardCampaignsSection
          campaigns={campaigns}
          loading={loadingCampaigns}
          onDelete={handleDeleteCampaign}
        />

        {/* Feed de Atividade Recente */}
        <DashboardActivityFeed activities={recentActivity} />
      </main>
    </div>
  );
}

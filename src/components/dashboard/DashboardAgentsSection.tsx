/**
 * DashboardAgentsSection - Seção de agentes/personagens do dashboard
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { IdentificationBadge } from '@phosphor-icons/react';
import { LogoBox } from '@/components/ui/logo';
import { DecryptedText } from '@/components/ui/decrypted-text';
import { CharacterCard } from '@/components/cards/CharacterCard';
import { motion } from 'framer-motion';
import type { DashboardCharacter } from '@/hooks/useDashboardData';

interface DashboardAgentsSectionProps {
  characters: DashboardCharacter[];
  loading: boolean;
  onDelete: (id: string, name: string) => void;
}

export function DashboardAgentsSection({ characters, loading, onDelete }: DashboardAgentsSectionProps) {
  return (
    <section className="mb-10">
      {/* Cabeçalho da seção */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-primary rounded-full" />
          <h3 className="font-display text-lg sm:text-xl tracking-wider text-foreground">
            DOSSIÊS DE AGENTES
          </h3>
          <span className="text-xs font-mono text-muted-foreground bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
            {characters.length}
          </span>
        </div>
        <Link to="/character/create">
          <Button size="sm" className="font-display tracking-wider text-xs bg-primary hover:bg-primary/80 text-primary-foreground border border-primary/30 shadow-[0_0_12px_hsl(var(--primary)/0.2)]">
            <Plus className="w-4 h-4 mr-1" />
            Novo Agente
          </Button>
        </Link>
      </div>

      <div className="h-px bg-gradient-to-r from-primary/40 via-primary/20 to-transparent mb-5" />

      {/* Conteúdo */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <LogoBox size="lg" animate />
          <p className="text-muted-foreground mt-4 font-mono text-sm">Carregando dossiês...</p>
        </div>
      ) : characters.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="dossier-classified text-center py-12 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_hsl(var(--primary)/0.08)_0%,_transparent_70%)]" />
          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <IdentificationBadge className="w-8 h-8 text-muted-foreground" weight="duotone" />
            </div>
            <h4 className="font-display text-lg text-foreground mb-2">
              <DecryptedText text="NENHUM DOSSIÊ ENCONTRADO" speed={30} />
            </h4>
            <p className="text-muted-foreground mb-5 text-sm">
              Crie seu primeiro agente para começar suas missões.
            </p>
            <Link to="/character/create">
              <Button className="bg-primary hover:bg-primary/80 text-primary-foreground border border-primary/30">
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeiro Agente
              </Button>
            </Link>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((character, index) => (
            <CharacterCard
              key={character.id}
              character={{
                id: character.id,
                name: character.name,
                class: character.class,
                origin: character.origin,
                nex: character.nex,
                patent: character.patent,
                hp_current: character.hp_current,
                hp_max: character.hp_max,
                pe_current: character.pe_current,
                pe_max: character.pe_max,
                san_current: character.san_current,
                san_max: character.san_max,
                photo_url: character.photo_url,
                conditions: character.conditions || [],
              }}
              onDelete={() => onDelete(character.id, character.name)}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  );
}

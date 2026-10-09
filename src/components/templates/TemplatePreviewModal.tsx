/**
 * Modal de Preview de Template
 * Exibe detalhes completos de um template antes de aplicar
 * Inclui visualização de progressão por NEX
 * 
 * @module components/templates/TemplatePreviewModal
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Zap,
  Crown,
  Swords,
  Brain,
  Skull,
  Shield,
  Heart,
  Target,
  Sparkles,
  BookOpen,
  Package,
  TrendingUp,
  User,
} from '@/components/icons/ordem-icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { TemplateRatingStars, InteractiveRating } from './TemplateRatingStars';
import { ProgressionRoadmap } from './ProgressionRoadmap';
import { useRateTemplate } from '@/hooks/useTemplates';
import { useAuth } from '@/contexts/AuthContext';
import type { CharacterTemplate, TemplateWithAuthor } from '@/types/templates';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/types/templates';

interface TemplatePreviewModalProps {
  /** Template a ser exibido */
  template: CharacterTemplate | TemplateWithAuthor | null;
  /** Se o modal está aberto */
  isOpen: boolean;
  /** Callback para fechar */
  onClose: () => void;
  /** Callback para aplicar o template */
  onApply: () => void;
  /** Se está aplicando */
  isApplying?: boolean;
}

// Ícones por classe
const CLASS_ICONS: Record<string, React.ElementType> = {
  combatente: Swords,
  especialista: Brain,
  ocultista: Skull,
};

// Labels de atributos
const ATTRIBUTE_LABELS: Record<string, string> = {
  strength: 'Força',
  agility: 'Agilidade',
  vigor: 'Vigor',
  intellect: 'Intelecto',
  presence: 'Presença',
};

export function TemplatePreviewModal({
  template,
  isOpen,
  onClose,
  onApply,
  isApplying = false,
}: TemplatePreviewModalProps) {
  const { user } = useAuth();

  // Hook de rating - sempre chamado (regra dos hooks)
  const templateId = template?.id || '';
  const ratingHook = useRateTemplate(templateId);

  // Dados do template
  const data = template?.template_data;
  const author = template && 'author' in template ? template.author : null;
  
  // Classe e ícone
  const classId = data?.classId?.toLowerCase() || 'combatente';
  const ClassIcon = CLASS_ICONS[classId] || Shield;

  // Soma total de atributos
  const totalAttributes = useMemo(() => {
    if (!data?.attributes) return 0;
    return Object.entries(data.attributes)
      .filter(([key]) => key !== 'distribution_strategy' && key !== 'notes')
      .reduce((sum, [, value]) => sum + (typeof value === 'number' ? value : 0), 0);
  }, [data?.attributes]);

  // Pode avaliar (não é o autor)
  const canRate = user && template && template.author_id !== user.id && template.is_public;

  if (!template || !data) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {/* Ícone da classe */}
              <div className={cn(
                'p-3 rounded-xl bg-gradient-to-br',
                classId === 'combatente' && 'from-red-500/20 to-red-600/10',
                classId === 'especialista' && 'from-blue-500/20 to-blue-600/10',
                classId === 'ocultista' && 'from-purple-500/20 to-purple-600/10',
              )}>
                <ClassIcon className={cn(
                  'w-8 h-8',
                  classId === 'combatente' && 'text-red-500',
                  classId === 'especialista' && 'text-blue-500',
                  classId === 'ocultista' && 'text-purple-500',
                )} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl">{template.name}</DialogTitle>
                  {template.is_official && (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black gap-1">
                      <Crown className="w-3 h-3" />
                      OFICIAL
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-1">
                  {data.classId}
                  {data.classTrack && ` • ${data.classTrack}`}
                </p>

                {/* Rating */}
                <div className="mt-2">
                  <TemplateRatingStars
                    rating={template.rating}
                    ratingCount={template.rating_count}
                    size="md"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Badges de info */}
          <div className="flex flex-wrap gap-2 mt-4">
            {template.difficulty_level && (
              <Badge 
                variant="outline" 
                className={DIFFICULTY_COLORS[template.difficulty_level]}
              >
                {DIFFICULTY_LABELS[template.difficulty_level]}
              </Badge>
            )}
            <Badge variant="outline">
              NEX {template.min_nex}%{template.max_nex < 99 ? ` - ${template.max_nex}%` : '+'}
            </Badge>
            <Badge variant="outline">
              Origem: {data.origin}
            </Badge>
            {data.elementalAffinity && (
              <Badge variant="outline">
                Afinidade: {data.elementalAffinity}
              </Badge>
            )}
          </div>

          {/* Tags */}
          {template.tags && template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {template.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </DialogHeader>

        <Separator className="mx-6" />

        {/* Conteúdo com tabs */}
        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <TabsList className="mx-6 mt-4 shrink-0 w-fit">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="powers">Poderes</TabsTrigger>
            {data.progression && data.progression.length > 0 && (
              <TabsTrigger value="progression">Progressão</TabsTrigger>
            )}
            {canRate && (
              <TabsTrigger value="rate">Avaliar</TabsTrigger>
            )}
          </TabsList>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            {/* Tab: Visão Geral */}
            <TabsContent value="overview" className="mt-0 space-y-6 data-[state=inactive]:hidden">
              {/* Descrição */}
              {template.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Descrição
                  </h4>
                  <p className="text-sm">{template.description}</p>
                </div>
              )}

              {/* Atributos */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Atributos (Total: {totalAttributes})
                </h4>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(data.attributes)
                    .filter(([key]) => key !== 'distribution_strategy' && key !== 'notes')
                    .map(([key, value]) => (
                      <div 
                        key={key}
                        className="bg-secondary/30 rounded-lg p-3 text-center"
                      >
                        <div className="text-lg font-bold">{value as number}</div>
                        <div className="text-xs text-muted-foreground">
                          {ATTRIBUTE_LABELS[key] || key}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Perícias */}
              {data.trainedSkills && data.trainedSkills.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Perícias Treinadas
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {data.trainedSkills.map(skill => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Equipamento */}
              {data.equipment && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Equipamento Inicial
                  </h4>
                  <div className="space-y-2 text-sm">
                    {data.equipment.weapons && data.equipment.weapons.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Armas: </span>
                        {data.equipment.weapons.map(w => 
                          `${w.id}${w.quantity > 1 ? ` (x${w.quantity})` : ''}`
                        ).join(', ')}
                      </div>
                    )}
                    {data.equipment.armor && (
                      <div>
                        <span className="text-muted-foreground">Armadura: </span>
                        {data.equipment.armor}
                      </div>
                    )}
                    {data.equipment.items && data.equipment.items.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Itens: </span>
                        {data.equipment.items.map(i => 
                          `${i.id}${i.quantity > 1 ? ` (x${i.quantity})` : ''}`
                        ).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Autor */}
              {author && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  Criado por <span className="font-medium text-foreground">{author.display_name || 'Anônimo'}</span>
                </div>
              )}
            </TabsContent>

            {/* Tab: Poderes */}
            <TabsContent value="powers" className="mt-0 space-y-6 data-[state=inactive]:hidden">
              {/* Poderes de Classe */}
              {data.classPowers && data.classPowers.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Poderes de Classe
                  </h4>
                  <div className="space-y-2">
                    {data.classPowers.map((power, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2"
                      >
                        <span className="text-sm">{power.powerId}</span>
                        <Badge variant="outline" className="text-xs">
                          NEX {power.nex}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Poderes Paranormais */}
              {data.paranormalPowers && data.paranormalPowers.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Skull className="w-4 h-4" />
                    Poderes Paranormais
                  </h4>
                  <div className="space-y-2">
                    {data.paranormalPowers.map((power, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2"
                      >
                        <span className="text-sm">{power.powerId}</span>
                        <Badge variant="outline" className="text-xs">
                          NEX {power.nex}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rituais */}
              {data.initialRituals && data.initialRituals.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Rituais Iniciais
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {data.initialRituals.map(ritual => (
                      <Badge key={ritual} variant="outline" className="text-xs">
                        {ritual}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Tab: Progressão - usando novo componente ProgressionRoadmap */}
            {data.progression && data.progression.length > 0 && (
              <TabsContent value="progression" className="mt-0 data-[state=inactive]:hidden">
                <ProgressionRoadmap
                  progression={data.progression}
                  currentNex={template.min_nex}
                  classId={data.classId}
                />
              </TabsContent>
            )}

            {/* Tab: Avaliar */}
            {canRate && (
              <TabsContent value="rate" className="mt-0 data-[state=inactive]:hidden">
                <div className="flex flex-col items-center py-8">
                  <h4 className="text-lg font-medium mb-6">
                    O que você achou deste template?
                  </h4>
                  <InteractiveRating
                    currentRating={ratingHook.userRating?.rating || null}
                    onRate={(rating) => ratingHook.rate({ rating })}
                    isLoading={ratingHook.isRating}
                  />
                  {ratingHook.userRating && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => ratingHook.deleteRating()}
                      className="mt-4 text-muted-foreground"
                      disabled={ratingHook.isDeletingRating}
                    >
                      Remover avaliação
                    </Button>
                  )}
                </div>
              </TabsContent>
            )}
          </div>
        </Tabs>

        {/* Ações */}
        <div className="p-6 pt-4 border-t shrink-0 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onApply} disabled={isApplying}>
            <Zap className="w-4 h-4 mr-2" />
            {isApplying ? 'Aplicando...' : 'Aplicar Template'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

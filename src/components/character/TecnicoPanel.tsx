/**
 * TecnicoPanel - Painel da trilha Técnico do Especialista
 * Habilidades: Inventário Otimizado, Remendão, Improvisar, Preparado para Tudo
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Wrench, 
  Package, 
  Hammer, 
  Lightbulb, 
  Backpack,
  CheckCircle2,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { type EffectDuration, TRACK_EFFECT_IDS, type ComputedEffects } from '@/hooks';

interface TecnicoPanelProps {
  classTrack: string | null;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  /** Atributos do personagem para calcular capacidade de carga */
  attributes?: {
    strength: number;
    intellect: number;
  };
  /** Callback para ativar efeito no SUE */
  onActivateEffect?: (id: string, name: string, duration: EffectDuration, metadata?: Record<string, unknown>) => void;
  /** Verifica se um efeito está ativo */
  isEffectActive?: (id: string) => boolean;
  /** Dados consolidados do SUE */
  computedEffects?: ComputedEffects;
}

/**
 * Painel da trilha Técnico do Especialista
 * Exibe as habilidades de manutenção, reparo e improvisação de equipamentos
 */
export function TecnicoPanel({ 
  classTrack, 
  nex, 
  peCurrent, 
  onPEChange,
  attributes,
  computedEffects,
}: TecnicoPanelProps) {
  const [improvisarDrawerOpen, setImprovisarDrawerOpen] = useState(false);
  const [preparadoDrawerOpen, setPreparadoDrawerOpen] = useState(false);
  
  // Usa dados do SUE para exibir bônus consolidados se disponível
  const sueTechnicianData = useMemo(() => {
    if (!computedEffects) return null;
    
    return {
      // Capacidade de carga do Técnico
      carryCapacity: computedEffects.technician?.carryCapacity,
      // Redução de espaço de itens
      itemSpaceReduction: computedEffects.technician?.itemSpaceReduction?.total ?? 0,
      // Redução de categoria de inventário
      categoryReduction: computedEffects.inventory?.totalCategoryReduction ?? 0,
    };
  }, [computedEffects]);
  
  // Verifica se é a trilha correta
  if (classTrack !== 'tecnico') return null;

  // Habilidades disponíveis por NEX
  const hasInventarioOtimizado = nex >= 10;
  const hasRemendao = nex >= 40;
  const hasImprovisar = nex >= 65;
  const hasPreparadoParaTudo = nex >= 99;

  // Calcula capacidade de carga otimizada
  const carryCapacity = attributes 
    ? (attributes.strength + attributes.intellect) * 5 
    : null;

  // Handler para Remendão (1 PE)
  const handleRemendao = () => {
    const peCost = 1;
    if (peCurrent < peCost) {
      toast.error('PE insuficiente', {
        description: `Você precisa de ${peCost} PE para usar Remendão.`
      });
      return;
    }

    onPEChange(peCurrent - peCost);
    toast.success('Remendão ativado!', {
      description: 'Gaste uma ação completa para remover a condição Quebrado de um equipamento adjacente até o final da cena.'
    });
  };

  // Handler para Improvisar (2 PE base + 2 PE por categoria)
  const handleImprovisar = (categoria: number) => {
    const peCost = 2 + (2 * categoria);
    if (peCurrent < peCost) {
      toast.error('PE insuficiente', {
        description: `Você precisa de ${peCost} PE para improvisar um item de categoria ${categoria}.`
      });
      return;
    }

    onPEChange(peCurrent - peCost);
    setImprovisarDrawerOpen(false);
    toast.success('Equipamento improvisado!', {
      description: `Você criou uma versão funcional de um equipamento geral de categoria ${categoria}. O item será inútil ao final da cena.`
    });
  };

  // Handler para Preparado para Tudo (3 PE por categoria)
  const handlePreparadoParaTudo = (categoria: number) => {
    const peCost = 3 * categoria;
    if (peCurrent < peCost) {
      toast.error('PE insuficiente', {
        description: `Você precisa de ${peCost} PE para lembrar de um item de categoria ${categoria}.`
      });
      return;
    }

    onPEChange(peCurrent - peCost);
    setPreparadoDrawerOpen(false);
    toast.success('Preparado para Tudo!', {
      description: `Você lembrou que colocou um item de categoria ${categoria} no fundo da bolsa! Gaste uma ação de movimento para encontrá-lo.`
    });
  };

  return (
    <Card className="border-primary/30 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wrench className="w-5 h-5 text-primary" />
          Técnico
          <Badge variant="outline" className="ml-auto text-xs">
            {nex}% NEX
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* NEX 10% - Inventário Otimizado */}
        {hasInventarioOtimizado && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-500" />
              <span className="font-medium text-sm">Inventário Otimizado</span>
              <Badge variant="secondary" className="text-[10px]">NEX 10%</Badge>
              <Badge variant="outline" className="text-[10px] ml-auto">Passiva</Badge>
            </div>
            <div className="text-xs text-muted-foreground pl-6 space-y-1">
              <p>
                Você soma seu Intelecto à sua Força para calcular sua capacidade de carga.
              </p>
              {carryCapacity !== null && (
                <p className="text-primary font-medium">
                  Capacidade atual: {carryCapacity} espaços
                </p>
              )}
              <p className="italic">
                Qualquer equipamento geral tem sua categoria reduzida em 1 para você.
              </p>
            </div>
          </div>
        )}

        {hasInventarioOtimizado && hasRemendao && <Separator className="my-3" />}

        {/* NEX 40% - Remendão */}
        {hasRemendao && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Hammer className="w-4 h-4 text-orange-500" />
              <span className="font-medium text-sm">Remendão</span>
              <Badge variant="secondary" className="text-[10px]">NEX 40%</Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Gaste uma ação completa e 1 PE para remover a condição Quebrado de um equipamento adjacente até o final da cena.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2 pl-6">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRemendao}
                disabled={peCurrent < 1}
                className="h-8"
              >
                <Hammer className="w-3 h-3 mr-1" />
                Remendar (1 PE)
              </Button>
            </div>
          </div>
        )}

        {hasRemendao && hasImprovisar && <Separator className="my-3" />}

        {/* NEX 65% - Improvisar */}
        {hasImprovisar && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              <span className="font-medium text-sm">Improvisar</span>
              <Badge variant="secondary" className="text-[10px]">NEX 65%</Badge>
            </div>
            <div className="text-xs text-muted-foreground pl-6 mb-2">
              <p>Crie uma versão funcional de um equipamento geral com materiais ao redor.</p>
              <p className="italic">Custo: Ação completa + 2 PE + 2 PE por categoria.</p>
            </div>
            <div className="pl-6">
              <Drawer open={improvisarDrawerOpen} onOpenChange={setImprovisarDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8">
                    <Lightbulb className="w-3 h-3 mr-1" />
                    Improvisar Equipamento
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Improvisar Equipamento</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Escolha a categoria do equipamento geral que deseja improvisar:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[0, 1, 2, 3, 4].map((cat) => {
                        const cost = 2 + (2 * cat);
                        return (
                          <Button
                            key={cat}
                            variant="outline"
                            onClick={() => handleImprovisar(cat)}
                            disabled={peCurrent < cost}
                            className="h-12 flex-col"
                          >
                            <span className="font-medium">Categoria {cat}</span>
                            <span className="text-xs text-muted-foreground">{cost} PE</span>
                          </Button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground text-center italic">
                      O equipamento improvisado se torna inútil ao final da cena.
                    </p>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>
        )}

        {hasImprovisar && hasPreparadoParaTudo && <Separator className="my-3" />}

        {/* NEX 99% - Preparado para Tudo */}
        {hasPreparadoParaTudo && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Backpack className="w-4 h-4 text-emerald-500" />
              <span className="font-medium text-sm">Preparado para Tudo</span>
              <Badge variant="secondary" className="text-[10px]">NEX 99%</Badge>
            </div>
            <div className="text-xs text-muted-foreground pl-6 mb-2">
              <p>Você sempre tem o que precisa para qualquer situação!</p>
              <p className="italic">Custo: Ação de movimento + 3 PE por categoria do item.</p>
            </div>
            <div className="pl-6">
              <Drawer open={preparadoDrawerOpen} onOpenChange={setPreparadoDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8">
                    <Backpack className="w-3 h-3 mr-1" />
                    Encontrar Item
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Preparado para Tudo</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Escolha a categoria do item que você "lembrou" que colocou na bolsa:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].map((cat) => {
                        const cost = 3 * cat;
                        return (
                          <Button
                            key={cat}
                            variant="outline"
                            onClick={() => handlePreparadoParaTudo(cat)}
                            disabled={peCurrent < cost}
                            className="h-12 flex-col"
                          >
                            <span className="font-medium">Categoria {cat}</span>
                            <span className="text-xs text-muted-foreground">{cost} PE</span>
                          </Button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground text-center italic">
                      O item segue normalmente as regras de inventário. Exceto armas.
                    </p>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>
        )}

        {/* Resumo de habilidades bloqueadas */}
        {!hasPreparadoParaTudo && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Próximas habilidades:{' '}
              {!hasRemendao && 'Remendão (NEX 40%), '}
              {!hasImprovisar && 'Improvisar (NEX 65%), '}
              {!hasPreparadoParaTudo && 'Preparado para Tudo (NEX 99%)'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TecnicoPanel;

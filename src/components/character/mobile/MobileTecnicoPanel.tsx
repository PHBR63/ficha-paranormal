/**
 * MobileTecnicoPanel - Painel mobile da trilha Técnico do Especialista
 * Versão otimizada para dispositivos móveis
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Wrench, 
  Package, 
  Hammer, 
  Lightbulb, 
  Backpack,
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
import { MobileCollapsibleSection } from './MobileCollapsibleSection';

interface MobileTecnicoPanelProps {
  classTrack: string | null;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  /** Atributos do personagem para calcular capacidade de carga */
  attributes?: {
    strength: number;
    intellect: number;
  };
}

/**
 * Painel mobile da trilha Técnico do Especialista
 */
export function MobileTecnicoPanel({ 
  classTrack, 
  nex, 
  peCurrent, 
  onPEChange,
  attributes 
}: MobileTecnicoPanelProps) {
  const [improvisarDrawerOpen, setImprovisarDrawerOpen] = useState(false);
  const [preparadoDrawerOpen, setPreparadoDrawerOpen] = useState(false);
  
  // Verifica se é a trilha correta
  if (classTrack !== 'tecnico') return null;

  // Habilidades disponíveis por NEX
  const hasInventarioOtimizado = nex >= 10;
  const hasRemendao = nex >= 40;
  const hasImprovisar = nex >= 65;
  const hasPreparadoParaTudo = nex >= 99;

  // Conta habilidades ativas
  const activeCount = [hasInventarioOtimizado, hasRemendao, hasImprovisar, hasPreparadoParaTudo]
    .filter(Boolean).length;

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
      description: 'Remova a condição Quebrado de um equipamento adjacente até o final da cena.'
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
      description: `Item de categoria ${categoria} criado. Inútil ao final da cena.`
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
      description: `Item de categoria ${categoria} encontrado! Gaste uma ação de movimento.`
    });
  };

  return (
    <MobileCollapsibleSection
      title="Técnico"
      icon={<Wrench className="w-4 h-4" />}
      badge={`${activeCount}/4`}
      defaultOpen={false}
    >
      <div className="space-y-3">
        {/* NEX 10% - Inventário Otimizado */}
        {hasInventarioOtimizado && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Package className="w-4 h-4 text-amber-500" />
              <span className="font-medium text-sm">Inventário Otimizado</span>
              <Badge variant="outline" className="text-[10px]">Passiva</Badge>
            </div>
            <div className="text-xs text-muted-foreground pl-6 space-y-1">
              <p>FOR + INT para calcular capacidade de carga.</p>
              {carryCapacity !== null && (
                <p className="text-primary font-medium">
                  Capacidade: {carryCapacity} espaços
                </p>
              )}
              <p className="italic">Equipamentos gerais: categoria -1.</p>
            </div>
          </div>
        )}

        {hasInventarioOtimizado && hasRemendao && <Separator className="my-2" />}

        {/* NEX 40% - Remendão */}
        {hasRemendao && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Hammer className="w-4 h-4 text-orange-500" />
              <span className="font-medium text-sm">Remendão</span>
            </div>
            <div className="text-xs text-muted-foreground pl-6 mb-2">
              <p>Remove condição Quebrado até o final da cena.</p>
            </div>
            <div className="pl-6">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRemendao}
                disabled={peCurrent < 1}
                className="h-8 w-full"
              >
                <Hammer className="w-3 h-3 mr-1" />
                Remendar (1 PE)
              </Button>
            </div>
          </div>
        )}

        {hasRemendao && hasImprovisar && <Separator className="my-2" />}

        {/* NEX 65% - Improvisar */}
        {hasImprovisar && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              <span className="font-medium text-sm">Improvisar</span>
            </div>
            <div className="text-xs text-muted-foreground pl-6 mb-2">
              <p>Crie equipamento geral. 2 PE + 2 PE/categoria.</p>
            </div>
            <div className="pl-6">
              <Drawer open={improvisarDrawerOpen} onOpenChange={setImprovisarDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 w-full">
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
                      Escolha a categoria do equipamento:
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
                            className="h-14 flex-col"
                          >
                            <span className="font-medium">Categoria {cat}</span>
                            <span className="text-xs text-muted-foreground">{cost} PE</span>
                          </Button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground text-center italic">
                      Inútil ao final da cena.
                    </p>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>
        )}

        {hasImprovisar && hasPreparadoParaTudo && <Separator className="my-2" />}

        {/* NEX 99% - Preparado para Tudo */}
        {hasPreparadoParaTudo && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Backpack className="w-4 h-4 text-emerald-500" />
              <span className="font-medium text-sm">Preparado para Tudo</span>
            </div>
            <div className="text-xs text-muted-foreground pl-6 mb-2">
              <p>Encontre qualquer item! 3 PE/categoria.</p>
            </div>
            <div className="pl-6">
              <Drawer open={preparadoDrawerOpen} onOpenChange={setPreparadoDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 w-full">
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
                      Escolha a categoria do item:
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
                            className="h-14 flex-col"
                          >
                            <span className="font-medium">Categoria {cat}</span>
                            <span className="text-xs text-muted-foreground">{cost} PE</span>
                          </Button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground text-center italic">
                      Exceto armas. Segue regras de inventário.
                    </p>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>
        )}

        {/* Próximas habilidades */}
        {!hasPreparadoParaTudo && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground">
              Próximas:{' '}
              {!hasRemendao && 'Remendão (40%), '}
              {!hasImprovisar && 'Improvisar (65%), '}
              {!hasPreparadoParaTudo && 'Preparado para Tudo (99%)'}
            </p>
          </div>
        )}
      </div>
    </MobileCollapsibleSection>
  );
}

export default MobileTecnicoPanel;

import { ConhecimentoSymbol, EnergiaSymbol, MorteSymbol, SangueSymbol } from '@/components/icons/element-symbols';
/**
 * Seletor de Afinidade Elemental
 * Exibido para personagens NEX 50%+ que ainda não escolheram afinidade
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles, Check, Loader2, Info, Star, Search, ChevronRight } from '@/components/icons/ordem-icons';
import {
  ParanormalElement,
  ELEMENT_LABELS,
  ELEMENT_COLORS,
  ELEMENT_BG_COLORS,
  AFFINITY_DESCRIPTIONS,
  getPowersByElement,
  ParanormalPower,
} from '@/lib/paranormal-powers';
import { cn } from '@/lib/utils';
import { PowerDetailModal, PowerDetailData } from './PowerDetailModal';

// Ícones por elemento
const AFFINITY_ICONS: Record<ParanormalElement, React.ComponentType<{ className?: string }>> = {
  sangue: SangueSymbol,
  morte: MorteSymbol,
  conhecimento: ConhecimentoSymbol,
  energia: EnergiaSymbol,
};

// Descrições detalhadas das afinidades
const AFFINITY_DETAILED_DESCRIPTIONS: Record<ParanormalElement, string> = {
  sangue: 'A afinidade com Sangue conecta você às forças vitais e à transformação física. Seus poderes de Sangue se tornam mais potentes, amplificando sua resistência, regeneração e capacidade de manipular a própria essência vital.',
  morte: 'A afinidade com Morte permite uma conexão profunda com as energias da entropia e decomposição. Você manipula as forças da morte com maestria, tornando seus poderes de Morte mais devastadores e duradouros.',
  conhecimento: 'A afinidade com Conhecimento expande sua percepção além do véu da realidade. Seus poderes de Conhecimento revelam verdades ocultas com maior clareza e seus efeitos mentais se tornam mais penetrantes.',
  energia: 'A afinidade com Energia sincroniza você com as forças do caos e da sorte. Seus poderes de Energia manipulam o acaso com maior precisão, amplificando sua sorte e capacidade de alterar probabilidades.',
};

interface AffinitySelectorCardProps {
  nex: number;
  onSelectAffinity: (element: ParanormalElement) => Promise<void>;
}

// Converte ParanormalPower para PowerDetailData
function toPowerDetailData(power: ParanormalPower): PowerDetailData {
  return {
    type: 'paranormal',
    name: power.name,
    description: power.description + (power.affinityEffect ? `\n\n**Efeito de Afinidade:** ${power.affinityEffect}` : ''),
    element: power.element,
  };
}

export function AffinitySelectorCard({ nex, onSelectAffinity }: AffinitySelectorCardProps) {
  const [selectedElement, setSelectedElement] = useState<ParanormalElement | null>(null);
  const [detailElement, setDetailElement] = useState<ParanormalElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPower, setSelectedPower] = useState<PowerDetailData | null>(null);

  // Só exibe se NEX >= 50
  if (nex < 50) return null;

  const handleConfirm = async () => {
    if (!selectedElement) return;
    
    setSaving(true);
    try {
      await onSelectAffinity(selectedElement);
    } finally {
      setSaving(false);
    }
  };

  const elementPowers = detailElement ? getPowersByElement(detailElement) : [];
  
  // Filtra poderes pelo termo de busca
  const filteredPowers = useMemo(() => {
    if (!searchTerm.trim()) return elementPowers;
    const term = searchTerm.toLowerCase();
    return elementPowers.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        (p.affinityEffect && p.affinityEffect.toLowerCase().includes(term))
    );
  }, [elementPowers, searchTerm]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sheet-panel p-4 border-2 border-paranormal/50 bg-paranormal/5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-paranormal" />
          <h3 className="font-display text-lg tracking-wider text-paranormal">
            AFINIDADE ELEMENTAL
          </h3>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Ao atingir NEX 50%, você desenvolve uma conexão profunda com um dos elementos paranormais.
          Escolha sua afinidade — poderes desse elemento terão efeitos aprimorados!
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {(['sangue', 'morte', 'conhecimento', 'energia'] as ParanormalElement[]).map((element) => {
            const Icon = AFFINITY_ICONS[element];
            const isSelected = selectedElement === element;
            const colorClass = ELEMENT_COLORS[element];
            const bgClass = ELEMENT_BG_COLORS[element];
            const powers = getPowersByElement(element);

            return (
              <Card
                key={element}
                className={cn(
                  'cursor-pointer transition-all duration-200',
                  isSelected 
                    ? 'ring-2 ring-paranormal border-paranormal bg-paranormal/10' 
                    : 'hover:border-paranormal/50 hover:bg-muted/50'
                )}
                onClick={() => setSelectedElement(element)}
              >
                <CardHeader className="pb-2 pt-3 px-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${bgClass}`}>
                        <Icon className={`h-4 w-4 ${colorClass}`} />
                      </div>
                      <CardTitle className="text-sm">{ELEMENT_LABELS[element]}</CardTitle>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-paranormal" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <CardDescription className="text-xs line-clamp-2 mb-2">
                    {AFFINITY_DESCRIPTIONS[element]}
                  </CardDescription>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {powers.length} poderes
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px] text-paranormal hover:text-paranormal hover:bg-paranormal/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailElement(element);
                        setSearchTerm('');
                      }}
                    >
                      <Info className="w-3 h-3 mr-1" />
                      Ver detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {selectedElement 
              ? `Você escolheu: ${ELEMENT_LABELS[selectedElement]}`
              : 'Selecione um elemento acima'
            }
          </p>
          <Button
            onClick={handleConfirm}
            disabled={!selectedElement || saving}
            className="bg-paranormal hover:bg-paranormal/90"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Confirmar Afinidade
          </Button>
        </div>
      </motion.div>

      {/* Modal de Detalhes da Afinidade */}
      <Dialog open={!!detailElement} onOpenChange={(open) => !open && setDetailElement(null)}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] sm:max-h-[85vh] p-0 overflow-hidden flex flex-col">
          {detailElement && (
            <div className="flex flex-1 min-h-0 flex-col">
              <div className="p-4 sm:p-6 pb-3">
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-lg', ELEMENT_BG_COLORS[detailElement])}>
                      {(() => {
                        const Icon = AFFINITY_ICONS[detailElement];
                        return <Icon className={cn('h-6 w-6', ELEMENT_COLORS[detailElement])} />;
                      })()}
                    </div>
                    <div>
                      <DialogTitle className="text-xl">
                        Afinidade: {ELEMENT_LABELS[detailElement]}
                      </DialogTitle>
                      <p className="text-xs text-muted-foreground">
                        {filteredPowers.length} de {elementPowers.length} poderes
                      </p>
                    </div>
                  </div>
                </DialogHeader>

                {/* Campo de Busca */}
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar poderes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 overscroll-contain">
                <div className="space-y-4 pb-4">
                  {/* Descrição detalhada */}
                  <div className="p-3 rounded-lg bg-paranormal/10 border border-paranormal/30">
                    <p className="text-sm">{AFFINITY_DETAILED_DESCRIPTIONS[detailElement]}</p>
                  </div>

                  {/* Lista de Poderes */}
                  <div>
                    <h4 className="font-display text-sm tracking-wider mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-paranormal" />
                      PODERES BENEFICIADOS
                    </h4>
                    
                    {filteredPowers.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhum poder encontrado para "{searchTerm}"</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredPowers.map((power) => (
                          <button
                            key={power.id}
                            type="button"
                            onClick={() => setSelectedPower(toPowerDetailData(power))}
                            className="w-full text-left p-3 rounded-lg bg-secondary/50 border border-border hover:bg-secondary/80 hover:border-paranormal/50 transition-colors group"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h5 className="font-medium text-sm group-hover:text-paranormal transition-colors">
                                {power.name}
                              </h5>
                              <div className="flex items-center gap-2">
                                {power.prerequisite && (
                                  <Badge variant="outline" className="text-[10px] shrink-0">
                                    Requer {power.prerequisite.count}
                                  </Badge>
                                )}
                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-paranormal transition-colors" />
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{power.description}</p>
                            {power.affinityEffect && (
                              <div className="flex items-start gap-2 p-2 mt-2 rounded bg-paranormal/10 border border-paranormal/30">
                                <Sparkles className="w-3.5 h-3.5 text-paranormal shrink-0 mt-0.5" />
                                <p className="text-xs text-paranormal font-medium line-clamp-2">{power.affinityEffect}</p>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 pt-4 border-t flex justify-between items-center bg-background">
                <Button variant="outline" onClick={() => setDetailElement(null)}>
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    setSelectedElement(detailElement);
                    setDetailElement(null);
                  }}
                  className="bg-paranormal hover:bg-paranormal/90"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Escolher {ELEMENT_LABELS[detailElement]}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Poder */}
      <PowerDetailModal
        open={!!selectedPower}
        onOpenChange={(open) => !open && setSelectedPower(null)}
        power={selectedPower}
      />
    </>
  );
}

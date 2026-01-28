/**
 * TruqueMestreModal - Modal de seleção de habilidade para Truque de Mestre
 * 
 * Permite ao jogador selecionar qualquer habilidade de classe, trilha ou origem
 * para copiar usando a habilidade NEX 99% da trilha Negociador.
 * 
 * @module tracks/especialista/TruqueMestreModal
 */

import { useState, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Sparkles, 
  Sword,
  Target,
  Eye,
  Users,
  User,
  Zap
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { CLASS_ONLY_POWERS, ALL_TRACK_POWERS } from '@/lib/class-powers/power-registry';
import { ORIGINS } from '@/lib/character-data';

// =====================================================
// Tipos
// =====================================================

/** Estrutura normalizada de habilidade copiável */
interface CopyableAbility {
  id: string;
  name: string;
  description: string;
  source: 'class-power' | 'track-ability' | 'origin-power';
  sourceLabel: string;
  peCost: number | 'varies' | 'passive';
  actionType: string;
  isPassive: boolean;
}

type FilterCategory = 'all' | 'combatente' | 'especialista' | 'ocultista' | 'trilhas' | 'origens';

// =====================================================
// Props
// =====================================================

export interface TruqueMestreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (ability: CopyableAbility) => void;
  peCurrent: number;
}

// =====================================================
// Funções auxiliares
// =====================================================

/** IDs de poderes que não devem ser copiáveis */
const EXCLUDED_POWER_IDS = [
  // Poderes de progressão
  'aumento-atributo-20-comb', 'aumento-atributo-50-comb', 'aumento-atributo-80-comb', 'aumento-atributo-95-comb',
  'aumento-atributo-20-esp', 'aumento-atributo-50-esp', 'aumento-atributo-80-esp', 'aumento-atributo-95-esp',
  'aumento-atributo-20-ocul', 'aumento-atributo-50-ocul', 'aumento-atributo-80-ocul', 'aumento-atributo-95-ocul',
  'grau-treinamento-35-comb', 'grau-treinamento-70-comb',
  'grau-treinamento-35-esp', 'grau-treinamento-70-esp',
  'grau-treinamento-35-ocul', 'grau-treinamento-70-ocul',
  // Versatilidade
  'versatilidade-comb', 'versatilidade-esp', 'versatilidade-ocul',
  // Escolha de trilha
  'habilidade-trilha-combatente', 'habilidade-trilha-especialista', 'habilidade-trilha-ocultista',
  // Poderes de rituais (não é a habilidade em si, mas capacidade de rituais)
  'ritualista-iniciado', 'ritualista-verdadeiro',
  // Poderes paranormais específicos (Ocultista)
  'transcender-15', 'transcender-30', 'transcender-45', 'transcender-60', 'transcender-75', 'transcender-90',
  // Truque de Mestre em si
  'track-truque-mestre',
];

/** Tags que indicam poderes de ritual/paranormal a excluir */
const EXCLUDED_TAGS = ['ritual', 'paranormal', 'progressão', 'transcender'];

/**
 * Converte poderes de classe para o formato normalizado
 */
function convertClassPowers(): CopyableAbility[] {
  return CLASS_ONLY_POWERS
    .filter(power => {
      // Exclui poderes específicos
      if (EXCLUDED_POWER_IDS.includes(power.id)) return false;
      // Exclui por tags
      if (power.tags?.some(tag => EXCLUDED_TAGS.includes(tag))) return false;
      return true;
    })
    .map(power => {
      const mechanics = power.effects.base;
      const isPassive = mechanics.kind === 'passive' || !mechanics.activation;
      const rawCost = mechanics.activation?.cost;
      
      // Normaliza o custo para o tipo esperado
      let peCost: number | 'varies' | 'passive';
      if (isPassive || rawCost === undefined) {
        peCost = 'passive';
      } else if (typeof rawCost === 'number') {
        peCost = rawCost;
      } else {
        // ScalingValue ou outro tipo complexo
        peCost = 'varies';
      }
      
      let actionType = 'Passivo';
      if (mechanics.activation?.action) {
        const actionMap: Record<string, string> = {
          'free': 'Livre',
          'movement': 'Movimento',
          'standard': 'Padrão',
          'complete': 'Completa',
          'reaction': 'Reação',
          'none': 'Nenhuma',
        };
        actionType = actionMap[mechanics.activation.action] || mechanics.activation.action;
      }
      
      return {
        id: power.id,
        name: power.name,
        description: power.description,
        source: 'class-power' as const,
        sourceLabel: power.classId,
        peCost,
        actionType,
        isPassive,
      };
    });
}

/**
 * Converte poderes de trilha para o formato normalizado
 */
function convertTrackPowers(): CopyableAbility[] {
  return ALL_TRACK_POWERS
    .filter(power => {
      if (EXCLUDED_POWER_IDS.includes(power.id)) return false;
      if (power.tags?.some(tag => EXCLUDED_TAGS.includes(tag))) return false;
      return true;
    })
    .map(power => {
      const mechanics = power.effects.base;
      const isPassive = mechanics.kind === 'passive' || !mechanics.activation;
      const rawCost = mechanics.activation?.cost;
      
      // Normaliza o custo para o tipo esperado
      let peCost: number | 'varies' | 'passive';
      if (isPassive || rawCost === undefined) {
        peCost = 'passive';
      } else if (typeof rawCost === 'number') {
        peCost = rawCost;
      } else {
        // ScalingValue ou outro tipo complexo
        peCost = 'varies';
      }
      
      let actionType = 'Passivo';
      if (mechanics.activation?.action) {
        const actionMap: Record<string, string> = {
          'free': 'Livre',
          'movement': 'Movimento',
          'standard': 'Padrão',
          'complete': 'Completa',
          'reaction': 'Reação',
          'none': 'Nenhuma',
        };
        actionType = actionMap[mechanics.activation.action] || mechanics.activation.action;
      }
      
      return {
        id: power.id,
        name: power.name,
        description: power.description,
        source: 'track-ability' as const,
        sourceLabel: `Trilha: ${power.classId}`,
        peCost,
        actionType,
        isPassive,
      };
    });
}

/**
 * Converte poderes de origem para o formato normalizado
 */
function convertOriginPowers(): CopyableAbility[] {
  return ORIGINS.map(origin => {
    // A maioria dos poderes de origem são ativados com 2 PE
    // Alguns são passivos (Mão Pesada, Para Bellum, Calejado, etc.)
    const passiveOrigins = [
      'lutador', 'militar', 'desgarrado', 'cultista-arrependido', 'magnata', 'engenheiro'
    ];
    const isPassive = passiveOrigins.includes(origin.id);
    
    return {
      id: `origin-${origin.id}`,
      name: origin.powers[0] || origin.name,
      description: origin.powerDescription,
      source: 'origin-power' as const,
      sourceLabel: `Origem: ${origin.name}`,
      peCost: isPassive ? 'passive' : 2,
      actionType: isPassive ? 'Passivo' : 'Livre',
      isPassive,
    };
  });
}

/**
 * Calcula o custo total (5 PE base + custo da habilidade)
 */
function calculateTotalCost(ability: CopyableAbility): number | string {
  if (ability.isPassive || ability.peCost === 'passive') {
    return 5;
  }
  if (ability.peCost === 'varies') {
    return '5 + variável';
  }
  return 5 + ability.peCost;
}

// =====================================================
// Componente Principal
// =====================================================

export function TruqueMestreModal({
  open,
  onOpenChange,
  onConfirm,
  peCurrent,
}: TruqueMestreModalProps) {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [selectedAbility, setSelectedAbility] = useState<CopyableAbility | null>(null);

  // Gera lista de habilidades copiáveis
  const allAbilities = useMemo(() => {
    const classPowers = convertClassPowers();
    const trackPowers = convertTrackPowers();
    const originPowers = convertOriginPowers();
    return [...classPowers, ...trackPowers, ...originPowers];
  }, []);

  // Filtra habilidades por categoria e busca
  const filteredAbilities = useMemo(() => {
    let filtered = allAbilities;
    
    // Filtro por categoria
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'trilhas') {
        filtered = filtered.filter(a => a.source === 'track-ability');
      } else if (selectedCategory === 'origens') {
        filtered = filtered.filter(a => a.source === 'origin-power');
      } else {
        // Combatente, Especialista, Ocultista
        const classMap: Record<string, string> = {
          'combatente': 'Combatente',
          'especialista': 'Especialista',
          'ocultista': 'Ocultista',
        };
        filtered = filtered.filter(a => 
          a.source === 'class-power' && a.sourceLabel === classMap[selectedCategory]
        );
      }
    }
    
    // Filtro por busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(term) ||
        a.description.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [allAbilities, selectedCategory, searchTerm]);

  // Agrupa habilidades por fonte
  const groupedAbilities = useMemo(() => {
    const groups: Record<string, CopyableAbility[]> = {};
    
    filteredAbilities.forEach(ability => {
      const groupKey = ability.sourceLabel;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(ability);
    });
    
    return groups;
  }, [filteredAbilities]);

  const handleConfirm = () => {
    if (selectedAbility) {
      onConfirm(selectedAbility);
      setSelectedAbility(null);
      setSearchTerm('');
      setSelectedCategory('all');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedAbility(null);
    setSearchTerm('');
    setSelectedCategory('all');
  };

  // Custo total da habilidade selecionada
  const totalCost = selectedAbility ? calculateTotalCost(selectedAbility) : 5;
  const canAfford = typeof totalCost === 'number' && peCurrent >= totalCost;

  // Ícone por fonte
  const getSourceIcon = (source: string) => {
    if (source.includes('Combatente')) return <Sword className="h-3 w-3" />;
    if (source.includes('Especialista')) return <Target className="h-3 w-3" />;
    if (source.includes('Ocultista')) return <Eye className="h-3 w-3" />;
    if (source.includes('Trilha')) return <Users className="h-3 w-3" />;
    if (source.includes('Origem')) return <User className="h-3 w-3" />;
    return <Zap className="h-3 w-3" />;
  };

  // Conteúdo do modal
  const ModalContent = () => (
    <div className="flex flex-col h-full">
      {/* Barra de busca */}
      <div className="px-4 py-2 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar habilidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      {/* Filtros por categoria */}
      <div className="px-4 py-2 border-b border-border/50">
        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as FilterCategory)}>
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 h-auto gap-1">
            <TabsTrigger value="all" className="text-xs py-1">Todos</TabsTrigger>
            <TabsTrigger value="combatente" className="text-xs py-1">Comb.</TabsTrigger>
            <TabsTrigger value="especialista" className="text-xs py-1">Espec.</TabsTrigger>
            <TabsTrigger value="ocultista" className="text-xs py-1">Ocult.</TabsTrigger>
            <TabsTrigger value="trilhas" className="text-xs py-1">Trilhas</TabsTrigger>
            <TabsTrigger value="origens" className="text-xs py-1">Origens</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Lista de habilidades */}
      <ScrollArea className={isMobile ? "flex-1" : "h-[400px]"}>
        <div className="p-4 space-y-4">
          {Object.entries(groupedAbilities).map(([groupName, abilities]) => (
            <div key={groupName}>
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                {getSourceIcon(groupName)}
                <span>{groupName}</span>
                <Badge variant="secondary" className="text-[10px]">{abilities.length}</Badge>
              </div>
              <div className="space-y-2">
                {abilities.map((ability) => {
                  const cost = calculateTotalCost(ability);
                  const isSelected = selectedAbility?.id === ability.id;
                  const affordable = typeof cost === 'number' && peCurrent >= cost;
                  
                  return (
                    <button
                      key={ability.id}
                      onClick={() => setSelectedAbility(ability)}
                      className={`
                        w-full text-left p-3 rounded-lg border transition-all
                        ${isSelected 
                          ? 'border-yellow-500 bg-yellow-500/10' 
                          : 'border-border/50 bg-background/50 hover:border-border hover:bg-muted/50'
                        }
                        ${!affordable && !isSelected ? 'opacity-50' : ''}
                      `}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{ability.name}</span>
                            {ability.isPassive && (
                              <Badge variant="outline" className="text-[10px]">Passivo</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {ability.description}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge variant="secondary" className="text-[10px]">
                            {typeof cost === 'number' ? `${cost} PE` : cost}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{ability.actionType}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          
          {filteredAbilities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma habilidade encontrada.</p>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Rodapé com seleção e confirmação */}
      <div className="p-4 border-t border-border/50 bg-muted/30">
        {selectedAbility ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Habilidade:</span>
              <span className="font-medium">{selectedAbility.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Custo total:</span>
              <span className="font-medium text-primary">
                5 PE (Truque) + {selectedAbility.isPassive || selectedAbility.peCost === 'passive' 
                  ? '0 PE' 
                  : `${selectedAbility.peCost} PE`
                } = {typeof totalCost === 'number' ? `${totalCost} PE` : totalCost}
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirm} 
                disabled={!canAfford}
                className="flex-1"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Usar ({typeof totalCost === 'number' ? `${totalCost} PE` : totalCost})
              </Button>
            </div>
            {!canAfford && (
              <p className="text-xs text-destructive text-center">
                PE insuficiente (você tem {peCurrent} PE)
              </p>
            )}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            Selecione uma habilidade para copiar
          </div>
        )}
      </div>
    </div>
  );

  // Renderização responsiva
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="pb-0">
            <DrawerTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Truque de Mestre
            </DrawerTitle>
            <DrawerDescription>
              Simule qualquer habilidade vista por um aliado na cena. Custo base: 5 PE.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden">
            <ModalContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Truque de Mestre
          </DialogTitle>
          <DialogDescription>
            Simule qualquer habilidade vista por um aliado na cena. Custo base: 5 PE.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <ModalContent />
        </div>
      </DialogContent>
    </Dialog>
  );
}

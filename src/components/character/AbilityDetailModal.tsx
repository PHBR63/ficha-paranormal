/**
 * AbilityDetailModal.tsx
 * Modal expandido para exibição de habilidades de classe
 * Inclui: descrição, pré-requisitos, exemplos, sinergias e progressão
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CustomScroll } from "@/components/ui/custom-scroll";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  TrendingUp, 
  Check, 
  Zap, 
  Shield, 
  Lightbulb,
  Link2,
  AlertCircle,
  BookOpen,
  Target,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  getAbilityDetails, 
  parsePrerequisitesFromDescription,
  AbilityDetails 
} from "@/lib/ability-details";

// Interface para habilidade de classe
interface ClassAbility {
  id: string;
  name: string;
  description: string;
  minNex: number;
  classId: string;
}

interface AbilityDetailModalProps {
  ability: ClassAbility | null;
  isOpen: boolean;
  onClose: () => void;
  nex: number;
  isSelected?: boolean;
  isCore?: boolean;
  onToggle?: () => void;
  canSelect?: boolean;
  /** Lista de pré-requisitos não atendidos (para exibir no modal) */
  missingPrerequisites?: string[];
}

export function AbilityDetailModal({
  ability,
  isOpen,
  onClose,
  nex,
  isSelected = false,
  isCore = false,
  onToggle,
  canSelect = true,
  missingPrerequisites = []
}: AbilityDetailModalProps) {
  if (!ability) return null;

  // Obter detalhes expandidos do poder
  const details = getAbilityDetails(ability.id);
  
  // Extrair pré-requisitos da descrição se não houver detalhes
  const parsedPrereqs = parsePrerequisitesFromDescription(ability.description);
  const prerequisites = details?.prerequisites || parsedPrereqs;
  
  // Verifica se a habilidade evolui com NEX
  const evolutionData = details?.evolution;
  const hasEvolution = !!evolutionData;

  // Calcula o estágio atual de evolução
  const getCurrentEvolutionStage = () => {
    if (!evolutionData) return -1;
    let stage = -1;
    for (let i = 0; i < evolutionData.nexMarkers.length; i++) {
      if (nex >= evolutionData.nexMarkers[i]) {
        stage = i;
      }
    }
    return stage;
  };

  const currentStage = getCurrentEvolutionStage();
  
  // Verificar se todos os pré-requisitos são atendidos (simplificado)
  const meetsPrerequisites = !prerequisites?.nex || nex >= prerequisites.nex;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        {/* Header fixo */}
        <div className="p-6 pb-4 border-b border-border">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Ícone da habilidade */}
                <div className={cn(
                  "p-3 rounded-xl",
                  isCore ? 'bg-primary/20' : 'bg-secondary/50'
                )}>
                  <Sparkles className={cn(
                    "w-6 h-6",
                    isCore ? 'text-primary' : 'text-muted-foreground'
                  )} />
                </div>
                
                <div>
                  <DialogTitle className="text-2xl font-bold">
                    {ability.name}
                  </DialogTitle>
                  
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {/* Badge de NEX mínimo */}
                    <Badge variant="outline" className="text-xs">
                      NEX {ability.minNex}%
                    </Badge>
                    
                    {/* Badge de classe */}
                    <Badge variant="secondary" className="text-xs">
                      {ability.classId}
                    </Badge>
                    
                    {/* Badge de tipo */}
                    {isCore ? (
                      <Badge className="bg-primary/20 text-primary text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        Automática
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        Opcional
                      </Badge>
                    )}
                    
                    {/* Badge de evolução */}
                    {hasEvolution && (
                      <Badge className="bg-warning/20 text-warning text-xs">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Evolui com NEX
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Conteúdo com tabs */}
        <Tabs defaultValue="description" className="flex-1">
          <div className="px-6 pt-2">
            <TabsList className="w-full grid grid-cols-4 h-auto">
              <TabsTrigger value="description" className="text-xs py-2">
                <BookOpen className="w-3 h-3 mr-1" />
                Descrição
              </TabsTrigger>
              <TabsTrigger value="examples" className="text-xs py-2">
                <Target className="w-3 h-3 mr-1" />
                Exemplos
              </TabsTrigger>
              <TabsTrigger value="synergies" className="text-xs py-2">
                <Link2 className="w-3 h-3 mr-1" />
                Sinergias
              </TabsTrigger>
              {hasEvolution && (
                <TabsTrigger value="evolution" className="text-xs py-2">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Progressão
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Padrão do projeto: calc() ao invés de vh puro para garantir scroll no mobile */}
          <CustomScroll className="flex-1 min-h-0 px-6 py-4" maxHeight="calc(85vh - 280px)">
            {/* Tab: Descrição */}
            <TabsContent value="description" className="mt-0 space-y-4">
              {/* Descrição completa */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Descrição Completa
                </h4>
                <p className="text-base leading-relaxed whitespace-pre-line">
                  {ability.description}
                </p>
              </div>

              {/* Pré-requisitos */}
              {prerequisites && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Pré-requisitos
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {/* Atributos */}
                      {prerequisites.attributes?.map((attr, idx) => (
                        <Badge 
                          key={idx} 
                          variant="outline" 
                          className="text-sm"
                        >
                          {attr.attribute} {attr.value}+
                        </Badge>
                      ))}
                      
                      {/* Perícias */}
                      {prerequisites.skills?.map((skill, idx) => (
                        <Badge 
                          key={idx} 
                          variant="outline" 
                          className="text-sm"
                        >
                          Treinado em {skill}
                        </Badge>
                      ))}
                      
                      {/* NEX */}
                      {prerequisites.nex && (
                        <Badge 
                          variant={nex >= prerequisites.nex ? "default" : "destructive"} 
                          className="text-sm"
                        >
                          NEX {prerequisites.nex}%+
                          {nex >= prerequisites.nex && <Check className="w-3 h-3 ml-1" />}
                        </Badge>
                      )}
                      
                      {/* Outros poderes */}
                      {prerequisites.abilities?.map((ab, idx) => (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className="text-sm"
                        >
                          Requer: {ab}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Dicas de otimização */}
              {details?.tips && (
                <>
                  <Separator />
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-semibold text-primary mb-1">
                          Dica de Otimização
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {details.tips}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Tab: Exemplos */}
            <TabsContent value="examples" className="mt-0 space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Target className="w-4 h-4" />
                Exemplos de Uso em Jogo
              </h4>
              
              {details?.examples && details.examples.length > 0 ? (
                <div className="space-y-3">
                  {details.examples.map((example, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">{idx + 1}</span>
                      </div>
                      <p className="text-sm">{example}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Exemplos em breve...</p>
                  <p className="text-xs mt-1">Consulte o livro de regras para mais detalhes.</p>
                </div>
              )}
            </TabsContent>

            {/* Tab: Sinergias */}
            <TabsContent value="synergies" className="mt-0 space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Users className="w-4 h-4" />
                Sinergias com Outros Poderes
              </h4>
              
              {details?.synergies && details.synergies.length > 0 ? (
                <div className="space-y-3">
                  {details.synergies.map((synergy, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Link2 className="w-4 h-4 text-primary" />
                        <Badge variant="secondary">{synergy.abilityName}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {synergy.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma sinergia documentada</p>
                  <p className="text-xs mt-1">Este poder funciona bem de forma independente.</p>
                </div>
              )}
            </TabsContent>

            {/* Tab: Progressão */}
            {hasEvolution && evolutionData && (
              <TabsContent value="evolution" className="mt-0 space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-warning" />
                  Progressão por NEX
                </h4>
                
                <div className="space-y-2">
                  <AnimatePresence>
                    {evolutionData.nexMarkers.map((nexMarker, index) => {
                      const isUnlocked = nex >= nexMarker;
                      const isCurrent = index === currentStage;
                      
                      return (
                        <motion.div
                          key={nexMarker}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={cn(
                            "flex items-start gap-3 p-4 rounded-lg transition-all",
                            isCurrent 
                              ? 'bg-primary/10 border-2 border-primary/50 shadow-lg shadow-primary/10' 
                              : isUnlocked 
                                ? 'bg-secondary/30 border border-border' 
                                : 'bg-muted/30 opacity-60 border border-transparent'
                          )}
                        >
                          {/* Indicador de status */}
                          <div className={cn(
                            "mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                            isUnlocked 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted border-2 border-muted-foreground/30'
                          )}>
                            {isUnlocked ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <span className="text-sm text-muted-foreground">{index + 1}</span>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge 
                                variant={isUnlocked ? "default" : "outline"} 
                                className="text-sm"
                              >
                                NEX {nexMarker}%
                              </Badge>
                              {isCurrent && (
                                <Badge className="bg-warning/20 text-warning text-xs animate-pulse">
                                  ★ Nível Atual
                                </Badge>
                              )}
                            </div>
                            <p className={cn(
                              "text-base mt-2 font-medium",
                              isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                            )}>
                              {evolutionData.descriptions[index]}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </TabsContent>
            )}
          </CustomScroll>
        </Tabs>

        {/* Rodapé com ação de seleção (apenas para habilidades opcionais) */}
        {!isCore && onToggle && (
          <div className="p-4 border-t border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="w-4 h-4" />
                {isSelected ? (
                  <span className="text-primary font-medium">Habilidade selecionada</span>
                ) : missingPrerequisites.length > 0 ? (
                  <div className="flex flex-col">
                    <span className="text-destructive font-medium">Pré-requisitos não atendidos</span>
                    <span className="text-xs text-destructive/80">
                      Faltam: {missingPrerequisites.join(', ')}
                    </span>
                  </div>
                ) : canSelect ? (
                  <span>Clique para selecionar esta habilidade</span>
                ) : (
                  <span className="text-destructive">Limite de escolhas atingido</span>
                )}
              </div>
              
              <Button
                variant={isSelected ? "default" : "outline"}
                onClick={() => {
                  onToggle();
                  if (!isSelected) onClose();
                }}
                disabled={!canSelect && !isSelected}
                className="gap-2"
              >
                <Checkbox 
                  checked={isSelected} 
                  className="pointer-events-none"
                />
                {isSelected ? "Selecionada" : "Selecionar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

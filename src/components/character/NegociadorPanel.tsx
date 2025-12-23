/**
 * NegociadorPanel - Painel de habilidades da trilha Negociador (Especialista)
 * 
 * Habilidades:
 * - NEX 10%: Eloquência - Fascina alvos em alcance curto (1 PE, concentração)
 * - NEX 40%: Discurso Motivador - +2 em testes de perícia (4 PE / 8 PE em NEX 65%)
 * - NEX 65%: Eu Conheço um Cara - Ativa rede de contatos (1x/missão)
 * - NEX 99%: Truque de Mestre - Copia habilidade de aliado (5 PE)
 */

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Users, 
  Handshake, 
  Sparkles, 
  Mic2,
  Info,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NegociadorPanelProps {
  classTrack?: string | null;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  /** Se Eloquência está ativa (concentração) */
  eloquenciaActive?: boolean;
  onEloquenciaToggle?: (active: boolean) => void;
  /** Se "Eu Conheço um Cara" já foi usado nesta missão */
  conhecoCaraUsedThisMission?: boolean;
  onConhecoCaraUsed?: () => void;
}

export function NegociadorPanel({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  eloquenciaActive = false,
  onEloquenciaToggle,
  conhecoCaraUsedThisMission = false,
  onConhecoCaraUsed,
}: NegociadorPanelProps) {
  const [isConcentrating, setIsConcentrating] = useState(eloquenciaActive);
  
  // Verifica se é Negociador (suporta ambos os formatos)
  const isNegociador = classTrack === 'Negociador' || classTrack === 'negociador';
  
  // Habilidades desbloqueadas por NEX
  const hasEloquencia = nex >= 10;
  const hasDiscursoMotivador = nex >= 40;
  const hasConhecoCara = nex >= 65;
  const hasTruqueMestre = nex >= 99;
  
  // Discurso Motivador: 4 PE para +2, ou 8 PE para +2 (NEX 65+)
  const discursoMotivadorCost = 4;
  const discursoMotivadorEnhancedCost = 8;
  const canUseEnhancedDiscurso = nex >= 65;

  /**
   * Ativa/Desativa Eloquência (1 PE para ativar, concentração)
   */
  const handleEloquencia = useCallback(() => {
    if (isConcentrating) {
      // Encerra concentração
      setIsConcentrating(false);
      onEloquenciaToggle?.(false);
      toast.info('Eloquência encerrada', { 
        description: 'Você parou de concentrar.' 
      });
      return;
    }
    
    if (peCurrent < 1) {
      toast.error('PE insuficiente', { description: 'Eloquência requer 1 PE.' });
      return;
    }

    onPEChange(peCurrent - 1);
    setIsConcentrating(true);
    onEloquenciaToggle?.(true);
    
    toast.success('Eloquência ativada!', {
      description: 'Faça teste de Diplomacia/Enganação/Intimidação vs Vontade dos alvos. Alvos fascinados enquanto você se concentrar.'
    });
  }, [peCurrent, isConcentrating, onPEChange, onEloquenciaToggle]);

  /**
   * Usa Discurso Motivador (4 PE ou 8 PE)
   */
  const handleDiscursoMotivador = useCallback((enhanced: boolean) => {
    const cost = enhanced ? discursoMotivadorEnhancedCost : discursoMotivadorCost;
    const bonus = enhanced ? '+2' : '+2';
    
    if (peCurrent < cost) {
      toast.error('PE insuficiente', { description: `Discurso Motivador requer ${cost} PE.` });
      return;
    }

    onPEChange(peCurrent - cost);
    
    toast.success('Discurso Motivador!', {
      description: `Você e aliados em alcance curto ganham ${bonus} em testes de perícia até o fim da cena.`
    });
  }, [peCurrent, onPEChange]);

  /**
   * Usa "Eu Conheço um Cara" (1x/missão)
   */
  const handleConhecoCara = useCallback(() => {
    if (conhecoCaraUsedThisMission) {
      toast.warning('Já usado nesta missão', { 
        description: '"Eu Conheço um Cara" só pode ser usado 1x por missão.' 
      });
      return;
    }

    onConhecoCaraUsed?.();
    
    toast.success('Eu Conheço um Cara!', {
      description: 'Ative sua rede de contatos para trocar equipamentos, obter informações, resgatar alguém ou resolver problema similar. O Mestre define os limites.'
    });
  }, [conhecoCaraUsedThisMission, onConhecoCaraUsed]);

  /**
   * Usa Truque de Mestre (5 PE)
   */
  const handleTruqueMestre = useCallback(() => {
    if (peCurrent < 5) {
      toast.error('PE insuficiente', { description: 'Truque de Mestre requer 5 PE.' });
      return;
    }

    onPEChange(peCurrent - 5);
    
    toast.success('Truque de Mestre!', {
      description: 'Simule o efeito de qualquer habilidade que um aliado tenha usado nesta cena. Você ignora pré-requisitos mas paga todos os custos.'
    });
  }, [peCurrent, onPEChange]);

  // Não renderiza se não for Negociador
  if (!isNegociador) return null;

  return (
    <Card className="border-pink-500/30 bg-gradient-to-br from-pink-950/20 to-background">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-pink-400" />
          Negociador
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        
        {/* NEX 10% - Eloquência */}
        {hasEloquencia && (
          <div className="p-3 rounded-lg bg-background/50 border border-border/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic2 className="h-4 w-4 text-pink-400" />
                <span className="font-medium text-sm">Eloquência</span>
                <Badge variant="outline" className="text-[10px]">NEX 10%</Badge>
                {isConcentrating && (
                  <Badge variant="default" className="text-[10px] bg-pink-600">
                    Concentrando
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">1 PE</Badge>
                <Button
                  size="sm"
                  variant={isConcentrating ? "secondary" : peCurrent >= 1 ? "default" : "outline"}
                  disabled={!isConcentrating && peCurrent < 1}
                  onClick={handleEloquencia}
                  className="h-7 text-xs"
                >
                  {isConcentrating ? 'Encerrar' : 'Usar'}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Teste Diplomacia/Enganação/Intimidação vs Vontade. Alvos ficam fascinados (concentração). 
              Alvo hostil/em combate: +5 resistência e novo teste por rodada.
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                    <Info className="h-3 w-3" />
                    <span>Ver detalhes completos</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Ação completa. 1 PE por alvo em alcance curto. Quem passar no teste fica imune por 1 dia.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* NEX 40% - Discurso Motivador */}
        {hasDiscursoMotivador && (
          <div className="p-3 rounded-lg bg-background/50 border border-border/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
                <span className="font-medium text-sm">Discurso Motivador</span>
                <Badge variant="outline" className="text-[10px]">NEX 40%</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Você e aliados em alcance curto ganham bônus em testes de perícia até o fim da cena.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={peCurrent >= discursoMotivadorCost ? "default" : "outline"}
                disabled={peCurrent < discursoMotivadorCost}
                onClick={() => handleDiscursoMotivador(false)}
                className="h-7 text-xs flex-1"
              >
                +2 (4 PE)
              </Button>
              {canUseEnhancedDiscurso && (
                <Button
                  size="sm"
                  variant={peCurrent >= discursoMotivadorEnhancedCost ? "default" : "outline"}
                  disabled={peCurrent < discursoMotivadorEnhancedCost}
                  onClick={() => handleDiscursoMotivador(true)}
                  className="h-7 text-xs flex-1"
                >
                  +2 (8 PE)
                </Button>
              )}
            </div>
          </div>
        )}

        {/* NEX 65% - Eu Conheço um Cara */}
        {hasConhecoCara && (
          <div className="p-3 rounded-lg bg-background/50 border border-border/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Handshake className="h-4 w-4 text-green-400" />
                <span className="font-medium text-sm">Eu Conheço um Cara</span>
                <Badge variant="outline" className="text-[10px]">NEX 65%</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">1x/missão</Badge>
                <Button
                  size="sm"
                  variant={conhecoCaraUsedThisMission ? "outline" : "default"}
                  disabled={conhecoCaraUsedThisMission}
                  onClick={handleConhecoCara}
                  className="h-7 text-xs"
                >
                  {conhecoCaraUsedThisMission ? 'Usado' : 'Usar'}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Ative sua rede de contatos: troca de equipamentos, informações, resgates ou resolver problemas. 
              O Mestre define limites.
            </p>
          </div>
        )}

        {/* NEX 99% - Truque de Mestre */}
        {hasTruqueMestre && (
          <div className="p-3 rounded-lg bg-background/50 border border-border/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-400" />
                <span className="font-medium text-sm">Truque de Mestre</span>
                <Badge variant="outline" className="text-[10px]">NEX 99%</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">5 PE</Badge>
                <Button
                  size="sm"
                  variant={peCurrent >= 5 ? "default" : "outline"}
                  disabled={peCurrent < 5}
                  onClick={handleTruqueMestre}
                  className="h-7 text-xs"
                >
                  Usar
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Simule qualquer habilidade que um aliado usou nesta cena. Ignora pré-requisitos, mas paga todos os custos.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
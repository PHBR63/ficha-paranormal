/**
 * RestModal - Modal de descanso automatizado
 * Permite recuperar PV, PE e SAN baseado nas regras do livro
 * 
 * Regras de Descanso:
 * - Descanso Curto (1h): Recupera 1d6 + VIG de PV, todo PE
 * - Descanso Longo (8h): Recupera todo PV, todo PE, 1d6 + PRE de SAN
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Moon, Sun, Heart, Sparkles, Brain, Dice1, AlertTriangle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Interface para dados do personagem necessários para descanso
interface CharacterRestData {
  hp_current: number;
  hp_max: number;
  pe_current: number;
  pe_max: number;
  san_current: number;
  san_max: number;
  vigor: number;
  presence: number;
  conditions: string[];
}

// Interface para resultados do descanso
interface RestResult {
  type: 'short' | 'long';
  hp_recovered: number;
  pe_recovered: number;
  san_recovered: number;
  conditions_removed: string[];
  dice_rolls: {
    hp?: { dice: number; modifier: number; total: number };
    san?: { dice: number; modifier: number; total: number };
  };
}

interface RestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character: CharacterRestData;
  onRest: (newStats: { hp_current: number; pe_current: number; san_current: number; conditions: string[] }) => void;
}

// Condições que são removidas em descanso curto (temporárias de combate)
const SHORT_REST_REMOVE_CONDITIONS = [
  'Atordoado',
  'Ofuscado',
  'Surdo',
  'Lento',
  'Fatigado',
  'Fraco',
  'Debilitado',
  'Desprevenido'
];

// Condições que são removidas em descanso longo (quase todas, exceto permanentes)
const LONG_REST_REMOVE_CONDITIONS = [
  ...SHORT_REST_REMOVE_CONDITIONS,
  'Abalado',
  'Apavorado',
  'Cego',
  'Confuso',
  'Enjoado',
  'Exausto',
  'Frustrado',
  'Pasmo',
  'Paralisado',
  'Prone',
  'Sangrando',
  'Traumatizado'
];

// Condições que NÃO são removidas por descanso (requerem tratamento especial)
const PERMANENT_CONDITIONS = [
  'Inconsciente',
  'Morrendo',
  'Enlouquecido'
];

// Função para rolar dados (d6)
const rollD6 = (): number => Math.floor(Math.random() * 6) + 1;

// Função para calcular atributo base (1-5 escala) para modificador
const getAttributeModifier = (value: number): number => {
  // Em Ordem Paranormal, o modificador é o próprio valor do atributo
  return value;
};

export function RestModal({ open, onOpenChange, character, onRest }: RestModalProps) {
  // Estado para armazenar resultado do descanso
  const [restResult, setRestResult] = useState<RestResult | null>(null);
  // Estado para indicar que está processando
  const [isResting, setIsResting] = useState(false);

  // Calcula quanto pode recuperar de cada stat
  const hpMissing = character.hp_max - character.hp_current;
  const peMissing = character.pe_max - character.pe_current;
  const sanMissing = character.san_max - character.san_current;

  // Identifica condições que serão removidas
  const getRemovableConditions = (type: 'short' | 'long'): string[] => {
    const removeList = type === 'short' ? SHORT_REST_REMOVE_CONDITIONS : LONG_REST_REMOVE_CONDITIONS;
    return character.conditions.filter(c => removeList.includes(c));
  };

  // Executa descanso curto (1 hora)
  const handleShortRest = () => {
    setIsResting(true);
    
    // Simula tempo de "rolagem"
    setTimeout(() => {
      const hpDice = rollD6();
      const hpModifier = getAttributeModifier(character.vigor);
      const hpRoll = hpDice + hpModifier;
      const hpRecovered = Math.min(hpRoll, hpMissing);
      
      // PE recupera totalmente em descanso curto
      const peRecovered = peMissing;
      
      // Remove condições temporárias
      const conditionsToRemove = getRemovableConditions('short');
      const newConditions = character.conditions.filter(c => !SHORT_REST_REMOVE_CONDITIONS.includes(c));
      
      const result: RestResult = {
        type: 'short',
        hp_recovered: hpRecovered,
        pe_recovered: peRecovered,
        san_recovered: 0,
        conditions_removed: conditionsToRemove,
        dice_rolls: {
          hp: { dice: hpDice, modifier: hpModifier, total: hpRoll }
        }
      };
      
      setRestResult(result);
      setIsResting(false);
    }, 800);
  };

  // Executa descanso longo (8 horas)
  const handleLongRest = () => {
    setIsResting(true);
    
    setTimeout(() => {
      // PV recupera totalmente
      const hpRecovered = hpMissing;
      
      // PE recupera totalmente
      const peRecovered = peMissing;
      
      // SAN recupera 1d6 + PRE
      const sanDice = rollD6();
      const sanModifier = getAttributeModifier(character.presence);
      const sanRoll = sanDice + sanModifier;
      const sanRecovered = Math.min(sanRoll, sanMissing);
      
      // Remove condições (quase todas, exceto permanentes)
      const conditionsToRemove = getRemovableConditions('long');
      const newConditions = character.conditions.filter(c => 
        PERMANENT_CONDITIONS.includes(c) || !LONG_REST_REMOVE_CONDITIONS.includes(c)
      );
      
      const result: RestResult = {
        type: 'long',
        hp_recovered: hpRecovered,
        pe_recovered: peRecovered,
        san_recovered: sanRecovered,
        conditions_removed: conditionsToRemove,
        dice_rolls: {
          san: { dice: sanDice, modifier: sanModifier, total: sanRoll }
        }
      };
      
      setRestResult(result);
      setIsResting(false);
    }, 1000);
  };

  // Confirma e aplica o descanso
  const handleConfirmRest = () => {
    if (!restResult) return;
    
    const removeList = restResult.type === 'short' ? SHORT_REST_REMOVE_CONDITIONS : LONG_REST_REMOVE_CONDITIONS;
    const newConditions = character.conditions.filter(c => 
      restResult.type === 'short' 
        ? !SHORT_REST_REMOVE_CONDITIONS.includes(c)
        : (PERMANENT_CONDITIONS.includes(c) || !LONG_REST_REMOVE_CONDITIONS.includes(c))
    );
    
    onRest({
      hp_current: character.hp_current + restResult.hp_recovered,
      pe_current: character.pe_current + restResult.pe_recovered,
      san_current: character.san_current + restResult.san_recovered,
      conditions: newConditions
    });
    
    // Limpa estado e fecha modal
    setRestResult(null);
    onOpenChange(false);
  };

  // Cancela e fecha
  const handleCancel = () => {
    setRestResult(null);
    onOpenChange(false);
  };

  // Verifica se tem condições que impedem descanso
  const hasBlockingCondition = character.conditions.some(c => 
    ['Morrendo', 'Inconsciente'].includes(c)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-primary" />
            Sistema de Descanso
          </DialogTitle>
          <DialogDescription>
            Escolha o tipo de descanso para recuperar seus recursos
          </DialogDescription>
        </DialogHeader>

        {/* Aviso se tem condição bloqueante */}
        {hasBlockingCondition && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">
              Você não pode descansar enquanto estiver Morrendo ou Inconsciente!
            </span>
          </div>
        )}

        {/* Status atual */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Heart className="h-3 w-3" /> PV
            </div>
            <span className={`font-bold ${hpMissing > 0 ? 'text-destructive' : 'text-green-500'}`}>
              {character.hp_current}/{character.hp_max}
            </span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Sparkles className="h-3 w-3" /> PE
            </div>
            <span className={`font-bold ${peMissing > 0 ? 'text-primary' : 'text-green-500'}`}>
              {character.pe_current}/{character.pe_max}
            </span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Brain className="h-3 w-3" /> SAN
            </div>
            <span className={`font-bold ${sanMissing > 0 ? 'text-orange-500' : 'text-green-500'}`}>
              {character.san_current}/{character.san_max}
            </span>
          </div>
        </div>

        {/* Resultado do descanso */}
        <AnimatePresence mode="wait">
          {restResult ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3 p-4 bg-primary/5 border border-primary/20 rounded-lg"
            >
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Check className="h-4 w-4" />
                Descanso {restResult.type === 'short' ? 'Curto' : 'Longo'} Completo!
              </div>

              {/* Recuperações */}
              <div className="space-y-2 text-sm">
                {restResult.hp_recovered > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3 text-destructive" />
                      PV Recuperados:
                    </span>
                    <span className="font-bold text-green-500">
                      +{restResult.hp_recovered}
                      {restResult.dice_rolls.hp && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (🎲{restResult.dice_rolls.hp.dice} + {restResult.dice_rolls.hp.modifier} VIG)
                        </span>
                      )}
                    </span>
                  </div>
                )}
                
                {restResult.pe_recovered > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-primary" />
                      PE Recuperados:
                    </span>
                    <span className="font-bold text-green-500">+{restResult.pe_recovered}</span>
                  </div>
                )}
                
                {restResult.san_recovered > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Brain className="h-3 w-3 text-orange-500" />
                      SAN Recuperada:
                    </span>
                    <span className="font-bold text-green-500">
                      +{restResult.san_recovered}
                      {restResult.dice_rolls.san && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (🎲{restResult.dice_rolls.san.dice} + {restResult.dice_rolls.san.modifier} PRE)
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {restResult.conditions_removed.length > 0 && (
                  <div className="pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">Condições removidas:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {restResult.conditions_removed.map(condition => (
                        <Badge key={condition} variant="secondary" className="text-xs line-through opacity-60">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={handleConfirmRest} className="w-full">
                <Check className="h-4 w-4 mr-2" />
                Confirmar Recuperação
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="options"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {/* Descanso Curto */}
              <button
                onClick={handleShortRest}
                disabled={isResting || hasBlockingCondition}
                className="w-full p-4 text-left border border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Sun className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold flex items-center gap-2">
                      Descanso Curto
                      <Badge variant="outline" className="text-xs">1 hora</Badge>
                    </div>
                    <ul className="text-sm text-muted-foreground mt-1 space-y-0.5">
                      <li className="flex items-center gap-1">
                        <Heart className="h-3 w-3" /> Recupera 1d6 + VIG ({character.vigor}) de PV
                      </li>
                      <li className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Recupera todo PE
                      </li>
                      {getRemovableConditions('short').length > 0 && (
                        <li className="text-orange-500">
                          Remove: {getRemovableConditions('short').join(', ')}
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </button>

              {/* Descanso Longo */}
              <button
                onClick={handleLongRest}
                disabled={isResting || hasBlockingCondition}
                className="w-full p-4 text-left border border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Moon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold flex items-center gap-2">
                      Descanso Longo
                      <Badge variant="outline" className="text-xs">8 horas</Badge>
                    </div>
                    <ul className="text-sm text-muted-foreground mt-1 space-y-0.5">
                      <li className="flex items-center gap-1">
                        <Heart className="h-3 w-3" /> Recupera todo PV
                      </li>
                      <li className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Recupera todo PE
                      </li>
                      <li className="flex items-center gap-1">
                        <Brain className="h-3 w-3" /> Recupera 1d6 + PRE ({character.presence}) de SAN
                      </li>
                      {getRemovableConditions('long').length > 0 && (
                        <li className="text-orange-500 text-xs">
                          Remove maioria das condições
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading state */}
        {isResting && (
          <div className="flex items-center justify-center gap-2 py-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Dice1 className="h-5 w-5 text-primary" />
            </motion.div>
            <span className="text-sm text-muted-foreground">Rolando dados...</span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * TrainingGradeSection - Seção de Grau de Treinamento (NEX 35% e 70%)
 * 
 * Especialista: Em NEX 35% e 70%, escolha um número de perícias treinadas
 * igual a 5 + Int. O grau de treinamento dessas perícias aumenta em um nível
 * (treinado → veterano → expert).
 * 
 * @module TrainingGradeSection
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  GraduationCap,
  Award,
  Star,
  CheckCircle2,
  Info,
  ArrowUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VALID_SKILL_IDS } from '@/lib/constants/game-ids';

// ========== TIPOS ==========

/**
 * Níveis de treinamento de perícia
 * 0 = Destreinado
 * 1 = Treinado
 * 2 = Veterano
 * 3 = Expert
 */
export type SkillTrainingLevel = 0 | 1 | 2 | 3;

/**
 * Mapa de níveis de treinamento para labels
 */
export const TRAINING_LEVEL_LABELS: Record<SkillTrainingLevel, string> = {
  0: 'Destreinado',
  1: 'Treinado',
  2: 'Veterano',
  3: 'Expert',
};

/**
 * Cores por nível de treinamento
 */
const TRAINING_LEVEL_COLORS: Record<SkillTrainingLevel, string> = {
  0: 'text-muted-foreground',
  1: 'text-blue-400',
  2: 'text-amber-400',
  3: 'text-primary',
};

/**
 * Labels amigáveis das perícias em português
 */
const SKILL_LABELS: Record<string, string> = {
  acrobacia: 'Acrobacia',
  crime: 'Crime',
  furtividade: 'Furtividade',
  pilotagem: 'Pilotagem',
  pontaria: 'Pontaria',
  reflexos: 'Reflexos',
  atletismo: 'Atletismo',
  luta: 'Luta',
  atualidades: 'Atualidades',
  ciencias: 'Ciências',
  investigacao: 'Investigação',
  medicina: 'Medicina',
  ocultismo: 'Ocultismo',
  profissao: 'Profissão',
  tatica: 'Tática',
  tecnologia: 'Tecnologia',
  adestramento: 'Adestramento',
  artes: 'Artes',
  diplomacia: 'Diplomacia',
  enganacao: 'Enganação',
  intimidacao: 'Intimidação',
  intuicao: 'Intuição',
  percepcao: 'Percepção',
  religiao: 'Religião',
  sobrevivencia: 'Sobrevivência',
  vontade: 'Vontade',
  fortitude: 'Fortitude',
  iniciativa: 'Iniciativa',
};

export interface SkillUpgrade {
  skillId: string;
  fromLevel: SkillTrainingLevel;
  toLevel: SkillTrainingLevel;
}

interface TrainingGradeSectionProps {
  /** Intelecto do personagem (determina quantidade de escolhas) */
  characterIntellect: number;
  /** NEX atual que o personagem está alcançando (35 ou 70) */
  currentNex: 35 | 70;
  /** Mapa de perícias do personagem: skillId → nível de treinamento */
  skills: Record<string, number>;
  /** Lista de IDs das perícias selecionadas */
  selectedSkills: string[];
  /** Callback quando seleção muda */
  onSelect: (skills: string[]) => void;
  /** Se está em contexto compacto */
  compact?: boolean;
}

// ========== COMPONENTE ==========

export function TrainingGradeSection({
  characterIntellect,
  currentNex,
  skills,
  selectedSkills,
  onSelect,
  compact = false,
}: TrainingGradeSectionProps) {
  // Calcula quantidade de perícias que podem ser escolhidas: 5 + Int
  const maxChoices = 5 + characterIntellect;
  
  // Filtra perícias elegíveis baseado no NEX
  const eligibleSkills = useMemo(() => {
    const eligible: Array<{
      id: string;
      currentLevel: SkillTrainingLevel;
      nextLevel: SkillTrainingLevel;
    }> = [];
    
    for (const skillId of VALID_SKILL_IDS) {
      const currentLevel = (skills[skillId] || 0) as SkillTrainingLevel;
      
      // NEX 35%: Somente Treinado (1) pode virar Veterano (2)
      if (currentNex === 35) {
        if (currentLevel === 1) {
          eligible.push({
            id: skillId,
            currentLevel: 1,
            nextLevel: 2,
          });
        }
      }
      // NEX 70%: Treinado → Veterano OU Veterano → Expert
      else if (currentNex === 70) {
        if (currentLevel === 1) {
          eligible.push({
            id: skillId,
            currentLevel: 1,
            nextLevel: 2,
          });
        } else if (currentLevel === 2) {
          eligible.push({
            id: skillId,
            currentLevel: 2,
            nextLevel: 3,
          });
        }
      }
    }
    
    // Ordena: primeiro veteranos (podem virar expert), depois treinados
    // Dentro de cada grupo, ordena alfabeticamente
    eligible.sort((a, b) => {
      if (a.currentLevel !== b.currentLevel) {
        return b.currentLevel - a.currentLevel; // Veteranos primeiro
      }
      return SKILL_LABELS[a.id].localeCompare(SKILL_LABELS[b.id]);
    });
    
    return eligible;
  }, [skills, currentNex]);
  
  // Handler para toggle de perícia
  const handleToggle = (skillId: string, checked: boolean) => {
    if (checked) {
      // Verifica limite
      if (selectedSkills.length >= maxChoices) return;
      onSelect([...selectedSkills, skillId]);
    } else {
      onSelect(selectedSkills.filter(id => id !== skillId));
    }
  };
  
  // Verifica se seleção está completa
  const isComplete = selectedSkills.length === maxChoices;
  const remaining = maxChoices - selectedSkills.length;
  
  return (
    <Card className={cn(
      "border-2 border-dashed transition-all",
      isComplete ? "border-success/50 bg-success/5" : "border-muted-foreground/30"
    )}>
      <CardHeader className={compact ? "pb-2" : "pb-4"}>
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Grau de Treinamento</CardTitle>
          <Badge variant="secondary" className="ml-auto">NEX {currentNex}%</Badge>
        </div>
        <CardDescription className="text-sm">
          Escolha <span className="font-semibold text-primary">{maxChoices}</span> perícias 
          (5 + Intelecto {characterIntellect}) para aumentar o grau de treinamento.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Contador de seleções */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className={cn(
              "w-4 h-4",
              isComplete ? "text-success" : "text-muted-foreground"
            )} />
            <span className="text-muted-foreground">
              {selectedSkills.length}/{maxChoices} selecionadas
            </span>
          </div>
          {!isComplete && (
            <Badge variant="outline" className="text-xs">
              Faltam {remaining}
            </Badge>
          )}
        </div>
        
        {/* Lista de perícias elegíveis */}
        <ScrollArea className={cn(
          compact 
            ? eligibleSkills.length > 6 ? "h-[250px]" : "max-h-[250px]"
            : eligibleSkills.length > 8 ? "h-[350px]" : "max-h-[350px]"
        )}>
          <div className="space-y-2 pr-3">
            {eligibleSkills.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  Nenhuma perícia elegível encontrada.
                </p>
                <p className="text-xs mt-1">
                  {currentNex === 35 
                    ? "Você precisa ter perícias Treinadas para usar este recurso."
                    : "Você precisa ter perícias Treinadas ou Veteranas para usar este recurso."
                  }
                </p>
              </div>
            ) : (
              eligibleSkills.map(({ id, currentLevel, nextLevel }) => {
                const isSelected = selectedSkills.includes(id);
                const isDisabled = !isSelected && selectedSkills.length >= maxChoices;
                
                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all",
                      isSelected
                        ? "bg-primary/10 border-primary/50 ring-1 ring-primary/30"
                        : isDisabled
                          ? "opacity-50 cursor-not-allowed border-border"
                          : "hover:bg-muted/50 cursor-pointer border-border"
                    )}
                    onClick={() => !isDisabled && handleToggle(id, !isSelected)}
                  >
                    <Checkbox
                      id={`skill-${id}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => handleToggle(id, !!checked)}
                      disabled={isDisabled}
                      className="data-[state=checked]:bg-primary"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <Label 
                        htmlFor={`skill-${id}`}
                        className={cn(
                          "font-medium cursor-pointer",
                          isDisabled && "cursor-not-allowed"
                        )}
                      >
                        {SKILL_LABELS[id] || id}
                      </Label>
                    </div>
                    
                    {/* Indicador de progressão */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className={TRAINING_LEVEL_COLORS[currentLevel]}>
                        {TRAINING_LEVEL_LABELS[currentLevel]}
                      </span>
                      <ArrowUp className="w-3 h-3 text-primary" />
                      <span className={TRAINING_LEVEL_COLORS[nextLevel]}>
                        {TRAINING_LEVEL_LABELS[nextLevel]}
                      </span>
                    </div>
                    
                    {/* Ícones por nível */}
                    <div className="flex gap-1">
                      {nextLevel >= 2 && (
                        <Award className={cn(
                          "w-4 h-4",
                          nextLevel === 2 ? "text-amber-400" : "text-muted-foreground/30"
                        )} />
                      )}
                      {nextLevel >= 3 && (
                        <Star className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </ScrollArea>
        
        {/* Resumo das seleções */}
        <AnimatePresence>
          {selectedSkills.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-3 border-t border-border"
            >
              <div className="text-sm text-muted-foreground mb-2">
                Perícias selecionadas:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedSkills.map(skillId => {
                  const skill = eligibleSkills.find(s => s.id === skillId);
                  if (!skill) return null;
                  
                  return (
                    <Badge 
                      key={skillId}
                      variant="secondary"
                      className={cn(
                        "text-xs cursor-pointer hover:bg-destructive/20",
                        skill.nextLevel === 3 && "bg-primary/20 text-primary"
                      )}
                      onClick={() => handleToggle(skillId, false)}
                    >
                      {SKILL_LABELS[skillId]} → {TRAINING_LEVEL_LABELS[skill.nextLevel]}
                      <span className="ml-1 opacity-50">×</span>
                    </Badge>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Aviso se não completou */}
        {!isComplete && selectedSkills.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-warning">
            <Info className="w-4 h-4" />
            <span>Selecione {remaining} perícia{remaining !== 1 ? 's' : ''} para continuar.</span>
          </div>
        )}
        
        {/* Sucesso */}
        {isComplete && (
          <div className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="w-4 h-4" />
            <span>Seleção completa! {maxChoices} perícias serão aprimoradas.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Verifica se a escolha de Grau de Treinamento está completa
 */
export function isTrainingGradeComplete(
  selectedSkills: string[],
  intellect: number
): boolean {
  const required = 5 + intellect;
  return selectedSkills.length === required;
}

/**
 * Calcula os upgrades de perícias baseado nas seleções
 */
export function calculateSkillUpgrades(
  selectedSkills: string[],
  currentSkills: Record<string, number>,
  nex: 35 | 70
): SkillUpgrade[] {
  return selectedSkills.map(skillId => {
    const currentLevel = (currentSkills[skillId] || 0) as SkillTrainingLevel;
    const nextLevel = (currentLevel + 1) as SkillTrainingLevel;
    
    return {
      skillId,
      fromLevel: currentLevel,
      toLevel: nextLevel > 3 ? 3 : nextLevel,
    };
  });
}

/**
 * Aplica os upgrades ao mapa de skills
 */
export function applySkillUpgrades(
  currentSkills: Record<string, number>,
  upgrades: SkillUpgrade[]
): Record<string, number> {
  const newSkills = { ...currentSkills };
  
  for (const upgrade of upgrades) {
    newSkills[upgrade.skillId] = upgrade.toLevel;
  }
  
  return newSkills;
}

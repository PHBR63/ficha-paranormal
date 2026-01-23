/**
 * Modal de Sub-Escolha de Poderes Paranormais
 * 
 * Exibido quando um poder paranormal requer uma escolha adicional:
 * - Expansão de Conhecimento: escolher perícias de Intelecto
 * - Aprender Ritual: escolher um ritual
 * - Resistir a Elemento: escolher um elemento
 * 
 * IDs centralizados em: src/lib/constants/game-ids.ts
 */

import { useState, useMemo } from 'react';
import {
  MobileModal,
  MobileModalContent,
  MobileModalHeader,
  MobileModalBody,
  MobileModalFooter,
  MobileModalTitle,
  MobileModalDescription,
} from '@/components/ui/mobile-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, BookOpen, Droplet, Skull, Zap, Brain, AlertTriangle } from 'lucide-react';
import { ParanormalPower, ParanormalElement, PowerChoiceType, ELEMENT_LABELS, ELEMENT_COLORS, ELEMENT_BG_COLORS } from '@/lib/paranormal-powers';
import { SKILL_IDS, VALID_ELEMENT_IDS, isValidElementId } from '@/lib/constants/game-ids';
import { getElementConfigSafe, getElementKeys, ParanormalElementType } from '@/lib/element-config';

// Perícias baseadas em Intelecto (usando IDs centralizados)
const INTELLECT_SKILLS = [
  { id: SKILL_IDS.CIENCIAS, name: 'Ciências', description: 'Conhecimento científico geral' },
  { id: SKILL_IDS.INVESTIGACAO, name: 'Investigação', description: 'Encontrar pistas e analisar evidências' },
  { id: SKILL_IDS.MEDICINA, name: 'Medicina', description: 'Tratamento e diagnóstico médico' },
  { id: SKILL_IDS.OCULTISMO, name: 'Ocultismo', description: 'Conhecimento sobre o paranormal' },
  { id: SKILL_IDS.PROFISSAO, name: 'Profissão', description: 'Habilidades profissionais específicas' },
  { id: SKILL_IDS.TATICA, name: 'Tática', description: 'Estratégia e planejamento de combate' },
  { id: SKILL_IDS.TECNOLOGIA, name: 'Tecnologia', description: 'Uso e criação de dispositivos' },
];

// Elementos para resistência (usa getElementKeys para obter elementos válidos)
// Exclui 'medo' que não é resistível por este poder
const RESISTANCE_ELEMENTS: ParanormalElement[] = getElementKeys()
  .filter(el => el !== 'medo') as ParanormalElement[];

interface PowerSubchoiceModalProps {
  open: boolean;
  onClose: () => void;
  power: ParanormalPower;
  hasAffinity: boolean;
  affinityElement?: ParanormalElement;
  onConfirm: (choices: {
    skills?: string[];
    ritualId?: string;
    resistElement?: ParanormalElement;
  }) => void;
  // Para escolha de rituais, precisamos abrir outro modal
  onOpenRitualSelect?: () => void;
  selectedRitualId?: string;
  selectedRitualName?: string;
}

export function PowerSubchoiceModal({
  open,
  onClose,
  power,
  hasAffinity,
  affinityElement,
  onConfirm,
  onOpenRitualSelect,
  selectedRitualId,
  selectedRitualName,
}: PowerSubchoiceModalProps) {
  // Estado para perícias selecionadas
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  
  // Estado para elemento de resistência selecionado
  const [selectedResistElement, setSelectedResistElement] = useState<ParanormalElement | null>(null);
  
  // Quantas perícias pode escolher
  // Com afinidade de Conhecimento, pode escolher 2 perícias
  const maxSkills = hasAffinity && affinityElement === 'conhecimento' ? 2 : 1;
  
  // Tipo de escolha requerida
  const choiceType = power.requiresChoice;
  
  // Título e descrição baseado no tipo
  const modalInfo = useMemo(() => {
    switch (choiceType) {
      case 'skill_intellect':
        return {
          title: 'Escolher Perícia de Intelecto',
          description: hasAffinity && affinityElement === 'conhecimento'
            ? 'Escolha até 2 perícias baseadas em Intelecto para receber +5.'
            : 'Escolha 1 perícia baseada em Intelecto para receber +5.',
        };
      case 'ritual':
        return {
          title: 'Escolher Ritual',
          description: 'Escolha um ritual de qualquer círculo que você possa lançar.',
        };
      case 'element_resistance':
        return {
          title: 'Escolher Elemento',
          description: 'Escolha um elemento para receber resistência 5.',
        };
      default:
        return {
          title: 'Escolha Adicional',
          description: 'Este poder requer uma escolha adicional.',
        };
    }
  }, [choiceType, hasAffinity, affinityElement]);
  
  // Validação de escolhas completas
  const isValid = useMemo(() => {
    switch (choiceType) {
      case 'skill_intellect':
        return selectedSkills.length >= 1;
      case 'ritual':
        return !!selectedRitualId;
      case 'element_resistance':
        return !!selectedResistElement;
      default:
        return true;
    }
  }, [choiceType, selectedSkills, selectedRitualId, selectedResistElement]);
  
  // Handler para toggle de perícia
  const handleSkillToggle = (skillId: string) => {
    setSelectedSkills(prev => {
      if (prev.includes(skillId)) {
        return prev.filter(s => s !== skillId);
      }
      if (prev.length >= maxSkills) {
        // Remove o primeiro e adiciona o novo
        return [...prev.slice(1), skillId];
      }
      return [...prev, skillId];
    });
  };
  
  // Handler para confirmar
  const handleConfirm = () => {
    const choices: {
      skills?: string[];
      ritualId?: string;
      resistElement?: ParanormalElement;
    } = {};
    
    if (choiceType === 'skill_intellect') {
      choices.skills = selectedSkills;
    } else if (choiceType === 'ritual') {
      choices.ritualId = selectedRitualId;
    } else if (choiceType === 'element_resistance') {
      choices.resistElement = selectedResistElement || undefined;
    }
    
    onConfirm(choices);
  };
  
  return (
    <MobileModal open={open} onOpenChange={onClose}>
      <MobileModalContent size="md">
        <MobileModalHeader>
          <MobileModalTitle className="flex items-center gap-2 font-display tracking-wider">
            <Brain className="h-5 w-5 text-primary" />
            {modalInfo.title}
          </MobileModalTitle>
          <MobileModalDescription>
            <span className="font-medium text-foreground">{power.name}</span>
            <span className="block mt-1">{modalInfo.description}</span>
          </MobileModalDescription>
        </MobileModalHeader>
        
        {/* Padrão do projeto: calc() ao invés de vh puro para garantir scroll no mobile */}
        <MobileModalBody useScrollArea={true} maxHeight="calc(85vh - 200px)">
          {/* Escolha de Perícias de Intelecto */}
          {choiceType === 'skill_intellect' && (
            <div className="space-y-2 p-1">
              <p className="text-xs text-muted-foreground mb-3">
                Selecionadas: {selectedSkills.length}/{maxSkills}
              </p>
              {INTELLECT_SKILLS.map((skill) => {
                const isSelected = selectedSkills.includes(skill.id);
                return (
                  <Card
                    key={skill.id}
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'border-primary bg-primary/10' : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleSkillToggle(skill.id)}
                  >
                    <CardHeader className="p-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{skill.name}</CardTitle>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSkillToggle(skill.id)}
                        />
                      </div>
                      <CardDescription className="text-xs">
                        {skill.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
          
          {/* Escolha de Ritual */}
          {choiceType === 'ritual' && (
            <div className="p-1">
              {selectedRitualId ? (
                <Card className="border-primary bg-primary/10">
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base">{selectedRitualName}</CardTitle>
                      </div>
                      <Badge variant="secondary">Selecionado</Badge>
                    </div>
                  </CardHeader>
                </Card>
              ) : (
                <Card className="border-dashed border-2">
                  <CardContent className="p-6 text-center">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Nenhum ritual selecionado
                    </p>
                    <Button onClick={onOpenRitualSelect}>
                      Escolher Ritual
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          
          {/* Escolha de Elemento para Resistência */}
          {choiceType === 'element_resistance' && (
            <div className="grid grid-cols-2 gap-3 p-1">
              {RESISTANCE_ELEMENTS.map((element) => {
                const isSelected = selectedResistElement === element;
                const config = getElementConfigSafe(element);
                const Icon = config?.icon || Droplet;
                const colorClass = config?.text || ELEMENT_COLORS[element];
                const bgClass = config?.bg || ELEMENT_BG_COLORS[element];
                
                return (
                  <Card
                    key={element}
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedResistElement(element)}
                  >
                    <CardHeader className="p-4 text-center">
                      <div className={`w-12 h-12 mx-auto rounded-full ${bgClass} flex items-center justify-center mb-2`}>
                        <Icon className={`h-6 w-6 ${colorClass}`} />
                      </div>
                      <CardTitle className="text-sm">{config?.label || ELEMENT_LABELS[element]}</CardTitle>
                      {isSelected && (
                        <Badge className="mt-2 bg-primary">
                          <Check className="h-3 w-3 mr-1" />
                          Selecionado
                        </Badge>
                      )}
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </MobileModalBody>
        
        {/* Aviso se não está válido */}
        {!isValid && (
          <div className="flex items-center gap-2 p-3 mx-4 sm:mx-6 bg-warning/10 border border-warning/30 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
            <span className="text-warning">Você precisa fazer uma escolha para continuar.</span>
          </div>
        )}
        
        <MobileModalFooter bordered>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            <Check className="h-4 w-4 mr-2" />
            Confirmar
          </Button>
        </MobileModalFooter>
      </MobileModalContent>
    </MobileModal>
  );
}

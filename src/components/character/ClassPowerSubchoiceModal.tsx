/**
 * Modal de Sub-Escolha de Poderes de Classe
 * 
 * Exibido quando um poder de classe requer uma escolha adicional:
 * - Especialista em Arma: escolher grupo de armas
 * - Treinamento em Perícia: escolher perícias para upgrade
 * - Outros poderes com requiresChoice
 * 
 * Diferente do PowerSubchoiceModal que é para poderes paranormais.
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
import { Check, Swords, GraduationCap, AlertTriangle, Target } from 'lucide-react';
import { WEAPON_GROUPS, type WeaponGroup } from '@/lib/constants/weapon-groups';
import { SKILLS_BY_ATTRIBUTE } from '@/lib/constants/game-ids';
import type { UnifiedClassPower } from '@/lib/class-powers/types';

// ============================================
// TIPOS
// ============================================

/**
 * Tipos de escolha suportados pelo modal
 */
export type ClassPowerChoiceType = 'weaponGroup' | 'skill' | 'attribute' | 'power';

/**
 * Resultado de uma sub-escolha de poder de classe
 */
export interface ClassPowerSubchoice {
  powerId: string;
  choiceType: ClassPowerChoiceType;
  chosenValues: string[];
  instanceIndex?: number; // Para poderes repetíveis
}

/**
 * Props do componente
 */
interface ClassPowerSubchoiceModalProps {
  open: boolean;
  onClose: () => void;
  power: UnifiedClassPower;
  onConfirm: (choice: ClassPowerSubchoice) => void;
  // Para poderes repetíveis, qual instância está sendo editada
  instanceIndex?: number;
  // Grupos de armas já escolhidos (para evitar duplicação)
  existingWeaponGroups?: string[];
  // Perícias já escolhidas em outras instâncias
  existingSkillChoices?: string[];
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function ClassPowerSubchoiceModal({
  open,
  onClose,
  power,
  onConfirm,
  instanceIndex = 0,
  existingWeaponGroups = [],
  existingSkillChoices = [],
}: ClassPowerSubchoiceModalProps) {
  // Estado para valores selecionados
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  
  // Extrair tipo de escolha do poder
  const choiceConfig = power.effects?.base?.requiresChoice;
  const choiceType = choiceConfig?.type as ClassPowerChoiceType | undefined;
  const choiceCount = choiceConfig?.count || 1;
  
  // Título e descrição baseado no tipo de escolha
  const modalInfo = useMemo(() => {
    switch (choiceType) {
      case 'weaponGroup':
        return {
          title: 'Escolher Grupo de Armas',
          description: `Escolha ${choiceCount} grupo${choiceCount > 1 ? 's' : ''} de armas para se especializar.`,
          icon: Swords,
        };
      case 'skill':
        return {
          title: 'Escolher Perícia',
          description: `Escolha ${choiceCount} perícia${choiceCount > 1 ? 's' : ''} para aplicar o efeito.`,
          icon: GraduationCap,
        };
      case 'attribute':
        return {
          title: 'Escolher Atributo',
          description: 'Escolha um atributo para aumentar.',
          icon: Target,
        };
      default:
        return {
          title: 'Escolha Adicional',
          description: 'Este poder requer uma escolha adicional.',
          icon: Target,
        };
    }
  }, [choiceType, choiceCount]);
  
  // Validação de escolhas completas
  const isValid = useMemo(() => {
    return selectedValues.length >= choiceCount;
  }, [selectedValues, choiceCount]);
  
  // Handler para toggle de valor
  const handleToggle = (value: string) => {
    setSelectedValues(prev => {
      if (prev.includes(value)) {
        return prev.filter(v => v !== value);
      }
      if (prev.length >= choiceCount) {
        // Remove o primeiro e adiciona o novo
        return [...prev.slice(1), value];
      }
      return [...prev, value];
    });
  };
  
  // Handler para confirmar
  const handleConfirm = () => {
    if (!choiceType) return;
    
    onConfirm({
      powerId: power.id,
      choiceType,
      chosenValues: selectedValues,
      instanceIndex,
    });
    
    // Reset estado
    setSelectedValues([]);
    onClose();
  };
  
  // Handler para fechar
  const handleClose = () => {
    setSelectedValues([]);
    onClose();
  };
  
  // Grupos de armas disponíveis (exclui já escolhidos)
  const availableWeaponGroups = useMemo(() => {
    return WEAPON_GROUPS.filter(g => !existingWeaponGroups.includes(g.id));
  }, [existingWeaponGroups]);
  
  // Renderizar opções baseado no tipo
  const renderOptions = () => {
    switch (choiceType) {
      case 'weaponGroup':
        return renderWeaponGroups();
      case 'skill':
        return renderSkills();
      case 'attribute':
        return renderAttributes();
      case 'power':
        // Transcender é tratado por ParanormalPowerSelectModal em ClassPowerSelectionSection
        // Se chegou aqui, há um erro de fluxo - mostra mensagem informativa
        return (
          <div className="text-center py-8 text-muted-foreground space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-paranormal/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-paranormal" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Transcender</p>
              <p className="text-xs mt-1">
                Este poder concede um Poder Paranormal.
              </p>
            </div>
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg mx-4">
              <p className="text-xs text-warning">
                ⚠️ Se você está vendo esta mensagem, houve um erro no fluxo.
                Por favor, feche este modal e tente novamente.
              </p>
            </div>
          </div>
        );
      default:
        return (
          <p className="text-muted-foreground text-center py-4">
            Tipo de escolha não suportado: {choiceType}
          </p>
        );
    }
  };
  
  // Renderizar grupos de armas
  const renderWeaponGroups = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1">
      {availableWeaponGroups.map((group) => {
        const isSelected = selectedValues.includes(group.id);
        const Icon = group.icon;
        
        return (
          <Card
            key={group.id}
            className={`cursor-pointer transition-all ${
              isSelected ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover:border-primary/50'
            }`}
            onClick={() => handleToggle(group.id)}
          >
            <CardHeader className="p-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-primary/20' : 'bg-muted'
                }`}>
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{group.name}</CardTitle>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(group.id)}
                    />
                  </div>
                  <CardDescription className="text-xs mt-0.5">
                    {group.description}
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {group.examples.slice(0, 3).map((ex, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {ex}
                  </Badge>
                ))}
                {group.examples.length > 3 && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    +{group.examples.length - 3}
                  </Badge>
                )}
              </div>
            </CardHeader>
          </Card>
        );
      })}
      
      {availableWeaponGroups.length === 0 && (
        <Card className="col-span-full border-dashed">
          <CardContent className="p-6 text-center text-muted-foreground">
            Todos os grupos de armas já foram escolhidos.
          </CardContent>
        </Card>
      )}
    </div>
  );
  
  // Renderizar perícias
  const renderSkills = () => {
    // Mapeamento de ID para nome legível
    const skillNames: Record<string, string> = {
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
      sobrevivencia: 'Sobrevivência',
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
      vontade: 'Vontade',
      fortitude: 'Fortitude',
      iniciativa: 'Iniciativa',
    };
    
    const attributeLabels: Record<string, string> = {
      agility: 'Agilidade',
      strength: 'Força',
      vigor: 'Vigor',
      intellect: 'Intelecto',
      presence: 'Presença',
    };
    
    return (
      <div className="space-y-4 p-1">
        {Object.entries(SKILLS_BY_ATTRIBUTE).map(([attr, skills]) => (
          <div key={attr}>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              {attributeLabels[attr] || attr}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {skills.map((skillId) => {
                const isSelected = selectedValues.includes(skillId);
                const isDisabled = existingSkillChoices.includes(skillId);
                const skillName = skillNames[skillId] || skillId;
                
                return (
                  <Card
                    key={skillId}
                    className={`cursor-pointer transition-all ${
                      isDisabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : isSelected 
                          ? 'ring-2 ring-primary border-primary bg-primary/5' 
                          : 'hover:border-primary/50'
                    }`}
                    onClick={() => !isDisabled && handleToggle(skillId)}
                  >
                    <CardHeader className="p-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs">{skillName}</CardTitle>
                        <Checkbox
                          checked={isSelected}
                          disabled={isDisabled}
                          onCheckedChange={() => !isDisabled && handleToggle(skillId)}
                        />
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Renderizar atributos
  const renderAttributes = () => {
    const attributes = [
      { id: 'agility', name: 'Agilidade', abbrev: 'AGI', description: 'Rapidez e reflexos' },
      { id: 'strength', name: 'Força', abbrev: 'FOR', description: 'Poder físico' },
      { id: 'vigor', name: 'Vigor', abbrev: 'VIG', description: 'Resistência e saúde' },
      { id: 'intellect', name: 'Intelecto', abbrev: 'INT', description: 'Conhecimento e raciocínio' },
      { id: 'presence', name: 'Presença', abbrev: 'PRE', description: 'Carisma e força de vontade' },
    ];
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1">
        {attributes.map((attr) => {
          const isSelected = selectedValues.includes(attr.id);
          
          return (
            <Card
              key={attr.id}
              className={`cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover:border-primary/50'
              }`}
              onClick={() => handleToggle(attr.id)}
            >
              <CardHeader className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {attr.abbrev}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{attr.name}</CardTitle>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggle(attr.id)}
                      />
                    </div>
                    <CardDescription className="text-xs mt-0.5">
                      {attr.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    );
  };
  
  const ModalIcon = modalInfo.icon;
  
  return (
    <MobileModal open={open} onOpenChange={handleClose}>
      <MobileModalContent size="lg">
        <MobileModalHeader>
          <MobileModalTitle className="flex items-center gap-2 font-display tracking-wider">
            <ModalIcon className="h-5 w-5 text-primary" />
            {modalInfo.title}
          </MobileModalTitle>
          <MobileModalDescription>
            <span className="font-medium text-foreground">{power.name}</span>
            {power.isRepeatable && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Repetível
              </Badge>
            )}
            <span className="block mt-1">{modalInfo.description}</span>
          </MobileModalDescription>
        </MobileModalHeader>

        {/* Contador fixo (fora do scroll) para evitar “comer” a área útil no mobile */}
        {choiceCount > 1 && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-2 bg-muted/50 rounded-lg mx-4 sm:mx-6">
            <span className="text-sm text-muted-foreground">Selecionados</span>
            <Badge
              variant={isValid ? 'default' : 'outline'}
              className={isValid ? 'bg-success/20 text-success border-success/30' : undefined}
            >
              {selectedValues.length}/{choiceCount}
            </Badge>
          </div>
        )}
        
        {/*
          IMPORTANTE (padrão do projeto): evitar maxHeight em %/vh puro.
          Em alguns viewports mobile isso impede o SimpleBar de calcular overflow.
        */}
        <MobileModalBody useScrollArea={true} maxHeight="calc(85vh - 240px)">
          <div className="min-h-0">
            {renderOptions()}
          </div>
        </MobileModalBody>
        
        {/* Aviso se não está válido */}
        {!isValid && (
          <div className="flex items-center gap-2 p-3 mx-4 sm:mx-6 bg-warning/10 border border-warning/30 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
            <span className="text-warning">Você precisa fazer uma escolha para continuar.</span>
          </div>
        )}
        
        <MobileModalFooter bordered>
          <Button variant="outline" onClick={handleClose}>
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

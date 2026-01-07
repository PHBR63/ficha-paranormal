/**
 * SkillChoiceModal - Modal para escolha de perícias
 * 
 * Suporta:
 * - Escolha simples entre opções da classe
 * - Terceira opção "escolher outra perícia" quando há conflito com origem (Combatente)
 * - Resolução de conflitos de perícias
 * - Validação de perícias válidas do sistema
 * - Busca de perícias
 * - Cores por atributo em português
 */

import { useState, useMemo } from 'react';
import {
  MobileModal,
  MobileModalContent,
  MobileModalHeader,
  MobileModalBody,
  MobileModalTitle,
  MobileModalDescription,
} from '@/components/ui/mobile-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SKILLS } from '@/lib/character-data';
import { isValidSkillId } from '@/lib/character-builder-engine';
import { cn } from '@/lib/utils';
import { 
  ATTRIBUTE_ABBR, 
  ATTRIBUTE_BG_COLORS, 
  ATTRIBUTE_TEXT_COLORS,
  ATTRIBUTE_NAMES,
  ATTRIBUTE_ORDER,
  type AttributeKey 
} from '@/lib/constants/attributes';
import { AlertTriangle, Sparkles, Check, Search, GraduationCap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SkillChoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  options: string[];
  selectedSkill: string | null;
  onSelect: (skillId: string) => void;
  excludeSkills?: string[];
  /** Permite escolher qualquer perícia quando todas as opções estão em conflito */
  allowFreeChoice?: boolean;
  /** Lista de perícias já treinadas (para a opção livre) */
  alreadyTrainedSkills?: string[];
}

export function SkillChoiceModal({
  open,
  onOpenChange,
  title,
  description,
  options,
  selectedSkill,
  onSelect,
  excludeSkills = [],
  allowFreeChoice = false,
  alreadyTrainedSkills = [],
}: SkillChoiceModalProps) {
  const [showFreeChoice, setShowFreeChoice] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Opções disponíveis (não excluídas)
  const availableOptions = options.filter(opt => !excludeSkills.includes(opt));
  
  // Opções em conflito (já treinadas pela origem)
  const conflictOptions = options.filter(opt => excludeSkills.includes(opt));
  
  // Verificar se há conflito em alguma opção
  const hasConflict = conflictOptions.length > 0;
  
  // Todas as perícias disponíveis para escolha livre
  const allAvailableSkills = useMemo(() => 
    SKILLS.filter(
      s => !alreadyTrainedSkills.includes(s.id) && !options.includes(s.id)
    ),
    [alreadyTrainedSkills, options]
  );

  // Perícias filtradas pela busca
  const filteredSkills = useMemo(() => {
    if (!searchQuery.trim()) return allAvailableSkills;
    const query = searchQuery.toLowerCase();
    return allAvailableSkills.filter(skill =>
      skill.name.toLowerCase().includes(query) ||
      skill.description.toLowerCase().includes(query) ||
      ATTRIBUTE_ABBR[skill.attribute as AttributeKey]?.toLowerCase().includes(query)
    );
  }, [allAvailableSkills, searchQuery]);

  // Agrupar perícias por atributo
  const groupedSkills = useMemo(() => {
    const groups: Record<AttributeKey, typeof filteredSkills> = {
      agility: [],
      strength: [],
      intellect: [],
      presence: [],
      vigor: [],
    };
    
    filteredSkills.forEach(skill => {
      const attr = skill.attribute as AttributeKey;
      if (groups[attr]) {
        groups[attr].push(skill);
      }
    });
    
    return groups;
  }, [filteredSkills]);

  // Valida e seleciona a perícia
  const handleSelect = (skillId: string) => {
    // Validação de segurança: verificar se é uma perícia válida
    if (!isValidSkillId(skillId)) {
      toast({
        title: "Perícia inválida",
        description: "A perícia selecionada não é válida. Por favor, escolha outra.",
        variant: "destructive",
      });
      return;
    }
    
    onSelect(skillId);
    setShowFreeChoice(false);
    setSearchQuery('');
    onOpenChange(false);
  };

  const handleClose = () => {
    setShowFreeChoice(false);
    setSearchQuery('');
    onOpenChange(false);
  };

  // Função para obter a abreviação do atributo em português
  const getAttrAbbr = (attribute: string) => {
    return ATTRIBUTE_ABBR[attribute as AttributeKey] || attribute.substring(0, 3).toUpperCase();
  };

  // Função para obter a cor de fundo do atributo
  const getAttrBgColor = (attribute: string) => {
    return ATTRIBUTE_BG_COLORS[attribute as AttributeKey] || 'bg-muted';
  };

  // Função para obter a cor de texto do atributo
  const getAttrTextColor = (attribute: string) => {
    return ATTRIBUTE_TEXT_COLORS[attribute as AttributeKey] || 'text-muted-foreground';
  };

  return (
    <MobileModal open={open} onOpenChange={handleClose}>
      <MobileModalContent size="md">
        <MobileModalHeader>
          <MobileModalTitle className="font-display tracking-wider">{title}</MobileModalTitle>
          <MobileModalDescription>{description}</MobileModalDescription>
        </MobileModalHeader>

        <MobileModalBody useScrollArea={true}>
          {/* Aviso de conflito */}
          {hasConflict && allowFreeChoice && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning mb-4">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Conflito detectado!</p>
                <p className="text-xs opacity-80">
                  {conflictOptions.length === 1 
                    ? `A perícia "${SKILLS.find(s => s.id === conflictOptions[0])?.name}" já foi concedida pela sua origem.`
                    : `Algumas perícias já foram concedidas pela sua origem.`
                  }
                  {' '}Você pode escolher a outra opção ou selecionar qualquer perícia livre.
                </p>
              </div>
            </div>
          )}

          {!showFreeChoice ? (
            <div className="space-y-2">
              {/* Opções normais */}
              {options.map((skillId) => {
                const skill = SKILLS.find(s => s.id === skillId);
                if (!skill) return null;

                const isSelected = selectedSkill === skillId;
                const isConflict = excludeSkills.includes(skillId);

                return (
                  <Button
                    key={skillId}
                    variant="outline"
                    onClick={() => !isConflict && handleSelect(skillId)}
                    disabled={isConflict}
                    className={cn(
                      'w-full justify-start h-auto py-3',
                      isSelected && 'border-primary bg-primary/10',
                      isConflict && 'opacity-60 cursor-not-allowed'
                    )}
                  >
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{skill.name}</p>
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded font-medium",
                          getAttrBgColor(skill.attribute),
                          getAttrTextColor(skill.attribute)
                        )}>
                          {getAttrAbbr(skill.attribute)}
                        </span>
                        {isConflict && (
                          <Badge variant="outline" className="text-xs text-warning border-warning">
                            Já treinada
                          </Badge>
                        )}
                        {isSelected && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{skill.description}</p>
                    </div>
                  </Button>
                );
              })}

              {/* Terceira opção: escolher outra perícia */}
              {allowFreeChoice && hasConflict && (
                <Button
                  variant="outline"
                  onClick={() => setShowFreeChoice(true)}
                  className="w-full justify-start h-auto py-3 border-dashed border-primary/50 hover:border-primary"
                >
                  <div className="text-left flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-medium text-primary">Escolher outra perícia</p>
                      <p className="text-xs text-muted-foreground">
                        Selecione qualquer perícia disponível como substituição
                      </p>
                    </div>
                  </div>
                </Button>
              )}
            </div>
          ) : (
            /* Lista de todas as perícias disponíveis */
            <div className="space-y-3">
              {/* Header com botão voltar */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Escolha uma perícia:</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setShowFreeChoice(false);
                    setSearchQuery('');
                  }}
                >
                  Voltar
                </Button>
              </div>

              {/* Campo de busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar perícia..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>

              {/* Lista de perícias agrupadas por atributo */}
              <div className="space-y-4">
                {filteredSkills.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma perícia encontrada
                  </p>
                ) : (
                  ATTRIBUTE_ORDER.map((attrKey) => {
                    const skills = groupedSkills[attrKey];
                    if (skills.length === 0) return null;
                    
                    return (
                      <div key={attrKey} className="space-y-2">
                        {/* Header do grupo */}
                        <div className={cn(
                          "flex items-center gap-2 px-2 py-1 rounded",
                          getAttrBgColor(attrKey)
                        )}>
                          <span className={cn(
                            "text-xs font-bold px-1.5 py-0.5 rounded",
                            getAttrBgColor(attrKey),
                            getAttrTextColor(attrKey)
                          )}>
                            {getAttrAbbr(attrKey)}
                          </span>
                          <span className="text-sm font-medium">
                            {ATTRIBUTE_NAMES[attrKey]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({skills.length})
                          </span>
                        </div>
                        
                        {/* Perícias do grupo */}
                        <div className="space-y-1.5 pl-2">
                          {skills.map((skill) => (
                            <button
                              key={skill.id}
                              onClick={() => handleSelect(skill.id)}
                              className={cn(
                                "w-full p-2.5 text-left rounded-lg border border-border",
                                "hover:border-primary/50 hover:bg-primary/5 transition-all",
                                "focus:outline-none focus:ring-2 focus:ring-primary/50"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm flex-1">{skill.name}</span>
                                {skill.requiresTraining && (
                                  <span className="flex items-center gap-1 text-xs text-warning">
                                    <GraduationCap className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {skill.description}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </MobileModalBody>
      </MobileModalContent>
    </MobileModal>
  );
}

interface ConflictResolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflictSkillId: string;
  alreadyTrainedSkills: string[];
  onSelect: (skillId: string) => void;
}

export function ConflictResolutionModal({
  open,
  onOpenChange,
  conflictSkillId,
  alreadyTrainedSkills,
  onSelect,
}: ConflictResolutionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const conflictSkill = SKILLS.find(s => s.id === conflictSkillId);
  
  // Todas as perícias exceto as já treinadas
  const availableSkills = useMemo(() => 
    SKILLS.filter(
      s => !alreadyTrainedSkills.includes(s.id) && s.id !== conflictSkillId
    ),
    [alreadyTrainedSkills, conflictSkillId]
  );

  // Perícias filtradas pela busca
  const filteredSkills = useMemo(() => {
    if (!searchQuery.trim()) return availableSkills;
    const query = searchQuery.toLowerCase();
    return availableSkills.filter(skill =>
      skill.name.toLowerCase().includes(query) ||
      skill.description.toLowerCase().includes(query) ||
      ATTRIBUTE_ABBR[skill.attribute as AttributeKey]?.toLowerCase().includes(query)
    );
  }, [availableSkills, searchQuery]);

  // Agrupar perícias por atributo
  const groupedSkills = useMemo(() => {
    const groups: Record<AttributeKey, typeof filteredSkills> = {
      agility: [],
      strength: [],
      intellect: [],
      presence: [],
      vigor: [],
    };
    
    filteredSkills.forEach(skill => {
      const attr = skill.attribute as AttributeKey;
      if (groups[attr]) {
        groups[attr].push(skill);
      }
    });
    
    return groups;
  }, [filteredSkills]);

  // Função para obter a abreviação do atributo em português
  const getAttrAbbr = (attribute: string) => {
    return ATTRIBUTE_ABBR[attribute as AttributeKey] || attribute.substring(0, 3).toUpperCase();
  };

  // Função para obter a cor de fundo do atributo
  const getAttrBgColor = (attribute: string) => {
    return ATTRIBUTE_BG_COLORS[attribute as AttributeKey] || 'bg-muted';
  };

  // Função para obter a cor de texto do atributo
  const getAttrTextColor = (attribute: string) => {
    return ATTRIBUTE_TEXT_COLORS[attribute as AttributeKey] || 'text-muted-foreground';
  };

  // Valida e seleciona a perícia de substituição
  const handleSelect = (skillId: string) => {
    // Validação de segurança: verificar se é uma perícia válida
    if (!isValidSkillId(skillId)) {
      toast({
        title: "Perícia inválida",
        description: "A perícia selecionada não é válida. Por favor, escolha outra.",
        variant: "destructive",
      });
      return;
    }
    
    onSelect(skillId);
    setSearchQuery('');
    onOpenChange(false);
  };

  const handleClose = () => {
    setSearchQuery('');
    onOpenChange(false);
  };

  return (
    <MobileModal open={open} onOpenChange={handleClose}>
      <MobileModalContent size="md">
        <MobileModalHeader>
          <MobileModalTitle className="font-display tracking-wider text-warning">
            CONFLITO DE PERÍCIA
          </MobileModalTitle>
          <MobileModalDescription>
            A perícia <strong>{conflictSkill?.name}</strong> já foi concedida pela sua origem.
            Escolha outra perícia para substituí-la.
          </MobileModalDescription>
        </MobileModalHeader>

        <MobileModalBody useScrollArea={true}>
          <div className="space-y-3">
            {/* Campo de busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar perícia..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
              />
            </div>

            {/* Lista de perícias agrupadas por atributo */}
            <div className="space-y-4">
              {filteredSkills.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma perícia encontrada
                </p>
              ) : (
                ATTRIBUTE_ORDER.map((attrKey) => {
                  const skills = groupedSkills[attrKey];
                  if (skills.length === 0) return null;
                  
                  return (
                    <div key={attrKey} className="space-y-2">
                      {/* Header do grupo */}
                      <div className={cn(
                        "flex items-center gap-2 px-2 py-1 rounded",
                        getAttrBgColor(attrKey)
                      )}>
                        <span className={cn(
                          "text-xs font-bold px-1.5 py-0.5 rounded",
                          getAttrBgColor(attrKey),
                          getAttrTextColor(attrKey)
                        )}>
                          {getAttrAbbr(attrKey)}
                        </span>
                        <span className="text-sm font-medium">
                          {ATTRIBUTE_NAMES[attrKey]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({skills.length})
                        </span>
                      </div>
                      
                      {/* Perícias do grupo */}
                      <div className="space-y-1.5 pl-2">
                        {skills.map((skill) => (
                          <button
                            key={skill.id}
                            onClick={() => handleSelect(skill.id)}
                            className={cn(
                              "w-full p-2.5 text-left rounded-lg border border-border",
                              "hover:border-warning/50 hover:bg-warning/5 transition-all",
                              "focus:outline-none focus:ring-2 focus:ring-warning/50"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm flex-1">{skill.name}</span>
                              {skill.requiresTraining && (
                                <span className="flex items-center gap-1 text-xs text-warning">
                                  <GraduationCap className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {skill.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </MobileModalBody>
      </MobileModalContent>
    </MobileModal>
  );
}

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Star, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { rollSkillTest } from '@/lib/dice-roller';
import { motion, AnimatePresence } from 'framer-motion';

interface SkillData {
  trained: boolean;
  bonus: number;
  veteran?: boolean;
  expert?: boolean;
}

interface SkillRollsPanelProps {
  skills: Record<string, SkillData>;
  attributes: {
    agility: number;
    strength: number;
    intellect: number;
    presence: number;
    vigor: number;
  };
  conditionModifier?: number;
  onRollResult: (result: SkillRollResult) => void;
}

interface SkillRollResult {
  skillName: string;
  roll: number;
  modifier: number;
  total: number;
  dt?: number;
  success?: boolean;
  isCritical: boolean;
  isCriticalFail: boolean;
}

const SKILL_GROUPS: Record<string, { attribute: keyof SkillRollsPanelProps['attributes']; skills: string[] }> = {
  'Agilidade': {
    attribute: 'agility',
    skills: ['acrobacia', 'crime', 'furtividade', 'iniciativa', 'pilotagem', 'pontaria', 'reflexos'],
  },
  'Força': {
    attribute: 'strength',
    skills: ['atletismo', 'luta'],
  },
  'Intelecto': {
    attribute: 'intellect',
    skills: ['atualidades', 'ciencias', 'investigacao', 'medicina', 'ocultismo', 'profissao', 'tatica', 'tecnologia'],
  },
  'Presença': {
    attribute: 'presence',
    skills: ['adestramento', 'artes', 'diplomacia', 'enganacao', 'intimidacao', 'intuicao', 'percepcao', 'religiao', 'vontade'],
  },
  'Vigor': {
    attribute: 'vigor',
    skills: ['fortitude', 'sobrevivencia'],
  },
};

const SKILL_LABELS: Record<string, string> = {
  acrobacia: 'Acrobacia',
  adestramento: 'Adestramento',
  artes: 'Artes',
  atletismo: 'Atletismo',
  atualidades: 'Atualidades',
  ciencias: 'Ciências',
  crime: 'Crime',
  diplomacia: 'Diplomacia',
  enganacao: 'Enganação',
  fortitude: 'Fortitude',
  furtividade: 'Furtividade',
  iniciativa: 'Iniciativa',
  intimidacao: 'Intimidação',
  intuicao: 'Intuição',
  investigacao: 'Investigação',
  luta: 'Luta',
  medicina: 'Medicina',
  ocultismo: 'Ocultismo',
  percepcao: 'Percepção',
  pilotagem: 'Pilotagem',
  pontaria: 'Pontaria',
  profissao: 'Profissão',
  reflexos: 'Reflexos',
  religiao: 'Religião',
  sobrevivencia: 'Sobrevivência',
  tatica: 'Tática',
  tecnologia: 'Tecnologia',
  vontade: 'Vontade',
};

const ATTRIBUTE_COLORS: Record<string, string> = {
  'Agilidade': 'text-green-500',
  'Força': 'text-red-500',
  'Intelecto': 'text-blue-500',
  'Presença': 'text-purple-500',
  'Vigor': 'text-orange-500',
};

const COMMON_DTS = [10, 15, 20, 25, 30];

export const SkillRollsPanel: React.FC<SkillRollsPanelProps> = ({
  skills,
  attributes,
  conditionModifier = 0,
  onRollResult,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customDT, setCustomDT] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<SkillRollResult | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const getSkillModifier = (skillKey: string, groupName: string) => {
    const group = SKILL_GROUPS[groupName];
    if (!group) return 0;
    
    const attrValue = attributes[group.attribute] || 0;
    const skillData = skills[skillKey];
    const skillBonus = skillData?.trained ? (skillData.bonus || 0) : 0;
    
    return attrValue + skillBonus + conditionModifier;
  };

  const getTrainingLevel = (skillKey: string): number => {
    const skillData = skills[skillKey];
    if (!skillData?.trained) return 0;
    if (skillData.expert) return 3;
    if (skillData.veteran) return 2;
    return 1;
  };

  const handleRoll = (skillKey: string, groupName: string) => {
    const modifier = getSkillModifier(skillKey, groupName);
    const diceResult = rollSkillTest({ attributeValue: 1, skillBonus: modifier, label: SKILL_LABELS[skillKey] });
    const roll = diceResult.keptDice;
    const total = diceResult.total;
    const isCritical = roll === 20;
    const isCriticalFail = roll === 1;
    
    let success: boolean | undefined;
    if (customDT !== null) {
      success = isCritical || (!isCriticalFail && total >= customDT);
    }

    const skillResult: SkillRollResult = {
      skillName: SKILL_LABELS[skillKey] || skillKey,
      roll,
      modifier,
      total,
      dt: customDT || undefined,
      success,
      isCritical,
      isCriticalFail,
    };

    setLastResult(skillResult);
    onRollResult(skillResult);
  };

  const filteredGroups = useMemo(() => {
    if (activeTab === 'all') {
      return Object.entries(SKILL_GROUPS).map(([groupName, group]) => ({
        groupName,
        ...group,
        skills: group.skills.filter(skill =>
          !searchQuery || SKILL_LABELS[skill]?.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(g => g.skills.length > 0);
    }
    
    const group = SKILL_GROUPS[activeTab];
    if (!group) return [];
    
    return [{
      groupName: activeTab,
      ...group,
      skills: group.skills.filter(skill =>
        !searchQuery || SKILL_LABELS[skill]?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }].filter(g => g.skills.length > 0);
  }, [activeTab, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Search and DT */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar perícia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">DT:</span>
          <div className="flex gap-1">
            {COMMON_DTS.map(dt => (
              <Button
                key={dt}
                size="sm"
                variant={customDT === dt ? "default" : "outline"}
                className="h-8 w-8 p-0 text-xs"
                onClick={() => setCustomDT(customDT === dt ? null : dt)}
              >
                {dt}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Attribute Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
          <TabsTrigger value="Agilidade" className="text-xs text-green-500">AGI</TabsTrigger>
          <TabsTrigger value="Força" className="text-xs text-red-500">FOR</TabsTrigger>
          <TabsTrigger value="Intelecto" className="text-xs text-blue-500">INT</TabsTrigger>
          <TabsTrigger value="Presença" className="text-xs text-purple-500">PRE</TabsTrigger>
          <TabsTrigger value="Vigor" className="text-xs text-orange-500">VIG</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Skills List */}
      <ScrollArea className="h-[200px]">
        <div className="space-y-4 pr-2">
          {filteredGroups.map(({ groupName, skills: groupSkills }) => (
            <div key={groupName} className="space-y-1">
              {activeTab === 'all' && (
                <h4 className={cn("text-xs font-medium uppercase tracking-wide", ATTRIBUTE_COLORS[groupName])}>
                  {groupName}
                </h4>
              )}
              <div className="grid grid-cols-2 gap-1">
                {groupSkills.map(skill => {
                  const modifier = getSkillModifier(skill, groupName);
                  const trainingLevel = getTrainingLevel(skill);
                  
                  return (
                    <Button
                      key={skill}
                      variant="ghost"
                      size="sm"
                      className="h-8 justify-between px-2 hover:bg-accent"
                      onClick={() => handleRoll(skill, groupName)}
                    >
                      <span className="flex items-center gap-1 truncate">
                        {trainingLevel > 0 && (
                          <span className="flex">
                            {Array.from({ length: trainingLevel }).map((_, i) => (
                              <Star key={i} className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                            ))}
                          </span>
                        )}
                        <span className="truncate text-xs">{SKILL_LABELS[skill]}</span>
                      </span>
                      <Badge variant="secondary" className="font-mono text-xs h-5 px-1">
                        {modifier >= 0 ? '+' : ''}{modifier}
                      </Badge>
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Last Result Display */}
      <AnimatePresence mode="wait">
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "p-4 rounded-lg border-2",
              lastResult.isCritical && "border-yellow-500 bg-yellow-500/10",
              lastResult.isCriticalFail && "border-destructive bg-destructive/10",
              lastResult.success === true && !lastResult.isCritical && "border-green-500 bg-green-500/10",
              lastResult.success === false && !lastResult.isCriticalFail && "border-destructive/50 bg-destructive/5",
              lastResult.success === undefined && !lastResult.isCritical && !lastResult.isCriticalFail && "border-border bg-card/50"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{lastResult.skillName}</span>
              <div className="flex items-center gap-2">
                {lastResult.isCritical && (
                  <Badge className="bg-yellow-500 text-yellow-950">20 Natural!</Badge>
                )}
                {lastResult.isCriticalFail && (
                  <Badge variant="destructive">Falha Crítica</Badge>
                )}
                {lastResult.success !== undefined && !lastResult.isCritical && !lastResult.isCriticalFail && (
                  <Badge variant={lastResult.success ? "default" : "destructive"} className="gap-1">
                    {lastResult.success ? (
                      <><CheckCircle2 className="h-3 w-3" /> Sucesso</>
                    ) : (
                      <><AlertCircle className="h-3 w-3" /> Falha</>
                    )}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="font-mono text-lg">
                {lastResult.roll} + {lastResult.modifier} = <strong>{lastResult.total}</strong>
              </p>
              {lastResult.dt && (
                <p className="text-sm text-muted-foreground">
                  DT {lastResult.dt}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SkillRollsPanel;

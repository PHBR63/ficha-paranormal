/**
 * ClassPowerBonusTests - Testes visuais interativos para bônus de poderes de classe
 * 
 * Permite testar em tempo real os cálculos de bônus de poderes e trilhas
 * com diferentes configurações de personagem.
 * Usa o power-effects-engine real para cálculos precisos.
 */

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FlaskConical, 
  Swords, 
  Shield, 
  Zap, 
  Target,
  User,
  Crosshair,
  Heart,
  Sparkles,
  BookOpen,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClassPowerBonuses, ClassPowerBonusConfig } from '@/hooks/useClassPowerBonuses';
import { ALL_CLASS_POWERS } from '@/lib/class-powers/power-registry';
import { ALL_TRACKS } from '@/lib/class-powers/track-registry';
import { CLASSES, getClassTracks } from '@/lib/character-data';
import type { WeaponCategory, ProtectionCategory, PowerCalculationContext } from '@/lib/class-powers/types';
import { calculatePowerBonuses } from '@/lib/class-powers/power-effects-engine';

// ========================================
// TIPOS
// ========================================

interface TestScenario {
  name: string;
  description: string;
  config: Partial<ClassPowerBonusConfig>;
  expectedBonuses: {
    attack?: number;
    damage?: number;
    defense?: number;
    initiative?: number;
    critical?: number;
  };
}

// ========================================
// CENÁRIOS DE TESTE PRÉ-DEFINIDOS
// ========================================

const TEST_SCENARIOS: TestScenario[] = [
  {
    name: 'Combatente Aniquilador NEX 50%',
    description: 'Combatente com trilha Aniquilador usando espada',
    config: {
      nex: 50,
      classId: 'combatente',
      classTrack: 'aniquilador',
      attributes: { strength: 3, agility: 2, vigor: 2, intellect: 1, presence: 1 },
      classPowers: ['ataque-especial', 'golpe-pesado'],
      equippedWeaponType: 'melee',
      inCombat: true,
    },
    expectedBonuses: {
      attack: 0,
      damage: 2, // Golpe Pesado
    },
  },
  {
    name: 'Especialista Atirador de Elite NEX 75%',
    description: 'Especialista focado em armas de fogo',
    config: {
      nex: 75,
      classId: 'especialista',
      classTrack: 'atirador-de-elite',
      attributes: { strength: 1, agility: 4, vigor: 2, intellect: 2, presence: 1 },
      classPowers: ['mira-de-elite', 'tiro-certeiro'],
      equippedWeaponType: 'firearm',
      inCombat: true,
    },
    expectedBonuses: {
      attack: 2, // Mira de Elite
    },
  },
  {
    name: 'Ocultista Conduíte NEX 65%',
    description: 'Ocultista com foco em rituais',
    config: {
      nex: 65,
      classId: 'ocultista',
      classTrack: 'conduíte',
      attributes: { strength: 1, agility: 1, vigor: 2, intellect: 3, presence: 3 },
      classPowers: [],
      inCombat: false,
    },
    expectedBonuses: {},
  },
  {
    name: 'Combatente Operações Especiais',
    description: 'Focado em combate tático',
    config: {
      nex: 40,
      classId: 'combatente',
      classTrack: 'operacoes-especiais',
      attributes: { strength: 2, agility: 3, vigor: 2, intellect: 2, presence: 1 },
      classPowers: ['ataque-especial', 'reflexos-defensivos'],
      equippedWeaponType: 'firearm',
      inCombat: true,
    },
    expectedBonuses: {
      defense: 2, // Reflexos Defensivos
    },
  },
  {
    name: 'Combatente Guerreiro NEX 65%',
    description: 'Combatente generalista com proteção pesada',
    config: {
      nex: 65,
      classId: 'combatente',
      classTrack: 'guerreiro',
      attributes: { strength: 3, agility: 1, vigor: 3, intellect: 1, presence: 2 },
      classPowers: ['golpe-pesado', 'incansavel', 'armamento-pesado'],
      equippedWeaponType: 'melee',
      equippedProtectionType: 'heavy',
      inCombat: true,
    },
    expectedBonuses: {
      damage: 3, // FOR via Golpe Pesado
    },
  },
  {
    name: 'Especialista Infiltrador NEX 40%',
    description: 'Focado em ataques furtivos',
    config: {
      nex: 40,
      classId: 'especialista',
      classTrack: 'infiltrador',
      attributes: { strength: 1, agility: 4, vigor: 1, intellect: 2, presence: 2 },
      classPowers: ['perito'],
      equippedWeaponType: 'melee',
      inCombat: true,
    },
    expectedBonuses: {},
  },
  {
    name: 'Especialista Negociador NEX 50%',
    description: 'Focado em interações sociais',
    config: {
      nex: 50,
      classId: 'especialista',
      classTrack: 'negociador',
      attributes: { strength: 1, agility: 2, vigor: 1, intellect: 2, presence: 4 },
      classPowers: ['versatilidade'],
      inCombat: false,
    },
    expectedBonuses: {},
  },
  {
    name: 'Ocultista Flagelo NEX 75%',
    description: 'Focado em combate paranormal',
    config: {
      nex: 75,
      classId: 'ocultista',
      classTrack: 'flagelo',
      attributes: { strength: 1, agility: 2, vigor: 2, intellect: 3, presence: 3 },
      classPowers: [],
      inCombat: true,
    },
    expectedBonuses: {},
  },
  {
    name: 'Ocultista Lâmina Paranormal NEX 65%',
    description: 'Híbrido combate/rituais',
    config: {
      nex: 65,
      classId: 'ocultista',
      classTrack: 'lamina-paranormal',
      attributes: { strength: 2, agility: 3, vigor: 2, intellect: 2, presence: 2 },
      classPowers: [],
      equippedWeaponType: 'melee',
      inCombat: true,
    },
    expectedBonuses: {},
  },
  {
    name: 'Combatente Artista Marcial NEX 70%',
    description: 'Combatente desarmado',
    config: {
      nex: 70,
      classId: 'combatente',
      classTrack: 'aniquilador',
      attributes: { strength: 3, agility: 3, vigor: 2, intellect: 1, presence: 1 },
      classPowers: ['artista-marcial', 'golpe-pesado'],
      equippedWeaponType: 'unarmed',
      inCombat: true,
    },
    expectedBonuses: {
      damage: 3, // FOR via Golpe Pesado em unarmed
    },
  },
  {
    name: 'Especialista Médico de Campo NEX 65%',
    description: 'Focado em suporte',
    config: {
      nex: 65,
      classId: 'especialista',
      classTrack: 'medico-de-campo',
      attributes: { strength: 1, agility: 2, vigor: 2, intellect: 3, presence: 2 },
      classPowers: ['perito'],
      inCombat: false,
    },
    expectedBonuses: {},
  },
];

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

export function ClassPowerBonusTests() {
  // Estado do configurador interativo
  const [config, setConfig] = useState<ClassPowerBonusConfig>({
    nex: 50,
    classId: 'combatente',
    classTrack: 'aniquilador',
    attributes: {
      strength: 2,
      agility: 2,
      vigor: 2,
      intellect: 2,
      presence: 2,
    },
    classPowers: [],
    equippedWeaponType: 'melee' as WeaponCategory,
    equippedProtectionType: undefined,
    inCombat: false,
    inInvestigation: false,
    isFavoriteWeapon: false,
  });

  // Poderes selecionados
  const [selectedPowers, setSelectedPowers] = useState<string[]>([]);

  // Atualiza config quando poderes mudam
  const fullConfig = useMemo(() => ({
    ...config,
    classPowers: selectedPowers,
  }), [config, selectedPowers]);

  // Calcula bônus usando o hook real
  const bonuses = useClassPowerBonuses(fullConfig);

  // Lista de poderes disponíveis para a classe
  const availablePowers = useMemo(() => {
    return ALL_CLASS_POWERS.filter(p => 
      p.classId.toLowerCase() === config.classId.toLowerCase() && 
      p.minNex <= config.nex
    );
  }, [config.classId, config.nex]);

  // Lista de trilhas disponíveis para a classe
  const availableTracks = useMemo(() => {
    return getClassTracks(config.classId);
  }, [config.classId]);

  // Resultados dos testes de cenários pré-definidos
  const [scenarioResults, setScenarioResults] = useState<Array<{
    scenario: TestScenario;
    passed: boolean;
    actualBonuses: Record<string, number>;
    mismatches?: string[];
  }> | null>(null);

  // Executa testes dos cenários usando o engine real
  const runScenarioTests = () => {
    const results = TEST_SCENARIOS.map(scenario => {
      // Monta config completa
      const testConfig: ClassPowerBonusConfig = {
        nex: scenario.config.nex || 50,
        classId: scenario.config.classId || 'combatente',
        classTrack: scenario.config.classTrack,
        attributes: scenario.config.attributes || {
          strength: 2,
          agility: 2,
          vigor: 2,
          intellect: 2,
          presence: 2,
        },
        classPowers: scenario.config.classPowers || [],
        equippedWeaponType: scenario.config.equippedWeaponType,
        equippedProtectionType: scenario.config.equippedProtectionType,
        inCombat: scenario.config.inCombat || false,
        inInvestigation: scenario.config.inInvestigation || false,
        isFavoriteWeapon: scenario.config.isFavoriteWeapon || false,
      };

      // Monta contexto para o power-effects-engine
      const attrs = testConfig.attributes;
      const powerContext: PowerCalculationContext = {
        nex: testConfig.nex,
        attributes: {
          strength: attrs.strength ?? 1,
          agility: attrs.agility ?? 1,
          vigor: attrs.vigor ?? 1,
          intellect: attrs.intellect ?? 1,
          presence: attrs.presence ?? 1,
        },
        equippedWeaponType: testConfig.equippedWeaponType,
        equippedProtectionType: testConfig.equippedProtectionType,
        inCombat: testConfig.inCombat,
        inInvestigation: testConfig.inInvestigation,
      };

      // Calcula bônus usando o engine REAL
      const powerBonuses = calculatePowerBonuses(testConfig.classPowers || [], powerContext);
      
      // Extrai bônus totais
      const actualBonuses = {
        attack: powerBonuses.attack.general + powerBonuses.attack.melee + powerBonuses.attack.ranged + powerBonuses.attack.firearm,
        damage: powerBonuses.damage.general + powerBonuses.damage.melee + powerBonuses.damage.ranged + powerBonuses.damage.firearm,
        defense: powerBonuses.defense.base + powerBonuses.defense.conditional,
        initiative: 0, // Iniciativa não está no PowerBonusSummary atual
        critical: 0, // Crítico não está no PowerBonusSummary atual
      };

      // Verifica se expectativas batem
      let passed = true;
      const mismatches: string[] = [];
      
      for (const [key, expected] of Object.entries(scenario.expectedBonuses)) {
        const actual = actualBonuses[key as keyof typeof actualBonuses];
        if (actual !== expected) {
          passed = false;
          mismatches.push(`${key}: esperado ${expected}, obtido ${actual}`);
        }
      }

      return {
        scenario,
        passed,
        actualBonuses,
        mismatches,
      };
    });

    setScenarioResults(results);
  };

  // Toggle poder selecionado
  const togglePower = (powerId: string) => {
    setSelectedPowers(prev => 
      prev.includes(powerId) 
        ? prev.filter(p => p !== powerId)
        : [...prev, powerId]
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              Testes de Bônus de Poderes de Classe
            </CardTitle>
            <CardDescription>
              Teste interativo dos cálculos de bônus em tempo real
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="interactive" className="space-y-4">
          <TabsList>
            <TabsTrigger value="interactive">Configurador Interativo</TabsTrigger>
            <TabsTrigger value="scenarios">Cenários Pré-definidos</TabsTrigger>
          </TabsList>

          {/* Aba de Configurador Interativo */}
          <TabsContent value="interactive" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Painel de Configuração */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Configuração do Personagem
                </h3>

                {/* Classe e Trilha */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Classe</Label>
                    <Select
                      value={config.classId}
                      onValueChange={(value) => {
                        setConfig(prev => ({ 
                          ...prev, 
                          classId: value,
                          classTrack: undefined,
                        }));
                        setSelectedPowers([]);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASSES.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Trilha</Label>
                    <Select
                      value={config.classTrack || ''}
                      onValueChange={(value) => setConfig(prev => ({ ...prev, classTrack: value || undefined }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTracks.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* NEX */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>NEX</Label>
                    <span className="text-sm font-mono">{config.nex}%</span>
                  </div>
                  <Slider
                    value={[config.nex]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, nex: value }))}
                    min={5}
                    max={99}
                    step={5}
                  />
                </div>

                {/* Atributos */}
                <div className="space-y-2">
                  <Label>Atributos</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {(['strength', 'agility', 'vigor', 'intellect', 'presence'] as const).map(attr => (
                      <div key={attr} className="text-center">
                        <Label className="text-[10px] uppercase">{attr.slice(0, 3)}</Label>
                        <Input
                          type="number"
                          min={0}
                          max={5}
                          value={config.attributes[attr] || 1}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            attributes: {
                              ...prev.attributes,
                              [attr]: parseInt(e.target.value) || 1,
                            },
                          }))}
                          className="text-center"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tipo de Arma */}
                <div className="space-y-2">
                  <Label>Tipo de Arma Equipada</Label>
                  <Select
                    value={config.equippedWeaponType || ''}
                    onValueChange={(value) => setConfig(prev => ({ 
                      ...prev, 
                      equippedWeaponType: value as WeaponCategory || undefined 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhuma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="melee">Corpo-a-corpo</SelectItem>
                      <SelectItem value="ranged">Distância</SelectItem>
                      <SelectItem value="firearm">Arma de Fogo</SelectItem>
                      <SelectItem value="tactical">Tática</SelectItem>
                      <SelectItem value="heavy">Pesada</SelectItem>
                      <SelectItem value="unarmed">Desarmado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Flags */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={config.inCombat}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, inCombat: checked }))}
                    />
                    <Label>Em Combate</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={config.isFavoriteWeapon}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isFavoriteWeapon: checked }))}
                    />
                    <Label>Arma Favorita</Label>
                  </div>
                </div>

                {/* Poderes Disponíveis */}
                <div className="space-y-2">
                  <Label>Poderes de Classe ({selectedPowers.length} selecionados)</Label>
                  <ScrollArea className="h-32 border rounded-md p-2">
                    <div className="space-y-1">
                      {availablePowers.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nenhum poder disponível para esta classe/NEX</p>
                      ) : (
                        availablePowers.map(power => (
                          <div 
                            key={power.id}
                            className={cn(
                              "flex items-center gap-2 p-1.5 rounded cursor-pointer text-sm",
                              selectedPowers.includes(power.id) 
                                ? "bg-primary/20 text-primary" 
                                : "hover:bg-muted/50"
                            )}
                            onClick={() => togglePower(power.id)}
                          >
                            <div className={cn(
                              "w-4 h-4 rounded border flex items-center justify-center",
                              selectedPowers.includes(power.id) ? "bg-primary border-primary" : "border-muted-foreground"
                            )}>
                              {selectedPowers.includes(power.id) && (
                                <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                              )}
                            </div>
                            <span>{power.name}</span>
                            <Badge variant="outline" className="text-[10px] ml-auto">
                              NEX {power.minNex}%
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* Painel de Resultados */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Bônus Calculados (Tempo Real)
                </h3>

                {/* Grid de Bônus */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Ataque */}
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Crosshair className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium">ATAQUE</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {bonuses.totals.attack.general > 0 ? '+' : ''}{bonuses.totals.attack.general}
                    </div>
                    {(bonuses.totals.attack.melee !== 0 || bonuses.totals.attack.ranged !== 0) && (
                      <div className="text-[10px] text-muted-foreground mt-1">
                        CAC: +{bonuses.totals.attack.melee} | Dist: +{bonuses.totals.attack.ranged}
                      </div>
                    )}
                  </div>

                  {/* Dano */}
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Swords className="h-4 w-4 text-destructive" />
                      <span className="text-xs font-medium">DANO</span>
                    </div>
                    <div className="text-2xl font-bold text-destructive">
                      {bonuses.totals.damage.general > 0 ? '+' : ''}{bonuses.totals.damage.general}
                    </div>
                    {bonuses.extraDamageDice.length > 0 && (
                      <div className="text-[10px] text-muted-foreground mt-1">
                        Dados: {bonuses.extraDamageDice.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Defesa */}
                  <div className="p-3 rounded-lg bg-energy/10 border border-energy/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-energy" />
                      <span className="text-xs font-medium">DEFESA</span>
                    </div>
                    <div className="text-2xl font-bold text-energy">
                      {bonuses.totals.defense > 0 ? '+' : ''}{bonuses.totals.defense}
                    </div>
                  </div>

                  {/* Iniciativa */}
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="text-xs font-medium">INICIATIVA</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-500">
                      {bonuses.totals.initiative > 0 ? '+' : ''}{bonuses.totals.initiative}
                    </div>
                  </div>

                  {/* Crítico */}
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-medium">MARGEM CRÍTICO</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-500">
                      {bonuses.totals.criticalMargin > 0 ? '+' : ''}{bonuses.totals.criticalMargin}
                    </div>
                  </div>

                  {/* Resistência */}
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="text-xs font-medium">RD / PV BÔNUS</span>
                    </div>
                    <div className="text-2xl font-bold text-red-500">
                      {bonuses.totals.damageResistance}/{bonuses.totals.bonusHP}
                    </div>
                  </div>
                </div>

                {/* Habilidades Especiais */}
                {(bonuses.specialFlags.length > 0 || bonuses.canUseHPAsPE || bonuses.canUseOccultismAsAttack) && (
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      <span className="text-xs font-medium">HABILIDADES ESPECIAIS</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {bonuses.specialFlags.map((flag, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">
                          {flag}
                        </Badge>
                      ))}
                      {bonuses.canUseHPAsPE && (
                        <Badge variant="secondary" className="text-[10px] bg-purple-500/20">
                          Usar PV como PE
                        </Badge>
                      )}
                      {bonuses.canUseOccultismAsAttack && (
                        <Badge variant="secondary" className="text-[10px] bg-purple-500/20">
                          Ocultismo p/ Ataque
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Perícias */}
                {Object.keys(bonuses.skillBonuses).length > 0 && (
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-medium">PERÍCIAS</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {Object.entries(bonuses.skillBonuses).map(([skill, bonus]) => (
                        <div key={skill} className="flex justify-between">
                          <span>{skill}</span>
                          <span className="font-mono text-blue-500">+{bonus}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Aba de Cenários Pré-definidos */}
          <TabsContent value="scenarios" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={runScenarioTests}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Executar Cenários
              </Button>
            </div>

            {scenarioResults ? (
              <div className="space-y-3">
                {/* Resumo de resultados */}
                <div className="flex gap-4 mb-4">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {scenarioResults.filter(r => r.passed).length} passaram
                  </Badge>
                  <Badge variant="secondary" className={cn(
                    scenarioResults.filter(r => !r.passed).length > 0 
                      ? "bg-red-500/20 text-red-400" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    <XCircle className="h-3 w-3 mr-1" />
                    {scenarioResults.filter(r => !r.passed).length} falharam
                  </Badge>
                </div>
                
                {scenarioResults.map((result, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "p-4 rounded-lg border",
                      result.passed ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {result.passed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-semibold">{result.scenario.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-7">
                      {result.scenario.description}
                    </p>
                    <div className="ml-7 mt-2 flex flex-wrap gap-2">
                      {Object.entries(result.scenario.expectedBonuses).map(([key, expected]) => {
                        const actual = result.actualBonuses[key as keyof typeof result.actualBonuses];
                        const match = actual === expected;
                        return (
                          <Badge 
                            key={key} 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              match ? "border-green-500/50 text-green-400" : "border-red-500/50 text-red-400"
                            )}
                          >
                            {key}: esperado {expected}, obtido {actual}
                            {match ? ' ✓' : ' ✗'}
                          </Badge>
                        );
                      })}
                    </div>
                    {result.mismatches && result.mismatches.length > 0 && (
                      <div className="ml-7 mt-2 text-xs text-red-400">
                        Divergências: {result.mismatches.join('; ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Clique em "Executar Cenários" para testar configurações pré-definidas</p>
                <p className="text-sm mt-1">
                  {TEST_SCENARIOS.length} cenários disponíveis
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

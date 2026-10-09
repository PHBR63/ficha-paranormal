/**
 * MasterSheetViewer - Visualizador de fichas para o Mestre
 * 
 * Permite ao mestre ver fichas completas ou resumo de todos os personagens,
 * com ações rápidas para ajustar PV/PE/SAN e aplicar condições.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMasterActions } from '@/hooks/campaign/useMasterActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area'; // Mantido apenas para popovers com conteúdo estático
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  Eye,
  Users,
  Heart,
  Zap,
  Brain,
  Shield,
  Crosshair,
  Skull,
  Plus,
  Minus,
  X,
  RefreshCw,
  AlertTriangle,
  Loader2,
  ChevronDown,
  Sparkles,
} from '@/components/icons/ordem-icons';

// Condições oficiais do sistema
const OFFICIAL_CONDITIONS = [
  'Abalado',
  'Agarrado',
  'Alquebrado',
  'Apavorado',
  'Atordoado',
  'Caído',
  'Cego',
  'Confuso',
  'Debilitado',
  'Desprevenido',
  'Doente',
  'Enjoado',
  'Enredado',
  'Envenenado',
  'Exausto',
  'Fascinado',
  'Fatigado',
  'Fraco',
  'Frustrado',
  'Imóvel',
  'Inconsciente',
  'Indefeso',
  'Lento',
  'Morrendo',
  'Ofuscado',
  'Paralisado',
  'Pasmo',
  'Perturbado',
  'Petrificado',
  'Sangrando',
  'Surdo',
  'Surpreso',
  'Vulnerável',
];

// Ícones de classe
const CLASS_ICONS: Record<string, typeof Shield> = {
  'Combatente': Shield,
  'Especialista': Crosshair,
  'Ocultista': Skull,
};

// Interface para membro com personagem (aceita dados parciais da listagem)
interface MemberWithCharacter {
  id: string;
  user_id: string;
  character_id: string | null;
  role: string;
  profiles?: {
    display_name: string | null;
  };
  characters?: {
    id: string;
    name: string;
    class: string;
    nex: number;
    hp_current: number;
    hp_max: number;
    pe_current: number;
    pe_max: number;
    san_current: number;
    san_max: number;
    photo_url: string | null;
    conditions: string[];
  } | null;
}

// Interface para dados completos do personagem (carregado sob demanda)
interface CharacterData {
  id: string;
  name: string;
  class: string;
  class_track: string | null;
  nex: number;
  patent: string;
  origin: string;
  hp_current: number;
  hp_max: number;
  pe_current: number;
  pe_max: number;
  san_current: number;
  san_max: number;
  defense: number;
  movement: number;
  strength: number;
  agility: number;
  vigor: number;
  intellect: number;
  presence: number;
  conditions: string[];
  photo_url: string | null;
  skills?: Record<string, number>;
  rituals?: any[];
  powers?: any;
  general_powers?: any[];
  paranormal_powers?: any[];
  inventory?: any;
}

interface MasterSheetViewerProps {
  campaignId: string;
  members: MemberWithCharacter[];
  onMemberUpdate?: () => void;
}

export function MasterSheetViewer({
  campaignId,
  members,
  onMemberUpdate,
}: MasterSheetViewerProps) {
  const { toast } = useToast();
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterData | null>(null);
  const [loadingCharacter, setLoadingCharacter] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'single'>('all');
  
  // Ações do mestre
  const masterActions = useMasterActions({
    campaignId,
    isMaster: true,
    onUpdate: onMemberUpdate,
  });

  // Membros com personagens
  const membersWithCharacters = members.filter(m => m.characters && m.role !== 'master');

  // Carrega ficha completa quando seleciona um personagem
  useEffect(() => {
    if (selectedCharacterId && viewMode === 'single') {
      loadFullCharacter(selectedCharacterId);
    }
  }, [selectedCharacterId, viewMode]);

  const loadFullCharacter = async (characterId: string) => {
    setLoadingCharacter(true);
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .single();
      
      if (error) throw error;
      
      // Normaliza condições
      const charData = {
        ...data,
        conditions: Array.isArray(data.conditions) ? data.conditions : [],
      } as CharacterData;
      
      setSelectedCharacter(charData);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar ficha',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingCharacter(false);
    }
  };

  // Handler para seleção de personagem
  const handleSelectCharacter = (characterId: string) => {
    if (characterId === 'all') {
      setViewMode('all');
      setSelectedCharacterId(null);
      setSelectedCharacter(null);
    } else {
      setViewMode('single');
      setSelectedCharacterId(characterId);
    }
  };

  // Renderiza barra de status
  const StatusBar = ({ 
    label, 
    current, 
    max, 
    color, 
    icon: Icon,
    characterId,
    type,
  }: { 
    label: string;
    current: number;
    max: number;
    color: string;
    icon: typeof Heart;
    characterId: string;
    type: 'hp' | 'pe' | 'san';
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(current.toString());
    const percent = Math.round((current / max) * 100);
    
    const handleAdjust = async (delta: number) => {
      if (type === 'hp') await masterActions.adjustHP(characterId, delta);
      else if (type === 'pe') await masterActions.adjustPE(characterId, delta);
      else await masterActions.adjustSAN(characterId, delta);
    };
    
    const handleSet = async () => {
      const value = parseInt(inputValue);
      if (isNaN(value)) return;
      
      if (type === 'hp') await masterActions.setHP(characterId, value);
      else if (type === 'pe') await masterActions.setPE(characterId, value);
      else await masterActions.setSAN(characterId, value);
      
      setIsEditing(false);
    };
    
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Icon className={cn('w-3.5 h-3.5', color)} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-5 h-5"
              onClick={() => handleAdjust(-1)}
              disabled={masterActions.isUpdating}
            >
              <Minus className="w-3 h-3" />
            </Button>
            
            {isEditing ? (
              <Input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={handleSet}
                onKeyDown={(e) => e.key === 'Enter' && handleSet()}
                className="w-12 h-5 text-xs text-center p-0"
                autoFocus
              />
            ) : (
              <button
                onClick={() => {
                  setInputValue(current.toString());
                  setIsEditing(true);
                }}
                className="text-xs font-medium hover:underline"
              >
                {current}/{max}
              </button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="w-5 h-5"
              onClick={() => handleAdjust(1)}
              disabled={masterActions.isUpdating}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', color.replace('text-', 'bg-'))}
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    );
  };

  // Renderiza card de personagem (modo resumo)
  const CharacterSummaryCard = ({ member }: { member: MemberWithCharacter }) => {
    const char = member.characters!;
    const ClassIcon = CLASS_ICONS[char.class] || Shield;
    const conditions = Array.isArray(char.conditions) ? char.conditions : [];
    const hpPercent = (char.hp_current / char.hp_max) * 100;
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'ordo-panel p-4 transition-all cursor-pointer hover:border-primary/50',
          hpPercent <= 25 && 'border-destructive/50 bg-destructive/5',
          masterActions.isUpdating && 'opacity-70 pointer-events-none'
        )}
        onClick={() => handleSelectCharacter(char.id)}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar/Icon */}
          <div className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
            hpPercent > 50 ? 'bg-muted' : hpPercent > 25 ? 'bg-warning/20' : 'bg-destructive/20'
          )}>
            {char.photo_url ? (
              <img 
                src={char.photo_url} 
                alt={char.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <ClassIcon className={cn(
                'w-6 h-6',
                hpPercent > 50 ? 'text-muted-foreground' : hpPercent > 25 ? 'text-warning' : 'text-destructive'
              )} />
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-display text-sm tracking-wider truncate">{char.name}</h4>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                NEX {char.nex}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {char.class} • {member.profiles?.display_name || 'Jogador'}
            </p>
          </div>
          
          {/* Status crítico */}
          {hpPercent <= 25 && (
            <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />
          )}
        </div>
        
        {/* Status Bars */}
        <div className="space-y-2">
          <StatusBar
            label="PV"
            current={char.hp_current}
            max={char.hp_max}
            color="text-health"
            icon={Heart}
            characterId={char.id}
            type="hp"
          />
          <StatusBar
            label="PE"
            current={char.pe_current}
            max={char.pe_max}
            color="text-energy"
            icon={Zap}
            characterId={char.id}
            type="pe"
          />
          <StatusBar
            label="SAN"
            current={char.san_current}
            max={char.san_max}
            color="text-sanity"
            icon={Brain}
            characterId={char.id}
            type="san"
          />
        </div>
        
        {/* Condições */}
        <div className="mt-3 flex flex-wrap gap-1">
          {conditions.map((cond) => (
            <Badge
              key={cond}
              variant="secondary"
              className="text-[10px] px-1.5 py-0 gap-1 cursor-pointer hover:bg-destructive/20"
              onClick={(e) => {
                e.stopPropagation();
                masterActions.removeCondition(char.id, cond);
              }}
            >
              {cond}
              <X className="w-2.5 h-2.5" />
            </Badge>
          ))}
          
          {/* Adicionar condição */}
          <Popover>
            <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 cursor-pointer hover:bg-primary/20"
              >
                <Plus className="w-2.5 h-2.5" />
              </Badge>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" onClick={(e) => e.stopPropagation()}>
              <ScrollArea className="h-48">
                <div className="space-y-1">
                  {OFFICIAL_CONDITIONS.filter(c => !conditions.includes(c)).map((cond) => (
                    <button
                      key={cond}
                      className="w-full text-left text-xs px-2 py-1 rounded hover:bg-muted transition-colors"
                      onClick={() => masterActions.applyCondition(char.id, cond)}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </motion.div>
    );
  };

  // Renderiza ficha completa (modo single)
  const FullCharacterSheet = () => {
    if (!selectedCharacter) return null;
    
    const char = selectedCharacter;
    const ClassIcon = CLASS_ICONS[char.class] || Shield;
    const conditions = char.conditions || [];
    
    return (
      <div className="space-y-6">
        {/* Header com ações rápidas */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
            {char.photo_url ? (
              <img src={char.photo_url} alt={char.name} className="w-full h-full object-cover" />
            ) : (
              <ClassIcon className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1">
            <h2 className="font-display text-xl tracking-wider">{char.name}</h2>
            <p className="text-sm text-muted-foreground">
              {char.class} • {char.class_track || 'Sem trilha'} • NEX {char.nex}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {char.patent} • Origem: {char.origin}
            </p>
          </div>
          
          {/* Refresh */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => loadFullCharacter(char.id)}
            disabled={loadingCharacter}
          >
            <RefreshCw className={cn('w-4 h-4', loadingCharacter && 'animate-spin')} />
          </Button>
        </div>
        
        {/* Status */}
        <div className="grid grid-cols-3 gap-4">
          <div className="ordo-panel p-4">
            <StatusBar
              label="PONTOS DE VIDA"
              current={char.hp_current}
              max={char.hp_max}
              color="text-health"
              icon={Heart}
              characterId={char.id}
              type="hp"
            />
          </div>
          <div className="ordo-panel p-4">
            <StatusBar
              label="PONTOS DE ESFORÇO"
              current={char.pe_current}
              max={char.pe_max}
              color="text-energy"
              icon={Zap}
              characterId={char.id}
              type="pe"
            />
          </div>
          <div className="ordo-panel p-4">
            <StatusBar
              label="SANIDADE"
              current={char.san_current}
              max={char.san_max}
              color="text-sanity"
              icon={Brain}
              characterId={char.id}
              type="san"
            />
          </div>
        </div>
        
        {/* Atributos & Stats */}
        <div className="grid grid-cols-2 gap-4">
          {/* Atributos */}
          <div className="ordo-panel p-4">
            <h3 className="font-display text-sm tracking-wider text-primary mb-3">ATRIBUTOS</h3>
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { name: 'FOR', value: char.strength },
                { name: 'AGI', value: char.agility },
                { name: 'VIG', value: char.vigor },
                { name: 'INT', value: char.intellect },
                { name: 'PRE', value: char.presence },
              ].map((attr) => (
                <div key={attr.name} className="p-2 bg-muted/50 rounded">
                  <div className="text-[10px] text-muted-foreground">{attr.name}</div>
                  <div className="font-display text-lg">{attr.value}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Stats de combate */}
          <div className="ordo-panel p-4">
            <h3 className="font-display text-sm tracking-wider text-primary mb-3">COMBATE</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Defesa: <strong>{char.defense}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Deslocamento: <strong>{char.movement}m</strong></span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Condições */}
        <div className="ordo-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm tracking-wider text-primary">CONDIÇÕES</h3>
            {conditions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-destructive hover:text-destructive"
                onClick={() => masterActions.clearAllConditions(char.id)}
              >
                Limpar todas
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {conditions.map((cond) => (
              <Badge
                key={cond}
                variant="secondary"
                className="gap-1.5 cursor-pointer hover:bg-destructive/20"
                onClick={() => masterActions.removeCondition(char.id, cond)}
              >
                {cond}
                <X className="w-3 h-3" />
              </Badge>
            ))}
            
            {conditions.length === 0 && (
              <p className="text-sm text-muted-foreground italic">Nenhuma condição ativa</p>
            )}
            
            {/* Adicionar condição */}
            <Popover>
              <PopoverTrigger asChild>
                <Badge variant="outline" className="cursor-pointer hover:bg-primary/20">
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar
                </Badge>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2">
                <ScrollArea className="h-60">
                  <div className="space-y-1">
                    {OFFICIAL_CONDITIONS.filter(c => !conditions.includes(c)).map((cond) => (
                      <button
                        key={cond}
                        className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted transition-colors"
                        onClick={() => masterActions.applyCondition(char.id, cond)}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Tabs para detalhes adicionais */}
        <Tabs defaultValue="skills" className="ordo-panel p-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="skills" className="text-xs">Perícias</TabsTrigger>
            <TabsTrigger value="powers" className="text-xs">Poderes</TabsTrigger>
            <TabsTrigger value="rituals" className="text-xs">Rituais</TabsTrigger>
            <TabsTrigger value="inventory" className="text-xs">Inventário</TabsTrigger>
          </TabsList>
          
          <TabsContent value="skills" className="mt-4">
            {char.skills && Object.keys(char.skills).length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(char.skills as Record<string, number>)
                  .filter(([, value]) => value > 0)
                  .sort((a, b) => b[1] - a[1])
                  .map(([skill, value]) => (
                    <div key={skill} className="flex items-center justify-between px-2 py-1 bg-muted/30 rounded text-sm">
                      <span className="truncate">{skill}</span>
                      <Badge variant="secondary" className="text-xs">{value}</Badge>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic text-center py-4">
                Sem perícias treinadas
              </p>
            )}
          </TabsContent>
          
          <TabsContent value="powers" className="mt-4">
            <div className="space-y-4">
              {/* Poderes de Classe */}
              {char.powers && Object.keys(char.powers).length > 0 && (
                <div>
                  <h4 className="text-xs text-muted-foreground mb-2">Poderes de Classe</h4>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(char.powers as Record<string, any>).map((power) => (
                      <Badge key={power} variant="outline" className="text-xs">{power}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Poderes Gerais */}
              {char.general_powers && (char.general_powers as any[]).length > 0 && (
                <div>
                  <h4 className="text-xs text-muted-foreground mb-2">Poderes Gerais</h4>
                  <div className="flex flex-wrap gap-1">
                    {(char.general_powers as any[]).map((power, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {typeof power === 'string' ? power : power.name || power.id}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Poderes Paranormais */}
              {char.paranormal_powers && (char.paranormal_powers as any[]).length > 0 && (
                <div>
                  <h4 className="text-xs text-muted-foreground mb-2">Poderes Paranormais</h4>
                  <div className="flex flex-wrap gap-1">
                    {(char.paranormal_powers as any[]).map((power, i) => (
                      <Badge key={i} className="text-xs bg-primary/20">
                        {typeof power === 'string' ? power : power.name || power.id}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="rituals" className="mt-4">
            {char.rituals && (char.rituals as any[]).length > 0 ? (
              <div className="space-y-2">
                {(char.rituals as any[]).map((ritual, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-muted/30 rounded">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm">
                      {typeof ritual === 'string' ? ritual : ritual.name || ritual.id}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic text-center py-4">
                Sem rituais conhecidos
              </p>
            )}
          </TabsContent>
          
          <TabsContent value="inventory" className="mt-4">
            {char.inventory ? (
              <div className="space-y-3">
                {/* Armas */}
                {(char.inventory as any).weapons?.length > 0 && (
                  <div>
                    <h4 className="text-xs text-muted-foreground mb-2">Armas</h4>
                    <div className="space-y-1">
                      {(char.inventory as any).weapons.map((weapon: any, i: number) => (
                        <div key={i} className="flex items-center justify-between px-2 py-1 bg-muted/30 rounded text-sm">
                          <span>{weapon.name}</span>
                          <span className="text-xs text-muted-foreground">{weapon.damage}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Proteções */}
                {(char.inventory as any).armor && (
                  <div>
                    <h4 className="text-xs text-muted-foreground mb-2">Proteções</h4>
                    <div className="px-2 py-1 bg-muted/30 rounded text-sm">
                      {(char.inventory as any).armor.name}
                    </div>
                  </div>
                )}
                
                {/* Itens */}
                {(char.inventory as any).items?.length > 0 && (
                  <div>
                    <h4 className="text-xs text-muted-foreground mb-2">Itens</h4>
                    <div className="flex flex-wrap gap-1">
                      {(char.inventory as any).items.map((item: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {typeof item === 'string' ? item : item.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic text-center py-4">
                Inventário vazio
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // Se não houver personagens
  if (membersWithCharacters.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="font-display text-lg tracking-wider text-muted-foreground mb-2">
          NENHUM AGENTE
        </h3>
        <p className="text-sm text-muted-foreground/70">
          Os jogadores precisam vincular personagens à campanha.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com seletor */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg tracking-wider text-primary">
            VISÃO DO MESTRE
          </h2>
        </div>
        
        {/* Seletor de personagem */}
        <Select
          value={viewMode === 'all' ? 'all' : selectedCharacterId || 'all'}
          onValueChange={handleSelectCharacter}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecionar..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Todos os agentes
              </div>
            </SelectItem>
            {membersWithCharacters.map((member) => (
              <SelectItem key={member.characters!.id} value={member.characters!.id}>
                {member.characters!.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Conteúdo */}
      <AnimatePresence mode="wait">
        {loadingCharacter ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-12"
          >
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </motion.div>
        ) : viewMode === 'all' ? (
          <motion.div
            key="all"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {membersWithCharacters.map((member) => (
              <CharacterSummaryCard key={member.id} member={member} />
            ))}
          </motion.div>
        ) : selectedCharacter ? (
          <motion.div
            key="single"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <FullCharacterSheet />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

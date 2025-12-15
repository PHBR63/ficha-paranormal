// Step 2: Configurações da campanha
// Modo de jogo, tema e regras da casa

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Scroll, 
  Sparkles, 
  Skull, 
  Moon,
  Search,
  BookOpen,
  Dice6,
  FileText,
  Plus,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CampaignFormData } from '@/pages/CampaignCreate';

interface StepCampaignSettingsProps {
  formData: CampaignFormData;
  updateFormData: (updates: Partial<CampaignFormData>) => void;
}

// Modos de jogo disponíveis
const GAME_MODES = [
  { 
    id: 'campaign', 
    label: 'Campanha', 
    description: 'História longa com múltiplas sessões e evolução de personagens',
    icon: Scroll 
  },
  { 
    id: 'oneshot', 
    label: 'One-Shot', 
    description: 'Aventura completa em uma única sessão',
    icon: Sparkles 
  },
  { 
    id: 'sandbox', 
    label: 'Sandbox', 
    description: 'Mundo aberto onde os jogadores decidem o rumo da história',
    icon: BookOpen 
  },
] as const;

// Temas visuais
const THEMES = [
  { 
    id: 'paranormal', 
    label: 'Paranormal', 
    description: 'Horror sobrenatural e entidades do Outro Lado',
    icon: Sparkles,
    color: 'text-primary'
  },
  { 
    id: 'cosmic', 
    label: 'Horror Cósmico', 
    description: 'Horrores incompreensíveis e loucura lovecraftiana',
    icon: Moon,
    color: 'text-blue-400'
  },
  { 
    id: 'dark', 
    label: 'Dark Fantasy', 
    description: 'Fantasia sombria com magia e monstros',
    icon: Skull,
    color: 'text-red-400'
  },
  { 
    id: 'mystery', 
    label: 'Mistério', 
    description: 'Investigação e suspense psicológico',
    icon: Search,
    color: 'text-amber-400'
  },
] as const;

// Regras da casa pré-definidas
const PRESET_RULES = [
  'Morte heroica: ao morrer, o personagem pode realizar uma última ação dramática',
  'Ponto de luz: uma vez por sessão, cada jogador pode rerrolar um teste',
  'Sanidade coletiva: o grupo compartilha um pool de SAN extra',
  'Crítico narrativo: em acerto crítico, o jogador pode descrever o resultado',
  'Descanso estendido: descanso longo recupera 100% de PV e PE',
];

export function StepCampaignSettings({ formData, updateFormData }: StepCampaignSettingsProps) {
  const [newRule, setNewRule] = useState('');
  
  // Adiciona uma regra da casa
  const addHouseRule = (rule: string) => {
    if (rule.trim() && !formData.houseRules.includes(rule.trim())) {
      updateFormData({ houseRules: [...formData.houseRules, rule.trim()] });
    }
    setNewRule('');
  };
  
  // Remove uma regra
  const removeHouseRule = (rule: string) => {
    updateFormData({ houseRules: formData.houseRules.filter(r => r !== rule) });
  };

  return (
    <div className="space-y-8">
      {/* Título do step */}
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl tracking-wider mb-2">CONFIGURAÇÕES</h2>
        <p className="text-muted-foreground">
          Defina como sua campanha vai funcionar.
        </p>
      </div>
      
      {/* Modo de jogo */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Modo de Jogo</Label>
        <div className="grid gap-3">
          {GAME_MODES.map(mode => {
            const Icon = mode.icon;
            const isSelected = formData.mode === mode.id;
            
            return (
              <div
                key={mode.id}
                className={cn(
                  'ordo-panel p-4 cursor-pointer transition-all duration-200',
                  isSelected 
                    ? 'border-primary bg-primary/10' 
                    : 'hover:border-primary/50'
                )}
                onClick={() => updateFormData({ mode: mode.id as CampaignFormData['mode'] })}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{mode.label}</p>
                    <p className="text-sm text-muted-foreground">{mode.description}</p>
                  </div>
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 transition-colors',
                    isSelected 
                      ? 'border-primary bg-primary' 
                      : 'border-muted-foreground'
                  )}>
                    {isSelected && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Tema */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Tema da Campanha</Label>
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map(theme => {
            const Icon = theme.icon;
            const isSelected = formData.theme === theme.id;
            
            return (
              <div
                key={theme.id}
                className={cn(
                  'ordo-panel p-4 cursor-pointer transition-all duration-200',
                  isSelected 
                    ? 'border-primary bg-primary/10' 
                    : 'hover:border-primary/50'
                )}
                onClick={() => updateFormData({ theme: theme.id as CampaignFormData['theme'] })}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={cn('w-5 h-5', theme.color)} />
                  <p className="font-medium">{theme.label}</p>
                </div>
                <p className="text-xs text-muted-foreground">{theme.description}</p>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Opções de jogo */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Opções de Jogo</Label>
        
        <div className="ordo-panel p-4 space-y-4">
          {/* Notas de jogadores */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Notas de Jogadores</p>
                <p className="text-sm text-muted-foreground">
                  Jogadores podem criar notas visíveis para todos
                </p>
              </div>
            </div>
            <Switch
              checked={formData.allowPlayerNotes}
              onCheckedChange={(checked) => updateFormData({ allowPlayerNotes: checked })}
            />
          </div>
          
          <div className="h-px bg-border" />
          
          {/* Dados compartilhados */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Dice6 className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Dados Compartilhados</p>
                <p className="text-sm text-muted-foreground">
                  Rolagens de dados são visíveis para toda a mesa
                </p>
              </div>
            </div>
            <Switch
              checked={formData.sharedDiceRolls}
              onCheckedChange={(checked) => updateFormData({ sharedDiceRolls: checked })}
            />
          </div>
        </div>
      </div>
      
      {/* Regras da casa */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Regras da Casa (opcional)</Label>
        
        {/* Regras selecionadas */}
        {formData.houseRules.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.houseRules.map((rule, index) => (
              <Badge 
                key={index} 
                variant="secondary"
                className="py-1 px-3 flex items-center gap-2"
              >
                <span className="max-w-[200px] truncate">{rule}</span>
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-destructive" 
                  onClick={() => removeHouseRule(rule)}
                />
              </Badge>
            ))}
          </div>
        )}
        
        {/* Input para nova regra */}
        <div className="flex gap-2">
          <Input
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            placeholder="Adicione uma regra da casa..."
            onKeyDown={(e) => e.key === 'Enter' && addHouseRule(newRule)}
          />
          <Button 
            variant="secondary" 
            size="icon"
            onClick={() => addHouseRule(newRule)}
            disabled={!newRule.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Sugestões */}
        <div className="ordo-panel p-4 bg-muted/20">
          <p className="text-xs font-medium text-muted-foreground mb-2">SUGESTÕES:</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_RULES.filter(r => !formData.houseRules.includes(r)).slice(0, 3).map((rule, index) => (
              <Badge 
                key={index} 
                variant="outline"
                className="cursor-pointer hover:bg-primary/10 hover:border-primary/50"
                onClick={() => addHouseRule(rule)}
              >
                <Plus className="w-3 h-3 mr-1" />
                <span className="max-w-[150px] truncate">{rule}</span>
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * NPCManager - Gerenciador de NPCs da campanha
 * 
 * Permite ao mestre criar, editar e organizar NPCs e criaturas.
 * Integra com o sistema de combate.
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// ScrollArea removido - usando overflow nativo para evitar bug #185 com React 19
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Users,
  Skull,
  User,
  Ghost,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Swords,
  Shield,
  Heart,
  Zap,
  Eye,
  EyeOff,
  Loader2,
  Save,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NPCCard } from './NPCCard';

// Tipos de NPC
type NPCCategory = 'ally' | 'enemy' | 'neutral' | 'creature';

// Interface do NPC
export interface CampaignNPC {
  id: string;
  campaign_id: string;
  name: string;
  description: string | null;
  category: NPCCategory;
  hp_max: number;
  hp_current: number;
  pe_max: number;
  pe_current: number;
  defense: number;
  movement: number;
  attributes: {
    agi: number;
    for: number;
    int: number;
    pre: number;
    vig: number;
  };
  attacks: Array<{
    name: string;
    bonus: number;
    damage: string;
    type: string;
  }>;
  abilities: Array<{
    name: string;
    description: string;
  }>;
  resistances: string[];
  immunities: string[];
  image_url: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

// Ícones por categoria
const CATEGORY_CONFIG: Record<NPCCategory, { icon: typeof Users; label: string; color: string }> = {
  ally: { icon: User, label: 'Aliados', color: 'text-green-500' },
  enemy: { icon: Skull, label: 'Inimigos', color: 'text-red-500' },
  neutral: { icon: Users, label: 'Neutros', color: 'text-yellow-500' },
  creature: { icon: Ghost, label: 'Criaturas', color: 'text-purple-500' },
};

interface NPCManagerProps {
  campaignId: string;
  onAddToCombat?: (npc: CampaignNPC) => void;
}

export function NPCManager({ campaignId, onAddToCombat }: NPCManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Estados
  const [npcs, setNpcs] = useState<CampaignNPC[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<NPCCategory | 'all'>('all');
  
  // Dialog de edição
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNPC, setEditingNPC] = useState<CampaignNPC | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Busca NPCs
  useEffect(() => {
    fetchNPCs();
  }, [campaignId]);

  const fetchNPCs = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_npcs')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('name');

      if (error) throw error;
      
      // Converter tipos JSON
      const formatted = (data || []).map(npc => ({
        ...npc,
        category: npc.category as NPCCategory,
        attributes: npc.attributes as CampaignNPC['attributes'],
        attacks: (npc.attacks || []) as CampaignNPC['attacks'],
        abilities: (npc.abilities || []) as CampaignNPC['abilities'],
        resistances: (npc.resistances || []) as string[],
        immunities: (npc.immunities || []) as string[],
      }));
      
      setNpcs(formatted);
    } catch (error) {
      console.error('Erro ao buscar NPCs:', error);
      toast({ title: 'Erro', description: 'Falha ao carregar NPCs', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtra NPCs
  const filteredNPCs = useMemo(() => {
    return npcs.filter(npc => {
      const matchesSearch = npc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        npc.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || npc.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [npcs, searchQuery, activeCategory]);

  // Contagem por categoria
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: npcs.length };
    npcs.forEach(npc => {
      counts[npc.category] = (counts[npc.category] || 0) + 1;
    });
    return counts;
  }, [npcs]);

  // Criar novo NPC
  const handleCreate = () => {
    setEditingNPC(null);
    setEditorOpen(true);
  };

  // Editar NPC
  const handleEdit = (npc: CampaignNPC) => {
    setEditingNPC(npc);
    setEditorOpen(true);
  };

  // Duplicar NPC
  const handleDuplicate = async (npc: CampaignNPC) => {
    try {
      const { data, error } = await supabase
        .from('campaign_npcs')
        .insert({
          campaign_id: campaignId,
          name: `${npc.name} (Cópia)`,
          description: npc.description,
          category: npc.category,
          hp_max: npc.hp_max,
          hp_current: npc.hp_max,
          pe_max: npc.pe_max,
          pe_current: npc.pe_max,
          defense: npc.defense,
          movement: npc.movement,
          attributes: npc.attributes,
          attacks: npc.attacks,
          abilities: npc.abilities,
          resistances: npc.resistances,
          immunities: npc.immunities,
          image_url: npc.image_url,
          notes: npc.notes,
          is_active: true,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      setNpcs(prev => [...prev, {
        ...data,
        category: data.category as NPCCategory,
        attributes: data.attributes as CampaignNPC['attributes'],
        attacks: data.attacks as CampaignNPC['attacks'],
        abilities: data.abilities as CampaignNPC['abilities'],
        resistances: data.resistances as string[],
        immunities: data.immunities as string[],
      }]);
      toast({ title: 'NPC duplicado', description: `"${npc.name}" foi copiado.` });
    } catch (error) {
      console.error('Erro ao duplicar NPC:', error);
      toast({ title: 'Erro', description: 'Falha ao duplicar NPC', variant: 'destructive' });
    }
  };

  // Deletar NPC
  const handleDelete = async (npcId: string) => {
    try {
      const npc = npcs.find(n => n.id === npcId);
      
      const { error } = await supabase
        .from('campaign_npcs')
        .delete()
        .eq('id', npcId);

      if (error) throw error;
      
      setNpcs(prev => prev.filter(n => n.id !== npcId));
      toast({ title: 'NPC excluído', description: `"${npc?.name}" foi removido.` });
    } catch (error) {
      console.error('Erro ao deletar NPC:', error);
      toast({ title: 'Erro', description: 'Falha ao excluir NPC', variant: 'destructive' });
    }
  };

  // Toggle ativo/inativo
  const handleToggleActive = async (npc: CampaignNPC) => {
    try {
      const { error } = await supabase
        .from('campaign_npcs')
        .update({ is_active: !npc.is_active })
        .eq('id', npc.id);

      if (error) throw error;
      
      setNpcs(prev => prev.map(n => 
        n.id === npc.id ? { ...n, is_active: !n.is_active } : n
      ));
    } catch (error) {
      console.error('Erro ao atualizar NPC:', error);
      toast({ title: 'Erro', description: 'Falha ao atualizar NPC', variant: 'destructive' });
    }
  };

  // Atualiza HP do NPC
  const handleUpdateHP = async (npcId: string, newHP: number) => {
    try {
      const { error } = await supabase
        .from('campaign_npcs')
        .update({ hp_current: newHP })
        .eq('id', npcId);

      if (error) throw error;
      
      setNpcs(prev => prev.map(n => 
        n.id === npcId ? { ...n, hp_current: newHP } : n
      ));
    } catch (error) {
      console.error('Erro ao atualizar HP:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg tracking-wider">BESTIÁRIO</h3>
          <Badge variant="secondary">{npcs.length}</Badge>
        </div>

        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo NPC
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar NPCs..."
            className="pl-9"
          />
        </div>

        <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as NPCCategory | 'all')}>
          <TabsList>
            <TabsTrigger value="all" className="gap-1">
              Todos
              <Badge variant="secondary" className="text-xs ml-1">{categoryCounts.all || 0}</Badge>
            </TabsTrigger>
            {(Object.keys(CATEGORY_CONFIG) as NPCCategory[]).map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const Icon = config.icon;
              return (
                <TabsTrigger key={cat} value={cat} className="gap-1">
                  <Icon className={cn('w-4 h-4', config.color)} />
                  <span className="hidden sm:inline">{config.label}</span>
                  {categoryCounts[cat] > 0 && (
                    <Badge variant="secondary" className="text-xs ml-1">{categoryCounts[cat]}</Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Lista de NPCs */}
      {filteredNPCs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredNPCs.map((npc) => (
              <NPCCard
                key={npc.id}
                npc={npc}
                onEdit={() => handleEdit(npc)}
                onDelete={() => handleDelete(npc.id)}
                onDuplicate={() => handleDuplicate(npc)}
                onToggleActive={() => handleToggleActive(npc)}
                onAddToCombat={onAddToCombat ? () => onAddToCombat(npc) : undefined}
                onUpdateHP={(hp) => handleUpdateHP(npc.id, hp)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum NPC encontrado</p>
          <Button variant="link" size="sm" onClick={handleCreate} className="mt-2">
            Criar primeiro NPC
          </Button>
        </div>
      )}

      {/* Editor Dialog */}
      <NPCEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        npc={editingNPC}
        campaignId={campaignId}
        userId={user?.id || ''}
        onSave={(savedNPC) => {
          if (editingNPC) {
            setNpcs(prev => prev.map(n => n.id === savedNPC.id ? savedNPC : n));
          } else {
            setNpcs(prev => [...prev, savedNPC]);
          }
        }}
      />
    </div>
  );
}

// Dialog de edição de NPC
interface NPCEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  npc: CampaignNPC | null;
  campaignId: string;
  userId: string;
  onSave: (npc: CampaignNPC) => void;
}

function NPCEditorDialog({ open, onOpenChange, npc, campaignId, userId, onSave }: NPCEditorDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<NPCCategory>('enemy');
  const [hpMax, setHpMax] = useState(10);
  const [peMax, setPeMax] = useState(0);
  const [defense, setDefense] = useState(10);
  const [movement, setMovement] = useState(9);
  const [notes, setNotes] = useState('');

  // Reset form quando abrir
  useEffect(() => {
    if (open) {
      if (npc) {
        setName(npc.name);
        setDescription(npc.description || '');
        setCategory(npc.category);
        setHpMax(npc.hp_max);
        setPeMax(npc.pe_max);
        setDefense(npc.defense);
        setMovement(npc.movement);
        setNotes(npc.notes || '');
      } else {
        setName('');
        setDescription('');
        setCategory('enemy');
        setHpMax(10);
        setPeMax(0);
        setDefense(10);
        setMovement(9);
        setNotes('');
      }
    }
  }, [open, npc]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Erro', description: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const npcData = {
        campaign_id: campaignId,
        name: name.trim(),
        description: description.trim() || null,
        category,
        hp_max: hpMax,
        hp_current: npc?.hp_current ?? hpMax,
        pe_max: peMax,
        pe_current: npc?.pe_current ?? peMax,
        defense,
        movement,
        notes: notes.trim() || null,
        attributes: npc?.attributes || { agi: 1, for: 1, int: 1, pre: 1, vig: 1 },
        attacks: npc?.attacks || [],
        abilities: npc?.abilities || [],
        resistances: npc?.resistances || [],
        immunities: npc?.immunities || [],
        image_url: npc?.image_url || null,
        is_active: npc?.is_active ?? true,
        created_by: userId,
      };

      if (npc) {
        // Atualizar existente
        const { data, error } = await supabase
          .from('campaign_npcs')
          .update(npcData)
          .eq('id', npc.id)
          .select()
          .single();

        if (error) throw error;

        onSave({
          ...data,
          category: data.category as NPCCategory,
          attributes: data.attributes as CampaignNPC['attributes'],
          attacks: data.attacks as CampaignNPC['attacks'],
          abilities: data.abilities as CampaignNPC['abilities'],
          resistances: data.resistances as string[],
          immunities: data.immunities as string[],
        });
        toast({ title: 'NPC atualizado', description: `"${name}" foi salvo.` });
      } else {
        // Criar novo
        const { data, error } = await supabase
          .from('campaign_npcs')
          .insert(npcData)
          .select()
          .single();

        if (error) throw error;

        onSave({
          ...data,
          category: data.category as NPCCategory,
          attributes: data.attributes as CampaignNPC['attributes'],
          attacks: data.attacks as CampaignNPC['attacks'],
          abilities: data.abilities as CampaignNPC['abilities'],
          resistances: data.resistances as string[],
          immunities: data.immunities as string[],
        });
        toast({ title: 'NPC criado', description: `"${name}" foi adicionado.` });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar NPC:', error);
      toast({ title: 'Erro', description: 'Falha ao salvar NPC', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {npc ? 'Editar NPC' : 'Novo NPC'}
          </DialogTitle>
          <DialogDescription>
            Crie ou edite um NPC para sua campanha.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="npc-name">Nome *</Label>
            <Input
              id="npc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Cultista do Sangue"
            />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as NPCCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_CONFIG) as NPCCategory[]).map((cat) => {
                  const config = CATEGORY_CONFIG[cat];
                  const Icon = config.icon;
                  return (
                    <SelectItem key={cat} value={cat}>
                      <div className="flex items-center gap-2">
                        <Icon className={cn('w-4 h-4', config.color)} />
                        {config.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Stats básicos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="npc-hp">PV Máximo</Label>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                <Input
                  id="npc-hp"
                  type="number"
                  value={hpMax}
                  onChange={(e) => setHpMax(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="npc-pe">PE Máximo</Label>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                <Input
                  id="npc-pe"
                  type="number"
                  value={peMax}
                  onChange={(e) => setPeMax(Math.max(0, parseInt(e.target.value) || 0))}
                  min={0}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="npc-defense">Defesa</Label>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-yellow-500" />
                <Input
                  id="npc-defense"
                  type="number"
                  value={defense}
                  onChange={(e) => setDefense(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="npc-movement">Deslocamento</Label>
              <Input
                id="npc-movement"
                type="number"
                value={movement}
                onChange={(e) => setMovement(Math.max(0, parseInt(e.target.value) || 0))}
                min={0}
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="npc-description">Descrição Visual</Label>
            <Textarea
              id="npc-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Aparência, vestimentas, características marcantes..."
              className="h-20 resize-none"
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="npc-notes">Notas do Mestre</Label>
            <Textarea
              id="npc-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações secretas, comportamento, motivações..."
              className="h-20 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NPCManager;

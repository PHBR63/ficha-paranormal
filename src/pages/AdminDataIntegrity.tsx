/**
 * Página administrativa para verificar integridade dos dados e validação de regras
 * Permite visualizar e corrigir personagens com classes ou trilhas inválidas
 * Também valida conformidade com as regras oficiais do sistema
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Shield, 
  Database,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Trash2,
  RefreshCw,
  Users,
  BookOpen,
  BarChart3,
  Sparkles,
  FileJson
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CLASSES, CLASS_TRACKS, getClassTracks } from '@/lib/character-data';
import { checkExistingCharacterValidity } from '@/lib/character-validation';
import { RulesValidationPanel } from '@/components/admin/RulesValidationPanel';
import { ValidationHistoryDashboard } from '@/components/admin/ValidationHistoryDashboard';
import { ClassPowerBonusTests } from '@/components/admin/ClassPowerBonusTests';
import { SUETestCoverageDashboard } from '@/components/admin/SUETestCoverageDashboard';
import { useValidationHistory } from '@/hooks/useValidationHistory';

interface CharacterData {
  id: string;
  name: string;
  class: string;
  class_track: string | null;
  origin: string;
  nex: number;
  user_id: string;
}

interface CharacterWithIssues extends CharacterData {
  issues: string[];
  profile?: {
    display_name: string | null;
  };
}

export default function AdminDataIntegrity() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addEntry } = useValidationHistory();
  
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [characters, setCharacters] = useState<CharacterWithIssues[]>([]);
  const [allCharactersCount, setAllCharactersCount] = useState(0);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterWithIssues | null>(null);
  const [showFixDialog, setShowFixDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newClass, setNewClass] = useState('');
  const [newTrack, setNewTrack] = useState('');
  const [saving, setSaving] = useState(false);

  // Escuta eventos de validação concluída para salvar no histórico
  useEffect(() => {
    const handleValidationCompleted = (event: CustomEvent) => {
      addEntry(event.detail);
    };

    window.addEventListener('validation-completed', handleValidationCompleted as EventListener);
    return () => {
      window.removeEventListener('validation-completed', handleValidationCompleted as EventListener);
    };
  }, [addEntry]);

  // Buscar todos os personagens e verificar integridade
  const scanCharacters = async () => {
    setScanning(true);
    try {
      // Buscar todos os personagens (admin tem acesso via RLS)
      const { data: allCharacters, error, count } = await supabase
        .from('characters')
        .select('id, name, class, class_track, origin, nex, user_id', { count: 'exact' });

      if (error) throw error;

      setAllCharactersCount(count || 0);

      // Filtrar personagens com problemas
      const invalidCharacters: CharacterWithIssues[] = [];

      for (const char of allCharacters || []) {
        const validation = checkExistingCharacterValidity({
          name: char.name,
          class: char.class,
          class_track: char.class_track,
          origin: char.origin,
          nex: char.nex,
        });

        if (!validation.isValid) {
          // Buscar perfil do usuário
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', char.user_id)
            .maybeSingle();

          invalidCharacters.push({
            ...char,
            issues: validation.issues,
            profile: profile || undefined,
          });
        }
      }

      setCharacters(invalidCharacters);
    } catch (error) {
      console.error('Erro ao escanear personagens:', error);
      toast.error('Erro ao escanear personagens');
    } finally {
      setScanning(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    scanCharacters();
  }, []);

  // Corrigir personagem
  const handleFix = async () => {
    if (!selectedCharacter || !newClass) return;

    setSaving(true);
    try {
      const updateData: { class: string; class_track?: string | null } = {
        class: newClass,
      };

      // Se NEX >= 10%, precisa de trilha
      if (selectedCharacter.nex >= 10) {
        updateData.class_track = newTrack || null;
      } else {
        updateData.class_track = null;
      }

      const { error } = await supabase
        .from('characters')
        .update(updateData)
        .eq('id', selectedCharacter.id);

      if (error) throw error;

      toast.success(`Personagem "${selectedCharacter.name}" corrigido com sucesso!`);
      setShowFixDialog(false);
      setSelectedCharacter(null);
      setNewClass('');
      setNewTrack('');
      
      // Reescanear
      scanCharacters();
    } catch (error) {
      console.error('Erro ao corrigir personagem:', error);
      toast.error('Erro ao corrigir personagem');
    } finally {
      setSaving(false);
    }
  };

  // Excluir personagem
  const handleDelete = async () => {
    if (!selectedCharacter) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', selectedCharacter.id);

      if (error) throw error;

      toast.success(`Personagem "${selectedCharacter.name}" excluído`);
      setShowDeleteDialog(false);
      setSelectedCharacter(null);
      
      // Reescanear
      scanCharacters();
    } catch (error) {
      console.error('Erro ao excluir personagem:', error);
      toast.error('Erro ao excluir personagem');
    } finally {
      setSaving(false);
    }
  };

  // Trilhas disponíveis para a classe selecionada
  const availableTracks = newClass ? getClassTracks(newClass) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/admin/users')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-display text-xl tracking-wider flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  ADMINISTRAÇÃO DO SISTEMA
                </h1>
                <p className="text-sm text-muted-foreground">
                  Integridade de dados e validação de regras oficiais
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/import')}
              >
                <FileJson className="w-4 h-4 mr-2" />
                Importação
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/admin/users')}
              >
                <Users className="w-4 h-4 mr-2" />
                Usuários
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="integrity" className="space-y-6">
          <TabsList className="grid w-full max-w-4xl grid-cols-5">
            <TabsTrigger value="integrity" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Integridade</span>
              <span className="sm:hidden">Dados</span>
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Regras</span>
              <span className="sm:hidden">Regras</span>
            </TabsTrigger>
            <TabsTrigger value="powers" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              <span className="hidden sm:inline">Poderes</span>
              <span className="sm:hidden">Poderes</span>
            </TabsTrigger>
            <TabsTrigger value="sue" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">SUE</span>
              <span className="sm:hidden">SUE</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Histórico</span>
              <span className="sm:hidden">Histórico</span>
            </TabsTrigger>
          </TabsList>

          {/* Aba de Integridade de Dados */}
          <TabsContent value="integrity" className="space-y-6">
            {/* Header da aba com botão reescanear */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={scanCharacters}
                disabled={scanning}
              >
                {scanning ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Reescanear
              </Button>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Database className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Personagens</p>
                      <p className="text-2xl font-bold">{allCharactersCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-destructive/10">
                      <AlertTriangle className="w-6 h-6 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Com Problemas</p>
                      <p className="text-2xl font-bold">{characters.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-500/10">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Válidos</p>
                      <p className="text-2xl font-bold">{allCharactersCount - characters.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

        {/* Tabela de personagens com problemas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Personagens com Dados Inválidos
            </CardTitle>
            <CardDescription>
              Personagens que usam classes ou trilhas que não existem mais no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : characters.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Todos os dados estão válidos!</h3>
                <p className="text-muted-foreground">
                  Nenhum personagem com classe ou trilha inválida foi encontrado.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Personagem</TableHead>
                    <TableHead>Jogador</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead>Trilha</TableHead>
                    <TableHead>NEX</TableHead>
                    <TableHead>Problemas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {characters.map((char) => (
                    <TableRow key={char.id}>
                      <TableCell className="font-medium">{char.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {char.profile?.display_name || 'Desconhecido'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{char.class}</Badge>
                      </TableCell>
                      <TableCell>
                        {char.class_track ? (
                          <Badge variant="outline" className="border-destructive text-destructive">
                            {char.class_track}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{char.nex}%</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {char.issues.map((issue, idx) => (
                            <span key={idx} className="text-xs text-destructive">
                              {issue}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCharacter(char);
                              setNewClass('');
                              setNewTrack('');
                              setShowFixDialog(true);
                            }}
                          >
                            <Wrench className="w-4 h-4 mr-1" />
                            Corrigir
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedCharacter(char);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Classes e Trilhas Válidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Classes Válidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {CLASSES.map((cls) => (
                  <Badge key={cls.id} variant="secondary">
                    {cls.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trilhas por Classe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {CLASSES.map((cls) => (
                <div key={cls.id}>
                  <p className="text-sm font-medium mb-2">{cls.name}:</p>
                  <div className="flex flex-wrap gap-1">
                    {getClassTracks(cls.id).map((track) => (
                      <Badge key={track.id} variant="outline" className="text-xs">
                        {track.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
          </TabsContent>

          {/* Aba de Validação de Regras */}
          <TabsContent value="rules">
            <RulesValidationPanel />
          </TabsContent>

          {/* Aba de Testes de Poderes de Classe */}
          <TabsContent value="powers" className="space-y-6">
            <ClassPowerBonusTests />
            <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <p>💡 Testes automatizados de Rituais, Poderes e SUE agora são executados via Vitest no terminal.</p>
              <p className="mt-1">Execute <code className="bg-background px-1 py-0.5 rounded">npm test</code> para rodar todos os testes.</p>
            </div>
          </TabsContent>

          {/* Aba de Cobertura de Testes SUE */}
          <TabsContent value="sue">
            <SUETestCoverageDashboard />
          </TabsContent>

          {/* Aba de Histórico e Dashboard */}
          <TabsContent value="history">
            <ValidationHistoryDashboard />
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialog de Correção */}
      <AlertDialog open={showFixDialog} onOpenChange={setShowFixDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Corrigir Personagem</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione uma classe e trilha válidas para "{selectedCharacter?.name}"
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nova Classe</label>
              <Select value={newClass} onValueChange={(val) => {
                setNewClass(val);
                setNewTrack('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma classe" />
                </SelectTrigger>
                <SelectContent>
                  {CLASSES.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCharacter && selectedCharacter.nex >= 10 && newClass && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Nova Trilha</label>
                <Select value={newTrack} onValueChange={setNewTrack}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma trilha" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTracks.map((track) => (
                      <SelectItem key={track.id} value={track.id}>
                        {track.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableTracks.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Nenhuma trilha disponível para esta classe
                  </p>
                )}
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFix}
              disabled={saving || !newClass || (selectedCharacter?.nex && selectedCharacter.nex >= 10 && !newTrack)}
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Salvar Correção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Personagem</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{selectedCharacter?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={saving}
              className="bg-destructive hover:bg-destructive/90"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

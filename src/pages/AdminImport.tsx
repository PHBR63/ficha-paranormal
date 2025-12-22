/**
 * Página administrativa para importação de dados em lote
 * Permite importar armas, armaduras, itens e rituais via JSON
 * Inclui verificação de duplicatas contra o sistema e dentro do JSON
 */
import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Upload, 
  CheckCircle, 
  FileJson, 
  Sword, 
  Shield, 
  Package, 
  Sparkles,
  Loader2,
  Download,
  Users,
  AlertTriangle
} from 'lucide-react';
import { JsonExamples, ImportType, TYPE_LABELS } from '@/components/admin/JsonExamples';
import { ImportPreview } from '@/components/admin/ImportPreview';
import {
  validateWeapon,
  validateArmor,
  validateItem,
  validateRitual,
  validateBatch,
  parseJsonSafe,
  normalizeToArray,
  createValidationContext,
  ValidatedItem,
  ALL_WEAPONS,
  ALL_ARMORS,
  ALL_ITEMS,
  ALL_RITUALS
} from '@/lib/import-validators';

// Ícones para cada tipo
const TYPE_ICONS: Record<ImportType, React.ReactNode> = {
  weapons: <Sword className="h-4 w-4" />,
  armor: <Shield className="h-4 w-4" />,
  items: <Package className="h-4 w-4" />,
  rituals: <Sparkles className="h-4 w-4" />
};

export default function AdminImport() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado
  const [activeTab, setActiveTab] = useState<ImportType>('weapons');
  const [jsonInput, setJsonInput] = useState('');
  const [validatedItems, setValidatedItems] = useState<ValidatedItem<unknown>[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Estatísticas do sistema atual
  const systemStats = useMemo(() => ({
    weapons: ALL_WEAPONS.length,
    armor: ALL_ARMORS.length,
    items: ALL_ITEMS.length,
    rituals: ALL_RITUALS.length
  }), []);

  // Função para validar JSON baseado no tipo com verificação de duplicatas
  const validateJson = () => {
    if (!jsonInput.trim()) {
      toast.error('Cole ou carregue um JSON primeiro');
      return;
    }

    const parseResult = parseJsonSafe(jsonInput);
    if (!parseResult.success) {
      toast.error(`Erro no JSON: ${parseResult.error}`);
      setValidatedItems([]);
      return;
    }

    const dataArray = normalizeToArray(parseResult.data);
    
    // Criar contexto de validação com dados existentes do sistema
    let existingItems: Array<{ id: string; name: string }> = [];
    switch (activeTab) {
      case 'weapons':
        existingItems = ALL_WEAPONS.map(w => ({ id: w.id, name: w.name }));
        break;
      case 'armor':
        existingItems = ALL_ARMORS.map(a => ({ id: a.id, name: a.name }));
        break;
      case 'items':
        existingItems = ALL_ITEMS.map(i => ({ id: i.id, name: i.name }));
        break;
      case 'rituals':
        existingItems = ALL_RITUALS.map(r => ({ id: r.id, name: r.name }));
        break;
    }
    
    const context = createValidationContext(existingItems);
    
    let validated: ValidatedItem<unknown>[];
    switch (activeTab) {
      case 'weapons':
        validated = validateBatch(dataArray, validateWeapon, context);
        break;
      case 'armor':
        validated = validateBatch(dataArray, validateArmor, context);
        break;
      case 'items':
        validated = validateBatch(dataArray, validateItem, context);
        break;
      case 'rituals':
        validated = validateBatch(dataArray, validateRitual, context);
        break;
      default:
        validated = [];
    }

    setValidatedItems(validated);
    
    const validCount = validated.filter(v => v.validation.valid).length;
    const invalidCount = validated.filter(v => !v.validation.valid).length;
    const warningCount = validated.filter(v => v.validation.warnings.length > 0).length;
    
    if (invalidCount === 0 && warningCount === 0) {
      toast.success(`${validCount} ${validCount === 1 ? 'item válido' : 'itens válidos'} para importação`);
    } else if (invalidCount === 0) {
      toast.warning(`${validCount} válidos com ${warningCount} avisos (possíveis duplicatas)`);
    } else {
      toast.error(`${validCount} válidos, ${invalidCount} com erros, ${warningCount} com avisos`);
    }
  };

  // Função para importar dados
  const handleImport = async () => {
    const validItems = validatedItems.filter(v => v.validation.valid);
    
    if (validItems.length === 0) {
      toast.error('Nenhum item válido para importar');
      return;
    }

    setIsImporting(true);
    
    try {
      // Aqui você pode adicionar a lógica de salvar no localStorage ou banco
      // Por enquanto, vamos simular um delay e mostrar sucesso
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Salvar no localStorage como exemplo
      const storageKey = `imported_${activeTab}`;
      const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const newData = [...existingData, ...validItems.map(v => v.data)];
      localStorage.setItem(storageKey, JSON.stringify(newData));
      
      toast.success(`${validItems.length} ${TYPE_LABELS[activeTab].toLowerCase()} importados com sucesso!`);
      
      // Limpar estado
      setJsonInput('');
      setValidatedItems([]);
    } catch (error) {
      toast.error('Erro ao importar dados');
      console.error('Erro na importação:', error);
    } finally {
      setIsImporting(false);
    }
  };

  // Função para upload de arquivo
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Por favor, selecione um arquivo .json');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonInput(content);
      toast.success('Arquivo carregado! Clique em Validar para verificar.');
    };
    reader.onerror = () => {
      toast.error('Erro ao ler arquivo');
    };
    reader.readAsText(file);
    
    // Limpar input para permitir recarregar mesmo arquivo
    event.target.value = '';
  };

  // Função para renderizar nome do item no preview
  const renderItemName = (item: unknown): string => {
    const obj = item as Record<string, unknown>;
    return (obj.name as string) || (obj.id as string) || 'Item sem nome';
  };

  // Função para exportar dados existentes
  const handleExport = () => {
    const storageKey = `imported_${activeTab}`;
    const data = localStorage.getItem(storageKey);
    
    if (!data || data === '[]') {
      toast.info('Nenhum dado importado para exportar');
      return;
    }

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Dados exportados com sucesso!');
  };

  // Limpar ao trocar de aba
  const handleTabChange = (value: string) => {
    setActiveTab(value as ImportType);
    setJsonInput('');
    setValidatedItems([]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Painel Administrativo
                </h1>
                <p className="text-sm text-muted-foreground">
                  Importação de Dados em Lote
                </p>
              </div>
            </div>
            
            {/* Navegação Admin */}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled
              >
                <FileJson className="h-4 w-4 mr-2" />
                Importação
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/data-integrity')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Integridade
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/users')}
              >
                <Users className="h-4 w-4 mr-2" />
                Usuários
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          {/* Tabs de tipos de dados */}
          <TabsList className="grid grid-cols-4 mb-6">
            {(Object.keys(TYPE_LABELS) as ImportType[]).map((type) => (
              <TabsTrigger key={type} value={type} className="flex items-center gap-2">
                {TYPE_ICONS[type]}
                <span className="hidden sm:inline">{TYPE_LABELS[type]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Conteúdo das tabs */}
          {(Object.keys(TYPE_LABELS) as ImportType[]).map((type) => (
            <TabsContent key={type} value={type} className="space-y-6">
              {/* Estatísticas do sistema */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">
                      O sistema possui atualmente{' '}
                      <strong className="text-foreground">{systemStats[type]}</strong>{' '}
                      {TYPE_LABELS[type].toLowerCase()} cadastrados.
                      Duplicatas serão detectadas automaticamente.
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Exemplo de formato */}
              <JsonExamples type={type} />

              {/* Área de input */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileJson className="h-4 w-4 text-primary" />
                    Cole seu JSON ou carregue um arquivo
                  </CardTitle>
                  <CardDescription>
                    Aceita objeto único ou array de objetos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder={`Cole aqui o JSON de ${TYPE_LABELS[type].toLowerCase()}...`}
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    className="min-h-48 font-mono text-sm"
                  />
                  
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".json"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload JSON
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={validateJson}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Validar
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={validatedItems.filter(v => v.validation.valid).length === 0 || isImporting}
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <FileJson className="h-4 w-4 mr-2" />
                          Importar ({validatedItems.filter(v => v.validation.valid).length})
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Preview */}
              <ImportPreview
                items={validatedItems}
                renderItem={renderItemName}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

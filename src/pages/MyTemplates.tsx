/**
 * Página de Gerenciamento de Templates do Usuário
 * Lista, edita e exclui templates criados pelo usuário
 * 
 * @module pages/MyTemplates
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMyTemplates, useDeleteTemplate } from '@/hooks/useTemplates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Particles } from '@/components/ui/particles';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { LogoBox } from '@/components/ui/logo';
import { ThemeSelector } from '@/components/ui/theme-selector';
import { TemplateEditModal } from '@/components/templates/TemplateEditModal';
import { TemplatePreviewModal } from '@/components/templates/TemplatePreviewModal';
import { 
  ArrowLeft, 
  Package, 
  Plus, 
  Eye, 
  Pencil, 
  Trash2, 
  Globe, 
  Lock,
  Star,
  Users,
  Loader2,
  AlertCircle
} from '@/components/icons/ordem-icons';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/hooks';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS, type CharacterTemplate } from '@/types/templates';
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

// Ícones das classes
const CLASS_ICONS: Record<string, string> = {
  'Combatente': '⚔️',
  'Especialista': '🎯',
  'Ocultista': '✨',
};

export default function MyTemplates() {
  const { user } = useAuth();
  const themeColors = useThemeColors();
  
  // Busca templates do usuário
  const { data: templates, isLoading, error } = useMyTemplates();
  const deleteTemplate = useDeleteTemplate();
  
  // Estados dos modals
  const [selectedTemplate, setSelectedTemplate] = useState<CharacterTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<CharacterTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<CharacterTemplate | null>(null);
  
  // Handler de exclusão
  const handleDelete = async () => {
    if (!deletingTemplate) return;
    
    await deleteTemplate.mutateAsync(deletingTemplate.id);
    setDeletingTemplate(null);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <Particles
        className="absolute inset-0 -z-10"
        quantity={60}
        color={themeColors.rgb}
        ease={50}
        size={0.5}
        staticity={40}
        refresh={false}
      />
      <FlickeringGrid
        className="absolute inset-0 -z-20 opacity-20"
        color={themeColors.rgb}
        squareSize={4}
        gridGap={6}
        maxOpacity={0.3}
        flickerChance={0.015}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <LogoBox size="md" />
            <div>
              <h1 className="font-display text-lg tracking-wider">MEUS TEMPLATES</h1>
              <p className="text-xs text-muted-foreground">
                Gerencie seus templates de personagem
              </p>
            </div>
          </div>
          <ThemeSelector />
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-8">
        {/* Estatísticas */}
        {templates && templates.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{templates.length}</p>
                  <p className="text-xs text-muted-foreground">Templates</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {templates.filter(t => t.is_public).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Públicos</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {templates.reduce((acc, t) => acc + (t.rating || 0), 0).toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">Avaliação Total</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {templates.reduce((acc, t) => acc + t.usage_count, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Usos Totais</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        )}

        {/* Erro */}
        {error && (
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="p-6 flex items-center gap-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Erro ao carregar templates</p>
                <p className="text-sm text-muted-foreground">{error.message}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista Vazia */}
        {!isLoading && !error && templates?.length === 0 && (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-xl tracking-wider mb-2">NENHUM TEMPLATE</h3>
              <p className="text-muted-foreground mb-6">
                Você ainda não criou nenhum template. Crie um personagem e salve-o como template!
              </p>
              <Button asChild>
                <Link to="/character/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Personagem
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lista de Templates */}
        {templates && templates.length > 0 && (
          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="space-y-4">
              {templates.map((template) => {
                const classIcon = CLASS_ICONS[template.template_data.classId] || '📋';
                const diffLabel = template.difficulty_level 
                  ? DIFFICULTY_LABELS[template.difficulty_level]
                  : 'Não definido';
                const diffColor = template.difficulty_level
                  ? DIFFICULTY_COLORS[template.difficulty_level]
                  : 'bg-muted text-muted-foreground';
                
                return (
                  <Card 
                    key={template.id} 
                    className="bg-card/60 border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Info Principal */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{classIcon}</span>
                            <div className="min-w-0">
                              <h3 className="font-display text-lg tracking-wider truncate">
                                {template.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {template.template_data.classId} • {template.template_data.classTrack || 'Sem trilha'}
                              </p>
                            </div>
                          </div>
                          
                          {template.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {template.description}
                            </p>
                          )}
                          
                          {/* Badges */}
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className={cn(diffColor, 'text-xs')}>
                              {diffLabel}
                            </Badge>
                            
                            <Badge variant="outline" className="text-xs">
                              NEX {template.min_nex}-{template.max_nex}%
                            </Badge>
                            
                            {template.is_public ? (
                              <Badge variant="outline" className="text-xs text-green-500 border-green-500/30">
                                <Globe className="w-3 h-3 mr-1" />
                                Público
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/30">
                                <Lock className="w-3 h-3 mr-1" />
                                Privado
                              </Badge>
                            )}
                            
                            {template.rating && (
                              <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/30">
                                <Star className="w-3 h-3 mr-1 fill-yellow-500" />
                                {template.rating.toFixed(1)}
                              </Badge>
                            )}
                            
                            {template.usage_count > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Users className="w-3 h-3 mr-1" />
                                {template.usage_count} usos
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Ações */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTemplate(template)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingTemplate(template)}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label={`Excluir template ${template.name}`}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeletingTemplate(template)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </main>

      {/* Modal de Preview */}
      {selectedTemplate && (
        <TemplatePreviewModal
          template={selectedTemplate}
          isOpen={!!selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onApply={() => setSelectedTemplate(null)}
        />
      )}

      {/* Modal de Edição */}
      {editingTemplate && (
        <TemplateEditModal
          template={editingTemplate}
          open={!!editingTemplate}
          onOpenChange={(open) => !open && setEditingTemplate(null)}
        />
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deletingTemplate} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Excluir Template
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>"{deletingTemplate?.name}"</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTemplate.isPending}
            >
              {deleteTemplate.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

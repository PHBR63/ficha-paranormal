/**
 * MapAssetsPanel - Painel lateral para gerenciar assets do mapa
 * 
 * Explorador de arquivos com pastas, upload, thumbnails e seleção
 * para posicionar assets no mapa tático.
 */

import { useState, useCallback, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Folder,
  FolderPlus,
  Upload,
  Search,
  ArrowLeft,
  Pencil,
  Trash2,
  FolderInput,
  Tag,
  Loader2,
  ImageIcon,
  Sparkles,
  Target,
  Box,
  Filter,
} from '@/components/icons/ordem-icons';
import {
  useCampaignAssets,
  type CampaignAsset,
  type AssetCategory,
  type AssetFolder,
} from '@/hooks/campaign/useCampaignAssets';

// Mapeamento de categorias para ícones/labels
const CATEGORY_MAP: Record<AssetCategory, { label: string; icon: typeof Target }> = {
  token: { label: 'Token', icon: Target },
  decoration: { label: 'Decoração', icon: Box },
  effect: { label: 'Efeito', icon: Sparkles },
  general: { label: 'Geral', icon: ImageIcon },
};

interface MapAssetsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  isMaster: boolean;
  onAssetSelect?: (asset: CampaignAsset) => void;
}

export function MapAssetsPanel({
  open,
  onOpenChange,
  campaignId,
  isMaster,
  onAssetSelect,
}: MapAssetsPanelProps) {
  const assetsManager = useCampaignAssets({ campaignId, isMaster, enabled: open });

  // Estados locais do painel
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | 'all'>('all');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ type: 'folder' | 'asset'; id: string; currentName: string } | null>(null);
  const [newName, setNewName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtragem
  const filteredFolders = assetsManager.folders.filter(f =>
    !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssets = assetsManager.assets.filter(a => {
    const matchesSearch = !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Handlers
  const handleCreateFolder = useCallback(async () => {
    if (!newName.trim()) return;
    await assetsManager.createFolder(newName.trim());
    setNewName('');
    setShowNewFolderDialog(false);
  }, [newName, assetsManager]);

  const handleRename = useCallback(async () => {
    if (!renameTarget || !newName.trim()) return;

    if (renameTarget.type === 'folder') {
      await assetsManager.renameFolder(renameTarget.id, newName.trim());
    } else {
      await assetsManager.renameAsset(renameTarget.id, newName.trim());
    }
    setNewName('');
    setRenameTarget(null);
    setShowRenameDialog(false);
  }, [renameTarget, newName, assetsManager]);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      await assetsManager.uploadAsset(file, 'general');
    }
  }, [assetsManager]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const openRenameDialog = useCallback((type: 'folder' | 'asset', id: string, currentName: string) => {
    setRenameTarget({ type, id, currentName });
    setNewName(currentName);
    setShowRenameDialog(true);
  }, []);

  const handleAssetClick = useCallback((asset: CampaignAsset) => {
    onAssetSelect?.(asset);
  }, [onAssetSelect]);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[380px] sm:w-[420px] flex flex-col p-0">
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="text-base flex items-center gap-2">
              <Folder className="w-4 h-4" />
              Assets do Mapa
            </SheetTitle>
          </SheetHeader>

          {/* Breadcrumbs de navegação */}
          <div className="px-4 pb-2">
            <Breadcrumb>
              <BreadcrumbList>
                {assetsManager.breadcrumbs.map((crumb, i) => {
                  const isLast = i === assetsManager.breadcrumbs.length - 1;
                  return (
                    <BreadcrumbItem key={crumb.id ?? 'root'}>
                      {i > 0 && <BreadcrumbSeparator />}
                      {isLast ? (
                        <BreadcrumbPage className="text-xs">{crumb.name}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          className="text-xs cursor-pointer"
                          onClick={() => assetsManager.navigateToFolder(crumb.id)}
                        >
                          {crumb.name}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Barra de ações */}
          <div className="px-4 pb-2 flex items-center gap-2">
            {assetsManager.currentFolderId && (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 shrink-0"
                onClick={assetsManager.navigateUp}
                title="Voltar"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}

            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-7 text-xs"
              />
            </div>

            {/* Filtro de categoria */}
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as AssetCategory | 'all')}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(CATEGORY_MAP).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botões de ação do mestre */}
          {isMaster && (
            <div className="px-4 pb-2 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setNewName('');
                  setShowNewFolderDialog(true);
                }}
              >
                <FolderPlus className="w-3.5 h-3.5 mr-1" />
                Nova Pasta
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => fileInputRef.current?.click()}
                disabled={assetsManager.isUploading}
              >
                {assetsManager.isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5 mr-1" />
                )}
                Upload
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFileUpload(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>
          )}

          {/* Área de conteúdo com drag & drop */}
          <div
            className="flex-1 overflow-y-auto px-4 pb-4"
            onDrop={isMaster ? handleDrop : undefined}
            onDragOver={isMaster ? handleDragOver : undefined}
          >
            {assetsManager.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredFolders.length === 0 && filteredAssets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {searchQuery ? 'Nenhum resultado encontrado' : (
                  <div
                    className="border-2 border-dashed border-muted rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => isMaster && fileInputRef.current?.click()}
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Pasta vazia</p>
                    {isMaster && <p className="text-xs mt-1">Clique ou arraste arquivos aqui</p>}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {/* Pastas */}
                {filteredFolders.map((folder) => (
                  <FolderItem
                    key={folder.id}
                    folder={folder}
                    isMaster={isMaster}
                    allFolders={assetsManager.allFolders}
                    currentFolderId={assetsManager.currentFolderId}
                    onNavigate={() => assetsManager.navigateToFolder(folder.id)}
                    onRename={() => openRenameDialog('folder', folder.id, folder.name)}
                    onDelete={() => assetsManager.deleteFolder(folder.id)}
                    onMove={(targetId) => assetsManager.moveFolder(folder.id, targetId)}
                  />
                ))}

                {/* Assets */}
                {filteredAssets.map((asset) => (
                  <AssetItem
                    key={asset.id}
                    asset={asset}
                    isMaster={isMaster}
                    allFolders={assetsManager.allFolders}
                    onSelect={() => handleAssetClick(asset)}
                    onRename={() => openRenameDialog('asset', asset.id, asset.name)}
                    onDelete={() => assetsManager.deleteAsset(asset)}
                    onMove={(targetId) => assetsManager.moveAsset(asset.id, targetId)}
                    onCategoryChange={(cat) => assetsManager.updateAssetCategory(asset.id, cat)}
                  />
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog: Nova Pasta */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent className="sm:max-w-[320px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Nova Pasta</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Nome da pasta"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            autoFocus
          />
          <DialogFooter>
            <Button size="sm" onClick={handleCreateFolder} disabled={!newName.trim()}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Renomear */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-[320px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Renomear</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Novo nome"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            autoFocus
          />
          <DialogFooter>
            <Button size="sm" onClick={handleRename} disabled={!newName.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ==========================================
// Subcomponentes
// ==========================================

/** Item de pasta no grid */
function FolderItem({
  folder,
  isMaster,
  allFolders,
  currentFolderId,
  onNavigate,
  onRename,
  onDelete,
  onMove,
}: {
  folder: AssetFolder;
  isMaster: boolean;
  allFolders: AssetFolder[];
  currentFolderId: string | null;
  onNavigate: () => void;
  onRename: () => void;
  onDelete: () => void;
  onMove: (targetId: string | null) => void;
}) {
  // Pastas disponíveis para mover (exclui a própria e filhas)
  const moveTargets = allFolders.filter(f => f.id !== folder.id && f.parent_id !== folder.id);

  const content = (
    <div
      className="flex flex-col items-center gap-1 p-3 rounded-lg border border-border/50 hover:bg-accent/50 cursor-pointer transition-colors"
      onDoubleClick={onNavigate}
      onClick={onNavigate}
    >
      <Folder className="w-8 h-8 text-primary/70" />
      <span className="text-xs text-center truncate w-full">{folder.name}</span>
    </div>
  );

  if (!isMaster) return content;

  return (
    <ContextMenu>
      <ContextMenuTrigger>{content}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onRename}>
          <Pencil className="w-3.5 h-3.5 mr-2" />
          Renomear
        </ContextMenuItem>
        {moveTargets.length > 0 && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <FolderInput className="w-3.5 h-3.5 mr-2" />
              Mover para...
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {currentFolderId && (
                <ContextMenuItem onClick={() => onMove(null)}>
                  📁 Raiz
                </ContextMenuItem>
              )}
              {moveTargets.map(t => (
                <ContextMenuItem key={t.id} onClick={() => onMove(t.id)}>
                  📁 {t.name}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="w-3.5 h-3.5 mr-2" />
          Excluir
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

/** Item de asset no grid */
function AssetItem({
  asset,
  isMaster,
  allFolders,
  onSelect,
  onRename,
  onDelete,
  onMove,
  onCategoryChange,
}: {
  asset: CampaignAsset;
  isMaster: boolean;
  allFolders: AssetFolder[];
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
  onMove: (targetId: string | null) => void;
  onCategoryChange: (category: AssetCategory) => void;
}) {
  const CategoryIcon = CATEGORY_MAP[asset.category]?.icon || ImageIcon;

  const content = (
    <div
      className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border/50 hover:bg-accent/50 hover:border-primary/30 cursor-pointer transition-colors group"
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-square rounded overflow-hidden bg-muted/50">
        {asset.file_type.startsWith('image/') ? (
          <img
            src={asset.file_url}
            alt={asset.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        {/* Badge de categoria */}
        <div className="absolute top-1 right-1">
          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
            <CategoryIcon className="w-2.5 h-2.5 mr-0.5" />
            {CATEGORY_MAP[asset.category]?.label || 'Geral'}
          </Badge>
        </div>
      </div>
      <span className="text-xs text-center truncate w-full">{asset.name}</span>
    </div>
  );

  if (!isMaster) return content;

  return (
    <ContextMenu>
      <ContextMenuTrigger>{content}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onSelect}>
          <Target className="w-3.5 h-3.5 mr-2" />
          Colocar no mapa
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onRename}>
          <Pencil className="w-3.5 h-3.5 mr-2" />
          Renomear
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Tag className="w-3.5 h-3.5 mr-2" />
            Categoria
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {Object.entries(CATEGORY_MAP).map(([key, { label, icon: Icon }]) => (
              <ContextMenuItem
                key={key}
                onClick={() => onCategoryChange(key as AssetCategory)}
                className={cn(asset.category === key && 'bg-accent')}
              >
                <Icon className="w-3.5 h-3.5 mr-2" />
                {label}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        {allFolders.length > 0 && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <FolderInput className="w-3.5 h-3.5 mr-2" />
              Mover para...
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem onClick={() => onMove(null)}>
                📁 Raiz
              </ContextMenuItem>
              {allFolders.map(f => (
                <ContextMenuItem key={f.id} onClick={() => onMove(f.id)}>
                  📁 {f.name}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="w-3.5 h-3.5 mr-2" />
          Excluir
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default MapAssetsPanel;

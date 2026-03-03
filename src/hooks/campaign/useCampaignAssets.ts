/**
 * useCampaignAssets - Hook para gerenciamento de assets do mapa
 * 
 * Permite ao mestre organizar imagens/ícones em pastas e subpastas,
 * com upload, CRUD e navegação estilo explorador de arquivos.
 * Inclui sincronização Realtime entre usuários.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Tipos de asset
export type AssetCategory = 'token' | 'decoration' | 'effect' | 'general';

// Interface para pasta de assets
export interface AssetFolder {
  id: string;
  campaign_id: string;
  parent_id: string | null;
  name: string;
  created_by: string;
  created_at: string;
}

// Interface para asset
export interface CampaignAsset {
  id: string;
  campaign_id: string;
  folder_id: string | null;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category: AssetCategory;
  tags: string[];
  uploaded_by: string;
  created_at: string;
}

// Breadcrumb para navegação
export interface BreadcrumbItem {
  id: string | null; // null = raiz
  name: string;
}

export interface UseCampaignAssetsProps {
  campaignId: string;
  isMaster: boolean;
  enabled?: boolean;
}

export function useCampaignAssets({ campaignId, isMaster, enabled = true }: UseCampaignAssetsProps) {
  // Estado
  const [folders, setFolders] = useState<AssetFolder[]>([]);
  const [assets, setAssets] = useState<CampaignAsset[]>([]);
  const [allFolders, setAllFolders] = useState<AssetFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // ==========================================
  // Carregamento de dados
  // ==========================================

  /** Carrega todas as pastas da campanha (para breadcrumbs e navegação) */
  const loadAllFolders = useCallback(async () => {
    if (!enabled || !campaignId) return;

    const { data, error } = await supabase
      .from('campaign_asset_folders')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('name');

    if (error) {
      console.error('[useCampaignAssets] Erro ao carregar pastas:', error);
      return;
    }

    setAllFolders((data as unknown as AssetFolder[]) || []);
  }, [campaignId, enabled]);

  /** Carrega pastas e assets do nível atual */
  const loadCurrentLevel = useCallback(async () => {
    if (!enabled || !campaignId) return;
    setIsLoading(true);

    try {
      // Carrega subpastas do nível atual
      const foldersQuery = supabase
        .from('campaign_asset_folders')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('name');

      if (currentFolderId) {
        foldersQuery.eq('parent_id', currentFolderId);
      } else {
        foldersQuery.is('parent_id', null);
      }

      // Carrega assets do nível atual
      const assetsQuery = supabase
        .from('campaign_assets')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('name');

      if (currentFolderId) {
        assetsQuery.eq('folder_id', currentFolderId);
      } else {
        assetsQuery.is('folder_id', null);
      }

      const [foldersResult, assetsResult] = await Promise.all([foldersQuery, assetsQuery]);

      if (foldersResult.error) {
        console.error('[useCampaignAssets] Erro ao carregar subpastas:', foldersResult.error);
      } else {
        setFolders((foldersResult.data as unknown as AssetFolder[]) || []);
      }

      if (assetsResult.error) {
        console.error('[useCampaignAssets] Erro ao carregar assets:', assetsResult.error);
      } else {
        setAssets((assetsResult.data as unknown as CampaignAsset[]) || []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, currentFolderId, enabled]);

  // Carrega dados ao montar e quando muda de pasta
  useEffect(() => {
    loadAllFolders();
    loadCurrentLevel();
  }, [loadAllFolders, loadCurrentLevel]);

  // ==========================================
  // Realtime
  // ==========================================

  useEffect(() => {
    if (!enabled || !campaignId) return;

    const channel = supabase
      .channel(`campaign-assets-${campaignId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaign_asset_folders', filter: `campaign_id=eq.${campaignId}` },
        () => {
          loadAllFolders();
          loadCurrentLevel();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaign_assets', filter: `campaign_id=eq.${campaignId}` },
        () => {
          loadCurrentLevel();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, enabled, loadAllFolders, loadCurrentLevel]);

  // ==========================================
  // Navegação
  // ==========================================

  /** Navega para uma pasta */
  const navigateToFolder = useCallback((folderId: string | null) => {
    setCurrentFolderId(folderId);
  }, []);

  /** Volta para a pasta pai */
  const navigateUp = useCallback(() => {
    if (!currentFolderId) return;
    const currentFolder = allFolders.find(f => f.id === currentFolderId);
    setCurrentFolderId(currentFolder?.parent_id ?? null);
  }, [currentFolderId, allFolders]);

  /** Monta breadcrumbs do caminho atual */
  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    const crumbs: BreadcrumbItem[] = [{ id: null, name: 'Raiz' }];
    
    if (!currentFolderId) return crumbs;

    // Reconstrói caminho da raiz até a pasta atual
    const path: AssetFolder[] = [];
    let current = allFolders.find(f => f.id === currentFolderId);
    while (current) {
      path.unshift(current);
      current = current.parent_id ? allFolders.find(f => f.id === current!.parent_id) : undefined;
    }

    for (const folder of path) {
      crumbs.push({ id: folder.id, name: folder.name });
    }

    return crumbs;
  }, [currentFolderId, allFolders]);

  // ==========================================
  // CRUD de pastas
  // ==========================================

  /** Cria uma nova pasta no nível atual */
  const createFolder = useCallback(async (name: string) => {
    if (!isMaster) return null;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const { data, error } = await supabase
      .from('campaign_asset_folders')
      .insert({
        campaign_id: campaignId,
        parent_id: currentFolderId,
        name,
        created_by: userData.user.id,
      } as any)
      .select()
      .limit(1);

    if (error) {
      console.error('[useCampaignAssets] Erro ao criar pasta:', error);
      toast.error('Erro ao criar pasta');
      return null;
    }

    toast.success(`Pasta "${name}" criada`);
    return (data?.[0] as unknown as AssetFolder) || null;
  }, [campaignId, currentFolderId, isMaster]);

  /** Renomeia uma pasta */
  const renameFolder = useCallback(async (folderId: string, newName: string) => {
    if (!isMaster) return false;

    const { error } = await supabase
      .from('campaign_asset_folders')
      .update({ name: newName } as any)
      .eq('id', folderId);

    if (error) {
      console.error('[useCampaignAssets] Erro ao renomear pasta:', error);
      toast.error('Erro ao renomear pasta');
      return false;
    }

    toast.success('Pasta renomeada');
    return true;
  }, [isMaster]);

  /** Move uma pasta para outra pasta */
  const moveFolder = useCallback(async (folderId: string, targetParentId: string | null) => {
    if (!isMaster) return false;

    const { error } = await supabase
      .from('campaign_asset_folders')
      .update({ parent_id: targetParentId } as any)
      .eq('id', folderId);

    if (error) {
      console.error('[useCampaignAssets] Erro ao mover pasta:', error);
      toast.error('Erro ao mover pasta');
      return false;
    }

    toast.success('Pasta movida');
    return true;
  }, [isMaster]);

  /** Deleta uma pasta (cascade via FK) */
  const deleteFolder = useCallback(async (folderId: string) => {
    if (!isMaster) return false;

    const { error } = await supabase
      .from('campaign_asset_folders')
      .delete()
      .eq('id', folderId);

    if (error) {
      console.error('[useCampaignAssets] Erro ao deletar pasta:', error);
      toast.error('Erro ao deletar pasta');
      return false;
    }

    toast.success('Pasta removida');
    return true;
  }, [isMaster]);

  // ==========================================
  // CRUD de assets
  // ==========================================

  /** Faz upload de um arquivo e cria o registro na tabela */
  const uploadAsset = useCallback(async (file: File, category: AssetCategory = 'general') => {
    if (!isMaster) return null;
    setIsUploading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      // Upload para Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${campaignId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('campaign-assets')
        .upload(fileName, file);

      if (uploadError) {
        console.error('[useCampaignAssets] Erro no upload:', uploadError);
        toast.error('Erro ao fazer upload do arquivo');
        return null;
      }

      // Obtém URL pública
      const { data: urlData } = supabase.storage
        .from('campaign-assets')
        .getPublicUrl(fileName);

      // Insere registro na tabela
      const { data, error } = await supabase
        .from('campaign_assets')
        .insert({
          campaign_id: campaignId,
          folder_id: currentFolderId,
          name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
          category,
          uploaded_by: userData.user.id,
        } as any)
        .select()
        .limit(1);

      if (error) {
        console.error('[useCampaignAssets] Erro ao registrar asset:', error);
        toast.error('Erro ao registrar asset');
        return null;
      }

      toast.success(`"${file.name}" enviado`);
      return (data?.[0] as unknown as CampaignAsset) || null;
    } finally {
      setIsUploading(false);
    }
  }, [campaignId, currentFolderId, isMaster]);

  /** Renomeia um asset */
  const renameAsset = useCallback(async (assetId: string, newName: string) => {
    if (!isMaster) return false;

    const { error } = await supabase
      .from('campaign_assets')
      .update({ name: newName } as any)
      .eq('id', assetId);

    if (error) {
      console.error('[useCampaignAssets] Erro ao renomear asset:', error);
      toast.error('Erro ao renomear');
      return false;
    }

    toast.success('Asset renomeado');
    return true;
  }, [isMaster]);

  /** Move um asset para outra pasta */
  const moveAsset = useCallback(async (assetId: string, targetFolderId: string | null) => {
    if (!isMaster) return false;

    const { error } = await supabase
      .from('campaign_assets')
      .update({ folder_id: targetFolderId } as any)
      .eq('id', assetId);

    if (error) {
      console.error('[useCampaignAssets] Erro ao mover asset:', error);
      toast.error('Erro ao mover asset');
      return false;
    }

    toast.success('Asset movido');
    return true;
  }, [isMaster]);

  /** Deleta um asset (tabela + storage) */
  const deleteAsset = useCallback(async (asset: CampaignAsset) => {
    if (!isMaster) return false;

    // Remove do storage (extrai path do URL)
    const urlParts = asset.file_url.split('/campaign-assets/');
    if (urlParts.length > 1) {
      const storagePath = urlParts[1];
      await supabase.storage
        .from('campaign-assets')
        .remove([storagePath]);
    }

    // Remove da tabela
    const { error } = await supabase
      .from('campaign_assets')
      .delete()
      .eq('id', asset.id);

    if (error) {
      console.error('[useCampaignAssets] Erro ao deletar asset:', error);
      toast.error('Erro ao deletar asset');
      return false;
    }

    toast.success('Asset removido');
    return true;
  }, [isMaster]);

  /** Atualiza a categoria de um asset */
  const updateAssetCategory = useCallback(async (assetId: string, category: AssetCategory) => {
    if (!isMaster) return false;

    const { error } = await supabase
      .from('campaign_assets')
      .update({ category } as any)
      .eq('id', assetId);

    if (error) {
      console.error('[useCampaignAssets] Erro ao atualizar categoria:', error);
      return false;
    }

    return true;
  }, [isMaster]);

  return {
    // Estado
    folders,
    assets,
    allFolders,
    currentFolderId,
    isLoading,
    isUploading,
    breadcrumbs,

    // Navegação
    navigateToFolder,
    navigateUp,

    // CRUD pastas
    createFolder,
    renameFolder,
    moveFolder,
    deleteFolder,

    // CRUD assets
    uploadAsset,
    renameAsset,
    moveAsset,
    deleteAsset,
    updateAssetCategory,

    // Reload
    reload: loadCurrentLevel,
  };
}

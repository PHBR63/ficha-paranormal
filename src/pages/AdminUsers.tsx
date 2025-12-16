/**
 * Página administrativa para gerenciamento de usuários
 * Permite visualizar usuários e alterar suas permissões (Admin, Moderador, Usuário)
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  Users,
  Loader2,
  FileJson,
  Crown,
  User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipo para role do usuário
type AppRole = 'admin' | 'moderator' | 'user';

// Tipagem para usuário com role
interface UserWithRole {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role: AppRole;
}

// Configuração visual de cada role
const roleConfig: Record<AppRole, { 
  label: string; 
  icon: React.ReactNode; 
  badgeClass: string;
}> = {
  admin: {
    label: 'Administrador',
    icon: <Crown className="h-3 w-3" />,
    badgeClass: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  },
  moderator: {
    label: 'Moderador',
    icon: <Shield className="h-3 w-3" />,
    badgeClass: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  },
  user: {
    label: 'Usuário',
    icon: <User className="h-3 w-3" />,
    badgeClass: '',
  },
};

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  // Estados
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Dialog de confirmação
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    currentRole: AppRole;
    newRole: AppRole;
  } | null>(null);

  // Obter iniciais do nome
  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Buscar usuários com seus roles
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Buscar todos os profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Buscar todos os roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Mapear roles por user_id (priorizar admin > moderator)
      const roleMap = new Map<string, AppRole>();
      roles?.forEach((r) => {
        const currentRole = roleMap.get(r.user_id);
        const newRole = r.role as AppRole;
        // Priorizar admin > moderator > user
        if (!currentRole || newRole === 'admin' || (newRole === 'moderator' && currentRole === 'user')) {
          roleMap.set(r.user_id, newRole);
        }
      });

      // Combinar dados - se não tem role na tabela, é 'user'
      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => ({
        ...profile,
        role: roleMap.get(profile.user_id) || 'user'
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar lista de usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Alterar role do usuário
  const changeUserRole = async (userId: string, newRole: AppRole) => {
    setActionLoading(userId);
    try {
      // Remover roles existentes do usuário
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Se nova role não é 'user', inserir na tabela
      if (newRole !== 'user') {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });

        if (insertError) throw insertError;
      }

      toast.success(`Permissão alterada para ${roleConfig[newRole].label}`);
      fetchUsers();
    } catch (error) {
      console.error('Erro ao alterar role:', error);
      toast.error('Erro ao alterar permissão do usuário');
    } finally {
      setActionLoading(null);
      setConfirmDialog(null);
    }
  };

  // Confirmar mudança de role
  const handleConfirmChange = () => {
    if (confirmDialog) {
      changeUserRole(confirmDialog.userId, confirmDialog.newRole);
    }
  };

  // Abrir dialog de confirmação
  const openConfirmDialog = (userItem: UserWithRole, newRole: AppRole) => {
    // Não permitir alterar própria role
    if (userItem.user_id === currentUser?.id) {
      toast.error('Você não pode alterar sua própria permissão');
      return;
    }

    // Se a role é a mesma, não fazer nada
    if (userItem.role === newRole) return;

    setConfirmDialog({
      open: true,
      userId: userItem.user_id,
      userName: userItem.display_name || 'Usuário',
      currentRole: userItem.role,
      newRole,
    });
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
                  Gerenciamento de Usuários
                </p>
              </div>
            </div>
            
            {/* Navegação Admin */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/import')}
              >
                <FileJson className="h-4 w-4 mr-2" />
                Importação
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled
              >
                <Users className="h-4 w-4 mr-2" />
                Usuários
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Usuários do Sistema ({users.length})
            </CardTitle>
            <CardDescription>
              Gerencie permissões dos usuários: Administrador, Moderador ou Usuário
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum usuário cadastrado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Permissão</TableHead>
                    <TableHead className="text-right">Alterar Para</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userItem) => {
                    const isCurrentUser = userItem.user_id === currentUser?.id;
                    const isLoading = actionLoading === userItem.user_id;
                    const config = roleConfig[userItem.role];

                    return (
                      <TableRow key={userItem.user_id}>
                        {/* Avatar e Nome */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={userItem.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(userItem.display_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">
                                {userItem.display_name || 'Sem nome'}
                                {isCurrentUser && (
                                  <span className="text-xs text-muted-foreground ml-2">(você)</span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {userItem.user_id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Data de cadastro */}
                        <TableCell className="text-muted-foreground">
                          {format(new Date(userItem.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>

                        {/* Badge da role atual */}
                        <TableCell>
                          <Badge 
                            variant={userItem.role === 'user' ? 'secondary' : 'outline'}
                            className={`gap-1 ${config.badgeClass}`}
                          >
                            {config.icon}
                            {config.label}
                          </Badge>
                        </TableCell>

                        {/* Select para alterar role */}
                        <TableCell className="text-right">
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                          ) : (
                            <Select
                              value={userItem.role}
                              onValueChange={(value: AppRole) => openConfirmDialog(userItem, value)}
                              disabled={isCurrentUser}
                            >
                              <SelectTrigger className="w-44 ml-auto">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">
                                  <div className="flex items-center gap-2">
                                    <Crown className="h-4 w-4 text-amber-500" />
                                    Administrador
                                  </div>
                                </SelectItem>
                                <SelectItem value="moderator">
                                  <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-blue-500" />
                                    Moderador
                                  </div>
                                </SelectItem>
                                <SelectItem value="user">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    Usuário
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Confirmação */}
      <AlertDialog 
        open={!!confirmDialog?.open} 
        onOpenChange={() => setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de permissão</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {confirmDialog && (
                  <span>
                    Deseja alterar a permissão de <strong>{confirmDialog.userName}</strong> de{' '}
                    <Badge 
                      variant={confirmDialog.currentRole === 'user' ? 'secondary' : 'outline'}
                      className={`mx-1 gap-1 ${roleConfig[confirmDialog.currentRole].badgeClass}`}
                    >
                      {roleConfig[confirmDialog.currentRole].icon}
                      {roleConfig[confirmDialog.currentRole].label}
                    </Badge>{' '}
                    para{' '}
                    <Badge 
                      variant={confirmDialog.newRole === 'user' ? 'secondary' : 'outline'}
                      className={`mx-1 gap-1 ${roleConfig[confirmDialog.newRole].badgeClass}`}
                    >
                      {roleConfig[confirmDialog.newRole].icon}
                      {roleConfig[confirmDialog.newRole].label}
                    </Badge>
                    ?
                  </span>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmChange}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Página administrativa para gerenciamento de usuários
 * Permite visualizar usuários e promover/remover roles de admin
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
  ShieldOff, 
  Users,
  Loader2,
  FileJson,
  Crown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipagem para usuário com role
interface UserWithRole {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role: 'admin' | 'moderator' | 'user' | null;
}

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
    action: 'promote' | 'demote';
    userId: string;
    userName: string;
  }>({ open: false, action: 'promote', userId: '', userName: '' });

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

      // Buscar todos os roles de admin
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combinar dados
      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          role: userRole?.role || null
        };
      });

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

  // Promover usuário a admin
  const promoteToAdmin = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      if (error) throw error;

      toast.success('Usuário promovido a administrador!');
      fetchUsers();
    } catch (error: unknown) {
      console.error('Erro ao promover usuário:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao promover usuário: ${errorMessage}`);
    } finally {
      setActionLoading(null);
      setConfirmDialog({ open: false, action: 'promote', userId: '', userName: '' });
    }
  };

  // Remover role de admin
  const demoteFromAdmin = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) throw error;

      toast.success('Permissão de administrador removida');
      fetchUsers();
    } catch (error: unknown) {
      console.error('Erro ao remover admin:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao remover permissão: ${errorMessage}`);
    } finally {
      setActionLoading(null);
      setConfirmDialog({ open: false, action: 'promote', userId: '', userName: '' });
    }
  };

  // Confirmar ação
  const handleConfirmAction = () => {
    if (confirmDialog.action === 'promote') {
      promoteToAdmin(confirmDialog.userId);
    } else {
      demoteFromAdmin(confirmDialog.userId);
    }
  };

  // Obter iniciais do nome
  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
              Usuários do Sistema
            </CardTitle>
            <CardDescription>
              Gerencie permissões de administrador para os usuários cadastrados
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
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const isCurrentUser = user.user_id === currentUser?.id;
                    const isAdmin = user.role === 'admin';
                    const isLoading = actionLoading === user.user_id;

                    return (
                      <TableRow key={user.user_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(user.display_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">
                                {user.display_name || 'Sem nome'}
                                {isCurrentUser && (
                                  <span className="text-xs text-muted-foreground ml-2">(você)</span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {user.user_id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {isAdmin ? (
                            <Badge variant="default" className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                              <Crown className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Usuário
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isAdmin ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={isCurrentUser || isLoading}
                              onClick={() => setConfirmDialog({
                                open: true,
                                action: 'demote',
                                userId: user.user_id,
                                userName: user.display_name || 'este usuário'
                              })}
                            >
                              {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <ShieldOff className="h-4 w-4 mr-1" />
                                  Remover Admin
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:text-primary hover:bg-primary/10"
                              disabled={isLoading}
                              onClick={() => setConfirmDialog({
                                open: true,
                                action: 'promote',
                                userId: user.user_id,
                                userName: user.display_name || 'este usuário'
                              })}
                            >
                              {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Shield className="h-4 w-4 mr-1" />
                                  Promover
                                </>
                              )}
                            </Button>
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
        open={confirmDialog.open} 
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'promote' 
                ? 'Promover a Administrador?' 
                : 'Remover Administrador?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'promote' 
                ? `${confirmDialog.userName} terá acesso total às funcionalidades administrativas do sistema.`
                : `${confirmDialog.userName} perderá acesso às funcionalidades administrativas do sistema.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={confirmDialog.action === 'demote' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {confirmDialog.action === 'promote' ? 'Promover' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

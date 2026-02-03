/**
 * AdminNav - Navegação unificada para páginas administrativas
 * Exibe links para todas as seções admin com destaque na página atual
 */
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Database, 
  Users, 
  FileJson, 
  ChevronRight,
  Home,
  Shield
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Configuração de páginas admin
const adminPages = [
  {
    id: 'integrity',
    path: '/admin/data-integrity',
    label: 'Integridade',
    icon: Database,
    description: 'Validação de dados e regras'
  },
  {
    id: 'users',
    path: '/admin/users',
    label: 'Usuários',
    icon: Users,
    description: 'Gerenciamento de permissões'
  },
  {
    id: 'import',
    path: '/admin/import',
    label: 'Importação',
    icon: FileJson,
    description: 'Importar dados em lote'
  }
] as const;

type AdminPageId = typeof adminPages[number]['id'];

interface AdminNavProps {
  /** Página atual selecionada */
  currentPage?: AdminPageId;
  /** Classe CSS adicional para o container */
  className?: string;
}

/**
 * Componente de navegação para páginas administrativas
 * Inclui breadcrumbs e links para todas as seções admin
 */
export function AdminNav({ currentPage, className }: AdminNavProps) {
  const location = useLocation();
  
  // Detecta página atual baseado na rota se não foi passado explicitamente
  const activePage = currentPage || adminPages.find(p => location.pathname === p.path)?.id;
  const currentPageData = adminPages.find(p => p.id === activePage);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/dashboard" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <Home className="h-3.5 w-3.5" />
                <span>Início</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          <BreadcrumbSeparator>
            <ChevronRight className="h-3.5 w-3.5" />
          </BreadcrumbSeparator>
          
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/admin/data-integrity" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <Shield className="h-3.5 w-3.5" />
                <span>Administração</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          {currentPageData && (
            <>
              <BreadcrumbSeparator>
                <ChevronRight className="h-3.5 w-3.5" />
              </BreadcrumbSeparator>
              
              <BreadcrumbItem>
                <BreadcrumbPage className="flex items-center gap-1.5 font-medium">
                  <currentPageData.icon className="h-3.5 w-3.5" />
                  <span>{currentPageData.label}</span>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Links de navegação */}
      <nav className="flex flex-wrap gap-2">
        {adminPages.map((page) => {
          const Icon = page.icon;
          const isActive = page.id === activePage;
          
          return (
            <Link
              key={page.id}
              to={page.path}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                'hover:bg-muted',
                isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{page.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default AdminNav;

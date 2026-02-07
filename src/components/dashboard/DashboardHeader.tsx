/**
 * DashboardHeader - Header compacto do dashboard com identidade do agente
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeSelector } from '@/components/ui/theme-selector';
import { LogoBox } from '@/components/ui/logo';
import { LogOut, User, Smartphone, Shield, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks';

interface DashboardHeaderProps {
  displayName: string;
  hasLowStats: boolean;
}

export function DashboardHeader({ displayName, hasLowStats }: DashboardHeaderProps) {
  const { signOut } = useAuth();
  const { isAdmin } = useAdminCheck();

  return (
    <header className="relative z-10 border-b border-primary/20 backdrop-blur-sm sticky top-0 bg-background/80">
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
          <LogoBox size="md" animate={hasLowStats} />
          <div>
            <h1 className="font-display text-lg sm:text-xl tracking-wide text-foreground">LET'S ROLL</h1>
            <p className="text-[9px] sm:text-[10px] text-primary tracking-[0.15em] sm:tracking-[0.2em] uppercase hidden sm:block">
              Central de Operações
            </p>
          </div>
        </Link>

        {/* Ações do header */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeSelector />
          
          {isAdmin && (
            <Link to="/admin/import" className="hidden sm:flex">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-primary/10">
                <Shield className="w-5 h-5" />
              </Button>
            </Link>
          )}
          
          <Link to="/my-templates" className="hidden sm:flex">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-primary/10">
              <Package className="w-5 h-5" />
            </Button>
          </Link>

          <Link to="/install" className="hidden sm:flex">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-primary/10">
              <Smartphone className="w-5 h-5" />
            </Button>
          </Link>

          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-4 h-4" />
            <span className="text-sm hidden md:block">{displayName}</span>
          </div>

          <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground hover:text-foreground hover:bg-primary/10">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

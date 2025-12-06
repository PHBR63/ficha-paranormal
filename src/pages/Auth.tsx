import { useState, useEffect } from 'react';
import { useSearchParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skull, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  displayName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
});

export default function Auth() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setMode(searchParams.get('mode') === 'signup' ? 'signup' : 'signin');
  }, [searchParams]);

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const validateForm = () => {
    try {
      const data: Record<string, string> = { email, password };
      if (mode === 'signup' && displayName) {
        data.displayName = displayName;
      }
      authSchema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Acesso Negado',
              description: 'Credenciais inválidas. Verifique seu email e senha.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erro de Autenticação',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Acesso Autorizado',
            description: 'Bem-vindo de volta, Agente.',
          });
        }
      } else {
        const { error } = await signUp(email, password, displayName || undefined);
        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              title: 'Registro Existente',
              description: 'Este email já está cadastrado. Tente fazer login.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erro no Registro',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Registro Completo',
            description: 'Bem-vindo à Ordo Realitas, Agente.',
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      {/* Background effects */}
      <div className="noise-overlay" />
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/10 via-transparent to-transparent blur-3xl" />
      
      {/* Back button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Voltar</span>
      </Link>

      {/* Auth card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="dossier-card p-8 animate-scale-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4">
              <Skull className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl tracking-wide text-foreground">
              {mode === 'signin' ? 'ACESSO RESTRITO' : 'NOVO REGISTRO'}
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              {mode === 'signin' ? 'Identifique-se para continuar' : 'Crie sua credencial de agente'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-xs text-muted-foreground uppercase tracking-wider">
                  Codinome
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Como deseja ser chamado?"
                  className="terminal-input h-12"
                  disabled={loading}
                />
                {errors.displayName && (
                  <p className="text-destructive text-xs">{errors.displayName}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs text-muted-foreground uppercase tracking-wider">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agente@ordo.gov"
                className="terminal-input h-12"
                disabled={loading}
              />
              {errors.email && (
                <p className="text-destructive text-xs">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs text-muted-foreground uppercase tracking-wider">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="terminal-input h-12 pr-12"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-xs">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 action-button font-display text-lg tracking-wide"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                mode === 'signin' ? 'AUTENTICAR' : 'REGISTRAR'
              )}
            </Button>
          </form>

          {/* Toggle mode */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              {mode === 'signin' ? (
                <>Não tem cadastro? <span className="text-accent">Registre-se</span></>
              ) : (
                <>Já tem conta? <span className="text-accent">Faça login</span></>
              )}
            </button>
          </div>

          {/* Classified stamp */}
          <div className="classified-stamp -bottom-4 -right-4 text-2xl">CONFIDENCIAL</div>
        </div>
      </div>
    </div>
  );
}

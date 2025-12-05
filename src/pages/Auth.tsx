import { useState, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Loader2, Eye, EyeOff } from 'lucide-react';
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
              title: 'Acesso negado',
              description: 'Email ou senha incorretos. Verifique suas credenciais.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erro ao entrar',
              description: error.message,
              variant: 'destructive',
            });
          }
        }
      } else {
        const { error } = await signUp(email, password, displayName || undefined);
        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              title: 'Usuário já cadastrado',
              description: 'Este email já está registrado. Tente fazer login.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erro ao criar conta',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Conta criada!',
            description: 'Bem-vindo à Ordo Realitas, agente.',
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-paranormal/5" />
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-primary/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-[200px] h-[200px] bg-paranormal/10 blur-[100px] rounded-full" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="ordo-panel p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 border border-primary rounded-sm mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl tracking-wider mb-2">
              {mode === 'signin' ? 'ACESSO AO SISTEMA' : 'RECRUTAMENTO'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {mode === 'signin' 
                ? 'Identifique-se para acessar os arquivos da Ordo' 
                : 'Preencha seus dados para iniciar o processo'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-muted-foreground">
                  CODINOME
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Como deseja ser chamado?"
                  className="bg-muted/50 border-border focus:border-primary"
                />
                {errors.displayName && (
                  <p className="text-destructive text-xs">{errors.displayName}</p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground">
                EMAIL
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="bg-muted/50 border-border focus:border-primary"
                required
              />
              {errors.email && (
                <p className="text-destructive text-xs">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground">
                SENHA
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-muted/50 border-border focus:border-primary pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-xs">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full font-display tracking-wider mt-6"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {mode === 'signin' ? 'ACESSAR' : 'CADASTRAR'}
            </Button>
          </form>

          {/* Toggle mode */}
          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              {mode === 'signin' ? 'Ainda não é um agente?' : 'Já possui cadastro?'}
            </p>
            <button
              type="button"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-secondary hover:text-secondary/80 text-sm font-medium mt-1"
            >
              {mode === 'signin' ? 'Criar conta' : 'Fazer login'}
            </button>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-4">
          <a href="/" className="text-muted-foreground hover:text-foreground text-sm">
            ← Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

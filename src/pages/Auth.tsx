/**
 * Página de autenticação com login, cadastro e recuperação de senha
 * Utiliza tokens semânticos do tema e indicador de força de senha
 */
import { useState, useEffect } from 'react';
import { useSearchParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast, useThemeColors } from '@/hooks';
import { Particles } from '@/components/ui/particles';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { DecryptedText } from '@/components/ui/decrypted-text';
import { Loader2, ArrowLeft, EyeOff, Eye as EyeIcon, KeyRound, Mail } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { z } from 'zod';

// Schemas de validação para cada modo
const signinSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

const signupSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  displayName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
});

const forgotSchema = z.object({
  email: z.string().email('Email inválido'),
});

const resetSchema = z.object({
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirme sua nova senha'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';

// Configuração de cada modo de autenticação
const MODE_CONFIG: Record<AuthMode, { title: string; subtitle: string }> = {
  signin: { title: 'ACESSO RESTRITO', subtitle: 'Identifique-se para continuar' },
  signup: { title: 'NOVO REGISTRO', subtitle: 'Crie sua credencial de agente' },
  forgot: { title: 'RECUPERAR ACESSO', subtitle: 'Enviaremos instruções por email' },
  reset: { title: 'NOVA SENHA', subtitle: 'Defina sua nova credencial' },
};

export default function Auth() {
  const [searchParams] = useSearchParams();
  
  // Determinar modo inicial baseado em query params
  const getInitialMode = (): AuthMode => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'signup') return 'signup';
    if (modeParam === 'forgot') return 'forgot';
    if (modeParam === 'reset') return 'reset';
    return 'signin';
  };

  const [mode, setMode] = useState<AuthMode>(getInitialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  const { signIn, signUp, user, resetPassword, updatePassword } = useAuth();
  const { toast } = useToast();
  const themeColors = useThemeColors();

  // Atualizar modo quando query params mudam
  useEffect(() => {
    setMode(getInitialMode());
  }, [searchParams]);

  // Redirecionar se já autenticado (exceto no modo reset)
  if (user && mode !== 'reset') {
    return <Navigate to="/dashboard" replace />;
  }

  // Validação de formulário
  const validateForm = () => {
    try {
      let schema;
      let data: Record<string, string> = {};
      
      switch (mode) {
        case 'signin':
          schema = signinSchema;
          data = { email, password };
          break;
        case 'signup':
          schema = signupSchema;
          data = { email, password };
          if (displayName) data.displayName = displayName;
          break;
        case 'forgot':
          schema = forgotSchema;
          data = { email };
          break;
        case 'reset':
          schema = resetSchema;
          data = { password, confirmPassword };
          break;
      }
      
      schema.parse(data);
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

  // Handler de submissão
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      switch (mode) {
        case 'signin': {
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
          break;
        }
        
        case 'signup': {
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
          break;
        }
        
        case 'forgot': {
          const { error } = await resetPassword(email);
          if (error) {
            toast({
              title: 'Erro ao Enviar',
              description: error.message,
              variant: 'destructive',
            });
          } else {
            setResetEmailSent(true);
            toast({
              title: 'Email Enviado',
              description: 'Verifique sua caixa de entrada para redefinir a senha.',
            });
          }
          break;
        }
        
        case 'reset': {
          const { error } = await updatePassword(password);
          if (error) {
            toast({
              title: 'Erro ao Atualizar',
              description: error.message,
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Senha Atualizada',
              description: 'Sua nova credencial foi definida com sucesso.',
            });
            setMode('signin');
          }
          break;
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Trocar modo e limpar estado
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    setResetEmailSent(false);
    if (newMode !== 'reset') {
      setPassword('');
      setConfirmPassword('');
    }
  };

  // Validação em tempo real de email
  const handleEmailChange = (value: string) => {
    setEmail(value);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      setErrors(prev => ({ ...prev, email: 'Email inválido' }));
    } else {
      setErrors(prev => { const { email: _, ...rest } = prev; return rest; });
    }
  };

  // Validação em tempo real de senha
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value && value.length < 6) {
      setErrors(prev => ({ ...prev, password: 'A senha deve ter pelo menos 6 caracteres' }));
    } else {
      setErrors(prev => { const { password: _, ...rest } = prev; return rest; });
    }
  };

  // Validação em tempo real de confirmação
  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (value && value !== password) {
      setErrors(prev => ({ ...prev, confirmPassword: 'As senhas não coincidem' }));
    } else {
      setErrors(prev => { const { confirmPassword: _, ...rest } = prev; return rest; });
    }
  };

  // Validação de email válido
  const isEmailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password && password.length >= 6;
  const isConfirmValid = confirmPassword && confirmPassword === password;

  // Classes de input com estado de validação
  const getInputClasses = (field: 'email' | 'password' | 'confirmPassword' | 'displayName', isValid: boolean) => {
    const baseClasses = 'h-11 sm:h-12 text-sm sm:text-base bg-background/50 border-primary/30 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary/20 transition-all';
    
    if (errors[field]) {
      return `${baseClasses} border-destructive ring-1 ring-destructive/50`;
    }
    if (isValid) {
      return `${baseClasses} border-emerald-600/50 ring-1 ring-emerald-600/30`;
    }
    return baseClasses;
  };

  const currentConfig = MODE_CONFIG[mode];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      {/* Background gradient - Dynamic */}
      <div className="absolute inset-0 bg-landing-gradient-theme" />
      
      {/* Flickering Grid - Dynamic color */}
      <FlickeringGrid 
        className="opacity-20"
        squareSize={3}
        gridGap={6}
        flickerChance={0.25}
        color={`rgb(${themeColors.rgb})`}
        maxOpacity={0.25}
      />
      
      {/* Noise texture */}
      <div className="absolute inset-0 landing-noise pointer-events-none" />
      
      {/* Mist effect - Dynamic color */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[150px] animate-red-mist"
          style={{ backgroundColor: `${themeColors.primary}18` }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] animate-red-mist"
          style={{ backgroundColor: `${themeColors.secondary}12`, animationDelay: '4s' }}
        />
      </div>
      
      {/* Scan lines */}
      <div className="absolute inset-0 scan-lines opacity-20 pointer-events-none" />
      
      {/* Particles - Dynamic color */}
      <Particles
        className="absolute inset-0 z-[1]"
        quantity={30}
        color={themeColors.primary}
        size={1.3}
        vx={0}
        vy={-0.2}
        staticity={80}
        ease={100}
      />
      
      {/* Vignette - Dynamic */}
      <div className="absolute inset-0 vignette-theme pointer-events-none" />
      
      {/* Back button */}
      <Link 
        to="/" 
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm hidden sm:inline">Voltar</span>
      </Link>

      {/* Auth card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="relative p-6 sm:p-8 rounded-xl bg-gradient-to-b from-card to-background border border-primary/30 shadow-[0_0_40px_hsl(var(--primary)/0.15)] animate-scale-in">
          
          {/* Static noise overlay on card */}
          <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none z-0">
            <div className="absolute inset-0 landing-noise opacity-20" />
          </div>
          
          {/* Header */}
          <div className="relative text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <Logo size="lg" animate glow />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl tracking-wide text-foreground">
              <DecryptedText 
                text={currentConfig.title} 
                speed={35}
              />
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-2 font-mono">
              {currentConfig.subtitle}
            </p>
          </div>

          {/* Mensagem de email enviado (modo forgot) */}
          {mode === 'forgot' && resetEmailSent ? (
            <div className="relative space-y-4 text-center">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <Mail className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-sm text-foreground mb-1">Email enviado com sucesso!</p>
                <p className="text-xs text-muted-foreground">
                  Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => switchMode('signin')}
                className="text-primary hover:text-primary/80"
              >
                Voltar ao login
              </Button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="relative space-y-4 sm:space-y-5">
              {/* Campo Codinome - apenas signup */}
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-[10px] text-primary uppercase tracking-[0.15em] font-mono">
                    Codinome
                  </Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onBlur={() => {
                      if (displayName && displayName.length < 2) {
                        setErrors(prev => ({ ...prev, displayName: 'Nome deve ter pelo menos 2 caracteres' }));
                      } else {
                        setErrors(prev => { const { displayName: _, ...rest } = prev; return rest; });
                      }
                    }}
                    placeholder="Como deseja ser chamado?"
                    className={getInputClasses('displayName', displayName.length >= 2)}
                    disabled={loading}
                  />
                  {errors.displayName && (
                    <p className="text-destructive text-xs animate-fade-in font-mono">{errors.displayName}</p>
                  )}
                </div>
              )}

              {/* Campo Email - signin, signup, forgot */}
              {(mode === 'signin' || mode === 'signup' || mode === 'forgot') && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] text-primary uppercase tracking-[0.15em] font-mono">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="agente@ordo.gov"
                    className={getInputClasses('email', isEmailValid)}
                    disabled={loading}
                  />
                  {errors.email && (
                    <p className="text-destructive text-xs animate-fade-in font-mono">{errors.email}</p>
                  )}
                </div>
              )}

              {/* Campo Senha - signin, signup, reset */}
              {(mode === 'signin' || mode === 'signup' || mode === 'reset') && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[10px] text-primary uppercase tracking-[0.15em] font-mono">
                    {mode === 'reset' ? 'Nova Senha' : 'Senha'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      placeholder="••••••••"
                      className={`${getInputClasses('password', isPasswordValid)} pr-12`}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-destructive text-xs animate-fade-in font-mono">{errors.password}</p>
                  )}
                  
                  {/* Indicador de força - signup e reset */}
                  {(mode === 'signup' || mode === 'reset') && (
                    <PasswordStrengthIndicator password={password} className="mt-3" />
                  )}
                </div>
              )}

              {/* Campo Confirmar Senha - apenas reset */}
              {mode === 'reset' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-[10px] text-primary uppercase tracking-[0.15em] font-mono">
                    Confirmar Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                      placeholder="••••••••"
                      className={`${getInputClasses('confirmPassword', isConfirmValid)} pr-12`}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-destructive text-xs animate-fade-in font-mono">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              {/* Link "Esqueci minha senha" - apenas signin */}
              {mode === 'signin' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors font-mono"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              )}

              {/* Botão de submit */}
              <Button
                type="submit"
                className="w-full h-11 sm:h-12 font-display text-base sm:text-lg tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] transition-all"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    {mode === 'forgot' && <Mail className="w-4 h-4 mr-2" />}
                    {mode === 'reset' && <KeyRound className="w-4 h-4 mr-2" />}
                    {mode === 'signin' && 'AUTENTICAR'}
                    {mode === 'signup' && 'REGISTRAR'}
                    {mode === 'forgot' && 'ENVIAR EMAIL'}
                    {mode === 'reset' && 'DEFINIR SENHA'}
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Toggle mode - não mostrar em forgot/reset quando email já foi enviado */}
          {!(mode === 'forgot' && resetEmailSent) && (
            <div className="relative mt-6 text-center">
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 active:scale-95 py-2 px-4 rounded-lg hover:bg-primary/10"
                >
                  Não tem cadastro? <span className="text-primary font-medium">Registre-se</span>
                </button>
              )}
              
              {mode === 'signup' && (
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 active:scale-95 py-2 px-4 rounded-lg hover:bg-primary/10"
                >
                  Já tem conta? <span className="text-primary font-medium">Faça login</span>
                </button>
              )}
              
              {(mode === 'forgot' || mode === 'reset') && (
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 active:scale-95 py-2 px-4 rounded-lg hover:bg-primary/10"
                >
                  <ArrowLeft className="w-3 h-3 inline mr-1" />
                  Voltar ao login
                </button>
              )}
            </div>
          )}

          {/* Classified stamp */}
          <div className="absolute -bottom-3 -right-3 text-primary/20 font-display text-3xl tracking-widest rotate-[-12deg] select-none animate-stamp">
            CONFIDENCIAL
          </div>
        </div>
      </div>
    </div>
  );
}

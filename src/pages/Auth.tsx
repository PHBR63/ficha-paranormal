import { useState, useEffect } from 'react';
import { useSearchParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Particles } from '@/components/ui/particles';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { DecryptedText } from '@/components/ui/decrypted-text';
import { Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { useThemeColors } from '@/hooks/useThemeColors';

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

  // Theme colors for dynamic effects
  const themeColors = useThemeColors();

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
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-2 text-[#808080] hover:text-[#F5F5F5] transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm hidden sm:inline">Voltar</span>
      </Link>

      {/* Auth card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="relative p-6 sm:p-8 rounded-xl bg-gradient-to-b from-[#1A1214] to-[#0D0A0B] border border-[#8B0000]/30 shadow-[0_0_40px_rgba(139,0,0,0.15)] animate-scale-in">
          
          {/* Static noise overlay on card */}
          <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
            <div className="absolute inset-0 landing-noise opacity-50" />
          </div>
          
          {/* Header */}
          <div className="relative text-center mb-6 sm:mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#8B0000]/20 border border-[#8B0000]/40 flex items-center justify-center mx-auto mb-3 sm:mb-4 relative">
              <div className="absolute inset-0 bg-[#8B0000]/20 rounded-xl blur-xl animate-pulse" />
              <Eye className="w-7 h-7 sm:w-8 sm:h-8 text-[#B22222] relative animate-pulse" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl tracking-wide text-[#F5F5F5]">
              <DecryptedText 
                text={mode === 'signin' ? 'ACESSO RESTRITO' : 'NOVO REGISTRO'} 
                speed={35}
              />
            </h1>
            <p className="text-[#808080] text-xs sm:text-sm mt-2 font-mono">
              {mode === 'signin' ? 'Identifique-se para continuar' : 'Crie sua credencial de agente'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="relative space-y-4 sm:space-y-5">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-[10px] text-[#8B0000] uppercase tracking-[0.15em] font-mono">
                  Codinome
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onBlur={() => {
                    if (displayName && displayName.length < 2) {
                      setErrors(prev => ({ ...prev, displayName: 'Nome deve ter pelo menos 2 caracteres' }));
                    } else {
                      setErrors(prev => { const { displayName, ...rest } = prev; return rest; });
                    }
                  }}
                  placeholder="Como deseja ser chamado?"
                  className={`h-11 sm:h-12 text-sm sm:text-base bg-[#0D0A0B]/50 border-[#8B0000]/30 text-[#F5F5F5] placeholder:text-[#505050] focus:border-[#8B0000] focus:ring-[#8B0000]/20 transition-all ${
                    errors.displayName ? 'border-red-500 ring-1 ring-red-500/50' : 
                    displayName && displayName.length >= 2 ? 'border-green-600/50 ring-1 ring-green-600/30' : ''
                  }`}
                  disabled={loading}
                />
                {errors.displayName && (
                  <p className="text-red-400 text-xs animate-fade-in font-mono">{errors.displayName}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] text-[#8B0000] uppercase tracking-[0.15em] font-mono">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (e.target.value && !emailRegex.test(e.target.value)) {
                    setErrors(prev => ({ ...prev, email: 'Email inválido' }));
                  } else {
                    setErrors(prev => { const { email, ...rest } = prev; return rest; });
                  }
                }}
                placeholder="agente@ordo.gov"
                className={`h-11 sm:h-12 text-sm sm:text-base bg-[#0D0A0B]/50 border-[#8B0000]/30 text-[#F5F5F5] placeholder:text-[#505050] focus:border-[#8B0000] focus:ring-[#8B0000]/20 transition-all ${
                  errors.email ? 'border-red-500 ring-1 ring-red-500/50' : 
                  email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'border-green-600/50 ring-1 ring-green-600/30' : ''
                }`}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-red-400 text-xs animate-fade-in font-mono">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] text-[#8B0000] uppercase tracking-[0.15em] font-mono">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (e.target.value && e.target.value.length < 6) {
                      setErrors(prev => ({ ...prev, password: 'A senha deve ter pelo menos 6 caracteres' }));
                    } else {
                      setErrors(prev => { const { password, ...rest } = prev; return rest; });
                    }
                  }}
                  placeholder="••••••••"
                  className={`h-11 sm:h-12 pr-12 text-sm sm:text-base bg-[#0D0A0B]/50 border-[#8B0000]/30 text-[#F5F5F5] placeholder:text-[#505050] focus:border-[#8B0000] focus:ring-[#8B0000]/20 transition-all ${
                    errors.password ? 'border-red-500 ring-1 ring-red-500/50' : 
                    password && password.length >= 6 ? 'border-green-600/50 ring-1 ring-green-600/30' : ''
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] hover:text-[#F5F5F5] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs animate-fade-in font-mono">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 sm:h-12 font-display text-base sm:text-lg tracking-wide bg-[#8B0000] hover:bg-[#B22222] text-white border border-[#B22222]/30 shadow-[0_0_20px_rgba(139,0,0,0.3)] hover:shadow-[0_0_30px_rgba(139,0,0,0.5)] transition-all"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                mode === 'signin' ? 'AUTENTICAR' : 'REGISTRAR'
              )}
            </Button>
          </form>

          {/* Toggle mode */}
          <div className="relative mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setErrors({});
              }}
              className="text-sm text-[#808080] hover:text-[#F5F5F5] transition-all duration-300 hover:scale-105 active:scale-95 py-2 px-4 rounded-lg hover:bg-[#8B0000]/10"
            >
              {mode === 'signin' ? (
                <>Não tem cadastro? <span className="text-[#B22222] font-medium">Registre-se</span></>
              ) : (
                <>Já tem conta? <span className="text-[#B22222] font-medium">Faça login</span></>
              )}
            </button>
          </div>

          {/* Classified stamp */}
          <div className="absolute -bottom-3 -right-3 text-[#8B0000]/20 font-display text-3xl tracking-widest rotate-[-12deg] select-none animate-stamp">
            CONFIDENCIAL
          </div>
        </div>
      </div>
    </div>
  );
}

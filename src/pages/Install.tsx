import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { usePWAInstall, usePWAUpdate, useThemeColors } from "@/hooks";
import { Particles } from "@/components/ui/particles";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { DecryptedText } from "@/components/ui/decrypted-text";
import { ParanormalElementIcon } from "@/components/ui/paranormal-element-icon";
import { Logo } from "@/components/ui/logo";
import { 
  Download, 
  Smartphone, 
  CheckCircle2, 
  Share, 
  PlusSquare,
  ArrowLeft,
  Zap,
  Wifi,
  Bell,
  ExternalLink,
  RotateCcw,
  PartyPopper,
  RefreshCw,
  Loader2
} from '@/components/icons/ordem-icons';
// useThemeColors já importado acima
import confetti from "canvas-confetti";

export default function Install() {
  const navigate = useNavigate();
  const { 
    isInstallable, 
    isInstalled,
    isStandalone,
    isIOS, 
    isAndroid, 
    promptInstall, 
    debugInfo,
    showBrowserInstructions,
    clearServiceWorkerCache,
    justInstalled,
    resetInstallState
  } = usePWAInstall();
  const themeColors = useThemeColors();
  const [showDebug, setShowDebug] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  // Hook de atualização do PWA
  const {
    hasUpdate,
    isChecking: isCheckingUpdate,
    isUpdating,
    lastChecked,
    error: updateError,
    checkForUpdate,
    applyUpdate,
  } = usePWAUpdate();

  // Verifica atualizações automaticamente quando o app já está instalado
  useEffect(() => {
    if (isInstalled) {
      checkForUpdate();
    }
  }, [isInstalled, checkForUpdate]);

  // Dispara confetti quando o app é instalado
  useEffect(() => {
    if (justInstalled) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8B0000', '#B22222', '#FF4444', '#FFD700']
      });
    }
  }, [justInstalled]);

  const handleInstall = async () => {
    await promptInstall();
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    await clearServiceWorkerCache();
  };

  const features = [
    { icon: Zap, title: "Acesso Rápido", description: "Abra direto da tela inicial", element: 'energia' as const },
    { icon: Wifi, title: "Funciona Offline", description: "Fichas disponíveis sem internet", element: 'conhecimento' as const },
    { icon: Bell, title: "Notificações", description: "Alertas de sessões e mensagens", element: 'medo' as const },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects - Dynamic */}
      <div className="absolute inset-0 bg-landing-gradient-theme" />
      <FlickeringGrid className="opacity-20" squareSize={4} gridGap={8} flickerChance={0.2} color={`rgb(${themeColors.rgb})`} maxOpacity={0.2} />
      <div className="absolute inset-0 landing-noise pointer-events-none" />
      
      {/* Mist - Dynamic */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div 
          className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full blur-[120px] animate-red-mist"
          style={{ backgroundColor: `${themeColors.primary}14` }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full blur-[100px] animate-red-mist"
          style={{ backgroundColor: `${themeColors.secondary}10`, animationDelay: '4s' }}
        />
      </div>
      
      <div className="absolute inset-0 scan-lines opacity-15 pointer-events-none" />
      
      <Particles className="absolute inset-0 z-[1]" quantity={25} color={themeColors.primary} size={1.2} vx={0} vy={-0.15} staticity={90} ease={110} />
      
      <div className="absolute inset-0 vignette-theme pointer-events-none opacity-50" />

      {/* Header */}
      <header className="relative z-10 sticky top-0 border-b border-[#8B0000]/20 bg-[#0D0A0B]/80 backdrop-blur-sm">
        <div className="container flex h-14 items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="mr-2 text-[#808080] hover:text-[#F5F5F5] hover:bg-[#8B0000]/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-lg font-bold text-[#F5F5F5]">
            <DecryptedText text="INSTALAR APP" speed={40} />
          </h1>
        </div>
      </header>

      <main className="relative z-10 container px-4 py-8 max-w-lg mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="relative w-24 h-24 mx-auto mb-6">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-[#8B0000]/30 rounded-2xl blur-xl animate-pulse" />
            
            <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-[#8B0000]/20 to-[#1A0505] border border-[#8B0000]/40 flex items-center justify-center">
              <Logo size="xl" animate />
            </div>
          </div>
          
          <h2 className="text-2xl font-display font-bold mb-2 text-[#F5F5F5]">
            <DecryptedText text="Let's Roll no seu celular" speed={35} />
          </h2>
          <p className="text-[#808080]">
            Instale o app para uma experiência mais rápida e imersiva
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-3 mb-8"
        >
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="dossier-classified p-4 flex items-center gap-4 hover:border-[#8B0000]/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#8B0000]/10 border border-[#8B0000]/30 flex items-center justify-center shrink-0">
                <ParanormalElementIcon element={feature.element} size="sm" variant="glow" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-[#F5F5F5]">{feature.title}</h3>
                <p className="text-xs text-[#808080]">{feature.description}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Install Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Estado: App instalado e rodando em standalone */}
          {isInstalled && isStandalone ? (
            <div className="dossier-classified p-6 text-center border-green-600/30 bg-green-900/10">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <div className="mb-4">
                <h3 className="font-bold text-lg mb-1 text-[#F5F5F5]">Você está no App!</h3>
                <p className="text-sm text-[#808080]">
                  O Let's Roll está rodando em modo app
                </p>
              </div>
              
              {/* Seção de Atualizações */}
              <div className="mb-4 p-3 rounded-lg bg-background/50 border border-border/30">
                {isCheckingUpdate ? (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Verificando atualizações...</span>
                  </div>
                ) : hasUpdate ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-amber-500">
                      <RefreshCw className="w-4 h-4" />
                      <span className="text-sm font-medium">Atualização disponível!</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={applyUpdate}
                      disabled={isUpdating}
                      className="w-full bg-amber-600 hover:bg-amber-500 text-white"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Atualizando...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Aplicar Atualização
                        </>
                      )}
                    </Button>
                  </div>
                ) : updateError ? (
                  <div className="space-y-2">
                    <p className="text-xs text-red-400">{updateError}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => checkForUpdate()}
                      className="text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Tentar novamente
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-green-500">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm">Você está na versão mais recente</span>
                  </div>
                )}
                
                {lastChecked && !isCheckingUpdate && (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Última verificação: {lastChecked.toLocaleTimeString('pt-BR')}
                  </p>
                )}
              </div>
              
              <Button 
                onClick={() => navigate("/dashboard")} 
                className="w-full bg-[#8B0000] hover:bg-[#B22222] text-white border border-[#B22222]/30"
              >
                Ir para o Dashboard
              </Button>
            </div>
          ) : isInstalled && !isStandalone ? (
            /* Estado: App instalado mas acessando via navegador */
            <div className="dossier-classified p-6 text-center border-green-600/30 bg-green-900/10">
              <AnimatePresence>
                {justInstalled && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mb-4"
                  >
                    <PartyPopper className="w-12 h-12 text-yellow-500 mx-auto animate-bounce" />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {!justInstalled && (
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              )}
              
              <div className="mb-4">
                <h3 className="font-bold text-lg mb-1 text-[#F5F5F5]">
                  {justInstalled ? '🎉 App Instalado!' : 'App Instalado'}
                </h3>
                <p className="text-sm text-[#808080]">
                  {justInstalled 
                    ? 'Agora abra o app pela sua tela inicial!' 
                    : "O Let's Roll está na sua tela inicial"
                  }
                </p>
              </div>
              
              {/* Seção de Atualizações (quando não é recém instalado) */}
              {!justInstalled && (
                <div className="mb-4 p-3 rounded-lg bg-background/50 border border-border/30">
                  {isCheckingUpdate ? (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Verificando atualizações...</span>
                    </div>
                  ) : hasUpdate ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-amber-500">
                        <RefreshCw className="w-4 h-4" />
                        <span className="text-sm font-medium">Atualização disponível!</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={applyUpdate}
                        disabled={isUpdating}
                        className="w-full bg-amber-600 hover:bg-amber-500 text-white"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Atualizando...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Aplicar Atualização
                          </>
                        )}
                      </Button>
                    </div>
                  ) : updateError ? (
                    <div className="space-y-2">
                      <p className="text-xs text-red-400">{updateError}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => checkForUpdate()}
                        className="text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Tentar novamente
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-green-500">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm">Você está na versão mais recente</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => checkForUpdate()}
                        className="text-xs text-muted-foreground"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Verificar novamente
                      </Button>
                    </div>
                  )}
                  
                  {lastChecked && !isCheckingUpdate && (
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Última verificação: {lastChecked.toLocaleTimeString('pt-BR')}
                    </p>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate("/dashboard")} 
                  variant="outline"
                  className="w-full border-[#8B0000]/30 text-[#F5F5F5] hover:bg-[#8B0000]/10"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Continuar no Navegador
                </Button>
                
                <p className="text-xs text-amber-500/80">
                  💡 Para melhor experiência, abra o app pela tela inicial
                </p>
              </div>
            </div>
          ) : isInstallable ? (
            <div className="dossier-classified p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(139,0,0,0.15)_0%,_transparent_70%)]" />
              
              <div className="relative z-10">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 bg-[#8B0000]/30 rounded-full blur-lg animate-pulse" />
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Download className="w-10 h-10 text-[#B22222] animate-bounce" />
                  </div>
                </div>
                <div className="mb-4">
                  <h3 className="font-bold text-lg mb-1 text-[#F5F5F5]">Pronto para Instalar</h3>
                  <p className="text-sm text-[#808080]">
                    Toque no botão abaixo para adicionar à tela inicial
                  </p>
                </div>
                <Button 
                  onClick={handleInstall} 
                  size="lg" 
                  className="w-full gap-2 bg-[#8B0000] hover:bg-[#B22222] text-white border border-[#B22222]/30 shadow-[0_0_20px_rgba(139,0,0,0.3)] hover:shadow-[0_0_30px_rgba(139,0,0,0.5)]"
                >
                  <Download className="w-5 h-5" />
                  Instalar App
                </Button>
              </div>
            </div>
          ) : showBrowserInstructions && isAndroid ? (
            <div className="dossier-classified p-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Smartphone className="w-5 h-5 text-[#808080]" />
                <h3 className="font-bold text-lg text-center text-[#F5F5F5]">
                  Instalar pelo menu do navegador
                </h3>
              </div>
              
              <p className="text-xs text-center text-amber-500/80 mb-4 px-4">
                O prompt automático não apareceu. Use o menu do navegador para instalar:
              </p>
              
              <div className="space-y-4">
                {[
                  { step: 1, title: "Toque no menu ⋮", subtitle: "No canto superior direito do Chrome", icon: null },
                  { step: 2, title: 'Selecione "Instalar app"', subtitle: 'Ou "Adicionar à tela inicial"', icon: Download },
                  { step: 3, title: "Confirme a instalação", subtitle: "O app será adicionado à sua tela inicial", icon: CheckCircle2 },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#8B0000]/20 border border-[#8B0000]/40 flex items-center justify-center shrink-0 text-sm font-bold text-[#B22222]">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-1 text-[#F5F5F5]">{item.title}</p>
                      <div className="flex items-center gap-2 text-[#808080] text-xs">
                        {item.icon && <item.icon className="w-4 w-4" />}
                        <span>{item.subtitle}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : isIOS ? (
            <div className="dossier-classified p-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Smartphone className="w-5 h-5 text-[#808080]" />
                <h3 className="font-bold text-lg text-center text-[#F5F5F5]">
                  Como instalar no iPhone/iPad
                </h3>
              </div>
              
              <p className="text-xs text-center text-amber-500/80 mb-4 px-4">
                ⚠️ Use o Safari para instalar. Outros navegadores não suportam PWA no iOS.
              </p>
              
              <div className="space-y-4">
                {[
                  { step: 1, title: "Toque no botão Compartilhar", subtitle: "Na barra inferior do Safari", icon: Share },
                  { step: 2, title: 'Toque em "Adicionar à Tela de Início"', subtitle: "Role para baixo se necessário", icon: PlusSquare },
                  { step: 3, title: 'Confirme tocando em "Adicionar"', subtitle: "O ícone aparecerá na sua tela inicial", icon: CheckCircle2 },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#8B0000]/20 border border-[#8B0000]/40 flex items-center justify-center shrink-0 text-sm font-bold text-[#B22222]">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-1 text-[#F5F5F5]">{item.title}</p>
                      <div className="flex items-center gap-2 text-[#808080] text-xs">
                        <item.icon className="w-4 h-4" />
                        <span>{item.subtitle}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="dossier-classified p-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Smartphone className="w-5 h-5 text-[#808080]" />
                <h3 className="font-bold text-lg text-center text-[#F5F5F5]">
                  {isAndroid ? 'Como instalar no Android' : 'Como instalar'}
                </h3>
              </div>
              
              <p className="text-xs text-center text-amber-500/80 mb-4 px-4">
                ⚠️ Use Chrome, Edge ou outro navegador baseado em Chromium para melhor experiência.
              </p>
              
              <div className="space-y-4">
                {[
                  { step: 1, title: "Abra o menu do navegador", subtitle: "Toque nos 3 pontos no canto superior direito", icon: null },
                  { step: 2, title: 'Selecione "Instalar app"', subtitle: 'Ou "Adicionar à tela inicial"', icon: Download },
                  { step: 3, title: "Confirme a instalação", subtitle: "O app será adicionado à sua tela inicial", icon: CheckCircle2 },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#8B0000]/20 border border-[#8B0000]/40 flex items-center justify-center shrink-0 text-sm font-bold text-[#B22222]">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-1 text-[#F5F5F5]">{item.title}</p>
                      <div className="flex items-center gap-2 text-[#808080] text-xs">
                        {item.icon && <item.icon className="w-4 h-4" />}
                        <span>{item.subtitle}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-[#606060] text-center mt-4 font-mono">
                Se o prompt de instalação aparecer automaticamente, aceite para instalar mais rápido
              </p>
            </div>
          )}
        </motion.div>

        {/* Debug Panel - Hidden by default */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-6"
        >
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="w-full text-xs text-[#606060] hover:text-[#808080] transition-colors py-2"
          >
            {showDebug ? '▼ Ocultar diagnóstico' : '► Mostrar diagnóstico PWA'}
          </button>
          
          {showDebug && (
            <div className="dossier-classified p-4 mt-2 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2 mb-3 text-[#808080]">
                <div>Instalável: <span className={isInstallable ? 'text-green-500' : 'text-red-400'}>{isInstallable ? 'Sim' : 'Não'}</span></div>
                <div>Instalado: <span className={isInstalled ? 'text-green-500' : 'text-[#808080]'}>{isInstalled ? 'Sim' : 'Não'}</span></div>
                <div>Standalone: <span className={isStandalone ? 'text-green-500' : 'text-amber-400'}>{isStandalone ? 'Sim (app)' : 'Não (navegador)'}</span></div>
                <div>Recém instalado: <span className={justInstalled ? 'text-green-500' : 'text-[#808080]'}>{justInstalled ? 'Sim' : 'Não'}</span></div>
                <div>iOS: <span className={isIOS ? 'text-blue-400' : 'text-[#808080]'}>{isIOS ? 'Sim' : 'Não'}</span></div>
                <div>Android: <span className={isAndroid ? 'text-green-400' : 'text-[#808080]'}>{isAndroid ? 'Sim' : 'Não'}</span></div>
                <div className="col-span-2">Fallback: <span className={showBrowserInstructions ? 'text-amber-400' : 'text-[#808080]'}>{showBrowserInstructions ? 'Ativo' : 'Não'}</span></div>
              </div>
              
              {/* Seção de Atualizações no Debug */}
              <div className="border-t border-[#8B0000]/20 pt-2 mb-3">
                <p className="text-[#606060] mb-2">Status de Atualização:</p>
                <div className="grid grid-cols-2 gap-2 text-[#808080]">
                  <div>Verificando: <span className={isCheckingUpdate ? 'text-blue-400' : 'text-[#808080]'}>{isCheckingUpdate ? 'Sim' : 'Não'}</span></div>
                  <div>Atualização: <span className={hasUpdate ? 'text-amber-400' : 'text-green-500'}>{hasUpdate ? 'Disponível' : 'Atualizado'}</span></div>
                  <div>Aplicando: <span className={isUpdating ? 'text-blue-400' : 'text-[#808080]'}>{isUpdating ? 'Sim' : 'Não'}</span></div>
                  <div>Erro: <span className={updateError ? 'text-red-400' : 'text-[#808080]'}>{updateError || 'Nenhum'}</span></div>
                  <div className="col-span-2">Última verificação: <span className="text-[#808080]">{lastChecked ? lastChecked.toLocaleTimeString('pt-BR') : 'Nunca'}</span></div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => checkForUpdate()}
                  disabled={isCheckingUpdate}
                  className="w-full text-xs border-blue-600/30 text-blue-400 hover:bg-blue-600/10 mt-2"
                >
                  {isCheckingUpdate ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Verificar Atualizações
                    </>
                  )}
                </Button>
              </div>
              
              <div className="border-t border-[#8B0000]/20 pt-2">
                <p className="text-[#606060] mb-2">Logs de diagnóstico:</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {debugInfo.length > 0 ? (
                    debugInfo.map((log, i) => (
                      <p key={i} className="text-[#808080] text-[10px] leading-tight">{log}</p>
                    ))
                  ) : (
                    <p className="text-[#606060] text-[10px]">Nenhum log ainda...</p>
                  )}
                </div>
              </div>
              
              <div className="border-t border-[#8B0000]/20 pt-3 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearCache}
                  disabled={isClearing}
                  className="w-full text-xs border-amber-600/30 text-amber-500 hover:bg-amber-600/10"
                >
                  {isClearing ? 'Limpando...' : '🗑️ Limpar Cache do Service Worker'}
                </Button>
                <p className="text-[10px] text-[#606060] mt-2 text-center">
                  Use se a instalação não funcionar. A página será recarregada.
                </p>
              </div>
              
              <div className="border-t border-[#8B0000]/20 pt-3 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetInstallState}
                  className="w-full text-xs border-[#606060]/30 text-[#808080] hover:bg-[#8B0000]/10 mb-2"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Resetar Estado de Instalação
                </Button>
                <p className="text-[10px] text-[#606060] text-center">
                  Use para debug. Remove flag de instalação do localStorage.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Back button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")} 
            className="text-[#808080] hover:text-[#F5F5F5] hover:bg-[#8B0000]/10"
          >
            Voltar para a página inicial
          </Button>
        </motion.div>
      </main>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Particles } from "@/components/ui/particles";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { DecryptedText } from "@/components/ui/decrypted-text";
import { ParanormalElementIcon } from "@/components/ui/paranormal-element-icon";
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
  Eye
} from "lucide-react";

export default function Install() {
  const navigate = useNavigate();
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      // Celebration feedback handled by the hook
    }
  };

  const features = [
    { icon: Zap, title: "Acesso Rápido", description: "Abra direto da tela inicial", element: 'energia' as const },
    { icon: Wifi, title: "Funciona Offline", description: "Fichas disponíveis sem internet", element: 'conhecimento' as const },
    { icon: Bell, title: "Notificações", description: "Alertas de sessões e mensagens", element: 'medo' as const },
  ];

  return (
    <div className="min-h-screen bg-[#0D0A0B] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0D0A0B] via-[#1A0505] to-[#0D0A0B]" />
      <FlickeringGrid className="opacity-20" squareSize={4} gridGap={8} flickerChance={0.2} color="rgb(139, 0, 0)" maxOpacity={0.2} />
      <div className="absolute inset-0 landing-noise pointer-events-none" />
      
      {/* Red mist */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-[#8B0000]/8 rounded-full blur-[120px] animate-red-mist" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#B22222]/6 rounded-full blur-[100px] animate-red-mist" style={{ animationDelay: '4s' }} />
      </div>
      
      <div className="absolute inset-0 scan-lines opacity-15 pointer-events-none" />
      
      <Particles className="absolute inset-0 z-[1]" quantity={25} color="#8B0000" size={1.2} vx={0} vy={-0.15} staticity={90} ease={110} />
      
      <div className="absolute inset-0 vignette-red pointer-events-none opacity-50" />

      {/* Header */}
      <header className="relative z-10 sticky top-0 border-b border-[#8B0000]/20 bg-[#0D0A0B]/80 backdrop-blur-sm">
        <div className="container flex h-14 items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
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
              <Eye className="w-12 h-12 text-[#B22222] animate-pulse" />
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
          {isInstalled ? (
            <div className="dossier-classified p-6 text-center border-green-600/30 bg-green-900/10">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <div className="mb-4">
                <h3 className="font-bold text-lg mb-1 text-[#F5F5F5]">App Instalado!</h3>
                <p className="text-sm text-[#808080]">
                  O Let's Roll já está na sua tela inicial
                </p>
              </div>
              <Button 
                onClick={() => navigate("/dashboard")} 
                className="w-full bg-[#8B0000] hover:bg-[#B22222] text-white border border-[#B22222]/30"
              >
                Ir para o Dashboard
              </Button>
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
          ) : isIOS ? (
            <div className="dossier-classified p-6">
              <h3 className="font-bold text-lg mb-4 text-center text-[#F5F5F5]">
                Como instalar no iPhone/iPad
              </h3>
              
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
              <h3 className="font-bold text-lg mb-4 text-center text-[#F5F5F5]">
                Como instalar no Android
              </h3>
              
              <div className="space-y-4">
                {[
                  { step: 1, title: "Abra o menu do navegador", subtitle: "Toque nos 3 pontos no canto superior direito" },
                  { step: 2, title: 'Selecione "Instalar app"', subtitle: 'Ou "Adicionar à tela inicial"' },
                  { step: 3, title: "Confirme a instalação", subtitle: "O app será adicionado à sua tela inicial" },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#8B0000]/20 border border-[#8B0000]/40 flex items-center justify-center shrink-0 text-sm font-bold text-[#B22222]">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-1 text-[#F5F5F5]">{item.title}</p>
                      <p className="text-[#808080] text-xs">{item.subtitle}</p>
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

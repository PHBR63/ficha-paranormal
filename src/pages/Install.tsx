import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { 
  Download, 
  Smartphone, 
  CheckCircle2, 
  Share, 
  PlusSquare,
  ArrowLeft,
  Zap,
  Wifi,
  Bell
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
    { icon: Zap, title: "Acesso Rápido", description: "Abra direto da tela inicial" },
    { icon: Wifi, title: "Funciona Offline", description: "Fichas disponíveis sem internet" },
    { icon: Bell, title: "Experiência Nativa", description: "Visual de app real" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-lg font-bold">Instalar App</h1>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-lg mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
            <Smartphone className="w-12 h-12 text-primary" />
          </div>
          
          <h2 className="text-2xl font-display font-bold mb-2">
            Let's Roll no seu celular
          </h2>
          <p className="text-muted-foreground">
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
            <Card key={index} className="bg-card/50 border-border/50">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Install Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isInstalled ? (
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
                <div>
                  <h3 className="font-bold text-lg mb-1">App Instalado!</h3>
                  <p className="text-sm text-muted-foreground">
                    O Let's Roll já está na sua tela inicial
                  </p>
                </div>
                <Button onClick={() => navigate("/dashboard")} className="w-full">
                  Ir para o Dashboard
                </Button>
              </CardContent>
            </Card>
          ) : isInstallable ? (
            <Card className="bg-primary/5 border-primary/30">
              <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                <Download className="w-12 h-12 text-primary animate-bounce" />
                <div>
                  <h3 className="font-bold text-lg mb-1">Pronto para Instalar</h3>
                  <p className="text-sm text-muted-foreground">
                    Toque no botão abaixo para adicionar à tela inicial
                  </p>
                </div>
                <Button onClick={handleInstall} size="lg" className="w-full gap-2">
                  <Download className="w-5 h-5" />
                  Instalar App
                </Button>
              </CardContent>
            </Card>
          ) : isIOS ? (
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 text-center">
                  Como instalar no iPhone/iPad
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-1">Toque no botão Compartilhar</p>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <Share className="w-4 h-4" />
                        <span>Na barra inferior do Safari</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-1">Toque em "Adicionar à Tela de Início"</p>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <PlusSquare className="w-4 h-4" />
                        <span>Role para baixo se necessário</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-1">Confirme tocando em "Adicionar"</p>
                      <p className="text-muted-foreground text-xs">
                        O ícone aparecerá na sua tela inicial
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 text-center">
                  Como instalar no Android
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-1">Abra o menu do navegador</p>
                      <p className="text-muted-foreground text-xs">
                        Toque nos 3 pontos no canto superior direito
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-1">Selecione "Instalar app" ou "Adicionar à tela inicial"</p>
                      <p className="text-muted-foreground text-xs">
                        A opção pode variar conforme o navegador
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-1">Confirme a instalação</p>
                      <p className="text-muted-foreground text-xs">
                        O app será adicionado à sua tela inicial
                      </p>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Se o prompt de instalação aparecer automaticamente, aceite para instalar mais rápido
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Back button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground">
            Voltar para a página inicial
          </Button>
        </motion.div>
      </main>
    </div>
  );
}

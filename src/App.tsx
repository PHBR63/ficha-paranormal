import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ColorThemeProvider } from "@/contexts/ColorThemeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { InstallPromptBanner } from "@/components/pwa/InstallPromptBanner";
import { PWAUpdateBanner } from "@/components/pwa/PWAUpdateBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { Skeleton } from "@/components/ui/skeleton";

// Páginas com carregamento imediato (críticas para first paint)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy loading para páginas pesadas
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CharacterCreate = lazy(() => import("./pages/CharacterCreate"));
const CharacterSheet = lazy(() => import("./pages/CharacterSheet"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const CampaignCreate = lazy(() => import("./pages/CampaignCreate"));
const CampaignShell = lazy(() => import("./pages/CampaignShell")); // Nova versão v3
const AdminImport = lazy(() => import("./pages/AdminImport"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminDataIntegrity = lazy(() => import("./pages/AdminDataIntegrity"));
const AdminCampaigns = lazy(() => import("./pages/AdminCampaigns"));
const MyTemplates = lazy(() => import("./pages/MyTemplates"));
const TacticalMapFullscreen = lazy(() => import("./pages/TacticalMapFullscreen"));
const Install = lazy(() => import("./pages/Install"));

const queryClient = new QueryClient();

// Componente de loading para Suspense
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="space-y-4 w-full max-w-md px-4">
      <Skeleton className="h-12 w-3/4 mx-auto" />
      <Skeleton className="h-8 w-1/2 mx-auto" />
      <div className="space-y-2 mt-8">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineIndicator />
        <PWAUpdateBanner />
        <BrowserRouter>
          <InstallPromptBanner />
          <AuthProvider>
            <ColorThemeProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/install" element={<Install />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/character/create" element={
                    <ProtectedRoute>
                      <CharacterCreate />
                    </ProtectedRoute>
                  } />
                  <Route path="/character/:id" element={
                    <ProtectedRoute>
                      <CharacterSheet />
                    </ProtectedRoute>
                  } />
                  <Route path="/campaigns" element={
                    <ProtectedRoute>
                      <Campaigns />
                    </ProtectedRoute>
                  } />
                  <Route path="/campaigns/create" element={
                    <ProtectedRoute>
                      <CampaignCreate />
                    </ProtectedRoute>
                  } />
                  <Route path="/campaigns/:id" element={
                    <ProtectedRoute>
                      <CampaignShell />
                    </ProtectedRoute>
                  } />
                  <Route path="/my-templates" element={
                    <ProtectedRoute>
                      <MyTemplates />
                    </ProtectedRoute>
                  } />
                  <Route path="/map/:id" element={
                    <ProtectedRoute>
                      <TacticalMapFullscreen />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/import" element={
                    <AdminRoute>
                      <AdminImport />
                    </AdminRoute>
                  } />
                  <Route path="/admin/users" element={
                    <AdminRoute>
                      <AdminUsers />
                    </AdminRoute>
                  } />
                  <Route path="/admin/data-integrity" element={
                    <AdminRoute>
                      <AdminDataIntegrity />
                    </AdminRoute>
                  } />
                  <Route path="/admin/campaigns" element={
                    <AdminRoute>
                      <AdminCampaigns />
                    </AdminRoute>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ColorThemeProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

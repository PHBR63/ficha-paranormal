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
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CharacterCreate from "./pages/CharacterCreate";
import CharacterSheet from "./pages/CharacterSheet";
import Campaigns from "./pages/Campaigns";
import CampaignCreate from "./pages/CampaignCreate";
import CampaignView from "./pages/CampaignView";
import AdminImport from "./pages/AdminImport";
import AdminUsers from "./pages/AdminUsers";
import AdminDataIntegrity from "./pages/AdminDataIntegrity";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <InstallPromptBanner />
      <BrowserRouter>
        <AuthProvider>
          <ColorThemeProvider>
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
                  <CampaignView />
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ColorThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

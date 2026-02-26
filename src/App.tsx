import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";

import Index from "./pages/Index"; // 你现在的登录页
import Landing from "./pages/Landing"; // ✅ 新增：营销落地页
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import AnnouncementList from "./pages/Announcements";
import AnnouncementDetail from "./pages/Announcements/AnnouncementDetail";
import AnnouncementPopup from "./components/AnnouncementPopup";

import Dashboard from "./pages/Dashboard";
import Strategies from "./pages/Strategies";
import StrategyDetail from "./pages/StrategyDetail";
import StrategyCreate from "./pages/admin/StrategyCreate";
import StrategySignals from "./pages/StrategySignals";
import HistoryPage from "./pages/History";
import Leaderboard from "./pages/Leaderboard";
import Settings from "./pages/Settings";
import Accounts from "./pages/Accounts";
import Help from "./pages/Help";
import AiAssistant from "./pages/AiAssistant";

import AppLayout from "./components/layout/AppLayout";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ProtectedAdminRoute from "./components/auth/ProtectedAdminRoute";
import AnnouncementManager from "./pages/admin/AnnouncementManager";
import StrategyManager from "./pages/admin/StrategyManager";
import LegalManager from "./pages/admin/LegalManager";
import OpsConsole from "./pages/admin/OpsConsole";
import AuditLogs from "./pages/admin/AuditLogs";
import TurboFlowAudit from "./pages/admin/TurboFlowAudit";
import OrderStats from "./pages/admin/OrderStats";
import StrategySwitch from "./pages/admin/StrategySwitch";
import InviteCodes from "./pages/admin/InviteCodes"; // ✅ Phase 16: Invite Codes

// SubscriptionManager removed - backend does not support GET /admin/subscriptions

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AnnouncementPopup />
            <Routes>
              {/* Public */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Index />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />

              {/* Protected + Layout */}
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/strategies" element={<Strategies />} />
                <Route path="/strategies/:id" element={<StrategyDetail />} />
                <Route path="/strategies/:id/signals" element={<StrategySignals />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/announcements" element={<AnnouncementList />} />
                <Route path="/announcements/:id" element={<AnnouncementDetail />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/settings" element={<Settings />} />
                {/* Alias: account management (opened from Dashboard gear) */}
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/help" element={<Help />} />
                <Route path="/ai-assistant" element={<AiAssistant />} />
              </Route>

              {/* ✅ Admin Module */}
              <Route element={<ProtectedRoute><ProtectedAdminRoute /></ProtectedRoute>}>
                <Route element={<AppLayout />}>
                  <Route path="/admin/announcements" element={<AnnouncementManager />} />
                  <Route path="/admin/strategies" element={<StrategyManager />} />
                  <Route path="/admin/legal" element={<LegalManager />} />
                  <Route path="/admin/ops" element={<OpsConsole />} />
                  <Route path="/admin/system-logs" element={<AuditLogs />} />
                  <Route path="/admin/trade-audit" element={<TurboFlowAudit />} />
                  <Route path="/admin/trade-performance" element={<OrderStats />} />
                  <Route path="/admin/strategy-switch" element={<StrategySwitch />} />
                  <Route path="/admin/invites" element={<InviteCodes />} /> {/* ✅ Phase 16: Invite Codes */}
                  {/* SubscriptionManager removed - backend does not support listing */}
                  <Route path="/admin/strategies/create" element={<StrategyCreate />} />
                  <Route path="/admin/strategies/:id/edit" element={<StrategyCreate />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

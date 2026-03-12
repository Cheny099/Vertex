import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LazyMotion, domAnimation } from "framer-motion";

import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ProtectedAdminRoute from "./components/auth/ProtectedAdminRoute";

const AppLayout = lazy(() => import("./components/layout/AppLayout"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Strategies = lazy(() => import("./pages/Strategies"));
const StrategyDetail = lazy(() => import("./pages/StrategyDetail"));
const StrategySignals = lazy(() => import("./pages/StrategySignals"));
const HistoryPage = lazy(() => import("./pages/History"));
const AnnouncementList = lazy(() => import("./pages/Announcements"));
const AnnouncementDetail = lazy(() => import("./pages/Announcements/AnnouncementDetail"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Settings = lazy(() => import("./pages/Settings"));
const Accounts = lazy(() => import("./pages/Accounts"));
const Help = lazy(() => import("./pages/Help"));
const AiAssistant = lazy(() => import("./pages/AiAssistant"));

const AnnouncementManager = lazy(() => import("./pages/admin/AnnouncementManager"));
const StrategyManager = lazy(() => import("./pages/admin/StrategyManager"));
const LegalManager = lazy(() => import("./pages/admin/LegalManager"));
const OpsConsole = lazy(() => import("./pages/admin/OpsConsole"));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const TurboFlowAudit = lazy(() => import("./pages/admin/TurboFlowAudit"));
const OrderStats = lazy(() => import("./pages/admin/OrderStats"));
const StrategySwitch = lazy(() => import("./pages/admin/StrategySwitch"));
const InviteCodes = lazy(() => import("./pages/admin/InviteCodes"));
const StrategyCreate = lazy(() => import("./pages/admin/StrategyCreate"));

const queryClient = new QueryClient();
const routeFallback = (
  <div className="min-h-[40vh] flex items-center justify-center text-sm text-muted-foreground">
    Loading...
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LazyMotion features={domAnimation}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Index />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />

                <Route
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={routeFallback}>
                        <AppLayout />
                      </Suspense>
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/strategies" element={<Strategies />} />
                  <Route path="/strategies/:id" element={<StrategyDetail />} />
                  <Route path="/strategies/:id/signals" element={<StrategySignals />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/announcements" element={<AnnouncementList />} />
                  <Route path="/announcements/:id" element={<AnnouncementDetail />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/accounts" element={<Accounts />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/ai-assistant" element={<AiAssistant />} />
                </Route>

                <Route
                  element={
                    <ProtectedRoute>
                      <ProtectedAdminRoute />
                    </ProtectedRoute>
                  }
                >
                  <Route
                    element={
                      <Suspense fallback={routeFallback}>
                        <AppLayout />
                      </Suspense>
                    }
                  >
                    <Route path="/admin/announcements" element={<AnnouncementManager />} />
                    <Route path="/admin/strategies" element={<StrategyManager />} />
                    <Route path="/admin/legal" element={<LegalManager />} />
                    <Route path="/admin/ops" element={<OpsConsole />} />
                    <Route path="/admin/system-logs" element={<AuditLogs />} />
                    <Route path="/admin/trade-audit" element={<TurboFlowAudit />} />
                    <Route path="/admin/trade-performance" element={<OrderStats />} />
                    <Route path="/admin/strategy-switch" element={<StrategySwitch />} />
                    <Route path="/admin/invites" element={<InviteCodes />} />
                    <Route path="/admin/strategies/create" element={<StrategyCreate />} />
                    <Route path="/admin/strategies/:id/edit" element={<StrategyCreate />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LazyMotion>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

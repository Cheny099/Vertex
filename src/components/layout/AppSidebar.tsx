import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  History,
  Settings,
  Bot,
  LogOut,
  HelpCircle,
  ShieldAlert, // For Admin
  Megaphone,   // For Announcements
  Scale,       // For Legal
  Terminal,    // For Ops
  Workflow,    // For Strategy Admin
  FileText,    // For Audit Logs
  Users,       // For Subscriptions
  ClipboardCheck, // For TurboFlow Audit
  BarChart,       // For Order Stats
  ArrowRightLeft, // For Strategy Switch
  Ticket,          // For Invite Codes
  Sparkles         // For AI Assistant
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const AppSidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation(['common', 'settings', 'admin']); // ✅ Use common, settings and admin namespaces

  const menuItems = [
    { title: t('common:nav.dashboard'), url: '/dashboard', icon: LayoutDashboard },
    { title: t('common:nav.ai_assistant'), url: '/ai-assistant', icon: Sparkles },
    { title: t('common:nav.strategies'), url: '/strategies', icon: Bot },
    { title: t('common:nav.announcements'), url: '/announcements', icon: Megaphone },
    { title: t('common:nav.history'), url: '/history', icon: History },
    { title: t('common:nav.settings'), url: '/settings', icon: Settings },
    { title: t('common:nav.help'), url: '/help', icon: HelpCircle },
  ];

  return (
    <aside className="hidden lg:flex w-64 bg-sidebar border-r border-sidebar-border flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <img src="/logo.png" alt="Vertex Quant" className="w-8 h-8 mr-3 logo-invert transition-all" />
        <span className="text-xl font-semibold text-sidebar-foreground">{t('app_name')}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = item.url === '/dashboard'
            ? location.pathname === item.url
            : location.pathname.startsWith(item.url);
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                isActive && "bg-primary/10 text-primary font-medium"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span>{item.title}</span>
            </NavLink>
          );
        })}

        {/* ✅ Admin Section */}
        {user?.is_admin && (
          <>
            <div className="my-4 border-t border-sidebar-border/50 mx-2" />
            <div className="px-4 text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              {t('settings:section.management')}
            </div>
            <NavLink
              to="/admin/announcements"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                location.pathname.startsWith('/admin/announcements') && "bg-primary/10 text-primary font-medium"
              )}
            >
              <Megaphone className={cn("w-5 h-5", location.pathname.startsWith('/admin/announcements') && "text-primary")} />
              <span>{t('admin:announcements')}</span>
            </NavLink>
            <NavLink
              to="/admin/legal"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                location.pathname.startsWith('/admin/legal') && "bg-primary/10 text-primary font-medium"
              )}
            >
              <Scale className={cn("w-5 h-5", location.pathname.startsWith('/admin/legal') && "text-primary")} />
              <span>{t('admin:legal')}</span>
            </NavLink>
            <NavLink
              to="/admin/strategies"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                location.pathname.startsWith('/admin/strategies') && "bg-primary/10 text-primary font-medium"
              )}
            >
              <Workflow className={cn("w-5 h-5", location.pathname.startsWith('/admin/strategies') && "text-primary")} />
              <span>{t('admin:strategies')}</span>
            </NavLink>
            <NavLink
              to="/admin/strategy-switch"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                location.pathname.startsWith('/admin/strategy-switch') && "bg-primary/10 text-primary font-medium"
              )}
            >
              <ArrowRightLeft className={cn("w-5 h-5", location.pathname.startsWith('/admin/strategy-switch') && "text-primary")} />
              <span>{t('admin:strategy_switch.title')}</span>
            </NavLink>
            <NavLink
              to="/admin/ops"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                location.pathname.startsWith('/admin/ops') && "bg-primary/10 text-primary font-medium"
              )}
            >
              <Terminal className={cn("w-5 h-5", location.pathname.startsWith('/admin/ops') && "text-primary")} />
              <span>{t('admin:ops')}</span>
            </NavLink>
            <NavLink
              to="/admin/system-logs"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                location.pathname.startsWith('/admin/system-logs') && "bg-primary/10 text-primary font-medium"
              )}
            >
              <FileText className={cn("w-5 h-5", location.pathname.startsWith('/admin/system-logs') && "text-primary")} />
              <span>{t('admin:system_logs')}</span>
            </NavLink>
            <NavLink
              to="/admin/trade-audit"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                location.pathname.startsWith('/admin/trade-audit') && "bg-primary/10 text-primary font-medium"
              )}
            >
              <ClipboardCheck className={cn("w-5 h-5", location.pathname.startsWith('/admin/trade-audit') && "text-primary")} />
              <span>{t('admin:trade_audit')}</span>
            </NavLink>
            <NavLink
              to="/admin/trade-performance"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                location.pathname.startsWith('/admin/trade-performance') && "bg-primary/10 text-primary font-medium"
              )}
            >
              <BarChart className={cn("w-5 h-5", location.pathname.startsWith('/admin/trade-performance') && "text-primary")} />
              <span>{t('admin:trade_performance')}</span>
            </NavLink>
            <NavLink
              to="/admin/invites"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                location.pathname.startsWith('/admin/invites') && "bg-primary/10 text-primary font-medium"
              )}
            >
              <Ticket className={cn("w-5 h-5", location.pathname.startsWith('/admin/invites') && "text-primary")} />
              <span>{t('admin:invites.title', 'Invite Codes')}</span>
            </NavLink>
            {/* SubscriptionManager link removed - backend does not support GET /admin/subscriptions */}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-medium">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.username || t('settings:section.profile')}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || t('common:please_login')}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;

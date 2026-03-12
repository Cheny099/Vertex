import { memo, useCallback, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { ADMIN_NAV_ITEMS, MAIN_NAV_ITEMS, isRouteActive } from './nav-config';

const AppSidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation(['common', 'settings', 'admin']);

  const menuItems = useMemo(
    () =>
      MAIN_NAV_ITEMS.map((item) => ({
        ...item,
        title: t(item.titleKey, { defaultValue: item.defaultValue }),
      })),
    [t]
  );

  const adminItems = useMemo(
    () =>
      ADMIN_NAV_ITEMS.map((item) => ({
        ...item,
        title: t(item.titleKey, { defaultValue: item.defaultValue }),
      })),
    [t]
  );

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <aside className="hidden lg:flex w-64 bg-sidebar border-r border-sidebar-border flex-col h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <img src="/logo.png" alt="Vertex Quant" className="w-8 h-8 mr-3 logo-invert transition-all" />
        <span className="text-xl font-semibold text-sidebar-foreground">{t('app_name')}</span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = isRouteActive(location.pathname, item.url);
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

        {user?.is_admin && (
          <>
            <div className="my-4 border-t border-sidebar-border/50 mx-2" />
            <div className="px-4 text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              {t('settings:section.management')}
            </div>
            {adminItems.map((item) => {
              const isActive = location.pathname.startsWith(item.url);
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
          </>
        )}
      </nav>

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
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default memo(AppSidebar);


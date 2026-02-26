/**
 * @anchor-id MOBILE_NAV
 * @module-type component
 * @disposable false
 * @description 移动端导航抽屉组件（按钮和抽屉分离实现）
 */

import { useState, createContext, useContext, ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    TrendingUp,
    History,
    Settings,
    Bot,
    LogOut,
    Menu,
    X,
    HelpCircle,
    Megaphone,
    Workflow,
    Scale,
    Terminal,
    FileText,
    ClipboardCheck,
    BarChart,
    ArrowRightLeft,
    Ticket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';



// Context for sharing drawer state between button and drawer
const MobileNavContext = createContext<{
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
} | null>(null);

// Provider component
export const MobileNavProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <MobileNavContext.Provider value={{ isOpen, setIsOpen }}>
            {children}
        </MobileNavContext.Provider>
    );
};

// Hook to use mobile nav context
const useMobileNav = () => {
    const context = useContext(MobileNavContext);
    if (!context) {
        throw new Error('useMobileNav must be used within MobileNavProvider');
    }
    return context;
};

// Button component (goes in header)
export const MobileNavButton = () => {
    const { setIsOpen } = useMobileNav();

    return (
        <button
            onClick={() => setIsOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
        >
            <Menu className="w-6 h-6" />
        </button>
    );
};

// Drawer component (goes at root level)
export const MobileNavDrawer = () => {
    const { isOpen, setIsOpen } = useMobileNav();
    const location = useLocation();
    const { user, logout } = useAuth();
    const { t } = useTranslation(['common', 'admin', 'settings']);

    const menuItems = [
        { title: t('common:nav.dashboard'), url: '/dashboard', icon: LayoutDashboard },
        { title: t('common:nav.strategies'), url: '/strategies', icon: Bot },
        { title: t('common:nav.announcements'), url: '/announcements', icon: Megaphone },
        { title: t('common:nav.history'), url: '/history', icon: History },
        { title: t('common:nav.settings'), url: '/settings', icon: Settings },
        { title: t('common:nav.help'), url: '/help', icon: HelpCircle },
    ];

    const adminItems = [
        { title: t('admin:announcements'), url: '/admin/announcements', icon: Megaphone },
        { title: t('admin:legal'), url: '/admin/legal', icon: Scale },
        { title: t('admin:strategies'), url: '/admin/strategies', icon: Workflow },
        { title: t('admin:strategy_switch.title'), url: '/admin/strategy-switch', icon: ArrowRightLeft },
        { title: t('admin:ops'), url: '/admin/ops', icon: Terminal },
        { title: t('admin:system_logs'), url: '/admin/system-logs', icon: FileText },
        { title: t('admin:trade_audit'), url: '/admin/trade-audit', icon: ClipboardCheck },
        { title: t('admin:trade_performance'), url: '/admin/trade-performance', icon: BarChart },
        { title: t('admin:invites.title'), url: '/admin/invites', icon: Ticket },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/50 z-[100] lg:hidden"
                    />

                    {/* Drawer */}
                    <motion.aside
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed left-0 top-0 bottom-0 w-72 bg-sidebar border-r border-sidebar-border flex flex-col z-[100] lg:hidden"
                    >
                        {/* Header */}
                        <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
                            <div className="flex items-center">
                                <img src="/logo.png" alt="Vertex Quant" className="w-8 h-8 mr-3 logo-invert transition-all" />
                                <span className="text-xl font-semibold text-sidebar-foreground">{t('app_name')}</span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
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
                                        onClick={() => setIsOpen(false)}
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

                            {/* Admin Section */}
                            {user?.is_admin && (
                                <>
                                    <div className="my-4 border-t border-sidebar-border/50 mx-2" />
                                    <div className="px-4 text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-widest opacity-50">
                                        {t('settings:section.management')}
                                    </div>
                                    {adminItems.map((item) => {
                                        const isActive = location.pathname.startsWith(item.url);
                                        return (
                                            <NavLink
                                                key={item.url}
                                                to={item.url}
                                                onClick={() => setIsOpen(false)}
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
                                        {user?.username || t('common:nav.profile')}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {user?.email || t('common:please_login')}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        logout();
                                    }}
                                    className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-destructive"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
};

// Default export for backward compatibility
const MobileNav = MobileNavButton;
export default MobileNav;

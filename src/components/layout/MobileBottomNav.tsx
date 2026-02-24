/**
 * @anchor-id MOBILE_BOTTOM_NAV
 * @module-type component
 * @disposable false
 * @description 移动端底部导航栏组件
 */

import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Bot, Wallet, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const MobileBottomNav = () => {
    const location = useLocation();
    const { t } = useTranslation(['common']);

    const navItems = [
        { title: t('nav.dashboard'), url: '/dashboard', icon: LayoutDashboard },
        { title: t('nav.strategies'), url: '/strategies', icon: Bot },
        { title: t('nav.positions'), url: '/positions', icon: Wallet },
        { title: t('nav.profile'), url: '/settings', icon: User },
    ];

    return (
        <motion.nav
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50 safe-area-bottom"
        >
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.url ||
                        (item.url === '/strategies' && location.pathname.startsWith('/strategies'));
                    return (
                        <NavLink
                            key={item.url}
                            to={item.url}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 w-full h-full transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                            <span className={cn(
                                "text-xs",
                                isActive && "font-medium"
                            )}>
                                {item.title}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavIndicator"
                                    className="absolute top-0 w-12 h-0.5 bg-primary rounded-full"
                                />
                            )}
                        </NavLink>
                    );
                })}
            </div>
        </motion.nav>
    );
};

export default MobileBottomNav;

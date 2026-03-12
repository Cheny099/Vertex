import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import type { TFunction } from 'i18next';
import { Button } from '@/components/ui/button';

interface FloatingNavbarProps {
  isAuthenticated: boolean;
  isScrolled: boolean;
  onGoDashboard: () => void;
  onGoLogin: () => void;
  onGoRegister: () => void;
  onToggleLanguage: () => void;
  t: TFunction;
}

export function FloatingNavbar({
  isAuthenticated,
  isScrolled,
  onGoDashboard,
  onGoLogin,
  onGoRegister,
  onToggleLanguage,
  t,
}: FloatingNavbarProps) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl z-50">
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className={
          isScrolled
            ? 'px-6 py-3 rounded-full border transition-all duration-300 flex items-center justify-between bg-background/80 backdrop-blur-xl border-border/50 shadow-2xl shadow-primary/5'
            : 'px-6 py-3 rounded-full border transition-all duration-300 flex items-center justify-between bg-background/40 backdrop-blur-md border-white/5 shadow-lg'
        }
      >
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain logo-invert transition-all" />
          <div className="font-bold text-base tracking-tight hidden sm:block">{t('brand')}</div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link to="/strategies" className="hover:text-primary transition-colors">{t('hero.actions.view_strategies')}</Link>
          <Link to="/terms" className="hover:text-primary transition-colors">{t('footer.terms')}</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleLanguage}
            className="w-8 h-8 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-0"
          >
            <Globe className="w-4 h-4" />
          </Button>

          {isAuthenticated ? (
            <Button onClick={onGoDashboard} size="sm" className="rounded-full shadow-button px-4">
              {t('hero.actions.dashboard')}
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={onGoLogin} className="rounded-full hover:bg-primary/10">
                {t('hero.actions.login')}
              </Button>
              <Button onClick={onGoRegister} size="sm" className="rounded-full shadow-button bg-primary hover:bg-primary/90">
                {t('hero.actions.register')}
              </Button>
            </>
          )}
        </div>
      </motion.header>
    </div>
  );
}

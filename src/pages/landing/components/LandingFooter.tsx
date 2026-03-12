import { Link } from 'react-router-dom';
import type { TFunction } from 'i18next';

interface LandingFooterProps {
  t: TFunction;
}

export function LandingFooter({ t }: LandingFooterProps) {
  return (
    <footer className="mt-auto py-12 px-6 border-t border-border/40 bg-background/50 backdrop-blur-lg">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-xs text-muted-foreground text-center md:text-left max-w-2xl leading-relaxed">
          <span className="font-semibold text-foreground/80 block mb-1">{t('footer.risk_label')} </span>
          {t('footer.risk_text')}
        </div>
        <div className="flex gap-8 text-xs font-medium text-muted-foreground">
          <Link to="/terms" className="hover:text-primary transition-colors underline-offset-4 hover:underline">{t('footer.terms')}</Link>
          <Link to="/privacy" className="hover:text-primary transition-colors underline-offset-4 hover:underline">{t('footer.privacy')}</Link>
        </div>
      </div>
    </footer>
  );
}

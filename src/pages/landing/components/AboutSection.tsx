import { Activity, Puzzle, Zap } from 'lucide-react';
import type { TFunction } from 'i18next';
import { Card, CardContent } from '@/components/ui/card';

interface AboutSectionProps {
  t: TFunction;
}

const BELIEFS = [
  { icon: Puzzle, key: 'about.beliefs.models' },
  { icon: Activity, key: 'about.beliefs.strategies' },
  { icon: Zap, key: 'about.beliefs.tech' },
] as const;

export function AboutSection({ t }: AboutSectionProps) {
  return (
    <section className="px-6 md:px-10 py-24 relative overflow-hidden bg-background/30 backdrop-blur-sm border-t border-border/40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(100,100,255,0.05),transparent_40%)]" />

      <div className="max-w-4xl mx-auto space-y-16 relative z-10">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t('about.title')}</h2>
          <p className="text-lg text-primary font-medium tracking-wide">{t('about.subtitle')}</p>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {t('about.description')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {BELIEFS.map((item) => (
            <Card key={item.key} className="glass-card border-white/5 bg-primary/5 hover:bg-primary/10 transition-colors">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="font-medium text-sm md:text-base leading-snug">{t(item.key)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-12 pt-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <div className="w-1 h-6 bg-yellow-500 rounded-full" /> {t('about.philosophy.title')}
            </h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {t('about.philosophy.text')}
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-500 rounded-full" /> {t('about.team.title')}
            </h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {t('about.team.text')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

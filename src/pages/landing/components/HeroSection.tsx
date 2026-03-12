import { motion, type MotionValue } from 'framer-motion';
import { Activity, ArrowRight, ChevronRight, Globe, ShieldCheck, Zap } from 'lucide-react';
import type { TFunction } from 'i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Area,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface CurvePoint {
  nav: number;
  p10: number;
  p90: number;
  t: string;
}

interface HeroSectionProps {
  curveData: CurvePoint[];
  heroOpacity: MotionValue<number>;
  heroScale: MotionValue<number>;
  isAuthenticated: boolean;
  onGoDashboard: () => void;
  onGoRegister: () => void;
  onGoStrategies: () => void;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  t: TFunction;
}

const HERO_BADGES = [
  { icon: ShieldCheck, key: 'hero.feature_risk' },
  { icon: Zap, key: 'hero.feature_speed' },
  { icon: Activity, key: 'hero.feature_viz' },
] as const;

export function HeroSection({
  curveData,
  heroOpacity,
  heroScale,
  isAuthenticated,
  onGoDashboard,
  onGoRegister,
  onGoStrategies,
  rotateX,
  rotateY,
  t,
}: HeroSectionProps) {
  return (
    <section className="px-6 md:px-10 pt-32 pb-20 md:pt-48 md:pb-32 relative">
      <motion.div
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center"
      >
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="space-y-8"
        >
          <div className="inline-flex gap-3 flex-wrap">
            {HERO_BADGES.map((item, index) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Badge variant="outline" className="px-3 py-1.5 gap-1.5 text-xs font-medium border-primary/20 bg-primary/5 backdrop-blur-sm">
                  <item.icon className="w-3.5 h-3.5 text-primary" />
                  {t(item.key)}
                </Badge>
              </motion.div>
            ))}
          </div>

          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
              <span className="block text-foreground/90">{t('hero.title_prefix')}</span>
              <span className="relative">
                <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-primary to-violet-500 animate-gradient-x bg-[length:200%_auto]">
                  {t('hero.title_highlight')}
                </span>
                <span className="absolute inset-0 bg-primary/20 blur-2xl z-0" />
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              {t('hero.description')}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            {isAuthenticated ? (
              <Button size="lg" onClick={onGoDashboard} className="gap-2 text-base px-8 h-14 rounded-full shadow-button glow-primary hover:scale-105 transition-transform">
                {t('hero.actions.dashboard')} <ArrowRight className="w-5 h-5" />
              </Button>
            ) : (
              <Button size="lg" onClick={onGoRegister} className="relative overflow-hidden gap-2 text-base px-8 h-14 rounded-full shadow-button glow-primary hover:scale-105 transition-transform group">
                <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                {t('hero.actions.register_now')} <ArrowRight className="w-5 h-5" />
              </Button>
            )}

            <Button variant="outline" size="lg" onClick={onGoStrategies} className="gap-1 text-base h-14 rounded-full border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-sm">
              {t('hero.actions.view_strategies')} <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        <motion.div
          style={{ rotateX, rotateY }}
          initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative perspective-1000 hidden lg:block"
        >
          <div className="relative z-10 glass-card rounded-3xl p-2 border-white/10 shadow-2xl skew-y-1 transform transition-transform hover:skew-y-0 duration-700 group">
            <div className="bg-card/40 backdrop-blur-md rounded-2xl overflow-hidden border border-white/5">
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/5">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground opacity-50">
                  <Globe className="w-3 h-3" />
                  {t('chart.global_market')}
                </div>
              </div>
              <div className="h-[400px] w-full p-6 relative">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={curveData} margin={{ left: 10, right: 10 }}>
                    <defs>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.1} />
                    <XAxis dataKey="t" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, opacity: 0.5 }} dy={10} interval={0} />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '12px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '5 5' }}
                    />
                    <Area type="monotone" dataKey="p90" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.05} />
                    <Area type="monotone" dataKey="nav" stroke="none" fill="url(#colorProfit)" />
                    <Line
                      type="monotone"
                      dataKey="nav"
                      stroke="hsl(var(--primary))"
                      strokeWidth={4}
                      dot={false}
                      activeDot={{ r: 8, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -z-10 animate-pulse-soft" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-violet-500/20 rounded-full blur-[80px] -z-10 animate-pulse-soft delay-1000" />
        </motion.div>
      </motion.div>
    </section>
  );
}

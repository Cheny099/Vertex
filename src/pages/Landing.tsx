import { useMemo, useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { useTranslation } from "react-i18next";
import ParticleBackground from "@/components/ParticleBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { leaderboardApi, publicApi } from "@/api";
import { ArrowRight, BarChart3, ShieldCheck, Zap, ChevronRight, Activity, Globe, Puzzle, Quote } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
} from "recharts";

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation('landing');
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  // Mouse Parallax Logic
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 150 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXPos = e.clientX - rect.left;
    const mouseYPos = e.clientY - rect.top;
    const xPct = mouseXPos / width - 0.5;
    const yPct = mouseYPos / height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Scroll effect for navbar
  useEffect(() => {
    return scrollY.onChange((latest) => {
      setIsScrolled(latest > 50);
    });
  }, [scrollY]);

  // Parallax / Opacity transforms
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.95]);

  // ✅ 开关：暂时关闭排行榜（不渲染 + 不请求）
  const SHOW_LEADERBOARD = false;

  // 示例：收益曲线 + 预测区间
  const curveData = useMemo(() => {
    const base = [
      1.0, 1.02, 1.015, 1.04, 1.035, 1.06, 1.08, 1.075, 1.10, 1.12,
      1.11, 1.15, 1.18, 1.17, 1.20, 1.22, 1.21, 1.25, 1.28, 1.30,
    ];
    return base.map((nav, i) => {
      const t = `D${i + 1}`;
      const drift = (i / base.length) * 0.03;
      return {
        t,
        nav,
        p10: nav * (0.98 - drift * 0.3),
        p90: nav * (1.02 + drift * 0.3),
      };
    });
  }, []);

  // Fetch Hot Strategies
  const { data: hotStrategies, isLoading: isHotLoading } = useQuery({
    queryKey: ['public', 'strategies', 'hot'],
    queryFn: () => publicApi.getHotStrategies(3),
    staleTime: 60 * 1000,
  });

  return (
    <div className="relative min-h-screen overflow-hidden font-sans selection:bg-primary/20 bg-noise" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {/* Background gradient & ambient light */}
      <div className="fixed inset-0 bg-background" />
      <div className="fixed inset-0" style={{ background: "var(--gradient-background)" }} />
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px] mix-blend-screen animate-pulse-soft pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-violet-500/10 blur-[120px] mix-blend-screen animate-pulse-soft pointer-events-none" style={{ animationDelay: '2s' }} />

      <ParticleBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Floating Pill Navbar */}
        <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl z-50">
          <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`
              px-6 py-3 rounded-full border transition-all duration-300 flex items-center justify-between
              ${isScrolled
                ? "bg-background/80 backdrop-blur-xl border-border/50 shadow-2xl shadow-primary/5"
                : "bg-background/40 backdrop-blur-md border-white/5 shadow-lg"}
            `}
          >
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain logo-invert transition-all" />
              <div className="font-bold text-base tracking-tight hidden sm:block">
                {t('brand')}
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <Link to="/strategies" className="hover:text-primary transition-colors">{t('hero.actions.view_strategies')}</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">{t('footer.terms')}</Link>
            </nav>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'zh' : 'en')}
                className="w-8 h-8 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-0"
              >
                <Globe className="w-4 h-4" />
              </Button>

              {isAuthenticated ? (
                <Button onClick={() => navigate("/dashboard")} size="sm" className="rounded-full shadow-button px-4">
                  {t('hero.actions.dashboard')}
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="rounded-full hover:bg-primary/10">
                    {t('hero.actions.login')}
                  </Button>
                  <Button onClick={() => navigate("/register")} size="sm" className="rounded-full shadow-button bg-primary hover:bg-primary/90">
                    {t('hero.actions.register')}
                  </Button>
                </>
              )}
            </div>
          </motion.header>
        </div>

        <main className="flex-1 flex flex-col">
          {/* Hero Section */}
          <section className="px-6 md:px-10 pt-32 pb-20 md:pt-48 md:pb-32 relative">
            <motion.div
              style={{ opacity: heroOpacity, scale: heroScale }}
              className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center"
            >
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="space-y-8"
              >
                <div className="inline-flex gap-3 flex-wrap">
                  {[
                    { icon: ShieldCheck, text: t('hero.feature_risk') },
                    { icon: Zap, text: t('hero.feature_speed') },
                    { icon: Activity, text: t('hero.feature_viz') },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                    >
                      <Badge variant="outline" className="px-3 py-1.5 gap-1.5 text-xs font-medium border-primary/20 bg-primary/5 backdrop-blur-sm">
                        <item.icon className="w-3.5 h-3.5 text-primary" />
                        {item.text}
                      </Badge>
                    </motion.div>
                  ))}
                </div>

                <div className="space-y-6">
                  <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
                    <span className="block text-foreground/90">{t('hero.title_prefix')}</span>
                    <span className="relative">
                      {/* Animated Gradient Title */}
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
                    <Button size="lg" onClick={() => navigate("/dashboard")} className="gap-2 text-base px-8 h-14 rounded-full shadow-button glow-primary hover:scale-105 transition-transform">
                      {t('hero.actions.dashboard')} <ArrowRight className="w-5 h-5" />
                    </Button>
                  ) : (
                    <>
                      {/* Enhanced CTA with Shimmer */}
                      <Button size="lg" onClick={() => navigate("/register")} className="relative overflow-hidden gap-2 text-base px-8 h-14 rounded-full shadow-button glow-primary hover:scale-105 transition-transform group">
                        <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                        {t('hero.actions.register_now')} <ArrowRight className="w-5 h-5" />
                      </Button>
                    </>
                  )}

                  <Button variant="outline" size="lg" onClick={() => navigate("/strategies")} className="gap-1 text-base h-14 rounded-full border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-sm">
                    {t('hero.actions.view_strategies')} <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>

              {/* Dynamic Chart Preview - 3D/Glass effect container with Mouse Parallax */}
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
                      {/* Grid overlay */}
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
                          <YAxis hide domain={["auto", "auto"]} />
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

                {/* Simplified Floating Orbs */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -z-10 animate-pulse-soft" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-violet-500/20 rounded-full blur-[80px] -z-10 animate-pulse-soft delay-1000" />
              </motion.div>
            </motion.div>
          </section>

          {/* Features / Hot Strategies */}
          <section className="px-6 md:px-10 py-24 border-t border-border/40 bg-secondary/5 backdrop-blur-[2px] relative overflow-hidden">
            <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />
            <div className="max-w-6xl mx-auto space-y-12 relative z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t('hot_strategies.title')}</h2>
                </div>

                <Button variant="link" className="text-muted-foreground hover:text-primary p-0 h-auto" onClick={() => navigate("/strategies")}>
                  {t('leaderboard.view_full')} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {isHotLoading ? (
                  // Loading skeletons
                  [1, 2, 3].map(i => (
                    <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                  ))
                ) : hotStrategies?.map((s, idx) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                  >
                    <Card className="h-full glass-card border-white/5 hover:border-primary/50 transition-all duration-500 group hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 relative overflow-hidden flex flex-col">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                      <CardHeader className="pb-4 relative z-10">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className={`text-xl font-bold group-hover:text-primary transition-colors flex items-center gap-2`}>
                              {s.name}
                            </CardTitle>
                            <div className="flex flex-wrap gap-2 mt-3">
                              <span className="text-[10px] px-2.5 py-1 rounded-full bg-secondary/50 text-secondary-foreground border border-border/50 font-medium backdrop-blur-sm">
                                {s.status === 'active' ? t('hot_strategies.metrics.active') : s.status}
                              </span>
                              <span className="text-[10px] px-2.5 py-1 rounded-full bg-secondary/50 text-secondary-foreground border border-border/50 font-medium backdrop-blur-sm flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                {t('hot_strategies.metrics.protected')}
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className="font-mono text-[10px] opacity-50 group-hover:opacity-100 transition-opacity bg-background/50 backdrop-blur-sm">
                            {s.strategy_key}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="relative z-10 mt-auto">
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1 font-medium tracking-wide">{t('hot_strategies.metrics.roi_all')}</div>
                            <div className={`text-xl font-bold font-mono tracking-tight ${(s.metrics?.all?.return_pct || 0) >= 0 ? 'text-profit' : 'text-destructive'
                              }`}>
                              {s.metrics?.all ? `${(s.metrics.all.return_pct).toFixed(2)}%` : '--'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1 font-medium tracking-wide">{t('hot_strategies.metrics.drawdown')}</div>
                            <div className="text-sm font-bold text-foreground font-mono tracking-tight">
                              {s.metrics?.all ? `${(s.metrics.all.max_drawdown_pct).toFixed(2)}%` : '--'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1 font-medium tracking-wide">{t('hot_strategies.metrics.subscribers')}</div>
                            <div className="text-sm font-bold text-primary font-mono tracking-tight">{s.subscribers}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1 font-medium tracking-wide">{t('hot_strategies.metrics.last_signal')}</div>
                            <div className="text-sm font-bold text-foreground font-mono tracking-tight truncate">
                              {s.last_signal_at ? new Date(s.last_signal_at).toLocaleDateString() : '--'}
                            </div>
                          </div>
                        </div>
                        <Button className="w-full mt-6 rounded-xl bg-secondary/50 hover:bg-primary hover:text-white transition-all duration-300 text-muted-foreground border border-transparent hover:border-primary/20 hover:shadow-lg hover:shadow-primary/20" onClick={() => navigate(`/strategies/${s.id}`)}>
                          {t('hot_strategies.view_detail_btn')}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* About / Philosophy Section */}
          <section className="px-6 md:px-10 py-24 relative overflow-hidden bg-background/30 backdrop-blur-sm border-t border-border/40">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(100,100,255,0.05),transparent_40%)]" />

            <div className="max-w-4xl mx-auto space-y-16 relative z-10">
              {/* Header */}
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t('about.title')}</h2>
                <p className="text-lg text-primary font-medium tracking-wide">{t('about.subtitle')}</p>
                <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  {t('about.description')}
                </p>
              </div>

              {/* 3 Beliefs Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: Puzzle, text: t('about.beliefs.models') },
                  { icon: Activity, text: t('about.beliefs.strategies') },
                  { icon: Zap, text: t('about.beliefs.tech') }
                ].map((item, i) => (
                  <Card key={i} className="glass-card border-white/5 bg-primary/5 hover:bg-primary/10 transition-colors">
                    <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <item.icon className="w-6 h-6 text-primary" />
                      </div>
                      <p className="font-medium text-sm md:text-base leading-snug">{item.text}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Split Section: Philosophy + Team */}
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

          {/* Footer */}
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
        </main>
      </div>
    </div>
  );
};

export default Landing;

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2, Bot, ArrowUpRight, ClipboardCheck } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { cn } from '@/lib/utils';

// Mock data for the earnings comparison chart - more realistic with some volatility
const data = [
    { name: 'Day 1', original: 100, ai: 100 },
    { name: 'Day 2', original: 102.3, ai: 104.1 },
    { name: 'Day 3', original: 101.5, ai: 108.2 },
    { name: 'Day 4', original: 104.2, ai: 114.5 },
    { name: 'Day 5', original: 103.1, ai: 118.3 },
    { name: 'Day 6', original: 105.6, ai: 125.7 },
    { name: 'Day 7', original: 107.4, ai: 134.2 },
    { name: 'Day 8', original: 106.2, ai: 141.8 },
    { name: 'Day 9', original: 108.9, ai: 152.1 },
    { name: 'Day 10', original: 112.5, ai: 164.5 },
    { name: 'Day 11', original: 111.2, ai: 175.4 },
    { name: 'Day 12', original: 114.3, ai: 191.2 },
    { name: 'Day 13', original: 116.8, ai: 205.6 },
    { name: 'Day 14', original: 118.5, ai: 218.4 },
];

const AiAssistant = () => {
    const { t } = useTranslation(['admin', 'common']);

    return (
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                        {t('admin:ai_assistant.title')}
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl">
                        {t('admin:ai_assistant.description')}
                    </p>
                </div>
                <div className="flex items-center gap-4 px-6 py-4 bg-primary/5 border border-primary/20 rounded-xl shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <div className="space-y-0.5">
                        <p className="text-sm font-bold text-primary">
                            {t('admin:ai_assistant.status_active')}
                        </p>
                        <p className="text-[10px] text-primary/60 font-medium">
                            {t('admin:ai_assistant.status_desc')}
                        </p>
                    </div>
                    <Bot className="w-6 h-6 text-primary/40 ml-2" />
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="relative overflow-hidden group">
                    <CardHeader className="pb-2">
                        <CardDescription>{t('admin:ai_assistant.before_ai')}</CardDescription>
                        <CardTitle className="text-2xl font-bold">18.52%</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">{t('admin:ai_assistant.roi_label')}</div>
                    </CardContent>
                    <div className="absolute right-[-10px] bottom-[-10px] opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="w-24 h-24" />
                    </div>
                </Card>

                <Card className="relative overflow-hidden border-primary/30 bg-primary/5 group">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-primary font-medium">{t('admin:ai_assistant.after_ai')}</CardDescription>
                        <CardTitle className="text-3xl font-bold text-primary flex items-baseline gap-2">
                            118.40%
                            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 animate-bounce">
                                <ArrowUpRight className="w-3 h-3 mr-1" />
                                HIGH
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-primary/70 font-medium">{t('admin:ai_assistant.roi_label')}</div>
                    </CardContent>
                    <div className="absolute right-[-10px] bottom-[-10px] opacity-5 group-hover:opacity-10 transition-opacity text-primary">
                        <Sparkles className="w-24 h-24" />
                    </div>
                </Card>

                <Card className="bg-green-500/5 dark:bg-green-500/10 border-green-500/20">
                    <CardHeader className="pb-2">
                        <CardDescription>{t('admin:ai_assistant.roi_improvement')}</CardDescription>
                        <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
                            +539%
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">{t('admin:ai_assistant.multiplier_label')}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Chart Section */}
            <Card className="border-primary/20 overflow-hidden">
                <CardHeader className="border-b border-muted/50 bg-muted/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-primary">
                                <TrendingUp className="w-5 h-5" />
                                {t('admin:ai_assistant.performance_chart')}
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Real-time strategy rotation performance visualization.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-primary/70 border-primary/20 bg-primary/5">
                            Real-time
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="h-[400px] w-full pt-8 pb-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorOriginal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                tickFormatter={(val) => `${val}%`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--primary) / 0.2)',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            <Area
                                name={t('admin:ai_assistant.before_ai')}
                                type="monotone"
                                dataKey="original"
                                stroke="#94a3b8"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fillOpacity={1}
                                fill="url(#colorOriginal)"
                            />
                            <Area
                                name={t('admin:ai_assistant.after_ai')}
                                type="monotone"
                                dataKey="ai"
                                stroke="var(--primary)"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorAi)"
                                animationDuration={2500}
                                animationEasing="ease-in-out"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Strategy Card */}
                <Card className="shadow-sm border-muted/50">
                    <CardHeader className="pb-3 px-6 pt-6">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Bot className="w-5 h-5 text-primary" />
                            {t('admin:ai_assistant.active_strategy')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 px-6 pb-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-muted-foreground/10 group hover:border-primary/20 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                                    <TrendingUp className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold">ETH 极限趋势策略 v4.2</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">AI Selected • High Confidence</div>
                                </div>
                            </div>
                            <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20 px-2 py-0 text-[10px] uppercase font-bold dark:text-green-400">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Optimal
                            </Badge>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                            <AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <p className="text-xs text-primary/80 italic leading-relaxed">
                                {t('admin:ai_assistant.ai_notice')}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Optimization Log */}
                <Card className="shadow-sm border-muted/50">
                    <CardHeader className="pb-3 px-6 pt-6 flex flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ClipboardCheck className="w-5 h-5 text-primary" />
                            {t('admin:ai_assistant.optimization_log')}
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] opacity-60">Real-time Updates</Badge>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-2">
                        <div className="space-y-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex gap-4 relative">
                                    {i < 3 && <div className="absolute left-[7px] top-4 bottom-[-16px] w-[0.5px] bg-muted-foreground/20" />}
                                    <div className={cn(
                                        "h-3.5 w-3.5 rounded-full border-2 border-background z-10 mt-1",
                                        i === 1 ? "bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)] animate-pulse" : "bg-muted-foreground/30"
                                    )} />
                                    <div className="space-y-1 py-0.5">
                                        <div className="text-sm font-bold flex items-center gap-2">
                                            {t('admin:ai_assistant.log_event_switch')}
                                            {i === 1 && <Badge className="text-[9px] h-4 bg-primary/10 text-primary border-0">New</Badge>}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                                            {i === 1 ? t('admin:ai_assistant.log_time_now') : t('admin:ai_assistant.log_time_hours_ago', { hours: i * 4 })}
                                        </div>
                                        <p className="text-xs text-muted-foreground/80 leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-muted/50 border-dashed">
                                            {t('admin:ai_assistant.switch_reason')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AiAssistant;

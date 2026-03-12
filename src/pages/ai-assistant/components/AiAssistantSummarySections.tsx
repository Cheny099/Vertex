import { ArrowUpRight, Bot, CheckCircle2, AlertCircle, Sparkles, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type StatCard = {
  accent?: "green" | "primary";
  description: string;
  title: string;
  value: string;
  badgeLabel?: string;
};

type AiAssistantStatsGridProps = {
  statCards: StatCard[];
};

function AiAssistantStatsGrid({ statCards }: AiAssistantStatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Card className="group relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardDescription>{statCards[0].description}</CardDescription>
          <CardTitle className="text-2xl font-bold">{statCards[0].value}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground">{statCards[0].title}</div>
        </CardContent>
        <div className="absolute right-[-10px] bottom-[-10px] opacity-5 transition-opacity group-hover:opacity-10">
          <TrendingUp className="h-24 w-24" />
        </div>
      </Card>

      <Card className="group relative overflow-hidden border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardDescription className="font-medium text-primary">{statCards[1].description}</CardDescription>
          <CardTitle className="flex items-baseline gap-2 text-3xl font-bold text-primary">
            {statCards[1].value}
            <Badge variant="outline" className="animate-bounce border-primary/20 bg-primary/10 text-[10px] text-primary">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              {statCards[1].badgeLabel}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs font-medium text-primary/70">{statCards[1].title}</div>
        </CardContent>
        <div className="absolute right-[-10px] bottom-[-10px] text-primary opacity-5 transition-opacity group-hover:opacity-10">
          <Sparkles className="h-24 w-24" />
        </div>
      </Card>

      <Card className="border-green-500/20 bg-green-500/5 dark:bg-green-500/10">
        <CardHeader className="pb-2">
          <CardDescription>{statCards[2].description}</CardDescription>
          <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">{statCards[2].value}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground">{statCards[2].title}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function AiAssistantStatusBadge({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 px-6 py-4 shadow-sm">
      <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
      <div className="space-y-0.5">
        <p className="text-sm font-bold text-primary">{title}</p>
        <p className="text-[10px] font-medium text-primary/60">{subtitle}</p>
      </div>
      <Bot className="ml-2 h-6 w-6 text-primary/40" />
    </div>
  );
}

function AiAssistantStrategyCard({
  description,
  notice,
  subtitle,
  title,
}: {
  description: string;
  notice: string;
  subtitle: string;
  title: string;
}) {
  return (
    <Card className="border-muted/50 shadow-sm">
      <CardHeader className="px-6 pt-6 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-primary" />
          {description}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        <div className="group flex items-center justify-between rounded-xl border border-muted-foreground/10 bg-muted/40 p-4 transition-colors hover:border-primary/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 transition-colors group-hover:bg-primary/30">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold">{title}</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{subtitle}</div>
            </div>
          </div>
          <Badge className="border-green-500/20 bg-green-500/10 px-2 py-0 text-[10px] font-bold text-green-600 hover:bg-green-500/20 dark:text-green-400">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Optimal
          </Badge>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-primary/80 italic">{notice}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export { AiAssistantStatsGrid, AiAssistantStatusBadge, AiAssistantStrategyCard };

import { motion } from "framer-motion";
import { ClipboardCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type OptimizationLogItem = {
  id: number;
  isLatest: boolean;
  summary: string;
  timeLabel: string;
  title: string;
};

type AiAssistantOptimizationLogProps = {
  items: OptimizationLogItem[];
  realTimeLabel: string;
  title: string;
};

function AiAssistantOptimizationLog({ items, realTimeLabel, title }: AiAssistantOptimizationLogProps) {
  return (
    <Card className="border-muted/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <Badge variant="outline" className="text-[10px] opacity-60">
          {realTimeLabel}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6 px-6 pt-2 pb-6">
        {items.map((item) => (
          <div key={item.id} className="relative flex gap-4">
            {item.id < items.length ? <div className="absolute top-4 bottom-[-16px] left-[7px] w-[0.5px] bg-muted-foreground/20" /> : null}
            <div
              className={cn(
                "z-10 mt-1 h-3.5 w-3.5 rounded-full border-2 border-background",
                item.isLatest ? "bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)] animate-pulse" : "bg-muted-foreground/30",
              )}
            />
            <div className="space-y-1 py-0.5">
              <div className="flex items-center gap-2 text-sm font-bold">
                {item.title}
                {item.isLatest ? <Badge className="h-4 border-0 bg-primary/10 text-[9px] text-primary">New</Badge> : null}
              </div>
              <div className="text-[10px] font-medium uppercase tracking-tight text-muted-foreground">{item.timeLabel}</div>
              <p className="rounded-lg border border-muted/50 border-dashed bg-muted/30 p-2.5 text-xs leading-relaxed text-muted-foreground/80">
                {item.summary}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export { AiAssistantOptimizationLog };

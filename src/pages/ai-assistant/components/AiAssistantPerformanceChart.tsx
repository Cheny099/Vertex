import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ChartPoint = {
  ai: number;
  name: string;
  original: number;
};

type AiAssistantPerformanceChartProps = {
  chartData: readonly ChartPoint[];
  afterAiLabel: string;
  beforeAiLabel: string;
  description: string;
  title: string;
};

function AiAssistantPerformanceChart({ chartData, afterAiLabel, beforeAiLabel, description, title }: AiAssistantPerformanceChartProps) {
  return (
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="border-b border-muted/50 bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-primary">
              <TrendingUp className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary/70">
            Real-time
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="h-[400px] w-full pt-8 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData as ChartPoint[]}>
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
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                borderColor: "hsl(var(--primary) / 0.2)",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                fontSize: "12px",
              }}
              cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Area
              name={beforeAiLabel}
              type="monotone"
              dataKey="original"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#colorOriginal)"
            />
            <Area
              name={afterAiLabel}
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
  );
}

export { AiAssistantPerformanceChart };

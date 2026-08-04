import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HistoryStatItem {
  label: string;
  value: string | number;
  /** Only the PnL tile is tinted; cn() drops it when absent. */
  color?: string;
  subValue: string;
}

interface HistoryStatsGridProps {
  stats: HistoryStatItem[];
}

function HistoryStatsGridComponent({ stats }: HistoryStatsGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + index * 0.05 }}
          className="bg-card rounded-xl shadow-card border border-border/50 p-4"
        >
          <p className="text-sm text-muted-foreground">{stat.label}</p>
          <p className={cn('text-xl font-semibold font-mono mt-1', stat.color)}>{stat.value}</p>
          <p className="text-xs text-muted-foreground">{stat.subValue}</p>
        </motion.div>
      ))}
    </div>
  );
}

export const HistoryStatsGrid = memo(HistoryStatsGridComponent);

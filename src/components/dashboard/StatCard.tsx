import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'profit' | 'loss' | 'neutral';
  icon: LucideIcon;
  delay?: number;
}

const StatCard = ({ title, value, change, changeType = 'neutral', icon: Icon, delay = 0 }: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="glass-card rounded-xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold font-mono tracking-tight">{value}</p>
          {change && (
            <p className={cn(
              "text-sm font-medium",
              changeType === 'profit' && "text-profit",
              changeType === 'loss' && "text-loss",
              changeType === 'neutral' && "text-muted-foreground"
            )}>
              {change}
            </p>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          changeType === 'profit' && "bg-profit/10",
          changeType === 'loss' && "bg-loss/10",
          changeType === 'neutral' && "bg-primary/10"
        )}>
          <Icon className={cn(
            "w-6 h-6",
            changeType === 'profit' && "text-profit",
            changeType === 'loss' && "text-loss",
            changeType === 'neutral' && "text-primary"
          )} />
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;

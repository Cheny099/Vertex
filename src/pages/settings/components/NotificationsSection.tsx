import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

interface NotificationsSectionProps {
  t: TranslateFn;
}

export function NotificationsSection({ t }: NotificationsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-card rounded-xl shadow-card border border-border/50 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">{t('settings:section.notifications')}</h2>
        </div>
        <Badge variant="outline">{t('settings:notifications.developing')}</Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        {t('settings:notifications.desc')}
      </p>
    </motion.div>
  );
}

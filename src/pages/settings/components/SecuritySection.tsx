import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

interface SecuritySectionProps {
  t: TranslateFn;
}

export function SecuritySection({ t }: SecuritySectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-card rounded-xl shadow-card border border-border/50 p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">{t('settings:section.security')}</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium">{t('settings:profile.password_change')}</p>
            <p className="text-sm text-muted-foreground">{t('settings:profile.password_desc')}</p>
          </div>
          <Badge variant="outline">{t('settings:profile.developing')}</Badge>
        </div>
      </div>
    </motion.div>
  );
}

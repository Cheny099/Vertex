import { memo, useCallback } from 'react';
import type { TFunction } from 'i18next';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HistoryHeaderProps {
  t: TFunction;
  viewMode: 'system' | 'turboflow';
  onViewModeChange: (mode: 'system' | 'turboflow') => void;
}

function HistoryHeaderComponent({ t, viewMode, onViewModeChange }: HistoryHeaderProps) {
  const handleTabChange = useCallback((v: string) => {
    if (v === 'system' || v === 'turboflow') {
      onViewModeChange(v);
    }
  }, [onViewModeChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <h1 className="text-2xl font-bold">{t('history:title')}</h1>
        <p className="text-muted-foreground">{t('history:subtitle')}</p>
      </div>
      <div className="flex items-center gap-3">
        <Tabs
          value={viewMode}
          onValueChange={handleTabChange}
          className="bg-muted p-1 rounded-lg"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="system">{t('history:tabs.system')}</TabsTrigger>
            <TabsTrigger value="turboflow">{t('history:tabs.turboflow')}</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          {t('history:actions.export')}
        </Button>
      </div>
    </motion.div>
  );
}

export const HistoryHeader = memo(HistoryHeaderComponent);

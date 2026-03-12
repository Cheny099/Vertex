import { motion } from 'framer-motion';
import { Moon, Monitor, Sun } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ThemeMode = 'light' | 'dark' | 'system';
type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

interface AppearanceSectionProps {
  theme?: string;
  resolvedTheme?: string;
  language: string;
  onSetLightTheme: () => void;
  onSetDarkTheme: () => void;
  onSetSystemTheme: () => void;
  onLanguageChange: (value: string) => void;
  t: TranslateFn;
}

function ThemeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
        active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      }`}
    >
      {icon}
      <span className={`text-sm ${active ? 'font-medium' : 'text-muted-foreground'}`}>{label}</span>
    </button>
  );
}

export function AppearanceSection({
  theme,
  resolvedTheme,
  language,
  onSetLightTheme,
  onSetDarkTheme,
  onSetSystemTheme,
  onLanguageChange,
  t,
}: AppearanceSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="bg-card rounded-xl shadow-card border border-border/50 p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        {resolvedTheme === 'dark' ? (
          <Moon className="w-5 h-5 text-primary" />
        ) : (
          <Sun className="w-5 h-5 text-primary" />
        )}
        <h2 className="text-lg font-semibold">{t('settings:section.appearance')}</h2>
      </div>

      <div className="space-y-4">
        <div>
          <p className="font-medium mb-3">{t('settings:appearance.theme')}</p>
          <div className="grid grid-cols-3 gap-3">
            <ThemeButton
              active={theme === 'light'}
              onClick={onSetLightTheme}
              icon={<Sun className={`w-6 h-6 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />}
              label={t('settings:appearance.light')}
            />
            <ThemeButton
              active={theme === 'dark'}
              onClick={onSetDarkTheme}
              icon={<Moon className={`w-6 h-6 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />}
              label={t('settings:appearance.dark')}
            />
            <ThemeButton
              active={theme === 'system'}
              onClick={onSetSystemTheme}
              icon={<Monitor className={`w-6 h-6 ${theme === 'system' ? 'text-primary' : 'text-muted-foreground'}`} />}
              label={t('settings:appearance.system')}
            />
          </div>
        </div>

        <div>
          <p className="font-medium mb-3">{t('settings:appearance.language')}</p>
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-full h-14">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t('settings:appearance.english')}</SelectItem>
              <SelectItem value="zh">{t('settings:appearance.chinese')}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground mt-2">{t('settings:appearance.language_desc')}</p>
        </div>
      </div>
    </motion.div>
  );
}

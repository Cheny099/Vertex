import { motion } from 'framer-motion';
import { Copy, Key, Monitor, RefreshCcw, Shield, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import type { UserProfile } from '@/api';

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

interface ProfileSectionProps {
  profile?: UserProfile;
  onCopyUserId: () => void;
  t: TranslateFn;
}

export function ProfileSection({ profile, onCopyUserId, t }: ProfileSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative overflow-hidden bg-card rounded-2xl shadow-lg border border-border/50 group"
    >
      <div className="relative p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-primary/10 rounded-lg backdrop-blur-sm">
            <User className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">{t('settings:section.profile')}</h2>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-shrink-0 relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/60 p-0.5 shadow-xl shadow-primary/20">
              <div className="w-full h-full rounded-[14px] bg-card flex items-center justify-center overflow-hidden">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-primary/80">
                    {profile?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
            </div>
            <div className="absolute -bottom-3 -right-3">
              <Badge className={profile?.is_active ? 'bg-profit text-white border-2 border-card shadow-sm' : 'bg-muted text-muted-foreground border-2 border-card'}>
                {profile?.is_active ? t('settings:accounts.status_active') : t('settings:accounts.status_disabled')}
              </Badge>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
            <div className="space-y-1.5 p-3 rounded-xl hover:bg-secondary/30 transition-colors">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5" />
                {t('settings:profile.email')}
              </Label>
              <p className="font-semibold text-base truncate" title={profile?.email}>
                {profile?.email || '--'}
              </p>
            </div>

            <div
              className="space-y-1.5 p-3 rounded-xl hover:bg-secondary/30 transition-colors group/id cursor-pointer"
              onClick={onCopyUserId}
            >
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Key className="w-3.5 h-3.5" />
                {t('settings:profile.user_id')}
              </Label>
              <div className="flex items-center gap-2">
                <p className="font-mono font-bold text-base text-primary">{profile?.id || '--'}</p>
                <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover/id:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="space-y-1.5 p-3 rounded-xl hover:bg-secondary/30 transition-colors">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <RefreshCcw className="w-3.5 h-3.5" />
                {t('settings:profile.created_at')}
              </Label>
              <p className="font-medium text-sm">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '--'}
              </p>
            </div>

            <div className="space-y-1.5 p-3 rounded-xl hover:bg-secondary/30 transition-colors">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                {t('settings:profile.role')}
              </Label>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`${profile?.is_admin ? 'border-primary/20 text-primary bg-primary/5' : 'border-muted-foreground/20 text-muted-foreground bg-muted/20'}`}
                >
                  {profile?.is_admin ? t('settings:profile.role_admin') : t('settings:profile.role_user')}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

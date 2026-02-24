/**
 * @anchor-id SETTINGS_PAGE
 * @module-type page
 * @disposable false
 * @mock-data 用户数据和 API 密钥为 Mock，后端对接时替换
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Bell, Save, Sun, Moon, Monitor, Plus, Power, Trash2, Key, RefreshCcw, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/components/ThemeProvider';
import { accountApi, userApi, UserProfile, Account, AccountCreateDto } from '@/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 移除硬编码 Mock

const Settings = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t, i18n } = useTranslation(['settings', 'common']);
  const queryClient = useQueryClient();

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userApi.getProfile()
  });

  // Account Management State
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [newAccount, setNewAccount] = useState<Partial<AccountCreateDto>>({
    name: '',
    exchange: 'turboflow',
    type: 'real',
    api_key: '',
    api_secret: ''
  });

  // Queries
  const { data: accounts, isLoading: isAccountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountApi.list()
  });

  // ✅ Limit Check (Proactive)
  const turboflowCount = accounts?.filter(a => a.exchange === 'turboflow').length || 0;
  const otherCount = accounts?.filter(a => a.exchange !== 'turboflow').length || 0;
  const LIMIT_TF = 3;
  const LIMIT_OTHER = 10;

  const isLimitReached = (exchange: string) => {
    if (exchange === 'turboflow') return turboflowCount >= LIMIT_TF;
    return otherCount >= LIMIT_OTHER;
  };

  // Mutations
  const createAccountMutation = useMutation({
    mutationFn: (data: AccountCreateDto) => accountApi.create(data),
    onSuccess: (data: Account) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setIsAddAccountOpen(false);
      setNewAccount({ name: '', exchange: 'turboflow', type: 'real', api_key: '', api_secret: '' });
      toast.success(t('settings:accounts.toast.add_success'));

      // 自动触发 TurboFlow / Gate 验证流程
      if (data.exchange === 'turboflow' || data.exchange === 'gate_futures') {
        toast.promise(accountApi.verify(data.id).then(() => {
          // 验证完成后再次刷新列表以获取最新的 is_ready 状态
          queryClient.invalidateQueries({ queryKey: ['accounts'] });
        }), {
          loading: t('settings:accounts.toast.verify_loading', { name: data.name }),
          success: t('settings:accounts.toast.verify_success'),
          error: (err) => `${t('settings:accounts.toast.verify_failed')}: ${err.message || t('settings:accounts.toast.check_key')}`
        });
      }
    },
    onError: (error: any) => {
      // ✅ 409 Error Handling (Reactive)
      if (error.message?.includes('409') || error.message?.includes('limit reached')) {
        toast.error(t('settings:accounts.toast.limit_reached'));
      } else {
        toast.error(error.message || t('settings:accounts.toast.add_failed'));
      }
    }
  });

  const toggleAccountMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      accountApi.toggleActive(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success(t('settings:accounts.toast.status_updated'));
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id: number) => accountApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success(t('settings:accounts.toast.deleted'));
    }
  });

  const verifyAccountMutation = useMutation({
    mutationFn: (id: number) => accountApi.verify(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    }
  });

  const connectAccountMutation = useMutation({
    mutationFn: (id: number) => accountApi.connect(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success(t('settings:accounts.toast.connect_started'));
    },
    onError: (error: any) => toast.error(error.message || t('settings:accounts.toast.connect_failed'))
  });

  const resetSessionMutation = useMutation({
    mutationFn: ({ id, mode }: { id: number, mode: 'soft' | 'hard' }) => accountApi.resetSession(id, mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success(t('settings:accounts.toast.reset_success'));
    },
    onError: (error: any) => toast.error(error.message || t('settings:accounts.toast.reset_failed'))
  });



  // 注意: 后端无 updateProfile / changePassword 接口，已移除相关 mutation


  if (isProfileLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6" id="settings">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </motion.div>

      {/* Profile Section - Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden bg-card rounded-2xl shadow-lg border border-border/50 group"
      >
        {/* Decorative Background Gradient - Removed for cleaner look */}


        <div className="relative p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-primary/10 rounded-lg backdrop-blur-sm">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">{t('settings:section.profile')}</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar Section */}
            <div className="flex-shrink-0 relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/60 p-0.5 shadow-xl shadow-primary/20">
                <div className="w-full h-full rounded-[14px] bg-card flex items-center justify-center overflow-hidden">
                  {profile?.avatar ? (
                    <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-primary/80">{profile?.email?.[0]?.toUpperCase() || 'U'}</span>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-3 -right-3">
                <Badge className={profile?.is_active ? 'bg-profit text-white border-2 border-card shadow-sm' : 'bg-muted text-muted-foreground border-2 border-card'}>
                  {profile?.is_active ? t('settings:accounts.status_active') : t('settings:accounts.status_disabled')}
                </Badge>
              </div>
            </div>

            {/* Info Grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
              {/* Email */}
              <div className="space-y-1.5 p-3 rounded-xl hover:bg-secondary/30 transition-colors">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5" />
                  {t('settings:profile.email')}
                </Label>
                <p className="font-semibold text-base truncate" title={profile?.email}>{profile?.email || '--'}</p>
              </div>

              {/* User ID */}
              <div className="space-y-1.5 p-3 rounded-xl hover:bg-secondary/30 transition-colors group/id cursor-pointer"
                onClick={() => {
                  if (profile?.id) {
                    navigator.clipboard.writeText(String(profile.id));
                    toast.success('User ID copied');
                  }
                }}>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Key className="w-3.5 h-3.5" />
                  {t('settings:profile.user_id')}
                </Label>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-bold text-base text-primary">{profile?.id || '--'}</p>
                  <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover/id:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Created At */}
              <div className="space-y-1.5 p-3 rounded-xl hover:bg-secondary/30 transition-colors">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <RefreshCcw className="w-3.5 h-3.5" />
                  {t('settings:profile.created_at')}
                </Label>
                <p className="font-medium text-sm">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '--'}
                </p>
              </div>

              {/* Status/Role (Placeholder for future) */}
              <div className="space-y-1.5 p-3 rounded-xl hover:bg-secondary/30 transition-colors">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  {t('settings:profile.role')}
                </Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${profile?.is_admin ? 'border-primary/20 text-primary bg-primary/5' : 'border-muted-foreground/20 text-muted-foreground bg-muted/20'}`}>
                    {profile?.is_admin
                      ? t('settings:profile.role_admin')
                      : t('settings:profile.role_user')
                    }
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Security Section */}
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

      {/* Appearance Section */}
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
              <button
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${theme === 'light'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
                  }`}
              >
                <Sun className={`w-6 h-6 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm ${theme === 'light' ? 'font-medium' : 'text-muted-foreground'}`}>{t('settings:appearance.light')}</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${theme === 'dark'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
                  }`}
              >
                <Moon className={`w-6 h-6 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm ${theme === 'dark' ? 'font-medium' : 'text-muted-foreground'}`}>{t('settings:appearance.dark')}</span>
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${theme === 'system'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
                  }`}
              >
                <Monitor className={`w-6 h-6 ${theme === 'system' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm ${theme === 'system' ? 'font-medium' : 'text-muted-foreground'}`}>{t('settings:appearance.system')}</span>
              </button>
            </div>
          </div>

          <div>
            <p className="font-medium mb-3">{t('settings:appearance.language')}</p>
            <Select
              value={i18n.language}
              onValueChange={(val) => i18n.changeLanguage(val)}
            >
              <SelectTrigger className="w-full h-14">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="zh">中文 (简体)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">{t('settings:appearance.language_desc')}</p>
          </div>
        </div>
      </motion.div>

      {/* Accounts Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        id="accounts"
        className="bg-card rounded-xl p-6 border border-border/50"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <RefreshCcw className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('settings:section.accounts')}</h2>
          </div>
          <Button size="sm" onClick={() => setIsAddAccountOpen(true)} className="gradient-primary">
            <Plus className="w-4 h-4 mr-1" /> {t('settings:accounts.add')}
          </Button>
        </div>

        <div className="space-y-4">
          {isAccountsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : !accounts || accounts.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-lg border-border/50">
              <p className="text-muted-foreground">{t('settings:accounts.no_accounts')}</p>
            </div>
          ) : (
            accounts.map((account: Account) => (
              <div key={account.id} className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-center gap-4">
                  <div className="w-auto px-2 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="font-bold text-[10px] text-primary whitespace-nowrap">{t(`common:exchanges.${account.exchange}`)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{account.name}</p>
                      <Badge variant={account.is_ready ? "outline" : "secondary"} className={`text-[10px] h-4 ${account.is_ready ? 'bg-profit/10 text-profit border-profit/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
                        {account.is_ready ? t('settings:accounts.is_ready') : t('settings:accounts.not_ready')}
                      </Badge>
                      <Badge variant={account.is_active ? "default" : "secondary"} className={`text-[10px] h-4 ${account.is_active ? 'bg-green-500 hover:bg-green-600' : ''}`}>
                        {account.is_active ? t('settings:accounts.active') : t('settings:accounts.disabled')}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <div className="flex items-center gap-3 text-[10px]">
                        <p className="text-muted-foreground font-mono truncate max-w-[120px]">
                          {account.api_key || (account.exchange === 'week' ? t('settings:accounts.browser_session') : '********')}
                        </p>
                        {account.available_margin !== undefined && (
                          <div className="flex items-center gap-1.5 border-l border-border/50 pl-2">
                            <span className="text-muted-foreground">{t('common:finance.available')}:</span>
                            <span className="font-bold text-primary">{account.available_margin} {account.currency || 'USDT'}</span>
                          </div>
                        )}
                      </div>
                      {account.last_error && (
                        <p className="text-[10px] text-destructive truncate max-w-[200px]" title={account.last_error}>
                          {t('common:error')}: {account.last_error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(account.exchange === 'turboflow' || account.exchange === 'gate_futures' || account.exchange === 'binance_futures') ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-[11px] gap-1 px-2"
                      onClick={() => {
                        toast.promise(verifyAccountMutation.mutateAsync(account.id), {
                          loading: t('settings:accounts.toast.verify_loading'),
                          success: t('settings:accounts.toast.verify_success'),
                          error: (err) => `${t('settings:accounts.toast.verify_failed')}: ${err.message || t('settings:accounts.toast.check_key')}`
                        });
                      }}
                      disabled={verifyAccountMutation.isPending}
                    >
                      <Shield className="w-3 h-3" />
                      {verifyAccountMutation.isPending && verifyAccountMutation.variables === account.id ? t('settings:accounts.verifying') : t('settings:accounts.verify')}
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[11px] gap-1 px-2"
                        onClick={() => connectAccountMutation.mutate(account.id)}
                        disabled={connectAccountMutation.isPending}
                      >
                        <Power className="w-3 h-3" />
                        {t('settings:accounts.connect')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-muted"
                        onClick={() => {
                          if (confirm(t('settings:accounts.reset_session') + '? (Soft Reset)')) {
                            resetSessionMutation.mutate({ id: account.id, mode: 'soft' });
                          }
                        }}
                        title={t('settings:accounts.reset_session')}
                      >
                        <RefreshCcw className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                  <Switch
                    checked={account.is_active}
                    onCheckedChange={(checked) => toggleAccountMutation.mutate({ id: account.id, is_active: checked })}
                    disabled={toggleAccountMutation.isPending}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => {
                      if (confirm(t('settings:accounts.delete_confirm'))) {
                        deleteAccountMutation.mutate(account.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Add Account Dialog */}
      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('settings:accounts.dialog.title')}</DialogTitle>
            <DialogDescription>
              {t('settings:accounts.dialog.desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="account-name">{t('settings:accounts.dialog.name_label')}</Label>
              <Input
                id="account-name"
                placeholder={t('settings:accounts.dialog.name_placeholder')}
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="exchange">{t('settings:accounts.dialog.exchange_label')}</Label>
              <Select
                value={newAccount.exchange}
                onValueChange={(val) => setNewAccount({ ...newAccount, exchange: val as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('settings:accounts.dialog.exchange_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="turboflow" disabled={isLimitReached('turboflow')}>
                    {t('common:exchanges.turboflow')} {isLimitReached('turboflow') ? `(${turboflowCount}/${LIMIT_TF} Full)` : `(${turboflowCount}/${LIMIT_TF})`}
                  </SelectItem>
                  <SelectItem value="gate_futures" disabled={isLimitReached('gate_futures')}>
                    {t('common:exchanges.gate_futures')}
                  </SelectItem>
                  <SelectItem value="binance_futures" disabled={isLimitReached('binance_futures')}>
                    {t('common:exchanges.binance_futures')}
                  </SelectItem>
                  <SelectItem value="week" disabled={isLimitReached('week')}>
                    {t('common:exchanges.week')} ({t('settings:accounts.browser_session')}) {isLimitReached('week') ? `(${otherCount}/${LIMIT_OTHER} Full)` : `(${otherCount}/${LIMIT_OTHER})`}
                  </SelectItem>
                </SelectContent>
              </Select>
              {isLimitReached(newAccount.exchange || 'turboflow') && (
                <p className="text-[11px] text-destructive mt-1">
                  {t('settings:accounts.limit_warning')}
                </p>
              )}
            </div>

            {(newAccount.exchange === 'turboflow' || newAccount.exchange === 'gate_futures' || newAccount.exchange === 'binance_futures') && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="API Key"
                    value={newAccount.api_key}
                    onChange={(e) => setNewAccount({ ...newAccount, api_key: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="api-secret">API Secret</Label>
                  <Input
                    id="api-secret"
                    type="password"
                    placeholder="API Secret"
                    value={newAccount.api_secret}
                    onChange={(e) => setNewAccount({ ...newAccount, api_secret: e.target.value })}
                  />
                </div>
              </>
            )}

            {newAccount.exchange === 'week' && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-xs text-muted-foreground">
                  {t('settings:accounts.dialog.weex_note')}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddAccountOpen(false)}>{t('settings:accounts.dialog.cancel')}</Button>
            <Button
              className="gradient-primary"
              onClick={() => {
                const payload = { ...newAccount } as AccountCreateDto;
                if (payload.exchange === 'week') {
                  delete payload.api_key;
                  delete payload.api_secret;
                }
                createAccountMutation.mutate(payload);
              }}
              disabled={
                createAccountMutation.isPending ||
                !newAccount.name ||
                ((newAccount.exchange === 'turboflow' || newAccount.exchange === 'gate_futures' || newAccount.exchange === 'binance_futures') && (!newAccount.api_key || !newAccount.api_secret)) ||
                isLimitReached(newAccount.exchange || 'turboflow') // ✅ Confirm Disabled
              }
            >
              {createAccountMutation.isPending ? t('settings:accounts.dialog.submitting') : t('settings:accounts.dialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Notifications Section */}
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
    </div>
  );
};

export default Settings;

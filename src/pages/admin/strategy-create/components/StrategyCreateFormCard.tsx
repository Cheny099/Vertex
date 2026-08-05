import { Activity, Check, Info, Key, Zap } from 'lucide-react';
import { Controller, type Control, type FieldErrors, type UseFormHandleSubmit, type UseFormRegister } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { StrategyFormValues } from '../utils';

interface StrategyCreateFormCardProps {
    t: (key: string) => string;
    register: UseFormRegister<StrategyFormValues>;
    control: Control<StrategyFormValues>;
    errors: FieldErrors<StrategyFormValues>;
    watchStatus: StrategyFormValues['status'];
    setStrategyKey: () => void;
}

export const StrategyCreateFormCard = ({
    t,
    register,
    control,
    errors,
    watchStatus,
    setStrategyKey,
}: StrategyCreateFormCardProps) => {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white/60 backdrop-blur-3xl border border-white/40 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] p-8 md:p-10">
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2.5 rounded-2xl">
                            <Info className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black">{t('strategies:create.metadata_api')}</h2>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">{t('strategies:create.metadata_desc')}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold ml-1">{t('strategies:detail.strategy_key')}</Label>
                                <span className="text-xs uppercase tracking-widest text-muted-foreground font-black opacity-50">{t('strategies:create.unique_id_label')}</span>
                            </div>
                            <div className="flex gap-2">
                                <div className="relative flex-1 group">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                    <Input
                                        {...register('strategyKey')}
                                        placeholder="sk_..."
                                        className={cn(
                                            'pl-12 font-mono text-xs h-12 bg-white/50 border-white/20 rounded-2xl shadow-inner-sm focus-visible:ring-primary/20',
                                            errors.strategyKey && 'border-destructive ring-destructive/20'
                                        )}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-12 w-12 rounded-2xl bg-white/50 border-white/20 hover:bg-white transiton-all"
                                    onClick={setStrategyKey}
                                    title={t('strategies:create.gen_key')}
                                >
                                    <Zap className="w-4.5 h-4.5 text-primary" />
                                </Button>
                            </div>
                            {/* Without this the key requirement added for edit mode would be a Save
                                button that silently does nothing: react-hook-form blocks the submit
                                and nothing else in this card reports why. */}
                            {errors.strategyKey && (
                                <p className="text-xs text-destructive font-medium mt-1.5 ml-1">
                                    {errors.strategyKey.message as string}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground ml-1">{t('strategies:create.key_desc')}</p>
                        </div>

                        <div className="space-y-2.5">
                            <Label className="text-sm font-bold ml-1">{t('strategies:create.name_label')}</Label>
                            <Input
                                placeholder={t('strategies:create.name_placeholder')}
                                {...register('name')}
                                className={cn('h-12 bg-white/50 border-white/20 rounded-2xl shadow-inner-sm focus-visible:ring-primary/20', errors.name && 'border-destructive ring-destructive/20')}
                            />
                            {errors.name && <p className="text-xs text-destructive font-medium mt-1.5 ml-1">{errors.name.message as string}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2.5">
                                <Label className="text-sm font-bold ml-1">{t('strategies:create.type_label')}</Label>
                                <Input
                                    placeholder={t('strategies:create.type_placeholder')}
                                    {...register('type')}
                                    className="h-12 bg-white/50 border-white/20 rounded-2xl shadow-inner-sm focus-visible:ring-primary/20 font-medium"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <Label className="text-sm font-bold ml-1">{t('strategies:create.pair_label')}</Label>
                                <Input
                                    placeholder={t('strategies:create.pair_placeholder')}
                                    {...register('pair')}
                                    className="h-12 bg-white/50 border-white/20 rounded-2xl shadow-inner-sm focus-visible:ring-primary/20 font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <Label className="text-sm font-bold ml-1">{t('strategies:create.desc_label')}</Label>
                            <Textarea
                                placeholder={t('strategies:create.desc_placeholder')}
                                rows={3}
                                {...register('description')}
                                className="bg-white/50 border-white/20 rounded-2xl shadow-inner-sm focus-visible:ring-primary/20 resize-none min-h-[100px]"
                            />
                        </div>

                        <div className="pt-4">
                            <div className="bg-slate-50/50 rounded-3xl p-5 flex items-center justify-between border border-slate-100/50">
                                <div className="flex items-center gap-4">
                                    <div className={cn('p-2 rounded-xl', watchStatus === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 text-slate-400')}>
                                        {watchStatus === 'active' ? <Check className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                                    </div>
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-bold">{t('strategies:detail.signal_status')}</Label>
                                        <p className="text-xs text-muted-foreground font-medium">
                                            {watchStatus === 'active' ? t('strategies:detail.status_active') : t('strategies:detail.status_inactive')}
                                        </p>
                                    </div>
                                </div>
                                <Controller
                                    name="status"
                                    control={control}
                                    render={({ field }) => (
                                        <Switch
                                            checked={field.value === 'active'}
                                            onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')}
                                            className="data-[state=checked]:bg-emerald-500"
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

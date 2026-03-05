import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { Copy, Plus, Trash2, Ticket, Search, ShieldAlert, Loader2, Check, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Variants for consistent animations
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
} as const;

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
} as const;

import { adminApi, translateBackendErrorMessage, type AdminInviteCreateRequest } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function InviteCodesManagement() {
    const { t, i18n } = useTranslation(['admin', 'common']);
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createdCode, setCreatedCode] = useState<{ plainCode: string, channel: string | null } | null>(null);
    const [hasCopied, setHasCopied] = useState(false);

    // Global Confirm State for generic actions
    const [actionConfirm, setActionConfirm] = useState<{
        open: boolean;
        title: string;
        desc: string;
        onConfirm: () => void;
    }>({ open: false, title: "", desc: "", onConfirm: () => {} });

    // New Invite Form State
    const [newInvite, setNewInvite] = useState<AdminInviteCreateRequest>({
        channel: '',
        notes: '',
        max_uses: 1,
    });

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['adminInvites', page],
        queryFn: () => adminApi.invites.list({ page, limit: 20, include_revoked: true }),
    });
    const toErrorText = (err: any) =>
        translateBackendErrorMessage((err as any)?.message || '') ||
        (err as any)?.message ||
        t('admin:error_operation_failed');
    const queryErrorText = isError
        ? toErrorText(error)
        : '';
    const pageSize = 20;
    const total = data?.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const createMutation = useMutation({
        mutationFn: (data: AdminInviteCreateRequest) => adminApi.invites.create(data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['adminInvites'] });
            setCreatedCode({ plainCode: res.code, channel: res.channel || null });
            setHasCopied(false);
            // Don't close so they can copy it!
        },
        onError: (error: any) => {
            toast.error(toErrorText(error));
        }
    });

    const revokeMutation = useMutation({
        mutationFn: (id: number) => adminApi.invites.revoke(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminInvites'] });
            toast.success(t('admin:invites.revoked_success', 'Invite code successfully revoked.'));
        },
        onError: (error: any) => {
            toast.error(toErrorText(error));
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();

        // Convert local datetime string to ISO string for the backend payload
        let expiresAtIso = undefined;
        if (newInvite.expires_at) {
            expiresAtIso = new Date(newInvite.expires_at).toISOString();
        }

        createMutation.mutate({
            ...newInvite,
            channel: newInvite.channel?.trim() || undefined,
            notes: newInvite.notes?.trim() || undefined,
            expires_at: expiresAtIso,
        });
    };

    const handleCopy = (e?: React.MouseEvent) => {
        if (createdCode) {
            const textToCopy = createdCode.plainCode;

            const successCallback = () => {
                setHasCopied(true);
                toast.success(t('admin:copy_success', 'Copied to clipboard'));
            };

            if (navigator.clipboard && window.isSecureContext) {
                // Use standard Clipboard API if available and secure
                navigator.clipboard.writeText(textToCopy).then(successCallback).catch((err) => {
                    toast.error(t('admin:invites.copy_failed', 'Failed to copy using clipboard API.'));
                    console.error(err);
                });
            } else {
                // Fallback for non-secure contexts (like HTTP LAN IP)
                const textArea = document.createElement("textarea");
                textArea.value = textToCopy;

                // Avoid scrolling to bottom
                textArea.style.top = "0";
                textArea.style.left = "0";
                textArea.style.position = "fixed";

                // Ensure it's not totally invisible but doesn't take up layout space
                textArea.style.width = "2rem";
                textArea.style.height = "2rem";
                textArea.style.padding = "0";
                textArea.style.border = "none";
                textArea.style.outline = "none";
                textArea.style.boxShadow = "none";
                textArea.style.background = "transparent";
                // Let it stay in DOM, avoid negative margins or 0 opacity which gets flagged
                const container = e?.currentTarget?.parentElement || document.body;
                container.appendChild(textArea);

                textArea.focus();
                textArea.select();

                try {
                    const successful = document.execCommand('copy');
                    if (successful) {
                        successCallback();
                    } else {
                        toast.error(t('admin:invites.copy_failed', 'Copy failed'));
                    }
                } catch (err) {
                    toast.error(t('admin:invites.copy_failed', 'Copy failed'));
                    console.error('Fallback: Oops, unable to copy', err);
                }
                container.removeChild(textArea);
            }
        }
    };

    const closeCreateDialog = () => {
        setIsCreateOpen(false);
        setCreatedCode(null);
        setNewInvite({ channel: '', notes: '', max_uses: 1, expires_at: '' });
    };

    const handleCloseCreate = (open: boolean) => {
        if (open) {
            setIsCreateOpen(true);
            return;
        }
        if (createdCode && !hasCopied) {
            setActionConfirm({
                open: true,
                title: t('admin:warning', 'Warning'),
                desc: t('admin:invites.warning_not_copied', 'You have not copied the code! Once closed, you will NEVER see the full code again. Close anyway?'),
                onConfirm: () => closeCreateDialog()
            });
            return;
        }
        setIsCreateOpen(false);
        if (!open) {
            setCreatedCode(null);
            setNewInvite({ channel: '', notes: '', max_uses: 1, expires_at: '' });
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-6 p-4 md:p-8 min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white"
        >
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">{t('admin:invites.title', 'Invite Codes')}</h1>
                    <p className="text-slate-500 font-medium">
                        {t('admin:invites.description', 'Manage invite codes used to grant users subscription access.')}
                    </p>
                </div>
                <Button onClick={() => handleCloseCreate(true)} className="h-10 px-5 rounded-xl gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                    <Plus className="w-4 h-4" />
                    {t('admin:invites.new_code', 'Generate Code')}
                </Button>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
                    <CardHeader>
                        <CardTitle className="text-lg">{t('admin:invites.list_title', 'All Issued Codes')}</CardTitle>
                        <CardDescription>
                            {t('admin:invites.list_desc', 'Only the last 4 characters of the code are visible for security.')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('admin:invites.column_id', 'ID')}</TableHead>
                                        <TableHead>{t('admin:invites.column_channel', 'Channel')}</TableHead>
                                        <TableHead>{t('admin:invites.column_code', 'Code Hint')}</TableHead>
                                        <TableHead>{t('admin:invites.column_uses', 'Usage')}</TableHead>
                                        <TableHead>{t('admin:invites.column_status', 'Status')}</TableHead>
                                        <TableHead>{t('admin:invites.column_created', 'Created At')}</TableHead>
                                        <TableHead>{t('admin:invites.column_expires', 'Expires At')}</TableHead>
                                        <TableHead className="text-right">{t('admin:invites.column_actions', 'Actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isError ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center text-destructive">
                                                {queryErrorText}
                                            </TableCell>
                                        </TableRow>
                                    ) : isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center">
                                                <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                            </TableCell>
                                        </TableRow>
                                    ) : !data?.items?.length ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                                {t('admin:no_data', 'No data available')}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data?.items.map((item) => {
                                            const isRevoked = !!item.revoked_at;
                                            const isFullyUsed = item.used_count >= item.max_uses;

                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-mono text-xs">{item.id}</TableCell>
                                                    <TableCell>
                                                        <span className="font-medium">{item.channel || '-'}</span>
                                                        {item.notes && (
                                                            <p className="text-xs text-muted-foreground truncate max-w-[150px]" title={item.notes}>
                                                                {item.notes}
                                                            </p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-mono">{item.code_hint}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <span className={isFullyUsed ? 'text-warning font-medium' : ''}>
                                                                {item.used_count} / {item.max_uses}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {isRevoked ? (
                                                            <Badge variant="destructive" className="bg-destructive/20 text-destructive border-0">
                                                                {t('admin:invites.status_revoked', 'Revoked')}
                                                            </Badge>
                                                        ) : isFullyUsed ? (
                                                            <Badge variant="outline" className="opacity-50">
                                                                {t('admin:invites.status_exhausted', 'Exhausted')}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-none border-0">
                                                                {t('admin:invites.status_active', 'Active')}
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">
                                                        {format(new Date(item.created_at), 'yyyy-MM-dd HH:mm')}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">
                                                        {item.expires_at ? format(new Date(item.expires_at), 'yyyy-MM-dd HH:mm') : t('admin:invites.never_expire', 'Never')}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            disabled={isRevoked}
                                                            onClick={() => {
                                                                setActionConfirm({
                                                                    open: true,
                                                                    title: t('admin:confirm', 'Confirm'),
                                                                    desc: t('admin:invites.revoke_confirm', 'Are you sure you want to revoke this code? It will immediately stop working for new users.'),
                                                                    onConfirm: () => revokeMutation.mutate(item.id)
                                                                });
                                                            }}
                                                        >
                                                            {revokeMutation.isPending && revokeMutation.variables === item.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {total > 0 && (
                            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                                <div>{t('admin:page_info', { page, total: totalPages })}</div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page <= 1}
                                    >
                                        {t('admin:prev')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages}
                                    >
                                        {t('admin:next')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Create / Reveal Modal */}
            <Dialog open={isCreateOpen} onOpenChange={handleCloseCreate}>
                <DialogContent className="sm:max-w-md p-6 bg-white/95 dark:bg-slate-950/95 backdrop-blur-3xl border border-white/20 shadow-2xl overflow-hidden rounded-3xl">
                    <DialogHeader className="mb-2">
                        <DialogTitle className="text-xl font-bold">{createdCode ? t('admin:invites.your_new_code', 'Invite Code Ready') : t('admin:invites.create_title', 'Generate Invite Code')}</DialogTitle>
                        <DialogDescription className="text-muted-foreground/80 mt-1">
                            {createdCode
                                ? t('admin:invites.copy_save_warning', 'Please copy this code NOW. For security reasons, it will never be shown again.')
                                : t('admin:invites.create_desc', 'Create a new invite code to allow users to subscribe.')}
                        </DialogDescription>
                    </DialogHeader>

                    {createdCode ? (
                        <div className="flex flex-col items-center space-y-4 py-6">
                            <div className="p-4 bg-primary/10 rounded-full mb-2">
                                <Ticket className="w-8 h-8 text-primary" />
                            </div>
                            <div className="text-3xl font-mono tracking-widest font-black text-center bg-secondary p-4 rounded-xl border border-primary/20 w-full select-all">
                                {createdCode.plainCode}
                            </div>
                            {createdCode.channel && (
                                <div className="text-sm text-muted-foreground">
                                    {t('admin:invites.channel_prefix', 'Channel:')} <span className="font-medium">{createdCode.channel}</span>
                                </div>
                            )}
                            <Button
                                onClick={handleCopy}
                                className={`w-full mt-4 h-12 text-lg ${hasCopied ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                            >
                                {hasCopied ? (
                                    <><Check className="w-5 h-5 mr-2" /> {t('common:copied', 'Copied!')}</>
                                ) : (
                                    <><Copy className="w-5 h-5 mr-2" /> {t('common:copy', 'Copy Code')}</>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleCreate} className="space-y-5 px-1 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="channel" className="text-sm font-semibold flex items-center justify-between">
                                    <span>{t('admin:invites.channel', 'Channel')}</span>
                                    <span className="text-xs text-muted-foreground font-normal">{t('admin:invites.optional', '(Optional)')}</span>
                                </Label>
                                <Input
                                    id="channel"
                                    className="bg-muted/30 focus-visible:ring-primary/20 transition-all"
                                    placeholder={t('admin:invites.channel_placeholder', 'e.g. TikTok_KOL_John')}
                                    value={newInvite.channel || ''}
                                    onChange={(e) => setNewInvite({ ...newInvite, channel: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="max_uses" className="text-sm font-semibold text-slate-900">{t('admin:invites.max_uses', 'Max Uses')}</Label>
                                <Input
                                    id="max_uses"
                                    type="number"
                                    min="1"
                                    max="10000"
                                    className="bg-muted/30 focus-visible:ring-primary/20 transition-all font-mono"
                                    value={newInvite.max_uses}
                                    onChange={(e) => setNewInvite({ ...newInvite, max_uses: parseInt(e.target.value) || 1 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="expires_at" className="text-sm font-semibold flex items-center justify-between">
                                    <span>{t('admin:invites.expires_at', 'Expires At')}</span>
                                    <span className="text-xs text-muted-foreground font-normal">{t('admin:invites.optional', '(Optional)')}</span>
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal bg-muted/30 focus-visible:ring-primary/20 transition-all font-mono",
                                                !newInvite.expires_at && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {newInvite.expires_at ? format(new Date(newInvite.expires_at), "PPP", { locale: i18n.language === 'zh' ? zhCN : enUS }) : <span>{t('admin:invites.pick_date', 'Pick a date')}</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={newInvite.expires_at ? new Date(newInvite.expires_at) : undefined}
                                            onSelect={(date) => {
                                                if (date) {
                                                    date.setHours(23, 59, 59, 999);
                                                    setNewInvite({ ...newInvite, expires_at: date.toISOString() });
                                                } else {
                                                    setNewInvite({ ...newInvite, expires_at: '' });
                                                }
                                            }}
                                            initialFocus
                                            locale={i18n.language === 'zh' ? zhCN : enUS}
                                            disabled={(date) => {
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                return date < today;
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <p className="text-xs text-muted-foreground ml-1">
                                    {t('admin:invites.expires_at_hint', 'Leave empty for codes that never expire.')}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes" className="text-sm font-semibold flex items-center justify-between">
                                    <span>{t('admin:invites.notes', 'Notes')}</span>
                                    <span className="text-xs text-muted-foreground font-normal">{t('admin:invites.optional', '(Optional)')}</span>
                                </Label>
                                <Input
                                    id="notes"
                                    className="bg-muted/30 focus-visible:ring-primary/20 transition-all"
                                    placeholder={t('admin:invites.notes_placeholder', 'Internal reference notes...')}
                                    value={newInvite.notes || ''}
                                    onChange={(e) => setNewInvite({ ...newInvite, notes: e.target.value })}
                                />
                            </div>

                            <DialogFooter className="pt-6 border-t mt-6">
                                <Button type="button" variant="ghost" onClick={() => handleCloseCreate(false)}>
                                    {t('common:cancel', 'Cancel')}
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending}>
                                    {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    {t('admin:invites.generate_btn', 'Generate')}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={actionConfirm.open} onOpenChange={(open) => setActionConfirm((prev) => ({ ...prev, open }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{actionConfirm.title}</AlertDialogTitle>
                        <AlertDialogDescription>{actionConfirm.desc}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common:cancel', 'Cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                actionConfirm.onConfirm();
                                setActionConfirm((prev) => ({ ...prev, open: false }));
                            }}
                        >
                            {t('common:confirm', 'Confirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    );
}


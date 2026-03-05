import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, RefreshCw, XCircle, Zap, Eye, Clock, Search, Filter, PlayCircle, PauseCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { adminApi, Order, translateBackendErrorMessage } from '@/api';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from "@/components/ui/switch";
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
// Sheet removed in favor of Dialog for better horizontal space
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CodeBlock } from "@/components/ui/code-block";

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePageVisibility } from '@/hooks/use-page-visibility';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

// Helper component for Confirmation Dialog
const ConfirmDialog = ({ open, onOpenChange, onConfirm, title, desc }: any) => {
    const { t } = useTranslation(["admin", "common"]);
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{desc}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common:cancel")}</Button>
                    <Button variant="destructive" onClick={onConfirm}>{t("common:confirm")}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

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

const OpsConsole = () => {
    const { t } = useTranslation(["admin", "common"]);
    const queryClient = useQueryClient();
    const isPageVisible = usePageVisibility();

    // Close Position State
    const [closeDialogOpen, setCloseDialogOpen] = useState(false);
    const [closeParams, setCloseParams] = useState({
        account_id: "",
        symbol: "",
        pos_side: "long",
        qty: "",
        reason: "Admin Force Close"
    });

    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [symbolFilter, setSymbolFilter] = useState("");
    const [accountIdFilter, setAccountIdFilter] = useState("");
    const [isAutoRefresh, setIsAutoRefresh] = useState(false);
    const debouncedSymbolFilter = useDebouncedValue(symbolFilter, 300);
    const debouncedAccountIdFilter = useDebouncedValue(accountIdFilter, 300);

    // Batch Requeue State
    const [batchParams, setBatchParams] = useState({
        statuses: ["FAILED", "CANCELLED"],
        limit: 50,
        reason: "Admin Batch Requeue"
    });

    // Subscription Ops State
    const [searchSubId, setSearchSubId] = useState("");
    const [freezeReason, setFreezeReason] = useState("");
    const [targetSubId, setTargetSubId] = useState<number | null>(null);

    // Global Confirm State for generic actions
    const [actionConfirm, setActionConfirm] = useState<{
        open: boolean;
        title: string;
        desc: string;
        onConfirm: () => void;
    }>({ open: false, title: "", desc: "", onConfirm: () => { } });

    // Helper: Localized Formatting
    const formatAction = (act: string) => t(`admin:log_actions.${act}`, { defaultValue: act });
    const formatTargetType = (target: string) => t(`admin:log_targets.${target}`, { defaultValue: target });

    const getActionColor = (act: string) => {
        const a = act.toLowerCase();
        if (a.includes('delete') || a.includes('freeze') || a.includes('cancel')) return 'destructive';
        if (a.includes('create') || a.includes('publish') || a.includes('login')) return 'default';
        if (a.includes('update') || a.includes('rotate') || a.includes('requeue')) return 'secondary';
        return 'outline';
    };

    const { data: ordersData, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['adminOrders', page, statusFilter, debouncedSymbolFilter, debouncedAccountIdFilter],
        queryFn: () => adminApi.ops.listOrders({
            page,
            limit: 10,
            status: statusFilter === 'all' ? undefined : statusFilter,
            symbol: debouncedSymbolFilter || undefined,
            account_id: debouncedAccountIdFilter ? parseInt(debouncedAccountIdFilter) : undefined
        }),
        refetchInterval: isAutoRefresh && isPageVisible ? 5000 : false,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (isAutoRefresh && isPageVisible) {
            void refetch();
        }
    }, [isAutoRefresh, isPageVisible, refetch]);

    // Order Details State
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Fetch Events for Selected Order
    const { data: orderEvents, isLoading: isLoadingEvents } = useQuery({
        queryKey: ['adminOrderEvents', selectedOrder?.id],
        queryFn: () => selectedOrder ? adminApi.ops.getOrderEvents(selectedOrder.id) : null,
        enabled: !!selectedOrder,
    });

    // Mutations
    const getErrorMessage = useCallback((err: any) => {
        const raw = String(err?.message || err?.detail || '').trim();
        if (!raw) return t('admin:error_operation_failed');
        const translated = translateBackendErrorMessage(raw);
        return translated || raw;
    }, [t]);

    const cancelOrderMutation = useMutation({
        mutationFn: (id: number) => adminApi.ops.cancelOrder(id),
        onSuccess: () => {
            toast.success(t("admin:cancel_success"));
            refetch();
        },
        onError: (err: any) => toast.error(getErrorMessage(err))
    });

    const closePositionMutation = useMutation({
        mutationFn: (data: any) => {
            return adminApi.ops.closePosition({
                account_id: parseInt(data.account_id),
                symbol: data.symbol,
                pos_side: data.pos_side,
                qty: parseFloat(data.qty),
                reason: data.reason
            });
        },
        onSuccess: () => {
            setCloseDialogOpen(false);
            toast.success(t("admin:close_success"));
            refetch();
        },
        onError: (err: any) => toast.error(getErrorMessage(err))
    });

    const requeueOrderMutation = useMutation({
        mutationFn: ({ id, reason }: { id: number; reason?: string }) => adminApi.ops.requeueOrder(id, reason || "Admin Manual Requeue"),
        onSuccess: () => {
            toast.success(t("admin:order_requeue_success"));
            refetch();
        },
        onError: (err: any) => toast.error(getErrorMessage(err))
    });

    const batchRequeueMutation = useMutation({
        mutationFn: (data: any) => adminApi.ops.batchRequeue(data),
        onSuccess: (res: any) => {
            if (res.dry_run) {
                toast.info(t("admin:batch_requeue_matched", { matched: res.matched }));
            } else {
                toast.success(t("admin:batch_requeue_success"));
                refetch();
            }
        },
        onError: (err: any) => toast.error(getErrorMessage(err))
    });

    const freezeSubMutation = useMutation({
        mutationFn: (data: { id: number; frozen: boolean; reason?: string }) =>
            adminApi.subscriptions.freeze(data.id, data.frozen, data.reason),
        onSuccess: (sub: any) => {
            toast.success(sub.is_frozen ? t("admin:subscription_frozen_success") : t("admin:subscription_unfrozen_success"));
        },
        onError: (err: any) => toast.error(getErrorMessage(err))
    });

    const handleRequeueClick = useCallback((orderId: number) => {
        setActionConfirm({
            open: true,
            title: t('admin:confirm', 'Confirm'),
            desc: t("admin:requeue_confirm"),
            onConfirm: () => requeueOrderMutation.mutate({ id: orderId })
        });
    }, [t, requeueOrderMutation]);

    const handleCancelClick = useCallback((orderId: number) => {
        setActionConfirm({
            open: true,
            title: t('admin:confirm', 'Confirm'),
            desc: t("admin:confirm_cancel"),
            onConfirm: () => cancelOrderMutation.mutate(orderId)
        });
    }, [t, cancelOrderMutation]);

    const handleViewOrder = useCallback((order: Order) => {
        setSelectedOrder(order);
    }, []);

    const orderTableBody = useMemo(() => {
        if (isLoading) {
            return (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        {t("admin:loading")}
                    </TableCell>
                </TableRow>
            );
        }
        if (isError) {
            return (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-destructive">
                        {getErrorMessage(error)}
                    </TableCell>
                </TableRow>
            );
        }

        const items = ordersData?.items || [];
        if (items.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        {t("admin:no_data")}
                    </TableCell>
                </TableRow>
            );
        }

        return items.map((order: any) => (
            <TableRow key={order.id} className="group transition-all hover:bg-slate-50/80">
                <TableCell className="relative font-mono text-xs text-muted-foreground pl-4">
                    <div className={`absolute left-0 top-0 bottom-0 w-[3px] opacity-0 group-hover:opacity-100 transition-all ${order.side.toLowerCase() === 'buy' ? 'bg-blue-600 shadow-[2px_0_10px_rgba(37,99,235,0.3)]' : 'bg-red-600 shadow-[2px_0_10px_rgba(220,38,38,0.3)]'}`} />
                    #{order.id}
                </TableCell>
                <TableCell className="font-mono text-xs">{order.account_id}</TableCell>
                <TableCell className="py-4">
                    <div className="flex flex-col min-w-[140px]">
                        <span className="font-black text-sm tracking-tight text-slate-900 mb-1.5 uppercase">{order.symbol}</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge
                                variant={order.side.toLowerCase() === 'buy' ? 'default' : 'destructive'}
                                className={`text-xs px-1.5 py-0 h-4.5 font-bold uppercase ${order.side.toLowerCase() === 'buy' ? 'bg-blue-600 shadow-[0_2px_10px_rgba(37,99,235,0.2)]' : 'bg-red-600 shadow-[0_2px_10px_rgba(220,38,38,0.2)]'}`}
                            >
                                {order.side}
                            </Badge>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge
                                            variant="outline"
                                            className={`text-xs px-1.5 py-0 h-4.5 font-bold border-slate-200 bg-slate-50/50 ${order.status === 'FAILED' ? 'bg-red-50 text-red-600 border-red-100 shadow-sm animate-pulse cursor-help' : ''}`}
                                        >
                                            {t(`admin:status_labels.${order.status}`)}
                                        </Badge>
                                    </TooltipTrigger>
                                    {(order.error_message || order.last_error) && (
                                        <TooltipContent className="max-w-[300px] text-xs bg-slate-900 text-white border-0 shadow-2xl p-3">
                                            <div className="flex items-center gap-2 text-red-400 mb-2">
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                <span className="font-bold">{t("admin:error_reason")}</span>
                                            </div>
                                            <p className="font-mono break-all leading-relaxed text-slate-300">{order.error_message || order.last_error}</p>
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </TableCell>
                <TableCell>
                    <Badge variant="secondary" className="text-xs px-1 py-0 h-4 capitalize">
                        {order.action ? t(`admin:log_actions.${order.action}`, { defaultValue: order.action }) : '-'}
                    </Badge>
                </TableCell>
                <TableCell>
                    <div className="flex flex-col">
                        <span className="font-mono text-sm">{order.quantity}</span>
                        {order.executed_price > 0 && (
                            <span className="text-xs text-muted-foreground line-clamp-1">
                                @ {order.executed_price}
                            </span>
                        )}
                    </div>
                </TableCell>
                <TableCell className="font-mono text-xs uppercase text-muted-foreground">
                    {order.exchange ? t(`common:exchanges.${order.exchange.toLowerCase()}`, { defaultValue: order.exchange }) : t("common:exchanges.turboflow")}
                </TableCell>
                <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 hover:bg-orange-100 hover:text-orange-700"
                            title={t("admin:requeue_single")}
                            disabled={requeueOrderMutation.isPending}
                            onClick={() => handleRequeueClick(order.id)}
                        >
                            <RefreshCw className={`h-4 w-4 ${requeueOrderMutation.isPending && requeueOrderMutation.variables?.id === order.id ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            title={t("admin:cancel_order")}
                            disabled={cancelOrderMutation.isPending}
                            onClick={() => handleCancelClick(order.id)}
                        >
                            <XCircle className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={t("admin:view_data")}
                            onClick={() => handleViewOrder(order)}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    </div>
                </TableCell>
            </TableRow>
        ));
    }, [
        isLoading,
        isError,
        error,
        ordersData?.items,
        t,
        getErrorMessage,
        requeueOrderMutation.isPending,
        requeueOrderMutation.variables,
        cancelOrderMutation.isPending,
        handleRequeueClick,
        handleCancelClick,
        handleViewOrder
    ]);

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-6 p-4 md:p-8 min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white relative overflow-hidden"
        >
            {/* Decorative Mesh Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[36%] h-[36%] bg-primary/5 blur-[56px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[5%] right-[-5%] w-[28%] h-[28%] bg-blue-400/5 blur-[48px] rounded-full pointer-events-none" />

            <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                    <motion.div variants={itemVariants}>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                            <div className="p-2 bg-destructive/10 rounded-xl border border-destructive/20">
                                <AlertTriangle className="h-6 w-6 text-destructive" />
                            </div>
                            {t("admin:ops")}
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium flex items-center gap-2">
                            <span className="flex h-3 w-3 relative">
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive/80"></span>
                            </span>
                            {t("admin:ops_desc")}
                        </p>
                    </motion.div>
                    <motion.div variants={itemVariants} className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Switch
                                id="auto-refresh"
                                checked={isAutoRefresh}
                                onCheckedChange={setIsAutoRefresh}
                            />
                            <Label htmlFor="auto-refresh" className="text-sm cursor-pointer">
                                {t('admin:auto_refresh')}
                            </Label>
                        </div>
                        <Button variant="outline" className="h-10 px-4 rounded-xl" onClick={() => refetch()}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            {t("admin:refresh")}
                        </Button>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Control Cards */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Emergency Close Position Card */}
                        <motion.div variants={itemVariants}>
                            <Card className="relative bg-white/65 backdrop-blur-md border border-rose-200/60 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)] group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 bg-destructive/10 rounded-bl-3xl">
                                    <Zap className="h-20 w-20 text-destructive" />
                                </div>
                                <CardHeader className="bg-destructive/5 pb-5 border-b border-destructive/5">
                                    <CardTitle className="flex items-center gap-3 text-destructive text-xl font-black tracking-tighter">
                                        <div className="p-2 bg-white rounded-xl shadow-sm border border-destructive/10">
                                            <Zap className="h-5 w-5 animate-pulse" />
                                        </div>
                                        {t("admin:force_close")}
                                    </CardTitle>
                                    <CardDescription className="text-destructive/80 text-xs">
                                        {t("admin:ops_manual_close_desc")}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("admin:account_id")}</Label>
                                            <Input
                                                placeholder="e.g. 101"
                                                value={closeParams.account_id}
                                                onChange={e => setCloseParams({ ...closeParams, account_id: e.target.value })}
                                                className="h-10 focus-visible:ring-destructive/30"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("admin:symbol")}</Label>
                                            <Input
                                                placeholder="BTCUSDT"
                                                value={closeParams.symbol}
                                                onChange={e => setCloseParams({ ...closeParams, symbol: e.target.value.toUpperCase() })}
                                                className="h-10 focus-visible:ring-destructive/30"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("admin:pos_side")}</Label>
                                            <Select
                                                value={closeParams.pos_side}
                                                onValueChange={v => setCloseParams({ ...closeParams, pos_side: v })}
                                            >
                                                <SelectTrigger className="h-10 focus:ring-destructive/30">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="long">{t("admin:long")}</SelectItem>
                                                    <SelectItem value="short">{t("admin:short")}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("admin:qty")}</Label>
                                            <Input
                                                placeholder="0.00"
                                                type="number"
                                                step="0.0001"
                                                value={closeParams.qty}
                                                onChange={e => setCloseParams({ ...closeParams, qty: e.target.value })}
                                                className="h-10 focus-visible:ring-destructive/30"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full mt-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground h-10 font-bold tracking-wide transition-all active:scale-[0.98] shadow-sm"
                                        disabled={!closeParams.account_id || !closeParams.symbol || !closeParams.qty || closePositionMutation.isPending}
                                        onClick={() => setCloseDialogOpen(true)}
                                    >
                                        {closePositionMutation.isPending ? t('common:loading') : t("admin:force_close")}
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Subscription Support Card */}
                        <motion.div variants={itemVariants}>
                            <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
                                <CardHeader className="bg-primary/5 pb-5 border-b border-primary/5">
                                    <CardTitle className="flex items-center gap-3 text-xl font-black tracking-tighter text-slate-900">
                                        <div className="p-2 bg-white rounded-xl shadow-sm border border-primary/10">
                                            <PauseCircle className="h-5 w-5 text-primary" />
                                        </div>
                                        {t("admin:subscription_ops")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="bg-white/40 backdrop-blur-xl border border-slate-200/60 rounded-xl p-1 shadow-sm transition-all duration-300 focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary/40 focus-within:bg-white/80 group/sub">
                                        <div className="grid grid-cols-2 gap-0">
                                            <div className="flex flex-col border-r border-slate-200/30 pl-3 py-1">
                                                <Label className="text-xs font-bold text-slate-400 group-focus-within/sub:text-primary transition-colors uppercase tracking-widest">{t("admin:subscription_id")}</Label>
                                                <Input
                                                    className="border-0 focus-visible:ring-0 h-6 text-xs bg-transparent placeholder:text-slate-300 p-0 font-mono mt-0.5"
                                                    placeholder="ID"
                                                    value={searchSubId}
                                                    onChange={e => setSearchSubId(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex flex-col pl-3 py-1">
                                                <Label className="text-xs font-bold text-slate-400 group-focus-within/sub:text-primary transition-colors uppercase tracking-widest">{t("admin:reason")}</Label>
                                                <Input
                                                    className="border-0 focus-visible:ring-0 h-6 text-xs bg-transparent placeholder:text-slate-300 p-0 mt-0.5"
                                                    placeholder={t("admin:reason")}
                                                    value={freezeReason}
                                                    onChange={e => setFreezeReason(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            className="flex-1 h-10 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold shadow-lg shadow-red-500/20 rounded-xl border-none transition-all active:scale-95 group"
                                            disabled={!searchSubId || freezeSubMutation.isPending}
                                            onClick={() => {
                                                setActionConfirm({
                                                    open: true,
                                                    title: t('admin:confirm', 'Confirm'),
                                                    desc: t("admin:confirm_freeze"),
                                                    onConfirm: () => freezeSubMutation.mutate({
                                                        id: parseInt(searchSubId),
                                                        frozen: true,
                                                        reason: freezeReason || t("admin:freeze_reason_default")
                                                    })
                                                });
                                            }}
                                        >
                                            <PauseCircle className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                                            {t("admin:freeze")}
                                        </Button>
                                        <Button
                                            className="flex-1 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-blue-500/20 rounded-xl border-none transition-all active:scale-95 group"
                                            disabled={!searchSubId || freezeSubMutation.isPending}
                                            onClick={() => {
                                                freezeSubMutation.mutate({
                                                    id: parseInt(searchSubId),
                                                    frozen: false,
                                                    reason: freezeReason || t("admin:unfreeze_reason_default")
                                                });
                                            }}
                                        >
                                            <PlayCircle className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                                            {t("admin:unfreeze")}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Right Column: Batch Ops & Order Table */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Batch Requeue Card - Compact Layout */}
                        <motion.div variants={itemVariants}>
                            <Card className="bg-white/55 backdrop-blur-md border border-orange-200/60 rounded-3xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.04)]">
                                <CardHeader className="bg-orange-500/5 py-4 border-b border-orange-200/10 flex flex-row items-center justify-between space-y-0">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center gap-3 text-orange-700 text-lg font-black tracking-tighter">
                                            <div className="p-1.5 bg-orange-100 rounded-lg">
                                                <RefreshCw className="h-5 w-5" />
                                            </div>
                                            {t("admin:batch_requeue")}
                                        </CardTitle>
                                        <CardDescription className="text-orange-600/80 text-xs">
                                            {t("admin:batch_requeue_desc")}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-10 text-xs border-orange-200 text-orange-700 hover:bg-orange-100 px-4 font-semibold rounded-xl"
                                            onClick={() => batchRequeueMutation.mutate({ ...batchParams, dry_run: true })}
                                            disabled={batchRequeueMutation.isPending}
                                        >
                                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                                            {t("admin:dry_run_preview")}
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="h-10 text-xs bg-orange-600 hover:bg-orange-700 text-white px-4 font-semibold shadow-sm rounded-xl"
                                            onClick={() => {
                                                setActionConfirm({
                                                    open: true,
                                                    title: t('admin:confirm', 'Confirm'),
                                                    desc: t("admin:confirm"),
                                                    onConfirm: () => batchRequeueMutation.mutate({ ...batchParams, dry_run: false })
                                                });
                                            }}
                                            disabled={batchRequeueMutation.isPending}
                                        >
                                            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${batchRequeueMutation.isPending ? 'animate-spin' : ''}`} />
                                            {batchRequeueMutation.isPending ? t('common:loading') : t("admin:batch_requeue")}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 pb-4">
                                    <div className="flex gap-6 items-end">
                                        <div className="w-48 space-y-1.5">
                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("admin:requeue_statuses")}</Label>
                                            <Select
                                                value={batchParams.statuses[0]}
                                                onValueChange={v => setBatchParams({ ...batchParams, statuses: [v] })}
                                            >
                                                <SelectTrigger className="h-10">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="FAILED">{t("admin:status_labels.FAILED")}</SelectItem>
                                                    <SelectItem value="CANCELLED">{t("admin:status_labels.CANCELED")}</SelectItem>
                                                    <SelectItem value="PENDING">{t("admin:status_labels.PENDING")}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-32 space-y-1.5">
                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("admin:limit_count")}</Label>
                                            <Input
                                                type="number"
                                                value={batchParams.limit}
                                                onChange={e => setBatchParams({ ...batchParams, limit: parseInt(e.target.value) || 50 })}
                                                className="h-10"
                                            />
                                        </div>
                                        <div className="flex-1 text-xs text-muted-foreground italic text-right pb-2">
                                            * {t("admin:requeue_disclaimer")}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Active Orders List */}
                        <motion.div variants={itemVariants}>
                            <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
                                <CardHeader className="bg-primary/5 py-5 border-b border-primary/5 flex flex-row items-center justify-between space-y-0">
                                    <div>
                                        <CardTitle className="flex items-center gap-4 text-xl font-black tracking-tighter text-slate-900">
                                            <div className="p-2 bg-white rounded-xl shadow-sm border border-primary/10">
                                                <Search className="h-5 w-5 text-primary" />
                                            </div>
                                            {t("admin:active_orders")}
                                            <Badge variant="secondary" className="ml-1 h-7 px-3 font-mono text-sm bg-primary/10 text-primary border-primary/10 rounded-full">
                                                {ordersData?.total || 0}
                                            </Badge>
                                        </CardTitle>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-0 bg-white/40 backdrop-blur-xl border border-slate-200/60 rounded-xl px-1 h-10 shadow-sm transition-all duration-300 focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary/40 focus-within:shadow-md focus-within:bg-white/80 group/filter">
                                            <div className="pl-3 pr-2 flex items-center justify-center border-r border-slate-200/30 group-focus-within/filter:border-primary/20 transition-colors">
                                                <Filter className="h-4 w-4 text-slate-400 group-focus-within/filter:text-primary transition-colors" />
                                            </div>
                                            <div className="flex items-center">
                                                <Input
                                                    className="border-0 focus-visible:ring-0 w-24 h-10 text-sm bg-transparent placeholder:text-slate-400 font-medium"
                                                    placeholder={t("admin:account_id")}
                                                    value={accountIdFilter}
                                                    onChange={e => setAccountIdFilter(e.target.value)}
                                                />
                                                <div className="w-px h-4 bg-slate-200 group-focus-within/filter:bg-primary/20 transition-colors" />
                                                <Input
                                                    className="border-0 focus-visible:ring-0 w-28 h-10 text-sm bg-transparent placeholder:text-slate-400 font-medium uppercase"
                                                    placeholder={t("admin:symbol")}
                                                    value={symbolFilter}
                                                    onChange={e => setSymbolFilter(e.target.value.toUpperCase())}
                                                />
                                                <div className="w-px h-4 bg-slate-200 group-focus-within/filter:bg-primary/20 transition-colors" />
                                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                                    <SelectTrigger className="border-0 focus:ring-0 w-32 h-10 text-sm bg-transparent font-medium hover:bg-slate-100/50 rounded-lg transition-colors">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white/90 backdrop-blur-xl border-slate-200 shadow-2xl">
                                                        <SelectItem value="all">{t("admin:status_all")}</SelectItem>
                                                        <SelectItem value="PENDING">{t("admin:status_labels.PENDING")}</SelectItem>
                                                        <SelectItem value="PROCESSING">{t("admin:status_labels.PROCESSING")}</SelectItem>
                                                        <SelectItem value="COMPLETED">{t("admin:status_labels.COMPLETED")}</SelectItem>
                                                        <SelectItem value="FAILED">{t("admin:status_labels.FAILED")}</SelectItem>
                                                        <SelectItem value="EXPIRED">{t("admin:status_labels.EXPIRED")}</SelectItem>
                                                        <SelectItem value="CANCELLED">{t("admin:status_labels.CANCELLED")}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table className="[&_td]:py-2 [&_td]:px-3 [&_th]:py-2 [&_th]:px-3 text-xs whitespace-nowrap">
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="w-[80px]">{t("admin:column_id")}</TableHead>
                                                <TableHead>{t("admin:account_id")}</TableHead>
                                                <TableHead>{t("admin:symbol")}</TableHead>
                                                <TableHead>{t("admin:order_action")}</TableHead>
                                                <TableHead>{t("admin:qty")}</TableHead>
                                                <TableHead>{t("admin:exchange")}</TableHead>
                                                <TableHead className="text-right">{t("admin:actions")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>{orderTableBody}</TableBody>
                                    </Table>
                                </CardContent>
                                {ordersData && ordersData.total > 0 && (
                                    <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-muted-foreground bg-slate-50/30">
                                        <div className="font-medium tracking-tight">{t("admin:page_info", { page: page, total: Math.ceil(ordersData.total / 10) })}</div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                                className="h-8 rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-600 disabled:opacity-30"
                                            >
                                                <ChevronLeft className="h-4 w-4 mr-1" />
                                                {t("admin:prev")}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setPage(p => Math.min(Math.ceil(ordersData.total / 10), p + 1))}
                                                disabled={page >= Math.ceil(ordersData.total / 10)}
                                                className="h-8 rounded-lg hover:bg-white hover:shadow-sm transition-all font-bold text-slate-800 disabled:opacity-30"
                                            >
                                                {t("admin:next")}
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </motion.div>
                    </div>
                </div> {/* End of Grid (4:8) */}

                {/* Confirmation Dialogs & Global Sheets */}
                <ConfirmDialog
                    open={closeDialogOpen}
                    onOpenChange={setCloseDialogOpen}
                    onConfirm={() => closePositionMutation.mutate(closeParams)}
                    title={t("admin:confirm_close")}
                    desc={
                        t("admin:force_close_confirm_desc", {
                            qty: closeParams.qty,
                            symbol: closeParams.symbol,
                            pos_side: closeParams.pos_side,
                            account_id: closeParams.account_id
                        })}
                />
                {/* Order Details - Migrated to Dialog for better horizontal layout */}
                <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                    <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-0 bg-white/95 backdrop-blur-3xl border-slate-200/60 shadow-2xl rounded-3xl">
                        <DialogHeader className="px-8 pt-8 pb-4 shrink-0 bg-slate-50/50 border-b border-slate-100">
                            <div className="flex flex-col gap-2">
                                <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3 text-slate-900">
                                    <div className="p-2 bg-primary/10 rounded-xl shadow-sm border border-primary/20">
                                        <Zap className="h-5 w-5 text-primary" />
                                    </div>
                                    {t('admin:order_detail_title', { id: selectedOrder?.id })}
                                </DialogTitle>
                                <DialogDescription className="text-xs font-semibold flex items-center gap-4">
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-500 shadow-sm">
                                        <span className="opacity-60">{t("admin:column_strategy")}:</span>
                                        <span className="text-slate-900 font-bold">{selectedOrder?.strategy_id || t('admin:none')}</span>
                                    </span>
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-500 shadow-sm">
                                        <span className="opacity-60">{t("admin:column_account")}:</span>
                                        <span className="text-slate-900 font-bold">{selectedOrder?.account_id}</span>
                                    </span>
                                </DialogDescription>
                            </div>
                        </DialogHeader>

                        {selectedOrder && (
                            <ScrollArea className="flex-1 px-8 py-6">
                                <div className="space-y-8 pb-8">
                                    {/* Key Info Grid - Elite Layout with ample space */}
                                    <div className="grid grid-cols-2 gap-y-6 gap-x-12 bg-slate-50/80 p-6 rounded-2xl border border-slate-100 shadow-inner">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{t("admin:column_status")}</span>
                                            <Badge variant={selectedOrder.status === 'COMPLETED' ? 'default' : selectedOrder.status === 'FAILED' ? 'destructive' : 'secondary'} className="w-fit px-3 py-1 text-xs font-bold shadow-sm">
                                                {t(`admin:status_labels.${selectedOrder.status}`)}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{t("admin:symbol")}</span>
                                            <span className="font-mono text-base font-black tracking-tight text-slate-900">{selectedOrder.symbol}</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{t("admin:exchange")}</span>
                                            <Badge variant="outline" className="w-fit uppercase font-mono text-xs tracking-wider border-slate-200 bg-white">
                                                {selectedOrder.exchange ? t(`common:exchanges.${selectedOrder.exchange.toLowerCase()}`, { defaultValue: selectedOrder.exchange }) : t("common:exchanges.turboflow")}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{t("admin:order_action")} / {t("admin:side")}</span>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="capitalize text-xs font-bold bg-white border-slate-200">{selectedOrder.action || '-'}</Badge>
                                                <Badge variant={selectedOrder.side.toLowerCase() === 'buy' ? 'default' : 'destructive'} className="text-xs uppercase font-bold px-2">{selectedOrder.side}</Badge>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{t("admin:qty_plan_exec")}</span>
                                            <div className="font-mono text-sm tracking-tighter">
                                                <span className="font-black text-slate-900">{selectedOrder.quantity}</span>
                                                <span className="mx-2 text-slate-300">/</span>
                                                <span className={`${selectedOrder.status === 'COMPLETED' ? 'text-green-600 font-bold' : 'text-slate-500'}`}>{selectedOrder.executed_qty || 0}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{t("admin:exec_price_label")}</span>
                                            <span className="font-mono text-sm font-black text-slate-900">{selectedOrder.executed_price || '-'}</span>
                                        </div>

                                        <div className="col-span-2 pt-4 border-t border-slate-200/60 mt-2">
                                            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("admin:external_order_id")}</span>
                                                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{selectedOrder.tf_order_id || 'N/A'}</span>
                                            </div>
                                            {(selectedOrder.error_message || selectedOrder.last_error) && (
                                                <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs italic flex gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                                    <p className="leading-relaxed font-medium">{selectedOrder.error_message || selectedOrder.last_error}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Event Timeline */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            {t('admin:event_timeline')}
                                        </h3>
                                        <div className="relative border-l-2 border-slate-100 ml-2 pl-6 space-y-8">
                                            {isLoadingEvents ? (
                                                <div className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                                    {t('admin:loading_events')}
                                                </div>
                                            ) : (
                                                orderEvents?.events?.map((event: any, idx: number) => (
                                                    <div key={idx} className="relative group/evt">
                                                        {/* Dot */}
                                                        <div className={`absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm transition-transform group-hover/evt:scale-125
                                                                ${(event.stage || '').includes('ERROR') || (event.stage || '').includes('FAIL') ? 'bg-red-500 shadow-red-200' :
                                                                (event.stage || '').includes('OK') || (event.stage || '').includes('FILLED') ? 'bg-green-500 shadow-green-200' : 'bg-blue-500 shadow-blue-200'}`}
                                                        />

                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-bold text-slate-800">{event.stage}</span>
                                                                <Badge variant="outline" className="text-xs font-black uppercase tracking-tighter opacity-60 bg-slate-50">{event.source}</Badge>
                                                            </div>
                                                            {event.note && (
                                                                <p className="text-xs text-slate-500 leading-relaxed bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">{event.note}</p>
                                                            )}

                                                            {event.data && (
                                                                <Accordion type="single" collapsible className="w-full">
                                                                    <AccordionItem value={`item-${idx}`} className="border-none">
                                                                        <AccordionTrigger className="py-0 text-xs font-bold text-blue-500 hover:no-underline justify-start gap-2 h-6 opacity-60 hover:opacity-100 transition-opacity">
                                                                            <span>{t('admin:view_data')}</span>
                                                                        </AccordionTrigger>
                                                                        <AccordionContent className="pt-2">
                                                                            <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-[300px] shadow-sm border border-slate-800">
                                                                                {typeof event.data === 'string' ? event.data : JSON.stringify(event.data, null, 2)}
                                                                            </pre>
                                                                        </AccordionContent>
                                                                    </AccordionItem>
                                                                </Accordion>
                                                            )}

                                                            {event.source === 'last_error' && event.raw && (
                                                                <div className="mt-1 text-xs font-mono bg-red-50 text-red-600 p-3 rounded-xl border border-red-100/50 overflow-x-auto whitespace-pre-wrap overflow-y-auto max-h-[150px]">
                                                                    {event.raw}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                            {(!orderEvents?.events || orderEvents.events.length === 0) && !isLoadingEvents && (
                                                <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 italic text-sm">
                                                    {t('admin:no_events')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        )}
                        <DialogFooter className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 shrink-0">
                            <Button variant="ghost" className="rounded-xl font-bold text-slate-500" onClick={() => setSelectedOrder(null)}>
                                {t("common:close")}
                            </Button>
                        </DialogFooter>
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
            </div>
        </motion.div>
    );
};

export default OpsConsole;

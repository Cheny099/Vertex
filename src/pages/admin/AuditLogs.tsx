import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { adminApi, AdminAuditLogItem } from '@/api';
import { motion, AnimatePresence } from 'framer-motion';

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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Filter, Eye, RefreshCw } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';

export default function AuditLogs() {
    const { t } = useTranslation(['admin', 'common']);
    const [page, setPage] = useState(1);
    const [actor, setActor] = useState('');
    const [action, setAction] = useState('');
    const [targetType, setTargetType] = useState('');

    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['adminAuditLogs', page, actor, action, targetType, dateRange],
        queryFn: () => adminApi.audit.list({
            page,
            limit: 50,
            actor: actor || undefined,
            action: action || undefined,
            target_type: targetType || undefined,
            date_from: dateRange?.from ? startOfDay(dateRange.from).toISOString() : undefined,
            date_to: dateRange?.to ? endOfDay(dateRange.to).toISOString() : undefined
        }),
        placeholderData: (previousData) => previousData,
    });

    const getActionColor = (act: string) => {
        const a = act.toLowerCase();
        if (a.includes('delete') || a.includes('freeze') || a.includes('cancel')) return 'destructive';
        if (a.includes('create') || a.includes('publish') || a.includes('login')) return 'default'; // primary
        if (a.includes('update') || a.includes('rotate') || a.includes('requeue')) return 'secondary';
        return 'outline';
    };

    const formatAction = (act: string) => {
        return t(`admin:log_actions.${act}`, { defaultValue: act });
    };

    const formatTargetType = (target: string) => {
        return t(`admin:log_targets.${target}`, { defaultValue: target });
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-6 p-4 md:p-8 min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white"
        >
            <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tight text-slate-900">{t('admin:system_logs')}</h1>
                <p className="text-slate-500 font-medium">
                    {t('admin:system_logs_desc')}
                </p>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <CardTitle>{t('admin:system_logs')}</CardTitle>
                                <CardDescription>
                                    {t('admin:total')}: {data?.total || 0}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => refetch()}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    {t('admin:refresh')}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="flex flex-wrap gap-4 mb-6">
                            <div className="flex-1 min-w-[200px]">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t('admin:filter_actor_placeholder')}
                                        value={actor}
                                        onChange={(e) => {
                                            setActor(e.target.value);
                                            setPage(1);
                                        }}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <Input
                                    placeholder={t('admin:filter_action_placeholder')}
                                    value={action}
                                    onChange={(e) => {
                                        setAction(e.target.value);
                                        setPage(1);
                                    }}
                                />
                            </div>
                            <div className="w-[180px]">
                                <Input
                                    placeholder={t('admin:filter_target_placeholder')}
                                    value={targetType}
                                    onChange={(e) => {
                                        setTargetType(e.target.value);
                                        setPage(1);
                                    }}
                                />
                            </div>
                            <div className="w-auto">
                                <DatePickerWithRange
                                    date={dateRange}
                                    setDate={(range) => {
                                        setDateRange(range);
                                        setPage(1);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[180px]">{t('admin:column_time')}</TableHead>
                                        <TableHead>{t('admin:column_actor')}</TableHead>
                                        <TableHead>{t('admin:column_action')}</TableHead>
                                        <TableHead>{t('admin:column_target')}</TableHead>
                                        <TableHead className="w-[80px]">{t('admin:column_meta')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                {t('admin:loading')}
                                            </TableCell>
                                        </TableRow>
                                    ) : data?.items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                {t('admin:no_data')}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data?.items.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                                    {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                                                </TableCell>
                                                <TableCell>{log.actor_email}</TableCell>
                                                <TableCell>
                                                    <Badge variant={getActionColor(log.action)}>
                                                        {formatAction(log.action)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    <span className="font-sans text-sm">{formatTargetType(log.target_type)}</span>
                                                    {log.target_id && (
                                                        <span className="ml-1 text-muted-foreground">
                                                            {log.target_id === 'batch' ? `(${t('admin:status_all')})` : `#${log.target_id}`}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {log.meta && (
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="max-w-2xl">
                                                                <DialogHeader>
                                                                    <DialogTitle>{t('admin:log_detail_title', { id: log.id })}</DialogTitle>
                                                                </DialogHeader>
                                                                <div className="grid gap-4 py-4">
                                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                                        <div>
                                                                            <span className="font-semibold">{t('admin:column_actor')}:</span> {log.actor_email}
                                                                        </div>
                                                                        <div>
                                                                            <span className="font-semibold">{t('admin:column_time')}:</span> {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                                                                        </div>
                                                                        <div>
                                                                            <span className="font-semibold">{t('admin:column_action')}:</span> {formatAction(log.action)}
                                                                        </div>
                                                                        <div>
                                                                            <span className="font-semibold">{t('admin:column_target')}:</span> {formatTargetType(log.target_type)} {log.target_id && `#${log.target_id}`}
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <span className="font-semibold text-sm">{t('admin:meta_data')}</span>
                                                                        <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-muted/50 font-mono text-xs">
                                                                            <pre>{JSON.stringify(log.meta, null, 2)}</pre>
                                                                        </ScrollArea>
                                                                    </div>
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Simple Pagination */}
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1 || isLoading}
                            >
                                {t('admin:prev')}
                            </Button>
                            <div className="text-sm font-medium">{t('admin:page_current', { page })}</div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={!data || data.items.length < data.limit || isLoading}
                            >
                                {t('admin:next')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}

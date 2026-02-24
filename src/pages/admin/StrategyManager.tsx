
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
    Plus, MoreHorizontal, Key, Upload, Play, Pause, Copy, Check,
    TrendingUp, BarChart2, Zap, Target, ShieldAlert, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { adminApi, strategyApi } from "@/api";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Variants for consistent animations
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1
        }
    }
} as const;

const itemVariants = {
    hidden: { opacity: 0, scale: 0.98, y: 10 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
} as const;

const StrategyManager = () => {
    const { t } = useTranslation("admin");
    const queryClient = useQueryClient();
    const [secretDialogOpen, setSecretDialogOpen] = useState(false);
    const [currentSecret, setCurrentSecret] = useState<{ strategy_key: string, secret: string, hint: string } | null>(null);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedStrategyId, setSelectedStrategyId] = useState<number | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [purgeCsv, setPurgeCsv] = useState(true);

    // Drag and Drop handlers
    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => {
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.name.toLowerCase().endsWith('.csv')) {
            setCsvFile(file);
        } else {
            toast.error(t("only_csv_allowed", "Only CSV files are allowed"));
        }
    };

    // Queries
    const { data: strategies, isLoading } = useQuery({
        queryKey: ["strategies"],
        queryFn: strategyApi.getAll
    });

    // Mutations
    const publishMutation = useMutation({
        mutationFn: (id: number) => adminApi.strategies.publish(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["strategies"] });
            toast.success(t('strategies:create.toast_success'));
        }
    });

    const unpublishMutation = useMutation({
        mutationFn: (id: number) => adminApi.strategies.unpublish(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["strategies"] });
            toast.success(t('strategies:create.toast_success'));
        }
    });

    const rotateSecretMutation = useMutation({
        mutationFn: (id: number) => adminApi.strategies.rotateWebhookSecret(id),
        onSuccess: (data) => {
            setCurrentSecret(data);
            setSecretDialogOpen(true);
            toast.success(t("secret_rotated"));
        }
    });

    const getSecretMutation = useMutation({
        mutationFn: (id: number) => adminApi.strategies.getWebhookSecret(id),
        onSuccess: (data) => {
            setCurrentSecret(data);
            setSecretDialogOpen(true);
        }
    });

    const importStatsMutation = useMutation({
        mutationFn: async ({ id, file }: { id: number, file: File }) => {
            return adminApi.strategies.importStats(id, file);
        },
        onSuccess: () => {
            setImportDialogOpen(false);
            setCsvFile(null);
            toast.success(t("stats_imported"));
            queryClient.invalidateQueries({ queryKey: ["strategies"] });
        },
        onError: (err: any) => {
            toast.error(err.message || "Import failed");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async ({ id, purgeTvCsv }: { id: number, purgeTvCsv: boolean }) => {
            return strategyApi.delete(id, purgeTvCsv);
        },
        onSuccess: () => {
            setDeleteDialogOpen(false);
            toast.success(t("strategy_deleted", "Strategy deleted successfully"));
            queryClient.invalidateQueries({ queryKey: ["strategies"] });
        },
        onError: (err: any) => {
            toast.error(err.message || "Delete failed");
        }
    });

    const handleImport = () => {
        if (selectedStrategyId && csvFile) {
            importStatsMutation.mutate({ id: selectedStrategyId, file: csvFile });
        }
    };

    const getTypeBadge = (type: string) => {
        const tLower = type?.toLowerCase() || 'signal';
        switch (tLower) {
            case 'grid': return <Badge className="bg-blue-500/10 text-blue-600 border-none shadow-none">{t("strategy_types.grid")}</Badge>;
            case 'signal': return <Badge className="bg-purple-500/10 text-purple-600 border-none shadow-none">{t("strategy_types.signal")}</Badge>;
            case 'trend': return <Badge className="bg-emerald-500/10 text-emerald-600 border-none shadow-none">{t("strategy_types.trend")}</Badge>;
            case 'dca': return <Badge className="bg-orange-500/10 text-orange-600 border-none shadow-none">{t("strategy_types.dca")}</Badge>;
            default: return <Badge variant="outline" className="text-slate-400 border-slate-200">{type}</Badge>;
        }
    };

    const formatPct = (val?: number) => {
        if (val === undefined || val === null) return <span className="text-slate-300">--</span>;
        const color = val > 0 ? "text-emerald-500" : val < 0 ? "text-rose-500" : "text-slate-400";
        return <span className={cn("font-bold text-sm", color)}>{val > 0 ? '+' : ''}{val.toFixed(2)}%</span>;
    };

    if (isLoading) {
        return (
            <div className="p-8 space-y-4 shadow-card animate-pulse">
                <div className="h-10 w-1/4 bg-slate-200 rounded-xl" />
                <div className="h-[400px] w-full bg-slate-100 rounded-3xl" />
            </div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-6 p-4 md:p-8 min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white pb-20"
        >
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">{t("strategies")}</h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        {t("strategies_desc")}
                    </p>
                </div>
                <Link to="/admin/strategies/create">
                    <Button className="gradient-primary shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 px-6 rounded-xl">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("create_strategy")}
                    </Button>
                </Link>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50">
                            <TableHead className="w-[80px] font-bold">{t("column_id")}</TableHead>
                            <TableHead className="font-bold">{t("column_strategy_name")}</TableHead>
                            <TableHead className="font-bold">{t("column_strategy_type")}</TableHead>
                            <TableHead className="font-bold">{t("column_strategy_pair")}</TableHead>
                            <TableHead className="font-bold text-center">{t("column_strategy_roi")}</TableHead>
                            <TableHead className="font-bold text-center">{t("column_strategy_mdd")}</TableHead>
                            <TableHead className="font-bold text-center">{t("column_strategy_winrate")}</TableHead>
                            <TableHead className="font-bold">{t("column_status")}</TableHead>
                            <TableHead className="text-right font-bold">{t("column_actions")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {strategies?.map((strategy) => {
                            const config = typeof strategy.config === 'string' ? JSON.parse(strategy.config) : (strategy.config || {});
                            const sType = config.type || 'Signal';
                            const sPair = config.pair || t("all_pairs");

                            return (
                                <TableRow key={strategy.id} className="group hover:bg-slate-50/80 transition-colors">
                                    <TableCell className="text-xs font-medium text-slate-400">#{strategy.id}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">{strategy.name}</span>
                                            <span className="text-[10px] font-mono text-slate-400 mt-0.5">{strategy.strategy_key}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getTypeBadge(sType)}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-500 border-slate-200">
                                            {sPair}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">{formatPct((strategy as any).roi_all)}</TableCell>
                                    <TableCell className="text-center">
                                        <span className="text-xs font-semibold text-rose-500 underline decoration-rose-500/20 underline-offset-4">
                                            {(strategy as any).max_drawdown ? `${Math.abs((strategy as any).max_drawdown).toFixed(2)}%` : '--'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="text-xs font-bold text-slate-700">
                                            {(strategy as any).win_rate ? `${((strategy as any).win_rate * 100).toFixed(1)}%` : '--'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {strategy.status === 'active' ? (
                                            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none px-3 py-1">
                                                <Check className="w-3 h-3 mr-1.5" /> {t("active")}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-slate-400 border-slate-200 px-3 py-1">
                                                <Pause className="w-3 h-3 mr-1.5" /> {t("inactive")}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg group-hover:bg-white transition-colors">
                                                    <MoreHorizontal className="h-4 w-4 text-slate-400 group-hover:text-slate-900" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 rounded-2xl border-none shadow-2xl p-2">
                                                <DropdownMenuLabel className="text-xs font-black uppercase text-slate-400 px-3 py-2">{t("actions")}</DropdownMenuLabel>
                                                <Link to={`/admin/strategies/${strategy.id}/edit`}>
                                                    <DropdownMenuItem className="rounded-xl cursor-pointer">
                                                        <TrendingUp className="mr-3 h-4 w-4 text-primary" /> {t("edit_strategy")}
                                                    </DropdownMenuItem>
                                                </Link>
                                                <DropdownMenuSeparator className="bg-slate-50" />

                                                {strategy.status === 'active' ? (
                                                    <DropdownMenuItem className="rounded-xl text-amber-600 focus:bg-amber-50 focus:text-amber-600 cursor-pointer" onClick={() => unpublishMutation.mutate(strategy.id)}>
                                                        <Pause className="mr-3 h-4 w-4" /> {t("unpublish")}
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem className="rounded-xl text-emerald-600 focus:bg-emerald-50 focus:text-emerald-600 cursor-pointer" onClick={() => publishMutation.mutate(strategy.id)}>
                                                        <Play className="mr-3 h-4 w-4" /> {t("publish")}
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuItem className="rounded-xl cursor-pointer" onClick={() => getSecretMutation.mutate(strategy.id)}>
                                                    <ShieldAlert className="mr-3 h-4 w-4 text-amber-500" /> {t("view_secret")}
                                                </DropdownMenuItem>

                                                <DropdownMenuItem className="rounded-xl cursor-pointer" onClick={() => {
                                                    if (confirm(t("rotate_warning"))) {
                                                        rotateSecretMutation.mutate(strategy.id);
                                                    }
                                                }}>
                                                    <Zap className="mr-3 h-4 w-4 text-sky-500" /> {t("rotate_secret")}
                                                </DropdownMenuItem>

                                                <DropdownMenuItem className="rounded-xl cursor-pointer" onClick={() => {
                                                    setSelectedStrategyId(strategy.id);

                                                    setImportDialogOpen(true);
                                                }}>
                                                    <Upload className="mr-3 h-4 w-4 text-indigo-500" /> {t("import_csv")}
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator className="bg-slate-50" />

                                                <DropdownMenuItem className="rounded-xl text-rose-600 focus:bg-rose-50 focus:text-rose-600 cursor-pointer" onClick={() => {
                                                    setSelectedStrategyId(strategy.id);
                                                    setPurgeCsv(true); // Reset to default true
                                                    setDeleteDialogOpen(true);
                                                }}>
                                                    <Trash2 className="mr-3 h-4 w-4" /> {t("delete")}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {(!strategies || strategies.length === 0) && !isLoading && (
                            <TableRow>
                                <TableCell colSpan={9} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                                        <BarChart2 className="w-12 h-12 opacity-20" />
                                        <p className="font-medium">{t("no_data")}</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </motion.div>

            {/* Secret Dialog */}
            <Dialog open={secretDialogOpen} onOpenChange={setSecretDialogOpen}>
                <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-amber-50 rounded-full">
                                <Key className="w-6 h-6 text-amber-500" />
                            </div>
                            {t("webhook_secret_title")}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium pt-2">
                            {t("secret_hint")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-6 border-y border-slate-50 my-2">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{t("secret_key_label")}</Label>
                            <div className="flex gap-2 group">
                                <Input readOnly value={currentSecret?.secret || ''} className="h-12 bg-slate-50 border-none rounded-xl font-mono text-xs focus-visible:ring-primary/20" />
                                <Button size="icon" variant="outline" className="h-12 w-12 rounded-xl border-slate-200" onClick={() => {
                                    navigator.clipboard.writeText(currentSecret?.secret || '');
                                    toast.success(t("copy"));
                                }}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button className="w-full h-12 rounded-xl font-bold gradient-primary shadow-button" onClick={() => setSecretDialogOpen(false)}>
                            {t("common:done")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Import Dialog */}
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-full">
                                <Upload className="w-6 h-6 text-indigo-500" />
                            </div>
                            {t("import_csv")}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium pt-2">
                            {t("import_csv_desc")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-8">
                        <div
                            className={cn(
                                "border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer",
                                isDragging ? "border-primary bg-primary/5 scale-[0.98]" :
                                    csvFile ? "border-emerald-200 bg-emerald-50/10" : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"
                            )}
                            onClick={() => document.getElementById('csv-upload')?.click()}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                        >
                            <Upload className={cn("w-10 h-10 mb-4 transition-colors", csvFile ? "text-emerald-500" : isDragging ? "text-primary" : "text-slate-300")} />
                            <p className="text-sm font-bold text-slate-900">
                                {csvFile ? csvFile.name : t("csv_drag_drop")}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">{t("csv_format_support")}</p>
                            <input
                                id="csv-upload"
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-3 sm:gap-0">
                        <Button variant="ghost" className="h-12 rounded-xl font-bold px-8" onClick={() => setImportDialogOpen(false)}>
                            {t("form.cancel")}
                        </Button>
                        <Button
                            className="h-12 rounded-xl font-bold px-10 gradient-primary shadow-button"
                            onClick={handleImport}
                            disabled={!csvFile || importStatsMutation.isPending}
                        >
                            {importStatsMutation.isPending ? t("loading") : t("import_data_btn")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3 text-rose-600">
                            <div className="p-2 bg-rose-50 rounded-full">
                                <ShieldAlert className="w-6 h-6 text-rose-500" />
                            </div>
                            {t("delete_strategy_title", "Delete Strategy")}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium pt-2">
                            {t("delete_strategy_confirm", "Are you sure you want to delete this strategy? This action cannot be undone.")}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="purge-csv"
                                checked={purgeCsv}
                                onChange={(e) => setPurgeCsv(e.target.checked)}
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                            />
                            <label htmlFor="purge-csv" className="text-sm text-slate-700 cursor-pointer select-none">
                                <span className="font-bold block text-slate-900 mb-0.5">{t("delete_purge_csv", "Delete associated CSV files")}</span>
                                <span className="text-xs text-slate-500">{t("delete_purge_csv_desc", "Also remove uploaded TradingView history files from server.")}</span>
                            </label>
                        </div>
                    </div>

                    <DialogFooter className="gap-3 sm:gap-0">
                        <Button variant="ghost" className="h-12 rounded-xl font-bold px-8" onClick={() => setDeleteDialogOpen(false)}>
                            {t("form.cancel")}
                        </Button>
                        <Button
                            variant="destructive"
                            className="h-12 rounded-xl font-bold px-10 shadow-button bg-rose-600 hover:bg-rose-700"
                            onClick={() => {
                                if (selectedStrategyId) {
                                    deleteMutation.mutate({ id: selectedStrategyId, purgeTvCsv: purgeCsv });
                                }
                            }}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? t("deleting", "Deleting...") : t("delete_confirm", "Delete Strategy")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
};

export default StrategyManager;

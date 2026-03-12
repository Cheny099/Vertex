import React from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface StrategyImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    csvFile: File | null;
    setCsvFile: React.Dispatch<React.SetStateAction<File | null>>;
    isDragging: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    onImport: () => void;
    isPending: boolean;
    t: (key: string, fallback?: string) => string;
}

export const StrategyImportDialog = React.memo(({
    open,
    onOpenChange,
    csvFile,
    setCsvFile,
    isDragging,
    onDragOver,
    onDragLeave,
    onDrop,
    onImport,
    isPending,
    t,
}: StrategyImportDialogProps) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-8 bg-white/95 dark:bg-slate-950/95 backdrop-blur-3xl border border-white/20 shadow-2xl overflow-hidden rounded-3xl">
            <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-full">
                        <Upload className="w-6 h-6 text-indigo-500" />
                    </div>
                    {t('import_csv')}
                </DialogTitle>
                <DialogDescription className="text-slate-500 font-medium pt-2">
                    {t('import_csv_desc')}
                </DialogDescription>
            </DialogHeader>
            <div className="py-8">
                <div
                    className={cn(
                        'border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer',
                        isDragging
                            ? 'border-primary bg-primary/5 scale-[0.98]'
                            : csvFile
                                ? 'border-emerald-200 bg-emerald-50/10'
                                : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'
                    )}
                    onClick={() => document.getElementById('csv-upload')?.click()}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                >
                    <Upload className={cn('w-10 h-10 mb-4 transition-colors', csvFile ? 'text-emerald-500' : isDragging ? 'text-primary' : 'text-slate-300')} />
                    <p className="text-sm font-bold text-slate-900">{csvFile ? csvFile.name : t('csv_drag_drop')}</p>
                    <p className="text-xs text-slate-400 mt-1">{t('csv_format_support')}</p>
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
                <Button variant="ghost" className="h-12 rounded-xl font-bold px-8" onClick={() => onOpenChange(false)}>
                    {t('form.cancel')}
                </Button>
                <Button className="h-12 rounded-xl font-bold px-10 gradient-primary shadow-button" onClick={onImport} disabled={!csvFile || isPending}>
                    {isPending ? t('loading') : t('import_data_btn')}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
));

StrategyImportDialog.displayName = 'StrategyImportDialog';

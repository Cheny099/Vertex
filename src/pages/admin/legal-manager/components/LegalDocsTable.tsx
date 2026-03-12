import React from 'react';
import { AlertCircle, CheckCircle, Clock, Edit2 } from 'lucide-react';
import type { AdminLegalDocResponse } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatLegalEffectiveAt } from '../utils';

interface LegalDocsTableProps {
    docs: AdminLegalDocResponse[];
    isLoading: boolean;
    isError: boolean;
    docsErrorText: string;
    t: (key: string) => string;
    onActivate: (id: number) => void;
    onEdit: (doc: AdminLegalDocResponse) => void;
}

export const LegalDocsTable = React.memo(({
    docs,
    isLoading,
    isError,
    docsErrorText,
    t,
    onActivate,
    onEdit,
}: LegalDocsTableProps) => (
    <div className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
        <Table>
            <TableHeader>
                <TableRow className="bg-slate-50/50">
                    <TableHead className="w-[150px] font-bold">{t('version')}</TableHead>
                    <TableHead className="font-bold">{t('form.title')}</TableHead>
                    <TableHead className="font-bold">{t('form.language')}</TableHead>
                    <TableHead className="font-bold">{t('effective_at')}</TableHead>
                    <TableHead className="font-bold">{t('column_status')}</TableHead>
                    <TableHead className="text-right font-bold">{t('column_actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isError ? (
                    <TableRow>
                        <TableCell colSpan={6} className="h-64 text-center">
                            <div className="flex flex-col items-center justify-center text-destructive gap-3 px-6">
                                <AlertCircle className="w-12 h-12 opacity-80" />
                                <p className="font-medium">{docsErrorText}</p>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : isLoading ? (
                    <TableRow>
                        <TableCell colSpan={6} className="h-64 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm font-medium text-slate-400">{t('loading_docs')}</p>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : docs.map((doc) => (
                    <TableRow
                        key={doc.id}
                        className="cursor-pointer hover:bg-slate-50/80 transition-colors group"
                        onClick={() => onEdit(doc)}
                    >
                        <TableCell className="font-mono text-sm font-semibold text-primary">{doc.version}</TableCell>
                        <TableCell className="font-medium">{doc.title}</TableCell>
                        <TableCell>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none">
                                {doc.lang === 'zh' ? t('lang_zh') : t('lang_en')}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 font-medium">
                            {formatLegalEffectiveAt(doc.effective_at, doc.created_at)}
                        </TableCell>
                        <TableCell>
                            {doc.is_active ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none px-3 py-1">
                                    <CheckCircle className="w-3 h-3 mr-1.5" /> {t('is_active')}
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-slate-400 border-slate-200">
                                    <Clock className="w-3 h-3 mr-1.5" /> {t('history')}
                                </Badge>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!doc.is_active && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50 rounded-lg font-bold"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onActivate(doc.id);
                                        }}
                                    >
                                        {t('activate')}
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-lg"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(doc);
                                    }}
                                >
                                    <Edit2 className="w-4 h-4 text-slate-500" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
                {!docs.length && !isLoading && !isError && (
                    <TableRow>
                        <TableCell colSpan={6} className="h-64 text-center">
                            <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                                <AlertCircle className="w-12 h-12 opacity-20" />
                                <p className="font-medium">{t('no_data')}</p>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
));

LegalDocsTable.displayName = 'LegalDocsTable';

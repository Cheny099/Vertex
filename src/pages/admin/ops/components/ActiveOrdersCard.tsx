import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import { ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ActiveOrdersCardProps {
  t: TFunction;
  total: number;
  accountIdFilter: string;
  setAccountIdFilter: Dispatch<SetStateAction<string>>;
  symbolFilter: string;
  setSymbolFilter: Dispatch<SetStateAction<string>>;
  statusFilter: string;
  setStatusFilter: Dispatch<SetStateAction<string>>;
  orderTableBody: ReactNode;
  page: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function ActiveOrdersCard({
  t,
  total,
  accountIdFilter,
  setAccountIdFilter,
  symbolFilter,
  setSymbolFilter,
  statusFilter,
  setStatusFilter,
  orderTableBody,
  page,
  totalPages,
  onPrevPage,
  onNextPage,
}: ActiveOrdersCardProps) {
  return (
    <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
      <CardHeader className="bg-primary/5 py-5 border-b border-primary/5 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-4 text-xl font-black tracking-tighter text-slate-900">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-primary/10">
              <Search className="h-5 w-5 text-primary" />
            </div>
            {t('admin:active_orders')}
            <Badge variant="secondary" className="ml-1 h-7 px-3 font-mono text-sm bg-primary/10 text-primary border-primary/10 rounded-full">
              {total || 0}
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
                placeholder={t('admin:account_id')}
                value={accountIdFilter}
                onChange={(e) => setAccountIdFilter(e.target.value)}
              />
              <div className="w-px h-4 bg-slate-200 group-focus-within/filter:bg-primary/20 transition-colors" />
              <Input
                className="border-0 focus-visible:ring-0 w-28 h-10 text-sm bg-transparent placeholder:text-slate-400 font-medium uppercase"
                placeholder={t('admin:symbol')}
                value={symbolFilter}
                onChange={(e) => setSymbolFilter(e.target.value.toUpperCase())}
              />
              <div className="w-px h-4 bg-slate-200 group-focus-within/filter:bg-primary/20 transition-colors" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-0 focus:ring-0 w-32 h-10 text-sm bg-transparent font-medium hover:bg-slate-100/50 rounded-lg transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/90 backdrop-blur-xl border-slate-200 shadow-2xl">
                  <SelectItem value="all">{t('admin:status_all')}</SelectItem>
                  <SelectItem value="PENDING">{t('admin:status_labels.PENDING')}</SelectItem>
                  <SelectItem value="PROCESSING">{t('admin:status_labels.PROCESSING')}</SelectItem>
                  <SelectItem value="COMPLETED">{t('admin:status_labels.COMPLETED')}</SelectItem>
                  <SelectItem value="FAILED">{t('admin:status_labels.FAILED')}</SelectItem>
                  <SelectItem value="EXPIRED">{t('admin:status_labels.EXPIRED')}</SelectItem>
                  <SelectItem value="CANCELLED">{t('admin:status_labels.CANCELLED')}</SelectItem>
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
              <TableHead className="w-[80px]">{t('admin:column_id')}</TableHead>
              <TableHead>{t('admin:account_id')}</TableHead>
              <TableHead>{t('admin:symbol')}</TableHead>
              <TableHead>{t('admin:order_action')}</TableHead>
              <TableHead>{t('admin:qty')}</TableHead>
              <TableHead>{t('admin:exchange')}</TableHead>
              <TableHead className="text-right">{t('admin:actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{orderTableBody}</TableBody>
        </Table>
      </CardContent>

      {total > 0 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-muted-foreground bg-slate-50/30">
          <div className="font-medium tracking-tight">{t('admin:page_info', { page, total: totalPages })}</div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevPage}
              disabled={page === 1}
              className="h-8 rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-600 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('admin:prev')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNextPage}
              disabled={page >= totalPages}
              className="h-8 rounded-lg hover:bg-white hover:shadow-sm transition-all font-bold text-slate-800 disabled:opacity-30"
            >
              {t('admin:next')}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

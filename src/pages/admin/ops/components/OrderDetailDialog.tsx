import type { TFunction } from 'i18next';
import { AlertTriangle, Clock, RefreshCw, Zap } from 'lucide-react';
import type { AdminOrderEventItem, Order } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface OrderDetailDialogProps {
  t: TFunction;
  selectedOrder: Order | null;
  onClose: () => void;
  orderEvents?: { events: AdminOrderEventItem[] } | null;
  isLoadingEvents: boolean;
}

export function OrderDetailDialog({
  t,
  selectedOrder,
  onClose,
  orderEvents,
  isLoadingEvents,
}: OrderDetailDialogProps) {
  return (
    <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && onClose()}>
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
                <span className="opacity-60">{t('admin:column_strategy')}:</span>
                <span className="text-slate-900 font-bold">{selectedOrder?.strategy_id || t('admin:none')}</span>
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-500 shadow-sm">
                <span className="opacity-60">{t('admin:column_account')}:</span>
                <span className="text-slate-900 font-bold">{selectedOrder?.account_id}</span>
              </span>
            </DialogDescription>
          </div>
        </DialogHeader>

        {selectedOrder && (
          <ScrollArea className="flex-1 px-8 py-6">
            <div className="space-y-8 pb-8">
              <div className="grid grid-cols-2 gap-y-6 gap-x-12 bg-slate-50/80 p-6 rounded-2xl border border-slate-100 shadow-inner">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{t('admin:column_status')}</span>
                  <Badge variant={selectedOrder.status === 'COMPLETED' ? 'default' : selectedOrder.status === 'FAILED' ? 'destructive' : 'secondary'} className="w-fit px-3 py-1 text-xs font-bold shadow-sm">
                    {t(`admin:status_labels.${selectedOrder.status}`)}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{t('admin:symbol')}</span>
                  <span className="font-mono text-base font-black tracking-tight text-slate-900">{selectedOrder.symbol}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{t('admin:exchange')}</span>
                  <Badge variant="outline" className="w-fit uppercase font-mono text-xs tracking-wider border-slate-200 bg-white">
                    {selectedOrder.exchange ? t(`common:exchanges.${selectedOrder.exchange.toLowerCase()}`, { defaultValue: selectedOrder.exchange }) : t('common:exchanges.turboflow')}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{t('admin:order_action')} / {t('admin:side')}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize text-xs font-bold bg-white border-slate-200">{selectedOrder.action || '-'}</Badge>
                    <Badge variant={selectedOrder.side.toLowerCase() === 'buy' ? 'default' : 'destructive'} className="text-xs uppercase font-bold px-2">{selectedOrder.side}</Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{t('admin:qty_plan_exec')}</span>
                  <div className="font-mono text-sm tracking-tighter">
                    <span className="font-black text-slate-900">{selectedOrder.quantity}</span>
                    <span className="mx-2 text-slate-300">/</span>
                    <span className={`${selectedOrder.status === 'COMPLETED' ? 'text-green-600 font-bold' : 'text-slate-500'}`}>{selectedOrder.executed_qty || 0}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{t('admin:exec_price_label')}</span>
                  <span className="font-mono text-sm font-black text-slate-900">{selectedOrder.executed_price || '-'}</span>
                </div>

                <div className="col-span-2 pt-4 border-t border-slate-200/60 mt-2">
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('admin:external_order_id')}</span>
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
                    orderEvents?.events?.map((event: AdminOrderEventItem, idx: number) => (
                      <div key={idx} className="relative group/evt">
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
          <Button variant="ghost" className="rounded-xl font-bold text-slate-500" onClick={onClose}>
            {t('common:close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

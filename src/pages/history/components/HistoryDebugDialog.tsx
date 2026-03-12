import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Order } from '@/api';

interface HistoryDebugDialogProps {
  t: (key: string, options?: Record<string, unknown>) => string;
  debugOrder: Order | null;
  onOpenChange: () => void;
}

export function HistoryDebugDialog({ t, debugOrder, onOpenChange }: HistoryDebugDialogProps) {
  return (
    <Dialog open={!!debugOrder} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('history:actions.debug_title', { id: debugOrder?.id ?? '--' })}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-4 bg-secondary/30 rounded-lg border border-border mt-2">
          <pre className="text-xs font-mono whitespace-pre-wrap">
            {JSON.stringify(debugOrder, null, 2)}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { memo, useMemo } from 'react';
import type { TFunction } from 'i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HistoryPaginationProps {
  t: TFunction;
  showingStart: number;
  showingEnd: number;
  showingTotal: number | string;
  currentPageSize: number;
  onPageSizeChange: (value: number) => void;
  pageSizeOptions: number[];
  currentPage: number;
  onPrev: () => void;
  viewMode: 'system' | 'turboflow';
  tfPageCount: number;
  systemHasMore: boolean;
  onPageSelect: (page: number) => void;
  onNext: () => void;
}

function HistoryPaginationComponent({
  t,
  showingStart,
  showingEnd,
  showingTotal,
  currentPageSize,
  onPageSizeChange,
  pageSizeOptions,
  currentPage,
  onPrev,
  viewMode,
  tfPageCount,
  systemHasMore,
  onPageSelect,
  onNext,
}: HistoryPaginationProps) {
  const tfPages = useMemo(
    () => Array.from({ length: tfPageCount }, (_, i) => i + 1),
    [tfPageCount]
  );

  return (
    <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground">
          {t('history:pagination.showing', {
            start: showingStart,
            end: showingEnd,
            total: showingTotal,
          })}
        </p>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('history:pagination.per_page')}</span>
          <Select value={currentPageSize.toString()} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="w-[80px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size} {t('history:stats.unit_orders')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={onPrev}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          {t('history:pagination.prev')}
        </Button>

        <div className="flex items-center gap-1">
          {viewMode === 'turboflow' ? (
            tfPages.map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'ghost'}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => onPageSelect(page)}
              >
                {page}
              </Button>
            ))
          ) : (
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0" disabled>
              {currentPage}
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={viewMode === 'system' ? !systemHasMore : currentPage >= tfPageCount}
          onClick={onNext}
        >
          {t('history:pagination.next')}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

export const HistoryPagination = memo(HistoryPaginationComponent);

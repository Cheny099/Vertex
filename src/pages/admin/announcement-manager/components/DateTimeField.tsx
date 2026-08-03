import React from 'react';
import { CalendarDays, Clock3 } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { parseLocalDateTime, type DateTimeFieldProps } from '../utils';

export const DateTimeField: React.FC<DateTimeFieldProps> = ({
  value,
  onChange,
  placeholder,
  timeLabel,
  clearLabel,
  calendarLocale,
}) => {
  const current = parseLocalDateTime(value);
  const timeValue = current ? format(current, 'HH:mm') : '09:00';

  const updateDatePart = (selected: Date | undefined) => {
    if (!selected) return;
    const next = new Date(selected);
    if (current) {
      next.setHours(current.getHours(), current.getMinutes(), 0, 0);
    } else {
      next.setHours(9, 0, 0, 0);
    }
    onChange(format(next, "yyyy-MM-dd'T'HH:mm"));
  };

  const updateTimePart = (nextTime: string) => {
    // Clearing a time input fires with ''. Coercing that to 00:00 silently set the *start* of the
    // chosen day - already in the past for an end time, so the popup never displayed - and with no
    // date chosen it fabricated today into a field meant to stay empty.
    const [rawH, rawM] = nextTime.split(':');
    const h = Number(rawH);
    const m = Number(rawM);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return;

    const base = current ? new Date(current) : new Date();
    base.setHours(h, m, 0, 0);
    onChange(format(base, "yyyy-MM-dd'T'HH:mm"));
  };

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full justify-start bg-white/80 border-slate-200/70 font-medium"
          >
            <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
            {current ? (
              format(current, 'yyyy-MM-dd HH:mm')
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-3 bg-white/95 backdrop-blur-xl border border-slate-200/70 rounded-xl shadow-xl"
          align="start"
        >
          <Calendar
            locale={calendarLocale}
            mode="single"
            selected={current ?? undefined}
            onSelect={updateDatePart}
            initialFocus
          />
          <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" />
              {timeLabel}
            </div>
            <Input
              type="time"
              className="h-9 w-[120px] bg-white"
              value={timeValue}
              onChange={(e) => updateTimePart(e.target.value)}
            />
            <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => onChange('')}>
              {clearLabel}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

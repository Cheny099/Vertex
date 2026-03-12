import * as React from "react"
import { addDays, format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"
import { zhCN, enUS } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
    PopoverClose,
} from "@/components/ui/popover"
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"

interface DatePickerWithRangeProps extends React.HTMLAttributes<HTMLDivElement> {
    date: DateRange | undefined
    setDate: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({
    className,
    date,
    setDate,
}: DatePickerWithRangeProps) {
    const { t, i18n } = useTranslation(['admin', 'common']);
    const [selectionMode, setSelectionMode] = React.useState<"single" | "range">(
        date?.from && date?.to && date.from.getTime() === date.to.getTime() ? "single" : "range"
    );

    const handleSelect = (val: Date | DateRange | undefined) => {
        if (selectionMode === "single") {
            const day = val instanceof Date ? val : undefined;
            if (day) {
                setDate({ from: day, to: day });
            }
        } else {
            setDate((val && !(val instanceof Date) ? val : undefined) as DateRange | undefined);
        }
    };
    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[280px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            (date.to && date.to.getTime() !== date.from.getTime()) ? (
                                <>
                                    {format(date.from, "yyyy-MM-dd")} -{" "}
                                    {format(date.to, "yyyy-MM-dd")}
                                </>
                            ) : (
                                format(date.from, "yyyy-MM-dd")
                            )
                        ) : (
                            <span>{t('admin:pick_date_range')}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3 border-b bg-muted/20 flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-muted-foreground">{t('admin:selection_mode')}</span>
                        <Tabs
                            value={selectionMode}
                            onValueChange={(v) => {
                                setSelectionMode(v as "single" | "range");
                                if (v === "single" && date?.from) {
                                    setDate({ from: date.from, to: date.from });
                                }
                            }}
                            className="w-auto"
                        >
                            <TabsList className="h-8 p-1 bg-background/50 border">
                                <TabsTrigger value="single" className="text-xs px-2 h-6">{t('admin:date_mode_single')}</TabsTrigger>
                                <TabsTrigger value="range" className="text-xs px-2 h-6">{t('admin:date_mode_range')}</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                    {selectionMode === "single" ? (
                        <Calendar
                            key="single"
                            initialFocus
                            mode="single"
                            defaultMonth={date?.from}
                            selected={date?.from}
                            onSelect={(day) => handleSelect(day)}
                            numberOfMonths={1}
                            locale={i18n.language === 'zh' ? zhCN : enUS}
                        />
                    ) : (
                        <Calendar
                            key="range"
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={(range) => handleSelect(range)}
                            numberOfMonths={2}
                            locale={i18n.language === 'zh' ? zhCN : enUS}
                        />
                    )}
                    <div className="flex items-center justify-end gap-2 p-3 border-t bg-muted/20">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDate(undefined)}
                            className="text-xs h-8"
                        >
                            {t('common:cancel')}
                        </Button>
                        <PopoverClose asChild>
                            <Button
                                variant="default"
                                size="sm"
                                className="text-xs h-8"
                            >
                                {t('common:ok')}
                            </Button>
                        </PopoverClose>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}

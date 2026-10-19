import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useId } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addDays, isIsoDate } from '@/lib/datetime'

type DayNavigationProps = {
  date: string
  today: string
  onChange: (date: string) => void
}

/** F4-07: step a day at a time or jump to any date. */
export function DayNavigation({ date, today, onChange }: DayNavigationProps) {
  const inputId = useId()

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div role="group" aria-label="Change day" className="flex gap-1">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous day"
          onClick={() => onChange(addDays(date, -1))}
        >
          <ChevronLeft aria-hidden />
        </Button>
        <Button variant="outline" onClick={() => onChange(today)} disabled={date === today}>
          Today
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next day"
          onClick={() => onChange(addDays(date, 1))}
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={inputId}>Go to date</Label>
        <Input
          id={inputId}
          type="date"
          value={date}
          onChange={(event) => {
            if (isIsoDate(event.target.value)) onChange(event.target.value)
          }}
          className="w-auto"
        />
      </div>
    </div>
  )
}

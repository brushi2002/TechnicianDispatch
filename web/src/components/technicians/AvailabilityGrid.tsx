// 7-column grid showing a technician's weekly availability windows.
import { useTechnicianAvailability } from '@/hooks/useTechnicianAvailability'
import { DAY_LABELS } from '@/types/api'
import { formatTime } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  technicianId: string
}

export function AvailabilityGrid({ technicianId }: Props) {
  const { data, isLoading } = useTechnicianAvailability(technicianId)

  const days = [1, 2, 3, 4, 5]
  const byDay = Object.fromEntries((data ?? []).map(a => [a.DayofWeek, a]))

  if (isLoading) {
    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map(d => <Skeleton key={d} className="h-16" />)}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map(day => {
        const slot = byDay[day]
        return (
          <div
            key={day}
            className="rounded-md border p-2 text-center text-sm"
          >
            <div className="font-medium text-muted-foreground mb-1">{DAY_LABELS[day]}</div>
            {slot?.StartTime && slot?.EndTime ? (
              <div className="text-xs">
                {formatTime(slot.StartTime)}<br />—<br />{formatTime(slot.EndTime)}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">—</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

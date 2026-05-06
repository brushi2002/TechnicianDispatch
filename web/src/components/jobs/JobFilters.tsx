// Search input and sort controls for the jobs table.
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type SortKey = 'Name' | 'StartTime' | 'DurationInHours'
export type SortDir = 'asc' | 'desc'

interface Props {
  search: string
  onSearchChange: (v: string) => void
  sortKey: SortKey
  sortDir: SortDir
  onSortChange: (key: SortKey, dir: SortDir) => void
}

export function JobFilters({ search, onSearchChange, sortKey, sortDir, onSortChange }: Props) {
  const handleSortKey = (key: SortKey) => onSortChange(key, sortDir)
  const handleSortDir = (dir: SortDir) => onSortChange(sortKey, dir)

  return (
    <div className="flex items-center gap-3 px-6 py-3 border-b">
      <Input
        placeholder="Search jobs..."
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        className="max-w-xs"
      />
      <Select value={sortKey} onValueChange={v => handleSortKey(v as SortKey)}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Name">Name</SelectItem>
          <SelectItem value="StartTime">Start Time</SelectItem>
          <SelectItem value="DurationInHours">Duration</SelectItem>
        </SelectContent>
      </Select>
      <Select value={sortDir} onValueChange={v => handleSortDir(v as SortDir)}>
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="asc">Asc</SelectItem>
          <SelectItem value="desc">Desc</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

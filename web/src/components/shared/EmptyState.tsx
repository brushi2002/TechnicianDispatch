// Shown when a list query returns zero results.
interface Props {
  message?: string
}

export function EmptyState({ message = 'No results found.' }: Props) {
  return (
    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
      {message}
    </div>
  )
}

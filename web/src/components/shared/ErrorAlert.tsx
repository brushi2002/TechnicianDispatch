// Displays API error messages returned from failed mutations or queries.
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ApiError } from '@/lib/api-client'

interface Props {
  error: unknown
}

export function ErrorAlert({ error }: Props) {
  if (!error) return null
  const message = error instanceof ApiError ? error.detail : 'An unexpected error occurred.'
  return (
    <Alert variant="destructive">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

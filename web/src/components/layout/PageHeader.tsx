// Reusable page title bar with an optional action slot (e.g. a "New" button).
interface Props {
  title: string
  action?: React.ReactNode
}

export function PageHeader({ title, action }: Props) {
  return (
    <div className="flex items-center justify-between px-6 py-5 border-b">
      <h1 className="text-xl font-semibold">{title}</h1>
      {action && <div>{action}</div>}
    </div>
  )
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  MA_LEGISLATURE: { label: 'MA Legislature', color: 'text-blue-600' },
  CONGRESS_GOV: { label: 'Congress.gov', color: 'text-indigo-600' },
  CSV_IMPORT: { label: 'CSV Import', color: 'text-green-600' },
  JSON_IMPORT: { label: 'JSON Import', color: 'text-green-600' },
  MANUAL: { label: 'Manual', color: 'text-slate-500' },
  SEED: { label: 'Sample', color: 'text-amber-600' },
}

interface SourceLabelProps {
  dataSource: string
}

export function SourceLabel({ dataSource }: SourceLabelProps) {
  const config = SOURCE_LABELS[dataSource] ?? { label: dataSource, color: 'text-slate-500' }
  return (
    <span className={`text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}

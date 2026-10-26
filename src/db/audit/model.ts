export type ObjectKind =
  | 'role'
  | 'table'
  | 'column'
  | 'function'
  | 'trigger'
  | 'constraint'
  | 'index'
  | 'policy'
  | 'sequence'
export interface SchemaObject {
  kind: ObjectKind
  key: string
  shape: Record<string, unknown>
}
export interface Inventory {
  objects: SchemaObject[]
  fingerprint: string
  serverVersion: string
}
export interface LedgerEntry {
  name: string
  checksum: string
}
export interface Snapshot extends Inventory {
  ledger: LedgerEntry[] | null
}
export interface ExpectedObject extends SchemaObject {
  introducedBy: string
  changedBy: string
  fieldMigrations?: Record<string, string>
}
export interface Contract {
  serverVersion?: string
  baseline: SchemaObject[]
  objects: ExpectedObject[]
}
export interface Finding {
  kind: ObjectKind
  key: string
  status: 'missing' | 'different' | 'extra'
  changedFields: string[]
  fieldMigrations?: Record<string, string>
  migration: string | null
}
export interface AuditReport {
  version: 1
  optionalTablesAbsent: string[]
  serverVersions: { expected: string | null; actual: string }
  generatedAt: string
  fingerprint: string
  ledger: LedgerEntry[] | null
  findings: Finding[]
  blockers: string[]
  pending: string[]
  totals: {
    expected: number
    actual: number
    matching: number
    missing: number
    different: number
    extra: number
  }
}
export const objectId = (item: Pick<SchemaObject, 'kind' | 'key'>) => `${item.kind}:${item.key}`
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value !== null && typeof value === 'object')
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(',')}}`
  return JSON.stringify(value) ?? 'undefined'
}

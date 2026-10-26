import { Migration } from '../migrations'
import {
  AuditReport,
  canonical,
  Contract,
  Finding,
  objectId,
  SchemaObject,
  Snapshot,
} from './model'

const fields = (expected: SchemaObject, actual: SchemaObject) =>
  [...new Set([...Object.keys(expected.shape), ...Object.keys(actual.shape)])]
    .filter(key => canonical(expected.shape[key]) !== canonical(actual.shape[key]))
    .sort()

export function compareSchema(
  snapshot: Snapshot,
  contract: Contract,
  plan: Migration[]
): AuditReport {
  const optionalTablesAbsent: string[] = []
  // Current PvP uses practice_questions. 043 explicitly treats pvp_questions as optional legacy.
  if (
    !snapshot.objects.some(item => item.kind === 'table' && item.key === 'public.pvp_questions')
  ) {
    optionalTablesAbsent.push('public.pvp_questions')
    const required = (item: SchemaObject) =>
      item.key !== 'public.pvp_questions' &&
      !item.key.startsWith('public.pvp_questions.') &&
      item.shape.table !== 'public.pvp_questions'
    contract = {
      ...contract,
      baseline: contract.baseline.filter(required),
      objects: contract.objects.filter(required),
    }
  }
  const actual = new Map(snapshot.objects.map(item => [objectId(item), item]))
  const expected = new Map(contract.objects.map(item => [objectId(item), item]))
  const findings: Finding[] = []
  let matching = 0
  for (const item of contract.objects) {
    const found = actual.get(objectId(item))
    const changedFields = found ? fields(item, found) : []
    if (!found || changedFields.length)
      findings.push({
        kind: item.kind,
        key: item.key,
        status: found ? 'different' : 'missing',
        changedFields,
        fieldMigrations: Object.fromEntries(
          changedFields.map(key => [key, item.fieldMigrations?.[key] ?? item.changedBy])
        ),
        migration: item.changedBy,
      })
    else matching++
  }
  for (const item of snapshot.objects)
    if (!expected.has(objectId(item)))
      findings.push({
        kind: item.kind,
        key: item.key,
        status: 'extra',
        changedFields: [],
        migration: null,
      })

  const blockers: string[] = []
  const applied = new Map((snapshot.ledger ?? []).map(item => [item.name, item.checksum]))
  const known = new Map(plan.map(item => [item.name, item]))
  for (const [name, checksum] of applied) {
    if (!known.has(name)) blockers.push(`Ledger contains an unknown migration: ${name}`)
    else if (known.get(name)!.checksum !== checksum)
      blockers.push(`Ledger checksum differs: ${name}`)
  }
  let pendingSeen = false
  for (const migration of plan) {
    if (!applied.has(migration.name)) pendingSeen = true
    else if (pendingSeen) blockers.push(`Ledger is not an ordered prefix: ${migration.name}`)
  }
  const pending = plan.filter(item => !applied.has(item.name)).map(item => item.name)
  // Forward SQL cannot reconstruct a missing or structurally incompatible legacy baseline.
  for (const item of contract.baseline) {
    const found = actual.get(objectId(item))
    const target = expected.get(objectId(item))
    if (!target) continue
    if (['role', 'table', 'column'].includes(item.kind)) {
      if (!found) blockers.push(`Required baseline object is missing: ${objectId(item)}`)
      else {
        const structural =
          item.kind === 'column'
            ? ['type', 'not_null', 'identity', 'generated']
            : item.kind === 'table'
              ? ['kind']
              : ['bypass_rls']
        if (structural.some(key => canonical(item.shape[key]) !== canonical(found.shape[key])))
          blockers.push(`Baseline structure needs review: ${objectId(item)}`)
      }
    }
    if (item.kind === 'constraint' && target.changedBy.startsWith('baseline/')) {
      const table = item.key.slice(0, item.key.lastIndexOf('.'))
      const equivalent = snapshot.objects.some(
        candidate =>
          candidate.kind === 'constraint' &&
          candidate.key.slice(0, candidate.key.lastIndexOf('.')) === table &&
          canonical(candidate.shape) === canonical(item.shape)
      )
      if (!equivalent) blockers.push(`Required baseline constraint needs review: ${item.key}`)
    }
  }
  // 050-052 deliberately use CREATE/ADD without IF NOT EXISTS; never replay a partial upgrade.
  for (const item of contract.objects)
    if (
      pending.includes(item.introducedBy) &&
      /\/05[012]-/.test(item.introducedBy) &&
      actual.has(objectId(item))
    )
      blockers.push(`Untracked/partial forward object must be reconciled: ${objectId(item)}`)
  if (!pending.length && findings.some(item => item.status !== 'extra'))
    blockers.push(
      'Ledger is current but schema differs; create a reviewed new forward migration, never replay history'
    )
  return {
    version: 1,
    optionalTablesAbsent,
    serverVersions: { expected: contract.serverVersion ?? null, actual: snapshot.serverVersion },
    generatedAt: new Date().toISOString(),
    fingerprint: snapshot.fingerprint,
    ledger: snapshot.ledger,
    findings,
    blockers: [...new Set(blockers)],
    pending,
    totals: {
      expected: contract.objects.length,
      actual: snapshot.objects.length,
      matching,
      missing: findings.filter(item => item.status === 'missing').length,
      different: findings.filter(item => item.status === 'different').length,
      extra: findings.filter(item => item.status === 'extra').length,
    },
  }
}

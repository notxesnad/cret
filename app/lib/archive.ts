export function isArchived(record: { archived?: boolean } | null | undefined) {
  return record?.archived === true
}

export function isActive(record: { archived?: boolean } | null | undefined) {
  return !isArchived(record)
}

export function activeOnly<T extends { archived?: boolean }>(records: T[] | null | undefined) {
  return (records || []).filter(isActive)
}

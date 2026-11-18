import { keyFieldOf, type Store, type Table, type TableName, type Tables } from "./store"

type Rows = Map<string, unknown>

/** A Store held in memory, for core's tests and anywhere a throwaway database is enough. */
export function memoryStore(): Store {
  const tables = new Map<TableName, Rows>()
  let depth = 0

  const rowsOf = (name: TableName): Rows => {
    let rows = tables.get(name)
    if (!rows) tables.set(name, (rows = new Map()))
    return rows
  }
  const copy = <T>(row: T): T => structuredClone(row)

  function tableOf<K extends TableName>(name: K): Table<Tables[K]> {
    type T = Tables[K]
    const key = keyFieldOf(name)
    const rows = () => rowsOf(name)
    const keyOf = (row: T) => String((row as unknown as Record<string, unknown>)[key])
    return {
      get: async (id) => (rows().has(id) ? copy(rows().get(id) as T) : undefined),
      bulkGet: async (ids) => ids.map((id) => (rows().has(id) ? copy(rows().get(id) as T) : undefined)),
      all: async () => [...rows().values()].map((row) => copy(row as T)),
      where: async (field, value) => [...rows().values()].filter((row) => (row as T)[field] === value).map((row) => copy(row as T)),
      count: async () => rows().size,
      put: async (row) => void rows().set(keyOf(row), copy(row)),
      bulkPut: async (list) => list.forEach((row) => rows().set(keyOf(row), copy(row))),
      update: async (id, changes) => {
        const existing = rows().get(id)
        if (existing) rows().set(id, { ...(existing as object), ...copy(changes) })
      },
      delete: async (id) => void rows().delete(id),
      bulkDelete: async (ids) => ids.forEach((id) => rows().delete(id)),
      clear: async () => rows().clear(),
    }
  }

  return {
    table: tableOf,
    async transaction(_tables, work) {
      const snapshot = depth === 0 ? new Map([...tables].map(([name, rows]) => [name, new Map([...rows].map(([id, row]) => [id, copy(row)]))])) : null
      depth++
      try {
        return await work()
      } catch (error) {
        if (snapshot) {
          tables.clear()
          snapshot.forEach((rows, name) => tables.set(name, rows))
        }
        throw error
      } finally {
        depth--
      }
    },
  }
}

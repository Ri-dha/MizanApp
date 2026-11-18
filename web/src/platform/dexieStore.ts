import type { Dexie, IndexableType, Table as DexieTable } from "dexie"
import { ALL_TABLES, type Store, type Table, type TableName, type Tables } from "@mizan/core/store/store"

/** Core's Store over the web's Dexie database; reads stay Dexie calls, so live queries keep tracking them. */
export function dexieStore(db: Dexie): Store {
  function tableOf<K extends TableName>(name: K): Table<Tables[K]> {
    type T = Tables[K]
    const t = db.table(name) as DexieTable<T, string>
    const indexed = (field: string) => t.schema.primKey.name === field || field in t.schema.idxByName
    return {
      get: (key) => t.get(key),
      bulkGet: (keys) => t.bulkGet(keys),
      all: () => t.toArray(),
      where: (field, value) =>
        value !== null && value !== undefined && indexed(field)
          ? t.where(field).equals(value as IndexableType).toArray()
          : t.filter((row) => row[field] === value).toArray(),
      count: () => t.count(),
      put: async (row) => void (await t.put(row)),
      bulkPut: async (rows) => void (await t.bulkPut(rows)),
      update: async (key, changes) => void (await t.update(key, changes as never)),
      delete: (key) => t.delete(key),
      bulkDelete: (keys) => t.bulkDelete(keys),
      clear: () => t.clear(),
    }
  }
  return {
    table: tableOf,
    transaction: (tables, work) => db.transaction("rw", tables === ALL_TABLES ? db.tables : tables.map((name) => db.table(name)), work),
  }
}

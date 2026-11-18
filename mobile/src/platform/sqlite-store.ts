import type { SQLiteDatabase } from "expo-sqlite"

import { ALL_TABLES, keyFieldOf, type Store, type Table, type TableName, type Tables } from "@mizan/core/store/store"
import { decodeRow, encodeRow } from "./json-bytes"

type Row = { data: string }

const changeListeners = new Set<(table: TableName) => void>()

/** Fires after each write so screens can re-read; the mobile stand-in for Dexie's live queries. */
export function onStoreChange(listener: (table: TableName) => void): () => void {
  changeListeners.add(listener)
  return () => changeListeners.delete(listener)
}

const changed = (table: TableName) => changeListeners.forEach((listener) => listener(table))

const quoted = (table: TableName) => `"${table}"`

export async function createTables(db: SQLiteDatabase, tables: readonly TableName[]) {
  for (const table of tables) {
    await db.execAsync(`CREATE TABLE IF NOT EXISTS ${quoted(table)} (key TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL)`)
  }
}

/**
 * ADR mobile-4. A transaction may nest; only the outermost one talks to SQLite. React Native
 * has no async context, so a query started elsewhere while one is open joins it, as the
 * expo-sqlite docs say of withTransactionAsync.
 */
export function sqliteStore(db: SQLiteDatabase): Store {
  let depth = 0

  function tableOf<K extends TableName>(name: K): Table<Tables[K]> {
    type T = Tables[K]
    const keyField = keyFieldOf(name)
    const keyOf = (row: T) => String((row as unknown as Record<string, unknown>)[keyField])
    const read = (rows: Row[]) => rows.map((row) => decodeRow<T>(row.data))
    const upsert = (row: T) => db.runAsync(`INSERT OR REPLACE INTO ${quoted(name)} (key, data) VALUES (?, ?)`, keyOf(row), encodeRow(row))
    const table: Table<T> = {
      get: async (key) => {
        const row = await db.getFirstAsync<Row>(`SELECT data FROM ${quoted(name)} WHERE key = ?`, key)
        return row ? decodeRow<T>(row.data) : undefined
      },
      bulkGet: async (keys) => Promise.all(keys.map((key) => table.get(key))),
      all: async () => read(await db.getAllAsync<Row>(`SELECT data FROM ${quoted(name)}`)),
      where: async (field, value) => {
        const bound = typeof value === "boolean" ? Number(value) : (value ?? null)
        return read(await db.getAllAsync<Row>(`SELECT data FROM ${quoted(name)} WHERE json_extract(data, ?) IS ?`, `$.${field}`, bound as string | number | null))
      },
      count: async () => (await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${quoted(name)}`))?.n ?? 0,
      put: async (row) => {
        await upsert(row)
        changed(name)
      },
      bulkPut: async (rows) => {
        for (const row of rows) await upsert(row)
        changed(name)
      },
      update: async (key, changes) => {
        const existing = await table.get(key)
        if (!existing) return
        await upsert({ ...existing, ...changes })
        changed(name)
      },
      delete: async (key) => {
        await db.runAsync(`DELETE FROM ${quoted(name)} WHERE key = ?`, key)
        changed(name)
      },
      bulkDelete: async (keys) => {
        for (const key of keys) await db.runAsync(`DELETE FROM ${quoted(name)} WHERE key = ?`, key)
        changed(name)
      },
      clear: async () => {
        await db.runAsync(`DELETE FROM ${quoted(name)}`)
        changed(name)
      },
    }
    return table
  }

  return {
    table: tableOf,
    async transaction(_tables, work) {
      if (depth > 0) {
        depth++
        try {
          return await work()
        } finally {
          depth--
        }
      }
      let result: Awaited<ReturnType<typeof work>> | undefined
      depth++
      try {
        await db.withTransactionAsync(async () => {
          result = await work()
        })
      } finally {
        depth--
      }
      return result as Awaited<ReturnType<typeof work>>
    },
  }
}

export { ALL_TABLES }

import initSqlJs from 'sql.js'
import sqlWasm from 'sql.js/dist/sql-wasm.wasm?url'

const DB_FILE = 'carrinho.db'

export async function initDB() {
  const SQL = await initSqlJs({ locateFile: () => sqlWasm })

  const opfsRoot = await navigator.storage.getDirectory()
  let dbData = null
  try {
    const fileHandle = await opfsRoot.getFileHandle(DB_FILE)
    const file = await fileHandle.getFile()
    dbData = new Uint8Array(await file.arrayBuffer())
  } catch {
    // Banco ainda não existe — será criado fresh
  }

  const db = dbData ? new SQL.Database(dbData) : new SQL.Database()

  const schemaRes = await fetch('/schema.sql')
  const schema = await schemaRes.text()
  db.run(schema)

  const persist = async () => {
    const data = db.export()
    const fh = await opfsRoot.getFileHandle(DB_FILE, { create: true })
    const writable = await fh.createWritable()
    await writable.write(data)
    await writable.close()
  }

  return { db, persist }
}

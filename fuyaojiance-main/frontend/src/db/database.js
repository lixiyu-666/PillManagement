import initSqlJs from 'sql.js'

let db = null
let SQL = null

const DB_KEY = 'pill_management_db'

async function initDatabase() {
  if (db) return db

  // 使用 asm.js 版本的 SQL.js，不需要 wasm
  const initSqlJsAsm = (await import('sql.js/dist/sql-asm.js')).default
  SQL = await initSqlJsAsm()

  const savedDb = localStorage.getItem(DB_KEY)
  if (savedDb) {
    const data = Uint8Array.from(atob(savedDb), c => c.charCodeAt(0))
    db = new SQL.Database(data)
  } else {
    db = new SQL.Database()
    initSchema()
    insertDefaultData()
  }

  return db
}

function initSchema() {
  db.run(`
    CREATE TABLE medicine (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      specification TEXT,
      stock_quantity INTEGER DEFAULT 0,
      per_box_quantity INTEGER DEFAULT 0,
      purchase_date TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `)

  db.run(`
    CREATE TABLE check_item (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      unit TEXT,
      reference_min TEXT,
      reference_max TEXT,
      is_preset INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `)

  db.run(`
    CREATE TABLE medication_schedule (
      id INTEGER PRIMARY KEY,
      medicine_id INTEGER,
      schedule_type TEXT NOT NULL,
      times_config TEXT,
      dosage_config TEXT,
      interval_days INTEGER DEFAULT 1,
      week_days TEXT,
      start_date TEXT,
      end_date TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      name TEXT,
      schedule_time TEXT
    )
  `)

  db.run(`
    CREATE TABLE medication_record (
      id INTEGER PRIMARY KEY,
      schedule_id INTEGER,
      scheduled_time TEXT NOT NULL,
      actual_time TEXT,
      status TEXT DEFAULT 'PENDING',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `)

  db.run(`
    CREATE TABLE check_record (
      id INTEGER PRIMARY KEY,
      check_item_id INTEGER NOT NULL,
      check_date TEXT NOT NULL,
      value TEXT NOT NULL,
      report_image TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `)

  db.run(`
    CREATE TABLE schedule_medicine (
      id INTEGER PRIMARY KEY,
      schedule_id INTEGER NOT NULL,
      medicine_id INTEGER NOT NULL,
      dosage TEXT NOT NULL DEFAULT '1.0',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      UNIQUE(schedule_id, medicine_id)
    )
  `)
}

function insertDefaultData() {
  const result = db.exec("SELECT COUNT(*) as count FROM check_item WHERE is_preset = 1")
  if (result.length === 0 || result[0].values[0][0] === 0) {
    const presetItems = [
      ['肌酐', 'μmol/L', '44.00', '133.00', 1, 1],
      ['eGFR', 'mL/min/1.73m²', '90.00', '120.00', 1, 2],
      ['他克莫司浓度', 'ng/mL', '5.00', '8.00', 1, 3],
      ['尿蛋白', 'mg/24h', '0.00', '150.00', 1, 4],
      ['白细胞', '×10⁹/L', '4.00', '10.00', 1, 5],
      ['血红蛋白', 'g/L', '120.00', '160.00', 1, 6],
      ['血小板', '×10⁹/L', '100.00', '300.00', 1, 7],
      ['尿酸', 'μmol/L', '150.00', '420.00', 1, 8],
      ['空腹血糖', 'mmol/L', '3.90', '6.10', 1, 9],
      ['糖化血红蛋白', '%', '4.00', '6.00', 1, 10]
    ]

    const stmt = db.prepare(
      "INSERT INTO check_item (name, unit, reference_min, reference_max, is_preset, sort_order) VALUES (?, ?, ?, ?, ?, ?)"
    )
    for (const item of presetItems) {
      stmt.run(item)
    }
    stmt.free()
    saveDb()
  }
}

export function saveDb() {
  if (!db) return
  const data = db.export()
  const base64 = btoa(String.fromCharCode.apply(null, data))
  localStorage.setItem(DB_KEY, base64)
}

export function getDb() {
  return db
}

export function run(sql, params = []) {
  try {
    db.run(sql, params)
    saveDb()
    return { changes: db.getRowsModified() }
  } catch (error) {
    console.error('SQL Error:', error)
    throw error
  }
}

export function exec(sql) {
  try {
    const result = db.exec(sql)
    return result
  } catch (error) {
    console.error('SQL Error:', error)
    throw error
  }
}

export function query(sql, params = []) {
  try {
    const stmt = db.prepare(sql)
    if (params.length > 0) {
      stmt.bind(params)
    }
    const results = []
    while (stmt.step()) {
      const row = stmt.getAsObject()
      results.push(row)
    }
    stmt.free()
    return results
  } catch (error) {
    console.error('SQL Error:', error)
    throw error
  }
}

export function queryOne(sql, params = []) {
  const results = query(sql, params)
  return results.length > 0 ? results[0] : null
}

export function getLastInsertRowId() {
  const result = db.exec("SELECT last_insert_rowid() as id")
  return result[0].values[0][0]
}

export default initDatabase

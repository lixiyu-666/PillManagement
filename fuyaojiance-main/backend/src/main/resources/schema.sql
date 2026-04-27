-- ----------------------------
-- SQLite 数据库初始化脚本
-- 与 MyBatis-Plus 实体类兼容
-- ----------------------------

-- ----------------------------
-- 1. 药品表
-- ----------------------------
DROP TABLE IF EXISTS medicine;
CREATE TABLE medicine (
                          id INTEGER PRIMARY KEY AUTOINCREMENT,
                          name TEXT NOT NULL,
                          specification TEXT,
                          stock_quantity INTEGER DEFAULT 0,
                          per_box_quantity INTEGER DEFAULT 0,
                          purchase_date TEXT,
                          created_at TEXT DEFAULT (datetime('now','localtime')),
                          updated_at TEXT DEFAULT (datetime('now','localtime'))
);

-- ----------------------------
-- 2. 检查项目表
-- ----------------------------
DROP TABLE IF EXISTS check_item;
CREATE TABLE check_item (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            name TEXT NOT NULL,
                            unit TEXT,
                            reference_min TEXT,
                            reference_max TEXT,
                            is_preset INTEGER DEFAULT 0,
                            sort_order INTEGER DEFAULT 0,
                            created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- ----------------------------
-- 3. 服药规律表
-- ----------------------------
DROP TABLE IF EXISTS medication_schedule;
CREATE TABLE medication_schedule (
                                     id INTEGER PRIMARY KEY AUTOINCREMENT,
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
);

-- ----------------------------
-- 4. 服药记录表
-- ----------------------------
DROP TABLE IF EXISTS medication_record;
CREATE TABLE medication_record (
                                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                                   schedule_id INTEGER,
                                   scheduled_time TEXT NOT NULL,
                                   actual_time TEXT,
                                   status TEXT DEFAULT 'PENDING',
                                   created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- ----------------------------
-- 5. 检查记录表
-- ----------------------------
DROP TABLE IF EXISTS check_record;
CREATE TABLE check_record (
                              id INTEGER PRIMARY KEY AUTOINCREMENT,
                              check_item_id INTEGER NOT NULL,
                              check_date TEXT NOT NULL,
                              value TEXT NOT NULL,
                              report_image TEXT,
                              created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- ----------------------------
-- 6. 计划药品关联表
-- ----------------------------
DROP TABLE IF EXISTS schedule_medicine;
CREATE TABLE schedule_medicine (
                                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                                   schedule_id INTEGER NOT NULL,
                                   medicine_id INTEGER NOT NULL,
                                   dosage TEXT NOT NULL DEFAULT '1.0',
                                   created_at TEXT DEFAULT (datetime('now','localtime')),
                                   UNIQUE(schedule_id, medicine_id)
);

-- ----------------------------
-- 插入预设检查项目数据
-- ----------------------------
INSERT INTO check_item (name, unit, reference_min, reference_max, is_preset, sort_order) VALUES
                                                                                             ('肌酐', 'μmol/L', '44.00', '133.00', 1, 1),
                                                                                             ('eGFR', 'mL/min/1.73m²', '90.00', '120.00', 1, 2),
                                                                                             ('他克莫司浓度', 'ng/mL', '5.00', '8.00', 1, 3),
                                                                                             ('尿蛋白', 'mg/24h', '0.00', '150.00', 1, 4),
                                                                                             ('白细胞', '×10⁹/L', '4.00', '10.00', 1, 5),
                                                                                             ('血红蛋白', 'g/L', '120.00', '160.00', 1, 6),
                                                                                             ('血小板', '×10⁹/L', '100.00', '300.00', 1, 7),
                                                                                             ('尿酸', 'μmol/L', '150.00', '420.00', 1, 8),
                                                                                             ('空腹血糖', 'mmol/L', '3.90', '6.10', 1, 9),
                                                                                             ('糖化血红蛋白', '%', '4.00', '6.00', 1, 10);

-- ----------------------------
-- SQLite 触发器：自动更新 updated_at
-- ----------------------------
DROP TRIGGER IF EXISTS medicine_updated_at;
CREATE TRIGGER medicine_updated_at
    AFTER UPDATE ON medicine
BEGIN
    UPDATE medicine SET updated_at = datetime('now','localtime') WHERE id = NEW.id;
END;
